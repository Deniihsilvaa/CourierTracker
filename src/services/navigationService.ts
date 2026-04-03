import { Linking, Alert } from 'react-native';
import { logger } from '../utils/logger';

export const navigationService = {
  /**
   * Primary navigation function using Google Maps deep link.
   */
  navigateToAddress: (address: string) => {
    if (!address) {
      logger.warn('[NavigationService] Missing address for navigation');
      Alert.alert('Erro', 'Endereço inválido para navegação.');
      return;
    }

    logger.info(`[NavigationService] Navigating to address: ${address}`);
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;

    Linking.openURL(url).catch((err) => {
      logger.error('[NavigationService] Failed to open Google Maps via Linking', err);
      Alert.alert('Erro', 'Não foi possível encontrar o Google Maps no aparelho.');
    });
  },

  /**
   * Opens an Alert dialog asking the user to choose their preferred navigation app (Waze or Google Maps).
   */
  chooseNavigationApp: (address: string, lat: number | null, lng: number | null) => {
    if (!address) {
      logger.warn('[NavigationService] Missing address for navigation');
      Alert.alert('Erro', 'Endereço inválido para navegação.');
      return;
    }

    Alert.alert(
      'Selecione o Aplicativo',
      'Como você quer navegar para: ' + address,
      [
        {
          text: 'Google Maps',
          onPress: () => navigationService.openGoogleMaps(address),
        },
        {
          text: 'Waze',
          onPress: () => navigationService.openWaze(address, lat, lng),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  },

  openGoogleMaps: (address: string) => {
    logger.info(`[NavigationService] Opening Google Maps for address: ${address}`);
    // Google Maps resolve addresses efficiently via its AI.
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    
    Linking.openURL(url).catch((err) => {
      logger.error('[NavigationService] Failed to open Google Maps via Linking', err);
      Alert.alert('Erro', 'Não foi possível encontrar o Google Maps no aparelho.');
    });
  },

  openWaze: (address: string, lat: number | null, lng: number | null) => {
    logger.info(`[NavigationService] Opening Waze for address: ${address}`);
    
    const encodedAddress = encodeURIComponent(address);
    // Fallback if coordinates are null
    let url = `waze://?q=${encodedAddress}&navigate=yes`;
    
    // Waze supports strict latitude and longitude coordinates natively mapped to texts!
    if (lat && lng) {
      url = `waze://?ll=${lat},${lng}&q=${encodedAddress}&navigate=yes`;
    }

    Linking.openURL(url).catch((err) => {
      logger.error('[NavigationService] Failed to open Waze via Linking', err);
      Alert.alert('Erro', 'O Waze parece não estar instalado neste celular.');
    });
  }
};
