import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useDashboardScreen from '@/src/hooks/useDashboardScreen';
import { FloatingActionMenu } from '@/src/components/FloatingActionMenu';
import { Screen } from '@/components/layouts/screen';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/blocks/metric-card';
import { ActiveSessionCard } from '@/components/blocks/dashboard/active-session-card';
import { QuickActions } from '@/components/blocks/dashboard/quick-actions';

export default function DashboardScreen() {
  const {
    user,
    isTracking,
    isSyncing,
    pendingCount,
    theme,
    activeSession,
    sessionData,
    loadingSession,
    sessionTime,
    odometer,
    setOdometer,
    isPaused,
    setIsPaused,
    handleSaveOdometer,
    handleManualSync,
    handleToggleTracking,
    handleRouteEvent,
  } = useDashboardScreen();

  // Logic moved from JSX to Memoized values for testability
  const displayUserName = useMemo(() => {
    return user?.name || user?.email?.split('@')[0] || 'Motorista';
  }, [user]);

  const syncStatus = useMemo(() => ({
    icon: isSyncing ? "refresh" : (pendingCount > 0 ? "cloud-offline" : "cloud-done"),
    color: isSyncing ? "#007AFF" : (pendingCount > 0 ? "#FFA500" : "#28a745"),
    text: isSyncing ? "Sincronizando..." : (pendingCount > 0 ? `${pendingCount} pendente(s)` : "Sincronizado"),
    label: isSyncing ? "Sinc..." : (pendingCount > 0 ? String(pendingCount) : "OK")
  }), [isSyncing, pendingCount]);

  return (
    <Screen>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bem-vindo,</Text>
            <Text style={[styles.userName, { color: theme.text }]}>{displayUserName}</Text>
          </View>
          
          <Button
            variant="secondary"
            size="sm"
            onPress={handleManualSync}
            style={isSyncing ? styles.syncingBtn : null}
            leftIcon={<Ionicons name={syncStatus.icon as any} size={20} color={syncStatus.color} />}
          >
            <Text style={[styles.syncText, { color: pendingCount > 0 ? "#FFA500" : "#6b7280" }]}>
              {syncStatus.label}
            </Text>
          </Button>
        </View>

        {/* Content State Machine */}
        {activeSession ? (
          <ActiveSessionCard
            sessionData={sessionData}
            loadingSession={loadingSession}
            sessionTime={sessionTime}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            odometer={odometer}
            setOdometer={setOdometer}
            handleSaveOdometer={handleSaveOdometer}
            handleStopSession={handleToggleTracking}
            handleDeleteSession={() => {}} 
            theme={theme}
          />
        ) : (
          <StartSessionPlaceholder onStart={handleToggleTracking} />
        )}

        <QuickActions 
          handleRouteEvent={handleRouteEvent} 
          isTracking={isTracking} 
        />

        <MetricsSummary />

        <View style={styles.spacer} />
      </ScrollView>

      <FloatingActionMenu />
    </Screen>
  );
}

/**
 * Sub-component for clean JSX and isolation
 */
const StartSessionPlaceholder = ({ onStart }: { onStart: () => void }) => (
  <View style={styles.startContainer}>
    <View style={styles.startIconContainer}>
      <Ionicons name="map" size={48} color="#2563eb" />
    </View>
    <Text style={styles.startTitle}>Pronto para rodar?</Text>
    <Text style={styles.startSubtitle}>Inicie seu turno para começar o rastreamento.</Text>
    <Button
      title="Iniciar Turno"
      size="lg"
      onPress={onStart}
      leftIcon={<Ionicons name="location" size={24} color="#fff" />}
      style={styles.startButton}
    />
  </View>
);

/**
 * Extracted Metrics for readability
 */
const MetricsSummary = () => (
  <>
    <Text style={styles.sectionTitle}>Resumo do Dia</Text>
    <View style={styles.metricsGrid}>
      <MetricCard title="Ganhos" value="R$ 0,00" icon="wallet" color="#10b981" />
      <MetricCard title="Entregas" value="0" icon="cube" color="#2563eb" />
    </View>
    <View style={[styles.metricsGrid, { marginTop: 12 }]}>
      <MetricCard title="Combustível" value="R$ 0,00" icon="water" color="#f59e0b" />
      <MetricCard title="Distância" value="0.0 km" icon="navigate" color="#6b7280" />
    </View>
  </>
);

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  syncingBtn: {
    backgroundColor: '#eff6ff',
  },
  syncText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  startContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  startIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  startTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  startSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  spacer: {
    height: 100,
  },
});
