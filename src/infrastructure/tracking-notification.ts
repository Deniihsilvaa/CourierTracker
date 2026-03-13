import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { AppState, Platform } from 'react-native';
import { createRouteEvent } from '../modules/tracking/routeEventService';
import { logger } from '../utils/logger';
import { getDb } from '../services/sqlite';

// Categorias e Ações
const TRACKING_CATEGORY_ID_ACTIVE = 'tracking-active';
const TRACKING_CATEGORY_ID_PAUSED = 'tracking-paused';
const TRACKING_NOTIFICATION_ID = 'tracking-session-notification';

export const ACTION_PICKUP = 'ACTION_PICKUP';
export const ACTION_DROPOFF = 'ACTION_DROPOFF';
export const ACTION_WAITING = 'ACTION_WAITING';
export const ACTION_PAUSE = 'ACTION_PAUSE';
export const ACTION_RESUME = 'ACTION_RESUME';

let isHandlingAction = false;
let metricsInterval: NodeJS.Timeout | null = null;

/** Configura as categorias de notificação com botões de ação */
export async function setupNotificationCategories() {
  // Categoria para Sessão Ativa
  await Notifications.setNotificationCategoryAsync(TRACKING_CATEGORY_ID_ACTIVE, [
    {
      identifier: ACTION_PICKUP,
      buttonTitle: '📦 Coleta',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_DROPOFF,
      buttonTitle: '🏁 Entrega',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_WAITING,
      buttonTitle: '⏳ Aguardando',
      options: { opensAppToForeground: false },
    },
    {
      identifier: ACTION_PAUSE,
      buttonTitle: '⏸️ Pausar',
      options: { opensAppToForeground: false },
    },
  ]);

  // Categoria para Sessão Pausada
  await Notifications.setNotificationCategoryAsync(TRACKING_CATEGORY_ID_PAUSED, [
    {
      identifier: ACTION_RESUME,
      buttonTitle: '▶️ Retomar',
      options: { opensAppToForeground: false },
    },
  ]);
}

/** Obtém as métricas atuais da sessão do SQLite */
async function getSessionMetrics(sessionId: string) {
  try {
    const db = getDb();
    const session = await db.getFirstAsync<any>(
      'SELECT total_distance_km, total_active_seconds FROM work_sessions WHERE id = ?',
      [sessionId]
    );
    
    const eventCount = await db.getFirstAsync<any>(
      'SELECT COUNT(*) as count FROM route_events WHERE session_id = ?',
      [sessionId]
    );

    return {
      distance: session?.total_distance_km || 0,
      time: session?.total_active_seconds || 0,
      events: eventCount?.count || 0
    };
  } catch (error) {
    logger.error('[Notification] Error fetching metrics', { error });
    return null;
  }
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Atualiza o conteúdo da notificação com métricas dinâmicas */
export async function updateTrackingNotificationMetrics(sessionId: string, userId: string, isPaused: boolean = false) {
  const metrics = await getSessionMetrics(sessionId);
  if (!metrics) return;

  const body = `📍 ${metrics.distance.toFixed(2)} km  ·  ⏱️ ${formatDuration(metrics.time)}\n📦 Eventos: ${metrics.events}`;

  await Notifications.presentNotificationAsync({
    identifier: TRACKING_NOTIFICATION_ID,
    content: {
      title: isPaused ? '⏸️ Sessão Pausada' : '🚚 Courier Tracker Ativo',
      body: isPaused ? 'Toque em Retomar para continuar o rastreamento.' : body,
      categoryIdentifier: isPaused ? TRACKING_CATEGORY_ID_PAUSED : TRACKING_CATEGORY_ID_ACTIVE,
      sticky: true,
      autoDismiss: false,
      data: { sessionId, userId, isPaused },
    },
    trigger: null,
  });
}

/** Inicia a notificação persistente e o loop de atualização de métricas */
export async function startTrackingNotification(sessionId: string, userId: string) {
  try {
    await setupNotificationCategories();
    
    // Primeira exibição
    await updateTrackingNotificationMetrics(sessionId, userId);

    // Inicia loop de atualização a cada 30 segundos
    if (metricsInterval) clearInterval(metricsInterval);
    metricsInterval = setInterval(() => {
      updateTrackingNotificationMetrics(sessionId, userId);
    }, 30000);

  } catch (error) {
    logger.error('[Notification] Error starting tracking notification', { error });
  }
}

/** Remove a notificação persistente e para o loop */
export async function stopTrackingNotification() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
  await Notifications.dismissNotificationAsync(TRACKING_NOTIFICATION_ID);
}

/** Processa a ação da notificação */
export async function handleNotificationAction(response: Notifications.NotificationResponse) {
  if (isHandlingAction) return;
  
  const actionId = response.actionIdentifier;
  if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) return;

  const { sessionId, userId } = response.notification.request.content.data;
  if (!sessionId || !userId) return;

  try {
    isHandlingAction = true;
    
    if (AppState.currentState === 'active') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Importação dinâmica para evitar dependência circular
    const { pauseTrackingSession, resumeTrackingSession } = require('../modules/tracking/service');

    switch (actionId) {
      case ACTION_PICKUP:
        await createRouteEvent(sessionId, userId, 'pickup');
        break;
      case ACTION_DROPOFF:
        await createRouteEvent(sessionId, userId, 'dropoff');
        break;
      case ACTION_WAITING:
        await createRouteEvent(sessionId, userId, 'waiting');
        break;
      case ACTION_PAUSE:
        await pauseTrackingSession();
        return; // O pauseTrackingSession já atualiza a notificação
      case ACTION_RESUME:
        await resumeTrackingSession();
        return; // O resumeTrackingSession já atualiza a notificação
    }

    // Atualiza métricas após qualquer ação de evento
    await updateTrackingNotificationMetrics(sessionId, userId);

  } catch (error) {
    logger.error('[Notification] Error handling action', { error });
  } finally {
    isHandlingAction = false;
  }
}

function getLabel(type: string) {
  switch (type) {
    case 'pickup': return 'Coleta';
    case 'dropoff': return 'Entrega';
    case 'waiting': return 'Aguardando';
    case 'pause': return 'Pausa';
    case 'resume': return 'Retomada';
    default: return type;
  }
}
