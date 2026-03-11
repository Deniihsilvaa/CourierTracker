import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Centralize environment variables
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || '',
};

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

// Robust Storage adapter using Expo SecureStore
const SecureStorageAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Initialize Supabase Client with persistence but NO auto-refresh to maintain stability in Expo Go
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: false,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper for views in visualization schema (Like trip_performance and session_route)
export const visualization = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  db: {
    schema: 'visualization',
  },
  auth: {
    persistSession: false,
  }
});
