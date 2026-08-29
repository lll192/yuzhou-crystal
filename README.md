# Yuzhou Crystal — Inquiry Platform (Full Stack)

A B2B crystal-manufacturer website whose front-end UI was already designed
(`index (5).html`). This project adds a **backend that receives customer
inquiries** so the platform works without relying on visitors' email clients.

It handles two inquiry types that already exist in the UI:

| Flow | Form | Endpoint | Payload |
|------|------|----------|---------|
| **Product inquiry** | Inquiry drawer (`#inq-form`) | `POST /api/inquiries` | contact + selected products (qty) |
| **Custom design request** | Custom panel (`#custom-form`) | `POST /api/custom-requests` | contact + spec + reference image (upload) |

Submissions are stored in a database and viewable in a password-protected
**admin dashboard** at `/admin` (list, filter, search, detail, status flow, CSV export).

---

## Architecture

```
 Browser (public/index.html)
   │  fetch JSON / multipart
   ▼
┌──────────────────────────────────────────────┐
│  Node.js + Express  (server.js)               │
│   • /api/inquiries        (product inquiry)   │
│   • /api/custom-requests   (custom + image)   │
│   • /api/admin/*          (token-protected)   │
│   • /  /admin  /uploads   (static)            │
│        │                                       │
│        ▼                                       │
│  Storage layer (src/store.js)                  │
│   • better-sqlite3  (default, embedded)        │
│   • JSONL fallback  (if native module absent)  │
│  Optional: nodemailer email notifications      │
└──────────────────────────────────────────────┘
```

**Same-origin by default** — the server serves the front-end and the API from
one port, so no CORS/cookie complications. For a separated front-end host, set
`CORS_ORIGIN` and the `<meta name="api-base">` value in `index.html`.

---

## What changed in the front-end

`public/index.html` was modified (the original design/UI is untouched):

- Added `<meta name="api-base" content="">` (empty = same origin).
- Added `API_BASE` + `API` helpers (`postJSON`, `postForm`) and a `mailtoFallback`.
- `submitInquiry()` now `POST`s to `/api/inquiries` and clears the cart on success.
- `submitCustom()` now `POST`s the form (incl. the reference image) to
  `/api/custom-requests` and resets on success.
- **Resilience:** if the server is unreachable, both forms fall back to the
  original `mailto:` behaviour so a lead is never lost.

---

## API reference

Public endpoints (rate-limited per IP):

| Method | Path | Body | Success |
|--------|------|------|---------|
| `GET` | `/api/health` | — | `{ok, engine, time}` |
| `POST` | `/api/inquiries` | JSON `{name*, company*, email*, country, message, items:[{id,name,qty}]}` | `{ok,id}` |
| `POST` | `/api/custom-requests` | `multipart/form-data` (text fields + `image` ≤ 8 MB) | `{ok,id,imageUrl}` |

Admin endpoints (require `x-admin-token` header **or** `?token=`):

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/admin/inquiries` | query: `type`, `status`, `q`, `page`, `pageSize` |
| `GET` | `/api/admin/inquiries/stats` | counts: total / product / custom / new |
| `GET` | `/api/admin/inquiry/:id` | single record (+ `imageUrl`) |
| `PATCH` | `/api/admin/inquiry/:id/status` | body `{status}` ∈ `new|contacted|quoted|done|archived` |
| `GET` | `/api/admin/export.csv` | CSV export (Excel BOM) |

`*` = required. Invalid input returns `400` with `code:"VALIDATION"`.
Unauthenticated admin access returns `401`.

---

## Run locally

```bash
npm install
cp .env.example .env          # set ADMIN_TOKEN!
node server.js                # or: npm run dev  (auto-reload)
```

- Site:      http://localhost:3000/
- Admin:     http://localhost:3000/admin   (sign in with `ADMIN_TOKEN`)
- Data:      `./data/inquiries.db` (SQLite) — git-ignored
- Uploads:   `./uploads/` — git-ignored

> If `ADMIN_TOKEN` is not set, the server prints a random one at startup
> (for that run only). **Always set it for production.**

---

## Deploy

### Docker (single container)
```bash
docker build -t yuzhou-inquiry .
docker run -d -p 3000:3000 \
  -e ADMIN_TOKEN=$(openssl rand -base64 24) \
  -v $(pwd)/data:/app/data -v $(pwd)/uploads:/app/uploads \
  yuzhou-inquiry
```

### Docker Compose
```bash
cp .env.example .env   # edit ADMIN_TOKEN / domain
docker compose up -d   # health-checked, restarts on failure
```

### PM2 / systemd (VPS)
```bash
npm install --omit=dev
pm2 start ecosystem.config.cjs
pm2 save
```
Place behind Nginx/Caddy (TLS, `proxy_pass http://127.0.0.1:3000;`).

### PaaS (Railway / Render / Fly)
- Build: `npm install` · Start: `node server.js`
- Set env `PORT` (platform-provided), `ADMIN_TOKEN`, `DATA_DIR`/volume.
- Mount a volume for `./data` and `./uploads` so submissions persist.

---

## Admin dashboard

1. Open `/admin`, sign in with `ADMIN_TOKEN`.
2. Stats cards show totals; filter by type/status or search.
3. Click a row for full detail (items list or custom spec + reference image).
4. Change status (`new → contacted → quoted → done / archived`).
5. **Export CSV** downloads all matching rows for CRM/Excel.

---

## Email notifications (optional)

Without SMTP configured, submissions are still stored and visible in admin —
the platform works fully offline. To also email the sales/design team, set in
`.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
`SMTP_FROM`, and `SALES_NOTIFY_EMAIL` / `DESIGN_NOTIFY_EMAIL`.

---

## Notes

- **Product photos:** drop real JPGs into `public/images/products/<id>.jpg`
  (ids: `tr-faceted-peak`, `tr-star-column`, `tr-blue-globe`, `cd-prism-taper`,
  `cd-cube-set`, `cd-twin-arm`, `fr-bevel-57`, `fr-heart-stand`, `fr-wide-land`,
  `or-sailboat`, `or-apple`, `or-iceberg`). Missing images fall back to the
  built-in SVG renderings automatically.
- **Security:** rate-limited write endpoints, 8 MB image cap, image-type
  allow-list, input length caps, token-protected admin, security headers set.
  For production also put it behind HTTPS and set a strong `ADMIN_TOKEN`.
