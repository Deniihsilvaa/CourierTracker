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
    sessionId: string, // This is the work shift ID
    location: LocationObject
  ): Promise<boolean> => {
    const { latitude, longitude, accuracy, speed } = location.coords;
    const recordedAt = new Date(location.timestamp).toISOString();

    // The granular tracking_session ID from SessionManager
    // Robust check: getCurrentSessionId is now async and handles recovery
    const trackingSessionId = await sessionManager.getCurrentSessionId();

    // GUARD: If no active tracking session is found even after recovery attempt,
    // we do NOT record the GPS point to prevent orphan data in the analytics pipeline.
    if (!trackingSessionId) {
      logger.warn('[Recorder] GPS Point skipped: No active tracking session detected.');
      return false;
    }

    try {
      return await localDatabase.insertGps(
        userId,
        trackingSessionId, 
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
