import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('courier_tracker.db');
  }
  return dbInstance;
};

// Initialize the database tables
/**
 * Initializes the database.
 * @param forceReset - Whether to force a database reset.
 */
export const initDb = async (forceReset = false) => {
  const db = getDb();

  if (forceReset) {
    console.log('[Storage] FORCING DATABASE RESET...');
    await db.execAsync(`
      DROP TABLE IF EXISTS gps_points;
      DROP TABLE IF EXISTS trips;
      DROP TABLE IF EXISTS work_sessions;
      DROP TABLE IF EXISTS profiles;
      DROP TABLE IF EXISTS log_system;
    `);
  }

  try {
    // Enable WAL mode and optimized settings
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await db.execAsync(`PRAGMA foreign_keys = ON;`);
    await db.execAsync(`PRAGMA synchronous = NORMAL;`);
    await db.execAsync(`PRAGMA wal_autocheckpoint = 1000;`);

    await db.withTransactionAsync(async () => {
      // --- 1. CREATE CORE TABLES ---

      // Profiles
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          name TEXT,
          full_name TEXT,
          email TEXT,
          vehicle_type TEXT,
          city TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);

      // Work Sessions
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS work_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          start_odometer TEXT,
          end_odometer TEXT,
          total_distance_km REAL DEFAULT 0.0,
          total_active_seconds INTEGER DEFAULT 0,
          total_idle_seconds INTEGER DEFAULT 0,
          status TEXT DEFAULT 'open',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT,
          deleted_at TEXT,
          synced INTEGER DEFAULT 0
        );
      `);


      // Trips
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          user_id TEXT,
          start_time TEXT,
          end_time TEXT,
          start_latitude REAL,
          start_longitude REAL,
          end_latitude REAL,
          end_longitude REAL,
          distance_km REAL DEFAULT 0.0,
          duration_seconds INTEGER,
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);

      // GPS Points
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS gps_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT,
          session_id TEXT,
          trip_id TEXT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          accuracy REAL,
          speed REAL,
          recorded_at TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);

      // Route Events
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS route_events (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          session_id TEXT,
          event_type TEXT,
          latitude REAL,
          longitude REAL,
          created_at TEXT,
          metadata TEXT,
          synced INTEGER DEFAULT 0
        );
      `);

      // Tracking Sessions
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS tracking_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          status TEXT DEFAULT 'active',
          synced INTEGER DEFAULT 0
        );
      `);

      // Route Segments
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS route_segments (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          segment_type TEXT,
          started_at TEXT,
          ended_at TEXT,
          distance_km REAL,
          duration_seconds INTEGER,
          metadata TEXT,
          synced INTEGER DEFAULT 0
        );
      `);

      // Analytics Sessions
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS analytics_sessions (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          metrics_json TEXT,
          generated_at TEXT,
          synced INTEGER DEFAULT 0
        );
      `);

      // Log System
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS log_system (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          message TEXT,
          level TEXT,
          data TEXT,
          meta_dados TEXT,
          synced INTEGER DEFAULT 0
        );
      `);

      // Category Types
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS category_types (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          name TEXT,
          description TEXT,
          type TEXT,
          synced INTEGER DEFAULT 0
        );
      `);

      // Expenses
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          session_id TEXT,
          amount REAL,
          category_id TEXT,
          description TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);

      // Incomes
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS incomes (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          session_id TEXT,
          amount REAL,
          source TEXT,
          description TEXT,
          category_id TEXT,
          date_competition TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);

      // Fuel Logs
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS fuel_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          session_id TEXT,
          amount REAL,
          liters TEXT,
          price_per_liter REAL,
          odometer TEXT,
          description TEXT,
          gas_station TEXT,
          date_competition TEXT,
          type TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);

      // Maintenance Logs
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS maintenance_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          type TEXT,
          amount REAL,
          odometer TEXT,
          description TEXT,
          date_m TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced INTEGER DEFAULT 0
        );
      `);

      // Manual Routes
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS manual_routes (
          id TEXT PRIMARY KEY,
          pickup_location TEXT NOT NULL,
          delivery_location TEXT NOT NULL,
          value REAL NOT NULL,
          distance_km REAL,
          status TEXT DEFAULT 'pending',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT,
          deleted_at TEXT,
          synced INTEGER DEFAULT 0
        );
      `);
    });

    // --- 2. RUN MIGRATIONS (Ensure all columns exist) ---
    // These run OUTSIDE the main transaction to prevent rollback on duplicate column errors

    const tablesToMigrate = [
      'profiles', 'work_sessions', 'trips', 'route_events',
      'expenses', 'incomes', 'fuel_logs', 'maintenance_logs', 'category_types',
      'gps_points', 'tracking_sessions', 'route_segments', 'analytics_sessions', 'manual_routes'
    ];

    for (const table of tablesToMigrate) {
      // Basic sync columns
      try { await db.execAsync(`ALTER TABLE ${table} ADD COLUMN synced INTEGER DEFAULT 0;`); } catch (e) { }
      try { await db.execAsync(`ALTER TABLE ${table} ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`); } catch (e) { }
      try { await db.execAsync(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT;`); } catch (e) { }

      // Soft delete column (except log_system and gps_points as per localDatabase.ts logic)
      if (table !== 'log_system' && table !== 'gps_points') {
        try { await db.execAsync(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT;`); } catch (e) { }
      }
    }

    // Specific columns for work_sessions
    try { await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN start_odometer TEXT;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN end_odometer TEXT;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN total_distance_km REAL DEFAULT 0.0;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN total_active_seconds INTEGER DEFAULT 0;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN total_idle_seconds INTEGER DEFAULT 0;`); } catch (e) { }

    // Specific columns for profiles
    try { await db.execAsync(`ALTER TABLE profiles ADD COLUMN full_name TEXT;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE profiles ADD COLUMN vehicle_type TEXT;`); } catch (e) { }
    try { await db.execAsync(`ALTER TABLE profiles ADD COLUMN city TEXT;`); } catch (e) { }

    // Indices
    try { await db.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS idx_gps_dedup ON gps_points (session_id, recorded_at);`); } catch (e) { }
    try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_gps_points_session ON gps_points(session_id);`); } catch (e) { }
    try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_route_events_session ON route_events(session_id);`); } catch (e) { }
    try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_route_events_time ON route_events(created_at);`); } catch (e) { }
    try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_log_system_synced ON log_system (synced, created_at);`); } catch (e) { }

    // Performance: Synced indexes
    const syncIndexTables = [
      'work_sessions', 'trips', 'gps_points', 'route_events',
      'expenses', 'incomes', 'fuel_logs', 'maintenance_logs', 'manual_routes'
    ];
    for (const table of syncIndexTables) {
      try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_${table}_synced ON ${table}(synced);`); } catch (e) { }
    }

    console.log('[Storage] Local database initialized successfully.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

/**
 * Retention Policy: Remove synced GPS data older than 7 days 
 * to keep the local database small and fast.
 */
export const cleanupSyncedData = async () => {
  const db = getDb();
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoDate = sevenDaysAgo.toISOString();

    // Delete synced gps points older than 7 days
    await db.runAsync(
      'DELETE FROM gps_points WHERE synced = 1 AND recorded_at < ?',
      [isoDate]
    );

    // Delete synced logs older than 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const logsIso = fourteenDaysAgo.toISOString();
    await db.runAsync(
      'DELETE FROM log_system WHERE synced = 1 AND created_at < ?',
      [logsIso]
    );

    // Delete synced and soft-deleted records (no longer needed locally)
    const tablesWithSoftDelete = [
      'work_sessions', 'trips', 'route_events', 'expenses',
      'incomes', 'fuel_logs', 'maintenance_logs', 'category_types'
    ];
    for (const table of tablesWithSoftDelete) {
      await db.runAsync(
        `DELETE FROM ${table} WHERE synced = 1 AND deleted_at IS NOT NULL`
      );
    }

    // Delete synced route events and segments older than 14 days
    await db.runAsync(
      'DELETE FROM route_events WHERE synced = 1 AND created_at < ?',
      [logsIso]
    );
    await db.runAsync(
      'DELETE FROM route_segments WHERE synced = 1 AND created_at < ?',
      [logsIso]
    );

    console.log(`[Storage] Cleanup completed. Removed old synced and deleted data.`);
    return true;
  } catch (e) {
    console.error('[Storage] Cleanup failed:', e);
    return false;
  }
};
