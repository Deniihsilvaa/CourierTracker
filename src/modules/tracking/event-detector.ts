import { LocationObject } from 'expo-location';
import { logger } from '../../utils/logger';
import { calculateDistance } from '../../utils/location';
import { getDb } from '../../services/sqlite';
import { createRouteEvent } from './routeEventService';

// State for Automatic Waiting Detection
let waitingCandidateStartTime: number | null = null;
let lastAutoWaitingEventTimestamp: number | null = null;
let lastStationaryPosition: { latitude: number; longitude: number } | null = null;

const WAITING_SPEED_THRESHOLD_KMH = 2;
const WAITING_DISTANCE_THRESHOLD_METERS = 20;
const WAITING_DURATION_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const WAITING_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const WAITING_MAX_ACCURACY_METERS = 50;

/**
 * Detects behavioral events (like automatic waiting) based on GPS input.
 */
export const eventDetector = {
  /**
   * Resets the detection state (called during manual events).
   */
  resetWaitingDetection: () => {
    waitingCandidateStartTime = null;
    lastStationaryPosition = null;
    if (__DEV__) logger.info('[Waiting] Detection reset manually');
  },

  /**
   * Processes a location update to detect automatic behavioral events.
   */
  processLocationForEvents: async (
    location: LocationObject,
    sessionId: string,
    userId: string
  ): Promise<void> => {
    const { latitude, longitude, speed, accuracy } = location.coords;
    const timestamp = location.timestamp;

    // Filter by accuracy
    if (accuracy && accuracy > WAITING_MAX_ACCURACY_METERS) return;

    const speedKmh = speed ? speed * 3.6 : 0;
    const isStationary = speedKmh < WAITING_SPEED_THRESHOLD_KMH;

    if (isStationary) {
      if (lastStationaryPosition) {
        const distance = calculateDistance(
          lastStationaryPosition.latitude,
          lastStationaryPosition.longitude,
          latitude,
          longitude
        );

        if (distance > WAITING_DISTANCE_THRESHOLD_METERS) {
          waitingCandidateStartTime = timestamp;
          lastStationaryPosition = { latitude, longitude };
          return;
        }
      } else {
        lastStationaryPosition = { latitude, longitude };
      }

      if (!waitingCandidateStartTime) {
        waitingCandidateStartTime = timestamp;
      } else {
        const duration = timestamp - waitingCandidateStartTime;

        if (duration >= WAITING_DURATION_THRESHOLD_MS) {
          if (lastAutoWaitingEventTimestamp && 
              (timestamp - lastAutoWaitingEventTimestamp) < WAITING_COOLDOWN_MS) {
            return;
          }

          const db = getDb();
          const lastEvent = await db.getFirstAsync<any>(
            'SELECT event_type FROM route_events WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
            [sessionId]
          );

          if (lastEvent?.event_type === 'waiting') {
            waitingCandidateStartTime = timestamp;
            return;
          }

          if (__DEV__) logger.info('[Waiting] Automatic event triggered');
          await createRouteEvent(sessionId, userId, 'waiting');
          
          lastAutoWaitingEventTimestamp = timestamp;
          waitingCandidateStartTime = null;
        }
      }
    } else {
      waitingCandidateStartTime = null;
      lastStationaryPosition = null;
    }
  }
};
