import { create } from 'zustand';
import { Route } from '../types/route.types';
import { routeService, CreateRouteData } from '../services/routeService';

interface RouteState {
  routes: Route[];
  isLoading: boolean;
  
  // Actions
  loadRoutes: () => Promise<void>;
  addRoute: (data: CreateRouteData) => Promise<void>;
  removeRoute: (id: string) => Promise<void>;
  updateRouteStatus: (id: string, status: Route['route_status']) => Promise<void>;
  
  // New actions
  startPickup: (id: string) => Promise<void>;
  arriveAtPickup: (id: string) => Promise<void>;
  startDelivery: (id: string) => Promise<void>;
  arriveAtDelivery: (id: string) => Promise<void>;
  updateDeliveryAddress: (id: string, address: string) => Promise<void>;
  markPaymentReceived: (id: string) => Promise<void>;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  isLoading: false,

  loadRoutes: async () => {
    set({ isLoading: true });
    try {
      const parsedRoutes = await routeService.getAllRoutes();
      set({ routes: parsedRoutes, isLoading: false });
    } catch (e) {
      console.error('Failed to load routes from local DB', e);
      set({ isLoading: false });
    }
  },

  addRoute: async (data: CreateRouteData) => {
    const newRoute = await routeService.createManualRoute(data);
    set((state) => ({ routes: [newRoute, ...state.routes] }));
  },

  removeRoute: async (id: string) => {
    await routeService.deleteRoute(id);
    set((state) => ({ routes: state.routes.filter(r => r.id !== id) }));
  },

  updateRouteStatus: async (id: string, status: Route['route_status']) => {
    await routeService.updateRouteStatus(id, status);
    const updatedRoutes = await routeService.getAllRoutes();
    set({ routes: updatedRoutes });
  },

  startPickup: async (id: string) => {
    await routeService.startPickup(id);
    await get().loadRoutes();
  },

  arriveAtPickup: async (id: string) => {
    await routeService.arriveAtPickup(id);
    await get().loadRoutes();
  },

  startDelivery: async (id: string) => {
    await routeService.startDelivery(id);
    await get().loadRoutes();
  },

  arriveAtDelivery: async (id: string) => {
    await routeService.arriveAtDelivery(id);
    await get().loadRoutes();
  },

  updateDeliveryAddress: async (id: string, address: string) => {
    await routeService.updateDeliveryAddress(id, address);
    await get().loadRoutes();
  },

  markPaymentReceived: async (id: string) => {
    await routeService.markPaymentReceived(id);
    await get().loadRoutes();
  }
}));
