export interface Client {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  synced?: boolean;
}

export interface Route {
  id: string;
  session_id: string | null;
  client_id: string | null;
  
  pickup_location: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  
  delivery_location: string;
  delivery_lat: number | null;
  delivery_lng: number | null;
  
  value: number;
  distance_km: number | null;
  
  route_status: "pending" | "pickup" | "delivering" | "completed" | "cancelled";
  
  payment_required: boolean;
  payment_status: "pending" | "paid" | "failed";
  payment_received_at: string | null;
  
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  synced?: boolean;
}
