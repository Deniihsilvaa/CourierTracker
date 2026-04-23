import { FloatingActionButton } from "@/components/buttons/floating-action-button";
import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import { CreateRouteModal } from "@/src/components/CreateRouteModal";
import { RouteActionsModal } from "@/src/components/RouteActionsModal";
import { RouteJourneyMap } from "@/src/modules/map/components/RouteJourneyMap";
import { runFullSync } from "@/src/services/sync";
import { useRouteStore } from "@/src/store/routeStore";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Route } from "@/src/types/route.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ListRenderItem, Pressable, RefreshControl, Text, View } from "react-native";

const statusMeta: Record<Route["route_status"], { label: string; color: string }> = {
  pending: { label: "Pendente", color: appColors.warning },
  going_to_pickup: { label: "Coleta", color: appColors.primary },
  pickup_arrived: { label: "Na coleta", color: appColors.accentLilac },
  delivering: { label: "Entrega", color: appColors.info },
  completed: { label: "Concluida", color: appColors.success },
  cancelled: { label: "Cancelada", color: appColors.danger },
};

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function RoutesScreen() {
  const { routes, loadRoutes, isLoading } = useRouteStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await runFullSync();
    } catch (error) {
      console.error("[RoutesScreen] Sync failed during refresh", error);
    } finally {
      try {
        await loadRoutes();
      } finally {
        setRefreshing(false);
      }
    }
  }, [loadRoutes]);

  useEffect(() => {
    void loadRoutes();
  }, [loadRoutes]);

  const handleToggleExpand = useCallback((routeId: string) => {
    setExpandedRouteId((current) => (current === routeId ? null : routeId));
  }, []);

  const renderRoute = useCallback<ListRenderItem<Route>>(
    ({ item }) => (
      <RouteOverviewCard
        route={item}
        expanded={expandedRouteId === item.id}
        onToggleExpand={() => handleToggleExpand(item.id)}
        onOpenActions={setSelectedRoute}
      />
    ),
    [expandedRouteId, handleToggleExpand]
  );

  const listHeader = useMemo(
    () => (
      <FloatingActionButton
        label="Nova rota"
        icon="add"
        onPress={() => setModalVisible(true)}
        style={{
          position: "relative",
          bottom: 0,
          right: 0,
          marginBottom: spacing.sm,
          width: "100%",
          justifyContent: "center",
        }}
      />
    ),
    []
  );

  const listEmpty = useMemo(
    () => (
      <GlassCard>
        <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>Nenhuma rota ativa</Text>
        <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.xs }}>
          Crie rotas manuais com cliente, coleta e entrega para iniciar o fluxo do motorista.
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <PrimaryButton
            label="Criar rota agora"
            onPress={() => setModalVisible(true)}
            icon={<Ionicons name="add-outline" size={18} color={appColors.textPrimary} />}
          />
        </View>
      </GlassCard>
    ),
    []
  );

  return (
    <AppScreen
      title="Rotas"
      subtitle="Fluxo manual com prioridade para velocidade de selecao e leitura operacional."
    >
      {isLoading && routes.length === 0 ? (
        <View style={{ gap: spacing.sm }}>
          {listHeader}
          <SkeletonCard height={210} />
          <SkeletonCard height={210} />
          <SkeletonCard height={210} />
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={renderRoute}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={appColors.primary}
              colors={[appColors.primary]}
              progressBackgroundColor="rgba(255,255,255,0.1)"
            />
          }
          showsVerticalScrollIndicator
        />
      )}

      <CreateRouteModal visible={modalVisible} onClose={() => setModalVisible(false)} />
      <RouteActionsModal visible={!!selectedRoute} onClose={() => setSelectedRoute(null)} route={selectedRoute} />
    </AppScreen>
  );
}

function RouteOverviewCard({
  route,
  expanded,
  onToggleExpand,
  onOpenActions,
}: {
  route: Route;
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenActions: (route: Route) => void;
}) {
  const status = statusMeta[route.route_status];
  const routeDistance = (route.driver_to_pickup_km || 0) + (route.pickup_to_delivery_km || 0);
  const hasMapData =
    (route.route_geometry?.length ?? 0) > 1 ||
    (route.driver_start_lat != null && route.driver_start_lng != null) ||
    (route.pickup_lat != null && route.pickup_lng != null) ||
    (route.delivery_lat != null && route.delivery_lng != null);

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
              backgroundColor: `${status.color}33`,
            }}
          >
            <Text style={{ color: status.color, fontSize: 11, fontWeight: "900", textTransform: "uppercase" }}>
              {status.label}
            </Text>
          </View>
          <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }} numberOfLines={2}>
            {route.pickup_location}
          </Text>
          <Text style={{ color: appColors.textSecondary, fontSize: 14 }} numberOfLines={2}>
            {route.delivery_location || "Entrega nao definida"}
          </Text>
          {route.client?.name ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Ionicons name="person-circle-outline" size={14} color={appColors.textMuted} />
              <Text style={{ color: appColors.textMuted, fontSize: 13, fontWeight: "600" }}>{route.client.name}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
          {route.value != null ? (
            <Text style={{ color: appColors.success, fontSize: 20, fontWeight: "900" }}>
              {brlFormatter.format(route.value)}
            </Text>
          ) : null}
          <Text style={{ color: appColors.textMuted, fontSize: 11, fontWeight: "700", textAlign: "right" }}>
            {route.payment_required ? (route.payment_status === "paid" ? "PAGO" : "A COBRAR") : "SEM COBRANCA"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
        <RouteMetric
          label="Distancia"
          value={routeDistance > 0 ? `${routeDistance.toFixed(1)} km` : "--"}
          icon="git-commit-outline"
          compact
        />
        <RouteMetric
          label="Duracao"
          value={route.estimated_duration_minutes ? `${route.estimated_duration_minutes.toFixed(0)} min` : "--"}
          icon="time-outline"
          compact
        />
      </View>

      {expanded && hasMapData ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <RouteJourneyMap route={route} />
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <RouteMetric
              label="Ate coleta"
              value={route.driver_to_pickup_km ? `${route.driver_to_pickup_km.toFixed(1)} km` : "--"}
              icon="flag-outline"
              compact
            />
            <RouteMetric
              label="Ate entrega"
              value={route.pickup_to_delivery_km ? `${route.pickup_to_delivery_km.toFixed(1)} km` : "--"}
              icon="checkmark-done-outline"
              compact
            />
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
        <Pressable
          onPress={onToggleExpand}
          style={({ pressed }) => ({
            flex: 1,
            minHeight: 44,
            borderRadius: radius.lg,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: appColors.borderStrong,
            backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
          })}
        >
          <Text style={{ color: appColors.textPrimary, fontWeight: "800", fontSize: 13 }}>
            {expanded ? "Ocultar trajeto" : "Ver trajeto"}
          </Text>
        </Pressable>

        <View style={{ flex: 1.2 }}>
          <PrimaryButton
            label="Abrir acoes"
            onPress={() => onOpenActions(route)}
            variant="secondary"
            icon={<Ionicons name="options-outline" size={18} color={appColors.textPrimary} />}
          />
        </View>
      </View>
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
        flexDirection: "column",
        minHeight: compact ? 68 : 88,
        borderRadius: radius.lg,
        padding: spacing.xs,
        borderWidth: 1,
        borderColor: appColors.border,
        backgroundColor: "rgba(255,255,255,0.04)",
        gap: spacing.xs,
      }}
    >
      <Ionicons name={icon} size={20} color={appColors.primary} />
      <Text style={{ color: appColors.textMuted, fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: appColors.textPrimary, fontSize: 11, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}
