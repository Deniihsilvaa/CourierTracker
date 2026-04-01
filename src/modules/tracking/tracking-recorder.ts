import { LocationObject } from 'expo-location';
import { v4 as uuidv4 } from 'uuid';
import { localDatabase } from '../../services/localDatabase';
import { logger } from '../../utils/logger';

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

    if (!sessionId) {
      logger.warn('[Recorder] GPS Point skipped: No active tracking session detected.');
      return false;
    }

    try {
      await localDatabase.insert('gps_points', {
        user_id: userId,
        session_id: sessionId,
        latitude,
        longitude,
        accuracy,
        speed,
        recorded_at: recordedAt,
        point_uuid: uuidv4(),
      });
      return true;
    } catch (error) {
      logger.error('[Recorder] Failed to persist GPS point', { error });
      return false;
    }
  }
};
