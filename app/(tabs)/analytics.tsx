import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { supabase, visualization } from '@/src/services/supabase';
import { runFullSync } from '@/src/services/sync';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export default function AnalyticsScreen() {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { lastSyncTime } = useTrackingStore();
  const { user } = useAuthStore();

  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [hourlyData, setHourlyData] = useState<number[]>(new Array(24).fill(0));
  const [summary, setSummary] = useState({
    totalKm: 0,
    totalHours: 0,
    avgSpeed: 0,
    idlePct: 0,
    efficiency: 0
  });
  const [routePoints, setRoutePoints] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      console.log('[Analytics] Loading data for user:', user.id);

      // 1. Fetch RAW Work Sessions for faithful summary
      const { data: rawSessions, error: sessionsError } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      // 2. Fetch daily aggregated stats for the list (using view for speed)
      const { data: statsData } = await visualization
        .from('daily_driver_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('work_day', { ascending: false })
        .limit(10);

      // 3. Process Summary from RAW data (Most accurate)
      if (rawSessions && rawSessions.length > 0) {
        // First, group sessions by date to find unique working days
        const workingDays = new Set(rawSessions.map(s => s.start_time.split('T')[0]));
        const numDays = workingDays.size || 1;

        const totalKm = rawSessions.reduce((acc, curr) => acc + (curr?.total_distance_km || 0), 0);
        const totalActiveSeconds = rawSessions.reduce((acc, curr) => acc + (curr?.total_active_seconds || 0), 0);
        const totalIdleSeconds = rawSessions.reduce((acc, curr) => acc + (curr?.total_idle_seconds || 0), 0);
        
        const totalHours = totalActiveSeconds / 3600;
        const totalIdleHours = totalIdleSeconds / 3600;
        
        // Speed calculation: Distance / Time (avoid division by zero)
        const avgSpeed = totalHours > 0 ? totalKm / totalHours : 0;
        const idlePct = (totalHours + totalIdleHours) > 0 
          ? (totalIdleHours / (totalHours + totalIdleHours)) * 100 
          : 0;

        setSummary({ 
          totalKm: totalKm / numDays, // Show Average KM PER DAY
          totalHours: totalHours / numDays, // Show Average HOURS PER DAY
          avgSpeed, 
          idlePct, 
          efficiency: avgSpeed
        });

        // 4. Generate Hourly Activity based on the last 10 trips
        const { data: tripsData } = await visualization
          .from('trip_performance')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(20);

        if (tripsData) {
          const hours = new Array(24).fill(0);
          tripsData.forEach(trip => {
            const hour = new Date(trip.start_time).getHours();
            hours[hour] += (trip.distance_km || 0);
          });
          setHourlyData(hours);
          setPerformance(tripsData);
        }

        // 5. Fetch route for map
        const { data: routeData } = await visualization
          .from('session_route')
          .select('latitude, longitude')
          .eq('user_id', user.id)
          .limit(100)
          .order('recorded_at', { ascending: false });

        if (routeData) {
          setRoutePoints(routeData.map(p => ({ latitude: p.latitude, longitude: p.longitude })));
        }
      }
      
      if (statsData) {
        setDailyStats(statsData);
      }

    } catch (e) {
      console.error('[Analytics] Critical data load error:', e);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00'); // Mid-day to avoid TZ issues
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const handleManualSync = async () => {
    setRefreshing(true);
    await runFullSync();
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleManualSync} tintColor={theme.tint} />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.header, { color: theme.text }]}>Analytics</Text>
          <Text style={styles.subTitle}>Análise Diária</Text>
        </View>
        <Ionicons name="bar-chart" size={28} color={theme.tint} />
      </View>

      {/* Summary Section - Last 7 Days Average */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[styles.summaryValue, { color: theme.tint }]}>
            {(summary.totalKm / (dailyStats.length || 1)).toFixed(1)}
          </Text>
          <Text style={styles.summaryLabel}>Média KM/Dia</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[styles.summaryValue, { color: theme.tint }]}>
            {(summary.totalHours / (dailyStats.length || 1)).toFixed(1)}h
          </Text>
          <Text style={styles.summaryLabel}>Média Horas</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[styles.summaryValue, { color: theme.tint }]}>{summary.avgSpeed.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>km/h Méd.</Text>
        </View>
      </View>

      {/* Route Preview Map - Validating coordinates to avoid white map */}
      {routePoints.length > 5 && summary.totalKm > 0.5 && Math.abs(routePoints[0].latitude) > 1 && (
        <View style={[styles.mapCard, { borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[styles.mapTitle, { backgroundColor: theme.background, color: theme.text }]}>
            Fluxo da Última Rota
          </Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            region={{
              latitude: routePoints[0].latitude,
              longitude: routePoints[0].longitude,
              latitudeDelta: 0.04, 
              longitudeDelta: 0.04,
            }}
            customMapStyle={colorScheme === 'dark' ? mapDarkStyle : []}
          >
            <Polyline
              coordinates={routePoints}
              strokeWidth={4}
              strokeColor={theme.tint}
            />
          </MapView>
        </View>
      )}

      {/* Advanced Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.miniMetric, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Ionicons name="leaf-outline" size={18} color="#28a745" />
          <View>
            <Text style={[styles.miniValue, { color: theme.text }]}>{summary.efficiency.toFixed(1)} km/h</Text>
            <Text style={styles.miniLabel}>Eficiência Méd.</Text>
          </View>
        </View>
        <View style={[styles.miniMetric, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Ionicons name="pause-circle-outline" size={18} color="#dc3545" />
          <View>
            <Text style={[styles.miniValue, { color: theme.text }]}>{summary.idlePct.toFixed(0)}%</Text>
            <Text style={styles.miniLabel}>Tempo Ocioso</Text>
          </View>
        </View>
      </View>

      {/* Hourly Activity Chart */}
      <Text style={[styles.subHeader, { color: theme.text }]}>Atividade por Hora (KM)</Text>
      <View style={[styles.chartCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
        <View style={styles.chartContent}>
          {hourlyData.map((val, i) => {
            const maxVal = Math.max(...hourlyData) || 1;
            return (
              <View key={i} style={styles.chartCol}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: val > 0 ? Math.max(4, (val / maxVal) * 80) : 2,
                      backgroundColor: val > 0 ? theme.tint : (colorScheme === 'dark' ? '#222' : '#f5f5f5')
                    }
                  ]}
                />
                {i % 4 === 0 && <Text style={styles.chartLabelText}>{i}h</Text>}
              </View>
            );
          })}
        </View>
      </View>

      <Text style={[styles.subHeader, { color: theme.text }]}>Histórico Diário</Text>
      {dailyStats.map((day, idx) => (
        <View key={idx} style={[styles.card, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}>
          <View style={styles.cardLeft}>
            <View style={[styles.dayBadge, { backgroundColor: idx === 0 ? (colorScheme === 'dark' ? '#1b3b24' : '#e7f5ea') : (colorScheme === 'dark' ? '#333' : '#f0f0f0') }]}>
              <Text style={[styles.dateText, { color: idx === 0 ? '#28a745' : theme.text }]}>
                {formatDate(day.work_day)}
              </Text>
            </View>
            <Text style={styles.statLabel}>{day.sessions} {day.sessions === 1 ? 'sessão' : 'sessões'} de trabalho</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.statValue, { color: theme.text }]}>{parseFloat(day?.total_km || 0).toFixed(1)} km</Text>
            <Text style={styles.timeLabel}>
              <Ionicons name="time-outline" size={10} color="#888" /> {parseFloat(day?.hours_active || 0).toFixed(1)}h ativos
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.syncContainer}>
        <Ionicons name="refresh-circle-outline" size={14} color="#999" />
        {lastSyncTime && (
          <Text style={styles.syncText}>
            Atualizado em: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  mapCard: {
    height: 200,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  mapTitle: {
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  map: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  miniMetric: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  miniValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  miniLabel: {
    fontSize: 10,
    color: '#888',
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    justifyContent: 'space-between',
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '60%',
    borderRadius: 4,
  },
  chartLabelText: {
    fontSize: 8,
    color: '#999',
    marginTop: 4,
    position: 'absolute',
    bottom: -15,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  cardLeft: {
    flex: 1,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  perfTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncContainer: {
    marginTop: 24,
    marginBottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  syncText: {
    color: '#aaa',
    fontSize: 12,
  }
});

const mapDarkStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#746855" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#242f3e" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#d59563" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#38414e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#212a37" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9ca5b3" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#17263c" }]
  }
];
