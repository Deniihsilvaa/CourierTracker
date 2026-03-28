import { useSessionStore } from '../modules/sessions/store';
import { useTrackingStore } from '../modules/tracking/store';
import { cleanupSyncedData, getDb } from './sqlite';
import { supabase } from './supabase';

// Helper to push unsynced items from a table
const syncTable = async (db: any, localTableName: string) => {
    try {
        // Increased batch size for scalability
        const BATCH_SIZE = 500;
        const unsyncedRows = await db.getAllAsync(`SELECT * FROM ${localTableName} WHERE synced = 0 LIMIT ${BATCH_SIZE}`);
        if (!unsyncedRows || unsyncedRows.length === 0) return { success: true, count: 0 };

        const remoteTableName = localTableName === 'category_types' ? 'categoryTypes' : localTableName;

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
                    start_odometer: rest.start_odometer,
                    end_odometer: rest.end_odometer,
                    created_at: rest.created_at
                };
            }

            if (localTableName === 'gps_points') {
                return {
                    user_id: rest.user_id,
                    session_id: rest.session_id,
                    trip_id: rest.trip_id || null,
                    latitude: rest.latitude,
                    longitude: rest.longitude,
                    speed: rest.speed,
                    accuracy: rest.accuracy,
                    recorded_at: rest.recorded_at
                };
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
            if (localTableName === 'route_events') {
                let metadata: any = null;
                try {
                    metadata = rest.metadata ? JSON.parse(rest.metadata) : null;
                } catch {
                    metadata = { parse_error: true, raw: String(rest.metadata) };
                }
                return {
                    id: rest.id,
                    user_id: rest.user_id,
                    session_id: rest.session_id,
                    event_type: rest.event_type,
                    latitude: rest.latitude,
                    longitude: rest.longitude,
                    created_at: rest.created_at,
                    metadata,
                };
            }
            if (localTableName === 'log_system') {
                let meta: any = null;
                try {
                    meta = rest.meta_dados ? JSON.parse(rest.meta_dados) : null;
                } catch {
                    meta = { parse_error: true, raw: String(rest.meta_dados) };
                }
                return {
                    id: rest.id,
                    created_at: rest.created_at,
                    level: rest.level,
                    message: rest.message,
                    data: rest.data,
                    meta_dados: meta,
                };
            }

            if (localTableName === 'category_types') {
                return {
                    id: rest.id,
                    user_id: rest.user_id,
                    name: rest.name,
                    description: rest.description,
                    type: rest.type
                };
            }

            if (localTableName === 'expenses') {
                return {
                    id: rest.id,
                    user_id: rest.user_id,
                    session_id: rest.session_id,
                    amount: rest.amount,
                    category: rest.category_id, // Map to Prisma column name
                    description: rest.description,
                    created_at: rest.created_at
                };
            }

            if (localTableName === 'incomes') {
                return {
                    id: rest.id,
                    user_id: rest.user_id,
                    session_id: rest.session_id,
                    amount: rest.amount,
                    source: rest.source,
                    description: rest.description,
                    category_id: rest.category_id,
                    date_competition: rest.date_competition,
                    created_at: rest.created_at
                };
            }

            if (localTableName === 'fuel_logs') {
                return {
                    id: rest.id,
                    user_id: rest.user_id,
                    session_id: rest.session_id,
                    amount: rest.amount,
                    liters: rest.liters,
                    price_per_liter: rest.price_per_liter,
                    odometer: rest.odometer,
                    description: rest.description,
                    "gas station": rest.gas_station, // DB column has a space
                    date_competition: rest.date_competition,
                    type: rest.type,
                    created_at: rest.created_at
                };
            }

            if (localTableName === 'maintenance_logs') {
                return {
                    id: rest.id,
                    user_id: rest.user_id,
                    type: rest.type,
                    amount: rest.amount,
                    odometer: rest.odometer,
                    description: rest.description,
                    date_m: rest.date_m,
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

        // 1️⃣ Tracking Sessions MUST be synced before any data that references them
        // const trackingSessionsOk = await syncTable(db, 'tracking_sessions');
        // if (!trackingSessionsOk.success) return false;

        const sessionsOk = await syncTable(db, 'work_sessions');
        if (!sessionsOk.success) return false;

        await syncTable(db, 'trips');

        // Route events should be synced before raw GPS points
        await syncTable(db, 'route_events');

        // GPS points can be many, so we loop up to 5 times to clear backlogs of up to 2500 points
        let gpsSyncs = 0;
        while (gpsSyncs < 5) {
            const res = await syncTable(db, 'gps_points');
            if (!res.success || res.count === 0) break;
            gpsSyncs++;
        }

        await syncTable(db, 'route_segments');
        await syncTable(db, 'analytics_sessions');
        await syncTable(db, 'log_system');

        // Sync Financial Data
        await syncTable(db, 'category_types');
        await syncTable(db, 'expenses');
        await syncTable(db, 'incomes');
        await syncTable(db, 'fuel_logs');
        await syncTable(db, 'maintenance_logs');

        if (activeSession) {
            const updatedSession = await db.getFirstAsync<any>(
                'SELECT * FROM work_sessions WHERE id = ? AND status = ?',
                [activeSession.id, 'open']
            );

            if (updatedSession) {
                const statusR = updatedSession.status ?? 'open';
                sessionStore.setActiveSession({
                    ...activeSession,
                    total_distance_km: updatedSession.total_distance_km,
                    total_active_seconds: updatedSession.total_active_seconds,
                    total_idle_seconds: updatedSession.total_idle_seconds,
                    status: statusR as any,
                });
            } else {
                // If not found as 'open', check if it was closed locally
                const checkClosed = await db.getFirstAsync<any>(
                    'SELECT status FROM work_sessions WHERE id = ?',
                    [activeSession.id]
                );
                if (checkClosed && checkClosed.status === 'closed') {
                    sessionStore.setActiveSession(null);
                }
            }
        }


        // 5. Cleanup Policy: After successful sync, run local storage cleanup
        await cleanupSyncedData();

        useTrackingStore.getState().setLastSyncTime(Date.now());
        console.log('Sync completed.');
        return true;
    } catch (e: any) {
        if (e.message === 'OFFLINE') {
            console.log('[Sync] Device is offline, skipping.');
            throw e;
        }
        console.error('Full sync process failed:', e);
        return false;
    }
}
