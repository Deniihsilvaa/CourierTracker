import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<DebugStats>({
    gpsCount: 0,
    eventCount: 0,
    lastEvent: null,
  });

  const fetchStats = async () => {
    const currentId = await sessionManager.getCurrentSessionId();
    setSessionId(currentId);

    if (!currentId) {
      setStats({ gpsCount: 0, eventCount: 0, lastEvent: null });
      return;
    }

    try {
      const db = getDb();
      
      // 1. Count GPS Points for current session
      const gpsResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM gps_points WHERE session_id = ?',
        [currentId]
      );

      // 2. Count Route Events for current session
      const eventResult = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM route_events WHERE session_id = ?',
        [currentId]
      );

      // 3. Get Last Event
      const lastEventResult = await db.getFirstAsync<any>(
        'SELECT event_type, created_at FROM route_events WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
        [currentId]
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Debug: Tracking Session
        </Text>
        <View style={[styles.indicator, { backgroundColor: isTracking ? '#22c55e' : '#d1d5db' }]} />
      </View>

      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.statusValue, { color: isTracking ? '#16a34a' : '#6b7280' }]}>
            {isTracking ? 'Active' : 'Stopped'}
          </Text>
        </View>
        <View style={styles.alignEnd}>
          <Text style={styles.label}>Session ID</Text>
          <Text style={styles.sessionValue}>
            {sessionId ? `${sessionId.substring(0, 8)}...` : 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.label}>GPS Points</Text>
          <Text style={styles.statValue}>{stats.gpsCount}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.label}>Route Events</Text>
          <Text style={styles.statValue}>{stats.eventCount}</Text>
        </View>
      </View>

      {stats.lastEvent && (
        <View style={styles.lastEventContainer}>
          <Text style={styles.label}>Last Event</Text>
          <View style={styles.lastEventRow}>
            <View style={styles.eventTypeBadge}>
              <Text style={styles.eventTypeText}>
                {stats.lastEvent.type}
              </Text>
            </View>
            <Text style={styles.eventTimeText}>
              {stats.lastEvent.time}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerText: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    color: '#9ca3af',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '500',
    marginBottom: 2,
  },
  statusValue: {
    fontWeight: 'bold',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  sessionValue: {
    color: '#374151',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  lastEventContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  lastEventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTypeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eventTypeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  eventTimeText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '500',
  },
});
