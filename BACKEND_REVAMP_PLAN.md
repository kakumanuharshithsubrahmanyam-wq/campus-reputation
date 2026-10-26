# Campus Reputation — Backend Revamp Plan

**Date:** 26 October 2026  
**Basis:** `CURRENT_PROJECT_FEATURE_AUDIT.md` + existing `config.js` ABIs/addresses  
**Constraint:** Frontend direct MetaMask → contract writes unchanged; Sepolia contracts unchanged.

---

## 1. Current architecture

```text
React (Vite) ──ethers.js + MetaMask──► Sepolia (Token + Badge contracts)
                no server, no DB, event scans in browser
```

- Read/write txs: client-side only.
- Leaderboard/activity: `queryFilter` on every load.
- Profiles: on-chain `studentNames` only.
- Verification: QR → Etherscan (no API).

---

## 2. Proposed architecture (V2)

```text
React Frontend
  │ reads (optional migration)     writes (unchanged)
  ▼                                  ▼
Backend API (Express + TS)          MetaMask → Contracts
  │
  ├── PostgreSQL (Prisma): profiles, achievements metadata, events, notifications
  ├── In-memory cache (Redis-ready): leaderboard, public profiles, stats
  └── Blockchain service (read-only RPC): balanceOf, roles, indexer
```

**Source of truth:** On-chain for balances, roles, proposals, badge ownership, award execution.  
**Off-chain:** Display metadata, evidence URLs, search, notifications, indexed event copies, preferences.

---

## 3. Files to add

| Path | Purpose |
|------|---------|
| `/backend/**` | API, services, blockchain layer, Prisma |
| `/docker-compose.yml` | PostgreSQL for local dev |
| `/src/services/api.js` | Optional thin fetch client (no UI changes) |
| `BACKEND_API.md` | REST documentation |
| `BACKEND_REVAMP_COMPLETE.md` | Post-implementation summary |

## 4. Files to modify (minimal)

| Path | Change |
|------|--------|
| `.gitignore` | Ignore `backend/.env`, `backend/dist`, `backend/node_modules` |
| Root `package.json` | Optional `workspaces` or scripts — **avoid**; backend is self-contained |

**No changes** to `*.jsx`, `index.css`, or existing `config.js` contract addresses.

---

## 5. Migration strategy

1. Deploy backend + Postgres alongside existing frontend.
2. Run indexer from `START_BLOCK` (env) to backfill `BlockchainEvent` + `Achievement`.
3. Frontend continues direct contract calls; new UI consumes `/api/v1/*` when ready.
4. Profile PATCH requires wallet signature auth; chain name still via `registerStudent` on client.

---

## 6. API design summary

- Prefix: `/api/v1`
- Envelope: `{ success, data }` / `{ success: false, error: { code, message } }`
- Public: health, leaderboard, activity, verify, public profiles, search (scoped)
- Wallet JWT: profile mutations, notifications mark-read, evidence attach
- Admin: `GET /api/v1/admin/stats` — owner verified via `owner()` on-chain

---

## 7. Database schema (Prisma)

Models: `StudentProfile`, `TeacherProfile`, `Achievement`, `AchievementCategory`, `Notification`, `BlockchainEvent`, `SyncState`, `UserPreference`, `AuthNonce`, `BalanceSnapshot` (cache), `WalletRoleCache` (optional teacher flag TTL).

Unique: `walletAddress` (normalized lowercase storage), `publicSlug`, `transactionHash+logIndex` on events.

---

## 8. Blockchain sync

- Read-only `JsonRpcProvider(SEPOLIA_RPC_URL)`.
- Chunk size: `INDEXER_BLOCK_CHUNK` (default 1000).
- Cursor: `SyncState` per contract.
- Index through `latest - CONFIRMATION_BLOCKS`.
- Re-scan tail window for reorg safety (reprocess block range if `blockHash` mismatch).
- Events: `TokensAwarded`, `StudentRegistered`, `BadgeMinted`, `AwardProposed`, `AwardApproved`, `TeacherAdded`, `TokensDecayed`.

Derived: `Achievement` from `TokensAwarded`; notifications from award/proposal events.

---

## 9. Security model

- No private keys in backend.
- SIWE-lite: nonce → sign → `verifyMessage` → JWT (short-lived).
- Admin: JWT + live `owner()` check.
- Teacher role for sensitive reads: `authorizedTeachers()` when needed.
- Helmet, CORS (`FRONTEND_ORIGIN`), rate limits, Zod validation, Pino logging (redact secrets).

---

## 10. Environment variables

See `backend/.env.example`. Required: `DATABASE_URL`, `SEPOLIA_RPC_URL`, `JWT_SECRET`. Optional: `START_BLOCK`, `CONFIRMATION_BLOCKS`, `INDEXER_BLOCK_CHUNK`, `ENABLE_INDEXER_LOOP`.

---

## 11. Frontend compatibility

- Zero required frontend changes.
- `src/services/api.js` provides optional helpers pointing to `VITE_API_URL` or `http://localhost:4000`.
- Contract addresses in `config.js` remain canonical for writes.

---

## 12. Balance strategy (Phase 14)

- **Authoritative:** `balanceOf` via RPC for single-student endpoints.
- **Leaderboard:** Batch `balanceOf` for wallets discovered from DB (indexed students + achievements), sorted in service layer; **in-memory cache** 60s TTL.
- **BalanceSnapshot:** Updated during indexer tail pass for indexed wallets (documented fallback if RPC fails on read).

---

## Implementation order

Plan (this doc) → backend scaffold → Prisma → blockchain layer → indexer → APIs → auth → tests → docs → verification.
