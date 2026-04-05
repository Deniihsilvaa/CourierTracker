import * as Location from 'expo-location';
import { create } from 'zustand';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  timestamp: number;
}

interface TrackingState {
  isTracking: boolean;
  currentLocation: Location | null;
  lastSyncTime: number | null;
  setIsTracking: (isTracking: boolean) => void;
  setCurrentLocation: (location: Location) => void;
  setLastSyncTime: (time: number) => void;
  locationSubscription: null,
  setLocationSubscription: (
    sub: Location.LocationSubscription | null
  ) => void
}

export const useTrackingStore = create<TrackingState>((set) => ({
  isTracking: false,
  currentLocation: null,
  lastSyncTime: null,
  locationSubscription: null,

  setIsTracking: (isTracking) => set({ isTracking }),

  setCurrentLocation: (location) => set({ currentLocation: location }),
  setLocationSubscription: (subscription: any) => set({ locationSubscription: subscription }),

  setLastSyncTime: (time) => set({ lastSyncTime: time }),
}));
