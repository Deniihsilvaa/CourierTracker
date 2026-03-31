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
      <Card style={styles.loadingCard}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados da sessão...</Text>
      </Card>
    );
  }

  if (!activeSession) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statItem}>
          <Text style={styles.label}>Tempo de Turno</Text>
          <Text style={styles.timer}>{sessionDuration}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ganhos est.</Text>
          <Text style={styles.statValue}>R$ 0,00</Text>
        </View>
      </View>

      {/* <View style={styles.statsGrid}>
        <View style={styles.statItem}>
        </View>
        <View style={styles.statDivider} />
        <View>
          <Text style={styles.label}>Tempo de Turno</Text>
          <Text style={styles.timer}>{sessionDuration}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ganhos est.</Text>
          <Text style={styles.statValue}>R$ 0,00</Text>
        </View>
      </View> */}

      <View style={styles.odometerSection}>
        <Text style={styles.odometerLabel}>Odômetro Inicial</Text>
        <View style={styles.odometerInputContainer}>
          <TextInput
            style={[styles.input, { backgroundColor: '#e5e7eb' }]}
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
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 15,
    marginBottom: 10,
    backgroundColor: Colors.dark.background,
    color: Colors.dark.text,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.dark.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  timer: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: Colors.dark.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    height: '100%',
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  odometerSection: {
    marginBottom: 20,
  },
  odometerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  odometerInputContainer: {
    flexDirection: 'row',
    gap: 10,
    color: Colors.dark.text,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  saveButton: {
    height: 40,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
