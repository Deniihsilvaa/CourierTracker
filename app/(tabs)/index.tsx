import { ActiveSessionCard } from '@/components/blocks/dashboard/active-session-card';
import { MetricCard } from '@/components/blocks/metric-card';
import { Screen } from '@/components/layouts/screen';
import { Button } from '@/components/ui/button';
import { FloatingActionMenu } from '@/src/components/FloatingActionMenu';
import useDashboardScreen from '@/src/hooks/useDashboardScreen';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
  const {
    user,
    theme,
    activeSession,
    loadingSession,
    sessionTime,
    odometer,
    setOdometer,
    handleSaveOdometer,
    handleManualSync,
    handleStartSession,
    handleStopSession,
    handleRouteEvent,
    isStopModalVisible,
    setIsStopModalVisible,
    endOdometer,
    setEndOdometer,
    confirmStopSession,
    isSyncing,
    pendingCount,
    financials,
    loadingAnalytics,
    fetchFinancialSummary
  } = useDashboardScreen();

  useFocusEffect(
    useCallback(() => {
      fetchFinancialSummary("month");
    }, [fetchFinancialSummary])
  );

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
    <Screen style={{ backgroundColor: theme.background }} scrollable={false}>
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
        {loadingSession && !activeSession ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={[styles.loadingText, { color: theme.text }]}>Carregando turno...</Text>
          </View>
        ) : activeSession ? (
          <ActiveSessionCard
            handleStopSession={handleStopSession}
            handleDeleteSession={() => { }}
            handleSaveOdometer={handleSaveOdometer}
            sessionDuration={sessionTime}
            isLoading={loadingSession}
            odometer={odometer}
          />
        ) : (
          <StartSessionPlaceholder
            onStart={handleStartSession}
            themeLayout={theme}
            odometer={odometer}
            setOdometer={setOdometer}
          />
        )}

        <MetricsSummary data={financials} isLoading={loadingAnalytics} />

        <View style={styles.spacer} />
      </ScrollView>

      {/* Modal de Finalização de Sessão */}
      <Modal
        visible={isStopModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsStopModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Encerrar Turno</Text>
              <TouchableOpacity onPress={() => setIsStopModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Deseja informar o odômetro final?
              {activeSession?.start_odometer ? ` (Mínimo: ${activeSession.start_odometer})` : ''}
            </Text>

            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Odômetro Final (Opcional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 12600"
                keyboardType="numeric"
                value={endOdometer}
                onChangeText={setEndOdometer}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="secondary"
                style={styles.modalActionBtn}
                onPress={() => setIsStopModalVisible(false)}
              />
              <Button
                title="Encerrar"
                variant="danger"
                style={styles.modalActionBtn}
                onPress={confirmStopSession}
              />
            </View>
          </View>
        </View>
      </Modal>

      <FloatingActionMenu />
    </Screen>
  );
}

/**
 * Sub-component for clean JSX and isolation
 */
const StartSessionPlaceholder = ({
  onStart,
  themeLayout,
  odometer,
  setOdometer
}: {
  onStart: () => void,
  themeLayout: any,
  odometer: string,
  setOdometer: (v: string) => void
}) => (
  <View style={[styles.startContainer, { backgroundColor: themeLayout.background }]}>
    <View style={styles.startIconContainer}>
      <Ionicons name="map" size={48} color="#2563eb" />
    </View>
    <Text style={[styles.startTitle, { color: themeLayout.text }]}>Pronto para rodar?</Text>
    <Text style={[styles.startSubtitle, { color: themeLayout.text, marginBottom: 16 }]}>
      Informe seu odômetro inicial para começar o turno.
    </Text>

    <View style={styles.odometerInputWrapper}>
      <Text style={styles.inputLabel}>Odômetro Inicial</Text>
      <TextInput
        style={styles.odometerInput}
        placeholder="Ex: 12500"
        keyboardType="numeric"
        value={odometer}
        onChangeText={setOdometer}
      />
    </View>

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
const MetricsSummary = ({ data, isLoading }: { data: any, isLoading: boolean }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  if (isLoading && !data) {
    return (
      <View style={styles.metricsLoading}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.metricsLoadingText}>Carregando métricas...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Resumo diário</Text>
        {isLoading && <ActivityIndicator size="small" color="#2563eb" style={{ marginLeft: 8 }} />}
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Ganhos"
          value={formatCurrency(data?.total_income)}
          icon="wallet"
          color="#10b981"
        />

        <MetricCard
          title="Custos"
          value={formatCurrency(data?.total_costs)}
          icon="trending-down"
          color="#ef4444"
        />

      </View>
      <View style={[styles.metricsGrid, { marginTop: 12 }]}>
        <MetricCard
          title="Combustível"
          value={formatCurrency(data?.total_fuel)}
          icon="water"
          color="#f59e0b"
        />
        <MetricCard
          title="Líquido"
          value={formatCurrency(data?.net_profit)}
          icon="trending-up"
          color="#2563eb"
        />
      </View>
    </>
  );
};

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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
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
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    width: '100%',
  },
  odometerInputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  odometerInput: {
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricsLoading: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    marginBottom: 20,
  },
  metricsLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  spacer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionBtn: {
    flex: 1,
  },
});
