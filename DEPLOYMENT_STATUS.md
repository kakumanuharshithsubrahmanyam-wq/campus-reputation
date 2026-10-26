# Deployment Status

Last updated: 2026-10-26 (production verification)

## Supabase database

**PASS** — Render logs confirm Session Pooler connection; migrations applied.

## Prisma migrations

**PASS** — `20251026183000_init`, `20261026134031_achievement_tx_hash_index`, `20261026134811_indexer_lock`

## Render backend

**PASS** — https://campus-reputation.onrender.com

## Render health endpoint

**PASS** — HTTP 200; `database: connected`, `rpc: ok`, `chainId: 11155111`

## Vercel frontend

**PASS** — https://block-chain-project-rust.vercel.app (production redeploy with `VITE_API_URL`)

## Frontend → backend

**PASS** — Production bundle calls `campus-reputation.onrender.com`; API smoke tests OK

## CORS

**PASS** — `access-control-allow-origin: https://block-chain-project-rust.vercel.app`, credentials enabled

## Public profile

**PASS** — Loads without MetaMask; shows CAMP/level when API reachable (hard refresh may be needed once after env change)

## MetaMask connect

**PENDING MANUAL USER SIGNATURE** — requires real wallet in browser

## Wallet authentication

**AUTOMATED VERIFIED** (nonce endpoint) / **PENDING MANUAL USER SIGNATURE** (full sign-in)

## GitHub Actions indexer

**CONFIGURATION REQUIRED** — workflow updated; add secrets and run `workflow_dispatch` (see `FINAL_PRODUCTION_DEPLOYMENT.md`)

## Indexer one-shot (production)

**PENDING** — until GitHub secrets configured and workflow succeeds; `SyncState` empty until first successful run

## Indexer idempotency

**PASS** (local history) / **PENDING** (production DB from CI)

## QR production URL

**PASS** — `VITE_PUBLIC_APP_URL` → `https://block-chain-project-rust.vercel.app/#/student/...`

## Sepolia verification

**PASS** — Etherscan links use `sepolia.etherscan.io`; chain ID 11155111 on API

## Manual multi-device E2E

**PARTIAL**

---

Production deployment is **complete** for hosted infrastructure. Remaining: GitHub indexer secrets + manual wallet flows + coordinated member E2E.
