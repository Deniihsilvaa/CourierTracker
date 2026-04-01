
import useSessions, { WorkSession } from '@/src/hooks/useSessions';
import { stylesTrips } from '@/src/styles';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, SectionList, Text, TouchableOpacity, View } from 'react-native';

export default function TripsScreen() {
  const { 
    sessions, 
    refreshing, 
    onRefresh, 
    totals, 
    sections, 
    theme, 
    setTimeFilter, 
    timeFilter 
  } = useSessions();

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const renderItem = ({ item }: { item: WorkSession }) => {
    const isClosed = item.status === 'closed';
    
    return (
      <TouchableOpacity style={[stylesTrips.itemCard, { backgroundColor: theme.background }]}>
        <View style={stylesTrips.cardHeader}>
          <View style={stylesTrips.timeGroup}>
            <Ionicons name="calendar-outline" size={14} color={theme.text + '80'} />
            <Text style={[stylesTrips.dateText, { color: theme.text }]}>
              {new Date(item.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {item.end_time && ` - ${new Date(item.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </Text>
          </View>
          <View style={[stylesTrips.statusBadge, { backgroundColor: isClosed ? '#E8F5E9' : '#FFF3E0' }]}>
            <Text style={[stylesTrips.statusText, { color: isClosed ? '#2E7D32' : '#EF6C00' }]}>
              {isClosed ? 'CONCLUÍDO' : 'EM ANDAMENTO'}
            </Text>
          </View>
        </View>

        <View style={stylesTrips.metricsRow}>
          <View style={stylesTrips.metric}>
            <Ionicons name="navigate-circle-outline" size={18} color="#007AFF" style={stylesTrips.metricIcon} />
            <View>
              <Text style={stylesTrips.metricLabel}>DISTÂNCIA</Text>
              <Text style={[stylesTrips.metricValue, { color: theme.text }]}>
                {(item.total_distance_km || 0).toFixed(1)} km
              </Text>
            </View>
          </View>

          <View style={stylesTrips.metric}>
            <Ionicons name="stopwatch-outline" size={18} color="#4CAF50" style={stylesTrips.metricIcon} />
            <View>
              <Text style={stylesTrips.metricLabel}>TEMPO ATIVO</Text>
              <Text style={[stylesTrips.metricValue, { color: theme.text }]}>
                {formatDuration(item.total_active_seconds || 0)}
              </Text>
            </View>
          </View>

          <View style={stylesTrips.metric}>
            <Ionicons name="speedometer-outline" size={18} color={theme.tint} style={stylesTrips.metricIcon} />
            <View>
              <Text style={stylesTrips.metricLabel}>ODÔMETRO</Text>
              <Text style={[stylesTrips.metricValue, { color: theme.text }]}>
                {item.start_odometer || '---'} {item.end_odometer ? `> ${item.end_odometer}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={stylesTrips.cardFooter}>
           <Text style={{ fontSize: 11, color: '#aaa', fontWeight: '500' }}>ID: {item.id.slice(0, 8)}</Text>
           <Ionicons name="chevron-forward" size={16} color="#ccc" style={{ marginLeft: 8 }} />
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
          {section.totalKm.toFixed(1)} km • {section.count} {section.count === 1 ? 'turno' : 'turnos'}
        </Text>
      </View>
    </View>
  );

  const Header = () => (
    <View style={stylesTrips.headerContainer}>
      <View style={stylesTrips.titleRow}>
        <Text style={[stylesTrips.header, { color: theme.text }]}>Histórico de Turnos</Text>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons 
            name="sync-outline" 
            size={24} 
            color={theme.tint} 
            style={refreshing ? { opacity: 0.5 } : null}
          />
        </TouchableOpacity>
      </View>

      <View style={stylesTrips.filterContainer}>
        {(['7d', '30d', 'all'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[stylesTrips.filterButton, timeFilter === filter && stylesTrips.filterButtonActive]}
            onPress={() => setTimeFilter(filter)}
          >
            <Text style={[
              stylesTrips.filterButtonText, 
              timeFilter === filter && stylesTrips.filterButtonTextActive
            ]}>
              {filter === '7d' ? '7 dias' : filter === '30d' ? '30 dias' : 'Tudo'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {sessions.length > 0 && (
        <View style={stylesTrips.summaryGrid}>
          <View style={stylesTrips.summaryCard}>
            <Text style={stylesTrips.summaryLabel}>TOTAL KM</Text>
            <Text style={stylesTrips.summaryValue}>{totals.distance.toFixed(1)}</Text>
          </View>
          <View style={stylesTrips.summaryCard}>
            <Text style={stylesTrips.summaryLabel}>TURNOS</Text>
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
            <Ionicons name="calendar-clear-outline" size={64} color="#ddd" />
            <Text style={[stylesTrips.emptyText, { color: theme.text }]}>Nenhum turno encontrado.</Text>
            <Text style={stylesTrips.emptySubText}>
              Seus turnos de trabalho aparecerão aqui após serem encerrados e sincronizados.
            </Text>
          </View>
        }
      />
    </View>
  );
}




