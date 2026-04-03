import { v4 as uuidv4 } from 'uuid';
import * as Location from 'expo-location';
import { localDatabase } from './localDatabase';
import { geocodingService } from './geocodingService';
import { calculateDistanceKm } from './distanceService';
import { Route } from '../types/route.types';
import { useSessionStore } from '../modules/sessions/store';
import { logger } from '../utils/logger';

export interface CreateRouteData {
  pickup_location: string;
  delivery_location?: string | null;
  value?: number | null;
  payment_required: boolean;
  client_id?: string;
}

export const routeService = {
  async createManualRoute(data: CreateRouteData): Promise<Route> {
    try {
      logger.info('[RouteService] Creating manual route');
      
      // 1. Geocode pickup (required)
      const pickupGeo = await geocodingService.geocodeAddress(data.pickup_location);
      
      // 2. Geocode delivery (optional)
      let deliveryGeo = null;
      if (data.delivery_location) {
        deliveryGeo = await geocodingService.geocodeAddress(data.delivery_location);
      }

      const activeSession = useSessionStore.getState().activeSession;
      const sessionId = activeSession ? activeSession.id : null;

      const now = new Date().toISOString();
      
      const newRoute: Route = {
        id: uuidv4(),
        session_id: sessionId,
        client_id: data.client_id || null,
        
        pickup_location: data.pickup_location,
        pickup_lat: pickupGeo?.lat ?? null,
        pickup_lng: pickupGeo?.lng ?? null,
        
        delivery_location: data.delivery_location ?? null,
        delivery_lat: deliveryGeo?.lat ?? null,
        delivery_lng: deliveryGeo?.lng ?? null,
        
        value: data.value ?? null,
        
        driver_start_lat: null,
        driver_start_lng: null,
        driver_start_at: null,

        pickup_arrived_lat: null,
        pickup_arrived_lng: null,
        pickup_arrived_at: null,

        delivery_arrived_lat: null,
        delivery_arrived_lng: null,
        delivery_arrived_at: null,

        driver_to_pickup_km: null,
        pickup_to_delivery_km: null,
        
        route_status: 'pending',
        
        payment_required: data.payment_required,
        payment_status: 'pending',
        payment_received_at: null,
        
        created_at: now,
        synced: false
      };

      const sqliteRow = {
        ...newRoute,
        payment_required: newRoute.payment_required ? 1 : 0,
        synced: 0
      };
      await localDatabase.insert('manual_routes', sqliteRow);

      return newRoute;
    } catch (error) {
      logger.error('[RouteService] Error creating manual route:', error);
      throw error;
    }
  },

  async startPickup(routeId: string): Promise<void> {
    try {
      logger.info(`[RouteService] Starting pickup for ${routeId}`);
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });
      const now = new Date().toISOString();

      await localDatabase.update('manual_routes', routeId, {
        route_status: 'going_to_pickup',
        driver_start_lat: location.coords.latitude,
        driver_start_lng: location.coords.longitude,
        driver_start_at: now,
        updated_at: now
      });
      logger.info(`[RouteService] Route ${routeId} status updated to going_to_pickup`);
    } catch (error) {
      logger.error(`[RouteService] Error in startPickup for ${routeId}:`, error);
      // Fallback update status even if GPS fails
      await localDatabase.update('manual_routes', routeId, {
        route_status: 'going_to_pickup',
        updated_at: new Date().toISOString()
      });
    }
  },

  async arriveAtPickup(routeId: string): Promise<void> {
    try {
      logger.info(`[RouteService] Arrived at pickup for ${routeId}`);
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });
      const now = new Date().toISOString();

      const route = await this.getRouteById(routeId);
      let distance = null;
      if (route && route.driver_start_lat && route.driver_start_lng) {
        distance = calculateDistanceKm(
          route.driver_start_lat,
          route.driver_start_lng,
          location.coords.latitude,
          location.coords.longitude
        );
      }

      await localDatabase.update('manual_routes', routeId, {
        route_status: 'pickup_arrived',
        pickup_arrived_lat: location.coords.latitude,
        pickup_arrived_lng: location.coords.longitude,
        pickup_arrived_at: now,
        driver_to_pickup_km: distance,
        updated_at: now
      });
    } catch (error) {
      logger.error(`[RouteService] Error in arriveAtPickup for ${routeId}:`, error);
      await localDatabase.update('manual_routes', routeId, {
        route_status: 'pickup_arrived',
        updated_at: new Date().toISOString()
      });
    }
  },

  async startDelivery(routeId: string): Promise<void> {
    try {
      logger.info(`[RouteService] Starting delivery for ${routeId}`);
      await localDatabase.update('manual_routes', routeId, {
        route_status: 'delivering',
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`[RouteService] Error in startDelivery for ${routeId}:`, error);
      throw error;
    }
  },

  async arriveAtDelivery(routeId: string): Promise<void> {
    try {
      logger.info(`[RouteService] Arrived at delivery for ${routeId}`);
      const location = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced
      });
      const now = new Date().toISOString();

      const route = await this.getRouteById(routeId);
      let distance = null;
      if (route && route.pickup_arrived_lat && route.pickup_arrived_lng) {
        distance = calculateDistanceKm(
          route.pickup_arrived_lat,
          route.pickup_arrived_lng,
          location.coords.latitude,
          location.coords.longitude
        );
      }

      await localDatabase.update('manual_routes', routeId, {
        route_status: 'completed',
        delivery_arrived_lat: location.coords.latitude,
        delivery_arrived_lng: location.coords.longitude,
        delivery_arrived_at: now,
        pickup_to_delivery_km: distance,
        updated_at: now
      });
    } catch (error) {
      logger.error(`[RouteService] Error in arriveAtDelivery for ${routeId}:`, error);
      await localDatabase.update('manual_routes', routeId, {
        route_status: 'completed',
        updated_at: new Date().toISOString()
      });
    }
  },

  async updateDeliveryAddress(routeId: string, address: string): Promise<void> {
    try {
      logger.info(`[RouteService] Updating delivery address for ${routeId}`);
      const geo = await geocodingService.geocodeAddress(address);
      await localDatabase.update('manual_routes', routeId, {
        delivery_location: address,
        delivery_lat: geo?.lat ?? null,
        delivery_lng: geo?.lng ?? null,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`[RouteService] Error updating delivery address for ${routeId}:`, error);
      throw error;
    }
  },

  async updateRouteStatus(routeId: string, status: Route['route_status']): Promise<void> {
    try {
      logger.info(`[RouteService] Updating route status ${routeId} -> ${status}`);
      await localDatabase.update('manual_routes', routeId, { 
        route_status: status,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`[RouteService] Error updating status for ${routeId}:`, error);
      throw error;
    }
  },

  async markPaymentReceived(routeId: string): Promise<void> {
    try {
      logger.info(`[RouteService] Marking payment received for ${routeId}`);
      const now = new Date().toISOString();
      await localDatabase.update('manual_routes', routeId, {
        payment_status: 'paid',
        payment_received_at: now,
        updated_at: now
      });
    } catch (error) {
      logger.error(`[RouteService] Error marking payment received for ${routeId}:`, error);
      throw error;
    }
  },

  async deleteRoute(routeId: string): Promise<void> {
    try {
      logger.info(`[RouteService] Deleting route ${routeId}`);
      await localDatabase.delete('manual_routes', routeId);
    } catch (error) {
      logger.error(`[RouteService] Error deleting route ${routeId}:`, error);
      throw error;
    }
  },

  async getRouteById(routeId: string): Promise<Route | null> {
    try {
      const records = await localDatabase.list<any>('manual_routes', 'WHERE id = ?', [routeId]);
      if (records.length === 0) return null;
      return mapDbRecordToRoute(records[0]);
    } catch (error) {
      logger.error(`[RouteService] Error getting route by id ${routeId}:`, error);
      return null;
    }
  },

  async getRoutesBySession(sessionId: string): Promise<Route[]> {
    try {
      const records = await localDatabase.list<any>('manual_routes', 'WHERE session_id = ?', [sessionId]);
      return records.map(mapDbRecordToRoute);
    } catch (error) {
      logger.error(`[RouteService] Error getting routes by session ${sessionId}:`, error);
      return [];
    }
  },

  async getAllRoutes(): Promise<Route[]> {
    try {
      const records = await localDatabase.list<any>('manual_routes');
      return records.map(mapDbRecordToRoute);
    } catch (error) {
      logger.error('[RouteService] Error getting all routes:', error);
      return [];
    }
  }
};

function mapDbRecordToRoute(r: any): Route {
  return {
    ...r,
    payment_required: Boolean(r.payment_required),
    synced: Boolean(r.synced)
  };
}
