# Campus Reputation V2 — Deployment Guide

Multi-device production model: each user signs with **their own MetaMask**; shared backend, PostgreSQL, and indexer. The backend **never** signs blockchain transactions.

---

## Architecture

```text
Static frontend (Vite build)  →  Backend API  →  PostgreSQL
Frontend  →  MetaMask  →  Sepolia contracts
Sepolia events  →  Indexer worker  →  PostgreSQL
```

**Router:** `HashRouter` (`#/…` routes). No SPA rewrite required on static hosts (S3, Netlify, etc.). If you switch to `BrowserRouter`, configure fallback to `index.html`.

---

## Contracts (Sepolia)

| | Address |
|---|---------|
| CAMP token | `0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918` |
| Badge | `0x515677D8B9fe03998173032d7be9a0e7Ee78429c` |

Chain ID: **11155111**

---

## Frontend

### Environment (`.env.production` or host env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend origin, e.g. `https://api.campus-reputation.example.com` |
| `VITE_CHAIN_ID` | Yes | `11155111` |
| `VITE_PUBLIC_APP_URL` | Yes (prod) | Public app URL for QR/share, e.g. `https://campus-reputation.example.com` (no trailing slash) |

See [`.env.example`](.env.example).

### Build

```bash
npm install
npm run build
```

Output: **`dist/`** — deploy as static files.

### CORS

Set backend `FRONTEND_ORIGIN` to your deployed frontend URL (see Backend).

---

## Backend

### Environment

Copy [`backend/.env.example`](backend/.env.example) → `backend/.env`. **Do not commit `.env`.**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SEPOLIA_RPC_URL` | Read-only Sepolia RPC |
| `CHAIN_ID` | `11155111` |
| `CAMP_TOKEN_ADDRESS` / `BADGE_CONTRACT_ADDRESS` | Deployed contracts |
| `JWT_SECRET` | Long random secret (≥16 chars) |
| `FRONTEND_ORIGIN` | Allowed CORS origin(s), comma-separated |
| `START_BLOCK` | Contract deploy block (recommended for full history) |
| `CONFIRMATION_BLOCKS` | Default `3` |
| `PORT` | Default `4000` |
| `ENABLE_INDEXER_LOOP` | `true` only on a **single** dedicated worker |

### Build & run API

```bash
cd backend
npm install
npm run prisma:generate
npm run build
npm start
```

Development: `npm run dev`

### Health

- `GET /health` — database, RPC, indexer lag (no secrets)
- `GET /api/v1/system/status` — detailed sync state

---

## PostgreSQL

Use managed Postgres or Docker (root `docker-compose.yml` for local dev).

Create database and user matching `DATABASE_URL`.

---

## Prisma (production)

**Use migrate deploy, not migrate dev:**

```bash
cd backend
npm run prisma:deploy
```

Optional seed (categories only): `npm run prisma:seed`

---

## Indexer (production worker)

The indexer must run **continuously or on a schedule**. Do not rely on manual one-off runs after launch.

### Option A — Cron / systemd (recommended)

Every 1–5 minutes:

```bash
cd /path/to/backend && npm run indexer
```

Ensure only **one** indexer runs at a time.

### Option B — Loop inside API process

On **one** instance only:

```env
ENABLE_INDEXER_LOOP=true
INDEXER_INTERVAL_MS=60000
```

Do not enable on multiple horizontally scaled API replicas.

### After deploy

Set `START_BLOCK` to the CAMP contract deployment block, then run indexer until `/health` shows indexer `status: healthy` (low lag).

---

## CORS configuration

```env
FRONTEND_ORIGIN=https://campus-reputation.example.com
```

Multiple origins (e.g. preview + prod):

```env
FRONTEND_ORIGIN=https://app.example.com,https://preview.example.com
```

---

## Post-deploy smoke test

No blockchain mutation required:

1. Open deployed frontend — public pages load.
2. `GET <API>/health` — `database: connected`, `blockchain: connected`.
3. Connect MetaMask on Sepolia — role matches contract.
4. Student overview loads (API or on-chain fallback).
5. Teacher wallet — `/teacher` accessible; student wallet — denied.
6. Public profile `#/student/0x…` loads.
7. Leaderboard, activity, verify pages load.
8. Indexer lag acceptable on `/health`.

Coordinated E2E (register → propose → approve) remains per [E2E_VALIDATION_STRATEGY.md](./E2E_VALIDATION_STRATEGY.md).

---

## Security checklist

- [ ] Strong `JWT_SECRET` in production
- [ ] `.env` not in git
- [ ] `FRONTEND_ORIGIN` restricted (not `*`)
- [ ] HTTPS on frontend and API
- [ ] No private keys on server
- [ ] `VITE_*` treated as public

---

## API reference

See [BACKEND_API.md](./BACKEND_API.md).
