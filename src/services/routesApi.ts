import { Route } from '../types/route.types';

// Placeholder API Service for future integration
export const routesApi = {
  async createRoute(route: Route): Promise<Route> {
    console.log('[API] createRoute placeholder called with:', route);
    // Return mocked response for now
    return { ...route, synced: true };
  },

  async syncRoutes(routes: Route[]): Promise<boolean> {
    console.log('[API] syncRoutes placeholder called with:', routes);
    return true;
  },

  async deleteRoute(routeId: string): Promise<boolean> {
    console.log('[API] deleteRoute placeholder called with:', routeId);
    return true;
  },

  async updateRouteStatus(routeId: string, status: Route['status']): Promise<boolean> {
    console.log('[API] updateRouteStatus placeholder called with:', routeId, status);
    return true;
  }
};
