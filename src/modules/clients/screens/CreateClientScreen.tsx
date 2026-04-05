import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import useSessions from "@/src/hooks/useSessions";
import { ClientForm } from "@/src/modules/clients/components/ClientForm";
import { useClientStore } from "@/src/modules/clients/store/clientStore";
import { appColors, spacing } from "@/src/theme/colors";
import { useRouter } from "expo-router";
import { Alert, ScrollView, Text } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";

export function CreateClientScreen() {
  const router = useRouter();
  const createClient = useClientStore((state) => state.createClient);
  const isSaving = useClientStore((state) => state.isSaving);
  const error = useClientStore((state) => state.error);
  const { refreshing, onRefresh } = useSessions();


  return (
    <AppScreen
      title="Novo cliente"
      subtitle="Cadastro manual com coordenadas geradas automaticamente a partir do endereco."
      scrollable={false}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}
      >
        <GlassCard>
          <SectionHeader title="Cadastro rapido" subtitle="Preencha o basico e deixe o app localizar latitude e longitude." />
        </GlassCard>

        {error ? (
          <GlassCard style={{ borderColor: "rgba(239, 68, 68, 0.28)", backgroundColor: "rgba(127, 29, 29, 0.24)" }}>
            <Text selectable style={{ color: "#fecaca", fontSize: 14, fontWeight: "700" }}>
              {error}
            </Text>
          </GlassCard>
        ) : null}

        <ClientForm
          submitLabel="Salvar cliente"
          isSubmitting={isSaving}
          onSubmit={async (payload) => {
            try {
              const client = await createClient(payload);
              router.replace(`/clients/${client.id}`);
            } catch (submissionError) {
              Alert.alert(
                "Falha ao salvar",
                submissionError instanceof Error
                  ? submissionError.message
                  : "Nao foi possivel salvar o cliente."
              );
            }
          }}
        />
      </ScrollView>
    </AppScreen>
  );
}
