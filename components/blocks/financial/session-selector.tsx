import { GlassCard } from "@/components/cards/glass-card";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { WorkSession } from "@/src/types/stores";
import React, { memo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface SessionSelectorProps {
  sessions: WorkSession[];
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
}

function formatSessionLabel(session: WorkSession) {
  const start = new Date(session.start_time);
  const date = Number.isNaN(start.getTime())
    ? "Sessao"
    : `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} ${start.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
  const status = session.status === "open" ? "Ativa" : session.status === "closed" ? "Encerrada" : session.status;
  return { date, status, distance: `${Number(session.total_distance_km || 0).toFixed(1)} km` };
}

export const SessionSelector = memo(function SessionSelector({
  sessions,
  selectedSessionId,
  onSelectSession,
}: SessionSelectorProps) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ color: appColors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
        Sessao vinculada
      </Text>
      <Text style={{ color: appColors.textMuted, fontSize: 13, lineHeight: 20 }}>
        Escolha a sessao ativa ou uma sessao anterior para vincular este lancamento.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        {sessions.map((session) => {
          const active = session.id === selectedSessionId;
          const meta = formatSessionLabel(session);
          return (
            <Pressable key={session.id} onPress={() => onSelectSession(session.id)}>
              <GlassCard
                style={{
                  width: 188,
                  padding: spacing.sm,
                  borderColor: active ? appColors.primary : appColors.border,
                  backgroundColor: active ? "rgba(37, 99, 235, 0.18)" : appColors.card,
                }}
              >
                <View
                  style={{
                    alignSelf: "flex-start",
                    borderRadius: radius.pill,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: session.status === "open" ? "rgba(34, 197, 94, 0.18)" : "rgba(148, 163, 184, 0.16)",
                  }}
                >
                  <Text
                    style={{
                      color: session.status === "open" ? appColors.success : appColors.textSecondary,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {meta.status}
                  </Text>
                </View>
                <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "800", marginTop: spacing.xs }}>
                  {meta.date}
                </Text>
                <Text style={{ color: appColors.textSecondary, fontSize: 13, marginTop: 4 }}>{meta.distance}</Text>
              </GlassCard>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});
