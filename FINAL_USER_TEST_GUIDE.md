# Campus Reputation V2 — User Test Guide

Simple steps for students, teachers, and owners. **Never share your MetaMask seed phrase or private key** with anyone.

---

## Everyone

- Use a **modern browser** (Chrome, Firefox, Brave, etc.).
- Install **MetaMask** (or open the site inside MetaMask’s mobile browser if needed).
- Switch MetaMask network to **Sepolia** when prompted.
- You need a small amount of **Sepolia ETH** for transaction gas (not real money).

---

## Student

1. Open the Campus Reputation link your college shared (Vercel URL).
2. Tap **Connect wallet** and approve in MetaMask.
3. If asked, switch to **Sepolia**.
4. If you are new, complete **registration** in MetaMask when prompted.
5. Fill in your **profile** (name, department, etc.) if the app asks.
6. On **Overview**, check your **CAMP reputation** and level.
7. Open **Achievements** and **Badges** to see your record.
8. Open **Activity** and **Leaderboard** to explore campus activity.
9. Open an achievement’s **proof** to see the Sepolia transaction.
10. Open **Profile** → share link or **QR** so others can view your public page **without** connecting a wallet.

If something you just earned does not appear immediately, wait a few minutes and refresh — the campus database updates on a schedule after the blockchain confirms.

---

## Teacher

1. Connect with the wallet your institution registered as a **teacher** on Sepolia.
2. Open **Teacher** in the navigation (appears when your wallet is authorized on-chain).
3. **Propose award:** enter student wallet, reason, amount, category → confirm in MetaMask.
4. Wait for the transaction to confirm — the app will show success on-chain.
5. Open **Approvals** to approve another teacher’s proposal if you are a second approver → confirm in MetaMask.
6. After enough approvals, the award executes on-chain; indexed details may appear after a short delay.

There is **no Reject button** — the contract does not support rejecting proposals from this app.

---

## Owner (Admin)

1. Connect with the **contract owner** wallet.
2. **Admin** appears in navigation (you do not need to be a teacher to use Admin).
3. Open **Admin** → view teachers.
4. **Add teacher:** enter wallet address → confirm **addTeacher** in MetaMask.
5. Verify the new teacher can open the Teacher dashboard when their wallet is authorized on-chain.

---

## Viewing someone else’s profile (no wallet)

1. Scan their QR or open a link like:  
   `https://<site>/#/student/0x...`
2. Read their public reputation and achievements — **no MetaMask required**.

---

## If something goes wrong

- **Site loads slowly first time:** wait and tap Retry — the server may be waking up.
- **Wrong network:** switch MetaMask to Sepolia.
- **Transaction failed in MetaMask:** read the error; you may need more Sepolia ETH for gas.
- **Confirmed in MetaMask but not in app yet:** refresh after a few minutes.

For technical support, contact your project admin — do not send secret keys.
