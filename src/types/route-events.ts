export type RouteEventType =
  | 'pickup'
  | 'dropoff'
  | 'waiting';

export interface RouteEvent {
  id: string;
  user_id: string;
  session_id: string;
  event_type: RouteEventType;
  latitude: number;
  longitude: number;
  created_at: string;
  metadata?: Record<string, any>;
  synced?: number;
}

