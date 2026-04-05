import * as Notifications from 'expo-notifications';
import { Alert, AppState } from 'react-native';
import { handleNotificationAction, setupNotificationCategories } from '../infrastructure/tracking-notification';
import { useSessionStore } from '../modules/sessions/store';
import { sessionManager } from '../modules/tracking/session-manager';
import { logger } from '../utils/logger';
import { authSessionGuard } from './authSessionGuard';
import { logSystem } from './logSystem';
import { initDb } from './sqlite';
import { runFullSync } from './sync';

/**
 * @description
 * Orchestrates the application startup sequence and global listeners.
 */
export const AppInitializer = {
  privateSubscriptions: [] as any[],
  timerInterval: null as NodeJS.Timeout | null,
  syncInterval: null as NodeJS.Timeout | null,
  /**
   * Initializes the application.
   * @returns True if the initialization was successful, false otherwise.
   */
  async prepare() {
    try {
      logger.info('[AppInitializer] Initializing database...');
      // CRITICAL: Changed from true to false to prevent data loss on every start
      await initDb(false);

      logger.info('[AppInitializer] Recovering tracking session...');
      await sessionManager.initializeSession();

      logger.info('[AppInitializer] Setting up notification categories...');
      setupNotificationCategories();

      // Start global timer if there's an active session
      this.startGlobalTimer();
      
      // Start background sync timer (every 15 minutes)
      this.startAutoSync();

      return true;
    } catch (e) {
      logger.error('[AppInitializer] Critical initialization error:', e);
      return false;
    }
  },

  startAutoSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    // Trigger initial sync shortly after start
    setTimeout(() => {
      runFullSync().catch(err => logger.error('[AppInitializer] Initial auto-sync failed:', err));
    }, 5000);

    // Set up recurring sync every 1 minute
    this.syncInterval = setInterval(() => {
      logger.info('[AppInitializer] Running scheduled background sync...');
      runFullSync().catch(err => logger.warn('[AppInitializer] Scheduled sync failed (likely offline):', err.message));
    }, 1 * 60 * 1000); 
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

    // 2. AppState Listener for Session Guard and Proactive Sync
    let lastState = AppState.currentState;
    const appStateSub = AppState.addEventListener('change', nextAppState => {
      void logSystem.enqueue('info', '[AppState] change', null, {
        from: lastState,
        to: nextAppState,
        at: new Date().toISOString(),
      });

      if (lastState.match(/inactive|background/) && nextAppState === 'active') {
        logger.info('[AppInitializer] App returned to foreground, validating session and syncing...');
        void authSessionGuard.syncAuthStore();
        // Trigger a sync when user comes back to the app
        void runFullSync().catch(err => logger.warn('[AppInitializer] Foreground sync failed:', err.message));
      }
      lastState = nextAppState;
    });

    this.privateSubscriptions.push(notificationSub, appStateSub);
  },

  cleanup() {
    this.privateSubscriptions.forEach(sub => sub.remove());
    this.privateSubscriptions = [];
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
  },

  setupErrorHandling() {
    if (!__DEV__) {
      const defaultErrorHandler = (ErrorUtils as any).getGlobalHandler();
      (ErrorUtils as any).setGlobalHandler((error: any, isFatal: any) => {
        Alert.alert('Erro de Sistema', error.message || 'Ocorreu um erro inesperado.');
        defaultErrorHandler(error, isFatal);
      });
    }
  }
};
