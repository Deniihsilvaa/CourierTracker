import * as Location from 'expo-location';
import { logger } from './logger';

/**
 * Ensures foreground location permissions are granted.
 * Checks current status first, then requests if not granted.
 * 
 * @returns {Promise<boolean>} True if permission is granted, false otherwise.
 */
export async function ensureForegroundPermission(): Promise<boolean> {
  try {
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    
    if (currentStatus === 'granted') {
      return true;
    }

    const { status: requestedStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (requestedStatus === 'granted') {
      logger.info('[LocationAccess] Foreground permission granted');
      return true;
    }

    logger.warn('[LocationAccess] Foreground permission denied');
    return false;
  } catch (error) {
    logger.error('[LocationAccess] Error ensuring foreground permission:', error);
    return false;
  }
}

/**
 * Ensures background location permissions are granted.
 * Note: Android requires foreground permission to be granted before background.
 * 
 * @returns {Promise<boolean>} True if permission is granted, false otherwise.
 */
export async function ensureBackgroundPermission(): Promise<boolean> {
  try {
    const { status: currentStatus } = await Location.getBackgroundPermissionsAsync();
    
    if (currentStatus === 'granted') {
      return true;
    }

    const { status: requestedStatus } = await Location.requestBackgroundPermissionsAsync();
    
    if (requestedStatus === 'granted') {
      logger.info('[LocationAccess] Background permission granted');
      return true;
    }

    logger.warn('[LocationAccess] Background permission denied');
    return false;
  } catch (error) {
    logger.error('[LocationAccess] Error ensuring background permission:', error);
    return false;
  }
}
