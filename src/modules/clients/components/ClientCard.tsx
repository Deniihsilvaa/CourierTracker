import { Client } from "@/src/types/route.types";
import { Pressable, Text, View } from "react-native";

interface ClientCardProps {
  client: Client;
  onPress: () => void;
}

const typeLabels: Record<NonNullable<Client["client_type"]>, string> = {
  store: "Loja",
  restaurant: "Restaurante",
  customer: "Cliente",
  warehouse: "Depósito",
};

export function ClientCard({ client, onPress }: ClientCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#111827",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        gap: 10,
        minHeight: 104,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text selectable style={{ color: "#f9fafb", fontSize: 18, fontWeight: "800" }}>
            {client.name}
          </Text>
          <Text selectable style={{ color: "#9ca3af", fontSize: 14, lineHeight: 20 }}>
            {client.address}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 8 }}>
          {client.client_type ? (
            <View
              style={{
                backgroundColor: "#1d4ed8",
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#eff6ff", fontSize: 12, fontWeight: "700" }}>
                {typeLabels[client.client_type]}
              </Text>
            </View>
          ) : null}

          {!client.synced ? (
            <View
              style={{
                backgroundColor: "#3f3f46",
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: "#e4e4e7", fontSize: 12, fontWeight: "700" }}>
                Pendente de sync
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text selectable style={{ color: "#d1d5db", fontSize: 15, fontWeight: "600" }}>
        {client.phone || "Telefone não informado"}
      </Text>
    </Pressable>
  );
}
