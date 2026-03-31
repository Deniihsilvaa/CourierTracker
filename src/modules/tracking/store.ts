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
}

export const useTrackingStore = create<TrackingState>((set) => ({
  isTracking: false,
  currentLocation: null,
  lastSyncTime: null,

  setIsTracking: (isTracking) => set({ isTracking }),

  setCurrentLocation: (location) => set({ currentLocation: location }),

  setLastSyncTime: (time) => set({ lastSyncTime: time }),
}));
