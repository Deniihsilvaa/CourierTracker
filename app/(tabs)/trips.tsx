
import useTrip from '@/src/hooks/useTrip';
import { stylesTrips } from '@/src/styles';
import { TripPerformance } from '@/src/types/route-trip';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, SectionList, Text, TouchableOpacity, View } from 'react-native';


export default function TripsScreen() {
  const { trips, refreshing, onRefresh, formatDuration, formatDateLabel, totals, sections, theme, setTimeFilter, timeFilter } = useTrip();
  const renderItem = ({ item }: { item: TripPerformance }) => {
    return (
      <TouchableOpacity style={[stylesTrips.itemCard, { backgroundColor: theme.background }]}>
        <View style={stylesTrips.cardHeader}>
          <View style={stylesTrips.timeGroup}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={stylesTrips.dateText}>
              {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={stylesTrips.statusBadge}>
            <Text style={stylesTrips.statusText}>Concluída</Text>
          </View>
        </View>

        <View style={stylesTrips.metricsRow}>
          <View style={stylesTrips.metric}>
            <Ionicons name="navigate-circle-outline" size={18} color="#007AFF" style={stylesTrips.metricIcon} />
            <View>
              <Text style={stylesTrips.metricLabel}>Distância</Text>
              <Text style={[stylesTrips.metricValue, { color: theme.text }]}>
                {parseFloat(item.distance_km.toString()).toFixed(2)} km
              </Text>
            </View>
          </View>

          <View style={stylesTrips.metric}>
            <Ionicons name="stopwatch-outline" size={18} color="#4CAF50" style={stylesTrips.metricIcon} />
            <View>
              <Text style={stylesTrips.metricLabel}>Duração</Text>
              <Text style={[stylesTrips.metricValue, { color: theme.text }]}>{formatDuration(item.duration_seconds)}</Text>
            </View>
          </View>

          <View style={stylesTrips.metric}>
            <Ionicons name="speedometer-outline" size={18} color={theme.tint} style={stylesTrips.metricIcon} />
            <View>
              <Text style={stylesTrips.metricLabel}>Média</Text>
              <Text style={[stylesTrips.metricValue, { color: theme.text }]}>
                {parseFloat(item.avg_km_per_hour.toString()).toFixed(1)} km/h
              </Text>
            </View>
          </View>
        </View>

        <View style={stylesTrips.cardFooter}>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={stylesTrips.sectionHeaderRow}>
      <Text style={stylesTrips.sectionHeader}>{section.title}</Text>
      <View style={stylesTrips.sectionTotals}>
        <View style={stylesTrips.miniDot} />
        <Text style={stylesTrips.sectionTotalText}>
          {section.totalKm.toFixed(1)} km • {section.count} {section.count === 1 ? 'viagem' : 'viagens'}
        </Text>
      </View>
    </View>
  );

  const Header = () => (
    <View style={stylesTrips.headerContainer}>
      <View style={stylesTrips.titleRow}>
        <Text style={[stylesTrips.header, { color: theme.text }]}>Minhas Viagens</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons name="sync-outline" size={24} color={theme.tint} />
        </TouchableOpacity>
      </View>

      {/* Time Filters */}
      <View style={stylesTrips.filterContainer}>
        <TouchableOpacity
          style={[stylesTrips.filterButton, timeFilter === '7d' && stylesTrips.filterButtonActive]}
          onPress={() => setTimeFilter('7d')}
        >
          <Text style={[stylesTrips.filterButtonText, timeFilter === '7d' && stylesTrips.filterButtonTextActive]}>7 dias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[stylesTrips.filterButton, timeFilter === '30d' && stylesTrips.filterButtonActive]}
          onPress={() => setTimeFilter('30d')}
        >
          <Text style={[stylesTrips.filterButtonText, timeFilter === '30d' && stylesTrips.filterButtonTextActive]}>30 dias</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[stylesTrips.filterButton, timeFilter === 'all' && stylesTrips.filterButtonActive]}
          onPress={() => setTimeFilter('all')}
        >
          <Text style={[stylesTrips.filterButtonText, timeFilter === 'all' && stylesTrips.filterButtonTextActive]}>Tudo</Text>
        </TouchableOpacity>
      </View>

      {trips.length > 0 && (
        <View style={stylesTrips.summaryGrid}>
          <View style={stylesTrips.summaryCard}>
            <Text style={stylesTrips.summaryLabel}>TOTAL KM</Text>
            <Text style={stylesTrips.summaryValue}>{totals.distance.toFixed(1)}</Text>
          </View>
          <View style={stylesTrips.summaryCard}>
            <Text style={stylesTrips.summaryLabel}>VIAGENS</Text>
            <Text style={stylesTrips.summaryValue}>{totals.count}</Text>
          </View>
          <View style={stylesTrips.summaryCard}>
            <Text style={stylesTrips.summaryLabel}>TEMPO TOTAL</Text>
            <Text style={stylesTrips.summaryValue}>{Math.floor(totals.duration / 3600)}h</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[stylesTrips.container, { backgroundColor: theme.background }]}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        ListHeaderComponent={Header}
        contentContainerStyle={stylesTrips.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
        }
        ListEmptyComponent={
          <View style={stylesTrips.emptyContainer}>
            <Ionicons name="map-outline" size={64} color="#ddd" />
            <Text style={[stylesTrips.emptyText, { color: theme.text }]}>Nenhuma viagem encontrada.</Text>
            <Text style={stylesTrips.emptySubText}>
              Suas viagens aparecerão aqui após serem sincronizadas com a nuvem.
            </Text>
          </View>
        }
      />
    </View>
  );
}



