# Internship demo — prepare real data (no fake achievements)

For the review demo, the app should show **real Sepolia transactions** and **indexed achievements**. Profile names in the DB are optional polish only (`npm run prisma:seed`).

**App:** https://block-chain-project-rust.vercel.app  
**API:** https://campus-reputation.onrender.com

---

## 1. Load demo data into the app (Supabase + Sepolia)

From `backend/` with production env in a **gitignored** `.env` (`DATABASE_URL`, `DIRECT_URL`, `SEPOLIA_RPC_URL`, `JWT_SECRET`, etc.):

```bash
npm run seed:demo
```

This will:

1. Upsert **categories** and **team profile names** (Sakshi, Jashwanth, teachers).
2. Run the **indexer** to pull **real** `TokensAwarded` / registration events from Sepolia into `Achievement` (no fake tx hashes).

First time on an empty database, use a full backfill:

```bash
DEMO_BACKFILL=true START_BLOCK=1 npm run seed:demo
```

(Set `START_BLOCK` to your contract deploy block if `1` is too slow.)

After this, refresh the live app: leaderboard, achievements, activity, and public profiles should show data for wallets that have on-chain CAMP.

---

## 2. On-chain demo script (recommended order)

Use **Sepolia ETH** on teacher/student wallets. **2 approvals** execute an award; **proposer cannot approve their own** proposal.

| Step | Who | Action |
|------|-----|--------|
| 1 | Sakshi | Connect → Register student on-chain → Save profile in app |
| 2 | Jashwanth | Same (optional second student for leaderboard) |
| 3 | Teacher A (e.g. Bhavana) | **Propose award** for Sakshi (Workshop, 50–200 CAMP) |
| 4 | Teacher B (e.g. Akhil) | **Approvals** → Approve proposal # |
| 5 | Teacher C (e.g. Satvika) if needed | Second approval if count still 1/2 |
| 6 | Everyone | Wait ~5 min (indexer) or trigger GitHub **Sepolia Indexer** workflow |
| 7 | Sakshi | Refresh → Achievements, Activity, Overview CAMP |
| 8 | Anyone | Open public link without wallet (QR slide) |

**Owner slide (optional):** Subbu → Admin → Add teacher (new address) on-chain.

---

## 3. What to show in the PPT / live demo (5 min)

1. **Public profile** (no MetaMask):  
   `https://block-chain-project-rust.vercel.app/#/student/0xFd14a15D308627804a9044e12088838F47A45d2e`
2. **Student connect** → Overview (CAMP, level)
3. **Teacher** → Propose + **second teacher** Approves
4. **Achievement proof** → Sepolia Etherscan link
5. **Verify** page → tx hash (confirmed / indexing pending)
6. **Health** (optional): https://campus-reputation.onrender.com/health

---

## 4. Demo wallets (roles on Sepolia)

| Name | Wallet | Role |
|------|--------|------|
| Subbu | `0x2Ab4d7C729E2F6937D40be3CBf346fd1e8592Fc1` | Owner + Teacher |
| Bhavana | `0x8B4e61B525376Cd9e85f7B846453610e963c1eC7` | Teacher |
| Akhil | `0x5cdCDb9B9869F53eBBCDB22Cb7e80fB915D0093C` | Teacher |
| Satvika | `0xF8CF0cDD71Ae7032bB52FDA88B91e98a03d068ED` | Teacher (on-chain) |
| Sakshi | `0xFd14a15D308627804a9044e12088838F47A45d2e` | Student |
| Jashwanth | `0xc4cBd1734F69899aAdcc77527a0b5801F95F816E` | Student |

---

## 5. Indexer

GitHub repo secrets: `DATABASE_URL`, `SEPOLIA_RPC_URL`, `JWT_SECRET`.  
Run **Actions → Sepolia Indexer → Run workflow** after on-chain awards so the UI fills quickly.

---

## 6. Do not use for demo

- Fake achievement rows in the database  
- Mock leaderboard in frontend code  
- Mainnet or shared private keys in slides  

Say honestly: **multi-device E2E is partial**; demo uses coordinated Sepolia test wallets.
