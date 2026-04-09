import * as SplashScreen from 'expo-splash-screen';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../modules/auth/store';
import { logger } from '../utils/logger';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!user && !inAuthGroup) {
      logger.info('[AuthGuard] Redirecting to /login');
      router.replace('/login');
    } else if (user && inAuthGroup) {
      logger.info('[AuthGuard] Redirecting to /');
      router.replace('/');
    }

    // Hide splash screen after the very first routing check
    SplashScreen.hideAsync();
  }, [user, segments, isLoading]);

  return <>{children}</>;
}
