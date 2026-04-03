import { v4 as uuidv4 } from 'uuid';
import { localDatabase } from './localDatabase';
import { geocodingService } from './geocodingService';
import { calculateDistanceKm } from './distanceService';
import { Route } from '../types/route.types';
import { useSessionStore } from '../modules/sessions/store';
import { logger } from '../utils/logger';

export interface CreateRouteData {
  pickup_location: string;
  delivery_location: string;
  value: number;
  payment_required: boolean;
  client_id?: string;
}

export const routeService = {
  async createManualRoute(data: CreateRouteData): Promise<Route> {
    logger.info('[RouteService] Creating manual route');
    
    // 2. Call geocodeAddress for pickup and delivery
    const [pickupGeo, deliveryGeo] = await Promise.all([
      geocodingService.geocodeAddress(data.pickup_location),
      geocodingService.geocodeAddress(data.delivery_location)
    ]);

    // 3. Calculate distance offline using Haversine formula
    let calculatedDistance: number | null = null;
    if (pickupGeo?.lat && pickupGeo?.lng && deliveryGeo?.lat && deliveryGeo?.lng) {
      calculatedDistance = calculateDistanceKm(
        pickupGeo.lat,
        pickupGeo.lng,
        deliveryGeo.lat,
        deliveryGeo.lng
      );
    }

    // 4. Attach current work_session id
    // We assume useSessionStore returns active session or active Session ID. Check store shape:
    const activeSession = useSessionStore.getState().activeSession;
    const sessionId = activeSession ? activeSession.id : null;

    const now = new Date().toISOString().split('.')[0] + 'Z';
    
    const newRoute: Route = {
      id: uuidv4(),
      session_id: sessionId,
      client_id: data.client_id || null,
      
      pickup_location: data.pickup_location,
      pickup_lat: pickupGeo?.lat ?? null,
      pickup_lng: pickupGeo?.lng ?? null,
      
      delivery_location: data.delivery_location,
      delivery_lat: deliveryGeo?.lat ?? null,
      delivery_lng: deliveryGeo?.lng ?? null,
      
      value: data.value,
      distance_km: calculatedDistance,
      
      route_status: 'pending',
      
      payment_required: data.payment_required,
      payment_status: 'pending',
      payment_received_at: null,
      
      created_at: now,
      synced: false
    };

    // 5. Save route in SQLite
    // Map boolean to SQLite 0/1 properly
    const sqliteRow = {
      ...newRoute,
      payment_required: newRoute.payment_required ? 1 : 0,
      synced: 0
    };
    await localDatabase.insert('manual_routes', sqliteRow);

    // 6. Return route object
    return newRoute;
  },

  async updateRouteStatus(routeId: string, status: Route['route_status']): Promise<void> {
    logger.info(`[RouteService] Updating route status ${routeId} -> ${status}`);
    await localDatabase.update('manual_routes', routeId, { route_status: status });
  },

  async markPaymentReceived(routeId: string): Promise<void> {
    logger.info(`[RouteService] Marking payment received for ${routeId}`);
    const now = new Date().toISOString().split('.')[0] + 'Z';
    await localDatabase.update('manual_routes', routeId, {
      payment_status: 'paid',
      payment_received_at: now
    });
  },

  async deleteRoute(routeId: string): Promise<void> {
    logger.info(`[RouteService] Deleting route ${routeId}`);
    await localDatabase.delete('manual_routes', routeId);
  },

  async getRoutesBySession(sessionId: string): Promise<Route[]> {
    const records = await localDatabase.list<any>('manual_routes', 'WHERE session_id = ?', [sessionId]);
    return records.map(mapDbRecordToRoute);
  },

  async getAllRoutes(): Promise<Route[]> {
    const records = await localDatabase.list<any>('manual_routes');
    // Sort logic handled in the store
    return records.map(mapDbRecordToRoute);
  }
};

function mapDbRecordToRoute(r: any): Route {
  return {
    ...r,
    payment_required: Boolean(r.payment_required),
    synced: Boolean(r.synced)
  };
}
