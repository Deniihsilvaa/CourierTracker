import { useAppShell } from "@/src/providers/app-shell-provider";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppScreenProps {
  title: string;
  subtitle?: string;
  scrollable?: boolean;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

function ScreenHeader({
  title,
  subtitle,
  rightSlot,
  onOpenDrawer,
}: {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  onOpenDrawer: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
        marginBottom: spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
        <Pressable
          onPress={onOpenDrawer}
          style={({ pressed }) => ({
            width: 46,
            height: 46,
            borderRadius: radius.lg,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: pressed ? "rgba(96,165,250,0.16)" : appColors.surface,
            borderWidth: 1,
            borderColor: appColors.border,
          })}
        >
          <Ionicons name="menu" size={20} color={appColors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: appColors.textPrimary, fontSize: 26, fontWeight: "900" }}>{title}</Text>
          {subtitle ? (
            <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightSlot}
    </View>
  );
}

export const AppScreen = memo(function AppScreen({
  title,
  subtitle,
  scrollable = true,
  rightSlot,
  children,
}: AppScreenProps) {
  const { openDrawer } = useAppShell();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: appColors.background }} edges={["top"]}>
      {scrollable ? (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.sm,
            paddingTop: spacing.sm,
            paddingBottom: 120,
            gap: spacing.sm,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title={title} subtitle={subtitle} rightSlot={rightSlot} onOpenDrawer={openDrawer} />
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: spacing.sm, paddingTop: spacing.sm }}>
          <ScreenHeader title={title} subtitle={subtitle} rightSlot={rightSlot} onOpenDrawer={openDrawer} />
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      )}
    </SafeAreaView>
  );
});
