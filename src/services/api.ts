import axios, { AxiosRequestConfig } from "axios";
import { authStorage } from "../security/authStorage";
import { initDb } from './sqlite';
interface RetryAxiosRequest extends AxiosRequestConfig {
  _retry?: boolean
}

const API_TOKEN_KEY = 'auth_token';
const AUTH_PUBLIC_ROUTES = [
  '/auth/v1/login',
  '/auth/v1/signup',
  '/auth/v1/google',
  '/auth/v1/password-reset',
];
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {

    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      const originalRequest = error.config as RetryAxiosRequest

      try {

        console.warn("[API] Access token expired. Refreshing...");

        const newToken = await refreshToken();
        const requestUrl = originalRequest?.url ?? ''

        const isPublicAuthRoute =
          AUTH_PUBLIC_ROUTES.some(route => requestUrl.startsWith(route))

        if (isPublicAuthRoute) {
          return Promise.reject(error)
        }
        originalRequest.headers = originalRequest.headers ?? {}

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);

      } catch (refreshError) {

        console.warn("[API] Refresh failed. Logging out.");

        await authStorage.clearToken();
        await initDb(true);

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export const setAuthToken = async (token: string | null) => {
  if (token) {
    await authStorage.setToken(token);
  } else {
    await authStorage.clearToken();
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  const token = await authStorage.getToken();
  try {
    return token;
  } catch (error) {
    console.warn("[Auth] SecureStore token corrupted. Clearing token.", error);

    await authStorage.clearToken();

    return null;
  }
};

export const refreshToken = async () => {

  const refreshToken = await authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token not found");
  }
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  isRefreshing = true
  const response = await api.post(
    `/auth/v1/refresh`,
    { refreshToken }
  );
  const { access_token, refresh_token } = response.data
  await authStorage.setToken(access_token, refresh_token);
  return access_token;
};

