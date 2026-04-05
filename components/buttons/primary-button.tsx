import { appColors, radius, softShadow, spacing } from "@/src/theme/colors";
import React, { memo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export const PrimaryButton = memo(function PrimaryButton({
  label,
  onPress,
  icon,
  loading = false,
  variant = "primary",
}: PrimaryButtonProps) {
  const backgroundColor =
    variant === "primary"
      ? appColors.primaryStrong
      : variant === "secondary"
        ? "rgba(96, 165, 250, 0.14)"
        : variant === "danger"
          ? "rgba(239, 68, 68, 0.18)"
          : "transparent";

  const borderColor =
    variant === "ghost"
      ? appColors.borderStrong
      : variant === "danger"
        ? "rgba(239, 68, 68, 0.26)"
        : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        {
          minHeight: 56,
          borderRadius: radius.lg,
          backgroundColor,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.xs,
          opacity: loading ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === "primary" ? softShadow : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={appColors.white} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          {icon}
          <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
});
