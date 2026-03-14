import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import useSettingsScreen from '@/src/hooks/useSettingsScreen';
import { stylesSettings } from '@/src/styles';
import { Switch } from 'react-native-gesture-handler';

export default function SettingsScreen() {
  const { router, user, colorScheme, theme, notifications, pendingSync, vehicle, highPrecision, handleCleanup, openBatterySettings, toggleNotifications, setVehicle, setHighPrecision, setNotifications, setPendingSync, signOut } = useSettingsScreen();

  return (
    <View style={[stylesSettings.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Configurações', headerShown: true }} />

      <ScrollView contentContainerStyle={stylesSettings.scrollContent}>
        {/* Diagnostic Button */}
        <TouchableOpacity
          style={stylesSettings.diagnosticBanner}
          onPress={() => router.push('/diagnostic')}
        >
          <View style={stylesSettings.diagnosticLeft}>
            <Ionicons name="speedometer" size={24} color="#fff" />
            <View>
              <Text style={stylesSettings.diagnosticTitle}>System Check</Text>
              <Text style={stylesSettings.diagnosticSub}>Verificar permissões e sensores</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Profile Card */}
        <View style={[stylesSettings.profileCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f8f9fa' }]}>
          <View style={[stylesSettings.avatar, { backgroundColor: theme.tint }]}>
            <Text style={stylesSettings.avatarText}>{user?.name?.[0] || 'U'}</Text>
          </View>
          <View style={stylesSettings.profileInfo}>
            <Text style={[stylesSettings.userName, { color: theme.text }]}>{user?.name || 'Entregador'}</Text>
            <Text style={[stylesSettings.userEmail, { color: '#8e8e93' }]}>{user?.email}</Text>
          </View>
          <View style={stylesSettings.syncBadge}>
            <Text style={stylesSettings.syncBadgeText}>{pendingSync} pendentes</Text>
          </View>
        </View>

        {/* Operational Section */}
        <Text style={stylesSettings.sectionTitle}>Operação</Text>
        <View style={[stylesSettings.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <View style={stylesSettings.row}>
            <View style={stylesSettings.rowLeft}>
              <View style={[stylesSettings.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="bicycle" size={20} color="#9C27B0" />
              </View>
              <Text style={[stylesSettings.rowText, { color: theme.text }]}>Veículo: {vehicle}</Text>
            </View>
            <TouchableOpacity onPress={() => setVehicle(vehicle === 'Moto' ? 'Carro' : 'Moto')}>
              <Text style={{ color: theme.tint, fontWeight: '600' }}>Trocar</Text>
            </TouchableOpacity>
          </View>

          <View style={stylesSettings.separator} />

          <View style={stylesSettings.row}>
            <View style={stylesSettings.rowLeft}>
              <View style={[stylesSettings.iconContainer, { backgroundColor: '#E1F5FE' }]}>
                <Ionicons name="location" size={20} color="#03A9F4" />
              </View>
              <Text style={[stylesSettings.rowText, { color: theme.text }]}>Alta Precisão GPS</Text>
            </View>
            <Switch value={highPrecision} onValueChange={setHighPrecision} />
          </View>
        </View>

        {/* System Section */}
        <Text style={stylesSettings.sectionTitle}>Dispositivo e Dados</Text>
        <View style={[stylesSettings.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <TouchableOpacity style={stylesSettings.row} onPress={handleCleanup}>
            <View style={stylesSettings.rowLeft}>
              <View style={[stylesSettings.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="trash" size={20} color="#F44336" />
              </View>
              <Text style={[stylesSettings.rowText, { color: theme.text }]}>Limpar Dados Antigos</Text>
            </View>
          </TouchableOpacity>

          <View style={stylesSettings.separator} />

          <TouchableOpacity style={stylesSettings.row} onPress={openBatterySettings}>
            <View style={stylesSettings.rowLeft}>
              <View style={[stylesSettings.iconContainer, { backgroundColor: '#FFF8E1' }]}>
                <Ionicons name="battery-dead" size={20} color="#FFC107" />
              </View>
              <Text style={[stylesSettings.rowText, { color: theme.text }]}>Otimização de Bateria</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <Text style={stylesSettings.sectionTitle}>Conta</Text>
        <View style={[stylesSettings.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <View style={stylesSettings.row}>
            <View style={stylesSettings.rowLeft}>
              <View style={[stylesSettings.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="notifications" size={20} color="#4CAF50" />
              </View>
              <Text style={[stylesSettings.rowText, { color: theme.text }]}>Notificações</Text>
            </View>
            <Switch value={notifications} onValueChange={toggleNotifications} />
          </View>
        </View>

        {/* Logout Section */}
        <TouchableOpacity
          style={[stylesSettings.logoutButton, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}
          onPress={signOut}
        >
          <Ionicons name="log-out" size={22} color="#FF3B30" />
          <Text style={stylesSettings.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}


