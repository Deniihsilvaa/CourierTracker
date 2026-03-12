import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/modules/auth/store';
import { visualization } from '@/src/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TripPerformance {
  id: string;
  user_id: string;
  distance_km: number;
  duration_seconds: number;
  avg_km_per_hour: number;
  start_time: string;
}

export default function TripsScreen() {
  const [trips, setTrips] = useState<TripPerformance[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | 'all'>('7d');
  const { user } = useAuthStore();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    if (!user) return;

    try {
      const { data, error } = await visualization
        .from('trip_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      if (data) setTrips(data);
    } catch (e) {
      console.error('Failed to load trips from Supabase', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const totals = useMemo(() => {
    return trips.reduce((acc, curr) => ({
      distance: acc.distance + curr.distance_km,
      duration: acc.duration + curr.duration_seconds,
      count: acc.count + 1
    }), { distance: 0, duration: 0, count: 0 });
  }, [trips]);

  const sections = useMemo(() => {
    const groups: { [key: string]: { title: string, data: TripPerformance[], totalKm: number, count: number } } = {};

    // Simple filter logic for MVP
    const filtered = trips.filter(t => {
      const date = new Date(t.start_time);
      const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (timeFilter === '7d') return diffDays <= 7;
      if (timeFilter === '30d') return diffDays <= 30;
      return true;
    });

    filtered.forEach(trip => {
      const label = formatDateLabel(trip.start_time);
      if (!groups[label]) {
        groups[label] = { title: label, data: [], totalKm: 0, count: 0 };
      }
      groups[label].data.push(trip);
      groups[label].totalKm += trip.distance_km;
      groups[label].count += 1;
    });

    return Object.values(groups);
  }, [trips, timeFilter]);

  const renderItem = ({ item }: { item: TripPerformance }) => {
    return (
      <TouchableOpacity style={[styles.itemCard, { backgroundColor: theme.background }]}>
        <View style={styles.cardHeader}>
          <View style={styles.timeGroup}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.dateText}>
              {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Concluída</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Ionicons name="navigate-circle-outline" size={18} color="#007AFF" style={styles.metricIcon} />
            <View>
              <Text style={styles.metricLabel}>Distância</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {parseFloat(item.distance_km.toString()).toFixed(2)} km
              </Text>
            </View>
          </View>

          <View style={styles.metric}>
            <Ionicons name="stopwatch-outline" size={18} color="#4CAF50" style={styles.metricIcon} />
            <View>
              <Text style={styles.metricLabel}>Duração</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>{formatDuration(item.duration_seconds)}</Text>
            </View>
          </View>

          <View style={styles.metric}>
            <Ionicons name="speedometer-outline" size={18} color={theme.tint} style={styles.metricIcon} />
            <View>
              <Text style={styles.metricLabel}>Média</Text>
              <Text style={[styles.metricValue, { color: theme.text }]}>
                {parseFloat(item.avg_km_per_hour.toString()).toFixed(1)} km/h
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeader}>{section.title}</Text>
      <View style={styles.sectionTotals}>
        <View style={styles.miniDot} />
        <Text style={styles.sectionTotalText}>
          {section.totalKm.toFixed(1)} km • {section.count} {section.count === 1 ? 'viagem' : 'viagens'}
        </Text>
      </View>
    </View>
  );

  const Header = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={[styles.header, { color: theme.text }]}>Minhas Viagens</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons name="sync-outline" size={24} color={theme.tint} />
        </TouchableOpacity>
      </View>

      {/* Time Filters */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === '7d' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('7d')}
        >
          <Text style={[styles.filterButtonText, timeFilter === '7d' && styles.filterButtonTextActive]}>7 dias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === '30d' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('30d')}
        >
          <Text style={[styles.filterButtonText, timeFilter === '30d' && styles.filterButtonTextActive]}>30 dias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={[styles.filterButtonText, timeFilter === 'all' && styles.filterButtonTextActive]}>Tudo</Text>
        </TouchableOpacity>
      </View>

      {trips.length > 0 && (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL KM</Text>
            <Text style={styles.summaryValue}>{totals.distance.toFixed(1)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>VIAGENS</Text>
            <Text style={styles.summaryValue}>{totals.count}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TEMPO TOTAL</Text>
            <Text style={styles.summaryValue}>{Math.floor(totals.duration / 3600)}h</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="map-outline" size={64} color="#ddd" />
            <Text style={[styles.emptyText, { color: theme.text }]}>Nenhuma viagem encontrada.</Text>
            <Text style={styles.emptySubText}>
              Suas viagens aparecerão aqui após serem sincronizadas com a nuvem.
            </Text>
          </View>
        }
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  filterButtonTextActive: {
    color: '#007AFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
  },
  sectionTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  list: {
    paddingBottom: 40,
  },
  itemCard: {
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#e7f5ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#28a745',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIcon: {
    opacity: 0.8,
  },
  metricLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f8f8f8',
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  }
});
