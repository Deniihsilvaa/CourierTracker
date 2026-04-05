import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { SectionHeader } from "@/components/layout/section-header";
import {
  ClientPayload,
  ClientType,
} from "@/src/modules/clients/api/clientApi";
import { geocodingService } from "@/src/services/geocodingService";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface ClientFormProps {
  initialValues?: Partial<ClientPayload>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: ClientPayload) => Promise<void> | void;
}

const clientTypeOptions: { value: ClientType; label: string }[] = [
  { value: "store", label: "Loja" },
  { value: "restaurant", label: "Restaurante" },
  { value: "customer", label: "Cliente" },
  { value: "warehouse", label: "Deposito" },
];

export function ClientForm({
  initialValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: ClientFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [latitude, setLatitude] = useState(
    initialValues?.latitude !== undefined && initialValues.latitude !== null
      ? String(initialValues.latitude)
      : ""
  );
  const [longitude, setLongitude] = useState(
    initialValues?.longitude !== undefined && initialValues.longitude !== null
      ? String(initialValues.longitude)
      : ""
  );
  const [clientType, setClientType] = useState<ClientType | null>(
    initialValues?.client_type ?? "customer"
  );
  const [error, setError] = useState<string | null>(null);
  const [geocodeStatus, setGeocodeStatus] = useState<"idle" | "searching" | "resolved" | "not_found" | "error">("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);
  const lastResolvedAddressRef = useRef("");

  useEffect(() => {
    setName(initialValues?.name ?? "");
    setAddress(initialValues?.address ?? "");
    setPhone(initialValues?.phone ?? "");
    setLatitude(
      initialValues?.latitude !== undefined && initialValues.latitude !== null
        ? String(initialValues.latitude)
        : ""
    );
    setLongitude(
      initialValues?.longitude !== undefined && initialValues.longitude !== null
        ? String(initialValues.longitude)
        : ""
    );
    setClientType(initialValues?.client_type ?? "customer");
    setGeocodeStatus(initialValues?.latitude != null && initialValues?.longitude != null ? "resolved" : "idle");
    lastResolvedAddressRef.current = (initialValues?.address ?? "").trim().toLowerCase();
  }, [initialValues]);

  useEffect(() => {
    const trimmedAddress = address.trim();
    const normalizedAddress = trimmedAddress.toLowerCase();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!trimmedAddress) {
      setLatitude("");
      setLongitude("");
      setGeocodeStatus("idle");
      lastResolvedAddressRef.current = "";
      return;
    }

    if (normalizedAddress === lastResolvedAddressRef.current) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      void resolveAddressCoordinates(trimmedAddress);
    }, 3000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [address]);

  const resolveAddressCoordinates = async (rawAddress?: string) => {
    const trimmedAddress = (rawAddress ?? address).trim();
    const normalizedAddress = trimmedAddress.toLowerCase();

    if (!trimmedAddress || normalizedAddress === lastResolvedAddressRef.current) {
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setGeocodeStatus("searching");

    try {
      const coordinates = await geocodingService.geocodeAddress(trimmedAddress);

      if (requestRef.current !== requestId) {
        return;
      }

      if (coordinates) {
        setLatitude(String(coordinates.lat));
        setLongitude(String(coordinates.lng));
        setGeocodeStatus("resolved");
        lastResolvedAddressRef.current = normalizedAddress;
      } else {
        setLatitude("");
        setLongitude("");
        setGeocodeStatus("not_found");
        lastResolvedAddressRef.current = "";
      }
    } catch {
      if (requestRef.current !== requestId) {
        return;
      }

      setLatitude("");
      setLongitude("");
      setGeocodeStatus("error");
      lastResolvedAddressRef.current = "";
    }
  };

  const handleAddressBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    void resolveAddressCoordinates();
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (trimmedName.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (trimmedAddress.length < 5) {
      setError("Informe um endereco com pelo menos 5 caracteres.");
      return;
    }

    const parsedLatitude = latitude.trim() ? Number(latitude.replace(",", ".")) : null;
    const parsedLongitude = longitude.trim() ? Number(longitude.replace(",", ".")) : null;

    if (parsedLatitude !== null && (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) {
      setError("Latitude invalida.");
      return;
    }

    if (parsedLongitude !== null && (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180)) {
      setError("Longitude invalida.");
      return;
    }

    setError(null);

    await onSubmit({
      name: trimmedName,
      address: trimmedAddress,
      phone: phone.trim() || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      client_type: clientType,
    });
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <GlassCard>
        <SectionHeader title="Dados principais" subtitle="Cadastro manual com busca automatica de coordenadas." />
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          <Field label="Nome">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Mercado Central"
              placeholderTextColor={appColors.textMuted}
              editable={!isSubmitting}
              style={inputStyle}
            />
          </Field>

          <Field label="Endereco">
            <TextInput
              value={address}
              onChangeText={(value) => {
                setAddress(value);
                setGeocodeStatus(value.trim() ? "idle" : "idle");
              }}
              onBlur={handleAddressBlur}
              placeholder="Rua, numero e referencia"
              placeholderTextColor={appColors.textMuted}
              editable={!isSubmitting}
              multiline
              style={[inputStyle, { minHeight: 88, textAlignVertical: "top" }]}
            />
          </Field>

          <Field label="Telefone">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Ex.: +55 11 99999-9999"
              placeholderTextColor={appColors.textMuted}
              editable={!isSubmitting}
              keyboardType="phone-pad"
              style={inputStyle}
            />
          </Field>
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Tipo de cliente" subtitle="Classifique o cadastro para facilitar a operacao." />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm }}>
          {clientTypeOptions.map((option) => {
            const active = clientType === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setClientType(option.value)}
                disabled={isSubmitting}
                style={{
                  backgroundColor: active ? appColors.primaryStrong : appColors.surface,
                  borderColor: active ? appColors.primaryGradientStart : appColors.border,
                  borderWidth: 1,
                  borderRadius: radius.pill,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: appColors.textPrimary, fontWeight: "700" }}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard>
        <SectionHeader title="Coordenadas" subtitle="Geradas automaticamente a partir do endereco informado." />
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <GeocodeStatus status={geocodeStatus} />

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Field label="Latitude" style={{ flex: 1 }}>
              <TextInput
                value={latitude}
                editable={false}
                selectTextOnFocus
                placeholder="Aguardando endereco"
                placeholderTextColor={appColors.textMuted}
                style={[inputStyle, readOnlyInputStyle]}
              />
            </Field>

            <Field label="Longitude" style={{ flex: 1 }}>
              <TextInput
                value={longitude}
                editable={false}
                selectTextOnFocus
                placeholder="Aguardando endereco"
                placeholderTextColor={appColors.textMuted}
                style={[inputStyle, readOnlyInputStyle]}
              />
            </Field>
          </View>
        </View>
      </GlassCard>

      {error ? (
        <GlassCard style={{ borderColor: "rgba(239, 68, 68, 0.28)", backgroundColor: "rgba(127, 29, 29, 0.24)" }}>
          <Text selectable style={{ color: "#fecaca", fontSize: 14, fontWeight: "700" }}>
            {error}
          </Text>
        </GlassCard>
      ) : null}

      <PrimaryButton
        label={isSubmitting ? "Salvando..." : submitLabel}
        onPress={() => void handleSubmit()}
        loading={isSubmitting}
        icon={<Ionicons name="checkmark-outline" size={18} color={appColors.white} />}
      />
    </View>
  );
}

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
      <Text style={{ color: appColors.textSecondary, fontSize: 14, fontWeight: "700" }}>{label}</Text>
      {children}
    </View>
  );
}

function GeocodeStatus({ status }: { status: "idle" | "searching" | "resolved" | "not_found" | "error" }) {
  if (status === "idle") {
    return (
      <Text style={{ color: appColors.textMuted, fontSize: 13, lineHeight: 20 }}>
        As coordenadas serao buscadas automaticamente 3 segundos apos parar de digitar ou ao sair do campo de endereco.
      </Text>
    );
  }

  if (status === "searching") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Ionicons name="sync-outline" size={14} color={appColors.primary} />
        <Text style={{ color: appColors.primary, fontSize: 13, fontWeight: "700" }}>Consultando latitude e longitude...</Text>
      </View>
    );
  }

  if (status === "resolved") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Ionicons name="checkmark-circle-outline" size={14} color={appColors.success} />
        <Text style={{ color: appColors.success, fontSize: 13, fontWeight: "700" }}>Coordenadas preenchidas automaticamente.</Text>
      </View>
    );
  }

  if (status === "not_found") {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
        <Ionicons name="alert-circle-outline" size={14} color={appColors.warning} />
        <Text style={{ color: appColors.warning, fontSize: 13, fontWeight: "700" }}>Endereco nao localizado. Revise o texto informado.</Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
      <Ionicons name="warning-outline" size={14} color={appColors.danger} />
      <Text style={{ color: appColors.danger, fontSize: 13, fontWeight: "700" }}>Falha ao consultar coordenadas no momento.</Text>
    </View>
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

const readOnlyInputStyle = {
  color: appColors.textSecondary,
  backgroundColor: "rgba(255,255,255,0.03)",
} as const;
