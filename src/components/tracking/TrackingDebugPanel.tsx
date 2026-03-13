import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { sessionManager } from '@/src/modules/tracking/session-manager';
import { getDb } from '@/src/services/sqlite';
import { logger } from '@/src/utils/logger';

interface DebugStats {
  gpsCount: number;
  eventCount: number;
  lastEvent: {
    type: string;
    time: string;
  } | null;
}

export const TrackingDebugPanel = () => {
  const isTracking = useTrackingStore((state) => state.isTracking);
  const sessionId = sessionManager.getCurrentSessionId();
  const [stats, setStats] = useState<DebugStats>({
    gpsCount: 0,
    eventCount: 0,
    lastEvent: null,
  });

  const fetchStats = async () => {
    if (!sessionId) {
      setStats({ gpsCount: 0, eventCount: 0, lastEvent: null });
      return;
    }

    try {
      const db = getDb();
      
      // 1. Count GPS Points for current session
      const gpsResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM gps_points WHERE session_id = ?',
        [sessionId]
      );

      // 2. Count Route Events for current session
      const eventResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM route_events WHERE session_id = ?',
        [sessionId]
      );

      // 3. Get Last Event
      const lastEventResult = await db.getFirstAsync<any>(
        'SELECT event_type, created_at FROM route_events WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
        [sessionId]
      );

      setStats({
        gpsCount: gpsResult?.count || 0,
        eventCount: eventResult?.count || 0,
        lastEvent: lastEventResult ? {
          type: lastEventResult.event_type,
          time: new Date(lastEventResult.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        } : null,
      });
    } catch (error) {
      logger.error('[DebugPanel] Failed to fetch SQLite stats', { error });
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Poll for updates every 3 seconds while tracking is active
    let interval: NodeJS.Timeout;
    if (isTracking) {
      interval = setInterval(fetchStats, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, sessionId]);

  return (
    <View className="mx-6 my-4 p-4 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          Debug: Tracking Session
        </Text>
        <View className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : 'bg-gray-300'}`} />
      </View>

      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-gray-400 text-[10px] uppercase font-medium">Status</Text>
          <Text className={`font-bold ${isTracking ? 'text-green-600' : 'text-gray-500'}`}>
            {isTracking ? 'Active' : 'Stopped'}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-400 text-[10px] uppercase font-medium">Session ID</Text>
          <Text className="text-gray-700 font-mono text-xs">
            {sessionId ? `${sessionId.substring(0, 8)}...` : 'N/A'}
          </Text>
        </View>
      </View>

      <View className="flex-row space-x-8 mb-4">
        <View className="flex-1 p-2 bg-gray-50 rounded-xl">
          <Text className="text-gray-400 text-[10px] uppercase font-medium">GPS Points</Text>
          <Text className="text-lg font-bold text-gray-800">{stats.gpsCount}</Text>
        </View>
        <View className="flex-1 p-2 bg-gray-50 rounded-xl">
          <Text className="text-gray-400 text-[10px] uppercase font-medium">Route Events</Text>
          <Text className="text-lg font-bold text-gray-800">{stats.eventCount}</Text>
        </View>
      </View>

      {stats.lastEvent && (
        <View className="pt-3 border-t border-gray-50">
          <Text className="text-gray-400 text-[10px] uppercase font-medium mb-1">Last Event</Text>
          <View className="flex-row justify-between items-center">
            <View className="bg-blue-50 px-2 py-0.5 rounded-md">
              <Text className="text-blue-600 text-[10px] font-bold uppercase">
                {stats.lastEvent.type}
              </Text>
            </View>
            <Text className="text-gray-400 text-[10px] font-medium">
              {stats.lastEvent.time}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
