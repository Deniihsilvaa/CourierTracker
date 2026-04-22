import axios, { AxiosRequestConfig } from "axios";
import { authStorage } from "../security/authStorage";
import { initDb } from "./sqlite";
interface RetryAxiosRequest extends AxiosRequestConfig {
  _retry?: boolean;
}

const API_TOKEN_KEY = "auth_token";
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/v1/login",
    SIGNUP: "/auth/v1/signup",
    GOOGLE: "/auth/v1/google",
    REFRESH: "/auth/v1/refresh",
    PASSWORD_RESET: "/auth/v1/password-reset",
    LOGOUT: "/auth/v1/logout",
    PROFILE: "/auth/v1/profile",
  },
  SESSIONS: {
    OPEN: "/sessions/v1/open",
    CLOSE: (id: string) => `/sessions/v1/close/${id}`,
    UPDATE: (id: string) => `/sessions/v1/update/${id}`,
    USER: (userId: string) => `/sessions/v1/user/${userId}`,
    DETAIL: (id: string) => `/sessions/v1/${id}`,
    DELETE: (id: string) => `/sessions/v1/${id}`,
    LAST_ODOMETER: "/sessions/v1/last-odometer",
  },
  INCOMES: {
    BASE: "/incomes/v1/",
    BY_ID: (id: string) => `/incomes/v1/${id}`,
  },
  EXPENSES: {
    BASE: "/expenses/v1/",
    BY_ID: (id: string) => `/expenses/v1/${id}`,
  },
  FUELS: {
    BASE: "/fuels/v1/",
    BY_ID: (id: string) => `/fuels/v1/${id}`,
  },
  CATEGORIES: {
    BASE: "/categories/v1/",
  },
  ANALYTICS: {
    SUMMARY: "/analytics/v1/summary",
    CHARTS: "/analytics/v1/charts",
  },
  CLIENTS: {
    list: "/clients/v1/",
  },
};

const AUTH_PUBLIC_ROUTES = [
  API_ROUTES.AUTH.LOGIN,
  API_ROUTES.AUTH.SIGNUP,
  API_ROUTES.AUTH.GOOGLE,
  API_ROUTES.AUTH.PASSWORD_RESET,
];
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const originalRequest = error.config as RetryAxiosRequest;

      try {
        console.warn("[API] Access token expired. Refreshing...");

        const newToken = await refreshToken();
        const requestUrl = originalRequest?.url ?? "";

        const isPublicAuthRoute = AUTH_PUBLIC_ROUTES.some((route) =>
          requestUrl.startsWith(route),
        );

        if (isPublicAuthRoute) {
          return Promise.reject(error);
        }
        originalRequest.headers = originalRequest.headers ?? {};

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
  },
);
export const setAuthToken = async (
  token: string | null,
  refreshToken?: string,
) => {
  if (token) {
    await authStorage.setToken(token, refreshToken);
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

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await api.post(API_ROUTES.AUTH.REFRESH, {
        refresh_token: refreshToken,
      });

      // Fix: API response is { data: { session: { ... } } }
      const session = response.data?.data?.session;

      if (!session || !session.access_token) {
        console.error("[API] Invalid refresh response:", response.data);
        throw new Error("Invalid refresh response structure");
      }

      await authStorage.setToken(session.access_token, session.refresh_token);
      return session.access_token;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
