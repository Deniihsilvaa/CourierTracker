import * as Location from 'expo-location';
import { useTrackingStore } from './store';
import { useSessionStore } from '../sessions/store';
import { useAuthStore } from '../auth/store';
import { calculateDistance, isValidLocation } from '../../utils/location';
import { getDb } from '../../services/sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const LOCATION_TASK_NAME = 'background-location-task';
const MIN_MOVEMENT_THRESHOLD = 10; // meters
const MIN_TIME_BETWEEN_UPDATES = 5000; // 5 seconds

export const startTracking = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    throw new Error('Permission to access location was denied');
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    console.warn('Background location permission denied. Tracking will only work in foreground.');
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.High,
    distanceInterval: MIN_MOVEMENT_THRESHOLD,
    timeInterval: 5000,
    showsBackgroundLocationIndicator: true,
    activityType: Location.ActivityType.AutomotiveNavigation,
  });

  useTrackingStore.getState().setIsTracking(true);
};

export const stopTracking = async () => {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
  useTrackingStore.getState().setIsTracking(false);
};

/**
 * Processa uma lista de novas localizações recebidas do GPS.
 * Aplica filtros, calcula métricas e persiste localmente.
 */
export const processLocationUpdate = async (locations: Location.LocationObject[]) => {
  const db = getDb();
  const trackingState = useTrackingStore.getState();
  const sessionState = useSessionStore.getState();

  // 1. RECOVERY: In background, Zustand might be cleared.
  // Fetch the active session directly from the DB.
  let activeSession = sessionState.activeSession;
  if (!activeSession) {
    activeSession = await db.getFirstAsync<any>(
      'SELECT * FROM work_sessions WHERE status = "active" ORDER BY created_at DESC LIMIT 1'
    );
    // Restore session state if found
    if (activeSession) {
      sessionState.setActiveSession(activeSession);
    }
  }

  if (!activeSession) return;

  // Fetch the current user profile
  const userRow = await db.getFirstAsync<{ id: string }>('SELECT id FROM profiles LIMIT 1');
  const userId = userRow?.id || null;

  for (const loc of locations) {
    const { latitude, longitude, accuracy, speed } = loc.coords;
    const timestamp = loc.timestamp;
    const lastLocation = trackingState.currentLocation;

    // 2. Filtragem de Ruído
    if (!isValidLocation(accuracy, speed)) continue;

    if (lastLocation && (timestamp - lastLocation.timestamp) < MIN_TIME_BETWEEN_UPDATES) {
      continue;
    }

    // 3. Cálculo de Distância e Tempo
    let distanceDeltaKm = 0;
    let timeDeltaSeconds = 0;

    if (lastLocation) {
      const distanceMeters = calculateDistance(
        lastLocation.latitude, lastLocation.longitude,
        latitude, longitude
      );
      
      const isMoving = distanceMeters > 5 && (speed === null || speed > 0.3);
      if (isMoving) {
        distanceDeltaKm = distanceMeters / 1000;
      }
      timeDeltaSeconds = Math.max(0, (timestamp - lastLocation.timestamp) / 1000);
    }

    let idleDelta = 0;
    let activeDelta = 0;
    if (distanceDeltaKm < 0.005) { 
      idleDelta = Math.round(timeDeltaSeconds);
    } else {
      activeDelta = Math.round(timeDeltaSeconds);
    }

    // 4. Atualização do Estado Global (UI)
    trackingState.setCurrentLocation({ latitude, longitude, accuracy, timestamp });
    sessionState.updateSessionMetrics(distanceDeltaKm, activeDelta, idleDelta);

    // 5. Persistência em SQLite
    try {
      await db.runAsync(
        `INSERT INTO gps_points (user_id, session_id, latitude, longitude, accuracy, speed, recorded_at, synced) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [userId, activeSession.id, latitude, longitude, accuracy, speed, new Date(timestamp).toISOString()]
      );

      await db.runAsync(
        `UPDATE work_sessions SET total_distance_km = total_distance_km + ?, total_active_seconds = total_active_seconds + ?, total_idle_seconds = total_idle_seconds + ? WHERE id = ?`,
        [distanceDeltaKm, activeDelta, idleDelta, activeSession.id]
      );
    } catch (e) {
      console.error('Error saving location to DB:', e);
    }
  }
};
