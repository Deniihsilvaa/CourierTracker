import { getDb } from '../../services/sqlite';
import { logger } from '../../utils/logger';

let currentSessionId: string | null = null;

/**
 * SessionManager handles the lifecycle of work sessions.
 */
export const sessionManager = {
  /**
   * Recovers an open work session from the database if memory is cleared.
   */
  initializeSession: async (): Promise<string | null> => {
    try {
      const db = getDb();
      const activeSession = await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM work_sessions WHERE status = 'open' ORDER BY start_time DESC LIMIT 1"
      );

      if (activeSession) {
        currentSessionId = activeSession.id;
        logger.info(`[SessionManager] Work session recovered: ${currentSessionId}`);
        return currentSessionId;
      }

      return null;
    } catch (error) {
      logger.error('[SessionManager] Error during work session initialization', { error });
      return null;
    }
  },

  /**
   * Memory management only.
   */
  setSessionId: (id: string | null) => {
    currentSessionId = id;
  },

  /**
   * Returns the current in-memory work session ID.
   * If null, attempts recovery from SQLite.
   */
  getCurrentSessionId: async (): Promise<string | null> => {
    if (currentSessionId) return currentSessionId;
    return await sessionManager.initializeSession();
  },

  /**
   * Starting and stopping work sessions is now handled by sessions/service.ts
   * This is kept for backward compatibility if needed, but simplified.
   */
  startTrackingSession: async (userId: string): Promise<string> => {
    const id = await sessionManager.getCurrentSessionId();
    if (!id) throw new Error('No active work session to start tracking');
    return id;
  },

  stopTrackingSession: async (): Promise<void> => {
    currentSessionId = null;
  }
};
