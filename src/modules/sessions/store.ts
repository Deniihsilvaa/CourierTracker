import { SessionState } from '@/src/types/stores';
import { create } from 'zustand';


export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  sessionDuration: '00:00:00',
  odometer: '',
  isLoading: false,

  setActiveSession: (session) => set({
    activeSession: session,
    sessionDuration: session ? stateToDuration(session.start_time) : '00:00:00',
    odometer: session?.start_odometer ? String(session.start_odometer) : '',
  }),

  setSessionDuration: (duration) => set({ sessionDuration: duration }),
  setOdometer: (v) => set({ odometer: v }),
  setIsLoading: (v) => set({ isLoading: v }),

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
