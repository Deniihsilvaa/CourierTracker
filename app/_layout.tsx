import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { logger } from '@/src/utils/logger';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { AppInitializer } from '@/src/services/app-initializer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Global error handler
AppInitializer.setupErrorHandling();

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
    // Phase 1: Heavy Initialization
    const prepareApp = async () => {
      await AppInitializer.prepare();
      await checkSession();
      AppInitializer.setupGlobalListeners();
      setIsReady(true);
    };

    prepareApp();

    return () => {
      AppInitializer.cleanup();
    };
  }, []);

  // Phase 2: Routing Control
  useEffect(() => {
    if (!isReady || isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {
      logger.info('[Auth] Redirecting to /login');
      router.replace('/login');
    } else if (user && inAuthGroup) {
      logger.info('[Auth] Redirecting to /');
      router.replace('/');
    }
  }, [user, segments, isReady, isLoading]);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            animation: 'slide_from_right',
            animationDuration: 250,
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="register" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="incomes" options={{ headerShown: false }} />
          <Stack.Screen name="expenses" options={{ headerShown: false }} />
          <Stack.Screen name="categories" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

