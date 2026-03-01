const { Pool } = require('pg');
const net = require('net');
require('dotenv').config();

const cloudPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=Asia/Manila',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

const localPool = new Pool({
  connectionString: process.env.LOCAL_DB_URL,
  options: '-c timezone=Asia/Manila',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

cloudPool.on('error', (err) => {
  console.error('[DB] Cloud pool connection error:', err.message);
});

localPool.on('error', (err) => {
  console.error('[DB] Local pool connection error:', err.message);
});

let usingCloud = true;
let isSyncing = false;

const checkConnectionQuality = () => {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(2000);

    socket.on('connect', () => {
      const latency = Date.now() - start;
      socket.destroy();
      resolve(latency > 1500 ? 'slow' : 'good');
    });

    socket.on('timeout', () => { socket.destroy(); resolve('offline'); });
    socket.on('error', () => { socket.destroy(); resolve('offline'); });

    socket.connect(443, '8.8.8.8');
  });
};

const getPool = () => usingCloud ? cloudPool : localPool;

const syncLocalToCloud = async () => {
  if (isSyncing) return;
  isSyncing = true;

  let localClient, cloudClient;

  try {
    localClient = await localPool.connect();
    cloudClient = await cloudPool.connect();

    const { rows: pending } = await localClient.query(
      `SELECT * FROM sync_queue WHERE synced = FALSE ORDER BY created_at ASC LIMIT 200`
    );

    if (pending.length === 0) return;

    console.log(`[Sync] Syncing ${pending.length} record(s) to Render...`);

    for (const entry of pending) {
      try {
        const { table_name, operation, payload, record_id } = entry;
        const data = payload;
        const columns = Object.keys(data);
        const values = Object.values(data);
        const pkCol = columns[0];

        if (operation === 'INSERT') {
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          await cloudClient.query(
            `INSERT INTO "${table_name}" (${columns.map(c => `"${c}"`).join(', ')})
             VALUES (${placeholders})
             ON CONFLICT DO NOTHING`,
            values
          );
        } else if (operation === 'UPDATE') {
          const updateCols = columns.slice(1);
          const updateVals = values.slice(1);
          const updateSet = updateCols.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
          await cloudClient.query(
            `UPDATE "${table_name}" SET ${updateSet} WHERE "${pkCol}" = $${updateCols.length + 1}`,
            [...updateVals, record_id]
          );
        } else if (operation === 'DELETE') {
          await cloudClient.query(
            `DELETE FROM "${table_name}" WHERE "${pkCol}" = $1`,
            [record_id]
          );
        }

        await localClient.query(
          `UPDATE sync_queue SET synced = TRUE, synced_at = NOW() WHERE id = $1`,
          [entry.id]
        );
      } catch (err) {
        console.error(`[Sync] Failed on queue id ${entry.id}:`, err.message);
      }
    }

    console.log('[Sync] Sync to Render complete.');
  } catch (err) {
    console.error('[Sync] Sync error:', err.message);
  } finally {
    isSyncing = false;
    if (localClient) localClient.release();
    if (cloudClient) cloudClient.release();
  }
};

const monitorConnection = async () => {
  try {
    const quality = await checkConnectionQuality();

    if (quality === 'good' && !usingCloud) {
      try {
        await cloudPool.query('SELECT 1');
        usingCloud = true;
        console.log('[DB] Connection good — switched back to Render (cloud).');
        await syncLocalToCloud();
      } catch {
        console.log('[DB] Render unreachable — staying on local.');
      }
    } else if (quality === 'slow' && usingCloud) {
      usingCloud = false;
      console.log('[DB] Slow connection detected — switched to local PostgreSQL.');
    } else if (quality === 'offline' && usingCloud) {
      usingCloud = false;
      console.log('[DB] Internet lost — switched to local PostgreSQL (offline mode).');
    } else if (quality === 'good') {
      await syncLocalToCloud();
    }
  } catch (err) {
    console.error('[DB] Monitor error:', err.message);
  }
};

const initDB = async () => {
  const quality = await checkConnectionQuality();

  if (quality === 'good') {
    try {
      await cloudPool.query('SELECT 1');
      usingCloud = true;
      console.log('[DB] Connected to Render (cloud) database.');
    } catch {
      usingCloud = false;
      console.log('[DB] Render unreachable — starting on local PostgreSQL.');
    }
  } else {
    usingCloud = false;
    console.log(quality === 'slow'
      ? '[DB] Slow connection — starting on local PostgreSQL.'
      : '[DB] No internet — starting on local PostgreSQL (offline mode).'
    );
  }

  setInterval(monitorConnection, 10_000);
};

module.exports = { getPool, initDB };