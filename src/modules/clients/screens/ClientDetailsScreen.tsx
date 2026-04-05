import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { StatCard } from "@/components/cards/stat-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { ClientForm } from "@/src/modules/clients/components/ClientForm";
import { useClientStore } from "@/src/modules/clients/store/clientStore";
import { appColors, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

interface ClientDetailsScreenProps {
  clientId: string;
}

const typeLabels = {
  store: "Loja",
  restaurant: "Restaurante",
  customer: "Cliente",
  warehouse: "Deposito",
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
    void fetchClientById(clientId);
  }, [clientId, fetchClientById]);

  const clientTypeLabel = useMemo(
    () => (currentClient?.client_type ? typeLabels[currentClient.client_type] : "Nao definido"),
    [currentClient]
  );

  const handleDelete = () => {
    Alert.alert("Excluir cliente", "Esse cliente sera removido da lista ativa.", [
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
                : "Nao foi possivel excluir o cliente."
            );
          }
        },
      },
    ]);
  };

  if (isLoading && !currentClient) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: appColors.background }}>
        <ActivityIndicator size="large" color={appColors.primary} />
      </View>
    );
  }

  if (!currentClient) {
    return (
      <AppScreen title="Cliente" subtitle="Nao foi possivel carregar este cadastro.">
        <GlassCard>
          <Text style={{ color: appColors.textPrimary, fontSize: 22, fontWeight: "800" }}>Cliente nao encontrado</Text>
          <Text style={{ color: appColors.textSecondary, fontSize: 15, lineHeight: 22 }}>
            {error || "O cadastro pode ter sido removido."}
          </Text>
        </GlassCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="Cliente"
      subtitle="Visualize dados, coordenadas e sincronizacao antes de editar."
      scrollable={false}
      rightSlot={
        <PrimaryButton
          label={isEditing ? "Fechar" : "Editar"}
          onPress={() => setIsEditing((value) => !value)}
          variant={isEditing ? "ghost" : "secondary"}
          icon={<Ionicons name={isEditing ? "close-outline" : "create-outline"} size={18} color={appColors.textPrimary} />}
        />
      }
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard>
          <SectionHeader title={currentClient.name} subtitle={currentClient.address} />
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
            <StatCard
              label="Tipo"
              value={clientTypeLabel}
              icon="layers-outline"
              tone="primary"
            />
            <StatCard
              label="Status"
              value={currentClient.synced ? "Sincronizado" : "Pendente"}
              icon={currentClient.synced ? "cloud-done-outline" : "cloud-offline-outline"}
              tone={currentClient.synced ? "success" : "warning"}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Informacoes" subtitle="Dados usados na operacao e na criacao de rotas." />
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Text style={{ color: appColors.textSecondary, fontSize: 14, fontWeight: "700" }}>
              Telefone
            </Text>
            <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "700" }}>
              {currentClient.phone || "Nao informado"}
            </Text>
          </View>
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Text style={{ color: appColors.textSecondary, fontSize: 14, fontWeight: "700" }}>
              Latitude
            </Text>
            <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "700" }}>
              {currentClient.latitude ?? "Nao informada"}
            </Text>
          </View>
          <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
            <Text style={{ color: appColors.textSecondary, fontSize: 14, fontWeight: "700" }}>
              Longitude
            </Text>
            <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "700" }}>
              {currentClient.longitude ?? "Nao informada"}
            </Text>
          </View>
        </GlassCard>

        {error ? (
          <GlassCard style={{ borderColor: "rgba(239, 68, 68, 0.28)", backgroundColor: "rgba(127, 29, 29, 0.24)" }}>
            <Text selectable style={{ color: "#fecaca", fontSize: 14, fontWeight: "700" }}>
              {error}
            </Text>
          </GlassCard>
        ) : null}

        {isEditing ? (
          <ClientForm
            initialValues={currentClient}
            submitLabel="Salvar alteracoes"
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
                    : "Nao foi possivel atualizar o cliente."
                );
              }
            }}
          />
        ) : null}

        <PrimaryButton
          label={isSaving ? "Excluindo..." : "Excluir cliente"}
          onPress={handleDelete}
          variant="danger"
          icon={<Ionicons name="trash-outline" size={18} color={appColors.white} />}
          loading={isSaving}
        />
      </ScrollView>
    </AppScreen>
  );
}
