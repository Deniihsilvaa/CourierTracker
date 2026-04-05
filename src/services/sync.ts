import { useSessionStore } from '../modules/sessions/store';
import { useTrackingStore } from '../modules/tracking/store';
import { cleanupSyncedData, getDb } from './sqlite';
import { SyncPayload, syncService } from './sync.service';
import { logger } from '../utils/logger';

// Maximum rows per table in a single batch to avoid payload size issues
const BATCH_SIZE = 500;

/**
 * Prepares data from a specific local table for synchronization.
 */
const prepareTableData = async (db: any, localTableName: string) => {
    const unsyncedRows = await db.getAllAsync(`SELECT * FROM ${localTableName} WHERE synced = 0 LIMIT ${BATCH_SIZE}`);
    if (!unsyncedRows || unsyncedRows.length === 0) return null;

    const formattedData = unsyncedRows.map((row: any) => {
        const { synced, ...rest } = row;

        if (localTableName === 'profiles') {
            delete (rest as any).email;
            delete (rest as any).full_name;
        }

        if (localTableName === 'route_events') {
            try {
                rest.metadata = rest.metadata ? JSON.parse(rest.metadata) : null;
            } catch {
                rest.metadata = { parse_error: true, raw: String(rest.metadata) };
            }
        }

        if (localTableName === 'log_system') {
            try {
                rest.meta_dados = rest.meta_dados ? JSON.parse(rest.meta_dados) : null;
            } catch {
                rest.meta_dados = { parse_error: true, raw: String(rest.meta_dados) };
            }
        }

        if (localTableName === 'expenses') {
            return {
                ...rest,
                category: rest.category_id,
            };
        }

        if (localTableName === 'fuel_logs') {
            return {
                ...rest,
                "gas station": rest.gas_station,
            };
        }

        return rest;
    });

    return {
        rows: formattedData,
        ids: unsyncedRows.map((r: any) => r.id)
    };
};

/**
 * Updates the sync status of local records.
 */
const markAsSynced = async (db: any, table: string, ids: (string | number)[]) => {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    const query = `UPDATE ${table} SET synced = 1 WHERE id IN (${placeholders})`;
    await db.runAsync(query, ids);
};

export const runFullSync = async () => {
    const db = getDb();
    const sessionStore = useSessionStore.getState();
    const activeSession = sessionStore.activeSession;

    try {
        logger.info('[Sync] Starting full batch synchronization...');

        const tablesToSync = [
            'profiles',
            'work_sessions',
            'trips',
            'route_events',
            'gps_points',
            'category_types',
            'expenses',
            'incomes',
            'fuel_logs',
            'maintenance_logs',
            'clients'
        ];

        const payload: SyncPayload = {};
        const syncMap: { [key: string]: (string | number)[] } = {};

        for (const table of tablesToSync) {
            const result = await prepareTableData(db, table);
            if (result) {
                (payload as any)[table] = result.rows;
                syncMap[table] = result.ids;
            }
        }

        if (Object.keys(payload).length === 0) {
            logger.info('[Sync] No data to sync.');
            return true;
        }

        // Send everything in ONE request
        await syncService.syncBatch(payload);

        // Mark everything as synced in local DB
        for (const [table, ids] of Object.entries(syncMap)) {
            await markAsSynced(db, table, ids);
        }

        // Handle session state update if active
        if (activeSession) {
            const updatedSession = await db.getFirstAsync<any>(
                'SELECT * FROM work_sessions WHERE id = ? AND status = ?',
                [activeSession.id, 'open']
            );

            if (updatedSession) {
                sessionStore.setActiveSession({
                    ...activeSession,
                    total_distance_km: updatedSession.total_distance_km,
                    total_active_seconds: updatedSession.total_active_seconds,
                    total_idle_seconds: updatedSession.total_idle_seconds,
                    status: updatedSession.status as any,
                });
            }
        }

        await cleanupSyncedData();
        useTrackingStore.getState().setLastSyncTime(Date.now());
        logger.info('[Sync] Full batch sync completed successfully.');
        return true;
    } catch (e: any) {
        if (e.message?.includes('Network request failed') || e.code === 'NETWORK_ERROR') {
            logger.warn('[Sync] Device is offline, skipping.');
            return false;
        }
        logger.error('[Sync] Full sync process failed:', e);
        return false;
    }
}
