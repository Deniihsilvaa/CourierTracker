import * as Location from 'expo-location';
import 'react-native-get-random-values';
import {
  startTrackingNotification,
  stopTrackingNotification,
  updateTrackingNotificationMetrics
} from '../../infrastructure/tracking-notification';
import { localDatabase } from '../../services/localDatabase';
import { calculateDistance, isValidLocation } from '../../utils/location';
import { logger } from '../../utils/logger';
import { useSessionStore } from '../sessions/store';
import { analyticsService } from './analytics-service';
import { eventDetector } from './event-detector';
import { createRouteEvent } from './routeEventService';
import { segmentationService } from './segmentation-service';
import { sessionManager } from './session-manager';
import { useTrackingStore } from './store';
import { trackingRecorder } from './tracking-recorder';

const LOCATION_TASK_NAME = 'background-location-task';
const MIN_MOVEMENT_THRESHOLD = 5; // metros

/**
 * Adaptive sampling intervals based on movement speed.
 * - High speed (> 20 km/h):   5s  — full fidelity for route reconstruction
 * - Low speed (5–20 km/h):   10s  — slow traffic / urban delivery
 * - Crawling (1–5 km/h):     15s  — on foot / searching for address
 * - Stationary (< 1 km/h):   30s  — waiting, parking, delivering on foot
 */
const SAMPLE_INTERVAL_MS = {
  HIGH:       5_000,
  LOW:       10_000,
  CRAWLING:  15_000,
  IDLE:      30_000,
} as const;

const getAdaptiveSampleInterval = (speedMs: number | null): number => {
  if (speedMs === null || speedMs < 0) return SAMPLE_INTERVAL_MS.LOW;
  const kmh = speedMs * 3.6;
  if (kmh >= 20) return SAMPLE_INTERVAL_MS.HIGH;
  if (kmh >= 5)  return SAMPLE_INTERVAL_MS.LOW;
  if (kmh >= 1)  return SAMPLE_INTERVAL_MS.CRAWLING;
  return SAMPLE_INTERVAL_MS.IDLE;
};

// Re-export for external modules (e.g. Dashboard)
export const resetWaitingDetection = eventDetector.resetWaitingDetection;

export const startTracking = async () => {
  const session = useSessionStore.getState().activeSession;
  if (!session) {
    logger.error('[Tracking] Cannot start tracking without active work session');
    return;
  }

  try {
    logger.info('[Tracking] Initializing tracking pipeline...');

    // 1. GUARANTEE SESSION CREATION
    // This MUST succeed before we enable any GPS listeners
    const trackingSessionId = await sessionManager.startTrackingSession(session.user_id!);

    if (!trackingSessionId) {
      throw new Error('Failed to generate tracking session ID');
    }

    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyRunning) {
      logger.info('[Tracking] Pipeline already active, reusing existing service.');
      useTrackingStore.getState().setIsTracking(true);
      await startTrackingNotification(session.id, session.user_id!);
      return;
    }

    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') throw new Error('Permissão de localização negada');

    await Location.requestBackgroundPermissionsAsync();

    // 2. ENABLE GPS
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        distanceInterval: MIN_MOVEMENT_THRESHOLD,
        timeInterval: 5000,
        showsBackgroundLocationIndicator: true,
        activityType: Location.ActivityType.AutomotiveNavigation,
        foregroundService: {
          notificationTitle: "🚛 RotaPro Ativo",
          notificationBody: "Rastreando sua rota... Aguardando primeiro ponto GPS.",
          notificationColor: "#007AFF",
        }
      });
      logger.info('[Tracking] Background GPS enabled.');
    } catch (error: any) {
      if (error.message.includes('foreground service') || error.message.includes('permissions')) {
        logger.warn('[Tracking] Background GPS failed (Missing permissions in manifest). Falling back to watchPosition.');

        // Inform user that background tracking might be limited
        if (__DEV__) {
          console.warn('CRITICAL: Foreground Service permissions not found. Ensure you have rebuilt the APK/Development Build after modifying app.json.');
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: MIN_MOVEMENT_THRESHOLD,
            timeInterval: 3000,
          },
          (location) => processLocationUpdate([location])
        );
        (global as any).foregroundSubscription = subscription;
      } else {
        throw error;
      }
    }

    await startTrackingNotification(session.id, session.user_id!);
    logger.info('[Tracking] Tracking started successfully.');

  } catch (error: any) {
    logger.error('[Tracking] Pipeline stabilization failure:', { error: error.message });
    // Cleanup if partially started
    await sessionManager.stopTrackingSession();
    throw error;
  }

  useTrackingStore.getState().setIsTracking(true);
};

export const stopTracking = async () => {
  logger.info('[Tracking] Stopping tracking pipeline...');
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

  if ((global as any).foregroundSubscription) {
    (global as any).foregroundSubscription.remove();
    (global as any).foregroundSubscription = null;
  }

  const currentSessionId = await sessionManager.getCurrentSessionId();

  // GUARANTEE SESSION CLOSE
  await sessionManager.stopTrackingSession();

  // Aciona os placeholders de análise e segmentação para o futuro
  if (currentSessionId) {
    await analyticsService.generateSessionAnalytics(currentSessionId);
    await segmentationService.generateRouteSegments(currentSessionId);
  }

  await stopTrackingNotification();
  useTrackingStore.getState().setIsTracking(false);
  logger.info('[Tracking] Tracking stopped and session closed.');
};

export const pauseTrackingSession = async () => {
  const session = useSessionStore.getState().activeSession;
  if (!session) return;

  try {
    await stopTracking();
    await createRouteEvent(session.id, session.user_id!, 'pause');
    await updateTrackingNotificationMetrics(session.id, session.user_id!, true);
    logger.info('[Tracking] Session paused.');
  } catch (error) {
    logger.error('[Tracking] Error pausing session', { error });
  }
};

export const resumeTrackingSession = async () => {
  const session = useSessionStore.getState().activeSession;
  if (!session) return;

  try {
    await startTracking();
    await createRouteEvent(session.id, session.user_id!, 'resume');
    await updateTrackingNotificationMetrics(session.id, session.user_id!, false);
    logger.info('[Tracking] Session resumed.');
  } catch (error) {
    logger.error('[Tracking] Error resuming session', { error });
  }
};

/**
 * Processa uma lista de novas localizações recebidas do GPS.
 * Atua como o Orquestrador leve do sistema.
 */
export const processLocationUpdate = async (locations: Location.LocationObject[]) => {
  const trackingState = useTrackingStore.getState();
  const sessionState = useSessionStore.getState();

  // Recovery: Recupera sessão ativa se estado global foi limpo (background)
  let activeSession = sessionState.activeSession;
  if (!activeSession) {
    activeSession = await localDatabase.queryFirst<any>(
      'work_sessions',
      'WHERE status = "active" ORDER BY created_at DESC'
    );
    if (activeSession) sessionState.setActiveSession(activeSession);
  }

  if (!activeSession) return;
  const session = activeSession;
  const userId = (session as any).user_id ?? null;

  for (const loc of locations) {
    // 1. Behavioral Detection (Delegated)
    await eventDetector.processLocationForEvents(loc, session.id, userId!);

    const { latitude, longitude, accuracy, speed } = loc.coords;
    const timestamp = loc.timestamp;
    const lastLocation = trackingState.currentLocation;

    // 2. Noise Filtering
    if (!isValidLocation(accuracy, speed)) continue;

    // Adaptive throttle: sample less when slow/idle
    const minInterval = getAdaptiveSampleInterval(speed ?? null);
    if (lastLocation && (timestamp - lastLocation.timestamp) < minInterval) continue;

    // 3. Persistence (Delegated)
    const stored = await trackingRecorder.recordGpsPoint(userId, session.id, loc);

    // 4. UI Metric Updates (Volatile state only - analytics in SQLite removed)
    if (stored && lastLocation) {
      const distanceMeters = calculateDistance(
        lastLocation.latitude, lastLocation.longitude,
        latitude, longitude
      );

      const timeDeltaSeconds = (timestamp - lastLocation.timestamp) / 1000;
      const distanceDeltaKm = distanceMeters / 1000;

      // Update UI state (Zustand) for real-time visualization
      trackingState.setCurrentLocation({ latitude, longitude, accuracy, speed, timestamp });

      if (distanceMeters > 5) {
        sessionState.updateSessionMetrics(distanceDeltaKm, Math.round(timeDeltaSeconds), 0);
      } else {
        sessionState.updateSessionMetrics(0, 0, Math.round(timeDeltaSeconds));
      }
    } else if (stored) {
      trackingState.setCurrentLocation({ latitude, longitude, accuracy, speed, timestamp });
    }
  }
};
