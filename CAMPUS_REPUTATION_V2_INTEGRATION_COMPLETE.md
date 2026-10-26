# Campus Reputation V2 — Integration Complete

## Architecture

```
React Frontend (V2 UI, /src)
  ├─ READS  → Backend API (http://localhost:4000, VITE_API_URL)
  └─ WRITES → MetaMask → Sepolia → CAMP + Badge contracts

Backend (Express + Prisma + indexer)
  ├─ PostgreSQL (achievements, profiles, events, notifications)
  └─ Sepolia RPC (read-only balances, levels, proposals, verification)

Blockchain source of truth: CAMP balance, reputation level, badge ownership,
teacher authorization, owner, register/propose/approve/addTeacher/claimBadge.
```

## Frontend — connected screens

| Route | Data source |
|-------|-------------|
| `/connect` | MetaMask |
| `/` Overview | Student aggregate, achievements, activity APIs + on-chain fallback |
| `/achievements`, `/reputation`, `/badges` | Student APIs + on-chain badges/claim |
| `/leaderboard`, `/activity`, `/verify` | Public APIs |
| `/profile` | Student + PATCH profile (JWT) |
| `/student/:wallet` | Public profile + student aggregate |
| `/teacher/*` | On-chain proposals + transactions (guarded) |
| `/admin/*` | Admin stats API + on-chain `addTeacher` (owner guard) |

## Backend APIs used

Auth nonce/verify, students aggregate, achievements, activity, leaderboard, search, notifications, verify (wallet/tx/achievement), teachers, teacher proposals, admin stats, profile GET/PATCH.

## Blockchain reads/writes

**Reads (browser):** `balanceOf`, `getReputationLevel`, `studentNames`, `authorizedTeachers`, `owner`, `proposals`, `hasApproved`, `hasBadge`  
**Writes (MetaMask):** `registerStudent`, `proposeAward`, `approveAward`, `addTeacher`, `claimBadge`

Addresses unchanged: CAMP `0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918`, Badge `0x515677D8B9fe03998173032d7be9a0e7Ee78429c`.

## Authentication

Connect wallet → optional `GET /auth/nonce` → sign message → `POST /auth/verify` → JWT in localStorage. Session cleared on account change. Required for profile edit, notifications, admin stats.

## Roles

- **Student:** default connected wallet  
- **Teacher:** `authorizedTeachers(address)` on CAMP contract  
- **Owner/Admin:** `owner()` match — admin nav without requiring teacher flag (owner also sees teacher nav for operational flows)

**No hardcoded allowlists in the app.** UI gates use live `fetchRoles()` (`authorizedTeachers` + `owner()`). Address comparisons use ethers `getAddress` via `src/utils/address.js`.

### Known MetaMask test wallets (Sepolia verification)

Verified against CAMP `0xF2c2bC22de5df5e95F5bB27b65E53b569E83d918` on **2026-10-26** (`node scripts/verify-test-wallet-roles.mjs`, RPC `ethereum-sepolia-rpc.publicnode.com`).

| Name | Address | Expected (docs) | Contract `authorizedTeachers` | Contract `owner()` | App behavior |
|------|---------|-----------------|--------------------------------|--------------------|--------------|
| Bhavana | `0x8B4e61B525376Cd9e85f7B846453610e963c1eC7` | Teacher | **true** | false | Teacher nav; no Admin |
| Akhil | `0x5cdCDb9B9869F53eBBCDB22Cb7e80fB915D0093C` | Teacher | **true** | false | Teacher nav; award + approve |
| Subbu | `0x2Ab4d7C729E2F6937D40be3CBf346fd1e8592Fc1` | Teacher | **true** | **true (owner)** | Teacher **and Admin** nav (owner wallet) |
| Sakshi | `0xFd14a15D308627804a9044e12088838F47A45d2e` | Student | false | false | Student only; `/teacher/*` and `/admin/*` blocked |
| Satvika | `0xF8CF0cDD71Ae7032bB52FDA88B91e98a03d068ED` | Student | **true** | false | **Mismatch:** app shows **Teacher** nav (contract is authoritative). Use Sakshi or Jashwanth for pure student E2E until on-chain role is revoked. |
| Jashwanth | `0xc4cBd1734F69899aAdcc77527a0b5801F95F816E` | Student | false | false | Student only |

**Documented mismatch:** Satvika — expected Student in test docs, but `authorizedTeachers(0xF8CF0cDD71Ae7032bB52FDA88B91e98a03d068ED) === true`. The UI correctly treats this wallet as a teacher; do not hardcode an exception.

### E2E validation (multi-device)

Each member signs on **their own device/wallet** — no shared seed phrases or account switching. See **[E2E_VALIDATION_STRATEGY.md](./E2E_VALIDATION_STRATEGY.md)** and **[E2E_VALIDATION_REPORT.md](./E2E_VALIDATION_REPORT.md)** for:

- **AUTOMATED VERIFIED** vs **COORDINATED MANUAL VERIFIED** vs **PENDING MANUAL USER SIGNATURE**
- Coordinated flow: student register → teacher propose → second teacher approve → indexer → student refresh on another device
- Cross-device checks (API/indexer/chain, not browser-local mocks)

Re-run role checks anytime:

```bash
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com node scripts/verify-test-wallet-roles.mjs
```

## Removed mocks

V2 pages no longer import `src/data.js` for live routes. Mock file may remain unused; nested duplicate `src/src/` is obsolete.

## Unsupported / honest UX

- No on-chain **reject** for proposals — UI removed reject action  
- **Platinum** not an on-chain level — copy references Gold max  
- Teacher **name/dept** on add-teacher is not written on-chain (only `addTeacher(address)`)  
- Award **category/title** encoded in on-chain `reason` string only  
- Charts/trends on overview simplified to indexed achievement breakdown (no fake 6-month trend)

## Environment variables

Frontend: `VITE_API_URL`, optional `VITE_CHAIN_ID` (see `.env.example`).  
Backend: see `backend/.env.example` (DATABASE_URL, RPC, JWT secret — not in frontend).

## Testing (this environment)

| Check | Result |
|-------|--------|
| `npm run build` (frontend) | Pass |
| `npm run build` + `npm test` (backend) | Pass (7 tests) |
| PostgreSQL / Docker | Not run in agent env — full API/indexer requires local DB |
| Manual MetaMask E2E | Required on developer machine |

## Known limitations

- Indexer lag: after tx confirm, UI shows confirmation message; lists update when indexer catches up  
- Search/notifications need backend + DB populated  
- Leaderboard only includes wallets known to DB with positive on-chain balance  

## Future improvements

- **Frontend:** code-split ethers, click-outside for search/notifications dropdowns, achievement detail verify deep link  
- **Backend:** POST teacher profile after `addTeacher`, proposal metadata association  
- **Contracts:** explicit reject, richer achievement metadata on-chain  
