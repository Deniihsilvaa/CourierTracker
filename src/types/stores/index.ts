
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
    
    // History State
    history: WorkSession[];
    loading: boolean;
    refreshing: boolean;
    timeFilter: '7d' | '30d' | 'all';

    setActiveSession: (session: WorkSession | null) => void;
    setSessionDuration: (duration: string) => void;
    setOdometer: (v: string) => void;
    setIsLoading: (v: boolean) => void;
    updateSessionMetrics: (distanceDeltaKm: number, activeDeltaSec: number, idleDeltaSec: number) => void;
    
    // History Actions
    setHistory: (history: WorkSession[]) => void;
    setHistoryLoading: (loading: boolean) => void;
    setHistoryRefreshing: (refreshing: boolean) => void;
    setTimeFilter: (filter: '7d' | '30d' | 'all') => void;
}

export interface FinancialAnalytics {
  day_date: string;
  total_income: number;
  total_expenses: number;
  total_fuel: number;
  total_costs: number;
  net_profit: number;
  profit_margin: number;
}

export interface AnalyticsState {
  financials: FinancialAnalytics | null;
  isLoading: boolean;
  error: string | null;
  setFinancials: (data: FinancialAnalytics | null) => void;
  setIsLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  fetchFinancialSummary: (groupBy?: "day" | "week" | "month") => Promise<void>;
}