import { AddressSelection, AddressSuggestion, MapCoordinate, RouteCalculation } from "../types";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_GEOCODING_BASE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";
const MAPBOX_DIRECTIONS_BASE_URL = "https://api.mapbox.com/directions/v5/mapbox/driving";

function assertToken() {
  if (!MAPBOX_TOKEN) {
    throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN is not configured.");
  }
}

function parseContextValue(feature: any, keys: string[]): string | null {
  const context = Array.isArray(feature?.context) ? feature.context : [];
  const directContext = [feature, ...context].find((item) =>
    keys.some((key) => String(item?.id || "").startsWith(`${key}.`))
  );

  if (!directContext) {
    return null;
  }

  return directContext?.text ?? directContext?.short_code?.toUpperCase?.() ?? null;
}

function mapFeatureToAddress(feature: any): AddressSuggestion {
  const [longitude, latitude] = feature?.center ?? [0, 0];
  const stateValue = parseContextValue(feature, ["region"]);

  return {
    id: feature.id,
    full_address: feature.place_name ?? feature.text ?? "",
    latitude,
    longitude,
    city: parseContextValue(feature, ["place", "locality", "district"]),
    state: stateValue,
    country: parseContextValue(feature, ["country"]),
  };
}

function roundMetric(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

export const mapboxService = {
  async searchAddress(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
    assertToken();

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      return [];
    }

    const endpoint = `${MAPBOX_GEOCODING_BASE_URL}/${encodeURIComponent(trimmedQuery)}.json`;
    const response = await fetch(
      `${endpoint}?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=6&language=pt-BR&country=BR&types=address,place,postcode,locality,neighborhood`,
      {
        method: "GET",
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Mapbox geocoding failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.features) ? payload.features.map(mapFeatureToAddress) : [];
  },

  async calculateRoute(
    origin: MapCoordinate,
    destination: MapCoordinate,
    waypoints: MapCoordinate[] = [],
    signal?: AbortSignal
  ): Promise<RouteCalculation> {
    assertToken();

    const coordinates = [origin, ...waypoints, destination]
      .map((point) => `${point.longitude},${point.latitude}`)
      .join(";");

    const response = await fetch(
      `${MAPBOX_DIRECTIONS_BASE_URL}/${coordinates}?access_token=${MAPBOX_TOKEN}&geometries=geojson&overview=full&steps=false`,
      {
        method: "GET",
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`Mapbox directions failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    const route = payload?.routes?.[0];

    if (!route) {
      throw new Error("No route returned by Mapbox.");
    }

    const geometry = Array.isArray(route.geometry?.coordinates) ? route.geometry.coordinates : [];
    const legs = Array.isArray(route.legs)
      ? route.legs.map((leg: any) => ({
          distanceKm: roundMetric(Number(leg?.distance || 0) / 1000),
          durationMinutes: roundMetric(Number(leg?.duration || 0) / 60, 1),
        }))
      : [];

    return {
      distanceKm: roundMetric(Number(route.distance || 0) / 1000),
      durationMinutes: roundMetric(Number(route.duration || 0) / 60, 1),
      geometry,
      legs,
    };
  },

  toCoordinate(address: AddressSelection | null | undefined): MapCoordinate | null {
    if (!address) {
      return null;
    }

    return {
      latitude: address.latitude,
      longitude: address.longitude,
    };
  },
};
