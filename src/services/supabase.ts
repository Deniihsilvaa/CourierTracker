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

const CHUNK_SIZE = 1900; // conservador para garantir margem segura

// Adaptador de armazenamento com suporte a chunking para valores maiores que 2048 bytes
const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    // Tenta ler o dado direto primeiro
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) return value;

    // Se não encontrou, tenta remontar dos chunks
    const chunks: string[] = [];
    let i = 0;
    while (true) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (chunk === null) break;
      chunks.push(chunk);
      i++;
    }

    return chunks.length > 0 ? chunks.join('') : null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      // Valor pequeno o suficiente: salva direto
      await SecureStore.setItemAsync(key, value);
      return;
    }

    // Valor grande: divide em chunks
    const totalChunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk);
    }
    // Remove possível valor antigo sem chunks para não confundir o getItem
    await SecureStore.deleteItemAsync(key).catch(() => {});
  },

  removeItem: async (key: string): Promise<void> => {
    // Remove o valor direto se existir
    await SecureStore.deleteItemAsync(key).catch(() => {});

    // Remove todos os chunks que existirem
    let i = 0;
    while (true) {
      const chunkKey = `${key}_chunk_${i}`;
      const exists = await SecureStore.getItemAsync(chunkKey);
      if (exists === null) break;
      await SecureStore.deleteItemAsync(chunkKey).catch(() => {});
      i++;
    }
  },
};

// Initialize Supabase Client with production-ready settings
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
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
