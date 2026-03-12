import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/modules/auth/store';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Linking from 'expo-linking';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const [notifications, setNotifications] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Funcionalidade', 'A alteração de senha estará disponível em breve via e-mail de recuperação.');
  };

  const handleUpdateCheck = () => {
    Alert.alert('Atualização', 'Você está usando a versão mais recente do sistema (v1.0.0-beta).');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Configurações', headerShown: true }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#f8f9fa' }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
              <Text style={styles.avatarText}>
                {user?.email?.[0].toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>Entregador</Text>
            <Text style={[styles.userEmail, { color: '#8e8e93' }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Conta e Segurança</Text>
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <TouchableOpacity style={styles.row} onPress={handleChangePassword}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="lock-closed" size={20} color="#2196F3" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Alterar Senha</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="notifications" size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Notificações</Text>
            </View>
            <Switch 
              value={notifications} 
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: theme.tint }}
            />
          </View>
        </View>

        {/* System Section */}
        <Text style={styles.sectionTitle}>Informações do Sistema</Text>
        <View style={[styles.section, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]}>
          <TouchableOpacity style={styles.row} onPress={handleUpdateCheck}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="cloud-download" size={20} color="#FF9800" />
              </View>
              <View>
                <Text style={[styles.rowText, { color: theme.text }]}>Verificar Atualizações</Text>
                <Text style={styles.subText}>Versão: 1.0.0-beta</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity 
            style={styles.row}
            onPress={() => Linking.openURL('https://github.com/Deniihsilvaa/CourierTracker')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="information-circle" size={20} color="#9C27B0" />
              </View>
              <Text style={[styles.rowText, { color: theme.text }]}>Sobre o Aplicativo</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#fff' }]} 
          onPress={handleSignOut}
        >
          <Ionicons name="log-out" size={22} color="#FF3B30" />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Desenvolvido com ❤️ para Entregadores</Text>
          <Text style={styles.footerText}>Courier Tracker Dashboard © 2024</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  profileCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  section: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c7c7cc',
    marginLeft: 64,
  },
  subText: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 40,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    color: '#8e8e93',
    fontSize: 12,
    marginBottom: 4,
  },
});
