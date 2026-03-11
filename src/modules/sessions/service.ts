import { getDb } from '../../services/sqlite';
import { useSessionStore } from './store';
import { useAuthStore } from '../auth/store';
import { v4 as uuidv4 } from 'uuid';

export const startSession = async () => {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw new Error('Must be logged in to start a session');
  }

  const db = getDb();
  const sessionId = uuidv4();
  const startTime = new Date().toISOString();

  try {
    // 1. Create offline session record
    await db.runAsync(
      `INSERT INTO work_sessions (id, user_id, start_time, status, synced) VALUES (?, ?, ?, 'active', 0)`,
      [sessionId, user.id, startTime]
    );

    // 2. Set active in Zustand state
    useSessionStore.getState().setActiveSession({
      id: sessionId,
      user_id: user.id,
      start_time: startTime,
      end_time: null,
      total_distance_km: 0,
      total_active_seconds: 0,
      total_idle_seconds: 0,
      status: 'active'
    });

    console.log(`Session ${sessionId} started.`);
  } catch (error) {
    console.error('Failed to start session', error);
    throw error;
  }
};

export const endSession = async () => {
  const { activeSession, setActiveSession } = useSessionStore.getState();
  if (!activeSession) return;

  const db = getDb();
  const endTime = new Date().toISOString();

  try {
    // 1. Update offline session record
    await db.runAsync(
      `UPDATE work_sessions SET end_time = ?, status = 'completed', synced = 0 WHERE id = ?`,
      [endTime, activeSession.id]
    );

    // 2. Create a Trip record summarizing this session
    // This ensures data shows up in the "Recent Trips" view
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
      console.log(`Trip ${tripId} created for session ${sessionData.id}`);
    }

    // 3. Clear state
    setActiveSession({
      ...activeSession,
      end_time: endTime,
      status: 'completed'
    });
    
    // Slight delay before clearing completely or navigate away
    setTimeout(() => {
        setActiveSession(null);
    }, 100);

    console.log(`Session ${activeSession.id} ended.`);
  } catch (error) {
    console.error('Failed to end session', error);
    throw error;
  }
};
