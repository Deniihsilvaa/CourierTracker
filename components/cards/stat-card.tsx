import { GlassCard } from "@/components/cards/glass-card";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Text, View } from "react-native";

interface StatCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "success" | "warning" | "danger" | "primary";
  trend?: string;
}

const toneMap = {
  success: appColors.success,
  warning: appColors.warning,
  danger: appColors.danger,
  primary: appColors.primary,
} as const;

export const StatCard = memo(function StatCard({
  label,
  value,
  icon,
  tone,
  trend,
}: StatCardProps) {
  const color = toneMap[tone];

  return (
    <GlassCard style={{ flex: 1, minHeight: 138 }}>
      <View style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.lg,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${color}22`,
            }}
          >
            <Ionicons name={icon} size={20} color={color} />
          </View>
          {trend ? (
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: `${color}18`,
              }}
            >
              <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{trend}</Text>
            </View>
          ) : null}
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
            {label}
          </Text>
          <Text style={{ color: appColors.textPrimary, fontSize: 22, fontWeight: "900" }}>
            {value}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
});
