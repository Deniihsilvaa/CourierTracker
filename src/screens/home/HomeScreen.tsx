import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import useDashboardScreen from "@/src/hooks/useDashboardScreen";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";


export default function HomeScreen() {
  const router = useRouter();
  const {
    user,
    activeSession,
    sessionTime,
    odometer,
    setOdometer,
    lastOdometer,
    handleStartSession,
    handleStopSession,
    handleManualSync,
    isSyncing,
    pendingCount,
    isStopModalVisible,
    setIsStopModalVisible,
    endOdometer,
    setEndOdometer,
    confirmStopSession,
  } = useDashboardScreen();

  const pulse = useRef(new Animated.Value(activeSession ? 1 : 0.92)).current;

  useEffect(() => {
    Animated.spring(pulse, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 70,
    }).start();
  }, [activeSession, pulse]);

  const displayName = useMemo(() => user?.name || user?.email?.split("@")[0] || "Motorista", [user]);
  return (
    <>
      <AppScreen
        title={`Ola, ${displayName}`}
        // subtitle="Painel operacional para iniciar, acompanhar e encerrar o turno sem friccao."
        rightSlot={
          <View style={{ flexDirection: "row", gap: spacing.xxs }}>
            {/* TODO: Sera Removido no futuro sendo substituido por um icone de notificacoes */}
            <Pressable
              onPress={handleManualSync}
              style={{
                width: 46,
                height: 46,
                borderRadius: radius.lg,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: appColors.surface,
                borderWidth: 1,
                borderColor: appColors.border,
              }}
            >
              <Ionicons
                name={isSyncing ? "sync" : "notifications-outline"}
                size={20}
                color={pendingCount > 0 ? appColors.warning : appColors.textPrimary}
              />
            </Pressable>
          </View>
        }
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}
        >
          <GlassCard>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
              <View style={{ gap: spacing.xs }}>
                <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                  Status do dia
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: radius.pill,
                      backgroundColor: activeSession ? appColors.success : appColors.warning,
                    }}
                  />
                  <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>
                    {activeSession ? "Em turno" : "Aguardando inicio"}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                  backgroundColor: "rgba(96, 165, 250, 0.12)",
                }}
              >
                <Text style={{ color: appColors.textSecondary, fontSize: 12, fontWeight: "700" }}>
                  {pendingCount} pendencias
                </Text>
              </View>
            </View>
          </GlassCard>

          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <GlassCard
              style={{
                padding: spacing.md,
                backgroundColor: "rgba(37, 99, 235, 0.18)",
                minHeight: 220,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: spacing.sm }}>
                <View style={{ flex: 1, gap: spacing.sm }}>

                  <Text style={{ color: appColors.textPrimary, fontSize: 26, fontWeight: "900" }}>
                    {activeSession ? "Turno em progresso" : "Pronto para comecar a rodar?"}
                  </Text>
                  <Text style={{ color: "rgba(226, 232, 240, 0.84)", fontSize: 14, lineHeight: 21 }}>
                    {activeSession
                      ? `Tempo ativo ${sessionTime}. Continue registrando o trabalho com poucos toques.`
                      : "Defina o odometro inicial para iniciar o turno."}
                  </Text>
                </View>

              </View>

              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                {!activeSession ? (
                  <>
                    <TextInput
                      value={odometer}
                      onChangeText={setOdometer}
                      keyboardType="numeric"
                      placeholder={`Odometro inicial ${lastOdometer}`}
                      returnKeyType="done"
                      placeholderTextColor={appColors.textMuted}
                      style={{
                        minHeight: 56,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: "rgba(191, 219, 254, 0.20)",
                        backgroundColor: "rgba(255,255,255,0.08)",
                        color: appColors.textPrimary,
                        paddingHorizontal: spacing.sm,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    />
                    {/* Texto de informacao */}
                    <Pressable
                      onPress={() => setOdometer(String(lastOdometer))}
                      style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 }}
                    >
                      <Ionicons name="attach-outline" size={14} color={appColors.primary} style={{ transform: [{ rotate: '45deg' }] }} />
                      <Text style={{ color: appColors.textMuted, fontSize: 10, fontWeight: "600", textTransform: "capitalize", textAlign: "right" }}>
                        Ultimo odometro registrado: {lastOdometer}
                      </Text>
                    </Pressable>
                    <PrimaryButton
                      label="Iniciar turno"
                      onPress={handleStartSession}
                      icon={<Ionicons name="play" size={18} color={appColors.white} />}
                    />
                  </>
                ) : (
                  <PrimaryButton
                    label="Encerrar turno"
                    onPress={handleStopSession}
                    variant="danger"
                    icon={<Ionicons name="pause" size={18} color={appColors.white} />}
                  />
                )}
              </View>
            </GlassCard>
          </Animated.View>
          <GlassCard>
            <SectionHeader title="Acoes rapidas" subtitle="Atalhos para reduzir navegacao durante a operacao." />
            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
              <PrimaryButton
                label="Ver rotas"
                onPress={() => router.push("/routes")}
                variant="secondary"
                icon={<Ionicons name="map-outline" size={18} color={appColors.textPrimary} />}
              />
              <PrimaryButton
                label="Financeiro"
                onPress={() => router.push("/finance")}
                variant="ghost"
                icon={<Ionicons name="bar-chart-outline" size={18} color={appColors.textPrimary} />}
              />
            </View>
          </GlassCard>
        </ScrollView>
      </AppScreen>

      <Modal visible={isStopModalVisible} transparent animationType="fade" onRequestClose={() => setIsStopModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: appColors.overlay,
            justifyContent: "flex-end",
            padding: spacing.sm,
          }}
        >
          <GlassCard
            style={{
              padding: spacing.md,
              gap: spacing.sm,
              borderRadius: radius.xl,
              backgroundColor: "rgba(15, 23, 42, 0.94)",
            }}
          >
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: appColors.textPrimary, fontSize: 22, fontWeight: "900" }}>Encerrar turno</Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>
                Informe o odometro final para fechar a sessao com o mesmo cuidado do inicio, ultimo odometro informado foi: {lastOdometer}
              </Text>
            </View>

            <TextInput
              value={endOdometer}
              onChangeText={setEndOdometer}
              keyboardType="numeric"
              placeholder="Odometro final"
              placeholderTextColor={appColors.textMuted}
              style={{
                minHeight: 56,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: appColors.border,
                backgroundColor: appColors.surface,
                color: appColors.textPrimary,
                paddingHorizontal: spacing.sm,
                fontSize: 16,
                fontWeight: "700",
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
              <PrimaryButton
                label="Cancelar"
                onPress={() => setIsStopModalVisible(false)}
                variant="ghost"
                icon={<Ionicons name="close-outline" size={18} color={appColors.textPrimary} />}
              />
              <PrimaryButton
                label="Confirmar"
                onPress={confirmStopSession}
                variant="danger"
                icon={<Ionicons name="checkmark-outline" size={18} color={appColors.white} />}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}
