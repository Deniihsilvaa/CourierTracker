import { supabase } from './supabase';
import { logger } from '../utils/logger';
import { useAuthStore } from '../modules/auth/store';

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
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('[AuthGuard] Sync error:', error.message);
        return false;
      }

      // If we have a user in store but NO session in Supabase, 
      // it MIGHT be a logout or a transient issue.
      if (!session) {
        const store = useAuthStore.getState();
        if (store.user) {
          logger.warn('[AuthGuard] No session found, but user exists in store. Re-checking...');
          
          // Re-check with a small delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const { data: retry } = await supabase.auth.getSession();
          
          if (!retry.session) {
            // We only sign out if we are SURE the user is not authenticated anymore
            // but we'll let the AuthStore decide this through its checkSession method
            // or we only do it if the store is not already loading.
            if (!store.isLoading) {
              logger.error('[AuthGuard] Persistent session loss. User state cleared.');
              // We reset the user to null to force redirection back to login
              store.setUser(null);
            }
          }
        }
      }

      return true;
    } catch (e) {
      logger.error('[AuthGuard] Unexpected error during sync:', e);
      return false;
    }
  }
};
