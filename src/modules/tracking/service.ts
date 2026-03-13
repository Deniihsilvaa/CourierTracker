import * as Location from 'expo-location';
import { getDb } from '../../services/sqlite';
import 'react-native-get-random-values';
import { localDatabase } from '../../services/localDatabase';
import { logger } from '../../utils/logger';
import { calculateDistance, isValidLocation } from '../../utils/location';
import { useSessionStore } from '../sessions/store';
import { useTrackingStore } from './store';
import { startTrackingNotification, stopTrackingNotification } from '../../infrastructure/tracking-notification';

const LOCATION_TASK_NAME = 'background-location-task';
const MIN_MOVEMENT_THRESHOLD = 5; // metros
const MIN_TIME_BETWEEN_UPDATES = 5000; // 5 segundos
const MAX_GAP_SECONDS = 180; // 3 minutos (Cap para evitar picos de tempo)
const MAX_REASONABLE_SPEED_MPS = 40; // 144 km/h (acima disso costuma ser salto de GPS)
const MAX_REASONABLE_JUMP_METERS = 300; // cap extra para jumps em poucos segundos

export const startTracking = async () => {
  const session = useSessionStore.getState().activeSession;
  if (!session) {
    logger.error('[Tracking] Cannot start tracking without active session');
    return;
  }

  // Proteção: não iniciar tracking se já estiver rodando
  try {
    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyRunning) {
      logger.warn('[Tracking] startTracking called but task already running.');
      useTrackingStore.getState().setIsTracking(true);
      
      // Garante que a notificação de ações rápidas também esteja rodando
      await startTrackingNotification(session.id, session.user_id!);
      return;
    }
  } catch (e) {
    // ignore
  }

  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    throw new Error('Permissão de localização negada');
  }

  await Location.requestBackgroundPermissionsAsync();

  try {
    // Tenta o rastreamento de segundo plano (Requisito para o APK final)
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
    logger.info('[Tracking] Background location updates started.');
    
    // Inicia a notificação persistente com botões de ação
    await startTrackingNotification(session.id, session.user_id!);

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

    // Inicia a notificação persistente com botões de ação mesmo no fallback
    await startTrackingNotification(session.id, session.user_id!);
  }

  useTrackingStore.getState().setIsTracking(true);
};

/** Atualiza o texto da notificação persistente com métricas ao vivo */
const updateTrackingNotification = async (distanceKm: number, activeSeconds: number) => {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (!isRunning) return;

    const hours = Math.floor(activeSeconds / 3600);
    const minutes = Math.floor((activeSeconds % 3600) / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    const kmStr = distanceKm.toFixed(2);

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: MIN_MOVEMENT_THRESHOLD,
      timeInterval: 5000,
      showsBackgroundLocationIndicator: true,
      activityType: Location.ActivityType.AutomotiveNavigation,
      foregroundService: {
        notificationTitle: "🚛 Courier Tracker Ativo",
        notificationBody: `📍 ${kmStr} km  ·  ⏱ ${timeStr} em movimento`,
        notificationColor: "#007AFF",
      }
    });
  } catch (e) {
    // Silently fails if not in background mode
  }
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

  // Para a notificação de ações rápidas
  await stopTrackingNotification();

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
  const session = activeSession;

  // Fonte da verdade: user_id vem da sessão ativa (evita null em background)
  const userId = (session as any).user_id ?? null;

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

      const rawDelta = (timestamp - lastLocation.timestamp) / 1000;

      // Se o app ficou muito tempo sem atualizar, tratamos como "reacquire" do GPS:
      // gravamos o ponto, mas NÃO somamos distância/tempo para evitar picos ao voltar do background.
      if (rawDelta > MAX_GAP_SECONDS) {
        logger.warn('[Tracking] Large gap detected, ignoring distance/time deltas', {
          rawDeltaSeconds: rawDelta,
          distanceMeters,
          last: { lat: lastLocation.latitude, lon: lastLocation.longitude, ts: lastLocation.timestamp },
          curr: { lat: latitude, lon: longitude, ts: timestamp },
        });
        distanceDeltaKm = 0;
        timeDeltaSeconds = 0;
      } else {
        // Proteção contra saltos de GPS: velocidade implícita absurda ou jump grande demais
        const impliedSpeed = rawDelta > 0 ? distanceMeters / rawDelta : Infinity;
        if (distanceMeters > MAX_REASONABLE_JUMP_METERS || impliedSpeed > MAX_REASONABLE_SPEED_MPS) {
          logger.warn('[Tracking] GPS jump detected, ignoring distance delta', {
            distanceMeters,
            rawDeltaSeconds: rawDelta,
            impliedSpeedMps: impliedSpeed,
            last: { lat: lastLocation.latitude, lon: lastLocation.longitude, ts: lastLocation.timestamp },
            curr: { lat: latitude, lon: longitude, ts: timestamp },
          });
          distanceDeltaKm = 0;
          timeDeltaSeconds = Math.min(rawDelta, MAX_GAP_SECONDS);
        } else {
          const isMoving = distanceMeters > 3 && (speed === null || speed > 0.2);
          if (isMoving) {
            distanceDeltaKm = distanceMeters / 1000;
          }

          // Cap de tempo para evitar picos
          timeDeltaSeconds = Math.min(rawDelta, MAX_GAP_SECONDS);
        }
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
          [session.id, recordedAtIso]
        );

        if (existing) return;

        // Insere o ponto
        await localDatabase.insertGps(userId, session.id, latitude, longitude, accuracy, speed, recordedAtIso);

        // Atualiza a sessão apenas se houver delta real e o ponto for novo
        if (timeDeltaSeconds > 0 || distanceDeltaKm > 0) {
          await localDatabase.update('work_sessions', session.id, {
            total_distance_km: session.total_distance_km + distanceDeltaKm,
            total_active_seconds: session.total_active_seconds + activeDelta,
            total_idle_seconds: session.total_idle_seconds + idleDelta
          });
        }
      });

      // 5. Atualização do Estado Global (UI) - Apenas após sucesso no DB
      trackingState.setCurrentLocation({ latitude, longitude, accuracy, speed, timestamp });
      sessionState.updateSessionMetrics(distanceDeltaKm, activeDelta, idleDelta);

      // 6. Atualiza o texto da notificação persistente com métricas ao vivo
      const updatedSession = useSessionStore.getState().activeSession;
      if (updatedSession) {
        updateTrackingNotification(
          updatedSession.total_distance_km,
          updatedSession.total_active_seconds
        );
      }

    } catch (e) {
      console.error('[Tracking] Error in transaction:', e);
    }
  }
};
