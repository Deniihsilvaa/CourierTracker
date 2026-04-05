import { ClientForm } from "@/src/modules/clients/components/ClientForm";
import { useClientStore } from "@/src/modules/clients/store/clientStore";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

interface ClientDetailsScreenProps {
  clientId: string;
}

const typeLabels = {
  store: "Loja",
  restaurant: "Restaurante",
  customer: "Cliente",
  warehouse: "Depósito",
} as const;

export function ClientDetailsScreen({ clientId }: ClientDetailsScreenProps) {
  const router = useRouter();
  const currentClient = useClientStore((state) => state.currentClient);
  const isLoading = useClientStore((state) => state.isLoading);
  const isSaving = useClientStore((state) => state.isSaving);
  const error = useClientStore((state) => state.error);
  const fetchClientById = useClientStore((state) => state.fetchClientById);
  const updateClient = useClientStore((state) => state.updateClient);
  const deleteClient = useClientStore((state) => state.deleteClient);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchClientById(clientId);
  }, [clientId]);

  const handleDelete = () => {
    Alert.alert("Excluir cliente", "Esse cliente será removido da lista ativa.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteClient(clientId);
            router.back();
          } catch (deleteError) {
            Alert.alert(
              "Falha ao excluir",
              deleteError instanceof Error
                ? deleteError.message
                : "Não foi possível excluir o cliente."
            );
          }
        },
      },
    ]);
  };

  if (isLoading && !currentClient) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#030712" }}>
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  if (!currentClient) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: "#030712", gap: 8 }}>
        <Text style={{ color: "#f9fafb", fontSize: 22, fontWeight: "900" }}>Cliente não encontrado</Text>
        <Text style={{ color: "#9ca3af", fontSize: 15 }}>{error || "O cadastro pode ter sido removido."}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#030712" }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
    >
      <View
        style={{
          backgroundColor: "#111827",
          borderRadius: 22,
          padding: 18,
          borderWidth: 1,
          borderColor: "#1f2937",
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text selectable style={{ color: "#f9fafb", fontSize: 28, fontWeight: "900" }}>
              {currentClient.name}
            </Text>
            <Text selectable style={{ color: "#9ca3af", fontSize: 15, lineHeight: 22 }}>
              {currentClient.address}
            </Text>
          </View>

          <Pressable
            onPress={() => setIsEditing((value) => !value)}
            style={{
              minHeight: 46,
              borderRadius: 14,
              paddingHorizontal: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#1d4ed8",
            }}
          >
            <Text style={{ color: "#eff6ff", fontWeight: "800" }}>
              {isEditing ? "Fechar edição" : "Editar"}
            </Text>
          </Pressable>
        </View>

        <View style={{ gap: 8 }}>
          <Text selectable style={{ color: "#d1d5db", fontSize: 16, fontWeight: "700" }}>
            Telefone: {currentClient.phone || "Não informado"}
          </Text>
          <Text selectable style={{ color: "#d1d5db", fontSize: 16, fontWeight: "700" }}>
            Tipo: {currentClient.client_type ? typeLabels[currentClient.client_type] : "Não definido"}
          </Text>
          <Text selectable style={{ color: "#d1d5db", fontSize: 16, fontWeight: "700" }}>
            Latitude: {currentClient.latitude ?? "Não informada"}
          </Text>
          <Text selectable style={{ color: "#d1d5db", fontSize: 16, fontWeight: "700" }}>
            Longitude: {currentClient.longitude ?? "Não informada"}
          </Text>
          <Text selectable style={{ color: currentClient.synced ? "#86efac" : "#fcd34d", fontSize: 14, fontWeight: "700" }}>
            {currentClient.synced ? "Sincronizado" : "Pendente de sincronização"}
          </Text>
        </View>
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

      {isEditing ? (
        <ClientForm
          initialValues={currentClient}
          submitLabel="Salvar alterações"
          isSubmitting={isSaving}
          onSubmit={async (payload) => {
            try {
              await updateClient(clientId, payload);
              setIsEditing(false);
            } catch (submissionError) {
              Alert.alert(
                "Falha ao atualizar",
                submissionError instanceof Error
                  ? submissionError.message
                  : "Não foi possível atualizar o cliente."
              );
            }
          }}
        />
      ) : null}

      <Pressable
        onPress={handleDelete}
        disabled={isSaving}
        style={{
          minHeight: 54,
          borderRadius: 18,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#7f1d1d",
        }}
      >
        <Text style={{ color: "#fee2e2", fontSize: 16, fontWeight: "800" }}>
          {isSaving ? "Excluindo..." : "Excluir cliente"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
