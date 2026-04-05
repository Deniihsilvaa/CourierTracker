import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { appColors, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface SecondaryScreenProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  bullets: string[];
}

export function SecondaryScreen({
  title,
  subtitle,
  icon,
  bullets,
}: SecondaryScreenProps) {
  return (
    <AppScreen title={title} subtitle={subtitle}>
      <GlassCard>
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(79, 140, 255, 0.16)",
            }}
          >
            <Ionicons name={icon} size={26} color={appColors.primary} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 20, fontWeight: "900" }}>{title}</Text>
            <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Próximos blocos" subtitle="Estrutura pronta para crescer sem quebrar o design system." />
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {bullets.map((bullet) => (
            <View key={bullet} style={{ flexDirection: "row", gap: spacing.sm }}>
              <Ionicons name="checkmark-circle" size={18} color={appColors.success} />
              <Text style={{ flex: 1, color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>{bullet}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </AppScreen>
  );
}
