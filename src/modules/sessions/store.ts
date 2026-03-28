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
  sessionDuration: string; // "00:00:00" format
  setActiveSession: (session: WorkSession | null) => void;
  setSessionDuration: (duration: string) => void;
  updateSessionMetrics: (distanceDeltaKm: number, activeDeltaSec: number, idleDeltaSec: number) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  sessionDuration: '00:00:00',
  
  setActiveSession: (session) => set({ 
    activeSession: session,
    sessionDuration: session ? stateToDuration(session.start_time) : '00:00:00'
  }),

  setSessionDuration: (duration) => set({ sessionDuration: duration }),
  
  updateSessionMetrics: (distanceDeltaKm, activeDeltaSec, idleDeltaSec) => set((state) => {
    if (!state.activeSession) return state;
    
    return {
      activeSession: {
        ...state.activeSession,
        total_distance_km: state.activeSession.total_distance_km + distanceDeltaKm,
        total_active_seconds: (state.activeSession.total_active_seconds || 0) + activeDeltaSec,
        total_idle_seconds: (state.activeSession.total_idle_seconds || 0) + idleDeltaSec,
      }
    };
  }),
}));

function stateToDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  if (isNaN(start)) return '00:00:00';
  const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
