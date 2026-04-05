import { GlassCard } from "@/components/cards/glass-card";
import { appColors, radius, spacing } from "@/src/theme/colors";
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Text, View } from "react-native";
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { AddressSelection, MapCoordinate, RouteCalculation } from "../types";

interface RouteMapProps {
  userLocation: MapCoordinate | null;
  pickupAddress: AddressSelection | null;
  deliveryAddress: AddressSelection | null;
  route: RouteCalculation | null;
}

function coordinateToMapPoint(value: MapCoordinate | AddressSelection | null) {
  if (!value) {
    return null;
  }

  return {
    latitude: value.latitude,
    longitude: value.longitude,
  };
}

export const RouteMap = memo(function RouteMap({
  userLocation,
  pickupAddress,
  deliveryAddress,
  route,
}: RouteMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const initialRegion = useMemo<Region>(
    () => ({
      latitude: pickupAddress?.latitude ?? userLocation?.latitude ?? -14.235,
      longitude: pickupAddress?.longitude ?? userLocation?.longitude ?? -51.9253,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    }),
    [pickupAddress?.latitude, pickupAddress?.longitude, userLocation?.latitude, userLocation?.longitude]
  );

  const points = useMemo(
    () => [coordinateToMapPoint(userLocation), coordinateToMapPoint(pickupAddress), coordinateToMapPoint(deliveryAddress)].filter(Boolean) as MapCoordinate[],
    [deliveryAddress, pickupAddress, userLocation]
  );

  useEffect(() => {
    if (!mapRef.current || points.length === 0) {
      return;
    }

    if (points.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
      return;
    }

    mapRef.current.fitToCoordinates(points, {
      edgePadding: {
        top: 60,
        right: 60,
        bottom: 60,
        left: 60,
      },
      animated: true,
    });
  }, [points]);

  return (
    <GlassCard style={{ padding: spacing.xs }}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
        <Text style={{ color: appColors.textPrimary, fontSize: 16, fontWeight: "800" }}>Mapa da rota</Text>
        <Text style={{ color: appColors.textSecondary, fontSize: 13, lineHeight: 20 }}>
          Selecione a coleta e, opcionalmente, a entrega para visualizar a rota.
        </Text>
      </View>

      <MapView
        ref={(instance) => {
          mapRef.current = instance;
        }}
        initialRegion={initialRegion}
        style={{ height: 260, borderRadius: radius.xl }}
        showsUserLocation={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {userLocation ? (
          <Marker
            coordinate={userLocation}
            title="Sua posicao"
            pinColor={appColors.primary}
          />
        ) : null}

        {pickupAddress ? (
          <Marker
            coordinate={{ latitude: pickupAddress.latitude, longitude: pickupAddress.longitude }}
            title="Coleta"
            description={pickupAddress.full_address}
            pinColor={appColors.warning}
          />
        ) : null}

        {deliveryAddress ? (
          <Marker
            coordinate={{ latitude: deliveryAddress.latitude, longitude: deliveryAddress.longitude }}
            title="Entrega"
            description={deliveryAddress.full_address}
            pinColor={appColors.success}
          />
        ) : null}

        {route?.geometry?.length ? (
          <Polyline
            coordinates={route.geometry.map(([longitude, latitude]) => ({ latitude, longitude }))}
            strokeColor={appColors.primary}
            strokeWidth={4}
          />
        ) : null}
      </MapView>
    </GlassCard>
  );
});
