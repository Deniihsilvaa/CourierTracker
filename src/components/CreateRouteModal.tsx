import { PrimaryButton } from "@/components/buttons/primary-button";
import { GlassCard } from "@/components/cards/glass-card";
import { SectionHeader } from "@/components/layout/section-header";
import { AddressAutocomplete } from "@/src/modules/map/components/AddressAutocomplete";
import { RouteMap } from "@/src/modules/map/components/RouteMap";
import { mapboxService } from "@/src/modules/map/services/mapboxService";
import { AddressSelection, MapCoordinate, RouteCalculation } from "@/src/modules/map/types";
import { ClientPickerModal } from "@/src/modules/clients/components/ClientPickerModal";
import { useRouteStore } from "@/src/store/routeStore";
import { Client } from "@/src/types/route.types";
import { appColors, radius, spacing } from "@/src/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CreateRouteModalProps {
  visible: boolean;
  onClose: () => void;
}

async function clientToAddressSelection(client: Client): Promise<AddressSelection> {
  if (client.latitude != null && client.longitude != null) {
    return {
      full_address: client.address,
      latitude: client.latitude,
      longitude: client.longitude,
      city: null,
      state: null,
      country: "Brasil",
    };
  }

  const results = await mapboxService.searchAddress(client.address);
  const firstResult = results[0];

  if (!firstResult) {
    throw new Error("Nao foi possivel localizar o endereco do cliente no mapa.");
  }

  return firstResult;
}

export const CreateRouteModal: React.FC<CreateRouteModalProps> = ({ visible, onClose }) => {
  const { addRoute } = useRouteStore();
  const [value, setValue] = useState("");
  const [paymentRequired, setPaymentRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickupAddress, setPickupAddress] = useState<AddressSelection | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressSelection | null>(null);
  const [userLocation, setUserLocation] = useState<MapCoordinate | null>(null);
  const [routePreview, setRoutePreview] = useState<RouteCalculation | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          setLocationError("Permissao de localizacao negada. A distancia sera calculada apenas quando houver GPS disponivel.");
          return;
        }

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setUserLocation({
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        });
        setLocationError(null);
      } catch (error) {
        setLocationError("Nao foi possivel obter sua localizacao atual.");
      }
    })();
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (!pickupAddress || !userLocation) {
      setRoutePreview(null);
      return;
    }

    const controller = new AbortController();
    setIsCalculatingRoute(true);
    setRouteError(null);

    const destination = deliveryAddress ?? pickupAddress;
    const waypoints = deliveryAddress ? [pickupAddress] : [];

    void mapboxService
      .calculateRoute(userLocation, destination, waypoints, controller.signal)
      .then((result) => {
        setRoutePreview(result);
      })
      .catch((error: any) => {
        if (error?.name === "AbortError") {
          return;
        }

        setRoutePreview(null);
        setRouteError(error instanceof Error ? error.message : "Nao foi possivel calcular a rota.");
      })
      .finally(() => {
        setIsCalculatingRoute(false);
      });

    return () => controller.abort();
  }, [deliveryAddress, pickupAddress, userLocation, visible]);

  const routeMetrics = useMemo(() => {
    if (!routePreview) {
      return {
        driverToPickupKm: null as number | null,
        pickupToDeliveryKm: null as number | null,
      };
    }

    return {
      driverToPickupKm: routePreview.legs[0]?.distanceKm ?? routePreview.distanceKm,
      pickupToDeliveryKm: routePreview.legs[1]?.distanceKm ?? null,
    };
  }, [routePreview]);

  const resetState = () => {
    setValue("");
    setPaymentRequired(true);
    setSelectedClient(null);
    setPickupAddress(null);
    setDeliveryAddress(null);
    setRoutePreview(null);
    setRouteError(null);
    setPickerVisible(false);
  };

  const handleConfirm = async () => {
    if (!pickupAddress) {
      setRouteError("Selecione um endereco de coleta valido.");
      return;
    }

    setIsSubmitting(true);
    const numericValue = value.trim() ? parseFloat(value.replace(",", ".")) : null;

    try {
      await addRoute({
        pickup_location: pickupAddress.full_address,
        pickup_lat: pickupAddress.latitude,
        pickup_lng: pickupAddress.longitude,
        delivery_location: deliveryAddress?.full_address ?? null,
        delivery_lat: deliveryAddress?.latitude ?? null,
        delivery_lng: deliveryAddress?.longitude ?? null,
        value: numericValue,
        payment_required: paymentRequired,
        client_id: selectedClient?.id ?? undefined,
        driver_to_pickup_km: routeMetrics.driverToPickupKm,
        pickup_to_delivery_km: routeMetrics.pickupToDeliveryKm,
        estimated_duration_minutes: routePreview?.durationMinutes ?? null,
        route_geometry: routePreview?.geometry ?? null,
      });

      resetState();
      onClose();
    } catch (e) {
      setRouteError(e instanceof Error ? e.message : "Nao foi possivel criar a rota.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" }}
      >
        <View
          style={{
            backgroundColor: appColors.backgroundElevated,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            padding: spacing.md,
            height: "88%",
            borderTopWidth: 1,
            borderColor: appColors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
            <Text style={{ color: appColors.textPrimary, fontSize: 28, fontWeight: "900" }}>
              Nova rota
            </Text>
            <TouchableOpacity
              onPress={() => {
                resetState();
                onClose();
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: appColors.surface,
                borderWidth: 1,
                borderColor: appColors.border,
              }}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={20} color={appColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={{ gap: spacing.sm, paddingBottom: 32 }}>
              <GlassCard>
                <SectionHeader title="Cliente" subtitle="Opcional: use um cliente salvo para preencher a coleta mais rapido." />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, marginTop: spacing.sm }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>
                      {selectedClient ? selectedClient.name : "Nenhum cliente selecionado"}
                    </Text>
                    <Text style={{ color: appColors.textSecondary, fontSize: 13 }}>
                      {selectedClient ? selectedClient.address : "Selecione um cliente para reaproveitar dados da coleta."}
                    </Text>
                  </View>
                  <PrimaryButton
                    label={selectedClient ? "Trocar" : "Selecionar"}
                    onPress={() => setPickerVisible(true)}
                    variant="secondary"
                    icon={<Ionicons name="person-outline" size={18} color={appColors.textPrimary} />}
                  />
                </View>
                {selectedClient ? (
                  <TouchableOpacity onPress={() => setSelectedClient(null)} disabled={isSubmitting} style={{ marginTop: spacing.xs }}>
                    <Text style={{ color: appColors.danger, fontSize: 13, fontWeight: "700" }}>Remover cliente</Text>
                  </TouchableOpacity>
                ) : null}
              </GlassCard>

              <AddressAutocomplete
                label="Coleta"
                placeholder="Busque o endereco de coleta"
                selectedAddress={pickupAddress}
                onSelectAddress={setPickupAddress}
                onClearAddress={() => setPickupAddress(null)}
                editable={!isSubmitting}
              />

              <AddressAutocomplete
                label="Entrega"
                placeholder="Busque o endereco de entrega"
                selectedAddress={deliveryAddress}
                onSelectAddress={setDeliveryAddress}
                onClearAddress={() => setDeliveryAddress(null)}
                editable={!isSubmitting}
              />

              <RouteMap
                userLocation={userLocation}
                pickupAddress={pickupAddress}
                deliveryAddress={deliveryAddress}
                route={routePreview}
              />

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <MetricPill
                  label="Distancia"
                  value={
                    isCalculatingRoute
                      ? "Calculando..."
                      : routePreview
                        ? `${routePreview.distanceKm.toFixed(1)} km`
                        : "--"
                  }
                />
                <MetricPill
                  label="Duracao"
                  value={
                    isCalculatingRoute
                      ? "Calculando..."
                      : routePreview
                        ? `${routePreview.durationMinutes.toFixed(0)} min`
                        : "--"
                  }
                />
              </View>

              {locationError ? (
                <Text style={{ color: appColors.warning, fontSize: 13, fontWeight: "700" }}>{locationError}</Text>
              ) : null}
              {routeError ? (
                <Text style={{ color: appColors.danger, fontSize: 13, fontWeight: "700" }}>{routeError}</Text>
              ) : null}

              <GlassCard>
                <SectionHeader title="Financeiro" subtitle="Defina valor e necessidade de cobranca na entrega." />
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                  <View style={{ gap: spacing.xs }}>
                    <Text style={{ color: appColors.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>
                      Valor da entrega
                    </Text>
                    <TextInput
                      style={{
                        minHeight: 56,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: appColors.border,
                        backgroundColor: appColors.surface,
                        color: appColors.success,
                        paddingHorizontal: spacing.sm,
                        fontSize: 18,
                        fontWeight: "800",
                      }}
                      placeholder="0,00"
                      placeholderTextColor={appColors.textMuted}
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={setValue}
                      editable={!isSubmitting}
                    />
                  </View>

                  <View
                    style={{
                      minHeight: 56,
                      borderRadius: radius.lg,
                      borderWidth: 1,
                      borderColor: appColors.border,
                      backgroundColor: appColors.surface,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: spacing.sm,
                    }}
                  >
                    <Text style={{ color: appColors.textPrimary, fontSize: 15, fontWeight: "700" }}>
                      Pagamento na entrega
                    </Text>
                    <Switch
                      value={paymentRequired}
                      onValueChange={setPaymentRequired}
                      trackColor={{ false: "#334155", true: appColors.success }}
                      thumbColor="#fff"
                      disabled={isSubmitting}
                    />
                  </View>
                </View>
              </GlassCard>

              <PrimaryButton
                label={isSubmitting ? "Criando rota..." : "Criar rota"}
                onPress={handleConfirm}
                loading={isSubmitting}
                icon={<Ionicons name="map-outline" size={18} color={appColors.white} />}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <ClientPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectClient={(client) => {
          setSelectedClient(client);
          setPickerVisible(false);
          void clientToAddressSelection(client)
            .then((address) => {
              setPickupAddress(address);
            })
            .catch((error) => {
              setRouteError(error instanceof Error ? error.message : "Nao foi possivel localizar o cliente no mapa.");
            });
        }}
      />
    </Modal>
  );
};

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minHeight: 68,
        borderRadius: radius.lg,
        backgroundColor: appColors.surface,
        borderWidth: 1,
        borderColor: appColors.border,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.sm,
        gap: 4,
      }}
    >
      <Text style={{ color: appColors.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ color: appColors.textPrimary, fontSize: 18, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}
