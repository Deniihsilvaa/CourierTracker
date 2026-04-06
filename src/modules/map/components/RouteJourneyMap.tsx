import { GlassCard } from "@/components/cards/glass-card";
import { Route } from "@/src/types/route.types";
import { appColors, radius, spacing } from "@/src/theme/colors";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

interface RouteJourneyMapProps {
  route: Route;
}

function toPoint(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

export const RouteJourneyMap = memo(function RouteJourneyMap({ route }: RouteJourneyMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const originPoint = toPoint(route.driver_start_lat, route.driver_start_lng);
  const pickupPoint = toPoint(route.pickup_arrived_lat ?? route.pickup_lat, route.pickup_arrived_lng ?? route.pickup_lng);
  const deliveryPoint = toPoint(route.delivery_arrived_lat ?? route.delivery_lat, route.delivery_arrived_lng ?? route.delivery_lng);

  const plannedPolyline = useMemo(
    () =>
      Array.isArray(route.route_geometry)
        ? route.route_geometry
            .map(([longitude, latitude]) => ({ latitude, longitude }))
            .filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
        : [],
    [route.route_geometry]
  );

  const traveledToPickup = useMemo(
    () => (originPoint && pickupPoint ? [originPoint, pickupPoint] : []),
    [originPoint, pickupPoint]
  );

  const traveledToDelivery = useMemo(
    () => (pickupPoint && deliveryPoint ? [pickupPoint, deliveryPoint] : []),
    [pickupPoint, deliveryPoint]
  );

  const fitPoints = useMemo(
    () => [originPoint, pickupPoint, deliveryPoint].filter(Boolean) as Array<{ latitude: number; longitude: number }>,
    [deliveryPoint, originPoint, pickupPoint]
  );

  useEffect(() => {
    if (!mapRef.current || !isMapReady || fitPoints.length === 0) {
      return;
    }

    if (fitPoints.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: fitPoints[0].latitude,
          longitude: fitPoints[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        450
      );
      return;
    }

    try {
      mapRef.current.fitToCoordinates(fitPoints, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    } catch (e) {
      console.warn("[RouteJourneyMap] fitToCoordinates failed", e);
    }
  }, [fitPoints, isMapReady]);

  if (!pickupPoint && !deliveryPoint && !originPoint) {
    return (
      <GlassCard>
        <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>Mapa indisponivel</Text>
        <Text style={{ color: appColors.textSecondary, fontSize: 14, lineHeight: 20 }}>
          Esta rota ainda nao possui coordenadas suficientes para renderizar o trajeto.
        </Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={{ padding: spacing.xs }}>
      <View style={{ gap: 4, marginBottom: spacing.xs }}>
        <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>Trajeto da rota</Text>
        <Text style={{ color: appColors.textSecondary, fontSize: 13, lineHeight: 20 }}>
          Azul mostra o ponto de registro. Amarelo indica coleta. Verde indica entrega.
        </Text>
      </View>

      <MapView
        ref={(instance) => {
          mapRef.current = instance;
        }}
        onMapReady={() => setIsMapReady(true)}
        style={{ height: 220, borderRadius: radius.xl }}
        initialRegion={{
          latitude: pickupPoint?.latitude ?? originPoint?.latitude ?? deliveryPoint?.latitude ?? -14.235,
          longitude: pickupPoint?.longitude ?? originPoint?.longitude ?? deliveryPoint?.longitude ?? -51.9253,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        toolbarEnabled={false}
        showsCompass={false}
      >
        {plannedPolyline.length > 1 ? (
          <Polyline coordinates={plannedPolyline} strokeColor={appColors.primary} strokeWidth={4} />
        ) : null}

        {plannedPolyline.length <= 1 && traveledToPickup.length > 1 ? (
          <Polyline coordinates={traveledToPickup} strokeColor={appColors.primary} strokeWidth={4} />
        ) : null}

        {plannedPolyline.length <= 1 && traveledToDelivery.length > 1 ? (
          <Polyline coordinates={traveledToDelivery} strokeColor={appColors.success} strokeWidth={4} />
        ) : null}

        {originPoint ? <Marker coordinate={originPoint} title="Registro" pinColor={appColors.primary} /> : null}
        {pickupPoint ? <Marker coordinate={pickupPoint} title="Coleta" pinColor={appColors.warning} /> : null}
        {deliveryPoint ? <Marker coordinate={deliveryPoint} title="Entrega" pinColor={appColors.success} /> : null}
      </MapView>
    </GlassCard>
  );
});
