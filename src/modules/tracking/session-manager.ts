import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../services/sqlite';
import { logger } from '../../utils/logger';

let currentTrackingSessionId: string | null = null;

/**
 * SessionManager handles the lifecycle of tracking_sessions.
 * These are granular sessions recorded every time tracking is toggled.
 */
export const sessionManager = {
  /**
   * Recovers an active session from the database if memory is cleared.
   */
  initializeSession: async (): Promise<string | null> => {
    try {
      const db = getDb();
      const activeSession = await db.getFirstAsync<{ id: string }>(
        "SELECT id FROM tracking_sessions WHERE status = 'active' ORDER BY started_at DESC LIMIT 1"
      );

      if (activeSession) {
        currentTrackingSessionId = activeSession.id;
        logger.info(`[SessionManager] Session recovered: ${currentTrackingSessionId}`);
        return currentTrackingSessionId;
      }
      
      return null;
    } catch (error) {
      logger.error('[SessionManager] Error during session initialization', { error });
      return null;
    }
  },

  /**
   * Starts a new tracking session and persists it in SQLite.
   * GUARANTEE: This must complete before any GPS point is recorded.
   */
  startTrackingSession: async (userId: string): Promise<string> => {
    const db = getDb();
    const sessionId = uuidv4();
    
    // SQLite datetime('now') equivalent in ISO
    const startedAt = new Date().toISOString();

    try {
      await db.runAsync(
        `INSERT INTO tracking_sessions (id, user_id, started_at, status, synced) VALUES (?, ?, ?, 'active', 0)`,
        [sessionId, userId, startedAt]
      );
      
      currentTrackingSessionId = sessionId;
      logger.info(`[SessionManager] Session created and started: ${sessionId}`);
      return sessionId;
    } catch (error) {
      logger.error('[SessionManager] CRITICAL: Failed to create session in SQLite', { error });
      throw error; // Propagate to prevent tracking start
    }
  },

  /**
   * Closes the current tracking session.
   */
  stopTrackingSession: async (): Promise<void> => {
    if (!currentTrackingSessionId) {
      // Try to recover to close it correctly
      await sessionManager.initializeSession();
      if (!currentTrackingSessionId) return;
    }

    const db = getDb();
    const endedAt = new Date().toISOString();

    try {
      await db.runAsync(
        `UPDATE tracking_sessions SET ended_at = ?, status = 'finished', synced = 0 WHERE id = ?`,
        [endedAt, currentTrackingSessionId]
      );
      
      logger.info(`[SessionManager] Session closed: ${currentTrackingSessionId}`);
      currentTrackingSessionId = null;
    } catch (error) {
      logger.error('[SessionManager] Failed to close session', { error });
    }
  },

  /**
   * Returns the current in-memory tracking session ID.
   * If null, attempts a one-time recovery from SQLite.
   */
  getCurrentSessionId: async (): Promise<string | null> => {
    if (currentTrackingSessionId) return currentTrackingSessionId;
    return await sessionManager.initializeSession();
  }
};
