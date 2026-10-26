# Campus Reputation V2 — Operations Guide

For admins maintaining the free-tier deployment.

---

## Health check

- **URL:** `GET https://<render-api>/health`
- Should return quickly with JSON status.
- May report degraded components (DB/RPC/indexer lag) without hanging.
- Use Render dashboard health checks on this path.

---

## GitHub Actions indexer

- Workflow: **Sepolia Indexer** (`.github/workflows/indexer.yml`)
- Schedule: every 5 minutes
- **Manual run:** Actions → Sepolia Indexer → Run workflow

Success log ends with `indexer:once finished`. Exit code 0.

If a run fails (RPC/DB):

- SyncState should not advance on fatal DB errors.
- Next scheduled run resumes from last stored block.
- Overlap: second job exits if lock held; stale locks expire after timeout.

---

## Manual indexer (local)

```bash
cd backend
npm run indexer:once
```

Production compiled:

```bash
npm run build && npm run indexer:once:prod
```

---

## Supabase database

- Dashboard → **Table Editor** or SQL for `Achievement`, `SyncState`, `IndexerLock`.
- Pause/resume: free tier may auto-pause inactive projects — wake before demos.
- Migrations: always `npm run prisma:deploy` with **direct** connection if pooler fails.

---

## Render logs

- Dashboard → service → **Logs**
- Cold start: first request after idle triggers wake — normal on Free tier.
- Crashes: check `DATABASE_URL`, `JWT_SECRET`, invalid env.

---

## Vercel deployment

- Dashboard → project → **Deployments**
- Env changes require **Redeploy**
- Preview URLs: add specific preview to `FRONTEND_ORIGIN` only when testing; remove after.

---

## Update frontend origin (CORS)

1. Edit `FRONTEND_ORIGIN` on Render (comma-separated if multiple).
2. Match GitHub secret `FRONTEND_ORIGIN` for indexer env validation.
3. Redeploy/restart if needed.

---

## Rotate JWT_SECRET

1. Generate new secret (`openssl rand -base64 32`).
2. Update Render + GitHub Actions secrets.
3. Redeploy Render; users must **sign in again** (old tokens invalid).

---

## Change RPC URL

Update `SEPOLIA_RPC_URL` on Render and GitHub secrets. No code change.

---

## Interpreting indexer lag

- `GET /health` may include indexer/sync hints.
- Users see “Campus Reputation is updating” after on-chain confirm until next indexer run.
- Typical lag: up to ~5–10 minutes under default schedule.

---

## Render cold starts

- Frontend retries API briefly with “Connecting to Campus Reputation…”
- If persistent failure after retries, user sees Retry — check Render service status and `/health`.

---

## Satvika wallet note

On-chain `authorizedTeachers` for Satvika’s wallet is **true** — the app correctly shows Teacher. Contract is authority; do not override in app config.

---

## Security reminders

- No private keys in repo or Render env.
- Do not enable `ENABLE_INDEXER_LOOP` on Render Free alongside GitHub indexer unless you accept duplicate work (keep loop **false**).
- Rate limiting and wallet JWT auth remain on API mutations.
