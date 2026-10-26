# Campus Reputation V2 — Free Deployment Plan

**Target stack:** Vercel (frontend) · Render Free (API) · Supabase Postgres · GitHub Actions (indexer every 5 min) · Sepolia (existing contracts)

## Principles

- No architecture change: reads → API/chain; writes → MetaMask → Sepolia
- No new contracts, no mock data, no role overrides
- Backend never signs transactions
- Indexer: **continuous locally**, **sync-once in CI** with DB lock

## Implementation checklist

| # | Item | Status |
|---|------|--------|
| 1 | Render host `0.0.0.0` | Done |
| 2 | `indexer:once` | Done |
| 3 | Indexer lock + migration | Done (`20261026134811_indexer_lock`) |
| 4 | GitHub Actions | Done |
| 5 | API cold start retries | Done |
| 6 | Indexer lag UX + verify pending | Done |
| 7 | Public profile without wallet | Done |
| 8 | Deployment docs | Done — see `FREE_DEPLOYMENT_GUIDE.md` et al. |
| 9 | `render.yaml` | Done |
| 10 | Prisma validate + Supabase notes | Done |

## Deploy order (operator)

1. GitHub repo push  
2. Supabase project → `DATABASE_URL`  
3. `prisma migrate deploy` (local or CI once)  
4. Render backend + env  
5. GitHub Actions secrets + test workflow  
6. Vercel frontend + env  
7. Set `FRONTEND_ORIGIN` on Render to Vercel URL  
8. Smoke test  

## Free-tier UX expectations

- Render cold start → “Connecting to Campus Reputation…” + retries  
- Indexer every 5 min → “Verified on-chain. Campus Reputation is updating.”  
- Manual E2E remains **PARTIAL** until members sign on their devices  
