import { appColors, radius, spacing } from "@/src/theme/colors";
import { GlassCard } from "@/components/cards/glass-card";
import React, { memo } from "react";
import { Text, View } from "react-native";

interface AppCardProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export const AppCard = memo(function AppCard({
  eyebrow,
  title,
  subtitle,
  rightSlot,
  children,
}: AppCardProps) {
  return (
    <GlassCard>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          {eyebrow ? (
            <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightSlot}
      </View>
      {children ? <View style={{ marginTop: spacing.sm }}>{children}</View> : null}
    </GlassCard>
  );
});
