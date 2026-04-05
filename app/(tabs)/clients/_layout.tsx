import { Stack } from "expo-router";

export default function ClientsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#030712" },
        headerTintColor: "#f9fafb",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#030712" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Clientes", headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="new" options={{ title: "Novo cliente", headerShown: false, animation: 'slide_from_right' }} />
      <Stack.Screen name="[id]" options={{ title: "Detalhes do cliente", headerShown: false, animation: 'slide_from_right' }} />
    </Stack>
  );
}
