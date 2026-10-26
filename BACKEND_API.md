# Campus Reputation — Backend API (v1)

Base URL: `http://localhost:4000` (default)

## Response envelope

**Success:** `{ "success": true, "data": { ... } }`  
**Error:** `{ "success": false, "error": { "code": "...", "message": "..." } }`

## Authentication

| Type | Usage |
|------|--------|
| **Public** | Most GET endpoints |
| **Wallet JWT** | `Authorization: Bearer <token>` after `/auth/verify` |
| **Owner** | JWT + on-chain `owner()` match for `/admin/stats` |

### Wallet sign-in

1. `GET /api/v1/auth/nonce?address=0x...` → `{ nonce, message, expiresAt }`
2. Sign `message` in MetaMask
3. `POST /api/v1/auth/verify` body `{ "address", "signature" }` → `{ token, address }`

---

## Health & system

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | API, DB, RPC, chainId, blocks |
| GET | `/api/v1/system/status` | Public | Frontend-friendly status |

---

## Students

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/students/:wallet` | Public | Profile + **on-chain** balance, level, badges, rank |
| GET | `/api/v1/students/:wallet/achievements` | Public | Paginated indexed achievements |
| GET | `/api/v1/students/:wallet/badges` | Public | **on-chain** `hasBadge` |
| GET | `/api/v1/students/:wallet/activity` | Public | Indexed events for student |
| GET | `/api/v1/students/:wallet/reputation` | Public | **on-chain** balance + level |

Query: `page`, `limit` (max 100)

---

## Profiles (off-chain metadata)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/profile/:wallet` | Public (respects `isPublic`) |
| GET | `/api/v1/profile/slug/:slug` | Public |
| PATCH | `/api/v1/profile` | Wallet JWT |
| PATCH | `/api/v1/profile/preferences` | Wallet JWT |

---

## Achievements

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/achievements` | Public — filters: `student`, `teacher`, `category`, `status`, `fromDate`, `toDate` |
| GET | `/api/v1/achievements/:id` | Public — includes `verificationSource: "onchain"` |
| PATCH | `/api/v1/achievements/:id/evidence` | Wallet JWT (student only) — body `{ "evidenceUrl": "https://..." \| "ipfs://..." }` |

---

## Leaderboard & activity

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/leaderboard` | Public — `page`, `limit`, `department`, `year` |
| GET | `/api/v1/activity` | Public — `student`, `teacher`, `eventType` |

Ranking uses **live on-chain balances** for known wallets (cached 60s). Run indexer to populate achievements/events.

---

## Verification (reputation / achievements — not PDF certificates)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/verify/wallet/:address` | Public |
| GET | `/api/v1/verify/transaction/:hash` | Public |
| GET | `/api/v1/verify/achievement/:id` | Public |

---

## Search & notifications

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/search?q=` | Public — paginated |
| GET | `/api/v1/notifications` | Wallet JWT |
| PATCH | `/api/v1/notifications/:id/read` | Wallet JWT |
| PATCH | `/api/v1/notifications/read-all` | Wallet JWT |

---

## Teachers & admin

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/teachers` | Public |
| GET | `/api/v1/teachers/:wallet` | Public — includes **on-chain** `authorizedOnChain` |
| GET | `/api/v1/teachers/:wallet/activity` | Public |
| GET | `/api/v1/teacher/proposals` | Public — reads contract `proposals` |
| GET | `/api/v1/admin/stats` | Owner JWT + **on-chain** owner check |

---

## Blockchain writes

**Not exposed.** Teachers/students continue to use MetaMask → existing Sepolia contracts from the React app.

---

## Example

```bash
curl "http://localhost:4000/api/v1/verify/wallet/0xYourAddress"
curl "http://localhost:4000/api/v1/leaderboard?limit=10&page=1"
```
