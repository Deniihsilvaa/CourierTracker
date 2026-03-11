import { getDb, cleanupSyncedData } from './sqlite';
import { supabase } from './supabase';
import { useSessionStore } from '../modules/sessions/store';
import { useTrackingStore } from '../modules/tracking/store';

// Helper to push unsynced items from a table
const syncTable = async (db: any, localTableName: string) => {
    try {
        // Increased batch size for scalability
        const BATCH_SIZE = 500;
        const unsyncedRows = await db.getAllAsync(`SELECT * FROM ${localTableName} WHERE synced = 0 LIMIT ${BATCH_SIZE}`);
        if (!unsyncedRows || unsyncedRows.length === 0) return { success: true, count: 0 };

        const remoteTableName = localTableName;

        const payload = unsyncedRows.map((row: any) => {
            const { synced, ...rest } = row;
            
            if (localTableName === 'profiles') {
                delete (rest as any).email;
                delete (rest as any).full_name;
            }

            if (localTableName === 'work_sessions') {
                return {
                    id: rest.id,
                    user_id: rest.user_id,
                    start_time: rest.start_time,
                    end_time: rest.end_time,
                    total_distance_km: rest.total_distance_km,
                    total_active_seconds: rest.total_active_seconds,
                    total_idle_seconds: rest.total_idle_seconds,
                    created_at: rest.created_at
                };
            }

            if (localTableName === 'gps_points') {
                delete (rest as any).id;
            }

            if (localTableName === 'trips') {
                return {
                    id: rest.id,
                    session_id: rest.session_id,
                    user_id: rest.user_id,
                    start_time: rest.start_time,
                    end_time: rest.end_time,
                    distance_km: rest.distance_km,
                    duration_seconds: rest.duration_seconds,
                    status: rest.status,
                    created_at: rest.created_at
                };
            }

            return rest;
        });

        const { error } = await supabase.from(remoteTableName).upsert(payload);
        
        if (error) {
            if (error.message === 'FetchError' || error.message.includes('Network request failed')) {
                throw new Error('OFFLINE');
            }
            console.error(`[Sync] Error in ${remoteTableName}:`, error.message);
            return { success: false, count: 0 };
        }

        const ids = unsyncedRows.map((r: any) => r.id);
        const placeholders = ids.map(() => '?').join(',');
        const query = `UPDATE ${localTableName} SET synced = 1 WHERE id IN (${placeholders})`;
        await db.runAsync(query, ids);
        
        return { success: true, count: unsyncedRows.length };
    } catch (e) {
        console.error(`[Sync] Fatal error in ${localTableName}:`, e);
        return { success: false, count: 0 };
    }
}

export const runFullSync = async () => {
    const db = getDb();
    const sessionStore = useSessionStore.getState();
    const activeSession = sessionStore.activeSession;
    
    try {
        console.log('[Sync] Starting synchronization...');

        const profilesOk = await syncTable(db, 'profiles');
        if (!profilesOk.success) return false;

        const sessionsOk = await syncTable(db, 'work_sessions');
        if (!sessionsOk.success) return false;

        await syncTable(db, 'trips');
        
        // GPS points can be many, so we loop up to 5 times to clear backlogs of up to 2500 points
        let gpsSyncs = 0;
        while (gpsSyncs < 5) {
            const res = await syncTable(db, 'gps_points');
            if (!res.success || res.count === 0) break;
            gpsSyncs++;
        }
        
        if (activeSession) {
            const updatedSession = await db.getFirstAsync<any>(
                'SELECT * FROM work_sessions WHERE id = ?',
                [activeSession.id]
            );
            
            if (updatedSession) {
                sessionStore.setActiveSession({
                    ...activeSession,
                    total_distance_km: updatedSession.total_distance_km,
                    total_active_seconds: updatedSession.total_active_seconds,
                    total_idle_seconds: updatedSession.total_idle_seconds,
                    status: updatedSession.status,
                });
            }
        }
        
        // 5. Cleanup Policy: After successful sync, run local storage cleanup
        await cleanupSyncedData();

        useTrackingStore.getState().setLastSyncTime(Date.now());
        console.log('Sync completed.');
        return true;
    } catch(e: any) {
        if (e.message === 'OFFLINE') {
            console.log('[Sync] Device is offline, skipping.');
            throw e; 
        }
        console.error('Full sync process failed:', e);
        return false;
    }
}
