import { localDatabase } from '@/src/services/localDatabase';
import { CloseSessionPayload } from "../type";

export const updateOfflineSession = async (sessionID: string, payload: CloseSessionPayload) => {
    // 2. Update offline session record using the generic update utility
    // This updates end_time, status, total_distance_km, etc.
    await localDatabase.update('work_sessions', sessionID, {
        ...payload
    });

}



