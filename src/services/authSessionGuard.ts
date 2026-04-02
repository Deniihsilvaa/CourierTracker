import { useAuthStore } from '../modules/auth/store';
import { logger } from '../utils/logger';
import { supabase } from './supabase';

export const authSessionGuard = {
  /**
   * Validates the current session and refreshes it if necessary.
   * Useful when app resumes from background or before critical sync operations.
   */
  validateSession: async () => {
    try {
      logger.debug('[AuthGuard] Validating session...');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('[AuthGuard] Session validation error:', error.message);
        return false;
      }

      if (!session) {
        logger.warn('[AuthGuard] No active session found.');
        return false;
      }

      // Check if token is near expiry (e.g., less than 5 minutes left)
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const now = Date.now();
      const BUFFER = 5 * 60 * 1000; // 5 minutes

      if (expiresAt - now < BUFFER) {
        logger.info('[AuthGuard] Token near expiry, refreshing...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

        if (refreshError) {
          logger.error('[AuthGuard] Token refresh failed:', refreshError.message);
          return false;
        }

        logger.info('[AuthGuard] Token refreshed successfully.');
        return !!refreshData.session;
      }

      logger.debug('[AuthGuard] Session is valid.');
      return true;
    } catch (e) {
      logger.error('[AuthGuard] Unexpected error during session validation:', e);
      return false;
    }
  },

  /**
   * Ensures the auth store is synced with the current Supabase session.
   */
  syncAuthStore: async () => {
    try {
      logger.debug('[AuthGuard] Syncing auth store state...');
      
      const store = useAuthStore.getState();
      
      // Delegation: We let the Centralized Store manage its own truth and logic
      // respecting the flow: Event -> Store Action -> Service/API
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
