import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSessionStore } from '@/src/modules/sessions/store';

interface ActiveSessionCardProps {
  handleStopSession: () => void;
  handleDeleteSession: () => void;
  handleSaveOdometer: () => void;
  sessionDuration: string;
  isLoading: boolean;
  odometer: string;
}

export const ActiveSessionCard = ({
  handleStopSession,
  handleDeleteSession,
  sessionDuration,
  isLoading,
  odometer
}: ActiveSessionCardProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const {
    activeSession,
  } = useSessionStore();

  if (isLoading) {
    return (
      <Card style={[styles.loadingCard, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Carregando dados da sessão...</Text>
      </Card>
    );
  }

  if (!activeSession) return null;

  return (
    <Card style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.statItem}>
          <Text style={[styles.label, { color: theme.text }]}>Tempo de Turno</Text>
          <Text style={[styles.timer, { color: theme.text }]}>{sessionDuration}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: theme.text + '80' }]}>Ganhos est.</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>R$ 0,00</Text>
        </View>
      </View>

      <View style={styles.odometerSection}>
        <Text style={[styles.odometerLabel, { color: theme.text }]}>Odômetro Inicial</Text>
        <View style={styles.odometerInputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.text + '20' }]}
            value={odometer}
            editable={false}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="danger"
          onPress={handleStopSession}
          style={styles.actionButton}
          leftIcon={<Ionicons name="stop" size={20} color="#fff" />}
          title="Parar Turno"
        />
        <Button
          variant="secondary"
          onPress={handleDeleteSession}
          style={styles.deleteButton}
          leftIcon={<Ionicons name="trash-outline" size={20} color="#ef4444" />}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderRadius: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  timer: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  odometerSection: {
    marginBottom: 24,
  },
  odometerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  odometerInputContainer: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    width: 56,
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
});
