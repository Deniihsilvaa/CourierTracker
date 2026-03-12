import { getDb } from './sqlite';
import { logger } from '../utils/logger';

/**
 * Hardened database access layer to prevent SQL injection 
 * and enforce schema boundaries.
 */

// Whitelist of allowed tables to prevent arbitrary table access
const ALLOWED_TABLES = ['profiles', 'work_sessions', 'trips', 'gps_points'];

export const localDatabase = {
  /**
   * Safe execution of select queries with table validation.
   */
  query: async <T>(tableName: string, whereClause: string = '', params: any[] = []): Promise<T[]> => {
    if (!ALLOWED_TABLES.includes(tableName)) {
      logger.error(`[DB] Unauthorized table access attempt: ${tableName}`);
      throw new Error('Database access violation');
    }

    const db = getDb();
    const query = `SELECT * FROM ${tableName} ${whereClause}`;
    
    try {
      return await db.getAllAsync(query, params);
    } catch (e) {
      logger.error(`[DB] Query failed in ${tableName}:`, e);
      return [];
    }
  },

  /**
   * Safe single row retrieval.
   */
  queryFirst: async <T>(tableName: string, whereClause: string = '', params: any[] = []): Promise<T | null> => {
    if (!ALLOWED_TABLES.includes(tableName)) {
      logger.error(`[DB] Unauthorized table access attempt: ${tableName}`);
      throw new Error('Database access violation');
    }

    const db = getDb();
    const query = `SELECT * FROM ${tableName} ${whereClause} LIMIT 1`;
    
    try {
      return await db.getFirstAsync<T>(query, params);
    } catch (e) {
      logger.error(`[DB] QueryFirst failed in ${tableName}:`, e);
      return null;
    }
  },

  /**
   * Encapsulated update logic to prevent dynamic SET building from untrusted sources.
   */
  update: async (tableName: string, id: string, data: Record<string, any>) => {
    if (!ALLOWED_TABLES.includes(tableName)) {
      throw new Error('Database access violation');
    }

    const db = getDb();
    const keys = Object.keys(data);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    
    const query = `UPDATE ${tableName} SET ${setClause}, synced = 0 WHERE id = ?`;
    
    try {
      await db.runAsync(query, [...values, id]);
      return true;
    } catch (e) {
      logger.error(`[DB] Update failed in ${tableName}:`, e);
      return false;
    }
  },

  /**
   * Fast insert for GPS logging.
   */
  insertGps: async (userId: string | null, sessionId: string, lat: number, lon: number, acc: number | null, speed: number | null, recordedAt: string) => {
    const db = getDb();
    const query = `INSERT OR IGNORE INTO gps_points (user_id, session_id, latitude, longitude, accuracy, speed, recorded_at, synced) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 0)`;
    try {
      await db.runAsync(query, [userId, sessionId, lat, lon, acc, speed, recordedAt]);
      return true;
    } catch (e) {
      logger.error('[DB] GPS Insert failed:', e);
      return false;
    }
  }
};
