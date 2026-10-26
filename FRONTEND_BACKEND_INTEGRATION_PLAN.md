# Frontend ↔ Backend ↔ Web3 Integration Plan

## 1. Current frontend (V2)

- Location: `src/src/` (nested V2 app; `src/package.json` separate from root).
- Stack: React 18, React Router 6, Lucide, custom light theme (`styles.css`).
- All data from `src/src/data.js` (mock user, achievements, leaderboard, etc.).
- No MetaMask, no API, no routes for `/profile` or `/student/:wallet`.

## 2. Current backend

- `backend/` Express + Prisma + indexer; `/api/v1/*` documented in `BACKEND_API.md`.
- Wallet JWT auth; read-only RPC; no transaction signing.

## 3. Existing Web3 (legacy root)

- `config.js`, `campTokens.js`, root `App.jsx` + dashboards — working Sepolia flows.
- Writes: `registerStudent`, `proposeAward`, `approveAward`, `claimBadge`, `addTeacher`.

## 4–5. Mock → real

| Mock source | Replacement |
|-------------|-------------|
| `user.*` | API `GET /students/:wallet` + on-chain reads |
| `achievements` | API achievements + proof per row |
| `leaderboard` | `GET /leaderboard` |
| `activity` | `GET /activity` |
| `pending` / approvals | Contract `proposals` + `approveAward` |
| `teachers` admin list | API teachers + on-chain `authorizedTeachers` |
| `proof` global | Per-achievement / verify API |
| `badges` UI milestones | On-chain BRONZE/SILVER/GOLD + optional platform copy |
| Platinum level | **Removed** from chain-backed progress (not in contract) |

## 6. API → screen mapping

| Screen | API | Chain |
|--------|-----|-------|
| Overview | student, achievements, activity | balance, level |
| Achievements | student achievements | — |
| Reputation | student reputation | level |
| Badges | student badges | claimBadge |
| Leaderboard | leaderboard | — |
| Activity | activity | — |
| Verify | verify/* | — |
| Profile | profile PATCH (auth) | registerStudent |
| Public student | profile/:wallet | read |
| Teacher | proposals (API+chain) | proposeAward |
| Approvals | proposals | approveAward |
| Admin | admin/stats | addTeacher |

## 7. Contract → action

| Action | Method |
|--------|--------|
| Register | `registerStudent(name)` |
| Propose | `proposeAward(student, amount, reason)` |
| Approve | `approveAward(proposalId)` |
| Claim badge | `claimBadge(type, ipfsURI)` |
| Add teacher | `addTeacher(address)` |

## 8–9. Roles

- **Student:** any connected wallet.
- **Teacher:** `authorizedTeachers(address)`.
- **Owner:** `owner()` — admin nav **without** requiring teacher tab.

## 10–11. Auth

- Connect MetaMask → optional JWT via nonce/sign for profile edits & notifications.

## 12–14. Files

**Create:** `src/context/*`, `src/blockchain/*`, `src/services/*`, `src/components/ProtectedRoute.jsx`, `src/components/ConnectScreen.jsx`, `src/pages/Profile.jsx`, `src/pages/PublicStudent.jsx`, hooks, `etherscan` utils.

**Modify:** V2 pages, `Layout.jsx`, `ui.jsx` ProofModal, `App.jsx`, root `package.json`, `index.html`, `main.jsx`.

**Promote:** `src/src/*` → root `src/` (canonical app entry at repo root).

## 15. Unsupported / removed

- Reject proposal (no contract method).
- Certificate verification wording → achievement/reputation verification.
- Platinum as on-chain level.
- Mock search/notifications → real or disabled until connected.

## 16. Migration sequence

1. Plan (this doc)  
2. Promote V2 + merge dependencies  
3. Wallet + blockchain layer  
4. API services + auth  
5. Layout + protected routes  
6. Page-by-page data wiring  
7. Build + integration report  
