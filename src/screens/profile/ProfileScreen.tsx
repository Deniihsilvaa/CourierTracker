import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { AppScreen } from "@/components/layout/app-screen";
import { SectionHeader } from "@/components/layout/section-header";
import useSettingsScreen from "@/src/hooks/useSettingsScreen";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, Switch, Text, View } from "react-native";

export default function ProfileScreen() {
  const {
    user,
    notifications,
    pendingSync,
    vehicle,
    highPrecision,
    handleCleanup,
    openBatterySettings,
    toggleNotifications,
    setVehicle,
    setHighPrecision,
    signOut,
  } = useSettingsScreen();

  return (
    <AppScreen
      title="Perfil"
      subtitle="Configuracoes operacionais, conta e saude do dispositivo."
      scrollable={false}
    >
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ gap: spacing.sm, paddingBottom: 120 }}>
        <GlassCard>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: radius.xl,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(79, 140, 255, 0.18)",
              }}
            >
              <Text style={{ color: appColors.textPrimary, fontSize: 28, fontWeight: "900" }}>
                {user?.name?.[0] || "R"}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: appColors.textPrimary, fontSize: 22, fontWeight: "900" }}>
                {user?.name || "Motorista"}
              </Text>
              <Text style={{ color: appColors.textSecondary, fontSize: 14 }}>{user?.email || "Sem e-mail"}</Text>
              <Text style={{ color: appColors.textMuted, fontSize: 12, fontWeight: "700" }}>
                {pendingSync} item(ns) pendente(s) de sincronizacao
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Operacao" subtitle="Preferencias que afetam a jornada do motorista." />
          <ProfileRow icon="car-outline" label="Veiculo" value={vehicle} actionLabel="Trocar" onPress={() => setVehicle(vehicle === "Moto" ? "Carro" : "Moto")} />
          <ProfileSwitch icon="locate-outline" label="Alta precisao GPS" value={highPrecision} onValueChange={setHighPrecision} />
          <ProfileSwitch icon="notifications-outline" label="Notificacoes" value={notifications} onValueChange={toggleNotifications} />
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Dispositivo e dados" subtitle="Manutencao do app sem comprometer a operacao." />
          <ProfileRow icon="trash-outline" label="Limpar dados antigos" value="Otimizar armazenamento" onPress={handleCleanup} />
          <ProfileRow icon="battery-half-outline" label="Bateria" value="Abrir ajustes" onPress={openBatterySettings} />
        </GlassCard>

        <PrimaryButton
          label="Sair da conta"
          onPress={signOut}
          variant="danger"
          icon={<Ionicons name="log-out-outline" size={18} color={appColors.white} />}
        />
      </ScrollView>
    </AppScreen>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  actionLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  actionLabel?: string;
  onPress: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(79, 140, 255, 0.12)",
        }}
      >
        <Ionicons name={icon} size={18} color={appColors.primary} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "700" }}>{label}</Text>
        <Text style={{ color: appColors.textSecondary, fontSize: 13 }}>{value}</Text>
      </View>
      <PrimaryButton label={actionLabel || "Abrir"} onPress={onPress} variant="ghost" />
    </View>
  );
}

function ProfileSwitch({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(79, 140, 255, 0.12)",
        }}
      >
        <Ionicons name={icon} size={18} color={appColors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "700" }}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} thumbColor={appColors.white} trackColor={{ false: "#334155", true: appColors.primary }} />
    </View>
  );
}
