import { StyleSheet, View, Text, Button, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/src/modules/auth/store';
import { useTrackingStore } from '@/src/modules/tracking/store';
import { useSessionStore } from '@/src/modules/sessions/store';
import { startTracking, stopTracking } from '@/src/modules/tracking/service';
import { startSession, endSession } from '@/src/modules/sessions/service';
import { runFullSync } from '@/src/services/sync';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getDb } from '@/src/services/sqlite';

export default function DashboardScreen() {
  const { user, signOut } = useAuthStore();
  const { isTracking, currentLocation, lastSyncTime } = useTrackingStore();
  const { activeSession } = useSessionStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Check for unsynced data periodically
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
    setIsSyncing(true);
    try {
      await runFullSync();
    } catch (e: any) {
      if (e.message === 'OFFLINE') {
        Alert.alert('Sem Conexão', 'Não foi possível sincronizar os dados. Verifique sua conexão com a internet.');
      } else {
        console.error('Manual sync error:', e);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncIcon = () => {
    if (isSyncing) return { name: 'cloud-upload', color: '#007AFF', label: 'Sincronizando...' };
    if (pendingCount > 0) return { name: 'cloud-offline', color: '#FFA500', label: `${pendingCount} pendentes` };
    return { name: 'cloud-done', color: '#28a745', label: 'Sincronizado' };
  };

  const syncStatus = getSyncIcon();

  const handleToggleTracking = async () => {
    if (isTracking) {
      await stopTracking();
      await endSession();
    } else {
      await startSession();
      await startTracking();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.syncHeader}>
        <Text style={styles.title}>Olá, {user?.full_name || user?.email?.split('@')[0]}</Text>
        <TouchableOpacity onPress={handleManualSync} disabled={isSyncing} style={styles.syncIconContainer}>
          <Ionicons name={syncStatus.name as any} size={24} color={syncStatus.color} />
          <Text style={[styles.syncLabel, { color: syncStatus.color }]}>{syncStatus.label}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusLabel}>Estado Atual:</Text>
        <Text style={[styles.statusValue, { color: isTracking ? '#28a745' : '#6c757d' }]}>
          {isTracking ? 'Trabalhando / Online' : 'Fora de Serviço / Offline'}
        </Text>
      </View>

      <Button
        title={isTracking ? 'Encerrar Turno' : 'Iniciar Turno'}
        onPress={handleToggleTracking}
        color={isTracking ? '#dc3545' : '#28a745'}
      />

      {isTracking && currentLocation && (
        <View style={styles.locationContainer}>
          <View style={styles.metricCard}>
            <Ionicons name="navigate-outline" size={20} color="#666" />
            <Text style={styles.sessionText}>
              {(activeSession?.total_distance_km || 0).toFixed(2)} km percorridos
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.timeText}>
              Ativo: {Math.floor((activeSession?.total_active_seconds || 0) / 60)}m | 
              Ocioso: {Math.floor((activeSession?.total_idle_seconds || 0) / 60)}m
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Button title="Sair do Aplicativo" onPress={signOut} color="#333" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  syncHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -40,
  },
  syncIconContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  syncLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBox: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  locationContainer: {
    marginTop: 32,
    gap: 12,
  },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  sessionText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    marginTop: 60,
  },
});
