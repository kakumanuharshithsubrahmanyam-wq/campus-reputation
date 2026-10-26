# Campus Reputation V2 — Final Production Deployment

## Frontend

| | |
|---|---|
| Provider | Vercel |
| Project | `block-chain-project` |
| URL | https://block-chain-project-rust.vercel.app |

**Production env (public):**

```env
VITE_API_URL=https://campus-reputation.onrender.com
VITE_PUBLIC_APP_URL=https://block-chain-project-rust.vercel.app
VITE_CHAIN_ID=11155111
```

Public profile example:

```text
https://block-chain-project-rust.vercel.app/#/student/<wallet>
```

## Backend

| | |
|---|---|
| Provider | Render |
| URL | https://campus-reputation.onrender.com |
| Health | https://campus-reputation.onrender.com/health |
| Root directory | `backend` |
| Build | `npm ci --include=dev && npm run prisma:generate && npm run build` |
| Start | `npm run prisma:deploy && npm start` |

API base: `/api/v1` (e.g. `/api/v1/leaderboard`, `/api/v1/students/:wallet`).

## Database

| | |
|---|---|
| Provider | Supabase PostgreSQL |
| Project ref | `zakakmezaycdlrlevomb` |
| API URL (not DB) | https://zakakmezaycdlrlevomb.supabase.co |

Migrations applied in production:

- `20251026183000_init`
- `20261026134031_achievement_tx_hash_index`
- `20261026134811_indexer_lock`

**Access model:** MetaMask → backend JWT. No Supabase Auth. No frontend DB access.

## Blockchain

| | |
|---|---|
| Network | Ethereum Sepolia |
| Chain ID | `11155111` |
| CAMP | `0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918` |
| Badge | `0x515677D8B9fe03998173032d7be9a0e7Ee78429c` |

Etherscan base: `https://sepolia.etherscan.io`

## Indexer

| | |
|---|---|
| Runner | GitHub Actions (`.github/workflows/indexer.yml`) |
| Schedule | `*/5 * * * *` (~5 min) |
| Command | `npm run indexer:once:prod` (working-directory: `backend`) |

### GitHub repository secrets (minimum)

| Secret | Required |
|--------|----------|
| `DATABASE_URL` | Yes (Supabase pooler) |
| `SEPOLIA_RPC_URL` | Yes |
| `JWT_SECRET` | Yes (env schema loads on indexer startup) |
| `START_BLOCK` | Optional |

Contract addresses, `CHAIN_ID`, `CONFIRMATION_BLOCKS`, `INDEXER_BLOCK_CHUNK` are set in workflow YAML.

`DIRECT_URL` is **not** required for the indexer job (migrations run on Render start).

`FRONTEND_ORIGIN` is **not** required for the indexer (defaults in `env.ts`).

## Free-tier limitations

- **Render Free:** cold starts after idle; first request may be slow (frontend retries).
- **GitHub Actions:** schedule is approximate; indexing may lag several minutes after on-chain confirm.
- **Supabase Free:** project pause / resource limits on inactivity.

## Member links

| Purpose | URL |
|---------|-----|
| Open app | https://block-chain-project-rust.vercel.app/#/connect |
| API health | https://campus-reputation.onrender.com/health |

## Manual E2E

Coordinated multi-wallet signatures on real devices remain **PARTIAL** (see `E2E_VALIDATION_REPORT.md`).
