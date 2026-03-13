import * as Location from 'expo-location';
import 'react-native-get-random-values';
import { localDatabase } from '../../services/localDatabase';
import { logger } from '../../utils/logger';
import { calculateDistance, isValidLocation } from '../../utils/location';
import { useSessionStore } from '../sessions/store';
import { useTrackingStore } from './store';
import { 
  startTrackingNotification, 
  stopTrackingNotification, 
  updateTrackingNotificationMetrics 
} from '../../infrastructure/tracking-notification';
import { createRouteEvent } from './routeEventService';
import { trackingRecorder } from './tracking-recorder';
import { eventDetector } from './event-detector';
import { sessionManager } from './session-manager';
import { analyticsService } from './analytics-service';
import { segmentationService } from './segmentation-service';

const LOCATION_TASK_NAME = 'background-location-task';
const MIN_MOVEMENT_THRESHOLD = 5; // metros
const MIN_TIME_BETWEEN_UPDATES = 5000; // 5 segundos

// Re-export for external modules (e.g. Dashboard)
export const resetWaitingDetection = eventDetector.resetWaitingDetection;

export const startTracking = async () => {
  const session = useSessionStore.getState().activeSession;
  if (!session) {
    logger.error('[Tracking] Cannot start tracking without active session');
    return;
  }

  // Inicia a sessão granular de rastreamento
  const trackingSessionId = await sessionManager.startTrackingSession(session.user_id!);

  try {
    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyRunning) {
      useTrackingStore.getState().setIsTracking(true);
      await startTrackingNotification(session.id, session.user_id!);
      return;
    }
  } catch (e) {}

  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') throw new Error('Permissão de localização negada');

  await Location.requestBackgroundPermissionsAsync();

  try {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: MIN_MOVEMENT_THRESHOLD,
      timeInterval: 5000,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: "🚛 Courier Tracker Ativo",
        notificationBody: "Rastreando sua rota... Aguardando primeiro ponto GPS.",
        notificationColor: "#007AFF",
      }
    });
    await startTrackingNotification(session.id, session.user_id!);
  } catch (error) {
    logger.warn('[Tracking] Background updates failed. Falling back to WatchPosition.');
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: MIN_MOVEMENT_THRESHOLD,
        timeInterval: 3000,
      },
      (location) => processLocationUpdate([location])
    );
    (global as any).foregroundSubscription = subscription;
    await startTrackingNotification(session.id, session.user_id!);
  }

  useTrackingStore.getState().setIsTracking(true);
};

export const stopTracking = async () => {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

  if ((global as any).foregroundSubscription) {
    (global as any).foregroundSubscription.remove();
    (global as any).foregroundSubscription = null;
  }

  const currentSessionId = sessionManager.getCurrentSessionId();

  // Finaliza a sessão granular de rastreamento
  await sessionManager.stopTrackingSession();

  // Aciona os placeholders de análise e segmentação para o futuro
  if (currentSessionId) {
    await analyticsService.generateSessionAnalytics(currentSessionId);
    await segmentationService.generateRouteSegments(currentSessionId);
  }

  await stopTrackingNotification();
  useTrackingStore.getState().setIsTracking(false);
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

    // Throttle checks
    if (lastLocation && (timestamp - lastLocation.timestamp) < MIN_TIME_BETWEEN_UPDATES) continue;

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
