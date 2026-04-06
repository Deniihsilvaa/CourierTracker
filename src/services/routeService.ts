import { v4 as uuidv4 } from 'uuid';
import * as Location from 'expo-location';
import { localDatabase } from './localDatabase';
import { geocodingService } from './geocodingService';
import { calculateDistanceKm } from './distanceService';
import { Route } from '../types/route.types';
import { useSessionStore } from '../modules/sessions/store';
import { logger } from '../utils/logger';
import { api } from './api';
import { ensureForegroundPermission } from '../utils/location-access';

export interface CreateRouteData {
  pickup_location: string;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  delivery_location?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  value?: number | null;
  payment_required: boolean;
  client_id?: string;
  driver_to_pickup_km?: number | null;
  pickup_to_delivery_km?: number | null;
  estimated_duration_minutes?: number | null;
  route_geometry?: [number, number][] | null;
}

export const routeService = {
  async createManualRoute(data: CreateRouteData): Promise<Route> {
    try {
      logger.info('[RouteService] Creating manual route');
      
      // 1. Geocode pickup (required)
      const pickupGeo =
        data.pickup_lat != null && data.pickup_lng != null
          ? { lat: data.pickup_lat, lng: data.pickup_lng }
          : await geocodingService.geocodeAddress(data.pickup_location);
      
      // 2. Geocode delivery (optional)
      let deliveryGeo = null;
      if (data.delivery_location) {
        deliveryGeo =
          data.delivery_lat != null && data.delivery_lng != null
            ? { lat: data.delivery_lat, lng: data.delivery_lng }
            : await geocodingService.geocodeAddress(data.delivery_location);
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

        driver_to_pickup_km: data.driver_to_pickup_km ?? null,
        pickup_to_delivery_km: data.pickup_to_delivery_km ?? null,
        estimated_duration_minutes: data.estimated_duration_minutes ?? null,
        route_geometry: data.route_geometry ?? null,
        
        route_status: 'pending',
        
        payment_required: data.payment_required,
        payment_status: 'pending',
        payment_received_at: null,
        
        created_at: now,
        synced: false
      };

      const sqliteRow = {
        ...newRoute,
        route_geometry: newRoute.route_geometry ? JSON.stringify(newRoute.route_geometry) : null,
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
      
      const hasPermission = await ensureForegroundPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

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

      const hasPermission = await ensureForegroundPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

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

      const hasPermission = await ensureForegroundPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

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
      const routes = await this.getAllRoutes();
      return routes.find((route) => route.id === routeId) ?? null;
    } catch (error) {
      logger.error(`[RouteService] Error getting route by id ${routeId}:`, error);
      return null;
    }
  },

  async getRoutesBySession(sessionId: string): Promise<Route[]> {
    try {
      const routes = await this.getAllRoutes();
      return routes.filter((route) => route.session_id === sessionId);
    } catch (error) {
      logger.error(`[RouteService] Error getting routes by session ${sessionId}:`, error);
      return [];
    }
  },

  async getAllRoutes(): Promise<Route[]> {
    try {
      const [localRoutes, remoteRoutes] = await Promise.all([
        localDatabase.list<any>('manual_routes').then((records) => records.map(mapDbRecordToRoute)),
        fetchRemoteRoutes(),
      ]);

      return mergeRoutes(localRoutes, remoteRoutes);
    } catch (error) {
      logger.error('[RouteService] Error getting all routes:', error);
      return [];
    }
  }
};

function mapDbRecordToRoute(r: any): Route {
  return {
    ...r,
    route_geometry: typeof r.route_geometry === 'string' && r.route_geometry
      ? JSON.parse(r.route_geometry)
      : r.route_geometry ?? null,
    payment_required: Boolean(r.payment_required),
    synced: Boolean(r.synced)
  };
}

async function fetchRemoteRoutes(): Promise<Route[]> {
  try {
    const { data } = await api.get('/routes/v1/', {
      params: {
        page: 1,
        limit: 100,
      },
    });

    const remoteRoutes = Array.isArray(data?.data) ? data.data : [];
    return remoteRoutes.map(mapRemoteRouteToModel);
  } catch (error: any) {
    logger.warn('[RouteService] Remote routes unavailable, keeping local fallback:', error?.response?.data || error?.message || error);
    return [];
  }
}

function mapRemoteRouteToModel(route: any): Route {
  return {
    id: route.id,
    session_id: route.session_id ?? null,
    client_id: route.client_id ?? null,
    client: route.client
      ? {
          id: route.client.id,
          name: route.client.name,
          address: route.client.address,
          client_type: route.client.client_type ?? null,
        }
      : null,
    pickup_location: route.pickup_location ?? '',
    pickup_lat: asNumber(route.pickup_lat),
    pickup_lng: asNumber(route.pickup_lng),
    delivery_location: route.delivery_location ?? null,
    delivery_lat: asNumber(route.delivery_lat),
    delivery_lng: asNumber(route.delivery_lng),
    value: asNumber(route.value),
    driver_start_lat: asNumber(route.driver_start_lat),
    driver_start_lng: asNumber(route.driver_start_lng),
    driver_start_at: route.driver_start_at ?? null,
    pickup_arrived_lat: asNumber(route.pickup_arrived_lat),
    pickup_arrived_lng: asNumber(route.pickup_arrived_lng),
    pickup_arrived_at: route.pickup_arrived_at ?? null,
    delivery_arrived_lat: asNumber(route.delivery_arrived_lat),
    delivery_arrived_lng: asNumber(route.delivery_arrived_lng),
    delivery_arrived_at: route.delivery_arrived_at ?? null,
    driver_to_pickup_km: asNumber(route.driver_to_pickup_km),
    pickup_to_delivery_km: asNumber(route.pickup_to_delivery_km),
    estimated_duration_minutes: estimateDuration(route),
    route_geometry: normalizeRouteGeometry(route.route_geometry),
    route_status: normalizeRouteStatus(route.route_status),
    payment_required: Boolean(route.payment_required),
    payment_status: normalizePaymentStatus(route.payment_status),
    payment_received_at: route.payment_received_at ?? null,
    created_at: route.created_at ?? new Date().toISOString(),
    updated_at: route.updated_at ?? null,
    deleted_at: route.deleted_at ?? null,
    synced: Boolean(route.synced ?? true),
  };
}

function mergeRoutes(localRoutes: Route[], remoteRoutes: Route[]): Route[] {
  const merged = new Map<string, Route>();

  for (const route of remoteRoutes) {
    merged.set(route.id, route);
  }

  for (const route of localRoutes) {
    const current = merged.get(route.id);
    if (!current || route.synced === false) {
      merged.set(route.id, route);
      continue;
    }

    const localUpdatedAt = new Date(route.updated_at ?? route.created_at).getTime();
    const remoteUpdatedAt = new Date(current.updated_at ?? current.created_at).getTime();
    if (localUpdatedAt >= remoteUpdatedAt) {
      merged.set(route.id, { ...current, ...route });
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime()
  );
}

function normalizeRouteGeometry(geometry: unknown): [number, number][] | null {
  if (!geometry) return null;

  if (typeof geometry === 'string') {
    try {
      const parsed = JSON.parse(geometry);
      return normalizeRouteGeometry(parsed);
    } catch {
      return null;
    }
  }

  if (Array.isArray(geometry)) {
    return geometry
      .map((point) => {
        if (!Array.isArray(point) || point.length < 2) return null;
        const lng = Number(point[0]);
        const lat = Number(point[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return [lng, lat] as [number, number];
      })
      .filter((point): point is [number, number] => point !== null);
  }

  if (typeof geometry === 'object' && Array.isArray((geometry as any).coordinates)) {
    return normalizeRouteGeometry((geometry as any).coordinates);
  }

  return null;
}

function normalizeRouteStatus(status: unknown): Route['route_status'] {
  const validStatuses: Route['route_status'][] = ['pending', 'going_to_pickup', 'pickup_arrived', 'delivering', 'completed', 'cancelled'];
  return validStatuses.includes(status as Route['route_status']) ? (status as Route['route_status']) : 'pending';
}

function normalizePaymentStatus(status: unknown): Route['payment_status'] {
  if (status === 'paid' || status === 'failed') {
    return status;
  }

  return 'pending';
}

function estimateDuration(route: any): number | null {
  const explicitDuration =
    asNumber(route.estimated_duration_minutes) ??
    asNumber(route.estimated_duration_min) ??
    asNumber(route.duration_minutes);

  if (explicitDuration != null) {
    return explicitDuration;
  }

  const durationSeconds = asNumber(route.duration_seconds);
  return durationSeconds != null ? durationSeconds / 60 : null;
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
