import { localDatabase } from '@/src/services/localDatabase';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../services/api';
import { getDb } from '../../services/sqlite';
import { useAuthStore } from '../auth/store';
import { useSessionStore } from './store';

export const startSession = async (startOdometer?: number) => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error('Must be logged in to start a session');
  }

  let sessionId = uuidv4();
  const startTime = new Date().toISOString();
  let synced = 0;

  // 1. Try to create session on the API first
  try {
    const payload: Record<string, any> = {
      userId: user.id,
      startTime,
      status: 'open',
    };
    if (startOdometer !== undefined && startOdometer !== null && !isNaN(startOdometer)) {
      payload.startOdometer = startOdometer;
    }
    console.debug('[Session Service] POST payload:', payload);

    const response = await api.post('/sessions/v1', payload);
    if (response.data?.success && response.data.data?.id) {
      sessionId = response.data.data.id;
      synced = 1;
      console.log(`[Session Service] API session created: ${sessionId}`);
    }
  } catch (apiError) {
    console.warn('[Session Service] API call failed, will save locally only', apiError);
  }

  // 2. Save to local SQLite
  try {
    await localDatabase.insertWorkSession(sessionId, user.id, startTime, synced, startOdometer);

    // 3. Set active in Zustand state
    useSessionStore.getState().setActiveSession({
      id: sessionId,
      user_id: user.id,
      start_time: startTime,
      end_time: null,
      total_distance_km: 0,
      total_active_seconds: 0,
      total_idle_seconds: 0,
      status: 'active',
    });

    console.log(`[Session Service] Session ${sessionId} started (synced=${synced}).`);
  } catch (error) {
    console.error('[Session Service] Failed to start session locally', error);
    throw error;
  }
};

export const endSession = async () => {
  const { activeSession, setActiveSession } = useSessionStore.getState();
  if (!activeSession) return;

  const db = getDb();
  const endTime = new Date().toISOString();

  try {
    // 1. Notify API (PUT) to close the session
    try {
      const payload = {
        end_time: endTime,
        status: 'completed',
        total_distance_km: activeSession.total_distance_km,
        total_active_seconds: activeSession.total_active_seconds,
        total_idle_seconds: activeSession.total_idle_seconds,
      };
      
      console.log(`[Session Service] Closing session ${activeSession.id} on API...`);
      await api.put(`/sessions/v1/${activeSession.id}`, payload);
    } catch (apiError) {
      console.warn('[Session Service] API close failed, session will be synced later', apiError);
    }

    // 2. Update offline session record
    await db.runAsync(
      `UPDATE work_sessions SET end_time = ?, status = 'completed', synced = 0 WHERE id = ?`,
      [endTime, activeSession.id]
    );

    // 3. Create a Trip record summarizing this session
    const sessionData = await db.getFirstAsync<any>(
      'SELECT * FROM work_sessions WHERE id = ?',
      [activeSession.id]
    );

    if (sessionData) {
      const tripId = uuidv4();
      const duration = Math.round((new Date(endTime).getTime() - new Date(sessionData.start_time).getTime()) / 1000);

      await db.runAsync(
        `INSERT INTO trips (id, session_id, user_id, distance_km, duration_seconds, start_time, end_time, status, synced) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', 0)`,
        [tripId, sessionData.id, sessionData.user_id, sessionData.total_distance_km, duration, sessionData.start_time, endTime]
      );
      
      await db.runAsync(
        `UPDATE gps_points SET trip_id = ?, synced = 0 WHERE session_id = ? AND (trip_id IS NULL OR trip_id = '')`,
        [tripId, sessionData.id]
      );
    }

    // 4. Clear global state
    setActiveSession(null);
    console.log(`Session ${activeSession.id} ended successfully.`);
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
  } catch (error) {
    console.error('[Session Service] Error fetching session:', error);
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
      "SELECT * FROM work_sessions WHERE status = 'active' OR status = 'open' ORDER BY start_time DESC LIMIT 1"
    );

    if (localSession) {
      console.log('[Session Service] Recovered active session from local DB:', localSession.id);
      useSessionStore.getState().setActiveSession({
        id: localSession.id,
        user_id: user.id,
        start_time: localSession.start_time,
        end_time: null,
        total_distance_km: localSession.total_distance_km || 0,
        total_active_seconds: localSession.total_active_seconds || 0,
        total_idle_seconds: localSession.total_idle_seconds || 0,
        status: 'active',
      });
      return;
    }

    // 2. Fallback: Check API for an open session using the correct user endpoint
    console.log('[Session Service] Checking API for active sessions...');
    const response = await api.get(`/sessions/v1/user/${user.id}`);
    
    if (response.data.success && Array.isArray(response.data.data)) {
      // Find session where status is NOT completed/cancelled or has no end_time
      const apiActive = response.data.data.find((s: any) => 
        !s.end_time && (s.status === 'open' || s.status === 'active' || !s.status)
      );
      
      if (apiActive) {
        console.log('[Session Service] Found active session on API:', apiActive.id);
        
        await localDatabase.insertWorkSession(
          apiActive.id, 
          user.id, 
          apiActive.start_time || apiActive.startTime || new Date().toISOString(), 
          1, 
          apiActive.start_odometer || apiActive.startOdometer
        );

        useSessionStore.getState().setActiveSession({
          id: apiActive.id,
          user_id: user.id,
          start_time: apiActive.start_time || apiActive.startTime,
          end_time: null,
          total_distance_km: apiActive.total_distance_km || 0,
          total_active_seconds: apiActive.total_active_seconds || 0,
          total_idle_seconds: apiActive.total_idle_seconds || 0,
          status: 'active',
        });
      }
    }
  } catch (error) {
    console.warn('[Session Service] Failed to recover session from API:', error);
  }
};

