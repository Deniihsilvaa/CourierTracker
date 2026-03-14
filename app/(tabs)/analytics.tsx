
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { mapDarkStyle, stylesAnalytics } from '@/src/styles';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

export default function AnalyticsScreen() {

  const {
    dailyStats,
    performance, // deve ser usado logo
    refreshing,
    summary,
    routePoints,
    hourlyData,
    handleManualSync,
    formatDate,
    theme,
    colorScheme,
    lastSyncTime
  } = useAnalytics();

  return (
    <ScrollView
      style={[stylesAnalytics.container, { backgroundColor: theme.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleManualSync} tintColor={theme.tint} />
      }
    >
      <View style={stylesAnalytics.headerRow}>
        <View>
          <Text style={[stylesAnalytics.header, { color: theme.text }]}>Analytics</Text>
          <Text style={stylesAnalytics.subTitle}>Análise Diária</Text>
        </View>
        <Ionicons name="bar-chart" size={28} color={theme.tint} />
      </View>

      {/* Summary Section - Last 7 Days Average */}
      <View style={stylesAnalytics.summaryContainer}>
        <View style={[stylesAnalytics.summaryCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[stylesAnalytics.summaryValue, { color: theme.tint }]}>
            {(summary.totalKm / (dailyStats.length || 1)).toFixed(1)}
          </Text>
          <Text style={stylesAnalytics.summaryLabel}>Média KM/Dia</Text>
        </View>
        <View style={[stylesAnalytics.summaryCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[stylesAnalytics.summaryValue, { color: theme.tint }]}>
            {(summary.totalHours / (dailyStats.length || 1)).toFixed(1)}h
          </Text>
          <Text style={stylesAnalytics.summaryLabel}>Média Horas</Text>
        </View>
        <View style={[stylesAnalytics.summaryCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[stylesAnalytics.summaryValue, { color: theme.tint }]}>{summary.avgSpeed.toFixed(1)}</Text>
          <Text style={stylesAnalytics.summaryLabel}>km/h Méd.</Text>
        </View>
      </View>

      {/* Route Preview Map - Validating coordinates to avoid white map */}
      {routePoints.length > 5 && summary.totalKm > 0.5 && Math.abs(routePoints[0].latitude) > 1 && (
        <View style={[stylesAnalytics.mapCard, { borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Text style={[stylesAnalytics.mapTitle, { backgroundColor: theme.background, color: theme.text }]}>
            Fluxo da Última Rota
          </Text>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={stylesAnalytics.map}
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
      <View style={stylesAnalytics.metricsGrid}>
        <View style={[stylesAnalytics.miniMetric, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Ionicons name="leaf-outline" size={18} color="#28a745" />
          <View>
            <Text style={[stylesAnalytics.miniValue, { color: theme.text }]}>{summary.efficiency.toFixed(1)} km/h</Text>
            <Text style={stylesAnalytics.miniLabel}>Eficiência Méd.</Text>
          </View>
        </View>
        <View style={[stylesAnalytics.miniMetric, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Ionicons name="pause-circle-outline" size={18} color="#dc3545" />
          <View>
            <Text style={[stylesAnalytics.miniValue, { color: theme.text }]}>{summary.idlePct.toFixed(0)}%</Text>
            <Text style={stylesAnalytics.miniLabel}>Tempo Ocioso</Text>
          </View>
        </View>
      </View>

      {/* Hourly Activity Chart */}
      <Text style={[stylesAnalytics.subHeader, { color: theme.text }]}>Atividade por Hora (KM)</Text>
      <View style={[stylesAnalytics.chartCard, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
        <View style={stylesAnalytics.chartContent}>
          {hourlyData.map((val, i) => {
            const maxVal = Math.max(...hourlyData) || 1;
            return (
              <View key={i} style={stylesAnalytics.chartCol}>
                <View
                  style={[
                    stylesAnalytics.chartBar,
                    {
                      height: val > 0 ? Math.max(4, (val / maxVal) * 80) : 2,
                      backgroundColor: val > 0 ? theme.tint : (colorScheme === 'dark' ? '#222' : '#f5f5f5')
                    }
                  ]}
                />
                {i % 4 === 0 && <Text style={stylesAnalytics.chartLabelText}>{i}h</Text>}
              </View>
            );
          })}
        </View>
      </View>

      <Text style={[stylesAnalytics.subHeader, { color: theme.text }]}>Histórico Diário</Text>
      {dailyStats.map((day, idx) => (
        <View key={idx} style={[stylesAnalytics.card, { backgroundColor: theme.background, borderColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}>
          <View style={stylesAnalytics.cardLeft}>
            <View style={[stylesAnalytics.dayBadge, { backgroundColor: idx === 0 ? (colorScheme === 'dark' ? '#1b3b24' : '#e7f5ea') : (colorScheme === 'dark' ? '#333' : '#f0f0f0') }]}>
              <Text style={[stylesAnalytics.dateText, { color: idx === 0 ? '#28a745' : theme.text }]}>
                {formatDate(day.work_day)}
              </Text>
            </View>
            <Text style={stylesAnalytics.statLabel}>{day.sessions} {day.sessions === 1 ? 'sessão' : 'sessões'} de trabalho</Text>
          </View>
          <View style={stylesAnalytics.cardRight}>
            <Text style={[stylesAnalytics.statValue, { color: theme.text }]}>{parseFloat(day?.total_km || 0).toFixed(1)} km</Text>
            <Text style={stylesAnalytics.timeLabel}>
              <Ionicons name="time-outline" size={10} color="#888" /> {parseFloat(day?.hours_active || 0).toFixed(1)}h ativos
            </Text>
          </View>
        </View>
      ))}

      <View style={stylesAnalytics.syncContainer}>
        <Ionicons name="refresh-circle-outline" size={14} color="#999" />
        {lastSyncTime && (
          <Text style={stylesAnalytics.syncText}>
            Atualizado em: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}


