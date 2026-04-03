import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Route } from '../types/route.types';
import { localDatabase } from '../services/localDatabase';
import { routesApi } from '../services/routesApi';

interface RouteState {
  routes: Route[];
  isLoading: boolean;
  
  // Actions
  loadRoutes: () => Promise<void>;
  addRoute: (route: Omit<Route, 'id' | 'created_at' | 'synced'>) => Promise<void>;
  removeRoute: (id: string) => Promise<void>;
  updateRouteStatus: (id: string, status: Route['status']) => Promise<void>;
  syncRoutes: () => Promise<void>;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  isLoading: false,

  loadRoutes: async () => {
    set({ isLoading: true });
    try {
      const storedRoutes = await localDatabase.list<any>('manual_routes');
      // Map SQLite integer 'synced' to boolean
      const parsedRoutes = storedRoutes.map(r => ({
        ...r,
        synced: Boolean(r.synced)
      }));
      
      // Sort routes: newest first
      parsedRoutes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      set({ routes: parsedRoutes, isLoading: false });
    } catch (e) {
      console.error('Failed to load routes from local DB', e);
      set({ isLoading: false });
    }
  },

  addRoute: async (routeData) => {
    const now = new Date().toISOString().split('.')[0] + 'Z';
    const newRoute: Route = {
      ...routeData,
      id: uuidv4(),
      created_at: now,
      synced: false
    };

    // Save locally
    await localDatabase.insert('manual_routes', { ...newRoute, synced: 0 });
    
    // Update local state
    set((state) => ({ routes: [newRoute, ...state.routes] }));
  },

  removeRoute: async (id) => {
    // Soft delete locally
    await localDatabase.delete('manual_routes', id);
    set((state) => ({ routes: state.routes.filter(r => r.id !== id) }));
  },

  updateRouteStatus: async (id, status) => {
    await localDatabase.update('manual_routes', id, { status });
    set((state) => ({
      routes: state.routes.map(r => r.id === id ? { ...r, status } : r)
    }));
  },

  syncRoutes: async () => {
    const { routes } = get();
    const unsynced = routes.filter(r => !r.synced);
    if (unsynced.length === 0) return;

    try {
      await routesApi.syncRoutes(unsynced);
      // Mark as synced locally
      for (const route of unsynced) {
        await localDatabase.update('manual_routes', route.id, { synced: 1 });
      }
      // Reload to reflect changes
      await get().loadRoutes();
    } catch (e) {
      console.error('Failed to sync routes', e);
    }
  }
}));
