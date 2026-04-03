import axios from 'axios';
import { logger } from '../utils/logger';

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Service to convert an address string into geographic coordinates using Nominatim API.
 */
export const geocodingService = {
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      logger.info(`[Geocoding] Geocoding address: ${address}`);
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'CourierTrackerApp/1.0 (Mobile Delivery Route Tracking)',
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          displayName: result.display_name,
        };
      }
      
      logger.warn(`[Geocoding] No results found for address: ${address}`);
      return null;
    } catch (error) {
      logger.error('[Geocoding] Error resolving address', error);
      return null;
    }
  }
};
