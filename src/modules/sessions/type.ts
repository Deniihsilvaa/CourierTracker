export type CloseSessionPayload = {
    end_time: string
    status: 'closed'
    total_distance_km: number
    total_active_seconds: number
    total_idle_seconds: number
    end_odometer?: number
}