export interface Route {
  id: string;
  pickup_location: string;
  delivery_location: string;
  value: number;
  distance_km: number | null;
  status: "pending" | "pickup" | "delivering" | "completed";
  created_at: string;
  synced: boolean;
}
