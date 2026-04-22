import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import { SkeletonCard } from "@/components/skeleton/skeleton-card";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import useSessions from "@/src/hooks/useSessions";
import { EditSessionModal } from "@/src/modules/sessions/componentes/EditSessionModal";
import { SessionMetric } from "@/src/modules/sessions/componentes/SessionMetric";
import { UpdateSessionPayload, WorkSession } from "@/src/modules/sessions/type";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { FormatDuration } from "@/src/utils/format";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SessionsScreen() {
  const { loading, refreshing, onRefresh, sections, timeFilter, setTimeFilter, deleteSession, updateSession } = useSessions();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editSession, setEditSession] = useState<WorkSession | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const filterOptions = useMemo(
    () => [
      { value: "7d", label: "7 dias" },
      { value: "30d", label: "30 dias" },
      { value: "all", label: "Tudo" },
    ],
    []
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const success = await deleteSession(deleteId);
      if (!success) {
        Alert.alert("Erro", "Não foi possível excluir esta sessão.");
      }
      setDeleteId(null);
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao tentar excluir a sessão.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (sessionId: string, payload: UpdateSessionPayload) => {
    try {
      const success = await updateSession(sessionId, payload);
      if (!success) {
        Alert.alert("Erro", "Não foi possível atualizar esta sessão.");
        return false;
      }
      return true;
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao tentar atualizar a sessão.");
      return false;
    }
  };

  const handleEditConfirm = async (payload: UpdateSessionPayload) => {
    if (!editSession) return;
    setIsUpdating(true);
    try {
      console.log("handleEditConfirm", payload);
      const success = await handleUpdate(editSession.id, payload);
      if (success) {
        setEditSession(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AppScreen title="Sessões" subtitle="Histórico organizado com leitura rápida de duração, distância e progresso." scrollable={false}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={appColors.primary} />}
        showsVerticalScrollIndicator={false}
      >

        <View style={{ flexDirection: "row", gap: spacing.xs }}>
          {filterOptions.map((option) => {
            const active = timeFilter === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setTimeFilter(option.value as any)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: radius.pill,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? "rgba(79, 140, 255, 0.20)" : appColors.surface,
                  borderWidth: 1,
                  borderColor: active ? "rgba(96, 165, 250, 0.28)" : appColors.border,
                }}
              >
                <Text style={{ color: appColors.textPrimary, fontWeight: "800", fontSize: 13 }}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <>
            <SkeletonCard height={144} />
            <SkeletonCard height={144} />
            <SkeletonCard height={144} />
          </>
        ) : sections.length === 0 ? (
          <GlassCard>
            <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "800" }}>Nenhuma sessão encontrada</Text>
            <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: spacing.xs }}>
              Assim que você encerrar turnos, o histórico aparecerá aqui com agrupamento por data.
            </Text>
          </GlassCard>
        ) : (
          sections.map((section) => (
            <View key={section.title.toLowerCase()} style={{ gap: spacing.xs }}>

              <SectionHeader
                title={section.title}
                subtitle={`${section.count} turno(s) • ${section.totalKm.toFixed(1)} km`}
              />
              {section.data.map((item) => (
                <Pressable
                  delayLongPress={600}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setEditSession(item);
                  }}
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <GlassCard key={item.id}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                      <View style={{ flex: 1, gap: spacing.xs }}>
                        <Text style={{ color: appColors.textPrimary, fontSize: 17, fontWeight: "800" }}>
                          {new Date(item.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {item.end_time
                            ? ` - ${new Date(item.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : " • Em andamento"}
                        </Text>
                        <Text style={{ color: appColors.textSecondary, fontSize: 14 }}>
                          Odômetro {item.start_odometer || "---"} → {item.end_odometer || "---"}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                        <View
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: radius.pill,
                            backgroundColor:
                              item.status === "closed" ? "rgba(34, 197, 94, 0.18)" : "rgba(245, 158, 11, 0.18)",
                          }}
                        >
                          <Text style={{ color: appColors.textPrimary, fontSize: 12, fontWeight: "800" }}>
                            {item.status === "closed" ? "Concluído" : "Ativo"}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => setDeleteId(item.id)}
                          hitSlop={8}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.lg,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color={appColors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                      <SessionMetric label="KM" value={(item.total_distance_km || 0).toFixed(1)} icon="speedometer-outline" compact />
                      <SessionMetric label="Ativo" value={FormatDuration({ seconds: item.total_active_seconds || 0, format: "short" })} icon="timer-outline" compact />
                    </View>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <ConfirmationModal
        visible={!!deleteId}
        title="Excluir sessão"
        description="Tem certeza que deseja excluir esta sessão? Esta ação é irreversível e removerá todos os dados vinculados a este turno."
        confirmLabel="Excluir"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <EditSessionModal
        visible={!!editSession}
        session={editSession}
        onClose={() => setEditSession(null)}
        onSave={handleEditConfirm}
        isUpdating={isUpdating}
      />
    </AppScreen>
  );
}

