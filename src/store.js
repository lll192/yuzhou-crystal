'use strict';

/**
 * Persistence layer for inquiry submissions.
 *
 * Primary engine: better-sqlite3 (synchronous, embedded, zero external services).
 * Fallback engine: append-only JSONL file (used only if better-sqlite3 cannot
 * load, e.g. on a platform without native module support). Same interface either way.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const VALID_STATUS = ['new', 'contacted', 'quoted', 'done', 'archived'];

let engine = null;       // 'sqlite' | 'jsonl'
let db = null;           // better-sqlite3 handle
let jsonlPath = null;    // path for jsonl fallback
let productJsonlPath = null; // path for products jsonl fallback

function initSqlite() {
  try {
    const Database = require('better-sqlite3');
    const dbFile = path.join(DATA_DIR, 'inquiries.db');
    db = new Database(dbFile);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        type      TEXT NOT NULL CHECK (type IN ('product','custom')),
        name      TEXT,
        company   TEXT,
        email     TEXT,
        country   TEXT,
        data      TEXT NOT NULL,
        image     TEXT,
        status    TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_sub_type ON submissions(type);
      CREATE INDEX IF NOT EXISTS idx_sub_status ON submissions(status);
      CREATE INDEX IF NOT EXISTS idx_sub_created ON submissions(created_at);

      CREATE TABLE IF NOT EXISTS products (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        category    TEXT,
        description TEXT,
        specs       TEXT,
        image       TEXT,
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_prod_cat ON products(category);
    `);
    engine = 'sqlite';
  } catch (err) {
    console.warn('[store] better-sqlite3 unavailable, falling back to JSONL:', err.message);
    jsonlPath = path.join(DATA_DIR, 'inquiries.jsonl');
    if (!fs.existsSync(jsonlPath)) fs.writeFileSync(jsonlPath, '');
    productJsonlPath = path.join(DATA_DIR, 'products.jsonl');
    if (!fs.existsSync(productJsonlPath)) fs.writeFileSync(productJsonlPath, '');
    engine = 'jsonl';
  }
}

initSqlite();

/* ------------------------------------------------------------------ */
/* Helpers for JSONL fallback                                          */
/* ------------------------------------------------------------------ */

let jsonlSeq = (function () {
  if (engine !== 'jsonl') return 0;
  try {
    const lines = fs.readFileSync(jsonlPath, 'utf8').trim().split('\n').filter(Boolean);
    return lines.reduce((max, l) => Math.max(max, JSON.parse(l).id || 0), 0);
  } catch { return 0; }
})();

function readJsonl() {
  const raw = fs.readFileSync(jsonlPath, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
}
function writeJsonl(rows) {
  fs.writeFileSync(jsonlPath, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
}

let productJsonlSeq = (function () {
  if (engine !== 'jsonl') return 0;
  try {
    const lines = fs.readFileSync(productJsonlPath, 'utf8').trim().split('\n').filter(Boolean);
    return lines.reduce((max, l) => Math.max(max, JSON.parse(l).id || 0), 0);
  } catch { return 0; }
})();
function readProductsJsonl() {
  const raw = fs.readFileSync(productJsonlPath, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map(l => JSON.parse(l));
}
function writeProductsJsonl(rows) {
  fs.writeFileSync(productJsonlPath, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Insert a submission.
 * @param {{type:string,name?:string,company?:string,email?:string,country?:string,data:object,image?:string}} rec
 * @returns {number} new id
 */
function insert(rec) {
  const row = {
    type: rec.type,
    name: rec.name || null,
    company: rec.company || null,
    email: rec.email || null,
    country: rec.country || null,
    data: typeof rec.data === 'string' ? rec.data : JSON.stringify(rec.data),
    image: rec.image || null,
    status: 'new',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  if (engine === 'sqlite') {
    const info = db.prepare(
      `INSERT INTO submissions (type, name, company, email, country, data, image, status, created_at)
       VALUES (@type, @name, @company, @email, @country, @data, @image, @status, @created_at)`
    ).run(row);
    return Number(info.lastInsertRowid);
  } else {
    jsonlSeq += 1;
    const full = { id: jsonlSeq, ...row };
    fs.appendFileSync(jsonlPath, JSON.stringify(full) + '\n');
    return jsonlSeq;
  }
}

function normalize(row) {
  if (!row) return row;
  if (typeof row.data === 'string') {
    try { row.data = JSON.parse(row.data); } catch { /* keep as-is */ }
  }
  return row;
}

/**
 * List submissions with optional filters.
 * @returns {{rows:object[],total:number,page:number,pageSize:number}}
 */
function list({ type, status, q, page = 1, pageSize = 25 } = {}) {
  page = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.min(200, Math.max(1, parseInt(pageSize, 10) || 25));

  if (engine === 'sqlite') {
    const where = [];
    const params = {};
    if (type) { where.push('type = @type'); params.type = type; }
    if (status) { where.push('status = @status'); params.status = status; }
    if (q) { where.push('(name LIKE @q OR company LIKE @q OR email LIKE @q)'); params.q = `%${q}%`; }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) c FROM submissions ${clause}`).get(params).c;
    const rows = db.prepare(
      `SELECT * FROM submissions ${clause} ORDER BY created_at DESC, id DESC LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSize, offset: (page - 1) * pageSize }).map(normalize);
    return { rows, total, page, pageSize };
  } else {
    let rows = readJsonl();
    if (type) rows = rows.filter(r => r.type === type);
    if (status) rows = rows.filter(r => r.status === status);
    if (q) {
      const needle = q.toLowerCase();
      rows = rows.filter(r =>
        (r.name || '').toLowerCase().includes(needle) ||
        (r.company || '').toLowerCase().includes(needle) ||
        (r.email || '').toLowerCase().includes(needle));
    }
    rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize).map(normalize), total, page, pageSize };
  }
}

function get(id) {
  id = Number(id);
  if (engine === 'sqlite') {
    return normalize(db.prepare('SELECT * FROM submissions WHERE id = ?').get(id));
  }
  return normalize(readJsonl().find(r => r.id === id) || null);
}

function updateStatus(id, status) {
  if (!VALID_STATUS.includes(status)) {
    const err = new Error('无效的状态');
    err.code = 'BAD_STATUS';
    throw err;
  }
  id = Number(id);
  if (engine === 'sqlite') {
    const info = db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, id);
    return info.changes > 0;
  } else {
    const rows = readJsonl();
    const row = rows.find(r => r.id === id);
    if (!row) return false;
    row.status = status;
    writeJsonl(rows);
    return true;
  }
}

function deleteInquiry(id) {
  id = Number(id);
  if (engine === 'sqlite') {
    const row = db.prepare('SELECT status FROM submissions WHERE id = ?').get(id);
    if (!row) return { ok: false, reason: 'not_found' };
    if (row.status === 'new') return { ok: false, reason: 'new_locked' };
    const info = db.prepare('DELETE FROM submissions WHERE id = ?').run(id);
    return { ok: info.changes > 0 };
  } else {
    const rows = readJsonl();
    const idx = rows.findIndex(r => r.id === id);
    if (idx < 0) return { ok: false, reason: 'not_found' };
    if (rows[idx].status === 'new') return { ok: false, reason: 'new_locked' };
    rows.splice(idx, 1);
    writeJsonl(rows);
    return { ok: true };
  }
}

function stats() {
  if (engine === 'sqlite') {
    const r = db.prepare(
      `SELECT
         COUNT(*) total,
         SUM(CASE WHEN type='product' THEN 1 ELSE 0 END) product,
         SUM(CASE WHEN type='custom' THEN 1 ELSE 0 END) custom,
         SUM(CASE WHEN status='new' THEN 1 ELSE 0 END) new
       FROM submissions`
    ).get();
    return { total: r.total, product: r.product, custom: r.custom, new: r.new };
  }
  const rows = readJsonl();
  return {
    total: rows.length,
    product: rows.filter(r => r.type === 'product').length,
    custom: rows.filter(r => r.type === 'custom').length,
    new: rows.filter(r => r.status === 'new').length,
  };
}

/* ------------------------------------------------------------------ */
/* Products (catalogue)                                                */
/* ------------------------------------------------------------------ */

function normalizeProduct(row) {
  if (!row) return row;
  if (typeof row.specs === 'string') {
    try { row.specs = JSON.parse(row.specs); } catch { row.specs = {}; }
  }
  if (typeof row.specs !== 'object' || row.specs === null) row.specs = {};
  return row;
}

function listProducts({ category, q, page = 1, pageSize = 200 } = {}) {
  page = Math.max(1, parseInt(page, 10) || 1);
  pageSize = Math.min(500, Math.max(1, parseInt(pageSize, 10) || 200));
  if (engine === 'sqlite') {
    const where = [];
    const params = {};
    if (category) { where.push('category = @category'); params.category = category; }
    if (q) { where.push('(name LIKE @q OR description LIKE @q OR specs LIKE @q)'); params.q = '%' + q + '%'; }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) c FROM products ${clause}`).get(params).c;
    const rows = db.prepare(
      `SELECT * FROM products ${clause} ORDER BY sort_order ASC, created_at DESC, id DESC LIMIT @limit OFFSET @offset`
    ).all({ ...params, limit: pageSize, offset: (page - 1) * pageSize }).map(normalizeProduct);
    return { rows, total, page, pageSize };
  } else {
    let rows = readProductsJsonl();
    if (category) rows = rows.filter(r => r.category === category);
    if (q) { const t = String(q).toLowerCase(); rows = rows.filter(r => ((r.name || '') + ' ' + (r.description || '') + ' ' + (r.specs || '')).toLowerCase().includes(t)); }
    rows.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (b.created_at || '').localeCompare(a.created_at || ''));
    const total = rows.length;
    const start = (page - 1) * pageSize;
    return { rows: rows.slice(start, start + pageSize).map(normalizeProduct), total, page, pageSize };
  }
}

function getProduct(id) {
  id = Number(id);
  if (engine === 'sqlite') {
    return normalizeProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id));
  }
  return normalizeProduct(readProductsJsonl().find(r => r.id === id) || null);
}

function createProduct(rec) {
  const row = {
    name: rec.name,
    category: rec.category || null,
    description: rec.description || null,
    specs: typeof rec.specs === 'string' ? rec.specs : JSON.stringify(rec.specs || {}),
    image: rec.image || null,
    sort_order: Math.max(0, Math.min(9999, parseInt(rec.sort_order, 10) || 0)),
  };
  if (engine === 'sqlite') {
    const info = db.prepare(
      `INSERT INTO products (name, category, description, specs, image, sort_order, created_at, updated_at)
       VALUES (@name, @category, @description, @specs, @image, @sort_order, datetime('now'), datetime('now'))`
    ).run(row);
    return Number(info.lastInsertRowid);
  } else {
    productJsonlSeq += 1;
    const full = {
      id: productJsonlSeq, ...row,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    fs.appendFileSync(productJsonlPath, JSON.stringify(full) + '\n');
    return productJsonlSeq;
  }
}

function updateProduct(id, patch) {
  id = Number(id);
  if (engine === 'sqlite') {
    const sets = [];
    const params = { id };
    if (patch.name !== undefined) { sets.push('name = @name'); params.name = patch.name; }
    if (patch.category !== undefined) { sets.push('category = @category'); params.category = patch.category; }
    if (patch.description !== undefined) { sets.push('description = @description'); params.description = patch.description; }
    if (patch.specs !== undefined) { sets.push('specs = @specs'); params.specs = typeof patch.specs === 'string' ? patch.specs : JSON.stringify(patch.specs || {}); }
    if (patch.image !== undefined) { sets.push('image = @image'); params.image = patch.image; }
    if (patch.sort_order !== undefined) { sets.push('sort_order = @sort_order'); params.sort_order = patch.sort_order; }
    sets.push("updated_at = datetime('now')");
    if (!sets.length) return true;
    const info = db.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = @id`).run(params);
    return info.changes > 0;
  } else {
    const rows = readProductsJsonl();
    const row = rows.find(r => r.id === id);
    if (!row) return false;
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.category !== undefined) row.category = patch.category;
    if (patch.description !== undefined) row.description = patch.description;
    if (patch.specs !== undefined) row.specs = typeof patch.specs === 'string' ? patch.specs : JSON.stringify(patch.specs || {});
    if (patch.image !== undefined) row.image = patch.image;
    if (patch.sort_order !== undefined) row.sort_order = patch.sort_order;
    writeProductsJsonl(rows);
    return true;
  }
}

function deleteProduct(id) {
  id = Number(id);
  let image = null;
  if (engine === 'sqlite') {
    const row = db.prepare('SELECT image FROM products WHERE id = ?').get(id);
    image = row ? row.image : null;
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return { ok: info.changes > 0, image };
  } else {
    const rows = readProductsJsonl();
    const row = rows.find(r => r.id === id);
    image = row ? row.image : null;
    const next = rows.filter(r => r.id !== id);
    if (next.length === rows.length) return { ok: false, image: null };
    writeProductsJsonl(next);
    return { ok: true, image };
  }
}

module.exports = {
  insert, list, get, updateStatus, deleteInquiry, stats,
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  VALID_STATUS, engine: () => engine,
};
