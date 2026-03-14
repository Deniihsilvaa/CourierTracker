export interface TripPerformance {
    id: string;
    user_id: string;
    distance_km: number;
    duration_seconds: number;
    avg_km_per_hour: number;
    start_time: string;
}