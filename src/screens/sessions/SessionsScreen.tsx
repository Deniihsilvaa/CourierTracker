import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import useSessions from "@/src/hooks/useSessions";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { FormatDuration } from "@/src/utils/format";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

export default function SessionsScreen() {
  const { loading, refreshing, onRefresh, totals, sections, timeFilter, setTimeFilter } = useSessions();

  const filterOptions = useMemo(
    () => [
      { value: "7d", label: "7 dias" },
      { value: "30d", label: "30 dias" },
      { value: "all", label: "Tudo" },
    ],
    []
  );

  return (
    <AppScreen title="Sessões" subtitle="Histórico organizado com leitura rápida de duração, distância e progresso." scrollable={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard>
          <SectionHeader title="Resumo consolidado" subtitle="Indicadores principais do período selecionado." />
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <SessionMetric label="Turnos" value={String(totals.count)} icon="calendar-outline" />
            <SessionMetric label="Distância" value={`${totals.distance.toFixed(1)} km`} icon="navigate-outline" />
            <SessionMetric label="Tempo" value={`${Math.floor(totals.duration / 3600)} h`} icon="time-outline" />
          </View>
        </GlassCard>

        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          {filterOptions.map((option) => {
            const active = timeFilter === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setTimeFilter(option.value as any)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? "rgba(79, 140, 255, 0.20)" : appColors.surface,
                  borderWidth: 1,
                  borderColor: active ? "rgba(96, 165, 250, 0.28)" : appColors.border,
                }}
              >
                <Text style={{ color: appColors.textPrimary, fontWeight: "800", fontSize: 13 }}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <>
            <SkeletonCard height={144} />
            <SkeletonCard height={144} />
            <SkeletonCard height={144} />
          </>
        ) : sections.length === 0 ? (
          <GlassCard>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>Nenhuma sessão encontrada</Text>
            <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.xs }}>
              Assim que você encerrar turnos, o histórico aparecerá aqui com agrupamento por data.
            </Text>
          </GlassCard>
        ) : (
          sections.map((section) => (
            <View key={section.title} style={{ gap: spacing.xs }}>
              <SectionHeader
                title={section.title}
                subtitle={`${section.count} turno(s) • ${section.totalKm.toFixed(1)} km`}
              />
              {section.data.map((item) => (
                <GlassCard key={item.id}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                    <View style={{ flex: 1, gap: spacing.xs }}>
                      <Text style={{ color: appColors.textPrimary, fontSize: 17, fontWeight: "800" }}>
                        {new Date(item.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {item.end_time
                          ? ` - ${new Date(item.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : " • Em andamento"}
                      </Text>
                      <Text style={{ color: appColors.textSecondary, fontSize: 14 }}>
                        Odômetro {item.start_odometer || "---"} → {item.end_odometer || "---"}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: radius.pill,
                        backgroundColor:
                          item.status === "closed" ? "rgba(34, 197, 94, 0.18)" : "rgba(245, 158, 11, 0.18)",
                      }}
                    >
                      <Text style={{ color: appColors.textPrimary, fontSize: 12, fontWeight: "800" }}>
                        {item.status === "closed" ? "Concluído" : "Ativo"}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                    <SessionMetric label="KM" value={(item.total_distance_km || 0).toFixed(1)} icon="speedometer-outline" compact />
                    <SessionMetric label="Ativo" value={FormatDuration({ seconds: item.total_active_seconds || 0, format: "short" })} icon="timer-outline" compact />
                  </View>
                </GlassCard>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </AppScreen>
  );
}

function SessionMetric({
  label,
  value,
  icon,
  compact = false,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: compact ? 72 : 92,
        borderRadius: radius.lg,
        padding: spacing.sm,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: appColors.border,
        gap: spacing.xs,
      }}
    >
      <Ionicons name={icon} size={18} color={appColors.primary} />
      <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: appColors.textPrimary, fontSize: compact ? 16 : 18, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}
