import { appColors, radius, softShadow, spacing } from "@/src/theme/colors";
import React, { memo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const GlassCard = memo(function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: appColors.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: appColors.border,
          padding: spacing.sm,
          overflow: "hidden",
        },
        softShadow,
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: -32,
          right: -24,
          width: 120,
          height: 120,
          borderRadius: radius.pill,
          backgroundColor: "rgba(96, 165, 250, 0.12)",
        }}
      />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: -40,
          left: -30,
          width: 100,
          height: 100,
          borderRadius: radius.pill,
          backgroundColor: "rgba(34, 211, 238, 0.08)",
        }}
      />
      {children}
    </View>
  );
});
