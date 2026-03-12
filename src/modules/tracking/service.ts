import * as Location from 'expo-location';
import { getDb } from '../../services/sqlite';
import 'react-native-get-random-values';
import { localDatabase } from '../../services/localDatabase';
import { logger } from '../../utils/logger';
import { calculateDistance, isValidLocation } from '../../utils/location';
import { useSessionStore } from '../sessions/store';
import { useTrackingStore } from './store';

const LOCATION_TASK_NAME = 'background-location-task';
const MIN_MOVEMENT_THRESHOLD = 5; // metros
const MIN_TIME_BETWEEN_UPDATES = 5000; // 5 segundos
const MAX_GAP_SECONDS = 180; // 3 minutos (Cap para evitar picos de tempo)

export const startTracking = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    throw new Error('Permissão de localização negada');
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  try {
    // Tenta o rastreamento de segundo plano (Requisito para o APK final)
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: MIN_MOVEMENT_THRESHOLD,
      timeInterval: 5000,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: "Courier Tracker Ativo",
        notificationBody: "Rastreando sua rota para entrega",
        notificationColor: "#007AFF"
      }
    });
    logger.info('[Tracking] Background location updates started.');
  } catch (error) {
    logger.warn('[Tracking] Background updates failed (likely Expo Go). Falling back to WatchPosition.');

    // Fallback: Rastreamento apenas com app aberto (Para testes no Expo Go)
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: MIN_MOVEMENT_THRESHOLD,
        timeInterval: 3000,
      },
      (location) => {
        processLocationUpdate([location]);
      }
    );

    // Guarda a subscrição para podermos parar depois
    (global as any).foregroundSubscription = subscription;
  }

  useTrackingStore.getState().setIsTracking(true);
};

export const stopTracking = async () => {
  // Para o modo background
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }

  // Para o modo foreground se estiver ativo
  if ((global as any).foregroundSubscription) {
    (global as any).foregroundSubscription.remove();
    (global as any).foregroundSubscription = null;
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
    activeSession = await localDatabase.queryFirst<any>(
      'work_sessions', 
      'WHERE status = "active" ORDER BY created_at DESC'
    );
    // Restore session state if found
    if (activeSession) {
      sessionState.setActiveSession(activeSession);
    }
  }

  if (!activeSession) return;

  // Fetch the current user profile
  const userRow = await localDatabase.queryFirst<{ id: string }>('profiles');
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

      const isMoving = distanceMeters > 3 && (speed === null || speed > 0.2);
      if (isMoving) {
        distanceDeltaKm = distanceMeters / 1000;
      }

      // Cap de tempo para evitar que hiatos longos (ex: app dormindo) 
      // adicionem horas de tempo ativo/ocioso de uma vez.
      const rawDelta = (timestamp - lastLocation.timestamp) / 1000;
      timeDeltaSeconds = Math.min(rawDelta, MAX_GAP_SECONDS);

      // Se o hiato for maior que o cap, ignoramos o tempo para não distorcer as métricas
      if (rawDelta > MAX_GAP_SECONDS) {
        timeDeltaSeconds = 0;
      }
    }

    let idleDelta = 0;
    let activeDelta = 0;
    if (distanceDeltaKm < 0.005) {
      idleDelta = Math.round(timeDeltaSeconds);
    } else {
      activeDelta = Math.round(timeDeltaSeconds);
    }

    // 4. Persistência Atômica
    try {
      const recordedAtIso = new Date(timestamp).toISOString();
      const db = getDb(); // Still need for transaction wrap if needed, but using localDatabase for operations

      await db.withTransactionAsync(async () => {
        // Verifica se o ponto já existe para evitar duplicidade de métricas
        const existing = await localDatabase.queryFirst<{ id: number }>(
          'gps_points',
          'WHERE session_id = ? AND recorded_at = ?',
          [activeSession.id, recordedAtIso]
        );

        if (existing) return;

        // Insere o ponto
        await localDatabase.insertGps(userId, activeSession.id, latitude, longitude, accuracy, speed, recordedAtIso);

        // Atualiza a sessão apenas se houver delta real e o ponto for novo
        if (timeDeltaSeconds > 0 || distanceDeltaKm > 0) {
          await localDatabase.update('work_sessions', activeSession.id, {
            total_distance_km: activeSession.total_distance_km + distanceDeltaKm,
            total_active_seconds: activeSession.total_active_seconds + activeDelta,
            total_idle_seconds: activeSession.total_idle_seconds + idleDelta
          });
        }
      });

      // 5. Atualização do Estado Global (UI) - Apenas após sucesso no DB
      trackingState.setCurrentLocation({ latitude, longitude, accuracy, speed, timestamp });
      sessionState.updateSessionMetrics(distanceDeltaKm, activeDelta, idleDelta);

    } catch (e) {
      console.error('[Tracking] Error in transaction:', e);
    }
  }
};
