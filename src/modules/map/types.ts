export interface AddressSelection {
  full_address: string;
  latitude: number;
  longitude: number;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface AddressSuggestion extends AddressSelection {
  id: string;
}

export interface RouteLegSummary {
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteCalculation {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][];
  legs: RouteLegSummary[];
}
