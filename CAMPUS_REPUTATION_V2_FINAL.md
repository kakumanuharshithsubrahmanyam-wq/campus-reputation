# Campus Reputation V2 — Final Product Document

Authoritative technical overview for Campus Reputation V2 (Sepolia demo / college project).

---

## Product Summary

Campus Reputation records student achievements and **CAMP** reputation on **Ethereum Sepolia**, with a React web app for students, teachers, and contract owners. Reads come from the API (indexed chain data) with selective on-chain fallback; **writes always go through MetaMask** to deployed smart contracts.

---

## Architecture

```text
Users → Vercel (React/Vite, HashRouter)
          → Render (Express API + Prisma)
          → Supabase PostgreSQL
Users → MetaMask → Sepolia (CAMP + Badge contracts)

GitHub Actions (cron ~5 min) → indexer:once → Sepolia RPC → PostgreSQL
```

---

## Roles

| Role | Source of truth |
|------|-----------------|
| Student | Registered on CAMP token contract |
| Teacher | `authorizedTeachers(address)` on CAMP token |
| Owner | `owner()` on CAMP token |

JWT authenticates API sessions after wallet signature; **roles are not stored as trusted server overrides**.

**Satvika:** Live contract has `authorizedTeachers(Satvika) = true`; app shows Teacher. Documentation that listed Satvika as student-only is outdated relative to chain state.

---

## User Flows

- **Student:** connect → Sepolia → register → profile → view CAMP, achievements, badges, activity, leaderboard → proof/verify → public profile + QR.
- **Teacher:** connect → propose award → peer approvals → on-chain execution.
- **Owner:** admin dashboard → add teacher via on-chain `addTeacher`.
- **Public:** `/#/student/0x...` without wallet.

---

## Blockchain Contracts (Sepolia — do not redeploy)

| | Address |
|---|---------|
| CAMP token | `0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918` |
| Badge | `0x515677D8B9fe03998173032d7be9a0e7Ee78429c` |
| Chain ID | `11155111` |

---

## Backend

- **Stack:** Node 20, Express, TypeScript, Prisma, ethers v6.
- **Auth:** nonce + EIP-191 sign → JWT.
- **CORS:** `FRONTEND_ORIGIN` comma-separated allowlist.
- **Health:** `GET /health` (non-blocking).
- **Indexer loop:** optional via `ENABLE_INDEXER_LOOP` (off on Render Free).

---

## Database

PostgreSQL via Prisma: profiles, achievements (unique `transactionHash + logIndex`), notifications, sync state, indexer lock.

Production migrations: `npm run prisma:deploy`.

---

## Indexer

- **Continuous:** `npm run indexer` (local/long-running).
- **Scheduled:** `npm run indexer:once` / `indexer:once:prod` (GitHub Actions).
- **Lock:** `IndexerLock` prevents concurrent scheduled runs; stale lock recovery.
- **Idempotent:** replays safe; per-event error isolation.

---

## Verification

API verifies transaction hashes against indexed data and chain. UI distinguishes **confirmed on Sepolia + indexing pending** vs not found.

---

## Security

- No server-side transaction signing.
- JWT secret and DB URL in host secrets only.
- Rate limits on API; validated addresses.
- No unrestricted CORS on authenticated routes.

---

## Deployment

See `FREE_DEPLOYMENT_GUIDE.md`, `FREE_DEPLOYMENT_ENV_CHECKLIST.md`, `render.yaml`, `.github/workflows/indexer.yml`.

---

## Known Free-Tier Limitations

- Render Free cold starts (slow first API).
- Supabase Free project limits / pause.
- Indexer every ~5 minutes → minutes of lag for history UI.
- Public RPC rate limits may cause occasional indexer failures (retry on next run).

---

## E2E Status

- **Software:** deployment-ready (builds, tests, indexer idempotency verified locally).
- **Manual multi-device E2E:** **PARTIAL** — requires real members signing on their own devices (see `E2E_VALIDATION_REPORT.md`).

---

## Future Mainnet Considerations

- Redeploy contracts; update addresses and `START_BLOCK`.
- Paid RPC and always-on API/indexer.
- Stricter secret rotation and monitoring.
- Gas and real ETH for users.
