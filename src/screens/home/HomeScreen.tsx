import { PrimaryButton } from "@/components/buttons/primary-button";
import { ChartCard } from "@/components/cards/chart-card";
import { GlassCard } from "@/components/cards/glass-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import useDashboardScreen from "@/src/hooks/useDashboardScreen";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function HomeScreen() {
  const router = useRouter();
  const {
    user,
    activeSession,
    loadingSession,
    sessionTime,
    odometer,
    setOdometer,
    lastOdometer,
    handleStartSession,
    handleStopSession,
    handleManualSync,
    isSyncing,
    pendingCount,
    financials,
    loadingAnalytics,
    isStopModalVisible,
    setIsStopModalVisible,
    endOdometer,
    setEndOdometer,
    confirmStopSession,
  } = useDashboardScreen();

  const pulse = useRef(new Animated.Value(activeSession ? 1 : 0.92)).current;

  useEffect(() => {
    Animated.spring(pulse, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 70,
    }).start();
  }, [activeSession, pulse]);

  const displayName = useMemo(() => user?.name || user?.email?.split("@")[0] || "Motorista", [user]);

  const monthlyChart = useMemo(
    () => [
      { label: "S1", value: Math.max(120, Number(financials?.total_income || 0) * 0.22), tone: appColors.primary },
      { label: "S2", value: Math.max(90, Number(financials?.net_profit || 0) * 0.18), tone: appColors.accentCyan },
      { label: "S3", value: Math.max(80, Number(financials?.total_costs || 0) * 0.16), tone: appColors.warning },
      { label: "S4", value: Math.max(140, Number(financials?.total_income || 0) * 0.28), tone: appColors.success },
    ],
    [financials]
  );

  const weeklyChart = useMemo(
    () => [
      { label: "Seg", value: Math.max(40, Number(financials?.net_profit || 0) * 0.12), tone: appColors.primary },
      { label: "Ter", value: Math.max(54, Number(financials?.total_income || 0) * 0.08), tone: appColors.accentLilac },
      { label: "Qua", value: Math.max(36, Number(financials?.total_fuel || 0) * 0.14), tone: appColors.warning },
      { label: "Qui", value: Math.max(58, Number(financials?.total_income || 0) * 0.1), tone: appColors.accentEmerald },
      { label: "Sex", value: Math.max(72, Number(financials?.net_profit || 0) * 0.16), tone: appColors.success },
    ],
    [financials]
  );

  return (
    <>
      <AppScreen
        title={`Ola, ${displayName}`}
        // subtitle="Painel operacional para iniciar, acompanhar e encerrar o turno sem friccao."
        rightSlot={
          <View style={{ flexDirection: "row", gap: spacing.xxs }}>
            {/* TODO: Sera Removido no futuro sendo substituido por um icone de notificacoes */}
            <Pressable
              onPress={handleManualSync}
              style={{
                width: 46,
                height: 46,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: appColors.surface,
                borderWidth: 1,
                borderColor: appColors.border,
              }}
            >
              <Ionicons
                name={isSyncing ? "sync" : "notifications-outline"}
                size={20}
                color={pendingCount > 0 ? appColors.warning : appColors.textPrimary}
              />
            </Pressable>
          </View>
        }
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}
        >
          <GlassCard>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
              <View style={{ gap: spacing.xs }}>
                <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                  Status do dia
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: radius.pill,
                      backgroundColor: activeSession ? appColors.success : appColors.warning,
                    }}
                  />
                  <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>
                    {activeSession ? "Em turno" : "Aguardando inicio"}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: "rgba(96, 165, 250, 0.12)",
                }}
              >
                <Text style={{ color: appColors.textSecondary, fontSize: 12, fontWeight: "700" }}>
                  {pendingCount} pendencias
                </Text>
              </View>
            </View>
          </GlassCard>

          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <GlassCard
              style={{
                padding: spacing.md,
                backgroundColor: "rgba(37, 99, 235, 0.18)",
                minHeight: 220,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                <View style={{ flex: 1, gap: spacing.sm }}>

                  <Text style={{ color: appColors.textPrimary, fontSize: 26, fontWeight: "900" }}>
                    {activeSession ? "Turno em progresso" : "Pronto para comecar a rodar?"}
                  </Text>
                  <Text style={{ color: "rgba(226, 232, 240, 0.84)", fontSize: 14, lineHeight: 21 }}>
                    {activeSession
                      ? `Tempo ativo ${sessionTime}. Continue registrando o trabalho com poucos toques.`
                      : "Defina o odometro inicial para iniciar o turno."}
                  </Text>
                </View>

              </View>

              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {!activeSession ? (
                  <>
                    <TextInput
                      value={odometer}
                      onChangeText={setOdometer}
                      keyboardType="numeric"
                      placeholder="Odometro inicial"
                      returnKeyType="done"
                      placeholderTextColor={appColors.textMuted}
                      style={{
                        minHeight: 56,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: "rgba(191, 219, 254, 0.20)",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        color: appColors.textPrimary,
                        paddingHorizontal: spacing.sm,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    />
                    {/* Texto de informacao */}
                    <Text style={{ color: appColors.textMuted, fontSize: 10, fontWeight: "600", textTransform: "capitalize", textAlign: "right" }}>
                      Ultimo odometro registrado: {lastOdometer}
                    </Text>
                    <PrimaryButton
                      label="Iniciar turno"
                      onPress={handleStartSession}
                      icon={<Ionicons name="play" size={18} color={appColors.white} />}
                    />
                  </>
                ) : (
                  <PrimaryButton
                    label="Encerrar turno"
                    onPress={handleStopSession}
                    variant="danger"
                    icon={<Ionicons name="pause" size={18} color={appColors.white} />}
                  />
                )}
              </View>
            </GlassCard>
          </Animated.View>

          <SectionHeader title="Resumo diario" subtitle="Leitura rapida de ganhos, custos e saude financeira." />

          {loadingAnalytics ? (
            <>
              <SkeletonCard height={136} />
              <SkeletonCard height={136} />
            </>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <StatCard label="Ganhos" value={formatCurrency(financials?.total_income)} icon="wallet-outline" tone="success" trend="+8%" />
                <StatCard label="Custos" value={formatCurrency(financials?.total_costs)} icon="trending-down-outline" tone="danger" trend="-3%" />
              </View>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <StatCard label="Combustivel" value={formatCurrency(financials?.total_fuel)} icon="water-outline" tone="warning" trend="+2%" />
                <StatCard label="Lucro liquido" value={formatCurrency(financials?.net_profit)} icon="sparkles-outline" tone="primary" trend="+11%" />
              </View>
            </>
          )}

          <SectionHeader title="Visao de desempenho" subtitle="Dois recortes rapidos para decisoes do dia." />

          {loadingSession && !activeSession ? (
            <>
              <SkeletonCard height={220} />
              <SkeletonCard height={220} />
            </>
          ) : (
            <>
              <ChartCard title="Ganhos do mes" subtitle="Distribuicao estimada por semana" data={monthlyChart} />
              <ChartCard title="Performance semanal" subtitle="Sinal rapido de ritmo operacional" data={weeklyChart} />
            </>
          )}

          <GlassCard>
            <SectionHeader title="Acoes rapidas" subtitle="Atalhos para reduzir navegacao durante a operacao." />
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <PrimaryButton
                label="Ver rotas"
                onPress={() => router.push("/routes")}
                variant="secondary"
                icon={<Ionicons name="map-outline" size={18} color={appColors.textPrimary} />}
              />
              <PrimaryButton
                label="Financeiro"
                onPress={() => router.push("/finance")}
                variant="ghost"
                icon={<Ionicons name="bar-chart-outline" size={18} color={appColors.textPrimary} />}
              />
            </View>
          </GlassCard>
        </ScrollView>
      </AppScreen>

      <Modal visible={isStopModalVisible} transparent animationType="fade" onRequestClose={() => setIsStopModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: appColors.overlay,
            justifyContent: "flex-end",
            padding: spacing.sm,
          }}
        >
          <GlassCard
            style={{
              padding: spacing.md,
              gap: spacing.sm,
              borderRadius: radius.xl,
              backgroundColor: "rgba(15, 23, 42, 0.94)",
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: appColors.textPrimary, fontSize: 22, fontWeight: "900" }}>Encerrar turno</Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                Informe o odometro final para fechar a sessao com o mesmo cuidado do inicio.
              </Text>
            </View>

            <TextInput
              value={endOdometer}
              onChangeText={setEndOdometer}
              keyboardType="numeric"
              placeholder="Odometro final"
              placeholderTextColor={appColors.textMuted}
              style={{
                minHeight: 56,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: appColors.border,
                backgroundColor: appColors.surface,
                color: appColors.textPrimary,
                paddingHorizontal: spacing.sm,
                fontSize: 16,
                fontWeight: "700",
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
              <PrimaryButton
                label="Cancelar"
                onPress={() => setIsStopModalVisible(false)}
                variant="ghost"
                icon={<Ionicons name="close-outline" size={18} color={appColors.textPrimary} />}
              />
              <PrimaryButton
                label="Confirmar"
                onPress={confirmStopSession}
                variant="danger"
                icon={<Ionicons name="checkmark-outline" size={18} color={appColors.white} />}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}
