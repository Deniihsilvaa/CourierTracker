import { ClientCard } from "@/src/modules/clients/components/ClientCard";
import { useClientStore } from "@/src/modules/clients/store/clientStore";
import { useRouter } from "expo-router";
import { useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    fetchClients({ page: 1, q: deferredSearch });
  }, [deferredSearch]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#030712" }} edges={["top"]}>
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#60a5fa" />
        }
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: "#f9fafb", fontSize: 30, fontWeight: "900" }}>Clientes</Text>
                <Text style={{ color: "#93c5fd", fontSize: 14, fontWeight: "600" }}>
                  Busca rápida, cache local e seleção pronta para rotas manuais.
                </Text>
              </View>

              <Pressable
                onPress={() => router.push("/clients/new")}
                style={{
                  minHeight: 52,
                  borderRadius: 16,
                  paddingHorizontal: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#16a34a",
                }}
              >
                <Text style={{ color: "#f9fafb", fontWeight: "800" }}>Novo</Text>
              </Pressable>
            </View>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nome, endereço ou telefone"
              placeholderTextColor="#6b7280"
              style={{
                backgroundColor: "#111827",
                borderRadius: 18,
                minHeight: 56,
                color: "#f9fafb",
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: "#1f2937",
              }}
            />

            <View
              style={{
                backgroundColor: "#111827",
                borderRadius: 18,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: "#1f2937",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: "#e5e7eb", fontWeight: "700" }}>
                {pagination.total} cliente{pagination.total === 1 ? "" : "s"}
              </Text>
              <Text style={{ color: "#9ca3af", fontWeight: "600" }}>
                Página {pagination.page} de {pagination.totalPages}
              </Text>
            </View>

            {error ? (
              <View
                style={{
                  backgroundColor: "#3f1d1d",
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#7f1d1d",
                }}
              >
                <Text selectable style={{ color: "#fecaca", fontSize: 14, fontWeight: "600" }}>
                  {error}
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ClientCard client={item} onPress={() => router.push(`/clients/${item.id}`)} />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 48, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#60a5fa" />
            </View>
          ) : (
            <View
              style={{
                backgroundColor: "#111827",
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: "#1f2937",
                gap: 8,
              }}
            >
              <Text style={{ color: "#f9fafb", fontSize: 20, fontWeight: "800" }}>
                Nenhum cliente disponível
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 15, lineHeight: 22 }}>
                Cadastre clientes para agilizar a criação de rotas e reduzir digitação no app.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          pagination.hasNextPage ? (
            <Pressable
              onPress={handleLoadMore}
              style={{
                minHeight: 52,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#111827",
                borderWidth: 1,
                borderColor: "#1f2937",
                marginTop: 8,
              }}
            >
              <Text style={{ color: "#dbeafe", fontWeight: "800" }}>
                {isLoading ? "Carregando..." : "Carregar mais"}
              </Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
