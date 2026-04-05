import { ClientDetailsScreen } from "@/src/modules/clients/screens/ClientDetailsScreen";
import { useLocalSearchParams } from "expo-router";

export default function ClientDetailsRoute() {
  const params = useLocalSearchParams<{ id: string }>();

  return <ClientDetailsScreen clientId={String(params.id)} />;
}
