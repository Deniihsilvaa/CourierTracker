import axios from "axios";
import * as SecureStore from 'expo-secure-store';

const API_TOKEN_KEY = 'auth_token';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(API_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const setAuthToken = async (token: string | null) => {
  if (token) {
    await SecureStore.setItemAsync(API_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(API_TOKEN_KEY);
  }
};

export const getAuthToken = async () => {
  return await SecureStore.getItemAsync(API_TOKEN_KEY);
};
