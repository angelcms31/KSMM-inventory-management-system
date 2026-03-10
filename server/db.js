const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const QUEUE_FILE = path.join(__dirname, 'write_queue.json');

const cloudPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  options: '-c timezone=Asia/Manila',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

const localPool = process.env.LOCAL_DATABASE_URL
  ? new Pool({
      connectionString: process.env.LOCAL_DATABASE_URL,
      options: '-c timezone=Asia/Manila',
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      max: 10
    })
  : null;

let activeSource = 'cloud';
let isFlushing = false;

cloudPool.on('error', (err) => console.error('[DB] Cloud pool error:', err.message));
if (localPool) localPool.on('error', (err) => console.error('[DB] Local pool error:', err.message));

process.on('uncaughtException', (err) => {
  if (isNetworkError(err)) console.error('[DB] Network error (handled):', err.message);
  else console.error('[DB] Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason?.message || String(reason);
  if (isNetworkError({ message: msg })) console.error('[DB] Network rejection (handled):', msg);
  else console.error('[DB] Unhandled rejection:', msg);
});

const isNetworkError = (err) => {
  const msg = err?.message || '';
  return (
    msg.includes('ENOTFOUND') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('Connection terminated') ||
    msg.includes('timeout') ||
    msg.includes('ETIMEDOUT')
  );
};

const activePool = () => activeSource === 'cloud' ? cloudPool : localPool;

const loadQueue = () => {
  try {
    if (fs.existsSync(QUEUE_FILE)) return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8')) || [];
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
  console.log(`[Queue] Queued operation — ${writeQueue.length} pending`);
};

const flushQueue = async () => {
  if (isFlushing || writeQueue.length === 0) return;
  isFlushing = true;
  console.log(`[Queue] Flushing ${writeQueue.length} operation(s) to Render...`);
  const remaining = [];
  for (const op of writeQueue) {
    try {
      if (op.type === 'query') await cloudPool.query(op.text, op.params);
    } catch (err) {
      if (isNetworkError(err)) {
        console.error('[Queue] Still offline, stopping flush.');
        remaining.push(...writeQueue.slice(writeQueue.indexOf(op)));
        break;
      }
      console.error('[Queue] Permanent failure, dropping operation:', err.message);
    }
  }
  writeQueue = remaining;
  saveQueue(writeQueue);
  console.log(remaining.length === 0
    ? '[Queue] All operations flushed.'
    : `[Queue] ${remaining.length} operation(s) still pending.`
  );
  isFlushing = false;
};

const tryLocal = async (fn) => {
  if (!localPool) return null;
  try {
    return await fn(localPool);
  } catch (err) {
    console.error('[DB] Local DB also failed:', err.message);
    return null;
  }
};

const dbQuery = async (text, params = []) => {
  try {
    return await activePool().query(text, params);
  } catch (err) {
    if (isNetworkError(err) && activeSource === 'cloud') {
      console.log('[DB] Cloud unreachable — falling back to local DB.');
      activeSource = 'local';
      const result = await tryLocal(p => p.query(text, params));
      if (result) return result;
    }
    throw err;
  }
};

const dbWrite = async (text, params = []) => {
  try {
    return await activePool().query(text, params);
  } catch (err) {
    if (isNetworkError(err) && activeSource === 'cloud') {
      console.log('[DB] Cloud unreachable on write — falling back to local DB.');
      activeSource = 'local';
      const result = await tryLocal(p => p.query(text, params));
      if (result) return result;
      enqueue({ type: 'query', text, params });
      return { rows: [], queued: true };
    }
    throw err;
  }
};

const getPool = () => ({
  query: (text, params) => dbQuery(text, params),
  connect: async () => {
    try {
      return await activePool().connect();
    } catch (err) {
      if (isNetworkError(err) && activeSource === 'cloud' && localPool) {
        console.log('[DB] Cloud connect failed — falling back to local DB.');
        activeSource = 'local';
        return await localPool.connect();
      }
      throw err;
    }
  }
});

const checkConnection = async () => {
  try {
    await cloudPool.query('SELECT 1');
    if (activeSource !== 'cloud') {
      console.log('[DB] Cloud restored — switching back from local DB.');
      activeSource = 'cloud';
      if (writeQueue.length > 0) await flushQueue();
    }
  } catch {
    if (activeSource === 'cloud') {
      if (localPool) {
        try {
          await localPool.query('SELECT 1');
          console.log('[DB] Cloud lost — switched to local DB fallback.');
          activeSource = 'local';
        } catch {
          console.log('[DB] Both cloud and local unreachable.');
        }
      } else {
        console.log('[DB] Cloud lost — no local DB configured.');
      }
    }
  }
};

const initDB = async () => {
  try {
    await cloudPool.query('SELECT 1');
    activeSource = 'cloud';
    console.log('[DB] Connected to Render (cloud) database.');
    if (writeQueue.length > 0) {
      console.log(`[Queue] Found ${writeQueue.length} queued operation(s) — flushing...`);
      await flushQueue();
    }
  } catch {
    console.log('[DB] Render unreachable — trying local DB...');
    if (localPool) {
      try {
        await localPool.query('SELECT 1');
        activeSource = 'local';
        console.log('[DB] Connected to local database (fallback mode — no sync).');
      } catch {
        console.log('[DB] Local DB also unreachable.');
      }
    } else {
      console.log('[DB] No LOCAL_DATABASE_URL configured.');
    }
  }
  setInterval(checkConnection, 15_000);
};

module.exports = { getPool, initDB, dbQuery, dbWrite };