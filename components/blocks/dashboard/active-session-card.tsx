import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface ActiveSessionCardProps {
  sessionData: any;
  loadingSession: boolean;
  sessionTime: string;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  odometer: string;
  setOdometer: (v: string) => void;
  handleSaveOdometer: () => void;
  handleStopSession: () => void;
  handleDeleteSession: () => void;
  theme: any;
}

export const ActiveSessionCard = ({
  sessionData,
  loadingSession,
  sessionTime,
  isPaused,
  setIsPaused,
  odometer,
  setOdometer,
  handleSaveOdometer,
  handleStopSession,
  handleDeleteSession,
  theme
}: ActiveSessionCardProps) => {
  if (loadingSession) {
    return (
      <Card style={styles.loadingCard}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando dados da sessão...</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Tempo de Turno</Text>
          <Text style={[styles.timer, { color: theme.text }]}>{sessionTime}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isPaused ? '#f59e0b' : '#10b981' }]} />
          <Text style={styles.statusText}>{isPaused ? 'Pausado' : 'Em curso'}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distância</Text>
          <Text style={styles.statValue}>{(sessionData?.total_distance_km || 0).toFixed(2)} km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ganhos est.</Text>
          <Text style={styles.statValue}>R$ 0,00</Text>
        </View>
      </View>

      <View style={styles.odometerSection}>
        <Text style={styles.odometerLabel}>Odômetro Inicial</Text>
        <View style={styles.odometerInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ex: 12500"
            keyboardType="numeric"
            value={odometer}
            onChangeText={setOdometer}
          />
          <Button
            title="Salvar"
            size="sm"
            onPress={handleSaveOdometer}
            style={styles.saveButton}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => setIsPaused(!isPaused)}
          style={styles.actionButton}
          leftIcon={<Ionicons name={isPaused ? "play" : "pause"} size={20} color="#2563eb" />}
          title={isPaused ? "Retomar" : "Pausar"}
        />
        <Button
          variant="danger"
          onPress={handleStopSession}
          style={styles.actionButton}
          leftIcon={<Ionicons name="stop" size={20} color="#fff" />}
          title="Parar"
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    marginBottom: 16,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timer: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
    color: '#374151',
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
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  odometerSection: {
    marginBottom: 20,
  },
  odometerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  odometerInputContainer: {
    flexDirection: 'row',
    gap: 10,
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
