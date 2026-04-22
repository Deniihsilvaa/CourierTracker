import { FloatingActionButton } from "@/components/buttons/floating-action-button";
import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import { FuelForm } from "@/components/blocks/financial/fuel-form";
import useFuelsScreen from "@/src/hooks/useFuelsScreen";
import { FuelLog } from "@/src/services/fuelLogs.service";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";

export default function FuelsScreen() {
  const {
    fuelLogs,
    loading,
    saving,
    formExpanded,
    typeFilter,
    setTypeFilter,
    dateFilter,
    setDateFilter,
    editingId,
    setEditingId,
    toggleForm,
    handleCreate,
    handleUpdate,
    startEdit,
    sessions,
    selectedSessionId,
  } = useFuelsScreen();

  const stats = useMemo(() => {
    const totalAmount = fuelLogs.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalLiters = fuelLogs.reduce((sum, item) => sum + Number(item.liters || 0), 0);
    const average = fuelLogs.length > 0 ? totalAmount / fuelLogs.length : 0;
    return { totalAmount, totalLiters, average };
  }, [fuelLogs]);

  return (
    <AppScreen
      title="Combustivel"
      subtitle="Controle de abastecimentos com cadastro rapido e leitura operacional."
      scrollable={false}
      rightSlot={
        <PrimaryButton
          label={formExpanded ? "Fechar" : "Novo"}
          onPress={toggleForm}
          variant={formExpanded ? "ghost" : "secondary"}
          icon={<Ionicons name={formExpanded ? "close-outline" : "add-outline"} size={18} color={appColors.textPrimary} />}
        />
      }
    >
      <FlatList
        data={fuelLogs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: spacing.sm }}
        ListHeaderComponent={
          <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {formExpanded ? (
              <GlassCard>
                <SectionHeader title="Novo abastecimento" subtitle="Registre valor, volume, tipo e odometro da parada." />
                <View style={{ marginTop: spacing.sm }}>
                  <FuelForm
                    onSubmit={(data) => handleCreate(data)}
                    loading={saving}
                    sessions={sessions}
                    selectedSessionId={selectedSessionId}
                  />
                </View>
              </GlassCard>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard
                label="Total"
                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.totalAmount)}
                icon="wallet-outline"
                tone="warning"
              />
              <StatCard
                label="Litros"
                value={`${stats.totalLiters.toFixed(1)} L`}
                icon="water-outline"
                tone="primary"
              />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard
                label="Registros"
                value={String(fuelLogs.length)}
                icon="albums-outline"
                tone="success"
              />
              <StatCard
                label="Media"
                value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(stats.average)}
                icon="analytics-outline"
                tone="danger"
              />
            </View>

            <GlassCard>
              <SectionHeader title="Filtros" subtitle="Refine rapidamente por tipo de combustivel ou data." />
              <View style={{ flexDirection: "row", gap: spacing.xs, marginTop: spacing.sm }}>
                <FilterChip label="Todos" active={!typeFilter} onPress={() => setTypeFilter("")} />
                <FilterChip label="Gasolina" active={typeFilter === "gasoline"} onPress={() => setTypeFilter("gasoline")} />
                <FilterChip label="Etanol" active={typeFilter === "Ethanol"} onPress={() => setTypeFilter("Ethanol")} />
              </View>
              <View
                style={{
                  marginTop: spacing.sm,
                  minHeight: 56,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: appColors.border,
                  backgroundColor: appColors.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: spacing.sm,
                  gap: spacing.xs,
                }}
              >
                <Ionicons name="calendar-outline" size={18} color={appColors.textMuted} />
                <TextInput
                  value={dateFilter}
                  onChangeText={setDateFilter}
                  style={{ flex: 1, color: appColors.textPrimary, fontSize: 16, fontWeight: "600" }}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={appColors.textMuted}
                />
              </View>
            </GlassCard>

            <SectionHeader title="Historico" subtitle="Toque e segure um registro para editar." />
          </View>
        }
        renderItem={({ item }) =>
          editingId === item.id ? (
            <GlassCard>
              <SectionHeader title="Editar abastecimento" subtitle={item.gas_station || "Registro em edicao"} />
              <View style={{ marginTop: spacing.sm }}>
                <FuelForm
                  initialData={item}
                  onSubmit={(data) => handleUpdate(data)}
                  onCancel={() => setEditingId(null)}
                  loading={saving}
                  sessions={sessions}
                  selectedSessionId={selectedSessionId}
                />
              </View>
            </GlassCard>
          ) : (
            <FuelLogCard item={item} onLongPress={() => startEdit(item)} />
          )
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: spacing.sm }}>
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
              <SkeletonCard height={120} />
            </View>
          ) : (
            <GlassCard>
              <Text style={{ color: appColors.textPrimary, fontSize: 20, fontWeight: "800" }}>Nenhum registro encontrado</Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                Abra o formulario para registrar o primeiro abastecimento do periodo.
              </Text>
            </GlassCard>
          )
        }
      />

      {!formExpanded ? (
        <FloatingActionButton label="Novo abastecimento" icon="add" onPress={toggleForm} />
      ) : null}
    </AppScreen>
  );
}

function FuelLogCard({ item, onLongPress }: { item: FuelLog; onLongPress: () => void }) {
  const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(item.amount || 0));

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={500}>
      <GlassCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
              <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }} numberOfLines={1}>
                {item.gas_station || "Abastecimento"}
              </Text>
              <View
                style={{
                  borderRadius: radius.pill,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: item.type === "gasoline" ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)",
                }}
              >
                <Text
                  style={{
                    color: item.type === "gasoline" ? appColors.success : appColors.warning,
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {item.type === "gasoline" ? "Gasolina" : "Etanol"}
                </Text>
              </View>
            </View>
            <Text style={{ color: appColors.warning, fontSize: 15, fontWeight: "700" }}>
              {item.liters}L • R$ {Number(item.price_per_liter || 0).toFixed(2)}/L
            </Text>
            <Text style={{ color: appColors.textSecondary, fontSize: 14 }} numberOfLines={2}>
              {item.odometer ? `Km: ${item.odometer}` : "Sem odometro"}{item.description ? ` • ${item.description}` : ""}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "900" }}>{amount}</Text>
            <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700" }}>
              {new Date(item.date_competition).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 44,
        borderRadius: radius.pill,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? appColors.warning : appColors.surface,
        borderWidth: 1,
        borderColor: active ? appColors.warning : appColors.border,
      }}
    >
      <Text style={{ color: appColors.textPrimary, fontWeight: "800", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
