import { Linking, Alert } from 'react-native';
import { logger } from '../utils/logger';

export const navigationService = {
  /**
   * Opens the default map application with directions to the provided address string.
   * This preserves original house number accuracy as Google Maps natively handles the string payload.
   */
  navigateToAddress: (address: string) => {
    if (!address) {
      logger.warn('[NavigationService] Missing address for navigation');
      Alert.alert('Erro', 'Endereço inválido para navegação.');
      return;
    }
    
    logger.info(`[NavigationService] Opening Maps for address: ${address}`);
    
    const encodedAddress = encodeURIComponent(address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
    
    Linking.openURL(url).catch((err) => {
      logger.error('[NavigationService] Failed to open maps via Linking', err);
      Alert.alert('Erro', 'Não foi possível abrir o mapa.');
    });
  }
};
