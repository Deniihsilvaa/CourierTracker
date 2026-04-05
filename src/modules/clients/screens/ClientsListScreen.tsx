import { FloatingActionButton } from "@/components/buttons/floating-action-button";
import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import { ClientCard } from "@/src/modules/clients/components/ClientCard";
import { useClientStore } from "@/src/modules/clients/store/clientStore";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";

export function ClientsListScreen() {
  const router = useRouter();
  const clients = useClientStore((state) => state.clients);
  const pagination = useClientStore((state) => state.pagination);
  const isLoading = useClientStore((state) => state.isLoading);
  const isRefreshing = useClientStore((state) => state.isRefreshing);
  const error = useClientStore((state) => state.error);
  const fetchClients = useClientStore((state) => state.fetchClients);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    void fetchClients({ page: 1, q: deferredSearch });
  }, [deferredSearch, fetchClients]);

  const handleRefresh = async () => {
    await fetchClients({ page: 1, q: deferredSearch, refresh: true });
  };

  const handleLoadMore = async () => {
    if (isLoading || isRefreshing || !pagination.hasNextPage) {
      return;
    }

    await fetchClients({
      page: pagination.page + 1,
      q: deferredSearch,
      append: true,
    });
  };

  const syncedCount = useMemo(() => clients.filter((client) => client.synced).length, [clients]);
  const pendingCount = Math.max(0, clients.length - syncedCount);

  return (
    <AppScreen
      title="Clientes"
      subtitle="Busca rapida, base offline e selecao pronta para rotas manuais."
      scrollable={false}
      rightSlot={
        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => ({
            width: 46,
            height: 46,
            borderRadius: radius.lg,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? "rgba(96,165,250,0.16)" : appColors.surface,
            borderWidth: 1,
            borderColor: appColors.border,
          })}
        >
          <Ionicons name="sync-outline" size={20} color={appColors.textPrimary} />
        </Pressable>
      }
    >
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, gap: spacing.sm }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={appColors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            <GlassCard>
              <SectionHeader title="Busca operacional" subtitle="Encontre clientes por nome, endereco ou telefone." />
              <View style={{ marginTop: spacing.sm }}>
                <PrimaryButton
                  label="Criar novo cliente"
                  onPress={() => router.push("/clients/new")}
                  icon={<Ionicons name="add-outline" size={18} color={appColors.white} />}
                />
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
                <Ionicons name="search-outline" size={18} color={appColors.textMuted} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nome, endereco ou telefone"
                  placeholderTextColor={appColors.textMuted}
                  style={{ flex: 1, color: appColors.textPrimary, fontSize: 16, fontWeight: "600" }}
                />
              </View>
            </GlassCard>

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard label="Total" value={String(pagination.total)} icon="people-outline" tone="primary" />
              <StatCard label="Sincronizados" value={String(syncedCount)} icon="cloud-done-outline" tone="success" />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <StatCard label="Pendentes" value={String(pendingCount)} icon="cloud-offline-outline" tone="warning" />
              <StatCard label="Pagina" value={`${pagination.page}/${Math.max(1, pagination.totalPages)}`} icon="albums-outline" tone="danger" />
            </View>

            {error ? (
              <GlassCard style={{ borderColor: "rgba(239, 68, 68, 0.28)", backgroundColor: "rgba(127, 29, 29, 0.24)" }}>
                <Text style={{ color: "#fecaca", fontSize: 14, fontWeight: "700" }}>{error}</Text>
              </GlassCard>
            ) : null}

            <SectionHeader title="Lista de clientes" subtitle="Toque em um cadastro para ver detalhes ou editar." />
          </View>
        }
        renderItem={({ item }) => <ClientCard client={item} onPress={() => router.push(`/clients/${item.id}`)} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: spacing.sm }}>
              <SkeletonCard height={116} />
              <SkeletonCard height={116} />
              <SkeletonCard height={116} />
            </View>
          ) : (
            <GlassCard>
              <Text style={{ color: appColors.textPrimary, fontSize: 20, fontWeight: "800" }}>Nenhum cliente disponivel</Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 15, lineHeight: 22 }}>
                Cadastre clientes para acelerar a criacao de rotas e reduzir digitacao no app.
              </Text>
            </GlassCard>
          )
        }
        ListFooterComponent={
          pagination.hasNextPage ? (
            <Pressable
              onPress={handleLoadMore}
              style={({ pressed }) => ({
                minHeight: 52,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "rgba(96, 165, 250, 0.12)" : appColors.surface,
                borderWidth: 1,
                borderColor: appColors.border,
                marginTop: spacing.xs,
              })}
            >
              <Text style={{ color: appColors.textPrimary, fontWeight: "800" }}>
                {isLoading ? "Carregando..." : "Carregar mais"}
              </Text>
            </Pressable>
          ) : null
        }
      />

      <FloatingActionButton label="Novo cliente" icon="add" onPress={() => router.push("/clients/new")} />
    </AppScreen>
  );
}
