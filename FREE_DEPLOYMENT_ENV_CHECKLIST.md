# Free Deployment — Environment Checklist

Mark each variable **PUBLIC** (safe in client/build logs) or **SECRET** (never commit).

---

## Frontend (Vercel)

| Variable | PUBLIC / SECRET | Required | Description |
|----------|-----------------|----------|-------------|
| `VITE_API_URL` | PUBLIC | Yes | Render API origin, no trailing slash |
| `VITE_PUBLIC_APP_URL` | PUBLIC | Yes (prod) | Site URL for QR/share links |
| `VITE_CHAIN_ID` | PUBLIC | Yes | `11155111` (Sepolia) |

Contract addresses are bundled in frontend config from repo — not secret.

---

## Backend (Render)

| Variable | PUBLIC / SECRET | Required | Description |
|----------|-----------------|----------|-------------|
| `NODE_ENV` | PUBLIC | Yes | `production` |
| `DATABASE_URL` | SECRET | Yes | Supabase PostgreSQL URI |
| `SEPOLIA_RPC_URL` | SECRET* | Yes | HTTPS RPC URL (*URL may embed API key) |
| `CHAIN_ID` | PUBLIC | Yes | `11155111` |
| `CAMP_TOKEN_ADDRESS` | PUBLIC | Yes | `0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918` |
| `BADGE_CONTRACT_ADDRESS` | PUBLIC | Yes | `0x515677D8B9fe03998173032d7be9a0e7Ee78429c` |
| `JWT_SECRET` | SECRET | Yes | Min 16 chars; `openssl rand -base64 32` |
| `FRONTEND_ORIGIN` | PUBLIC | Yes | Vercel production URL; comma-separated list OK |
| `PORT` | PUBLIC | Auto | Set by Render |
| `START_BLOCK` | PUBLIC | No | First block to index; empty = from SyncState / 0 |
| `CONFIRMATION_BLOCKS` | PUBLIC | No | Default `3` |
| `INDEXER_BLOCK_CHUNK` | PUBLIC | No | Default `1000` |
| `ENABLE_INDEXER_LOOP` | PUBLIC | Yes (Render) | `false` — use GitHub Actions indexer |
| `JWT_EXPIRES_IN` | PUBLIC | No | Default `24h` |
| `NONCE_TTL_MINUTES` | PUBLIC | No | Default `10` |

---

## GitHub Actions (Indexer workflow)

| Variable | PUBLIC / SECRET | Required | Description |
|----------|-----------------|----------|-------------|
| `DATABASE_URL` | SECRET | Yes | Same as Render |
| `SEPOLIA_RPC_URL` | SECRET | Yes | Same as Render |
| `JWT_SECRET` | SECRET | Yes | Same as Render (env schema) |
| `FRONTEND_ORIGIN` | PUBLIC | Yes | Production frontend URL |
| `START_BLOCK` | PUBLIC | No | Omit secret if unused |

Workflow sets in YAML (PUBLIC): `CHAIN_ID`, contract addresses, `CONFIRMATION_BLOCKS`, `INDEXER_BLOCK_CHUNK`.

---

## Generate JWT_SECRET

```bash
openssl rand -base64 32
```

Store only in Render and GitHub Secrets — never in git.

---

## Example public Sepolia RPC (replace in production)

Documented example only — set `SEPOLIA_RPC_URL` in dashboards:

`https://ethereum-sepolia-rpc.publicnode.com`

Use a provider with adequate rate limits for indexer + API.
