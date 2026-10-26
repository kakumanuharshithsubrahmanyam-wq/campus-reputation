# Campus Reputation V2 — Free Deployment Guide

Deploy the full product at **zero required monthly cost** using Vercel, Render, Supabase, and GitHub Actions. Blockchain stays on **Ethereum Sepolia** with existing contracts (no redeploy).

---

## Part 1 — Push to GitHub

1. Create a GitHub repository (or use an existing one).
2. Push this project’s `main` branch.
3. Confirm these paths exist in the repo:
   - Frontend at repo root (`package.json`, `src/`, `index.html`)
   - `backend/` API
   - `backend/prisma/migrations/`
   - `.github/workflows/indexer.yml`

---

## Part 2 — Create Supabase Database

1. Sign in at [supabase.com](https://supabase.com) → **New project** (Free tier).
2. Save the database password securely.
3. Open **Project Settings → Database → Connection string → URI**.
4. Choose **Session mode** (pooler, port **6543**) for the **Render API** — append `?pgbouncer=true` if Prisma recommends it for pooled URLs.
5. For **Prisma migrations** (`migrate deploy`), use the **Direct** connection (port **5432**) once from your laptop or CI if the pooler rejects migrations.

**Example shapes (replace placeholders):**

- Pooled (API / indexer):  
  `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
- Direct (migrations):  
  `postgresql://postgres.[ref]:[PASSWORD]@db.[ref].supabase.co:5432/postgres`

Supabase often requires SSL; the hosted connection string usually includes `sslmode=require`. Do not commit the password.

Copy the chosen URL into `DATABASE_URL` for local migration (Part 3) and later for Render + GitHub secrets.

---

## Part 3 — Run Prisma Production Migration

From your machine (with Node 20+):

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL to Supabase DIRECT URL for migrate deploy
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed   # optional: seeds achievement categories only
```

Verify:

```bash
npx prisma validate
```

**Never** run `prisma migrate dev` against production Supabase.

---

## Part 4 — Deploy Backend to Render

1. [render.com](https://render.com) → **New → Web Service** → connect GitHub repo.
2. Or use **Blueprint** with repo `render.yaml` (API only; secrets still manual).

| Setting | Value |
|--------|--------|
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci && npm run prisma:generate && npm run build` |
| Start command | `npm run prisma:deploy && npm start` |
| Health check path | `/health` |

**Environment variables** (see `FREE_DEPLOYMENT_ENV_CHECKLIST.md`):

| Variable | Notes |
|----------|--------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase pooled URL for runtime |
| `SEPOLIA_RPC_URL` | Your Sepolia HTTPS RPC (PublicNode, Alchemy free tier, etc.) |
| `JWT_SECRET` | Random ≥16 chars — `openssl rand -base64 32` |
| `FRONTEND_ORIGIN` | Set after Vercel deploy (Part 6); until then use placeholder and update in Part 8 |
| `CHAIN_ID` | `11155111` |
| `CAMP_TOKEN_ADDRESS` | `0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918` |
| `BADGE_CONTRACT_ADDRESS` | `0x515677D8B9fe03998173032d7be9a0e7Ee78429c` |
| `CONFIRMATION_BLOCKS` | `3` |
| `ENABLE_INDEXER_LOOP` | `false` |
| `START_BLOCK` | Optional deploy block for full history |

**Health test:** open `https://<your-service>.onrender.com/health` — should return JSON (may show degraded indexer if DB/RPC slow on cold start).

---

## Part 5 — Configure GitHub Actions Indexer

1. Repo → **Settings → Secrets and variables → Actions**.
2. Add secrets (minimum):

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | Same Supabase URL as Render (pooled OK for indexer) |
| `SEPOLIA_RPC_URL` | Same RPC as backend |
| `JWT_SECRET` | Same as Render (required by env parser) |
| `FRONTEND_ORIGIN` | Production Vercel URL (e.g. `https://your-app.vercel.app`) |

Optional: `START_BLOCK` (leave unset if empty in Render).

3. **Actions → Sepolia Indexer → Run workflow** (manual) once.
4. Confirm green run; check logs for `indexer:once finished`.

Schedule: every **5 minutes** (`*/5 * * * *`). Overlapping runs exit safely via DB lock.

---

## Part 6 — Deploy Frontend to Vercel

1. [vercel.com](https://vercel.com) → Import GitHub repo.
2. Framework: **Vite**.

| Setting | Value |
|--------|--------|
| Root directory | `.` (repo root) |
| Build command | `npm run build` |
| Output directory | `dist` |

**Environment variables:**

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://<render-service>.onrender.com` |
| `VITE_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |
| `VITE_CHAIN_ID` | `11155111` |

Redeploy after changing env vars. No `vercel.json` required — app uses **HashRouter** (`/#/...`).

Public profile URL format:  
`https://<your-app>.vercel.app/#/student/0x...`

---

## Part 7 — Connect Domains (Optional)

Custom domain on Vercel → set `VITE_PUBLIC_APP_URL` to that domain and redeploy. Update Render `FRONTEND_ORIGIN` accordingly.

---

## Part 8 — Update Render CORS

Set `FRONTEND_ORIGIN` on Render to your **production** Vercel URL.

- Comma-separated allowed: `https://your-app.vercel.app,http://localhost:5173` for local dev against prod API (optional).
- **Do not** wildcard all `*.vercel.app` in production.
- For a **one-off preview**, temporarily add that exact preview URL, test, then remove.

Restart or redeploy Render after change.

---

## Part 9 — Update Vercel API / Public URLs

Ensure `VITE_API_URL` points to live Render URL and `VITE_PUBLIC_APP_URL` matches the site users open. Trigger Vercel redeploy.

Update GitHub secret `FRONTEND_ORIGIN` to match production frontend URL.

---

## Part 10 — Final Smoke Test

1. Open Vercel URL (cold Render: first load may show “Connecting to Campus Reputation…” then data).
2. **Without wallet:** open `/#/student/<known-wallet>` — profile loads.
3. Connect MetaMask on Sepolia — register if needed, view overview/achievements.
4. Teacher wallet — propose/approve award; after MetaMask confirm, see on-chain success + “updating in a few minutes” until indexer runs.
5. **Verify** page — tx hash: “Confirmed on Sepolia” / “Indexing pending” when appropriate.
6. Owner — Admin → add teacher (on-chain).
7. Render `/health` — OK.
8. GitHub Actions — last indexer run succeeded.

For member-facing steps see `FINAL_USER_TEST_GUIDE.md`. For operations see `OPERATIONS_GUIDE.md`.

---

## Free-tier honesty

- **Render Free** sleeps when idle — first API call may take 30–60+ seconds; frontend retries briefly.
- **GitHub Actions** indexer is not real-time — indexed history may lag **several minutes** after confirmation.
- **Supabase Free** has project pause limits — keep project active for demos.

On-chain confirmation is immediate; database catch-up is scheduled.
