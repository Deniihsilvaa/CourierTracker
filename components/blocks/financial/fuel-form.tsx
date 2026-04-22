import { PrimaryButton } from "@/components/buttons/primary-button";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { SessionSelector } from "@/components/blocks/financial/session-selector";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface FuelFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  loading?: boolean;
  sessions?: any[];
  selectedSessionId?: string;
}

export const FuelForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading,
  sessions = [],
  selectedSessionId = "",
}: FuelFormProps) => {
  const [formData, setFormData] = React.useState({
    amount: initialData?.amount?.toString() || "",
    liters: initialData?.liters?.toString() || "",
    price_per_liter: initialData?.price_per_liter?.toString() || "",
    odometer: initialData?.odometer?.toString() || "",
    gas_station: initialData?.gas_station || "",
    date_competition: initialData?.date_competition
      ? String(initialData.date_competition).split("T")[0]
      : new Date().toISOString().split("T")[0],
    type: initialData?.type || "gasoline",
    description: initialData?.description || "",
    sessionId: initialData?.session_id || selectedSessionId,
  });

  const isEditing = !!initialData;

  const updateField = (field: string, value: string) => {
    // Permite apenas numeros e um ponto decimal
    const sanitized = value.replace(",", ".");
    setFormData((prev) => ({ ...prev, [field]: sanitized }));
  };

  const calculateLiters = useCallback(() => {
    const amount = parseFloat(formData.amount);
    const price = parseFloat(formData.price_per_liter);
    if (amount > 0 && price > 0) {
      const result = (amount / price).toFixed(2);
      setFormData((prev) => ({ ...prev, liters: result }));
    }
  }, [formData.amount, formData.price_per_liter]);

  const calculateTotal = useCallback(() => {
    const liters = parseFloat(formData.liters);
    const price = parseFloat(formData.price_per_liter);
    if (liters > 0 && price > 0) {
      const result = (liters * price).toFixed(2);
      setFormData((prev) => ({ ...prev, amount: result }));
    }
  }, [formData.liters, formData.price_per_liter]);

  return (
    <View style={{ gap: spacing.sm }}>
      {isEditing ? (
        <Text style={{ color: appColors.warning, fontSize: 12, fontWeight: "800", textTransform: "uppercase" }}>
          Editando abastecimento
        </Text>
      ) : null}

      {/* Row de Preço, Litros e Total */}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="R$/Litro" style={{ flex: 1 }}>
          <TextInput
            value={formData.price_per_liter}
            onChangeText={(v) => updateField("price_per_liter", v)}
            style={inputStyle}
            placeholder="0.00"
            keyboardType="decimal-pad"
            placeholderTextColor={appColors.textMuted}
          />
        </Field>
        
        <Field label="Litros" style={{ flex: 1 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              value={formData.liters}
              onChangeText={(v) => updateField("liters", v)}
              style={inputStyle}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={appColors.textMuted}
            />
            <Pressable 
              onPress={calculateLiters}
              style={{ position: 'absolute', right: 8, top: 14 }}
            >
              <Ionicons name="calculator-outline" size={20} color={appColors.warning} />
            </Pressable>
          </View>
        </Field>

        <Field label="Total R$" style={{ flex: 1 }}>
          <View style={{ position: 'relative' }}>
            <TextInput
              value={formData.amount}
              onChangeText={(v) => updateField("amount", v)}
              style={[inputStyle, { fontWeight: "800" }]}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={appColors.textMuted}
            />
            <Pressable 
              onPress={calculateTotal}
              style={{ position: 'absolute', right: 8, top: 14 }}
            >
              <Ionicons name="refresh-outline" size={20} color={appColors.success} />
            </Pressable>
          </View>
        </Field>
      </View>

      {/* Helper Text para automação */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs }}>
        <Text style={{ color: appColors.textMuted, fontSize: 10 }}>Clique no ícone para calcular</Text>
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Odometro" style={{ flex: 1 }}>
          <TextInput
            value={formData.odometer}
            onChangeText={(v) => updateField("odometer", v)}
            style={inputStyle}
            placeholder="Km atual"
            keyboardType="numeric"
            placeholderTextColor={appColors.textMuted}
          />
        </Field>
        <Field label="Posto" style={{ flex: 1.4 }}>
          <TextInput
            value={formData.gas_station}
            onChangeText={(v) => updateField("gas_station", v)}
            style={inputStyle}
            placeholder="Ex: Ipiranga"
            placeholderTextColor={appColors.textMuted}
          />
        </Field>
      </View>

      <Field label="Descricao">
        <TextInput
          value={formData.description}
          onChangeText={(v) => updateField("description", v)}
          style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
          placeholder="Observacao opcional"
          placeholderTextColor={appColors.textMuted}
          multiline
        />
      </Field>

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <Field label="Data" style={{ flex: 1 }}>
          <TextInput
            value={formData.date_competition}
            onChangeText={(v) => updateField("date_competition", v)}
            style={inputStyle}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={appColors.textMuted}
          />
        </Field>

        <Field label="Combustivel" style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", gap: spacing.xs }}>
            <FuelChip
              label="Gasolina"
              active={formData.type === "gasoline"}
              onPress={() => updateField("type", "gasoline")}
            />
            <FuelChip
              label="Etanol"
              active={formData.type === "Ethanol"}
              onPress={() => updateField("type", "Ethanol")}
            />
          </View>
        </Field>
      </View>

      <SessionSelector
        sessions={sessions}
        selectedSessionId={formData.sessionId}
        onSelectSession={(id) => updateField("sessionId", id)}
      />

      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <PrimaryButton
          label={isEditing ? "Salvar alteracoes" : "Confirmar abastecimento"}
          onPress={() => onSubmit(formData)}
          loading={loading}
          icon={<Ionicons name="checkmark-outline" size={18} color={appColors.white} />}
        />
        {onCancel ? (
          <PrimaryButton
            label="Cancelar"
            onPress={onCancel}
            variant="ghost"
            icon={<Ionicons name="close-outline" size={18} color={appColors.textPrimary} />}
          />
        ) : null}
      </View>
    </View>
  );
};

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[{ gap: spacing.xs }, style]}>
      <Text style={{ color: appColors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function FuelChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 56,
        borderRadius: radius.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? appColors.warning : appColors.surface,
        borderWidth: 1,
        borderColor: active ? appColors.warning : appColors.border,
      }}
    >
      <Text style={{ color: appColors.textPrimary, fontWeight: "800" }}>{label}</Text>
    </Pressable>
  );
}

const inputStyle = {
  backgroundColor: appColors.surface,
  borderColor: appColors.border,
  borderWidth: 1,
  borderRadius: radius.lg,
  color: appColors.textPrimary,
  fontSize: 16,
  minHeight: 56,
  paddingHorizontal: spacing.sm,
  paddingVertical: 14,
} as const;
