# Campus Reputation V2 E2E Validation

**Strategy:** [E2E_VALIDATION_STRATEGY.md](./E2E_VALIDATION_STRATEGY.md) (multi-device, coordinated signing — **no shared wallet credentials**)

**Last updated:** 2026-10-26  
**Shared environment:** local Postgres + `http://localhost:4000` + `http://localhost:5173` + Sepolia

---

## Verification summary

| Area | Status |
|------|--------|
| **AUTOMATED VERIFIED** | See table below |
| **COORDINATED MANUAL VERIFIED** | None recorded yet this cycle |
| **PENDING MANUAL USER SIGNATURE** | Student register (Sakshi device); second approval on proposal #7 (Akhil or Bhavana device) — or use Path B new award in strategy doc |

---

## AUTOMATED VERIFIED

| Check | Result | Notes |
|-------|--------|--------|
| Frontend `npm run build` | PASS | |
| Backend `npm run build` | PASS | |
| Backend tests | PASS | 7 tests |
| Prisma validate | PASS | |
| Prisma migrate deploy | PASS | Docker Postgres `campus-reputation-db` |
| RPC / chainId | PASS | 11155111 via `/health` |
| Role script vs contract | PASS | `scripts/verify-test-wallet-roles.mjs` |
| Backend `/health` | PASS | api, database, rpc ok |
| Indexer health | PASS | `latestIndexedBlock` near chain head (~few blocks lag) |
| Proposal API vs chain | PASS | Proposal #7: 1/2 approvals, not executed — matches Sepolia |
| Multi-device architecture | PASS (code) | Reads via API/indexer; writes via MetaMask; no runtime `data.js`; per-device JWT |

---

## COORDINATED MANUAL VERIFIED

| Step | Member | Status | Evidence |
|------|--------|--------|----------|
| Student registration | Sakshi (own device) | **PENDING MANUAL USER SIGNATURE** | — |
| Approve proposal #7 | Akhil or Bhavana (own device) | **PENDING MANUAL USER SIGNATURE** | — |
| Student UI after award | Sakshi (own device) | **PENDING MANUAL USER SIGNATURE** | — |
| Proof + `/verify` | Any device with public tx/id | **PENDING MANUAL USER SIGNATURE** | — |
| Owner admin / addTeacher | Subbu (own device) | Not scheduled | — |

---

## Shared infrastructure (last automated snapshot)

| Component | Status |
|-----------|--------|
| PostgreSQL | Running (`localhost:5432`) |
| Backend | `http://localhost:4000` |
| Frontend | `http://localhost:5173` |
| Indexer | `cd backend && npm run indexer` |

Example health:

```text
latestBlock ~119983xx, latestIndexedBlock within a few blocks
DB: BlockchainEvent ≥ 1, Achievement 0 until new TokensAwarded indexed
```

---

## Known test wallets (contract authority — not for credential sharing)

| Member | Address | Role on Sepolia |
|--------|---------|-----------------|
| Bhavana | `0x8B4e61B525376Cd9e85f7B846453610e963c1eC7` | Teacher |
| Akhil | `0x5cdCDb9B9869F53eBBCDB22Cb7e80fB915D0093C` | Teacher |
| Subbu | `0x2Ab4d7C729E2F6937D40be3CBf346fd1e8592Fc1` | Owner + Teacher |
| Sakshi | `0xFd14a15D308627804a9044e12088838F47A45d2e` | Student |
| Jashwanth | `0xc4cBd1734F69899aAdcc77527a0b5801F95F816E` | Student |
| Satvika | `0xF8CF0cDD71Ae7032bB52FDA88B91e98a03d068ED` | Teacher (on-chain; proposer of #7) |

---

## Student baseline (Sakshi — API + chain, pre-award)

| Field | Value |
|-------|--------|
| Registered on-chain | No |
| CAMP | 0 |
| Level | Newcomer |
| Achievements (API) | 0 |

---

## Open proposal #7 (optional coordinated completion)

| Field | Value |
|-------|--------|
| Student | Sakshi |
| Amount | 50 CAMP (after execution, per contract scaling) |
| Approvals | 1 / 2 |
| Executed | false |
| Second approver | **Akhil or Bhavana on their device** (not Satvika) |

Alternative: follow **Path B** in [E2E_VALIDATION_STRATEGY.md](./E2E_VALIDATION_STRATEGY.md) (new proposal from Bhavana → approve Akhil).

---

## Multi-device checks (after manual signatures)

When coordinated steps complete, verify **from a second device or fresh browser**:

- [ ] Teacher device sees proposal/approval state via `/teacher/approvals` matching chain/API
- [ ] Student device after refresh shows updated CAMP without local-only mocks
- [ ] `GET /api/v1/students/<sakshi>` matches student UI
- [ ] Achievements and activity appear after indexer run
- [ ] Proof modal uses **that achievement’s** tx hash; Etherscan link works
- [ ] `/verify/transaction/<hash>` returns real record
- [ ] Another member’s device is unaffected; JWT on each device matches connected wallet only

---

## Cross-device verification commands (operator, no wallet secrets)

```bash
curl -s http://localhost:4000/api/v1/students/0xFd14a15D308627804a9044e12088838F47A45d2e
curl -s http://localhost:4000/api/v1/students/0xFd14a15D308627804a9044e12088838F47A45d2e/achievements
curl -s http://localhost:4000/api/v1/teacher/proposals?page=1&limit=20
cd backend && npm run indexer
```

---

## Final result

**PARTIAL**

- **AUTOMATED VERIFIED:** shared stack, builds, tests, RPC, roles, indexer, API/chain alignment for proposal #7.
- **COORDINATED MANUAL VERIFIED:** none yet — steps correctly marked **PENDING MANUAL USER SIGNATURE**, not FAIL.
- **PASS** when members complete signing on their own devices and multi-device/API checks above pass.

Record tx hashes and before/after snapshots in this file under **COORDINATED MANUAL VERIFIED** when done.
