import { useAuthStore } from '../modules/auth/store';
import { logger } from '../utils/logger';
import { authService } from './auth.service';

export const authSessionGuard = {
  /**
   * Validates the current session by calling the profile endpoint.
   * Useful when app resumes from background or before critical sync operations.
   */
  validateSession: async () => {
    try {
      logger.debug('[AuthGuard] Validating session with API...');
      
      // The api interceptor handles token injection and 401 errors
      const profile = await authService.me();

      if (!profile) {
        logger.warn('[AuthGuard] No active profile/session found.');
        return false;
      }

      logger.debug('[AuthGuard] Session is valid.');
      return true;
    } catch (e: any) {
      if (e.response?.status === 401) {
        logger.warn('[AuthGuard] Session expired (401).');
        return false;
      }
      logger.error('[AuthGuard] Unexpected error during session validation:', e.message);
      // On network errors, we might want to return true to avoid kicking user out while offline
      return true; 
    }
  },

  /**
   * Ensures the auth store is synced with the current API session.
   */
  syncAuthStore: async () => {
    try {
      logger.debug('[AuthGuard] Syncing auth store state...');
      
      const store = useAuthStore.getState();
      
      if (!store.isLoading) {
        await store.checkSession();
      }

      return true;
    } catch (e) {
      logger.error('[AuthGuard] Unexpected error during sync:', e);
      return false;
    }
  }
};
