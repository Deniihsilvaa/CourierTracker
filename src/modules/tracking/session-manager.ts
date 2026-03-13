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
   * Starts a new tracking session and persists it in SQLite.
   */
  startTrackingSession: async (userId: string): Promise<string> => {
    const db = getDb();
    const sessionId = uuidv4();
    const startedAt = new Date().toISOString();

    try {
      await db.runAsync(
        `INSERT INTO tracking_sessions (id, user_id, started_at, status, synced) VALUES (?, ?, ?, 'active', 0)`,
        [sessionId, userId, startedAt]
      );
      
      currentTrackingSessionId = sessionId;
      logger.info(`[SessionManager] Tracking session started: ${sessionId}`);
      return sessionId;
    } catch (error) {
      logger.error('[SessionManager] Failed to start tracking session', { error });
      throw error;
    }
  },

  /**
   * Closes the current tracking session.
   */
  stopTrackingSession: async (): Promise<void> => {
    if (!currentTrackingSessionId) return;

    const db = getDb();
    const endedAt = new Date().toISOString();

    try {
      await db.runAsync(
        `UPDATE tracking_sessions SET ended_at = ?, status = 'finished', synced = 0 WHERE id = ?`,
        [endedAt, currentTrackingSessionId]
      );
      
      logger.info(`[SessionManager] Tracking session finished: ${currentTrackingSessionId}`);
      currentTrackingSessionId = null;
    } catch (error) {
      logger.error('[SessionManager] Failed to stop tracking session', { error });
    }
  },

  /**
   * Returns the current in-memory tracking session ID.
   */
  getCurrentSessionId: (): string | null => {
    return currentTrackingSessionId;
  }
};
