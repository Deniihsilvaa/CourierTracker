import { appColors, spacing } from "@/src/theme/colors";
import React, { memo } from "react";
import { Text, View } from "react-native";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const SectionHeader = memo(function SectionHeader({
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: spacing.sm }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>{title}</Text>
        {subtitle ? (
          <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
    </View>
  );
});
