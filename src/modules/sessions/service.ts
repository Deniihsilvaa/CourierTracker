import { localDatabase } from '@/src/services/localDatabase';
import { api } from '../../services/api';
import { cleanupSyncedData, getDb } from '../../services/sqlite';
import { useAuthStore } from '../auth/store';
import { sessionManager } from '../tracking/session-manager';
import { closeSessionOnApi, updateOfflineSession } from './componentes';
import { useSessionStore } from './store';

/**
 * Starts a new working session.
 * MANDATORY: Must be created on the API first to ensure backend consistency.
 * If API fails, the session is NOT started.
 */
export const startSession = async (startOdometer?: number) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error('Must be logged in to start a session');
  }

  const startTime = new Date().toISOString();

  // 1. Create session on the API (Mandatory)
  try {
    const payload: Record<string, any> = {
      userId: user.id, // Legacy compatibility
      startTime: startTime, // Legacy compatibility
      status: 'open',
    };

    if (startOdometer !== undefined && startOdometer !== null && !isNaN(startOdometer)) {
      payload.startOdometer = Number(startOdometer); // Legacy compatibility
    }

    console.log('[Session Service] Attempting to start session on API...');
    console.log('[Session Service] Payload:', JSON.stringify(payload, null, 2));
    const response = await api.post('/sessions/v1', payload);

    if (!response.data?.success || !response.data.data?.id) {
      throw new Error('Server failed to initialize session');
    }

    const sessionId = response.data.data.id;
    sessionManager.setSessionId(sessionId);
    console.log(`[Session Service] API session created successfully: ${sessionId}`);

    // 2. Save to local SQLite (for offline tracking once started)
    await localDatabase.insertWorkSession(sessionId, user.id, startTime, 1, startOdometer);

    // 3. Set active in Zustand state
    useSessionStore.getState().setActiveSession({
      id: sessionId,
      user_id: user.id,
      start_time: startTime,
      end_time: null,
      total_distance_km: 0,
      total_active_seconds: 0,
      total_idle_seconds: 0,
      status: 'open',
    });

    return sessionId;
  } catch (error: any) {
    console.error('[Session Service] Critical failure starting session:', error.message);

    // Customize error message for UI
    if (error.code === 'ERR_NETWORK') {
      throw new Error('Sem conexão com a internet. É necessário estar online para iniciar seu turno.');
    }
    throw error;
  }
};

export const endSession = async () => {
  const { activeSession, setActiveSession } = useSessionStore.getState();
  if (!activeSession) return;
  const sessionID = activeSession.id;
  const endTime = new Date().toISOString();
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error('Must be logged in to start a session');
  }
  const currentOdometer = useSessionStore.getState().odometer;
  const payload = {
    end_time: endTime,
    status: 'closed' as const,
    end_odometer: currentOdometer ? Number(currentOdometer) : activeSession.start_odometer,
  };
  try {
    setActiveSession(null);
    sessionManager.setSessionId(null);

    await closeSessionOnApi(sessionID, payload);
    await updateOfflineSession(sessionID, payload);
    await cleanupSyncedData();

    console.log(`[Session Service] Session ${sessionID} completed.`);
  } catch (error) {
    console.error('[Session Service] Failed to end session', error);
    throw error;
  }
};

export const fetchSessionData = async (sessionId: string) => {
  try {
    const response = await api.get(`/sessions/v1/${sessionId}`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error: any) {
    // 404 is expected for locally created sessions that haven't synced yet
    if (error.response?.status !== 404) {
      console.warn('[Session Service] Error fetching session details:', error.message);
    }
    return null;
  }
};

export const recoverActiveSession = async () => {
  const user = useAuthStore.getState().user;
  if (!user) return;

  try {
    // 1. Check SQLite first for local active session
    const db = getDb();
    const localSession = await db.getFirstAsync<any>(
      "SELECT * FROM work_sessions WHERE status = 'open' ORDER BY start_time DESC LIMIT 1"
    );

    if (localSession) {
      console.log('[Session Service] Recovered active session from local DB:', localSession.id);
      sessionManager.setSessionId(localSession.id);
      useSessionStore.getState().setActiveSession({
        id: localSession.id,
        user_id: user.id,
        start_time: localSession.start_time,
        end_time: null,
        total_distance_km: localSession.total_distance_km || 0,
        total_active_seconds: localSession.total_active_seconds || 0,
        total_idle_seconds: localSession.total_idle_seconds || 0,
        status: 'open',
      });
      return;
    }

    // 2. Fallback: Check API for an open session using the correct user endpoint
    console.log('[Session Service] Checking API for active sessions...');
    const response = await api.get(`/sessions/v1/user/${user.id}`);

    if (response.data.success && Array.isArray(response.data.data)) {
      // Find session where status is NOT closed/cancelled or has no end_time
      const apiActive = response.data.data.find((s: any) =>
        !s.end_time && (s.status === 'open' || !s.status)
      );

      if (apiActive) {
        console.log('[Session Service] Found active session on API:', apiActive.id);

        // Check if session already exists locally to avoid UNIQUE constraint failure
        const existing = await localDatabase.find('work_sessions' as any, 'WHERE id = ?', [apiActive.id]);

        if (!existing) {
          await localDatabase.insertWorkSession(
            apiActive.id,
            user.id,
            apiActive.start_time || apiActive.startTime || new Date().toISOString(),
            1,
            apiActive.start_odometer || apiActive.startOdometer
          );
        } else {
          // If it exists locally but status was not 'open', align with API
          await localDatabase.update('work_sessions' as any, apiActive.id, { status: 'open' });
        }

        sessionManager.setSessionId(apiActive.id);
        useSessionStore.getState().setActiveSession({
          id: apiActive.id,
          user_id: user.id,
          start_time: apiActive.start_time || apiActive.startTime,
          end_time: null,
          total_distance_km: apiActive.total_distance_km || 0,
          total_active_seconds: apiActive.total_active_seconds || 0,
          total_idle_seconds: apiActive.total_idle_seconds || 0,
          status: 'open',
        });
      }
    }
  } catch (error) {
    console.warn('[Session Service] Failed to recover session from API:', error);
  }
};
export const listSessions = async (isRefreshing = false) => {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const { setHistory, setHistoryLoading, setHistoryRefreshing } = useSessionStore.getState();

  if (isRefreshing) setHistoryRefreshing(true);
  else setHistoryLoading(true);

  try {
    const response = await api.get(`/sessions/v1/user/${user.id}`);
    if (response.data.success && Array.isArray(response.data.data)) {
      setHistory(response.data.data);
    }
  } catch (e) {
    console.error('[Session Service] Failed to load sessions from API', e);
  } finally {
    setHistoryLoading(false);
    setHistoryRefreshing(false);
  }
};

export const deleteSession = async (sessionId: string) => {
  const { setActiveSession } = useSessionStore.getState();
  
  try {
    // 1. Delete on API
    await deleteSessionOnApi(sessionId);
    
    // 2. Cleanup local state if it's the active one
    const active = useSessionStore.getState().activeSession;
    if (active?.id === sessionId) {
      setActiveSession(null);
      sessionManager.setSessionId(null);
    }

    // 3. Cleanup local database
    await localDatabase.delete('work_sessions', [sessionId] as any);
    await localDatabase.delete('gps_points',[sessionId] as any);
    
    console.log(`[Session Service] Session ${sessionId} deleted successfully.`);
  } catch (error) {
    console.error('[Session Service] Failed to delete session', error);
    throw error;
  }
};

export const deleteSessionOnApi = async (sessionId: string) => {
  try {
    const response = await api.delete(`/sessions/v1/${sessionId}`);
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('[Session Service] Failed to delete session', error);
    throw error;
  }
};