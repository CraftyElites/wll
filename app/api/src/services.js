/**
 * MySQL pool + document/file/job helpers.
 * No durable state in process memory beyond the pool.
 */
import mysql from "mysql2/promise";
import { cfg } from "./config.js";
import { randomUUID } from "node:crypto";

function parseMysqlUrl(url) {
  // mysql://user:pass@host:3306/db
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: 8,
    namedPlaceholders: false,
    // security: reject unauthorized local defaults; enable SSL in prod via env if needed
    ssl: cfg.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined,
  };
}

export const pool = mysql.createPool(
  cfg.DATABASE_URL.startsWith("mysql")
    ? parseMysqlUrl(cfg.DATABASE_URL)
    : { uri: cfg.DATABASE_URL, connectionLimit: 8 }
);

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

function parseJson(v) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

/** Document CRUD — always scoped by user_id */
export const docs = {
  async list(userId, collection) {
    const rows = await query(
      `SELECT id, data, created_at, updated_at FROM documents
       WHERE user_id = ? AND collection = ? ORDER BY updated_at DESC`,
      [userId, collection]
    );
    return rows.map((r) => {
      const data = parseJson(r.data) || {};
      return { id: r.id, ...data, created: r.created_at, updated: r.updated_at };
    });
  },

  async get(userId, collection, id) {
    const r = await queryOne(
      `SELECT id, data, created_at, updated_at FROM documents
       WHERE user_id = ? AND collection = ? AND id = ?`,
      [userId, collection, id]
    );
    if (!r) return null;
    const data = parseJson(r.data) || {};
    return { id: r.id, ...data, created: r.created_at, updated: r.updated_at };
  },

  async upsert(userId, collection, id, data) {
    const payload = JSON.stringify(data);
    await query(
      `INSERT INTO documents (id, user_id, collection, data)
       VALUES (?, ?, ?, CAST(? AS JSON))
       ON DUPLICATE KEY UPDATE data = CAST(? AS JSON), updated_at = CURRENT_TIMESTAMP(3)`,
      [id, userId, collection, payload, payload]
    );
    return this.get(userId, collection, id);
  },

  async del(userId, collection, id) {
    await query(
      `DELETE FROM documents WHERE user_id = ? AND collection = ? AND id = ?`,
      [userId, collection, id]
    );
  },
};

export const storage = {
  enabled() {
    return Boolean(cfg.R2_BUCKET && cfg.R2_ACCESS_KEY_ID);
  },
  /** Safe object key — never trust raw filename for path */
  keyFor(userId, fileId, safeName) {
    return `u/${userId}/${fileId}/${safeName}`;
  },
};

export const jobs = {
  async enqueue(userId, kind, payload = {}) {
    const id = randomUUID();
    await query(
      `INSERT INTO jobs (id, user_id, kind, status, payload) VALUES (?, ?, ?, 'queued', CAST(? AS JSON))`,
      [id, userId, kind, JSON.stringify(payload)]
    );
    return { id, status: "queued", kind };
  },

  async setStatus(id, status, result = null, error = null) {
    await query(
      `UPDATE jobs SET status = ?, result = ?, error = ?, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [status, result ? JSON.stringify(result) : null, error, id]
    );
  },
};

export { randomUUID };
