export interface Client {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  client_type?: "store" | "restaurant" | "customer" | "warehouse" | null;
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
  
  delivery_location: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  
  value: number | null;
  
  // GPS Event tracking
  driver_start_lat: number | null;
  driver_start_lng: number | null;
  driver_start_at: string | null;

  pickup_arrived_lat: number | null;
  pickup_arrived_lng: number | null;
  pickup_arrived_at: string | null;

  delivery_arrived_lat: number | null;
  delivery_arrived_lng: number | null;
  delivery_arrived_at: string | null;

  driver_to_pickup_km: number | null;
  pickup_to_delivery_km: number | null;
  
  route_status: "pending" | "going_to_pickup" | "pickup_arrived" | "delivering" | "completed" | "cancelled";
  
  payment_required: boolean;
  payment_status: "pending" | "paid" | "failed";
  payment_received_at: string | null;
  
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  synced?: boolean;
}
