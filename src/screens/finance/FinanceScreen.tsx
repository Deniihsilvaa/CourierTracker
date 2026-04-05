import { ChartCard } from "@/components/cards/chart-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import { useAnalytics } from "@/src/hooks/useAnalytics";
import { appColors, spacing } from "@/src/theme/colors";
import React, { useMemo } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

const currency = (value?: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

export default function FinanceScreen() {
  const { refreshing, handleManualSync, dailyStats, hourlyData } = useAnalytics();
  const safeDailyStats = Array.isArray(dailyStats) ? dailyStats : [];
  const safeHourlyData = Array.isArray(hourlyData) ? hourlyData : [];

  const totals = useMemo(() => {
    const totalIncome = safeDailyStats.reduce((sum, item) => sum + Number(item.total_income || 0), 0);
    const totalKm = safeDailyStats.reduce((sum, item) => sum + Number(item.total_km || 0), 0);
    const estimatedFuel = totalIncome * 0.18;
    const net = totalIncome - estimatedFuel;

    return { totalIncome, totalKm, estimatedFuel, net };
  }, [safeDailyStats]);

  const monthlyData = useMemo(
    () =>
      safeDailyStats.slice(0, 6).map((item, index) => ({
        label: index === 0 ? "Hoje" : `${index + 1}d`,
        value: Math.max(24, Number(item.total_income || item.total_km || 0)),
        tone: index % 2 === 0 ? appColors.primary : appColors.accentEmerald,
      })),
    [safeDailyStats]
  );

  const weeklyData = useMemo(
    () =>
      safeHourlyData.slice(8, 13).map((value, index) => ({
        label: `${index + 8}h`,
        value: Math.max(12, value),
        tone: index % 2 === 0 ? appColors.accentLilac : appColors.warning,
      })),
    [safeHourlyData]
  );

  return (
    <AppScreen
      title="Financeiro"
      subtitle="Indicadores do caixa do motorista com visao rapida e comparavel."
      scrollable={false}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleManualSync} tintColor={appColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {safeDailyStats.length === 0 ? (
          <>
            <SkeletonCard height={132} />
            <SkeletonCard height={220} />
            <SkeletonCard height={220} />
          </>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard label="Ganhos" value={currency(totals.totalIncome)} icon="wallet-outline" tone="success" trend="+6%" />
              <StatCard label="Combustivel" value={currency(totals.estimatedFuel)} icon="water-outline" tone="warning" trend="+2%" />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard label="Lucro liquido" value={currency(totals.net)} icon="trending-up-outline" tone="primary" trend="+9%" />
              <StatCard label="Volume" value={`${totals.totalKm.toFixed(1)} km`} icon="speedometer-outline" tone="danger" trend="-1%" />
            </View>

            <ChartCard title="Ganhos mensais" subtitle="Recorte simplificado dos ultimos lancamentos." data={monthlyData} />
            <ChartCard title="Performance semanal" subtitle="Faixa horaria com mais atividade recente." data={weeklyData} />

            <SectionHeader title="Ultimos dias" subtitle="Leitura operacional do historico financeiro." />
            {safeDailyStats.slice(0, 5).map((item, index) => (
              <View
                key={`${item.work_day}-${index}`}
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.78)",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  padding: spacing.sm,
                  gap: spacing.xs,
                }}
              >
                <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>
                  {item.work_day || `Dia ${index + 1}`}
                </Text>
                <Text style={{ color: appColors.textSecondary, fontSize: 14 }}>
                  {currency(Number(item.total_income || 0))} em ganhos • {Number(item.total_km || 0).toFixed(1)} km
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}
