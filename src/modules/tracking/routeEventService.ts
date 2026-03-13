import { v4 as uuid } from 'uuid';
import * as Location from 'expo-location';
import { getDb } from '../../services/sqlite';
import type { RouteEventType, RouteEvent } from '../../types/route-events';

export async function createRouteEvent(
  sessionId: string,
  userId: string,
  eventType: RouteEventType
): Promise<RouteEvent> {
  const location = await Location.getCurrentPositionAsync({});

  const event: RouteEvent = {
    id: uuid(),
    user_id: userId,
    session_id: sessionId,
    event_type: eventType,
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    created_at: new Date().toISOString(),
    metadata: undefined,
    synced: 0,
  };

  const db = getDb();

  await db.runAsync(
    `INSERT INTO route_events
      (id, user_id, session_id, event_type, latitude, longitude, created_at, metadata, synced)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      event.id,
      event.user_id,
      event.session_id,
      event.event_type,
      event.latitude,
      event.longitude,
      event.created_at,
      null,
    ]
  );

  return event;
}

export async function getSessionEvents(sessionId: string): Promise<RouteEvent[]> {
  const db = getDb();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM route_events WHERE session_id = ? ORDER BY created_at ASC`,
    [sessionId]
  );

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    session_id: row.session_id,
    event_type: row.event_type as RouteEventType,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    synced: row.synced,
  }));
}

