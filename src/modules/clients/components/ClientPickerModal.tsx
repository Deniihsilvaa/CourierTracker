import { ClientForm } from "@/src/modules/clients/components/ClientForm";
import { ClientCard } from "@/src/modules/clients/components/ClientCard";
import { useClientStore } from "@/src/modules/clients/store/clientStore";
import { Client } from "@/src/types/route.types";
import { useDeferredValue, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ClientPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}

export function ClientPickerModal({
  visible,
  onClose,
  onSelectClient,
}: ClientPickerModalProps) {
  const clients = useClientStore((state) => state.clients);
  const pagination = useClientStore((state) => state.pagination);
  const isLoading = useClientStore((state) => state.isLoading);
  const isSaving = useClientStore((state) => state.isSaving);
  const error = useClientStore((state) => state.error);
  const fetchClients = useClientStore((state) => state.fetchClients);
  const createClient = useClientStore((state) => state.createClient);
  const resetError = useClientStore((state) => state.resetError);

  const [search, setSearch] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!visible) {
      setShowQuickCreate(false);
      setSearch("");
      resetError();
      return;
    }

    fetchClients({ page: 1, q: "" });
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    fetchClients({ page: 1, q: deferredSearch });
  }, [deferredSearch, visible]);

  const handleQuickCreate = async (payload: any) => {
    const client = await createClient(payload);
    onSelectClient(client);
    setShowQuickCreate(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#030712" }} edges={["top", "bottom"]}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#111827",
            gap: 14,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: "#f9fafb", fontSize: 24, fontWeight: "800" }}>
                Selecionar cliente
              </Text>
              <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                Busca rápida para montar a rota sem sair do fluxo.
              </Text>
            </View>

            <Pressable onPress={onClose} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ color: "#93c5fd", fontSize: 15, fontWeight: "700" }}>Fechar</Text>
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

          <Pressable
            onPress={() => setShowQuickCreate((value) => !value)}
            style={{
              minHeight: 48,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#1d4ed8",
            }}
          >
            <Text style={{ color: "#eff6ff", fontWeight: "800" }}>
              {showQuickCreate ? "Cancelar criação rápida" : "Criar novo cliente rápido"}
            </Text>
          </Pressable>

          {error ? (
            <Text selectable style={{ color: "#fca5a5", fontSize: 14, fontWeight: "600" }}>
              {error}
            </Text>
          ) : null}
        </View>

        {showQuickCreate ? (
          <View style={{ padding: 20 }}>
            <ClientForm
              submitLabel="Salvar e usar cliente"
              isSubmitting={isSaving}
              onSubmit={handleQuickCreate}
            />
          </View>
        ) : isLoading && clients.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#60a5fa" />
          </View>
        ) : (
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 32 }}
            renderItem={({ item }) => (
              <ClientCard
                client={item}
                onPress={() => {
                  onSelectClient(item);
                  onClose();
                }}
              />
            )}
            ListEmptyComponent={() => (
              <View
                style={{
                  backgroundColor: "#111827",
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: "#1f2937",
                  gap: 6,
                }}
              >
                <Text style={{ color: "#f9fafb", fontSize: 18, fontWeight: "800" }}>
                  Nenhum cliente encontrado
                </Text>
                <Text style={{ color: "#9ca3af", fontSize: 14, lineHeight: 20 }}>
                  Ajuste a busca ou crie um cliente rápido para continuar a rota.
                </Text>
              </View>
            )}
            ListFooterComponent={
              pagination.hasNextPage ? (
                <Pressable
                  onPress={() =>
                    fetchClients({
                      page: pagination.page + 1,
                      q: deferredSearch,
                      append: true,
                    })
                  }
                  style={{
                    minHeight: 52,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#111827",
                    borderWidth: 1,
                    borderColor: "#1f2937",
                    marginTop: 12,
                  }}
                >
                  <Text style={{ color: "#dbeafe", fontWeight: "800" }}>Carregar mais clientes</Text>
                </Pressable>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
