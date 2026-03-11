import { StyleSheet, View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { visualization } from '@/src/services/supabase';
import { useAuthStore } from '@/src/modules/auth/store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const { user } = useAuthStore();
  const colorScheme = useColorScheme() ?? 'light';

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

  const renderItem = ({ item }: { item: TripPerformance }) => (
    <TouchableOpacity style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>
          {new Date(item.start_time).toLocaleDateString()} - {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Concluída</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Distância</Text>
          <Text style={styles.metricValue}>{parseFloat(item.distance_km.toString()).toFixed(2)} km</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Duração</Text>
          <Text style={styles.metricValue}>{formatDuration(item.duration_seconds)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Velo. Média</Text>
          <Text style={[styles.metricValue, { color: Colors[colorScheme].tint }]}>
            {parseFloat(item.avg_km_per_hour.toString()).toFixed(1)} km/h
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Minhas Viagens</Text>
      
      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma viagem encontrada no seu histórico.</Text>
          <Text style={styles.emptySubText}>Suas viagens aparecerão aqui após serem sincronizadas com a nuvem.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 40,
    color: '#1a1a1a',
  },
  list: {
    paddingBottom: 40,
  },
  itemCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  statusBadge: {
    backgroundColor: '#e7f5ea',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    color: '#28a745',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  emptySubText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
  }
});
