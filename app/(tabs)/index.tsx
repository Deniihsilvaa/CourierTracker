import { StyleSheet, View, Text, TouchableOpacity, Alert, Animated, ScrollView } from 'react-native';
import { useAuthStore } from '@/src/modules/auth/store';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { useSessionStore } from '@/src/modules/sessions/store';
import { startTracking, stopTracking } from '@/src/modules/tracking/service';
import { startSession, endSession } from '@/src/modules/sessions/service';
import { runFullSync } from '@/src/services/sync';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { getDb } from '@/src/services/sqlite';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { isTracking, currentLocation, lastSyncTime } = useTrackingStore();
  const { activeSession } = useSessionStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  // Animation for the tracking pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isTracking]);

  useEffect(() => {
    const checkPending = async () => {
      const db = getDb();
      try {
        const gps = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM gps_points WHERE synced = 0');
        const sessions = await db.getFirstAsync<{count: number}>('SELECT COUNT(*) as count FROM work_sessions WHERE synced = 0');
        setPendingCount((gps?.count || 0) + (sessions?.count || 0));
      } catch (e) {
        console.error(e);
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, [lastSyncTime, isTracking]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSyncing(true);
    try {
      await runFullSync();
    } catch (e: any) {
      if (e.message === 'OFFLINE') {
        Alert.alert('Sem Conexão', 'Não foi possível sincronizar os dados.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleTracking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isTracking) {
      await stopTracking();
      await endSession();
    } else {
      await startSession();
      await startTracking();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.full_name || user?.email?.split('@')[0]}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleManualSync} 
          style={[styles.syncButton, { backgroundColor: isSyncing ? '#e1f5fe' : '#f8f9fa' }]}
        >
          <Ionicons 
            name={isSyncing ? "refresh" : (pendingCount > 0 ? "cloud-offline" : "cloud-done")} 
            size={20} 
            color={isSyncing ? "#007AFF" : (pendingCount > 0 ? "#FFA500" : "#28a745")} 
          />
          <Text style={[styles.syncText, { color: pendingCount > 0 ? "#FFA500" : "#888" }]}>
            {isSyncing ? "Sinc..." : (pendingCount > 0 ? pendingCount : "OK")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: isTracking ? '#E3F2FD' : '#F5F5F5' }]}>
          <View style={styles.statusInfo}>
            <View style={[styles.indicator, { backgroundColor: isTracking ? '#2196F3' : '#9E9E9E' }]}>
              {isTracking && (
                <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }] }]} />
              )}
            </View>
            <Text style={[styles.statusTitle, { color: isTracking ? '#1565C0' : '#616161' }]}>
              {isTracking ? 'RODANDO EM SEGUNDO PLANO' : 'SISTEMA EM ESPERA'}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {isTracking 
              ? 'Seu deslocamento está sendo registrado com precisão.' 
              : 'Inicie um turno para começar o rastreamento GPS.'}
          </Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="navigate-circle" size={24} color="#007AFF" />
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {(activeSession?.total_distance_km || 0).toFixed(2)}
            </Text>
            <Text style={styles.metricLabel}>Km Totais</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="stopwatch" size={24} color="#4CAF50" />
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {formatTime(activeSession?.total_active_seconds || 0)}
            </Text>
            <Text style={styles.metricLabel}>Tempo Méd.</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="cafe" size={24} color="#FF9800" />
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {formatTime(activeSession?.total_idle_seconds || 0)}
            </Text>
            <Text style={styles.metricLabel}>Ocioso</Text>
          </View>

          <View style={[styles.metricBox, { backgroundColor: theme.background, borderColor: '#eee' }]}>
            <Ionicons name="map" size={24} color="#9C27B0" />
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {currentLocation && (currentLocation as any).speed != null 
                ? `${((currentLocation as any).speed * 3.6).toFixed(0)}` 
                : '--'}
            </Text>
            <Text style={styles.metricLabel}>Km/h Atual</Text>
          </View>
        </View>

        {/* GPS Health */}
        <View style={styles.gpsHealth}>
          <Ionicons 
            name="radio-outline" 
            size={16} 
            color={(currentLocation?.accuracy || 100) < 20 ? "#28a745" : "#ffc107"} 
          />
          <Text style={styles.gpsText}>
            Precisão GPS: {currentLocation?.accuracy ? `${currentLocation.accuracy.toFixed(1)}m` : 'Buscando sinal...'}
          </Text>
        </View>
      </ScrollView>

      {/* Main Action Button */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleToggleTracking}
          style={[
            styles.mainButton, 
            { backgroundColor: isTracking ? '#FF3B30' : '#007AFF' }
          ]}
        >
          <Ionicons name={isTracking ? "stop" : "play"} size={28} color="#fff" />
          <Text style={styles.mainButtonText}>
            {isTracking ? "ENCERRAR TURNO" : "INICIAR TURNO"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  syncText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusCard: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    position: 'absolute',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusDescription: {
    fontSize: 14,
    color: '#616161',
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 4,
    fontWeight: '500',
  },
  gpsHealth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 30,
  },
  gpsText: {
    fontSize: 12,
    color: '#8e8e93',
  },
  actionContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  mainButton: {
    flexDirection: 'row',
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
