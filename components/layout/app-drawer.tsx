import { useAppShell } from "@/src/providers/app-shell-provider";
import { appColors, radius, softShadow, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const drawerItems = [
  { label: "Dashboard", icon: "grid-outline", route: "/" },
  { label: "Clientes", icon: "people-outline", route: "/clients" },
  { label: "Receitas", icon: "trending-up-outline", route: "/incomes" },
  { label: "Despesas", icon: "receipt-outline", route: "/expenses" },
  { label: "Categorias", icon: "layers-outline", route: "/categories" },
  { label: "Analytics", icon: "analytics-outline", route: "/analytics" },
  { label: "Relatórios", icon: "document-text-outline", route: "/reports" },
  { label: "Combustível", icon: "water-outline", route: "/fuels" },
  { label: "Manutenção", icon: "construct-outline", route: "/maintenance" },
  { label: "Exportar dados", icon: "download-outline", route: "/export-data" },
  { label: "Backup", icon: "cloud-upload-outline", route: "/backup" },
  { label: "Configurações", icon: "settings-outline", route: "/settings" },
  { label: "Ajuda", icon: "help-circle-outline", route: "/help" },
  { label: "Sobre o app", icon: "information-circle-outline", route: "/about" },
] as const;

export const AppDrawer = memo(function AppDrawer() {
  const router = useRouter();
  const { isDrawerOpen, closeDrawer } = useAppShell();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: isDrawerOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isDrawerOpen, progress]);

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 999,
        elevation: 999,
      }}
    >
      <Pressable
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: appColors.overlay,
        }}
        onPress={closeDrawer}
      />
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: "82%",
          maxWidth: 340,
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-360, 0],
              }),
            },
          ],
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: appColors.backgroundElevated }}>
          <View
            style={[
              {
                flex: 1,
                margin: spacing.sm,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: appColors.border,
                backgroundColor: appColors.card,
                overflow: "hidden",
                padding: spacing.sm,
              },
              softShadow,
            ]}
          >
            <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
              <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                RotaPro
              </Text>
              <Text style={{ color: appColors.textPrimary, fontSize: 24, fontWeight: "900" }}>
                Painel do motorista
              </Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                Navegação secundária com ações operacionais, dados e suporte.
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {drawerItems.map((item) => (
                <Pressable
                  key={item.route}
                  onPress={() => {
                    closeDrawer();
                    router.push(item.route as any);
                  }}
                  style={({ pressed }) => ({
                    minHeight: 54,
                    borderRadius: radius.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: spacing.sm,
                    paddingHorizontal: spacing.sm,
                    marginBottom: spacing.xs,
                    backgroundColor: pressed ? "rgba(96, 165, 250, 0.12)" : "transparent",
                  })}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(96, 165, 250, 0.12)",
                    }}
                  >
                    <Ionicons name={item.icon} size={18} color={appColors.primaryGradientStart} />
                  </View>
                  <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
});
