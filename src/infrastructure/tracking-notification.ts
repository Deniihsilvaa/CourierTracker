import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { AppState, Platform } from 'react-native';
import { createRouteEvent } from '../modules/tracking/routeEventService';
import { logger } from '../utils/logger';

// Categorias e Ações
const TRACKING_CATEGORY_ID = 'tracking-actions';
const TRACKING_NOTIFICATION_ID = 'tracking-session-notification';

export const ACTION_PICKUP = 'ACTION_PICKUP';
export const ACTION_DROPOFF = 'ACTION_DROPOFF';
export const ACTION_WAITING = 'ACTION_WAITING';

let isHandlingAction = false;

/** Configura as categorias de notificação com botões de ação */
export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync(TRACKING_CATEGORY_ID, [
    {
      identifier: ACTION_PICKUP,
      buttonTitle: '📦 Coleta',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: ACTION_DROPOFF,
      buttonTitle: '🏁 Entrega',
      options: {
        opensAppToForeground: false,
      },
    },
    {
      identifier: ACTION_WAITING,
      buttonTitle: '⏳ Aguardando',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

/** Inicia a notificação persistente com botões de ação */
export async function startTrackingNotification(sessionId: string, userId: string) {
  try {
    await setupNotificationCategories();

    await Notifications.presentNotificationAsync({
      identifier: TRACKING_NOTIFICATION_ID,
      content: {
        title: '🚚 Courier Tracker Ativo',
        body: 'Use os botões abaixo para registrar eventos rápidos.',
        categoryIdentifier: TRACKING_CATEGORY_ID,
        sticky: true,
        autoDismiss: false,
        data: { sessionId, userId },
      },
      trigger: null,
    });
  } catch (error) {
    logger.error('[Notification] Error starting tracking notification', { error });
  }
}

/** Remove a notificação persistente */
export async function stopTrackingNotification() {
  await Notifications.dismissNotificationAsync(TRACKING_NOTIFICATION_ID);
}

/** Processa a ação da notificação */
export async function handleNotificationAction(response: Notifications.NotificationResponse) {
  if (isHandlingAction) return;
  
  const actionId = response.actionIdentifier;
  
  // Ignora se for o toque padrão na notificação (não um botão)
  if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) return;

  const { sessionId, userId } = response.notification.request.content.data;

  if (!sessionId || !userId) {
    logger.error('[Notification] Missing sessionId or userId in notification data');
    return;
  }

  let eventType: 'pickup' | 'dropoff' | 'waiting' | null = null;

  switch (actionId) {
    case ACTION_PICKUP:
      eventType = 'pickup';
      break;
    case ACTION_DROPOFF:
      eventType = 'dropoff';
      break;
    case ACTION_WAITING:
      eventType = 'waiting';
      break;
  }

  if (eventType) {
    try {
      isHandlingAction = true;
      
      // Feedback tátil se estiver em foreground
      if (AppState.currentState === 'active') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await createRouteEvent(sessionId, userId, eventType);
      logger.info(`[Notification] Route event created: ${eventType}`);

      // Atualiza a mesma notificação para mostrar o último evento (e manter persistente)
      await Notifications.presentNotificationAsync({
        identifier: TRACKING_NOTIFICATION_ID,
        content: {
          title: '🚚 Courier Tracker Ativo',
          body: `Último registro: ${getLabel(eventType)} às ${new Date().toLocaleTimeString()}`,
          categoryIdentifier: TRACKING_CATEGORY_ID,
          sticky: true,
          autoDismiss: false,
          data: { sessionId, userId },
        },
        trigger: null,
      });

    } catch (error) {
      logger.error('[Notification] Error handling action', { error });
    } finally {
      isHandlingAction = false;
    }
  }
}

function getLabel(type: string) {
  switch (type) {
    case 'pickup': return 'Coleta';
    case 'dropoff': return 'Entrega';
    case 'waiting': return 'Aguardando';
    default: return type;
  }
}
