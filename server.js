'use strict';

/**
 * Yuzhou Crystal — Inquiry Platform Backend
 *
 * Receives two kinds of submissions from the frontend:
 *   - POST /api/inquiries        product inquiry (JSON: contact + selected items)
 *   - POST /api/custom-requests  custom design request (multipart: fields + reference image)
 *
 * Stores them (SQLite, JSONL fallback), optionally emails the team, and exposes
 * an authenticated admin API + CSV export. Serves the static frontend from /public.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

require('./src/dotenv')();              // tiny .env loader (no external dep)
const store = require('./src/store');
const mailer = require('./src/mailer');

const PORT = parseInt(process.env.PORT || '3000', 10);
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Admin token: use env if provided, otherwise generate a secure one for this run.
// 说明：生产环境推荐用 ADMIN_CREDENTIALS 配置真实账号（见下），ADMIN_TOKEN 作为
// API/快速访问的兼容令牌保留。
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(18).toString('base64url');
if (!process.env.ADMIN_TOKEN) {
  console.log('\n============================================================');
  console.log('  未设置 ADMIN_TOKEN —— 本次运行已自动生成：');
  console.log('  ' + ADMIN_TOKEN);
  console.log('  如需固定口令，请在环境变量 / .env 中设置 ADMIN_TOKEN。');
  console.log('============================================================\n');
}

/* ------------------ 后台真实账号（生产鉴权） ------------------ */
// 会话签名密钥：优先用 SESSION_SECRET，否则回退到 ADMIN_TOKEN，再否则随机。
const SESSION_SECRET = process.env.SESSION_SECRET || ADMIN_TOKEN || crypto.randomBytes(24).toString('base64url');
const SESSION_NAME = 'yz_admin';
const SESSION_TTL = 8 * 3600; // 8 小时

function b64url(buf) { return Buffer.from(buf).toString('base64url'); }

function signSession(user) {
  const payload = b64url(JSON.stringify({ user, exp: Date.now() + SESSION_TTL * 1000 }));
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySession(cookie) {
  if (!cookie) return null;
  const [payload, sig] = cookie.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return String(data.user || '');
  } catch { return null; }
}

function getCookie(req, name) {
  const c = req.headers.cookie;
  if (!c) return null;
  for (const part of c.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

// 口令哈希（scrypt，Node 内置，无额外依赖）
function hashPassword(pass) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pass, salt, 64);
  return { salt: salt.toString('base64'), hash: hash.toString('base64') };
}
function verifyPassword(pass, saltB64, hashB64) {
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(String(pass || ''), salt, 64);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// 从 ADMIN_CREDENTIALS=user1:pass1,user2:pass2 加载账号（启动时哈希，不落盘明文）
const ACCOUNTS = new Map();
(function loadAccounts() {
  const raw = process.env.ADMIN_CREDENTIALS || '';
  let n = 0;
  raw.split(',').map(s => s.trim()).filter(Boolean).forEach(entry => {
    const idx = entry.indexOf(':');
    if (idx < 1) return;
    const user = entry.slice(0, idx).trim();
    const pass = entry.slice(idx + 1).trim();
    if (!user || !pass) return;
    const { salt, hash } = hashPassword(pass);
    ACCOUNTS.set(user, { salt, hash });
    n += 1;
  });
  if (n > 0) console.log(`  已加载 ${n} 个后台管理员账号（ADMIN_CREDENTIALS）。`);
})();

const app = express();

/* ----------------------------- Security ----------------------------- */
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// CORS for public endpoints (admin endpoints stay same-origin / token protected).
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use('/api/inquiries', cors({ origin: corsOrigin }));
app.use('/api/custom-requests', cors({ origin: corsOrigin }));
app.use('/api/health', cors({ origin: corsOrigin }));
app.use('/api/products', cors({ origin: corsOrigin }));

app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));

/* --------------------------- Rate limiting -------------------------- */
// Simple fixed-window limiter keyed by IP, applied to write endpoints.
const windows = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const w = windows.get(key) || { count: 0, reset: now + windowMs };
    if (now > w.reset) { w.count = 0; w.reset = now + windowMs; }
    w.count += 1;
    windows.set(key, w);
    if (w.count > max) {
      return res.status(429).json({ ok: false, error: '请求过于频繁，请稍后再试。', code: 'RATE_LIMITED' });
    }
    next();
  };
}

/* ----------------------------- Validation --------------------------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isEmail = (v) => EMAIL_RE.test(String(v || '').trim());

// 中文展示标签（接口状态码保持英文，便于存储与解析）
const TYPE_ZH = { product: '产品', custom: '定制' };
const STATUS_ZH = { new: '新询单', contacted: '已联系', quoted: '已报价', done: '已完成', archived: '已归档' };

function bad(res, msg, code = 'VALIDATION') {
  return res.status(400).json({ ok: false, error: msg, code });
}

// 将 "Key: Value" 多行文本解析为规格对象（后台产品表单使用）
function parseSpecs(text) {
  const out = {};
  String(text || '').split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx <= 0) return;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k && v) out[k] = v;
  });
  return out;
}

/* --------------------------- File uploads --------------------------- */
const ALLOWED_IMG = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp']);
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = (path.extname(file.originalname) || '').toLowerCase().slice(0, 10);
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMG.has(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持图片文件（jpg/png/webp/gif/bmp）。'));
  },
}).single('image');

/* ----------------------------- Admin auth --------------------------- */
function requireAdmin(req, res, next) {
  // 优先：带签名的会话 Cookie（真实账号登录后由服务端下发）
  const user = verifySession(getCookie(req, SESSION_NAME));
  if (user) { req.adminUser = user; return next(); }
  // 兼容：旧的 ADMIN_TOKEN（API / 快速访问）
  const viaQuery = req.query.token;
  const viaHeader = (req.headers['x-admin-token'] || '').toString().replace(/^Bearer\s+/i, '');
  const viaAuth = (req.headers['authorization'] || '').toString().replace(/^Bearer\s+/i, '');
  if (ADMIN_TOKEN && (viaQuery === ADMIN_TOKEN || viaHeader === ADMIN_TOKEN || viaAuth === ADMIN_TOKEN)) return next();
  return res.status(401).json({ ok: false, error: '未授权，请登录。', code: 'UNAUTHORIZED' });
}

/* ------------------------------- Routes ----------------------------- */

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, engine: store.engine(), time: new Date().toISOString() });
});

// Product inquiry
app.post('/api/inquiries', rateLimit(30, 60 * 1000), async (req, res) => {
  const b = req.body || {};
  const name = str(b.name, 200);
  const company = str(b.company, 200);
  const email = str(b.email, 200);
  const country = str(b.country, 120);
  const message = str(b.message, 4000);

  if (!name) return bad(res, '请填写姓名。');
  if (!company) return bad(res, '请填写公司名称。');
  if (!isEmail(email)) return bad(res, '请填写有效的邮箱地址。');

  let items = Array.isArray(b.items) ? b.items : [];
  items = items
    .filter(it => it && (it.id || it.name))
    .map(it => ({
      id: str(it.id, 80),
      name: str(it.name, 200),
      qty: Math.max(1, Math.min(1000000, parseInt(it.qty, 10) || 1)),
      moq: str(it.moq, 60),
    }));
  if (items.length === 0) return bad(res, '请至少添加一件产品到询单。');

  const id = store.insert({
    type: 'product',
    name, company, email, country,
    data: { items, message },
  });
  mailer.notify({ type: 'product', id, record: { name, company, email, country, data: { items, message } } })
    .catch(() => {});
  res.json({ ok: true, id, message: '已收到询价，我们会尽快与您联系。' });
});

// Custom design request (multipart + optional image)
app.post('/api/custom-requests', rateLimit(20, 60 * 1000), (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      const msg = err.message && /image/i.test(err.message) ? err.message : '文件上传失败。';
      return res.status(400).json({ ok: false, error: msg, code: 'UPLOAD_ERROR' });
    }
    const b = req.body || {};
    const name = str(b.name, 200);
    const company = str(b.company, 200);
    const email = str(b.email, 200);
    const country = str(b.country, 120);
    const brief = str(b.brief, 4000);

    if (!name) return bad(res, '请填写姓名。');
    if (!company) return bad(res, '请填写公司名称。');
    if (!isEmail(email)) return bad(res, '请填写有效的邮箱地址。');
    if (!brief) return bad(res, '请描述您的需求（brief）。');

    const data = {
      ptype: str(b.ptype, 120),
      size: str(b.size, 200),
      material: str(b.material, 120),
      qty: str(b.qty, 120),
      customization: str(b.customization, 1000),
      deadline: str(b.deadline, 120),
      brief,
    };

    const image = req.file ? req.file.filename : null;
    const id = store.insert({ type: 'custom', name, company, email, country, data, image });
    mailer.notify({ type: 'custom', id, record: { name, company, email, country, data, image } })
      .catch(() => {});
    res.json({
      ok: true, id,
      imageUrl: image ? `/uploads/${image}` : null,
      message: '已收到定制需求，设计团队会尽快与您联系。',
    });
  });
});

/* ---------------------- Public product catalogue --------------------- */
app.get('/api/products', (req, res) => {
  const { category, q, page, pageSize } = req.query;
  const result = store.listProducts({
    category: category || undefined,
    q: q || undefined,
    page: page || 1,
    pageSize: pageSize || 200,
  });
  const rows = result.rows.map(p => ({ ...p, imageUrl: p.image ? `/api/products/${p.id}/image` : null }));
  res.json({ ok: true, rows, total: result.total, page: result.page, pageSize: result.pageSize });
});

// 公开产品图（带显式 Content-Length，避免过 Cloudflare 隧道被 chunked 丢弃）
app.get('/api/products/:id/image', (req, res) => {
  const row = store.getProduct(req.params.id);
  if (!row || !row.image) return res.status(404).json({ ok: false, error: '未找到图片。' });
  const fp = path.join(UPLOAD_DIR, row.image);
  if (!fs.existsSync(fp)) return res.status(404).json({ ok: false, error: '图片文件不存在。' });
  const ext = path.extname(row.image).toLowerCase();
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' }[ext] || 'application/octet-stream';
  const buf = fs.readFileSync(fp);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', buf.length);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(buf);
});

// Static uploads (reference images) — same-origin only
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

/* --------------------------- Admin API ------------------------------ */
const admin = express.Router();
admin.use(requireAdmin);

admin.get('/inquiries', (req, res) => {
  const { type, status, q, page, pageSize } = req.query;
  const result = store.list({
    type: type || undefined,
    status: status || undefined,
    q: q || undefined,
    page: page || 1,
    pageSize: pageSize || 25,
  });
  // 把统计一并带回，避免后台每次打开/刷新多发一次请求（减少隧道往返延迟）
  res.json({ ok: true, ...result, stats: store.stats() });
});

admin.get('/inquiries/stats', (req, res) => {
  res.json({ ok: true, ...store.stats() });
});

admin.get('/inquiry/:id', (req, res) => {
  const row = store.get(req.params.id);
  if (!row) return res.status(404).json({ ok: false, error: '未找到该询单。' });
  const out = { ...row };
  if (out.image) out.imageUrl = `/uploads/${out.image}`;
  res.json({ ok: true, inquiry: out });
});

admin.patch('/inquiry/:id/status', (req, res) => {
  const status = str(req.body && req.body.status, 40);
  try {
    const ok = store.updateStatus(req.params.id, status);
    if (!ok) return res.status(404).json({ ok: false, error: '未找到该询单。' });
    res.json({ ok: true, id: Number(req.params.id), status });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e.message, code: 'BAD_STATUS' });
  }
});

admin.delete('/inquiries/:id', (req, res) => {
  const r = store.deleteInquiry(req.params.id);
  if (!r.ok) {
    if (r.reason === 'new_locked') return res.status(403).json({ ok: false, error: '新询单不能删除，请先处理或归档后再删。' });
    return res.status(404).json({ ok: false, error: '未找到该询单。' });
  }
  res.json({ ok: true, id: Number(req.params.id) });
});

admin.get('/inquiry/:id/image', (req, res) => {
  const row = store.get(req.params.id);
  if (!row || !row.image) return res.status(404).json({ ok: false, error: '未找到图片。' });
  const fp = path.join(UPLOAD_DIR, row.image);
  if (!fs.existsSync(fp)) return res.status(404).json({ ok: false, error: '图片文件不存在。' });
  const ext = path.extname(row.image).toLowerCase();
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' }[ext] || 'application/octet-stream';
  // 整文件读入内存并显式设置 Content-Length，避免分块(chunked)传输被 Cloudflare 隧道丢弃二进制
  const buf = fs.readFileSync(fp);
  res.setHeader('Content-Type', mime);
  res.setHeader('Content-Length', buf.length);
  res.setHeader('Content-Disposition', `inline; filename="ref-${row.id}${ext}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(buf);
});

/* ------------------------- Admin: products -------------------------- */
admin.get('/products', (req, res) => {
  const result = store.listProducts({ category: req.query.category || undefined, q: req.query.q || undefined, page: req.query.page || 1, pageSize: req.query.pageSize || 200 });
  const rows = result.rows.map(p => ({ ...p, imageUrl: p.image ? `/api/products/${p.id}/image` : null }));
  res.json({ ok: true, rows, total: result.total, page: result.page, pageSize: result.pageSize });
});

admin.post('/products', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      const msg = err.message && /image/i.test(err.message) ? err.message : '文件上传失败。';
      return res.status(400).json({ ok: false, error: msg, code: 'UPLOAD_ERROR' });
    }
    const b = req.body || {};
    const name = str(b.name, 200);
    if (!name) return bad(res, '请填写产品名称。');
    const category = str(b.category, 60);
    const description = str(b.description, 4000);
    const specs = parseSpecs(b.specs);
    const sort_order = Math.max(0, Math.min(9999, parseInt(b.sort_order, 10) || 0));
    const image = req.file ? req.file.filename : null;
    const id = store.createProduct({ name, category, description, specs, image, sort_order });
    res.json({ ok: true, id, imageUrl: image ? `/api/products/${id}/image` : null });
  });
});

admin.patch('/products/:id', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      const msg = err.message && /image/i.test(err.message) ? err.message : '文件上传失败。';
      return res.status(400).json({ ok: false, error: msg, code: 'UPLOAD_ERROR' });
    }
    const id = req.params.id;
    const existing = store.getProduct(id);
    if (!existing) return res.status(404).json({ ok: false, error: '未找到该产品。' });
    const b = req.body || {};
    const patch = {};
    if (b.name !== undefined) { const n = str(b.name, 200); if (!n) return bad(res, '产品名称不能为空。'); patch.name = n; }
    if (b.category !== undefined) patch.category = str(b.category, 60);
    if (b.description !== undefined) patch.description = str(b.description, 4000);
    if (b.specs !== undefined) patch.specs = parseSpecs(b.specs);
    if (b.sort_order !== undefined) patch.sort_order = Math.max(0, Math.min(9999, parseInt(b.sort_order, 10) || 0));
    if (req.file) {
      if (existing.image) { try { fs.unlinkSync(path.join(UPLOAD_DIR, existing.image)); } catch (e) {} }
      patch.image = req.file.filename;
    }
    const ok = store.updateProduct(id, patch);
    res.json({ ok: !!ok, id: Number(id) });
  });
});

admin.delete('/products/:id', (req, res) => {
  const id = req.params.id;
  const existing = store.getProduct(id);
  if (!existing) return res.status(404).json({ ok: false, error: '未找到该产品。' });
  if (existing.image) { try { fs.unlinkSync(path.join(UPLOAD_DIR, existing.image)); } catch (e) {} }
  const r = store.deleteProduct(id);
  res.json({ ok: !!r.ok });
});

admin.get('/export.csv', (req, res) => {
  const { type, status, q } = req.query;
  const { rows } = store.list({ type: type || undefined, status: status || undefined, q: q || undefined, page: 1, pageSize: 100000 });
  const header = ['编号', '类型', '提交时间', '状态', '姓名', '公司', '邮箱', '国家', '摘要', '图片'];
  const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const summary = (r) => {
    if (r.type === 'product') return (r.data.items || []).map(i => `${i.name} ×${i.qty}`).join('；');
    const d = r.data || {};
    const LABEL = { ptype: '产品类型', size: '期望尺寸', material: '材质', qty: '目标数量', deadline: '交付期限', brief: '详细需求', customization: '定制内容' };
    return ['ptype', 'size', 'material', 'qty', 'customization', 'deadline', 'brief']
      .map(k => d[k] ? `${LABEL[k]}：${d[k]}` : '').filter(Boolean).join('；');
  };
  const lines = [header.join(',')].concat(rows.map(r =>
    [r.id, TYPE_ZH[r.type] || r.type, r.created_at, STATUS_ZH[r.status] || r.status, r.name, r.company, r.email, r.country, summary(r), r.image || ''].map(esc).join(',')
  ));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="inquiries.csv"; filename*=UTF-8''${encodeURIComponent('询单导出.csv')}`);
  res.send('﻿' + lines.join('\n')); // BOM for Excel
});

// 登录 / 退出（必须在挂载受保护的 admin 路由之前注册）
app.post('/api/admin/login', rateLimit(10, 5 * 60 * 1000), (req, res) => {
  const { user, pass } = req.body || {};
  if (ACCOUNTS.size === 0) {
    return res.status(400).json({ ok: false, error: '后台未配置管理员账号，请在 ADMIN_CREDENTIALS 中设置（如 admin:强密码）。' });
  }
  const acc = ACCOUNTS.get(String(user || '').trim());
  if (!acc || !verifyPassword(pass, acc.salt, acc.hash)) {
    return res.status(401).json({ ok: false, error: '账号或密码错误。' });
  }
  const cookie = signSession(user);
  res.setHeader('Set-Cookie',
    `${SESSION_NAME}=${cookie}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL}`);
  res.json({ ok: true, user });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', `${SESSION_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

app.use('/api/admin', admin);

/* --------------------------- Static frontend ------------------------ */
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));
// Admin SPA
app.get('/admin', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'admin.html')));

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ ok: false, error: '未找到该接口。', code: 'NOT_FOUND' }));

/* ----------------- Legacy URL 301 redirects -----------------
 * 旧 ASP 网站的链接（如 /crystalwto/sales.asp）被 Google 索引，
 * 新站是 Node.js/Express，这些路径不存在会返回 404。
 * 此 catch-all 将所有未匹配的非 API 路由 301 到首页。
 * Google 收到 301 后会逐步更新索引。
 * ---------------------------------------------------------- */
app.get('*', (req, res, next) => {
  // 跳过已处理的静态文件和 admin
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) return next();
  // 所有其他路径（.asp、旧目录等）→ 301 到首页
  const target = req.protocol + '://' + req.get('host') + '/';
  console.log(`[301 redirect] ${req.originalUrl} → ${target}`);
  res.redirect(301, target);
});

/* ------------------------------- Start ------------------------------ */
app.listen(PORT, () => {
  console.log(`Yuzhou Crystal 询价后端已启动：http://0.0.0.0:${PORT}`);
  console.log(`存储引擎：${store.engine()}`);
  console.log(`官网前台：      http://0.0.0.0:${PORT}/`);
  console.log(`管理后台：      http://0.0.0.0:${PORT}/admin`);
});
