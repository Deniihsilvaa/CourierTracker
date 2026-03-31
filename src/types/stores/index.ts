
export type SessionStatus = 'open' | 'closed';
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
    start_odometer?: number;
}

export interface SessionState {
    activeSession: WorkSession | null;
    sessionDuration: string; // "00:00:00" format
    odometer: string;
    isLoading: boolean;
    setActiveSession: (session: WorkSession | null) => void;
    setSessionDuration: (duration: string) => void;
    setOdometer: (v: string) => void;
    setIsLoading: (v: boolean) => void;
    updateSessionMetrics: (distanceDeltaKm: number, activeDeltaSec: number, idleDeltaSec: number) => void;
}