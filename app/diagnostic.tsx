import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Network from 'expo-network';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function DiagnosticScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [isScanning, setIsScanning] = useState(false);
  const [results, setStats] = useState({
    gpsForeground: 'pending',
    gpsBackground: 'pending',
    notifications: 'pending',
    network: 'pending',
    battery: 'pending'
  });

  const runDiagnostic = async () => {
    setIsScanning(true);
    
    // Reset
    setStats({
      gpsForeground: 'loading',
      gpsBackground: 'loading',
      notifications: 'loading',
      network: 'loading',
      battery: 'loading'
    });

    // 1. GPS Foreground
    const { status: fg } = await Location.getForegroundPermissionsAsync();
    setStats(prev => ({ ...prev, gpsForeground: fg === 'granted' ? 'success' : 'error' }));
    await delay(600);

    // 2. GPS Background
    const { status: bg } = await Location.getBackgroundPermissionsAsync();
    setStats(prev => ({ ...prev, gpsBackground: bg === 'granted' ? 'success' : 'error' }));
    await delay(600);

    // 3. Notifications
    const { status: notif } = await Notifications.getPermissionsAsync();
    setStats(prev => ({ ...prev, notifications: notif === 'granted' ? 'success' : 'error' }));
    await delay(600);

    // 4. Network
    const net = await Network.getNetworkStateAsync();
    setStats(prev => ({ ...prev, network: net.isConnected ? 'success' : 'error' }));
    await delay(600);

    // 5. Battery (Simulação de check de otimização)
    setStats(prev => ({ ...prev, battery: 'warning' }));
    
    setIsScanning(false);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'loading') return <Ionicons name="sync" size={20} color="#007AFF" />;
    if (status === 'success') return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
    if (status === 'error') return <Ionicons name="close-circle" size={24} color="#FF3B30" />;
    if (status === 'warning') return <Ionicons name="warning" size={24} color="#FF9800" />;
    return <Ionicons name="ellipse-outline" size={24} color="#ccc" />;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <Stack.Screen options={{ title: 'System Check', headerShown: true, headerTintColor: '#fff', headerStyle: { backgroundColor: '#000' } }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={80} color="#007AFF" />
          <Text style={styles.title}>Diagnóstico de Operação</Text>
          <Text style={styles.subtitle}>Verificando integridade dos protocolos de rastreamento</Text>
        </View>

        <View style={styles.scanContainer}>
          <DiagnosticRow label="Permissão GPS (App Aberto)" status={results.gpsForeground} />
          <DiagnosticRow label="Permissão GPS (Background)" status={results.gpsBackground} />
          <DiagnosticRow label="Protocolo de Notificações" status={results.notifications} />
          <DiagnosticRow label="Conectividade de Rede" status={results.network} />
          <DiagnosticRow label="Otimização de Bateria" status={results.battery} sublabel="Recomendado: Não Otimizado" />
        </View>

        {results.battery === 'warning' && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle" size={20} color="#FF9800" />
            <Text style={styles.warningText}>
              Atenção: O Android pode suspender o rastreamento para economizar bateria. 
              Vá em configurações e desative a otimização para este app.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.disabledButton]} 
          onPress={runDiagnostic}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'ANALISANDO...' : 'INICIAR VARREDURA'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  function DiagnosticRow({ label, status, sublabel }: any) {
    return (
      <View style={styles.row}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowLabel}>{label}</Text>
          {sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
        </View>
        <StatusIcon status={status} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  subtitle: { color: '#8e8e93', fontSize: 14, textAlign: 'center', marginTop: 8 },
  scanContainer: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#2c2c2e' },
  rowInfo: { flex: 1 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  rowSublabel: { color: '#8e8e93', fontSize: 12, marginTop: 2 },
  warningBox: { backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: 16, borderRadius: 12, marginTop: 24, flexDirection: 'row', gap: 12 },
  warningText: { color: '#FF9800', fontSize: 13, flex: 1, lineHeight: 18 },
  footer: { padding: 24, paddingBottom: 40 },
  scanButton: { backgroundColor: '#007AFF', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  disabledButton: { opacity: 0.6 },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});
