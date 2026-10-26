# Render — Backend deploy settings (read this if deploy fails)

The API lives in **`backend/`** (Structure A). The repo root **`package.json` is Vite frontend only** — do not use repo root as the Render web service root unless you only want to build the frontend.

## Required Render dashboard settings

| Field | Value |
|--------|--------|
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm ci && npm run prisma:generate && npm run build` |
| **Start Command** | `npm run prisma:deploy && npm start` |
| **Health Check Path** | `/health` |

### Never use as Start Command

- `src` (invalid — causes `bash: src: command not found`)
- `npm run dev`
- repo root with no `rootDir`

## What `npm start` runs (backend)

From `backend/package.json`:

```text
node dist/index.js
```

Entry source: `backend/src/index.ts` → compiled to `backend/dist/index.js`.

## Blueprint

`render.yaml` at repo root sets `rootDir: backend` and the commands above. If you created the service manually, align the dashboard with this doc or **sync from Blueprint**.

## Environment variables

See `RENDER_ENV_REQUIRED.md` (no secrets in git).

## Verify after deploy

```text
GET https://<your-service>.onrender.com/health
```

Should return JSON, not `Not Found`.
