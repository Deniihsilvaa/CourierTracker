import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initDb } from '@/src/services/sqlite';
import { useAuthStore } from '@/src/modules/auth/store';
import '@/src/infrastructure/location-provider';

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  
  const { user, checkSession, isLoading } = useAuthStore();

  useEffect(() => {
    const prepare = async () => {
      try {
        console.log('RootLayout: Initializing database...');
        // Reset finished, setting back to false
        await initDb(false); 
        
        console.log('RootLayout: Checking session...');
        await checkSession();
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsReady(true);
        console.log('RootLayout: Ready.');
      }
    };

    prepare();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    console.log('[Auth] Navigation Check:', {
        isReady,
        isLoading,
        user: user ? { id: user.id, email: user.email } : null,
        segments,
        inAuthGroup
    });

    if (isLoading) return;

    if (!user && !inAuthGroup) {
      console.log('[Auth] No user and not in auth group -> Redirecting to /login');
      router.replace('/login');
    } else if (user && inAuthGroup) {
      console.log('[Auth] User found and in auth group -> Redirecting to /');
      router.replace('/');
    }
  }, [user, segments, isReady, isLoading]);

  if (!isReady) {
    return null; // Keep Splash or Null while checking session
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
