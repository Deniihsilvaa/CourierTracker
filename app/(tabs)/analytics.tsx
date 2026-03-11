import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { visualization } from '@/src/services/supabase';
import { runFullSync } from '@/src/services/sync';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export default function AnalyticsScreen() {
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { lastSyncTime } = useTrackingStore();
  const { user } = useAuthStore();

  const colorScheme = useColorScheme() ?? 'light';
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
      // 1. Fetch Daily Stats
      const { data: statsData } = await visualization
        .from('daily_driver_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('work_day', { ascending: false })
        .limit(7);

      // 2. Fetch Trip Performance for average speed
      const { data: perfData } = await visualization
        .from('trip_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(10);

      // 3. Process Summary & Advanced Metrics
      if (statsData && statsData.length > 0) {
        setDailyStats(statsData);
        const totalKm = statsData.reduce((acc, curr) => acc + (curr.total_km || 0), 0);
        const totalHours = statsData.reduce((acc, curr) => acc + parseFloat(curr.hours_active || 0), 0);
        const totalIdle = statsData.reduce((acc, curr) => acc + parseFloat(curr.hours_idle || 0), 0);
        const avgSpeed = perfData?.length ? perfData.reduce((acc, curr) => acc + (curr.avg_km_per_hour || 0), 0) / perfData.length : 0;

        const idlePct = totalHours + totalIdle > 0 ? (totalIdle / (totalHours + totalIdle)) * 100 : 0;
        const efficiency = totalHours > 0 ? totalKm / totalHours : 0;

        setSummary({ totalKm, totalHours, avgSpeed, idlePct, efficiency });

        // Generate Hourly Data
        const hours = new Array(24).fill(0);
        perfData?.forEach(trip => {
          const hour = new Date(trip.start_time).getHours();
          hours[hour] += trip.distance_km;
        });
        setHourlyData(hours);

        // 4. Fetch last route points for map preview
        const { data: routeData } = await visualization
          .from('session_route')
          .select('latitude, longitude')
          .limit(100)
          .order('recorded_at', { ascending: false });

        if (routeData) {
          setRoutePoints(routeData.map(p => ({ latitude: p.latitude, longitude: p.longitude })));
        }
      }
      if (perfData) setPerformance(perfData);
    } catch (e) {
      console.error(e);
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
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleManualSync} />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>Analytics</Text>
        <Ionicons name="bar-chart" size={28} color={Colors[colorScheme].tint} />
      </View>

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.totalKm.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>Total KM</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.totalHours.toFixed(1)}h</Text>
          <Text style={styles.summaryLabel}>Ativo</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.avgSpeed.toFixed(1)}</Text>
          <Text style={styles.summaryLabel}>km/h Méd.</Text>
        </View>
      </View>

      {/* Route Preview Map */}
      {routePoints.length > 0 && (
        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Última Rota Detectada</Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            scrollEnabled={false}
            zoomEnabled={false}
            region={{
              latitude: routePoints[0].latitude,
              longitude: routePoints[0].longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Polyline
              coordinates={routePoints}
              strokeWidth={4}
              strokeColor="#007AFF"
            />
          </MapView>
        </View>
      )}

      {/* Advanced Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.miniMetric}>
          <Ionicons name="leaf-outline" size={18} color="#28a745" />
          <View>
            <Text style={styles.miniValue}>{summary.efficiency.toFixed(1)} km/h</Text>
            <Text style={styles.miniLabel}>Eficiência Méd.</Text>
          </View>
        </View>
        <View style={styles.miniMetric}>
          <Ionicons name="pause-circle-outline" size={18} color="#dc3545" />
          <View>
            <Text style={styles.miniValue}>{summary.idlePct.toFixed(0)}%</Text>
            <Text style={styles.miniLabel}>Tempo Ocioso</Text>
          </View>
        </View>
      </View>

      {/* Hourly Activity Chart */}
      <Text style={styles.subHeader}>Atividade por Hora (Distância)</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartContent}>
          {hourlyData.map((val, i) => (
            <View key={i} style={styles.chartCol}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: Math.max(2, (val / (Math.max(...hourlyData) || 1)) * 60),
                    backgroundColor: val > 0 ? '#007AFF' : '#eee'
                  }
                ]}
              />
              {i % 4 === 0 && <Text style={styles.chartLabelText}>{i}h</Text>}
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.subHeader}>Relatório Diário</Text>
      {dailyStats.map((day, idx) => (
        <View key={idx} style={styles.card}>
          <View style={styles.cardLeft}>
            <View style={[styles.dayBadge, { backgroundColor: idx === 0 ? '#e7f5ea' : '#f0f0f0' }]}>
              <Text style={[styles.dateText, { color: idx === 0 ? '#28a745' : '#444' }]}>
                {formatDate(day.work_day)}
              </Text>
            </View>
            <Text style={styles.statLabel}>{day.sessions} turnos realizados</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.statValue}>{parseFloat(day.total_km).toFixed(1)} km</Text>
            <Text style={styles.timeLabel}>
              <Ionicons name="time-outline" size={10} color="#888" /> {parseFloat(day.hours_active).toFixed(1)}h ativos
            </Text>
          </View>
        </View>
      ))}

      <Text style={styles.subHeader}>Log de Performance (Últimos Turnos)</Text>
      {performance.map((trip, idx) => (
        <View key={idx} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#007AFF' }]}>
          <View style={styles.cardLeft}>
            <Text style={styles.perfTime}>
              {new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {Math.floor(trip.duration_seconds / 60)} min
            </Text>
            <Text style={styles.statLabel}>{trip.distance_km} km percorridos</Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.statValue, { color: '#007AFF' }]}>{parseFloat(trip.avg_km_per_hour).toFixed(1)}</Text>
            <Text style={styles.timeLabel}>km/h méd.</Text>
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
    backgroundColor: '#fff',
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
    color: '#1a1a1a',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
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
    borderColor: '#eee',
  },
  mapTitle: {
    padding: 12,
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: '#fff',
    color: '#333',
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
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  miniValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  miniLabel: {
    fontSize: 10,
    color: '#888',
  },
  chartCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#eee',
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
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#222',
  },
  perfTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
