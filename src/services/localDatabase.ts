// Low-level database operations should use console directly to avoid cycles with logSystem
import { v4 as uuidv4 } from 'uuid';
import { getDb } from './sqlite';

/**
 * Modern, Generic Offline-First Database Layer
 */

const ALLOWED_TABLES = [
  'profiles',
  'work_sessions',
  'trips',
  'gps_points',
  'route_events',
  'log_system',
  'category_types',
  'expenses',
  'incomes',
  'fuel_logs',
  'maintenance_logs',
  'manual_routes'
] as const;

type TableName = typeof ALLOWED_TABLES[number];

export const localDatabase = {
  /**
   * Generic query for multiple rows
   */
  async list<T>(tableName: TableName, where: string = '', params: any[] = []): Promise<T[]> {
    const db = getDb();
    
    // Auto filter soft-deleted except for log_system (doesn't have the column)
    let effectiveWhere = where;
    const hasDeletedAt = tableName !== 'log_system' && tableName !== 'gps_points';
    
    if (hasDeletedAt) {
      if (!where.trim()) {
        effectiveWhere = 'WHERE deleted_at IS NULL';
      } else if (!where.toUpperCase().includes('DELETED_AT')) {
        effectiveWhere = `${where} AND deleted_at IS NULL`;
      }
    }

    const query = `SELECT * FROM ${tableName} ${effectiveWhere}`;
    try {
      return await db.getAllAsync<T>(query, params);
    } catch (e) {
      console.error(`[DB] List failed in ${tableName}:`, e);
      return [];
    }
  },

  /**
   * Alias for list for backward compatibility
   */
  async query<T>(tableName: TableName, where: string = '', params: any[] = []): Promise<T[]> {
    return this.list<T>(tableName, where, params);
  },

  /**
   * Generic query for a single row
   */
  async find<T>(tableName: TableName, where: string = '', params: any[] = []): Promise<T | null> {
    const db = getDb();
    const query = `SELECT * FROM ${tableName} ${where} LIMIT 1`;
    try {
      return await db.getFirstAsync<T>(query, params);
    } catch (e) {
      console.error(`[DB] Find failed in ${tableName}:`, e);
      return null;
    }
  },

  /**
   * Alias for find for backward compatibility
   */
  async queryFirst<T>(tableName: TableName, where: string = '', params: any[] = []): Promise<T | null> {
    return this.find<T>(tableName, where, params);
  },

  /**
   * Generic Insert (Always Offline-First)
   */
  async insert<T extends Record<string, any>>(tableName: TableName, data: T): Promise<string> {
    const db = getDb();

    // For log_system, we let SQLite handle the INTEGER AUTOINCREMENT ID
    const isLogSystem = tableName === 'log_system';
    const id = isLogSystem ? undefined : (data.id || uuidv4());

    const entry = {
      ...data,
      ...(id ? { id } : {}),
      synced: (data as any).synced ?? 0,
      created_at: (data as any).created_at || new Date().toISOString().split('.')[0] + 'Z'
    };

    const keys = Object.keys(entry);
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(entry);

    const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;

    try {
      const result = await db.runAsync(query, values);
      return id || String(result.lastInsertRowId);
    } catch (e) {
      console.error(`[DB] Insert failed in ${tableName}:`, e);
      throw e;
    }
  },

  /**
   * Specific Insert for Work Session (legacy support)
   */
  async insertWorkSession(id: string, userId: string, startTime: string, synced: number, startOdometer?: number): Promise<string> {
    return this.insert('work_sessions', {
      id,
      user_id: userId,
      start_time: startTime.includes('.') ? startTime.split('.')[0] + 'Z' : startTime,
      synced: Number(synced),
      start_odometer: (startOdometer !== undefined && startOdometer !== null) ? String(startOdometer) : null,
      status: 'open'
    });
  },

  /**
   * Specific Insert for Log System (legacy support)
   */
  async insertLogSystem(level: string, message: string, data: any, meta: any): Promise<string> {
    const logEntry = {
      level,
      message,
      data: data ? JSON.stringify(data) : null,
      meta_dados: meta ? JSON.stringify(meta) : null
    };
    return this.insert('log_system', logEntry as any);
  },

  /**
   * Generic Update
   */
  async update(tableName: TableName, id: string, data: Record<string, any>): Promise<void> {
    const db = getDb();
    const keys = Object.keys(data);
    const now = new Date().toISOString().split('.')[0] + 'Z';
    
    // Add updated_at if not present
    const updatedData = { 
      ...data, 
      updated_at: now,
      synced: 0 
    };
    
    const updatedKeys = Object.keys(updatedData);
    const setClause = updatedKeys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(updatedData);

    const query = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;

    try {
      await db.runAsync(query, [...values, id]);
    } catch (e) {
      console.error(`[DB] Update failed in ${tableName}:`, e);
      throw e;
    }
  },

  /**
   * Generic Delete
   */
  async delete(tableName: TableName, id: string): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString().split('.')[0] + 'Z';
    
    // Log system uses INTEGER IDs and usually doesn't need soft delete
    if (tableName === 'log_system') {
      const query = `DELETE FROM ${tableName} WHERE id = ?`;
      try {
        await db.runAsync(query, [id]);
        return;
      } catch (e) {
        console.error(`[DB] Log delete failed:`, e);
        throw e;
      }
    }
    if (tableName === 'gps_points') {
      const query = `DELETE FROM ${tableName} WHERE session_id = ?`;
      try {
        await db.runAsync(query, [id]);
        return;
      } catch (e) {
        console.error(`[DB] GPS points delete failed:`, e);
        throw e;
      }
    }
    if (tableName === 'work_sessions') {
      const query = `DELETE FROM ${tableName} WHERE id = ?`;
      try {
        await db.runAsync(query, [id]);
        return;
      } catch (e) {
        console.error(`[DB] Work sessions delete failed:`, e);
        throw e;
      }
    }

    // SOFT DELETE: Marking as deleted and unsynced so the deletion can sync
    const query = `UPDATE ${tableName} SET deleted_at = ?, synced = 0 WHERE id = ?`;
    try {
      await db.runAsync(query, [now, id]);
    } catch (e) {
      console.error(`[DB] Soft delete failed in ${tableName}:`, e);
      throw e;
    }
  }
};
