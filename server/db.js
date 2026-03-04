const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const QUEUE_FILE = path.join(__dirname, 'write_queue.json');
const CACHE_TTL_MS = 5 * 60 * 1000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=Asia/Manila',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

let isOnline = false;
let isFlushing = false;

pool.on('error', (err) => {
  console.error('[DB] Pool error (handled):', err.message);
  isOnline = false;
});

process.on('uncaughtException', (err) => {
  const isNetErr = err.message && (
    err.message.includes('ENOTFOUND') ||
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('Connection terminated') ||
    err.message.includes('timeout')
  );
  if (isNetErr) {
    console.error('[DB] Network error caught (handled):', err.message);
    isOnline = false;
  } else {
    console.error('[DB] Uncaught exception:', err.message);
  }
});

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  const isNetErr = msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') ||
    msg.includes('Connection terminated') || msg.includes('timeout');
  if (isNetErr) {
    console.error('[DB] Network rejection (handled):', msg);
    isOnline = false;
  } else {
    console.error('[DB] Unhandled rejection:', msg);
  }
});

const cache = {};

const setCache = (key, data) => {
  cache[key] = { data, ts: Date.now() };
};

const getCache = (key) => {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    delete cache[key];
    return null;
  }
  return entry.data;
};

const invalidateCache = (key) => {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach(k => delete cache[k]);
  }
};

const loadQueue = () => {
  try {
    if (fs.existsSync(QUEUE_FILE)) {
      const raw = fs.readFileSync(QUEUE_FILE, 'utf8');
      return JSON.parse(raw) || [];
    }
  } catch {
    console.error('[Queue] Failed to load write_queue.json, starting fresh.');
  }
  return [];
};

const saveQueue = (queue) => {
  try {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf8');
  } catch (err) {
    console.error('[Queue] Failed to save write_queue.json:', err.message);
  }
};

let writeQueue = loadQueue();

const enqueue = (operation) => {
  writeQueue.push({ ...operation, queuedAt: new Date().toISOString() });
  saveQueue(writeQueue);
  console.log(`[Queue] Queued operation on — ${writeQueue.length} pending`);
};

const flushQueue = async () => {
  if (isFlushing || writeQueue.length === 0) return;
  isFlushing = true;

  console.log(`[Queue] Flushing ${writeQueue.length} queued operation(s) to Render...`);

  const remaining = [];

  for (const op of writeQueue) {
    try {
      if (op.type === 'query') {
        await pool.query(op.text, op.params);
      }
    } catch (err) {
      const isNetErr = err.message && (
        err.message.includes('ENOTFOUND') ||
        err.message.includes('ECONNREFUSED') ||
        err.message.includes('Connection terminated') ||
        err.message.includes('timeout')
      );
      if (isNetErr) {
        console.error('[Queue] Still offline, stopping flush.');
        remaining.push(...writeQueue.slice(writeQueue.indexOf(op)));
        break;
      }
      console.error('[Queue] Permanent failure, dropping operation:', err.message);
    }
  }

  writeQueue = remaining;
  saveQueue(writeQueue);

  if (remaining.length === 0) {
    console.log('[Queue] All queued operations flushed successfully.');
    invalidateCache();
  } else {
    console.log(`[Queue] ${remaining.length} operation(s) still pending.`);
  }

  isFlushing = false;
};

const isNetworkError = (err) => err.message && (
  err.message.includes('ENOTFOUND') ||
  err.message.includes('ECONNREFUSED') ||
  err.message.includes('Connection terminated') ||
  err.message.includes('timeout')
);

const dbQuery = async (text, params = [], cacheKey = null) => {
  if (cacheKey && !isOnline) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`[Cache] Offline — serving from cache: ${cacheKey}`);
      return { rows: cached, fromCache: true };
    }
  }

  try {
    const result = await pool.query(text, params);
    isOnline = true;
    if (cacheKey) setCache(cacheKey, result.rows);
    return result;
  } catch (err) {
    if (isNetworkError(err)) {
      isOnline = false;
      if (cacheKey) {
        const cached = getCache(cacheKey);
        if (cached) {
          console.log(`[Cache] DB offline — serving from cache: ${cacheKey}`);
          return { rows: cached, fromCache: true };
        }
      }
    }
    throw err;
  }
};

const dbWrite = async (text, params = [], invalidateCacheKey = null) => {
  try {
    const result = await pool.query(text, params);
    isOnline = true;
    if (invalidateCacheKey) invalidateCache(invalidateCacheKey);
    return result;
  } catch (err) {
    if (isNetworkError(err)) {
      isOnline = false;
      enqueue({ type: 'query', text, params });
      if (invalidateCacheKey) invalidateCache(invalidateCacheKey);
      return { rows: [], queued: true };
    }
    throw err;
  }
};

const getPool = () => ({
  query: (text, params) => dbQuery(text, params),
  connect: async () => {
    try {
      const client = await pool.connect();
      return client;
    } catch (err) {
      if (isNetworkError(err)) {
        isOnline = false;
        console.error('[DB] Cannot connect — offline.');
      }
      throw err;
    }
  }
});

const checkConnection = async () => {
  try {
    await pool.query('SELECT 1');
    if (!isOnline) {
      isOnline = true;
      console.log('[DB] Connection restored — flushing write queue...');
      await flushQueue();
    }
  } catch {
    if (isOnline) {
      isOnline = false;
      console.log('[DB] Connection lost — switching to cache mode.');
    }
  }
};

const initDB = async () => {
  try {
    await pool.query('SELECT 1');
    isOnline = true;
    console.log('[DB] Connected to Render (cloud) database.');

    if (writeQueue.length > 0) {
      console.log(`[Queue] Found ${writeQueue.length} queued operation(s) from previous session — flushing...`);
      await flushQueue();
    }
  } catch {
    isOnline = false;
    console.log('[DB] Render unreachable — starting in cache/offline mode.');
    if (writeQueue.length > 0) {
      console.log(`[Queue] ${writeQueue.length} operation(s) waiting to be flushed when online.`);
    }
  }

  setInterval(checkConnection, 15_000);
};

module.exports = { getPool, initDB, dbQuery, dbWrite, setCache, getCache, invalidateCache };