# Campus Reputation V2 — E2E Validation Strategy

## Production operating model

Campus Reputation is **multi-user and multi-device**. Each member uses **their own MetaMask wallet on their own device**. No tester should switch accounts inside one MetaMask profile, and **no one should share** private keys, seed phrases, MetaMask passwords, or wallet exports.

All devices talk to the **same shared services**:

- Campus Reputation frontend (deployed URL or shared dev host)
- Backend API
- PostgreSQL
- Event indexer
- Ethereum Sepolia contracts (single source of truth for writes and on-chain reads)

**Role detection** always comes from the live contract (`authorizedTeachers`, `owner()`). **Reads** for lists, achievements, activity, and leaderboard come from the **backend + indexer**, not from browser-local mock data.

---

## Verification categories

| Category | Meaning |
|----------|---------|
| **AUTOMATED VERIFIED** | CI/agent can confirm without wallet access (builds, tests, RPC, health, role scripts, API shape). |
| **COORDINATED MANUAL VERIFIED** | A named member signed on **their device**; evidence recorded (wallet, tx hash, block, API snapshot). |
| **PENDING MANUAL USER SIGNATURE** | Step not done yet; **not a FAIL** — waiting for the correct member to sign locally. |
| **FAIL** | Automated check failed, or manual step completed but **chain/API/UI disagree** (bug). |

Never mark **PENDING MANUAL USER SIGNATURE** as **FAIL**.

---

## Coordinated E2E playbook (recommended)

Use **distinct devices/browsers** (or distinct team members). Record wallet addresses and tx hashes in `E2E_VALIDATION_REPORT.md`.

### Path A — Complete existing proposal #7 (if still open)

| Step | Actor | Device | Action |
|------|--------|--------|--------|
| 1 | Sakshi | Student device | Connect Sepolia → register if `RegisterGate` shows → note wallet `0xFd14…` |
| 2 | Akhil **or** Bhavana | Teacher device | Connect → `/teacher/approvals` → approve **proposal #7** (proposer Satvika cannot self-approve) |
| 3 | Operator | Server | Run indexer until `/health` lag is minimal |
| 4 | Sakshi | Student device | Refresh → verify CAMP, achievements, activity, proof, `/verify` |

### Path B — New award (preferred for clean coordinated demo)

| Step | Actor | Device | Action |
|------|--------|--------|--------|
| 1 | Student (e.g. Sakshi) | Student device | Connect → register → share **wallet address** with faculty (chat/ticket — not keys) |
| 2 | Teacher (e.g. Bhavana) | Teacher device | `/teacher/award` → propose small CAMP amount + clear reason (e.g. `E2E Integration Test Award`) |
| 3 | Second teacher (e.g. Akhil) | Second device | `/teacher/approvals` → approve that proposal |
| 4 | Operator | Server | Indexer cycle(s) after confirmations |
| 5 | Student | Student device | Refresh → verify updated reputation UI + proof + verify API |
| 6 | Owner (Subbu) | Owner device | Optional: `/admin/*`, `addTeacher` only with a **disposable test wallet** if policy allows |

Contract rule observed on Sepolia: executed proposals show **`approvalCount: 2`** (two teacher approvals required).

---

## Multi-device state requirements

After any transaction on **device A**, verify on **device B** (different user, fresh browser or incognito):

| Requirement | Source of truth |
|-------------|-----------------|
| Proposal list / approval counts | Backend `GET /api/v1/teacher/proposals` and/or on-chain `proposals(id)` |
| CAMP score / level | Backend student aggregate (RPC-backed) + on-chain `balanceOf` |
| Achievements / activity | Backend APIs after indexer |
| Leaderboard | Backend `GET /api/v1/leaderboard` (may cache ~60s) |
| Proof modal | Per-achievement fields from API (tx hash, block, wallets) |
| `/verify` | Backend verify endpoints |

**Must be true:**

- No dependency on **local mock data** (`data.js` removed from runtime tree).
- Refresh on another device **reconstructs** state from API/chain.
- **JWT/session is per device/wallet**; signing in on device A must not affect device B unless same wallet is connected there.
- Account switch on one device clears auth and refetches roles (no stale teacher nav for a student wallet).

---

## Automated checks (run anytime)

```bash
# Frontend
npm install && npm run build

# Backend
cd backend && npm install && npm run build && npm test && npx prisma validate

# Roles vs contract (read-only, no secrets)
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com node scripts/verify-test-wallet-roles.mjs

# Shared services
curl -s http://localhost:4000/health
curl -s http://localhost:4000/api/v1/system/status
cd backend && npm run indexer
```

---

## Evidence to capture (manual steps)

For each **COORDINATED MANUAL VERIFIED** step, record:

- Member name + role
- Wallet address (public)
- Transaction hash + block number
- Proposal ID (if applicable)
- Before/after API snapshots for student wallet (`GET /api/v1/students/:wallet`, achievements, activity)
- Screenshot optional; tx hash is sufficient for audit

---

## Final report outcomes

| Result | When |
|--------|------|
| **PASS** | Automated checks pass **and** coordinated path completed with chain + indexer + student UI + proof + verify aligned. |
| **PARTIAL** | Automated pass; one or more coordinated steps **PENDING MANUAL USER SIGNATURE** or not yet run. |
| **FAIL** | Build/test/health regression, or completed manual tx but **data does not propagate** correctly across devices/API/chain. |

Do not require a single operator to control all wallets. Do not change architecture to simulate multi-user flows with hardcoded roles or shared credentials.
