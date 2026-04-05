import { FloatingActionButton } from "@/components/buttons/floating-action-button";
import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import { CreateRouteModal } from "@/src/components/CreateRouteModal";
import { RouteActionsModal } from "@/src/components/RouteActionsModal";
import { useRouteStore } from "@/src/store/routeStore";
import { Route } from "@/src/types/route.types";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const statusMeta: Record<Route["route_status"], { label: string; color: string }> = {
  pending: { label: "Pendente", color: appColors.warning },
  going_to_pickup: { label: "Coleta", color: appColors.primary },
  pickup_arrived: { label: "Na coleta", color: appColors.accentLilac },
  delivering: { label: "Entrega", color: appColors.info },
  completed: { label: "Concluida", color: appColors.success },
  cancelled: { label: "Cancelada", color: appColors.danger },
};

export default function RoutesScreen() {
  const { routes, loadRoutes, isLoading } = useRouteStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  const summary = useMemo(
    () => ({
      total: routes.length,
      active: routes.filter((route) => route.route_status !== "completed" && route.route_status !== "cancelled").length,
      pendingPayment: routes.filter((route) => route.payment_required && route.payment_status !== "paid").length,
    }),
    [routes]
  );

  return (
    <AppScreen
      title="Rotas"
      subtitle="Fluxo manual com prioridade para velocidade de selecao e leitura operacional."
      scrollable={false}
    >
      <View style={{ flex: 1, gap: spacing.sm }}>
        <GlassCard>
          <SectionHeader title="Painel de entregas" subtitle="Indicadores rapidos para o turno atual." />
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <RouteMetric label="Total" value={String(summary.total)} icon="albums-outline" />
            <RouteMetric label="Ativas" value={String(summary.active)} icon="navigate-outline" />
            <RouteMetric label="Cobrancas" value={String(summary.pendingPayment)} icon="cash-outline" />
          </View>
        </GlassCard>

        {isLoading ? (
          <>
            <SkeletonCard height={160} />
            <SkeletonCard height={160} />
            <SkeletonCard height={160} />
          </>
        ) : routes.length === 0 ? (
          <GlassCard>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>Nenhuma rota ativa</Text>
            <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.xs }}>
              Crie rotas manuais com cliente, coleta e entrega para iniciar o fluxo do motorista.
            </Text>
          </GlassCard>
        ) : (
          <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            {routes.map((route) => (
              <RouteOverviewCard key={route.id} route={route} onOpenActions={setSelectedRoute} />
            ))}
          </ScrollView>
        )}
      </View>

      <FloatingActionButton label="Nova rota" icon="add" onPress={() => setModalVisible(true)} />

      <CreateRouteModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <RouteActionsModal visible={!!selectedRoute} onClose={() => setSelectedRoute(null)} route={selectedRoute} />
    </AppScreen>
  );
}

function RouteOverviewCard({
  route,
  onOpenActions,
}: {
  route: Route;
  onOpenActions: (route: Route) => void;
}) {
  const status = statusMeta[route.route_status];

  return (
    <GlassCard>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: radius.pill,
              backgroundColor: `${status.color}24`,
            }}
          >
            <Text style={{ color: status.color, fontSize: 12, fontWeight: "800" }}>{status.label}</Text>
          </View>
          <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }} numberOfLines={2}>
            {route.pickup_location}
          </Text>
          <Text style={{ color: appColors.textSecondary, fontSize: 14 }} numberOfLines={2}>
            {route.delivery_location || "Entrega ainda nao definida"}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
          {route.value != null ? (
            <Text style={{ color: appColors.success, fontSize: 18, fontWeight: "900" }}>
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(route.value)}
            </Text>
          ) : null}
          <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700" }}>
            {route.payment_required ? (route.payment_status === "paid" ? "Pagamento recebido" : "Cobranca pendente") : "Sem cobranca"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        <RouteMetric label="Cliente" value={route.client_id ? "Vinculado" : "Livre"} icon="person-outline" compact />
        <RouteMetric label="Status" value={status.label} icon="pulse-outline" compact />
      </View>

      <Pressable
        onPress={() => onOpenActions(route)}
        style={{
          marginTop: spacing.sm,
          minHeight: 44,
          borderRadius: radius.lg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: appColors.borderStrong,
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      >
        <Text style={{ color: appColors.textPrimary, fontWeight: "800" }}>Abrir acoes da rota</Text>
      </Pressable>
    </GlassCard>
  );
}

function RouteMetric({
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
        minHeight: compact ? 68 : 88,
        borderRadius: radius.lg,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: "rgba(255,255,255,0.04)",
        gap: spacing.xs,
      }}
    >
      <Ionicons name={icon} size={18} color={appColors.primary} />
      <Text style={{ color: appColors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
