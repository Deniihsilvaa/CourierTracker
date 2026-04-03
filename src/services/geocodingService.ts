import axios from 'axios';
import { logger } from '../utils/logger';

export interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Service to convert an address string into geographic coordinates using Nominatim API.
 */
export const geocodingService = {
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      logger.info(`[Geocoding] Geocoding address: ${address}`);
      const searchQuery = `${address}, Passos, Minas Gerais, Brasil`;

      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchQuery,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'br'
        },
        headers: {
          'User-Agent': 'courier-tracker',
        },
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
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
