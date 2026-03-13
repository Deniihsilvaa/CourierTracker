import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Solicita permissões de notificação de forma robusta.
 * Lida com Android 13+ (POST_NOTIFICATIONS) e permissões negadas.
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Se não tivermos permissão, pedimos agora
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Se o usuário negou, explicamos a importância e oferecemos abrir as configurações
  if (finalStatus !== 'granted') {
    Alert.alert(
      '🔔 Notificações Necessárias',
      'O Courier Tracker utiliza notificações para permitir que você registre coletas e entregas sem precisar abrir o app. Deseja habilitar agora?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Abrir Configurações', 
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          } 
        },
      ]
    );
    return false;
  }

  // Configuração recomendada para garantir que as notificações apareçam em foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  return true;
}
