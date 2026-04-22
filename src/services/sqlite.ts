import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;
let isInitialized = false;

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('rota_pro.db');
  }
  return dbInstance;
};

// Initialize the database tables
const CURRENT_DB_VERSION = 7;

/**
 * Initializes the database.
 * @param forceReset - Whether to force a database reset.
 */
export const initDb = async (forceReset = false) => {
  if (initPromise) {
    await initPromise;
    if (!forceReset) return;
  }

  if (isInitialized && !forceReset) {
    return;
  }

  initPromise = (async () => {
    const db = getDb();

    if (forceReset) {
      console.log('[Storage] FORCING DATABASE RESET...');
      await db.execAsync(`
        DROP TABLE IF EXISTS gps_points;
        DROP TABLE IF EXISTS trips;
        DROP TABLE IF EXISTS work_sessions;
        DROP TABLE IF EXISTS profiles;
        DROP TABLE IF EXISTS log_system;
        DROP TABLE IF EXISTS route_events;
        DROP TABLE IF EXISTS tracking_sessions;
        DROP TABLE IF EXISTS route_segments;
        DROP TABLE IF EXISTS analytics_sessions;
        DROP TABLE IF EXISTS category_types;
        DROP TABLE IF EXISTS expenses;
        DROP TABLE IF EXISTS incomes;
        DROP TABLE IF EXISTS fuel_logs;
        DROP TABLE IF EXISTS maintenance_logs;
        DROP TABLE IF EXISTS manual_routes;
        DROP TABLE IF EXISTS clients;
        PRAGMA user_version = 0;
      `);
    }

    try {
      // Enable WAL mode and optimized settings
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA synchronous = NORMAL;
        PRAGMA wal_autocheckpoint = 1000;
      `);

      const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
      const currentVersion = result?.user_version ?? 0;

      if (currentVersion < CURRENT_DB_VERSION) {
        console.log(`[Storage] Migrating database from version ${currentVersion} to ${CURRENT_DB_VERSION}...`);

        await db.withTransactionAsync(async () => {
          // --- 1. CREATE CORE TABLES (If they don't exist) ---
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

            CREATE TABLE IF NOT EXISTS tracking_sessions (
              id TEXT PRIMARY KEY,
              user_id TEXT NOT NULL,
              started_at TEXT NOT NULL,
              ended_at TEXT,
              status TEXT DEFAULT 'active',
              synced INTEGER DEFAULT 0
            );

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

            CREATE TABLE IF NOT EXISTS analytics_sessions (
              id TEXT PRIMARY KEY,
              session_id TEXT NOT NULL,
              metrics_json TEXT,
              generated_at TEXT,
              synced INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS log_system (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              message TEXT,
              level TEXT,
              data TEXT,
              meta_dados TEXT,
              synced INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS category_types (
              id TEXT PRIMARY KEY,
              user_id TEXT,
              name TEXT,
              description TEXT,
              type TEXT,
              synced INTEGER DEFAULT 0
            );

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

            CREATE TABLE IF NOT EXISTS clients (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              address TEXT NOT NULL,
              phone TEXT,
              latitude REAL,
              longitude REAL,
              client_type TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT,
              deleted_at TEXT,
              synced INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS manual_routes (
              id TEXT PRIMARY KEY,
              session_id TEXT,
              client_id TEXT,
              pickup_location TEXT NOT NULL,
              pickup_lat REAL,
              pickup_lng REAL,
              delivery_location TEXT,
              delivery_lat REAL,
              delivery_lng REAL,
              value REAL,
              driver_start_lat REAL,
              driver_start_lng REAL,
              driver_start_at TEXT,
              pickup_arrived_lat REAL,
              pickup_arrived_lng REAL,
              pickup_arrived_at TEXT,
              delivery_arrived_lat REAL,
              delivery_arrived_lng REAL,
              delivery_arrived_at TEXT,
              driver_to_pickup_km REAL,
              pickup_to_delivery_km REAL,
              estimated_duration_minutes REAL,
              route_geometry TEXT,
              route_status TEXT DEFAULT 'pending',
              payment_required INTEGER DEFAULT 1,
              payment_status TEXT DEFAULT 'pending',
              payment_received_at TEXT,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT,
              deleted_at TEXT,
              synced INTEGER DEFAULT 0
            );
          `);

          // --- 2. RUN SCHEMA EVOLUTION ---
          const tablesToMigrate = [
            'profiles', 'work_sessions', 'trips', 'route_events',
            'expenses', 'incomes', 'fuel_logs', 'maintenance_logs', 'category_types',
            'gps_points', 'tracking_sessions', 'route_segments', 'analytics_sessions', 'manual_routes', 'clients'
          ];

          for (const table of tablesToMigrate) {
            try {
              const columnInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
              const existingColumns = columnInfo.map(c => c.name);

              // Add missing core columns
              if (!existingColumns.includes('synced')) {
                await db.execAsync(`ALTER TABLE ${table} ADD COLUMN synced INTEGER DEFAULT 0;`);
              }
              if (!existingColumns.includes('created_at')) {
                await db.execAsync(`ALTER TABLE ${table} ADD COLUMN created_at TEXT DEFAULT CURRENT_TIMESTAMP;`);
              }
              if (!existingColumns.includes('updated_at')) {
                await db.execAsync(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT;`);
              }
              
              // Add deleted_at to all tables except system logs and raw gps points
              const needsSoftDelete = table !== 'log_system' && table !== 'gps_points';
              if (needsSoftDelete && !existingColumns.includes('deleted_at')) {
                await db.execAsync(`ALTER TABLE ${table} ADD COLUMN deleted_at TEXT;`);
                console.log(`[Storage] Added missing deleted_at column to ${table}`);
              }

              // Entity-specific evolutions
              if (table === 'manual_routes') {
                if (!existingColumns.includes('driver_start_lat')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN driver_start_lat REAL;`);
                if (!existingColumns.includes('driver_start_lng')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN driver_start_lng REAL;`);
                if (!existingColumns.includes('driver_start_at')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN driver_start_at TEXT;`);
                if (!existingColumns.includes('pickup_arrived_lat')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN pickup_arrived_lat REAL;`);
                if (!existingColumns.includes('pickup_arrived_lng')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN pickup_arrived_lng REAL;`);
                if (!existingColumns.includes('pickup_arrived_at')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN pickup_arrived_at TEXT;`);
                if (!existingColumns.includes('delivery_arrived_lat')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN delivery_arrived_lat REAL;`);
                if (!existingColumns.includes('delivery_arrived_lng')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN delivery_arrived_lng REAL;`);
                if (!existingColumns.includes('delivery_arrived_at')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN delivery_arrived_at TEXT;`);
                if (!existingColumns.includes('driver_to_pickup_km')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN driver_to_pickup_km REAL;`);
                if (!existingColumns.includes('pickup_to_delivery_km')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN pickup_to_delivery_km REAL;`);
                if (!existingColumns.includes('estimated_duration_minutes')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN estimated_duration_minutes REAL;`);
                if (!existingColumns.includes('route_geometry')) await db.execAsync(`ALTER TABLE manual_routes ADD COLUMN route_geometry TEXT;`);
              }

              if (table === 'work_sessions') {
                if (!existingColumns.includes('start_odometer')) await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN start_odometer TEXT;`);
                if (!existingColumns.includes('end_odometer')) await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN end_odometer TEXT;`);
                if (!existingColumns.includes('total_distance_km')) await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN total_distance_km REAL DEFAULT 0.0;`);
                if (!existingColumns.includes('total_active_seconds')) await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN total_active_seconds INTEGER DEFAULT 0;`);
                if (!existingColumns.includes('total_idle_seconds')) await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN total_idle_seconds INTEGER DEFAULT 0;`);
              }

              if (table === 'profiles') {
                if (!existingColumns.includes('full_name')) await db.execAsync(`ALTER TABLE profiles ADD COLUMN full_name TEXT;`);
                if (!existingColumns.includes('vehicle_type')) await db.execAsync(`ALTER TABLE profiles ADD COLUMN vehicle_type TEXT;`);
                if (!existingColumns.includes('city')) await db.execAsync(`ALTER TABLE profiles ADD COLUMN city TEXT;`);
              }

              if (table === 'clients') {
                if (!existingColumns.includes('client_type')) await db.execAsync(`ALTER TABLE clients ADD COLUMN client_type TEXT;`);
              }
            } catch (tableError) {
              console.error(`[Storage] Failed to migrate table ${table}:`, tableError);
            }
          }

          // --- 3. CREATE INDICES (Optimized) ---
          await db.execAsync(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_gps_dedup ON gps_points (session_id, recorded_at);
            CREATE INDEX IF NOT EXISTS idx_gps_points_session ON gps_points(session_id);
            CREATE INDEX IF NOT EXISTS idx_route_events_session ON route_events(session_id);
            CREATE INDEX IF NOT EXISTS idx_route_events_time ON route_events(created_at);
            CREATE INDEX IF NOT EXISTS idx_log_system_synced ON log_system (synced, created_at);
            CREATE INDEX IF NOT EXISTS idx_routes_session ON manual_routes (session_id);
            CREATE INDEX IF NOT EXISTS idx_clients_search ON clients(name, address, phone);
            
            CREATE INDEX IF NOT EXISTS idx_work_sessions_synced ON work_sessions(synced);
            CREATE INDEX IF NOT EXISTS idx_trips_synced ON trips(synced);
            CREATE INDEX IF NOT EXISTS idx_gps_points_synced ON gps_points(synced);
            CREATE INDEX IF NOT EXISTS idx_route_events_synced ON route_events(synced);
            CREATE INDEX IF NOT EXISTS idx_expenses_synced ON expenses(synced);
            CREATE INDEX IF NOT EXISTS idx_incomes_synced ON incomes(synced);
            CREATE INDEX IF NOT EXISTS idx_fuel_logs_synced ON fuel_logs(synced);
            CREATE INDEX IF NOT EXISTS idx_maintenance_logs_synced ON maintenance_logs(synced);
            CREATE INDEX IF NOT EXISTS idx_manual_routes_synced ON manual_routes(synced);
          `);

          // Set the final version
          await db.execAsync(`PRAGMA user_version = ${CURRENT_DB_VERSION};`);
        });
      }

      // --- 4. FAIL-SAFE INTEGRITY CHECK ---
      // Explicitly ensure work_sessions has deleted_at (most common failure point)
      try {
        const checkColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(work_sessions)`);
        const colNames = checkColumns.map(c => c.name);
        if (!colNames.includes('deleted_at')) {
          console.warn('[Storage] FAIL-SAFE: work_sessions missing deleted_at, adding now...');
          await db.execAsync(`ALTER TABLE work_sessions ADD COLUMN deleted_at TEXT;`);
        }
      } catch (checkErr) {
        console.error('[Storage] Fail-safe check failed:', checkErr);
      }

      console.log('[Storage] Local database initialized successfully.');
      isInitialized = true;
    } catch (error) {
      isInitialized = false;
      console.error('Error initializing database:', error);
      throw error;
    }
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
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
      'incomes', 'fuel_logs', 'maintenance_logs', 'category_types', 'clients', 'manual_routes'
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
