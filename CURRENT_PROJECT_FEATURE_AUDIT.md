# Campus Reputation — Current Project Feature Audit

**Audit date:** 26 October 2026  
**Scope:** Entire repository (application source as single source of truth)  
**Rules applied:** No application code modified; no packages installed; features claimed only with file evidence.

---

# 1. PROJECT STRUCTURE

## Repository inventory (application-relevant)

Excluded from listing: `node_modules/`, `dist/` (gitignored/generated), `.DS_Store`.

```
BlockChain_Project/
├── App.jsx                          # Root app: wallet gate, tabs, contracts, roles
├── main.jsx                         # React DOM entry
├── index.html                       # HTML shell, page title
├── index.css                        # Full design system (~1200 lines)
├── ConnectWallet.jsx                # Pre-auth landing + connect button
├── Navbar.jsx                       # Tab navigation + wallet/network display
├── StudentDashboard.jsx             # Student home: score, register, badges
├── TeacherDashboard.jsx             # Teacher: propose/approve, owner add teacher
├── Leaderboard.jsx                  # Top-10 rankings
├── campTokens.js                    # Event aggregation + amount helpers
├── config.js                        # Contract addresses, ABIs, IPFS URIs, STUDENTS[]
├── vite.config.js                   # Vite + React plugin
├── tailwind.config.js               # Tailwind content paths (see §2)
├── package.json
├── package-lock.json
├── .gitignore
├── PROJECT_COMPLETE_ANALYSIS.md     # Prior analysis doc (not runtime code)
├── CURRENT_PROJECT_FEATURE_AUDIT.md # This file
├── contracts/                       # EMPTY directory (no files)
├── src/
│   └── components/
│       ├── ActivityFeed.jsx         # Recent TokensAwarded feed
│       └── StudentProfile.jsx       # Profile, QR, copy address
└── .vercel/                         # Vercel link metadata (gitignored)
```

## File purpose summary

| File | Purpose |
|------|---------|
| `App.jsx` | Wallet connection, ethers contracts, `isTeacher`/`isOwner`, tab state, student list for teachers, global event listeners |
| `ConnectWallet.jsx` | Marketing landing; triggers connect |
| `Navbar.jsx` | Switches `activeTab`; shows Sepolia badge, teacher badge, truncated address |
| `StudentDashboard.jsx` | Balance, level, registration, badge claim, network info card |
| `TeacherDashboard.jsx` | Proposals, approvals, owner teacher management |
| `Leaderboard.jsx` | Top 10 + level legend |
| `ActivityFeed.jsx` | Last 20 award events |
| `StudentProfile.jsx` | Profile view, QR, download QR PNG, registration duplicate |
| `campTokens.js` | `fetchStudentsWithBalances`, `weiToCamp`, `rawAmount` |
| `config.js` | On-chain integration constants |
| `index.css` | All visual styling (CSS variables, components, one mobile breakpoint) |
| `main.jsx` | Renders `App` in StrictMode |
| `index.html` | Title: "Campus Reputation Token" |
| `vite.config.js` | Minimal Vite config |
| `tailwind.config.js` | Tailwind config only; not wired to CSS pipeline |

## Empty / unused / dead

| Item | Status | Evidence |
|------|--------|----------|
| `contracts/` | **Empty directory** | No `.sol` or scripts |
| `config.js` → `STUDENTS` | **Exported, never imported** | Only defined in `config.js` |
| `tailwind.config.js` + tailwind deps | **Installed, not used in styles** | No `@tailwind` in `index.css`; root JSX not in tailwind `content` paths |
| `postcss.config.js` | **Not present** | Autoprefixer/postcss in package.json unused |
| `StudentProfile` badge claim | **Not exposed** | Profile shows owned/locked only; claim only on Student Dashboard |
| Public “disconnect wallet” | **Not implemented** | No disconnect UI; must refresh / change account |
| Backend / API routes | **Not present** | No server source files |
| Test files | **Not present** | No `*.test.*`, no Hardhat |
| Static assets folder | **Not present** | Emoji/icon in HTML; fonts from Google CDN in CSS |
| README | **Not present** | — |

## Documentation artifacts (non-runtime)

- `PROJECT_COMPLETE_ANALYSIS.md` — internship/analysis write-up; not loaded by app.

---

# 2. CURRENT TECHNOLOGY STACK

| Category | Status | Details |
|----------|--------|---------|
| **Frontend framework** | **USED** | React 18 (`main.jsx`, all `.jsx`) |
| **Build tool** | **USED** | Vite 5 (`vite.config.js`, scripts in `package.json`) |
| **Language** | **USED** | JavaScript (ES modules), JSX — no TypeScript |
| **Styling** | **USED** | Custom CSS in `index.css` (CSS variables, component classes) |
| **Tailwind CSS** | **INSTALLED BUT NOT CLEARLY USED** | In `package.json`; no `@tailwind` directives; components use `className` strings defined in `index.css` |
| **PostCSS / Autoprefixer** | **INSTALLED BUT NOT CLEARLY USED** | No `postcss.config.js` |
| **Web3 library** | **USED** | `ethers` v6 (`BrowserProvider`, `Contract`, events, `queryFilter`) |
| **Wallet** | **USED** | MetaMask via `window.ethereum` |
| **Blockchain network** | **USED (assumed in UI)** | Sepolia — textual labels + Etherscan URLs; **not enforced in code** |
| **Smart contracts** | **USED (external)** | Addresses + ABI strings in `config.js` |
| **QR** | **USED** | `qrcode.react` in `StudentProfile.jsx` |
| **IPFS** | **PARTIAL** | Hardcoded Pinata gateway URIs passed to `claimBadge`; no upload/fetch in UI |
| **Backend** | **NOT PRESENT** | — |
| **Database** | **NOT PRESENT** | — |
| **Authentication** | **NOT PRESENT (traditional)** | Wallet address = identity |
| **State management** | **USED** | React `useState` / `useEffect` / `useCallback` only (no Redux/Zustand) |
| **Routing** | **NOT PRESENT** | Tab state in `App.jsx` (`activeTab` string); no React Router |
| **Testing** | **NOT PRESENT** | — |
| **Deployment config** | **PARTIAL** | `.vercel/project.json` (gitignored); no CI configs in repo |

---

# 3. ALL EXISTING SCREENS

Navigation: **No URL routes.** After wallet connect, `Navbar` sets `activeTab`. Pre-connect: only Connect screen.

## Screen A — Connect / Landing

| Field | Detail |
|-------|--------|
| **Name** | Connect Wallet / Campus Reputation landing |
| **File** | `ConnectWallet.jsx` (rendered from `App.jsx` when `!account`) |
| **Who can access** | Anyone with browser (no wallet required to view) |
| **Purpose** | Branding + initiate MetaMask connection |
| **Information displayed** | Sepolia mention, feature bullets, “read-only” note (see §17 — misleading) |
| **Actions** | “Connect MetaMask” → `connect()` prop |
| **Blockchain** | None until connect |
| **Navigation** | None (single screen until connected) |
| **Loading/error** | No loading state on button; missing MetaMask → `alert()` in parent |
| **Limitations** | No “learn more”, no network setup help, no wallet alternatives |

## Screen B — Student Dashboard

| Field | Detail |
|-------|--------|
| **File** | `StudentDashboard.jsx` (`activeTab === "student"`) |
| **Access** | Any connected wallet |
| **Purpose** | Primary student hub: score, register, claim badges |
| **Displayed** | CAMP balance, level, progress to Gold (500), wallet address, Sepolia + chain ID 11155111, badge grid |
| **Actions** | Register (if no name), Claim Badge (if eligible) |
| **Blockchain reads** | `balanceOf`, `getReputationLevel`, `studentNames`, `hasBadge` ×3 |
| **Blockchain writes** | `registerStudent`, `claimBadge` |
| **Navigation** | Via navbar tabs |
| **States** | `loading`/`claimingBadge`/`registering` spinners; `error` alert; `txHash` success + Etherscan link |
| **Limitations** | Registration block duplicated on Profile; progress always framed toward Gold on this screen |

## Screen C — My Profile

| Field | Detail |
|-------|--------|
| **File** | `src/components/StudentProfile.jsx` (`activeTab === "profile"`) |
| **Access** | Any connected wallet |
| **Purpose** | Shareable identity view + QR |
| **Displayed** | Initials avatar, name, level, balance, progress to *next* tier, wallet, badges (owned/locked only), QR |
| **Actions** | Register name, Copy address, Download QR PNG |
| **Blockchain** | Same reads as dashboard; write: `registerStudent` only |
| **Limitations** | Cannot claim badges here; QR is Etherscan link not in-app verify |

## Screen D — Teacher Dashboard

| Field | Detail |
|-------|--------|
| **File** | `TeacherDashboard.jsx` (`activeTab === "teacher" && isTeacher`) |
| **Access** | Wallets where `authorizedTeachers(account) === true` |
| **Purpose** | Propose/approve CAMP awards; owner adds teachers |
| **Displayed** | Propose form, pending/all proposals with approval progress (÷2), owner “Manage Teachers” if `isOwner` |
| **Actions** | Propose Award, Approve, Refresh proposals, Add Teacher (owner) |
| **Blockchain writes** | `proposeAward`, `approveAward`, `addTeacher` |
| **Navigation** | Tab visible only if `isTeacher` in `Navbar.jsx` |
| **Limitations** | Owner who is not teacher sees no Teacher tab; student dropdown excludes zero-balance addresses |

## Screen E — Leaderboard

| Field | Detail |
|-------|--------|
| **File** | `Leaderboard.jsx` |
| **Access** | Any connected wallet |
| **Purpose** | Rank top students by CAMP |
| **Displayed** | Stats (count, total CAMP, top score), top 10 list, level legend |
| **Actions** | Refresh button |
| **Blockchain** | Via `fetchStudentsWithBalances` (events + reads) |
| **Limitations** | Only students with balance &gt; 0; max 10 |

## Screen F — Activity Feed

| Field | Detail |
|-------|--------|
| **File** | `src/components/ActivityFeed.jsx` |
| **Access** | Any connected wallet |
| **Purpose** | Transparency: recent awards |
| **Displayed** | Up to 20 `TokensAwarded` entries: shortened student, reason, relative time, amount |
| **Actions** | Row click → Etherscan tx (link) |
| **Blockchain** | `queryFilter(TokensAwarded)`, `provider.getBlock` for timestamps |
| **Refresh** | Initial load + every 30s interval |
| **Limitations** | No proposer address; no decay events; no pagination |

## Shell — Navbar (persistent after connect)

| Field | Detail |
|-------|--------|
| **File** | `Navbar.jsx` |
| **Purpose** | Tab switching, network label, teacher badge, address |
| **Mobile** | `@media (max-width: 768px)` hides `.navbar-tabs` — **no mobile nav alternative** |

## Navigation flow (actual)

```
[ConnectWallet] --connect--> [App shell + Navbar]
                                ├─ student (default activeTab)
                                ├─ profile
                                ├─ teacher (if isTeacher)
                                ├─ leaderboard
                                └─ activity
```

`activeTab` defaults to `"student"` in `App.jsx`. No deep linking.

---

# 4. USER ROLES

## Confirmed roles

| Role | Identified how | Evidence |
|------|----------------|----------|
| **Connected user (generic)** | `account` from signer | `App.jsx` |
| **Student** | Not a separate flag — any connected account | Registration optional |
| **Teacher** | `tokenContract.authorizedTeachers(account)` | `App.jsx` L45-52 |
| **Contract owner** | `owner()` equals account (case-insensitive) | `App.jsx` L46-53 |
| **Public visitor** | Only before connect — cannot use dashboards | `if (!account) return <ConnectWallet />` |

There is **no** separate “verifier” role in code.

## Permissions matrix

| Capability | Student (any wallet) | Teacher | Owner | Enforced UI | Enforced chain (from ABI usage) |
|------------|---------------------|---------|-------|-------------|----------------------------------|
| View own balance/level | Yes | Yes | Yes | N/A (read) | Public view fns |
| Register student name | Yes | Yes* | Yes* | Yes | `registerStudent` — *any caller in UI |
| Claim badge | Yes | Yes* | Yes* | Yes | `claimBadge` |
| View leaderboard/feed | Yes | Yes | Yes | Yes | Read/events |
| Propose award | No** | Yes | Yes** | Tab hidden | `proposeAward` — **expected** teacher-only on chain |
| Approve award | No** | Yes | Yes** | Yes | `approveAward` |
| Add teacher | No | No*** | Yes | Owner section | `addTeacher` |
| Teacher tab visible | No | Yes | Only if also teacher | Navbar | — |

\* UI does not restrict registration to “students only”.  
\** Unless also `authorizedTeachers`.  
\*** Unless owner is also authorized as teacher.

**Public unauthenticated access to dashboards:** **NO**

---

# 5. WALLET CONNECTION FLOW

1. **Before connect:** User sees `ConnectWallet.jsx` only.
2. **Click Connect:** `App.jsx` → `connectWallet()`.
3. **No MetaMask:** `alert("Please install MetaMask")` — stops.
4. **Provider:** `new ethers.BrowserProvider(window.ethereum)`.
5. **Account:** `getSigner()` → `getAddress()`.
6. **Contracts:** `ethers.Contract(CAMPUS_TOKEN_ADDRESS, TOKEN_ABI, signer)` and badge equivalent.
7. **Roles:** `authorizedTeachers(_account)`, `owner()` compared to account.
8. **Student list:** `loadRegisteredStudents(_token)` for teacher dropdown.
9. **Network detection:** **NOT IMPLEMENTED** — no `getNetwork()`, no `chainId` check.
10. **Sepolia enforced:** **NO** — UI *displays* Sepolia; wrong chain not blocked.
11. **Wrong network:** User may hit wrong contract / RPC errors — generic catch / `e.reason`.
12. **Account change:** `window.ethereum.on("accountsChanged", () => window.location.reload())`.
13. **Chain change:** **NOT HANDLED** — no `chainChanged` listener.
14. **Disconnect:** **NO UI** — no `wallet_disconnect` handling.
15. **Errors on connect:** `catch` → `console.error(e)` only — **no user message**.

### Wallet UX problems

- Misleading “read-only” copy on connect page vs many write txs.
- No chain switch prompt.
- Connect failures silent (console only).
- Full page reload on account change (works but abrupt).
- No connected-state persistence beyond MetaMask session.

---

# 6. STUDENT FEATURES

| Feature | Status | How it works (if implemented) |
|---------|--------|-------------------------------|
| Student registration | **IMPLEMENTED** | `registerStudent(name)` from Dashboard or Profile when `studentName === ""` |
| On-chain student name | **IMPLEMENTED** | `studentNames(account)` |
| CAMP balance | **IMPLEMENTED** | `balanceOf` → `weiToCamp` (`formatEther`, floor) |
| Reputation level | **IMPLEMENTED** | `getReputationLevel(account)` — string from contract |
| Progress UI | **IMPLEMENTED** | Dashboard: % to 500 Gold; Profile: tier-aware `getProgress()` |
| Badge eligibility | **IMPLEMENTED (UI)** | `balance >= badge.min` (100/300/500) — **not** `BRONZE_THRESHOLD()` on chain |
| Badge claiming | **IMPLEMENTED** | `claimBadge(type, uri)` with URI from `config.js` |
| Badge ownership display | **IMPLEMENTED** | `hasBadge(account, type)` |
| Student profile | **IMPLEMENTED** | `StudentProfile.jsx` |
| QR code | **IMPLEMENTED** | Etherscan address URL |
| Etherscan tx links | **IMPLEMENTED** | After register/claim; teacher flows |
| Achievement history (personal) | **NOT IMPLEMENTED** | No per-student award list in UI |
| Transaction history page | **NOT IMPLEMENTED** | Only activity feed (global) |
| Leaderboard position | **NOT IMPLEMENTED** | Leaderboard shows top 10 but not “your rank” |
| Token transfer (student) | **ABI ONLY** | `transfer`/`approve` in ABI; **no UI** |
| Token decay | **ABI ONLY** | `applyDecay`, `TokensDecayed` listened on dashboard but decay never triggered from UI |

---

# 7. TEACHER FEATURES

## Teacher detection

- On connect: `await _token.authorizedTeachers(_account)` → `isTeacher`.
- Navbar adds Teacher tab; `App.jsx` renders dashboard only if `isTeacher`.

## Award proposal

- **Student target:** Dropdown from `registeredStudents` OR manual `0x` address (`manualAddressMode`).
- **Amount:** Number input, `Math.floor(Number(amount))`, min 1 — sent **without** `parseEther`.
- **Reason:** Select from fixed list: Attendance, Participation, Volunteering, Workshop Completed, Competition Winner.
- **Tx:** `proposeAward(studentAddr, tokenAmount, reason)`.
- **Proposal ID:** Parsed from receipt log `AwardProposed` → `proposalId`; fallback `"?"`.

## Approval workflow

- Loads `proposalCount()`, iterates `proposals(i)` for `i in [0, count)`.
- **Approval count display:** `approvalCount/2` progress bar — **UI assumes 2 approvals required** (not read from contract).
- **Approve:** `approveAward(proposalId)` where `proposalId` is loop index `i`.
- **Disabled when:** already approved, proposer is self, or `executed`.
- **Executed state:** Shows “✅ Tokens Awarded” when `proposal.executed`.

## Lifecycle (as coded)

```
Teacher opens Teacher tab
  → fills student address, amount, reason
  → proposeAward (MetaMask confirm)
  → receipt → AwardProposed event → proposal listed
Other teacher(s) click Approve
  → approveAward(proposalId) (repeat until executed per contract rules)
  → UI shows executed + TokensAwarded event (activity feed / balance updates)
Student balance increases (observed via balanceOf on refresh/events)
```

**Contract-side threshold for execution:** **Not determinable from repository** — UI displays `/2`.

## UI dependency on contract

- Proposal struct fields mapping.
- `executed` flag for UI state.
- Event parsing for proposal ID.
- Teacher list for dropdown depends on `fetchStudentsWithBalances` (balance &gt; 0 filter).

---

# 8. OWNER / ADMIN FEATURES

| Feature | UI | ABI | Notes |
|---------|----|-----|-------|
| Owner detection | Yes | `owner()` | `isOwner` in `App.jsx` |
| Add teacher | Yes | `addTeacher` | Owner-only section in `TeacherDashboard.jsx` |
| Remove teacher | **NO** | **Not in ABI** | — |
| Teacher list management | **NO** | — | Only add one address at a time |
| Direct `awardTokens` | **NO** | Yes | Not called |
| `applyDecay` | **NO** | Yes | Not called |
| Badge admin | **NO** | — | — |
| Token admin (mint/pause) | **NO** | Not in exposed ABI | — |
| System settings (decay params) | **NO** | `decayInterval`/`decayAmount` in ABI unread | — |

Owner **without** `authorizedTeachers` **cannot** see Teacher tab — may still be intended to add teachers only if they navigate... **they cannot** without teacher flag. **Gap:** owner must also be teacher to access UI, unless they use another client.

---

# 9. CAMP TOKEN SYSTEM

Evidence: `TOKEN_ABI` in `config.js` + frontend usage.

| Question | Answer (code-backed) |
|----------|----------------------|
| How awarded? | Primary UI path: `proposeAward` → `approveAward` → execution (when `executed` true). ABI also has direct `awardTokens` (unused in UI). |
| Transferable? | **Likely ERC-20-like** — ABI includes `transfer`, `approve`, `transferFrom`. **No transfer UI.** |
| Balances fetched? | `balanceOf` + `ethers.formatEther` + floor (`weiToCamp`) — **assumes 18 decimals** per comment in `campTokens.js`. |
| Award amounts sent how? | Integer passed to `proposeAward` **without** `parseEther` — **potential contract/UI unit mismatch** if contract expects wei. |
| Decimals? | `decimals()` in ABI — **never called in UI**. |
| Reputation levels | Returned by `getReputationLevel(address)`; UI maps to CSS classes. Leaderboard legend shows ranges 0–99, 100–299, 300–499, 500+. |
| Min/max award | UI validation: amount ≥ 1; **no max**. |
| Tokens removed? | ABI: `applyDecay` — **not used in UI**. Event `TokensDecayed` subscribed. |
| Student transfer CAMP | **ABI only** |
| ERC-20 vs custom | **Hybrid exposed API:** standard ERC-20 functions + custom reputation/proposal functions |

---

# 10. BADGE SYSTEM

## Frontend-defined badges (`StudentDashboard.jsx`)

| Type | Label | UI min CAMP | IPFS URI source |
|------|-------|-------------|-----------------|
| BRONZE | Bronze Scholar | 100 | `BRONZE_IPFS_URI` |
| SILVER | Silver Scholar | 300 | `SILVER_IPFS_URI` |
| GOLD | Gold Scholar | 500 | `GOLD_IPFS_URI` |

## Claim process

1. `hasBadge(account, type)` for each type.
2. If not owned and `balance >= min`, show Claim → `claimBadge(badgeType, uri)`.
3. Wait for tx; refresh; show Etherscan link.

## ABI vs UI

| Item | Frontend | ABI |
|------|----------|-----|
| Thresholds | Hardcoded 100/300/500 | `BRONZE_THRESHOLD()`, etc. — **not read** |
| NFT nature | Treated as badges | `ownerOf`, `tokenURI`, `transferFrom` suggest ERC-721-like |
| Double claim | UI hides button if owned | **Contract should revert** — not verified without source |
| Metadata display | Emoji + labels only | `tokenURI` **not fetched** |
| Transfer badges | **No UI** | `approve`, `transferFrom` in ABI |
| Profile | Shows owned/locked | No claim on profile |

---

# 11. LEADERBOARD

| Aspect | Behavior |
|--------|----------|
| Discovery | `queryFilter(StudentRegistered)` + `queryFilter(TokensAwarded)` → unique addresses |
| Balances | Parallel `balanceOf`, `getReputationLevel`, `studentNames` |
| Filter | **`balance > 0` only** — registered but zero balance excluded |
| Sort | Descending balance |
| Display count | **Top 10** (`slice(0, 10)`) |
| Refresh | On mount; on `TokensAwarded` / `TokensDecayed` events; manual Refresh button |
| Empty state | Message: “No students yet…” |
| Inaccuracies | Misses students with 0 balance; event scan may miss early history limits; **not global rank for current user** |

**Scalability:** O(n) RPC calls per address; unbounded event scan — **does not scale** without indexer.

---

# 12. ACTIVITY FEED

| Aspect | Behavior |
|--------|----------|
| Events | **`TokensAwarded` only** |
| Limit | 20 most recent (sort by blockNumber, log index) |
| Fields shown | Student (short address), reason, relative time, amount (`rawAmount`) |
| Teacher/proposer | **Not shown** |
| Timestamp | `provider.getBlock(blockNumber).timestamp` |
| Links | Each row → `sepolia.etherscan.io/tx/{txHash}` |
| Refresh | 30s polling + initial |
| Errors | Inline red text |

**Limitations:** No proposals, registrations, decays, or badge mints; no filters; no search.

---

# 13. STUDENT PROFILE + QR

## Profile displays

- Registration form (if no name)
- Avatar initials (from address hex)
- Name, level, balance, progress ring
- Full wallet address + copy
- Badge cards (owned vs locked — **no claim**)
- QR section titled “On-Chain Verification”

## QR implementation

```text
Encoded value: https://sepolia.etherscan.io/address/${account}
```

| Question | Answer |
|----------|--------|
| Points to app? | **NO** |
| Points to Etherscan? | **YES** |
| Contains raw address? | Embedded in URL |
| On scan | Opens block explorer for wallet |

**Verification assessment:** This is **wallet/explorer lookup**, not cryptographic credential verification, not in-app reputation API, not certificate hash check.

**Download:** `handleDownloadQR` exports PNG via canvas from SVG (`repuchain-profile.png` filename).

---

# 14. SMART CONTRACT INTEGRATION

## READ methods

| Method | Contract | Purpose | Used in UI? | Where |
|--------|----------|---------|-------------|-------|
| `authorizedTeachers(address)` | Token | Teacher role | Yes | `App.jsx` |
| `owner()` | Token | Owner role | Yes | `App.jsx` |
| `balanceOf(address)` | Token | CAMP balance | Yes | Dashboard, Profile, `campTokens.js` |
| `getReputationLevel(address)` | Token | Level string | Yes | Dashboard, Profile, `campTokens.js` |
| `studentNames(address)` | Token | Name | Yes | Dashboard, Profile, `campTokens.js` |
| `proposalCount()` | Token | # proposals | Yes | `TeacherDashboard.jsx` |
| `proposals(uint256)` | Token | Proposal detail | Yes | `TeacherDashboard.jsx` |
| `hasApproved(uint256, address)` | Token | Approval status | Yes | `TeacherDashboard.jsx` |
| `hasBadge(address, string)` | Badge | Badge owned | Yes | Dashboard, Profile |
| `name`, `symbol`, `totalSupply`, `decimals` | Token | ERC-20 metadata | **No** | — |
| `allowance`, etc. | Token | ERC-20 | **No** | — |
| `lastActiveTime` | Token | Activity | **No** | — |
| `decayInterval`, `decayAmount` | Token | Decay config | **No** | — |
| `ownerOf`, `tokenURI`, `tokenCounter`, thresholds | Badge | NFT metadata | **No** | — |
| `getStudentBadges` | Badge | Badge IDs | **No** | — |
| `campusToken()` | Badge | Link token | **No** | — |

## WRITE methods

| Method | Contract | Purpose | Used in UI? | Where |
|--------|----------|---------|-------------|-------|
| `registerStudent(string)` | Token | Register name | Yes | Dashboard, Profile |
| `proposeAward(address,uint256,string)` | Token | Create proposal | Yes | `TeacherDashboard.jsx` |
| `approveAward(uint256)` | Token | Approve | Yes | `TeacherDashboard.jsx` |
| `addTeacher(address)` | Token | Add teacher | Yes | `TeacherDashboard.jsx` (owner) |
| `claimBadge(string,string)` | Badge | Mint badge | Yes | `StudentDashboard.jsx` |
| `awardTokens` | Token | Direct award | **No** | — |
| `applyDecay` | Token | Decay | **No** | — |
| `transfer`, `approve`, `transferFrom` | Token | ERC-20 | **No** | — |
| `approve`, `transferFrom` | Badge | NFT transfer | **No** | — |

## EVENTS

| Event | Contract | Used in UI? | Where |
|-------|----------|-------------|-------|
| `TokensAwarded` | Token | Yes | Activity feed, listeners, `campTokens.js` |
| `TokensDecayed` | Token | Subscribed only | Dashboard, Leaderboard, App — **no UI display** |
| `StudentRegistered` | Token | Yes | `campTokens.js` |
| `AwardProposed` | Token | Yes | Receipt parsing in `TeacherDashboard.jsx` |
| `TeacherAdded` | Token | **No** | — |
| `AwardApproved` | Token | **No** | — |
| `BadgeMinted` | Badge | **No** | — |

---

# 15. CONTRACT SOURCE AVAILABILITY

| Item | Present? |
|------|----------|
| `.sol` files | **NO** |
| Hardhat / Foundry | **NO** |
| Deployment scripts | **NO** |
| Migrations | **NO** |
| Contract tests | **NO** |
| Build artifacts | **NO** (in repo) |
| ABIs | **YES** — inline strings in `config.js` |
| Deployed addresses | **YES** — `config.js` |

**Conclusion:** Frontend talks to **already-deployed** contracts on Sepolia. **Internal contract logic** (approval count, access modifiers, decay rules) **cannot be verified** from this repository alone.

---

# 16. IPFS / DECENTRALIZED STORAGE

| Question | Answer |
|----------|--------|
| What on IPFS? | Badge metadata (implied by URIs); **not uploaded by this app** |
| Frontend upload? | **NO** |
| URIs hardcoded? | **YES** — three Pinata gateway URLs in `config.js` |
| Pinata | URLs use `mypinata.cloud/ipfs/...` |
| Certificates/documents | **NO** |
| Images in UI | Emoji badges; no IPFS image fetch |

**Decentralization reality:** On-chain = balances, names, proposals, badge flags/ownership. Off-chain static URIs at claim time. **No user content addressing.**

---

# 17. UI/UX AUDIT

## Overall character

- Dark theme (`--bg-void`, purple/amber accents)
- Fonts: Playfair Display, JetBrains Mono, DM Sans (Google Fonts import)
- Card-based layout, gradient score rings, skeleton loaders

## Issue classification

### CRITICAL

| Issue | Evidence |
|-------|----------|
| Mobile: navbar tabs hidden with **no replacement nav** | `index.css` L1190-1192 |
| Wrong network not detected/blocked | No chainId check |
| Connect page says “read-only” but app sends txs | `ConnectWallet.jsx` L41-43 |

### HIGH

| Issue | Evidence |
|-------|----------|
| Owner may be unable to reach Teacher UI without teacher flag | `Navbar.jsx`, `App.jsx` |
| Connect errors only in console | `App.jsx` catch |
| Brand inconsistency (Campus Reputation vs CampusToken) | `ConnectWallet` vs `Navbar` |
| Teacher/student amount unit ambiguity | `proposeAward` vs `formatEther` on balance |

### MEDIUM

| Issue | Evidence |
|-------|----------|
| Duplicate registration UX on Dashboard + Profile | Both components |
| No disconnect / switch wallet UX | — |
| Activity feed title promises “Live” but 30s poll | `ActivityFeed.jsx` |
| Inline styles mixed with CSS classes | Multiple files |
| Leaderboard stats reflect top-10 subset not global | `Leaderboard.jsx` |

### LOW

| Issue | Evidence |
|-------|----------|
| Emoji-heavy UI (accessibility) | Throughout |
| `STUDENTS` export unused | `config.js` |
| Tailwind installed but unused | package.json vs index.css |
| Filename typo `repuchain-profile.png` | `StudentProfile.jsx` |

**Responsive:** One breakpoint 768px — connect left panel hidden; score ring hidden on mobile.

---

# 18. SECURITY / TRUST MODEL

| Topic | Assessment |
|-------|------------|
| Identity | Wallet address only — no KYC |
| Teacher auth | Expected on-chain via `authorizedTeachers`; UI hides tab only |
| Owner privileges | `addTeacher` exposed to owner in UI |
| Multi-teacher approval | UI assumes 2-of-N; **contract rules unknown** |
| Input validation | Ethereum address regex on teacher propose/add; amount numeric checks |
| Client-side trust | Role checks for **display only** — direct contract calls bypass UI |
| On-chain trust | All authoritative state on contracts |
| Public data | Names, amounts, reasons on public chain |
| Tx handling | `tx.wait()` used; errors surfaced via `e.reason` in many places |
| Risks | No chain validation; phishing/wrong address on manual student entry; no rate limits |

**Not a security audit of Solidity** — source unavailable.

---

# 19. ERROR HANDLING

| Location | Pattern |
|----------|---------|
| `App.jsx` connect | `alert` if no MetaMask; else `console.error` |
| `StudentDashboard` | Per-read `console.error`; writes use `setError(e.reason \|\| ...)` |
| `TeacherDashboard` | `setProposeError`, `setApproveError`, etc. |
| `Leaderboard` | `setError` message |
| `ActivityFeed` | `setError` |
| `StudentProfile` | `setError` on copy/register |
| MetaMask reject | Typically `e.reason` or message in catch |
| Wrong network | **Not specifically handled** |
| RPC failure | Generic error strings |
| Loading | Spinners / skeletons / disabled buttons |

**Missing:** Global error boundary; connect failure UX; chain mismatch; disconnected wallet mid-session.

---

# 20. UNUSED / PARTIALLY IMPLEMENTED

| Item | Classification | Evidence |
|------|----------------|----------|
| `awardTokens` | **READY BUT NOT EXPOSED** | ABI + no UI call |
| `applyDecay` | **READY BUT NOT EXPOSED** | ABI; events listened, never triggered |
| `STUDENTS` array | **DEAD CODE** | Exported, never imported |
| Tailwind/postcss | **DEAD / UNUSED SETUP** | package.json only |
| `TokensDecayed` listeners | **PARTIALLY IMPLEMENTED** | Listen without UI/decay trigger |
| Token decay marketing on connect | **UNCERTAIN / MISLEADING** | Copy mentions decay; no UI |
| ERC-20 transfer UI | **ABI ONLY** | — |
| Badge `tokenURI` fetch | **ABI ONLY** | — |
| On-chain threshold getters | **ABI ONLY** | UI hardcodes mins |
| `TeacherAdded`, `AwardApproved`, `BadgeMinted` events | **NOT EXPOSED** | — |
| `contracts/` folder | **UNCERTAIN** | Placeholder for future |
| Certificate verification | **NOT STARTED** | — |

No `TODO`/`FIXME` comments found in source.

---

# 21. FEATURES THAT DO NOT EXIST

| Feature | YES / PARTIAL / NO | Evidence |
|---------|-------------------|----------|
| PDF certificate upload | **NO** | — |
| Certificate hash generation | **NO** | — |
| SHA-256 verification | **NO** | — |
| Certificate verification page | **NO** | QR → Etherscan only (**PARTIAL** wallet lookup) |
| Certificate storage | **NO** | — |
| Login/signup (email/password) | **NO** | — |
| Backend API | **NO** | — |
| Database | **NO** | — |
| Student ID verification | **NO** | — |
| College ERP integration | **NO** | — |
| Notifications | **NO** | — |
| Search | **NO** | — |
| Analytics dashboard | **NO** | — |
| Department leaderboard | **NO** | — |
| Achievement evidence uploads | **NO** | — |
| Public profile URL (in-app) | **NO** | Etherscan only |
| Privacy settings | **NO** | — |

---

# 22. CURRENT END-TO-END USER FLOWS

## Student flow

```
Open app (index.html → main.jsx → App)
→ ConnectWallet screen
→ Click Connect MetaMask
→ MetaMask approve connection
→ Student Dashboard (default tab)
→ [Optional] Enter name → Register → MetaMask tx → wait → name shown
→ View balance, level, badges
→ [If eligible] Claim Badge → MetaMask tx → Etherscan link
→ Switch to Profile → copy address / download QR
→ View Leaderboard / Activity (read-only)
```

## Teacher flow

```
Connect (must be authorizedTeachers on chain)
→ Teacher tab visible
→ Select student from dropdown OR manual address
→ Enter amount + reason → Propose Award → MetaMask tx
→ Proposal appears in list
→ Another teacher → Approve → MetaMask tx (repeat until executed)
→ executed true → student balance increases (on chain)
→ Activity feed shows TokensAwarded
```

## Owner flow

```
Connect (must be owner())
→ If also isTeacher: Teacher tab → Manage Teachers → enter address → Add Teacher → tx
→ If NOT teacher: **no UI path to add teachers**
```

## Public verification flow

```
Scan QR on student profile
→ Opens Sepolia Etherscan address page
→ Verifier manually inspects token holdings, txs, internal tabs on explorer
(App not involved)
```

---

# 23. FEATURE MATRIX

| Feature | Exists? | Status | Screen | Blockchain? | Problems | Revamp Priority |
|---------|---------|--------|--------|-------------|----------|-----------------|
| Wallet connect | Yes | COMPLETE | Connect | Yes | Silent errors, no chain check | P1 |
| Sepolia targeting | Partial | PARTIAL | All | — | Display only | P1 |
| Student register | Yes | COMPLETE | Dashboard, Profile | Yes | Duplicated UI | P3 |
| CAMP balance/level | Yes | COMPLETE | Dashboard, Profile | Yes | Unit ambiguity on awards | P2 |
| Badge claim | Yes | COMPLETE | Dashboard | Yes | Thresholds not from chain | P2 |
| Badge profile view | Yes | BASIC | Profile | Read | No claim/metadata | P3 |
| Teacher propose | Yes | COMPLETE | Teacher | Yes | Dropdown excludes 0 balance | P2 |
| Teacher approve | Yes | COMPLETE | Teacher | Yes | Hardcoded /2 | P2 |
| Owner add teacher | Yes | PARTIAL | Teacher | Yes | Owner needs teacher tab | P1 |
| Leaderboard | Yes | BASIC | Leaderboard | Yes | Not scalable; no user rank | P2 |
| Activity feed | Yes | BASIC | Activity | Yes | Awards only | P3 |
| QR verify | Partial | PARTIAL | Profile | Link only | Not real verification | P2 |
| Token transfer | ABI | ABI ONLY | — | Yes | — | P4 |
| Decay | ABI | ABI ONLY | — | Yes | Misleading marketing | P4 |
| Direct awardTokens | ABI | ABI ONLY | — | Yes | — | P4 |
| Mobile nav | Partial | PARTIAL | Navbar | — | Tabs hidden | P1 |
| Certificate system | No | MISSING | — | — | — | N/A or future |

---

# 24. PROJECT COMPLETENESS SCORE (0–100)

| Area | Score | Rationale |
|------|-------|-----------|
| Core functionality | **72** | Token + badge + teacher flow works in UI; contract source/deploy absent |
| Student experience | **68** | Solid dashboard; duplicate register; no personal history/rank |
| Teacher experience | **70** | Full propose/approve; owner access gap; student picker limits |
| Admin experience | **45** | Only add-teacher; owner UI access issue |
| Blockchain integration | **75** | Good ethers usage, events; no network guard |
| Verification | **25** | Etherscan QR only — not credential verification |
| UI/UX | **78** | Polished dark theme; mobile nav broken |
| Mobile responsiveness | **50** | Breakpoint hides key UI |
| Error handling | **55** | Partial; connect/network weak |
| Security architecture | **58** | Wallet model OK; relies on unseen contracts |
| Scalability | **40** | Event scans + N+1 reads |
| Production readiness | **42** | Testnet, no tests, no CI, no README |

---

# 25. FINAL SUMMARY

## WHAT THE PROJECT CURRENTLY IS

Campus Reputation is a **client-only React DApp** that connects MetaMask to **two pre-deployed Sepolia contracts** (CAMP token + badge NFT). Authenticated users (any connected wallet) use tabbed screens to **register an on-chain name**, **view merit balances and levels**, **claim tier badges**, and **browse a leaderboard and award feed**. **Authorized teachers** propose CAMP awards with reasons and **peer-approve** them until executed; the **contract owner** can **add teachers** through the same dashboard if they can reach it. There is **no backend**, **no certificate handling**, and **no Solidity** in the repository—only ABIs and addresses in `config.js`.

## WHAT ALREADY WORKS WELL

- Cohesive **visual design system** in `index.css`
- Clear **separation of screens** (student / teacher / leaderboard / activity / profile)
- **Transaction feedback** (loading, errors, Etherscan links) on main write paths
- **Event-driven refresh** for balances and leaderboard
- **Multi-teacher workflow UI** with proposal list and approval states
- **Teacher student picker** with manual address fallback

## WHAT FEELS INCOMPLETE

- **Network enforcement** and wallet UX (connect errors, disconnect, chain change)
- **Mobile navigation** (tabs disappear)
- **Owner admin path** when not also a teacher
- **Verification story** (QR = explorer link only)
- **Contract transparency** (no source/tests in repo)
- **Decay, direct award, token transfer** in ABI but absent from product
- **On-chain vs UI threshold alignment** for badges
- **No personal history, notifications, search, or analytics**

## WHAT SHOULD BE PRESERVED

- Tab-based information architecture (easy to revamp into routes later)
- `config.js` as integration hub (addresses + ABIs)
- `campTokens.js` event-indexing pattern (replace with indexer later)
- Teacher **propose → approve** metaphor
- **Activity feed** transparency concept
- **Badge tiers** tied to reputation milestones
- Overall **dark premium aesthetic** (refine, don’t throw away blindly)

## WHAT SHOULD BE REBUILT

- **Navigation** (especially mobile + optional React Router)
- **Wallet layer** (chain detection, switch, disconnect, accurate connect copy)
- **Role/onboarding** (student vs teacher vs owner landing)
- **Verification module** (if product goal includes credentials — currently missing)
- **Leaderboard/indexing** architecture
- **Single registration/profile flow** (remove duplication)
- **Admin console** independent of teacher flag
- **Design system tooling** (remove or properly adopt Tailwind)

## TOP 10 REVAMP PRIORITIES

1. **Wallet + network layer** — chainId check, switch to Sepolia, fix connect messaging/errors  
2. **Mobile navigation** — hamburger/bottom nav when tabs hidden  
3. **Owner/admin UX** — access teacher management without requiring teacher role  
4. **Clarify product scope** — reputation vs certificate verification; align UI copy  
5. **Contract repo alignment** — add Solidity, deployment docs, or verified source links  
6. **Amount/decimals consistency** — align `proposeAward` units with `balanceOf` display  
7. **Badge thresholds from chain** — read `BRONZE_THRESHOLD` etc.; fetch `tokenURI` metadata  
8. **Leaderboard/indexer** — subgraph or backend; show user rank; fix balance&gt;0 filter policy  
9. **Student history** — personal awards, badges, txs  
10. **Real verification flow** — if required: profile URL or hash check, not only Etherscan QR  

---

*End of audit. No application files were modified during this inspection.*
