import { LocationObject } from 'expo-location';
import { localDatabase } from '../../services/localDatabase';
import { logger } from '../../utils/logger';
import { sessionManager } from './session-manager';

/**
 * TrackingRecorder is responsible for persisting raw GPS points.
 */
export const trackingRecorder = {
  /**
   * Persists a single GPS point to the local SQLite database.
   */
  recordGpsPoint: async (
    userId: string | null,
    sessionId: string, // This is the higher level work session
    location: LocationObject
  ): Promise<boolean> => {
    const { latitude, longitude, accuracy, speed } = location.coords;
    const recordedAt = new Date(location.timestamp).toISOString();

    // The granular tracking_session ID from SessionManager
    const trackingSessionId = sessionManager.getCurrentSessionId();

    try {
      // We keep the legacy sessionId (work session) for sync compatibility
      // But ensure trackingSessionId is also available if needed.
      // In this refactor, we are using the existing session_id field 
      // to point to the granular tracking_session if it's active.
      
      return await localDatabase.insertGps(
        userId,
        trackingSessionId || sessionId, 
        latitude,
        longitude,
        accuracy,
        speed,
        recordedAt
      );
    } catch (error) {
      logger.error('[Recorder] Failed to persist GPS point', { error });
      return false;
    }
  }
};
