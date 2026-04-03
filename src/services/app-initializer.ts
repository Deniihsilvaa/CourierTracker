import * as Notifications from 'expo-notifications';
import { Alert, AppState } from 'react-native';
import { handleNotificationAction, setupNotificationCategories } from '../infrastructure/tracking-notification';
import { useSessionStore } from '../modules/sessions/store';
import { sessionManager } from '../modules/tracking/session-manager';
import { logger } from '../utils/logger';
import { authSessionGuard } from './authSessionGuard';
import { logSystem } from './logSystem';
import { initDb } from './sqlite';

/**
 * Orchestrates the application startup sequence and global listeners.
 */
export const AppInitializer = {
  privateSubscriptions: [] as any[],
  timerInterval: null as NodeJS.Timeout | null,

  async prepare() {
    try {
      logger.info('[AppInitializer] Initializing database...');
      await initDb(true);

      logger.info('[AppInitializer] Recovering tracking session...');
      await sessionManager.initializeSession();

      logger.info('[AppInitializer] Setting up notification categories...');
      setupNotificationCategories();

      // Start global timer if there's an active session
      this.startGlobalTimer();

      return true;
    } catch (e) {
      logger.error('[AppInitializer] Critical initialization error:', e);
      return false;
    }
  },

  startGlobalTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const { activeSession, setSessionDuration } = useSessionStore.getState();
      if (activeSession?.start_time) {
        const start = new Date(activeSession.start_time).getTime();
        const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
        const h = Math.floor(diff / 3600);
        const m = Math.floor((diff % 3600) / 60);
        const s = diff % 60;
        setSessionDuration(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
  },

  setupGlobalListeners() {
    // 1. Notification Response Listener
    const notificationSub = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationAction(response);
    });

    // 2. AppState Listener for Session Guard
    let lastState = AppState.currentState;
    const appStateSub = AppState.addEventListener('change', nextAppState => {
      void logSystem.enqueue('info', '[AppState] change', null, {
        from: lastState,
        to: nextAppState,
        at: new Date().toISOString(),
      });

      if (lastState.match(/inactive|background/) && nextAppState === 'active') {
        logger.info('[AppInitializer] App returned to foreground, validating session...');
        void authSessionGuard.syncAuthStore();
      }
      lastState = nextAppState;
    });

    this.privateSubscriptions.push(notificationSub, appStateSub);
  },

  cleanup() {
    this.privateSubscriptions.forEach(sub => sub.remove());
    this.privateSubscriptions = [];
  },

  setupErrorHandling() {
    if (!__DEV__) {
      const defaultErrorHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        Alert.alert('Erro de Sistema', error.message || 'Ocorreu um erro inesperado.');
        defaultErrorHandler(error, isFatal);
      });
    }
  }
};
