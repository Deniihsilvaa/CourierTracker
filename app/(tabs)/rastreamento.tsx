import useDashboardScreen from '@/src/hooks/useDashboardScreen';
import { stylesDashboard } from '@/src/styles';
import { Ionicons } from '@expo/vector-icons';
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

export default function RastreamentoScreen() {
  const {
    user,
    isTracking,
    isSyncing,
    pendingCount,
    theme,
    pulseAnim,
    handleManualSync,
    handleStartSession,
    handleStopSession,
    handleRouteEvent,
    activeSession,
  } = useDashboardScreen();

  return (
    <View style={[stylesDashboard.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={stylesDashboard.header}>
        <View>
          <Text style={[stylesDashboard.userName, { color: theme.text }]}>
            {user?.name || user?.email?.split('@')[0]}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleManualSync}
          style={[stylesDashboard.syncButton, { backgroundColor: isSyncing ? '#e1f5fe' : '#f8f9fa' }]}
        >
          <Ionicons
            name={isSyncing ? "refresh" : (pendingCount > 0 ? "cloud-offline" : "cloud-done")}
            size={20}
            color={isSyncing ? "#007AFF" : (pendingCount > 0 ? "#FFA500" : "#28a745")}
          />
          <Text style={[stylesDashboard.syncText, { color: pendingCount > 0 ? "#FFA500" : "#888" }]}>
            {isSyncing ? "Sinc..." : (pendingCount > 0 ? pendingCount : "OK")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[stylesDashboard.statusCard, { backgroundColor: isTracking ? '#E3F2FD' : '#F5F5F5' }]}>
          <View style={stylesDashboard.statusInfo}>
            <View style={[stylesDashboard.indicator, { backgroundColor: isTracking ? '#2196F3' : '#9E9E9E' }]}>
              {isTracking && (
                <Animated.View style={[stylesDashboard.pulse, { transform: [{ scale: pulseAnim }] }]} />
              )}
            </View>
            <Text style={[stylesDashboard.statusTitle, { color: isTracking ? '#1565C0' : '#616161' }]}>
              {isTracking ? 'RODANDO EM SEGUNDO PLANO' : 'SISTEMA EM ESPERA'}
            </Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={stylesDashboard.metricsGrid}>
          <View style={[stylesDashboard.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="navigate-circle" size={24} color="#007AFF" />
            <Text style={[stylesDashboard.metricValue, { color: theme.text }]}>
              {(activeSession?.total_distance_km || 0).toFixed(2)}
            </Text>
            <Text style={stylesDashboard.metricLabel}>Km Totais</Text>
          </View>

          <View style={[stylesDashboard.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="stopwatch" size={24} color="#4CAF50" />
            <Text style={[stylesDashboard.metricValue, { color: theme.text }]}>
              {formatTime(activeSession?.total_active_seconds || 0)}
            </Text>
            <Text style={stylesDashboard.metricLabel}>Tempo Méd.</Text>
          </View>
        </View>

        <View style={stylesDashboard.metricsGrid}>
          <View style={[stylesDashboard.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="cafe" size={24} color="#FF9800" />
            <Text style={[stylesDashboard.metricValue, { color: theme.text }]}>
              {formatTime(activeSession?.total_idle_seconds || 0)}
            </Text>
            <Text style={stylesDashboard.metricLabel}>Ocioso</Text>
          </View>

          <View style={[stylesDashboard.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="map" size={24} color="#9C27B0" />
            <Text style={[stylesDashboard.metricValue, { color: theme.text }]}>
              --
            </Text>
            <Text style={stylesDashboard.metricLabel}>Km/h Atual</Text>
          </View>
        </View>

        {/* GPS Health */}
        <View style={stylesDashboard.gpsHealth}>
          <Ionicons name="radio-outline" size={16} color="#ffc107" />
          <Text style={stylesDashboard.gpsText}>
            Precisão GPS: Buscando sinal...
          </Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={stylesDashboard.actionContainer}>
        {/* Route Event Quick Actions */}
        {isTracking && (
          <View style={stylesDashboard.routeActionsContainer}>
            <TouchableOpacity
              style={[stylesDashboard.routeActionButton, { backgroundColor: '#007AFF' }]}
              onPress={() => handleRouteEvent('pickup')}
              activeOpacity={0.8}
            >
              <Ionicons name="cube-outline" size={18} color="#fff" />
              <Text style={stylesDashboard.routeActionLabel}>Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[stylesDashboard.routeActionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleRouteEvent('dropoff')}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
              <Text style={stylesDashboard.routeActionLabel}>Dropoff</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[stylesDashboard.routeActionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => handleRouteEvent('waiting')}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={18} color="#fff" />
              <Text style={stylesDashboard.routeActionLabel}>Waiting</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={isTracking ? handleStopSession : handleStartSession}
          style={[stylesDashboard.mainButton, { backgroundColor: isTracking ? '#FF3B30' : '#007AFF' }]}
        >
          <Ionicons name={isTracking ? "stop" : "play"} size={28} color="#fff" />
          <Text style={stylesDashboard.mainButtonText}>
            {isTracking ? "ENCERRAR TURNO" : "INICIAR TURNO"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
