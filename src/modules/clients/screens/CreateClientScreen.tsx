import { ClientForm } from "@/src/modules/clients/components/ClientForm";
import { useClientStore } from "@/src/modules/clients/store/clientStore";
import { useRouter } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

export function CreateClientScreen() {
  const router = useRouter();
  const createClient = useClientStore((state) => state.createClient);
  const isSaving = useClientStore((state) => state.isSaving);
  const error = useClientStore((state) => state.error);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#030712" }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: "#f9fafb", fontSize: 28, fontWeight: "900" }}>Novo cliente</Text>
        <Text style={{ color: "#9ca3af", fontSize: 15, lineHeight: 22 }}>
          Cadastro manual com estrutura pronta para receber autocomplete de endereço depois.
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
                : "Não foi possível salvar o cliente."
            );
          }
        }}
      />
    </ScrollView>
  );
}
