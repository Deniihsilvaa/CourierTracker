import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/modules/auth/store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Linking from 'expo-linking';
import { localDatabase } from '@/src/services/localDatabase';
import { cleanupSyncedData } from '@/src/services/sqlite';

import { requestNotificationPermissions } from '@/src/utils/notification-permissions';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [notifications, setNotifications] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [vehicle, setVehicle] = useState('Moto');
  const [highPrecision, setHighPrecision] = useState(true);

  useEffect(() => {
    const fetchSyncStatus = async () => {
      const gps = await localDatabase.query('gps_points', 'WHERE synced = 0');
      const events = await localDatabase.query('route_events', 'WHERE synced = 0');
      setPendingSync(gps.length + events.length);
    };
    fetchSyncStatus();
  }, []);

  const handleCleanup = () => {
    Alert.alert(
      'Limpar Cache',
      'Deseja remover dados de GPS com mais de 7 dias que já foram sincronizados?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Limpar Agora', 
          onPress: async () => {
            await cleanupSyncedData();
            Alert.alert('Sucesso', 'Armazenamento otimizado.');
          } 
        },
      ]
    );
  };

  const openBatterySettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings(); 
    } else {
      Linking.openURL('app-settings:');
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      setNotifications(granted);
    } else {
      Alert.alert(
        'Desativar Alertas',
        'Isso impedirá que você registre eventos diretamente pela barra de notificações. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setNotifications(true) },
          { text: 'Desativar', style: 'destructive', onPress: () => setNotifications(false) },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Configurações', headerShown: true }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Diagnostic Button */}
        <TouchableOpacity 
          style={styles.diagnosticBanner} 
          onPress={() => router.push('/diagnostic')}
        >
          <View style={styles.diagnosticLeft}>
            <Ionicons name="speedometer" size={24} color="#fff" />
            <View>
              <Text style={styles.diagnosticTitle}>System Check</Text>
              <Text style={styles.diagnosticSub}>Verificar permissões e sensores</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f8f9fa' }]}>
          <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
            <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.name || 'Entregador'}</Text>
            <Text style={[styles.userEmail, { color: '#8e8e93' }]}>{user?.email}</Text>
          </View>
          <View style={styles.syncBadge}>
            <Text style={styles.syncBadgeText}>{pendingSync} pendentes</Text>
          </View>
        </View>

        {/* Operational Section */}
        <Text style={styles.sectionTitle}>Operação</Text>
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="bicycle" size={20} color="#9C27B0" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Veículo: {vehicle}</Text>
            </View>
            <TouchableOpacity onPress={() => setVehicle(vehicle === 'Moto' ? 'Carro' : 'Moto')}>
              <Text style={{ color: theme.tint, fontWeight: '600' }}>Trocar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="location" size={20} color="#03A9F4" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Alta Precisão GPS</Text>
            </View>
            <Switch value={highPrecision} onValueChange={setHighPrecision} />
          </View>
        </View>

        {/* System Section */}
        <Text style={styles.sectionTitle}>Dispositivo e Dados</Text>
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <TouchableOpacity style={styles.row} onPress={handleCleanup}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="trash" size={20} color="#F44336" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Limpar Dados Antigos</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity style={styles.row} onPress={openBatterySettings}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="battery-dead" size={20} color="#FFC107" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Otimização de Bateria</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="notifications" size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Notificações</Text>
            </View>
            <Switch value={notifications} onValueChange={toggleNotifications} />
          </View>
        </View>

        {/* Logout Section */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]} 
          onPress={signOut}
        >
          <Ionicons name="log-out" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 10 },
  diagnosticBanner: { backgroundColor: '#007AFF', padding: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, shadowColor: '#007AFF', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  diagnosticLeft: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  diagnosticTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  diagnosticSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  profileCard: { flexDirection: 'row', padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 30, elevation: 2 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 15 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  userEmail: { fontSize: 13 },
  syncBadge: { backgroundColor: 'rgba(0,122,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  syncBadgeText: { color: '#007AFF', fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#8e8e93', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  section: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowText: { fontSize: 15, fontWeight: '500' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#c7c7cc', marginLeft: 64 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, marginTop: 10, marginBottom: 40, gap: 10, elevation: 2 },
  logoutText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
});
