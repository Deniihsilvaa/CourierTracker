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
import { ensureForegroundPermission, ensureBackgroundPermission } from '../../utils/location-access';

const LOCATION_TASK_NAME = 'background-location-task';
const MIN_MOVEMENT_THRESHOLD = 5; // metros

/**
 * Adaptive sampling intervals based on movement speed.
 * - High speed (> 20 km/h):   5s  — full fidelity for route reconstruction
 * - Low speed (5–20 km/h):   10s  — slow traffic / urban delivery
 * - Crawling (1–5 km/h):     15s  — on foot / searching for address
 * - Stationary (< 1 km/h):   30s  — waiting, parking, delivering on foot
 */
const SPEED_RULES = [
  { minKmh: 20, interval: 5000 },
  { minKmh: 5, interval: 10000 },
  { minKmh: 1, interval: 15000 },
  { minKmh: 0, interval: 30000 },
] as const;

export const getAdaptiveSampleInterval = (speedMs: number | null): number => {
  if (!speedMs || Number.isNaN(speedMs) || speedMs < 0) {
    return 10000;
  }

  const kmh = speedMs * 3.6;

  for (const rule of SPEED_RULES) {
    if (kmh >= rule.minKmh) {
      return rule.interval;
    }
  }

  return 10000;
};
/*
* @description a funcao startTracking para o tracking
*/
export const startTracking = async () => {
  const session = useSessionStore.getState().activeSession

  if (!session) {
    logger.error('[Tracking] Cannot start tracking without active work session')
    return
  }

  const store = useTrackingStore.getState()

  try {
    logger.info('[Tracking] Initializing tracking pipeline...')

    // 1️⃣ Check foreground permission
    const hasForeground = await ensureForegroundPermission();

    if (!hasForeground) {
      logger.warn('[Tracking] Location permission denied by user')
      return
    }

    // 2️⃣ Ensure tracking session exists
    const trackingSessionId = await sessionManager.startTrackingSession(session.user_id!)

    if (!trackingSessionId) {
      throw new Error('Failed to generate tracking session ID')
    }

    // 3️⃣ Prevent duplicate pipelines
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)

    if (hasStarted) {
      logger.info('[Tracking] Pipeline already active')
      store.setIsTracking(true)
      await startTrackingNotification(session.id, session.user_id!)
      return
    }

    // 4️⃣ Start background GPS
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: MIN_MOVEMENT_THRESHOLD,
        timeInterval: 5000,
        deferredUpdatesDistance: 20,
        deferredUpdatesInterval: 10000,
        activityType: Location.ActivityType.AutomotiveNavigation,
        foregroundService: {
          notificationTitle: "🚛 RotaPro Ativo",
          notificationBody: "Rastreando sua rota...",
          notificationColor: "#007AFF",
        }
      })

      logger.info('[Tracking] Background GPS enabled')

    } catch (error) {
      logger.warn('[Tracking] Background tracking failed, using foreground tracking')

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: MIN_MOVEMENT_THRESHOLD,
          timeInterval: 5000,
        },
        (location) => processLocationUpdate([location])
      )

      store.setLocationSubscription(subscription)
    }

    // 5️⃣ Request background permission (sequential, non-blocking)
    void (async () => {
      // Wait a bit to ensure UI has settled after foreground permission or task start
      await new Promise(resolve => setTimeout(resolve, 1000));
      await ensureBackgroundPermission();
    })();

    // 6️⃣ Start notification
    await startTrackingNotification(session.id, session.user_id!)

    store.setIsTracking(true)

    logger.info('[Tracking] Tracking started successfully')

  } catch (error: any) {
    logger.error('[Tracking] Pipeline initialization failure', { error: error.message })

    await sessionManager.stopTrackingSession()

    throw error
  }
}
/**
 * @description a funcao stopTracking para o tracking e fecha a sessao
 * - Analytics e segmentation paralelos.
 * - AndroTracking sempre para mesmo se analytics falhar.
 */
export const stopTracking = async () => {
  logger.info('[Tracking] Stopping tracking pipeline...');

  const store = useTrackingStore.getState()

  try {
    //  stop backgoud gps
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (hasStarted) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

    //  stop foreground gps
    const sub = store.locationSubscription as Location.LocationSubscription | null
    if (sub) {
      sub.remove()
      store.setLocationSubscription(null)
    }
    const currentSessionId = await sessionManager.getCurrentSessionId()
    // closed tracking
    await sessionManager.stopTrackingSession()
    if (currentSessionId) {
      try {
        await Promise.all([
          analyticsService.generateSessionAnalytics(currentSessionId),
          segmentationService.generateRouteSegments(currentSessionId)
        ])
      } catch (err) {
        logger.error('[Tracking] Analytics generation failed', { err })
      }
    }



  } catch (error) {
    logger.error('[Tracking] Error stopping background GPS', { error });
  } finally {
    await stopTrackingNotification();
    useTrackingStore.getState().setIsTracking(false);
    logger.info('[Tracking] Tracking stopped and session closed.');
  }
};
/* 
* @description a funcao pauseTrackingSession para o tracking
*/
export const pauseTrackingSession = async () => {
  const session = useSessionStore.getState().activeSession

  if (!session) {
    logger.warn('[Tracking] Cannot pause without active session')
    return
  }

  try {
    logger.info('[Tracking] Pausing tracking session...')

    // Stop GPS but keep session alive
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)

    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
    }

    const store = useTrackingStore.getState()
    const sub = store.locationSubscription as Location.LocationSubscription | null

    if (sub) {
      sub.remove()
      store.setLocationSubscription(null)
    }

    // Register pause event
    await createRouteEvent(session.id, session.user_id!, 'pause')

    // Update notification
    await updateTrackingNotificationMetrics(session.id, session.user_id!, true)

    store.setIsTracking(false)

    logger.info('[Tracking] Session paused successfully')

  } catch (error) {
    logger.error('[Tracking] Error pausing session', { error })
  }
}

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

  const trackingStore = useTrackingStore.getState()
  const sessionStore = useSessionStore.getState()

  // Recover session if state was cleared
  let session = sessionStore.activeSession

  if (!session) {
    session = await localDatabase.queryFirst<any>(
      'work_sessions',
      'WHERE status = "active" ORDER BY created_at DESC'
    )

    if (session) sessionStore.setActiveSession(session)
  }

  if (!session || !session.user_id) return

  let lastLocation = trackingStore.currentLocation

  for (const loc of locations) {

    const { latitude, longitude, accuracy, speed } = loc.coords
    const timestamp = loc.timestamp

    // 1️⃣ Basic validation
    if (!latitude || !longitude || !timestamp) continue

    // 2️⃣ Noise filtering
    if (!isValidLocation(accuracy, speed)) continue

    // 3️⃣ Adaptive sampling
    const minInterval = getAdaptiveSampleInterval(speed ?? null)

    if (lastLocation && (timestamp - lastLocation.timestamp) < minInterval) {
      continue
    }

    // 4️⃣ Detect behavioral events
    eventDetector.processLocationForEvents(loc, session.id, session.user_id)

    // 5️⃣ Persist GPS point
    const stored = await trackingRecorder.recordGpsPoint(
      session.user_id,
      session.id,
      loc
    )

    if (!stored) continue

    // 6️⃣ Distance calculation
    let distanceDeltaKm = 0
    let timeDeltaSeconds = 0

    if (lastLocation) {

      const distanceMeters = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        latitude,
        longitude
      )

      distanceDeltaKm = distanceMeters / 1000
      timeDeltaSeconds = (timestamp - lastLocation.timestamp) / 1000

      if (distanceMeters > 5) {
        sessionStore.updateSessionMetrics(
          distanceDeltaKm,
          Math.round(timeDeltaSeconds),
          0
        )
      } else {
        sessionStore.updateSessionMetrics(
          0,
          0,
          Math.round(timeDeltaSeconds)
        )
      }
    }

    // 7️⃣ Update UI state
    const newLocation = {
      latitude,
      longitude,
      accuracy,
      speed,
      timestamp
    }

    trackingStore.setCurrentLocation(newLocation)

    // Update local variable
    lastLocation = newLocation
  }
}
