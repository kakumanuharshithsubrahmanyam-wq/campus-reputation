# Campus Reputation — Backend API

Node.js + Express + TypeScript API for indexing, profiles, verification, and analytics. **On-chain data remains authoritative**; this service uses a read-only Sepolia RPC and never signs token/badge transactions.

## Requirements

- Node.js 18+
- PostgreSQL 16+ (see root `docker-compose.yml`)
- Sepolia RPC URL (no private key required)

## Setup

```bash
cd backend
cp .env.example .env
# Edit JWT_SECRET and DATABASE_URL

# From repo root (with Docker):
docker compose up -d

npm install
npm run prisma:generate
npm run prisma:deploy   # or prisma:migrate for dev
npm run prisma:seed
```

## Commands

| Script | Purpose |
|--------|---------|
| `npm run dev` | API with hot reload (port 4000) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled API |
| `npm test` | Vitest unit tests |
| `npm run indexer` | One-shot blockchain event sync |
| `npm run prisma:studio` | DB browser |

Set `ENABLE_INDEXER_LOOP=true` to sync periodically inside the API process (single instance only).

**Production:** run the API and indexer as **separate processes** (see `../DEPLOYMENT_GUIDE.md`):

- API: `npm run build && npm start`
- Indexer worker: cron/systemd running `npm run indexer` every 1–5 minutes, or `ENABLE_INDEXER_LOOP=true` on a dedicated worker instance (not multiple concurrent indexers).

## Architecture

- **REST:** `/api/v1/*` — see `../BACKEND_API.md`
- **Health:** `GET /health`
- **Auth:** Wallet signature (nonce + `verifyMessage`) → JWT for profile/notifications mutations
- **Indexer:** Chunked event scan with `SyncState`, confirmation depth, dedupe by `txHash+logIndex`

## Frontend compatibility

The existing React app continues to call Sepolia contracts directly. Optional client: `../src/services/api.js` (`VITE_API_URL`).
