import {
  ClientPayload,
  ClientType,
} from "@/src/modules/clients/api/clientApi";
import { useEffect, useState } from "react";
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
  { value: "warehouse", label: "Depósito" },
];

const inputStyle = {
  backgroundColor: "#111827",
  borderColor: "#1f2937",
  borderWidth: 1,
  borderRadius: 18,
  color: "#f9fafb",
  fontSize: 16,
  minHeight: 56,
  paddingHorizontal: 16,
  paddingVertical: 14,
} as const;

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
  }, [initialValues]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (trimmedName.length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (trimmedAddress.length < 5) {
      setError("Informe um endereço com pelo menos 5 caracteres.");
      return;
    }

    const parsedLatitude = latitude.trim() ? Number(latitude.replace(",", ".")) : null;
    const parsedLongitude = longitude.trim() ? Number(longitude.replace(",", ".")) : null;

    if (parsedLatitude !== null && (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) {
      setError("Latitude inválida.");
      return;
    }

    if (parsedLongitude !== null && (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180)) {
      setError("Longitude inválida.");
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
    <View style={{ gap: 14 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ color: "#d1d5db", fontSize: 14, fontWeight: "700" }}>Nome</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Ex.: Mercado Central" placeholderTextColor="#6b7280" editable={!isSubmitting} style={inputStyle} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: "#d1d5db", fontSize: 14, fontWeight: "700" }}>Endereço</Text>
        <TextInput value={address} onChangeText={setAddress} placeholder="Rua, número e referência" placeholderTextColor="#6b7280" editable={!isSubmitting} multiline style={[inputStyle, { minHeight: 88, textAlignVertical: "top" }]} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: "#d1d5db", fontSize: 14, fontWeight: "700" }}>Telefone</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="Ex.: +55 11 99999-9999" placeholderTextColor="#6b7280" editable={!isSubmitting} keyboardType="phone-pad" style={inputStyle} />
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: "#d1d5db", fontSize: 14, fontWeight: "700" }}>Tipo de cliente</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {clientTypeOptions.map((option) => {
            const active = clientType === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => setClientType(option.value)}
                disabled={isSubmitting}
                style={{
                  backgroundColor: active ? "#2563eb" : "#111827",
                  borderColor: active ? "#3b82f6" : "#1f2937",
                  borderWidth: 1,
                  borderRadius: 999,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  minHeight: 44,
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#f9fafb", fontWeight: "700" }}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ color: "#d1d5db", fontSize: 14, fontWeight: "700" }}>Latitude</Text>
          <TextInput value={latitude} onChangeText={setLatitude} placeholder="-23.5505" placeholderTextColor="#6b7280" editable={!isSubmitting} keyboardType="decimal-pad" style={inputStyle} />
        </View>

        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ color: "#d1d5db", fontSize: 14, fontWeight: "700" }}>Longitude</Text>
          <TextInput value={longitude} onChangeText={setLongitude} placeholder="-46.6333" placeholderTextColor="#6b7280" editable={!isSubmitting} keyboardType="decimal-pad" style={inputStyle} />
        </View>
      </View>

      {error ? (
        <View style={{ backgroundColor: "#3f1d1d", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#7f1d1d" }}>
          <Text selectable style={{ color: "#fecaca", fontSize: 14, fontWeight: "600" }}>
            {error}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={{
          backgroundColor: isSubmitting ? "#1f2937" : "#16a34a",
          borderRadius: 18,
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 8,
          paddingHorizontal: 16,
        }}
      >
        <Text style={{ color: "#f9fafb", fontSize: 16, fontWeight: "800" }}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}
