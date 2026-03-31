import { api } from '@/src/services/api';
import { CloseSessionPayload } from './../type';

export const closeSessionOnApi = async (sessionID: string, payload: CloseSessionPayload) => {
    try {
        console.log(`[Session Service] Closing session ${sessionID} on API...`);
        
        // Convert to camelCase for API compatibility (similar to startSession)
        const apiPayload = {
            endTime: payload.end_time,
            status: payload.status,
            totalDistanceKm: payload.total_distance_km,
            totalActiveSeconds: payload.total_active_seconds,
            totalIdleSeconds: payload.total_idle_seconds,
            endOdometer: payload.end_odometer
        };

        await api.put(`/sessions/v1/${sessionID}`, apiPayload);
        console.log(`[Session Service] API session ${sessionID} closed successfully.`);
    } catch (apiError) {
        console.warn('[Session Service] API close failed, session will be synced later', apiError);
    }
}