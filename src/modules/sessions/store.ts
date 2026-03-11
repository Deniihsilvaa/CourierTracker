import { create } from 'zustand';

export type SessionStatus = 'active' | 'completed';
export type TripStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkSession {
  id: string;
  user_id?: string;
  start_time: string;
  end_time: string | null;
  total_distance_km: number;
  total_active_seconds: number;
  total_idle_seconds: number;
  status: SessionStatus;
}

interface SessionState {
  activeSession: WorkSession | null;
  setActiveSession: (session: WorkSession | null) => void;
  updateSessionMetrics: (distanceDeltaKm: number, activeDeltaSec: number, idleDeltaSec: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  
  setActiveSession: (session) => set({ activeSession: session }),
  
  updateSessionMetrics: (distanceDeltaKm, activeDeltaSec, idleDeltaSec) => set((state) => {
    if (!state.activeSession) return state;
    
    return {
      activeSession: {
        ...state.activeSession,
        total_distance_km: state.activeSession.total_distance_km + distanceDeltaKm,
        total_active_seconds: state.activeSession.total_active_seconds + activeDeltaSec,
        total_idle_seconds: state.activeSession.total_idle_seconds + idleDeltaSec,
      }
    };
  }),
}));
