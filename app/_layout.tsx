import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { logger } from '@/src/utils/logger';
import { authSessionGuard } from '@/src/services/authSessionGuard';

// Global error handler for easier mobile debugging
if (!__DEV__) {
  const defaultErrorHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    Alert.alert('Erro de Sistema', error.message || 'Ocorreu um erro inesperado.');
    defaultErrorHandler(error, isFatal);
  });
}

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
        logger.info('RootLayout: Initializing database...');
        await initDb(false); 
        
        logger.info('RootLayout: Checking session...');
        await checkSession();
      } catch (e) {
        logger.error('Initialization error:', e);
      } finally {
        setIsReady(true);
      }
    };

    prepare();

    // Session Guard for Background Resume
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        logger.info('[App] App returned to foreground, validating session...');
        authSessionGuard.syncAuthStore();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (isLoading) return;

    if (!user && !inAuthGroup) {
      logger.info('[Auth] No user and not in auth group -> Redirecting to /login');
      router.replace('/login');
    } else if (user && inAuthGroup) {
      logger.info('[Auth] User found and in auth group -> Redirecting to /');
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
