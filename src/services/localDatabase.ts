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
  'maintenance_logs'
] as const;

type TableName = typeof ALLOWED_TABLES[number];

export const localDatabase = {
  /**
   * Generic query for multiple rows
   */
  async list<T>(tableName: TableName, where: string = '', params: any[] = []): Promise<T[]> {
    const db = getDb();
    const query = `SELECT * FROM ${tableName} ${where}`;
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
  async insert<T extends { id?: string }>(tableName: TableName, data: T): Promise<string> {
    const db = getDb();

    // For log_system, we let SQLite handle the INTEGER AUTOINCREMENT ID
    const isLogSystem = tableName === 'log_system';
    const id = isLogSystem ? undefined : (data.id || uuidv4());

    const entry = {
      ...data,
      ...(id ? { id } : {}),
      synced: (data as any).synced ?? 0,
      created_at: (data as any).created_at || new Date().toISOString()
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
      start_time: startTime,
      synced: Number(synced),
      start_odometer: startOdometer ? String(startOdometer) : "0",
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
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);

    const query = `UPDATE ${tableName} SET ${setClause}, synced = 0 WHERE id = ?`;

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
    const query = `DELETE FROM ${tableName} WHERE id = ?`;
    try {
      await db.runAsync(query, [id]);
    } catch (e) {
      console.error(`[DB] Delete failed in ${tableName}:`, e);
      throw e;
    }
  }
};
