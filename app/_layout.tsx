import { AppDrawer } from '@/components/layout/app-drawer';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { AppShellProvider } from '@/src/providers/app-shell-provider';
import { AppInitializer } from '@/src/services/app-initializer';
import { logger } from '@/src/utils/logger';
import { AuthGuard } from '@/src/navigation/AuthGuard';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Global error handler
AppInitializer.setupErrorHandling();

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const { checkSession } = useAuthStore();

  useEffect(() => {
    // Phase 1: Heavy Initialization
    const prepareApp = async () => {
      try {
        await AppInitializer.prepare();
        await checkSession();
        await AppInitializer.setupGlobalListeners();
        
        // Artificial delay to ensure branding is visible (Splash Screen)
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        logger.error('[AppInitializer] Error during preparation:', e);
      } finally {
        setIsReady(true);
      }
    };

    prepareApp();

    return () => {
      AppInitializer.cleanup();
    };
  }, []);



  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppShellProvider>
        <AuthGuard>
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
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal', animation: 'fade_from_bottom' }} />
              <Stack.Screen name="incomes" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="fuels" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="expenses" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="categories" options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="reports" options={{ headerShown: false }} />
              <Stack.Screen name="maintenance" options={{ headerShown: false }} />
              <Stack.Screen name="export-data" options={{ headerShown: false }} />
              <Stack.Screen name="backup" options={{ headerShown: false }} />
              <Stack.Screen name="help" options={{ headerShown: false }} />
              <Stack.Screen name="about" options={{ headerShown: false }} />
            </Stack>
            <AppDrawer />
            <StatusBar style="light" />
          </ThemeProvider>
        </AuthGuard>
      </AppShellProvider>
    </GestureHandlerRootView>
  );
}
