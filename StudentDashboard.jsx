import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { BRONZE_IPFS_URI, SILVER_IPFS_URI, GOLD_IPFS_URI } from "./config";
import { weiToCamp } from "./campTokens";

const BADGES = [
  {
    type: "BRONZE", label: "Bronze Scholar", threshold: "100 CAMP",
    emoji: "🥉", uri: BRONZE_IPFS_URI, min: 100,
    desc: "Early achiever badge"
  },
  {
    type: "SILVER", label: "Silver Scholar", threshold: "300 CAMP",
    emoji: "🥈", uri: SILVER_IPFS_URI, min: 300,
    desc: "Lab priority access"
  },
  {
    type: "GOLD", label: "Gold Scholar", threshold: "500 CAMP",
    emoji: "🥇", uri: GOLD_IPFS_URI, min: 500,
    desc: "Placement fast track"
  },
];

const LEVEL_CLASS = {
  Newcomer: "level-newcomer",
  Bronze: "level-bronze",
  Silver: "level-silver",
  Gold: "level-gold",
};

const LEVEL_ICON = {
  Newcomer: "◌",
  Bronze: "◆",
  Silver: "◈",
  Gold: "★",
};

export default function StudentDashboard({ account, tokenContract, badgeContract }) {
  const [balance, setBalance] = useState(0);
  const [level, setLevel] = useState("Newcomer");
  const [studentName, setStudentName] = useState("");
  const [ownedBadges, setOwnedBadges] = useState({});
  const [loading, setLoading] = useState(false);
  const [claimingBadge, setClaimingBadge] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registering, setRegistering] = useState(false);

  const loadData = useCallback(async () => {
    if (!tokenContract || !account) return;

    try {
      const bal = await tokenContract.balanceOf(account);
      setBalance(weiToCamp(bal));
    } catch (e) {
      console.error("Failed to load balance", e);
      setBalance(0);
    }

    try {
      const lvl = await tokenContract.getReputationLevel(account);
      setLevel(lvl);
    } catch (e) {
      console.error("Failed to load reputation level", e);
    }

    try {
      const name = await tokenContract.studentNames(account);
      setStudentName(name || "");
    } catch (e) {
      console.error("Failed to load student name", e);
    }

    if (!badgeContract) return;

    try {
      const badges = {};
      for (const b of BADGES) {
        badges[b.type] = await badgeContract.hasBadge(account, b.type);
      }
      setOwnedBadges(badges);
    } catch (e) {
      console.error("Failed to load badges", e);
    }
  }, [tokenContract, account, badgeContract]);

  useEffect(() => {
    if (!tokenContract || !account) return;

    loadData();

    const interval = setInterval(loadData, 30000);

    const awardedFilter = tokenContract.filters.TokensAwarded(account);
    const decayedFilter = tokenContract.filters.TokensDecayed(account);
    const onBalanceChange = () => loadData();

    tokenContract.on(awardedFilter, onBalanceChange);
    tokenContract.on(decayedFilter, onBalanceChange);

    return () => {
      clearInterval(interval);
      tokenContract.off(awardedFilter, onBalanceChange);
      tokenContract.off(decayedFilter, onBalanceChange);
    };
  }, [tokenContract, account, loadData]);

  const handleRegister = async () => {
    if (!registerName.trim()) return;
    try {
      setRegistering(true);
      const tx = await tokenContract.registerStudent(registerName.trim());
      await tx.wait();
      await loadData();
    } catch (e) {
      setError(e.reason || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const claimBadge = async (badgeType, uri) => {
    try {
      setClaimingBadge(badgeType);
      setError("");
      setTxHash("");
      const tx = await badgeContract.claimBadge(badgeType, uri);
      await tx.wait();
      setTxHash(tx.hash);
      await loadData();
    } catch (e) {
      setError(e.reason || "Transaction failed");
    } finally {
      setClaimingBadge(null);
    }
  };

  const balanceNum = Number(balance) || 0;
  const pct = Math.min((balanceNum / 500) * 100, 100);
  const circumference = 2 * Math.PI * 44;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div>
      {/* Register if no name */}
      {studentName === "" && (
        <div className="register-section">
          <div className="register-title">🎓 Register as a Student</div>
          <div className="register-sub">Set your on-chain student name to get started</div>
          <div className="register-form">
            <input
              className="form-input"
              placeholder="Your full name"
              value={registerName}
              onChange={e => setRegisterName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRegister()}
            />
            <button className="btn-primary" onClick={handleRegister} disabled={registering}>
              {registering ? "Registering..." : "Register"}
            </button>
          </div>
        </div>
      )}

      {/* Score Card */}
      <div className="score-card" style={{ marginBottom: "1.2rem" }}>
        <div className="score-card-inner">
          <div>
            <div className="score-label">Reputation Score</div>
            <div className="score-value">
              {balanceNum.toFixed(0)}
              <span>CAMP</span>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <span className={`score-level ${LEVEL_CLASS[level] || "level-newcomer"}`}>
                {LEVEL_ICON[level] || "◌"} {level}
                {studentName ? ` — ${studentName}` : ""}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="progress-label">{balanceNum.toFixed(0)} / 500 CAMP to Gold</div>
          </div>

          <div className="score-visual">
            <div className="score-ring">
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke="url(#amber-grad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
                <defs>
                  <linearGradient id="amber-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#c4811a" />
                    <stop offset="100%" stopColor="#ffb83f" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="score-ring-label">
                <span className="score-ring-pct">{pct.toFixed(0)}%</span>
                <span className="score-ring-sub">TO GOLD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          ⚠ {error}
        </div>
      )}
      {txHash && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          ✓ Badge claimed! &nbsp;
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
            View on Etherscan →
          </a>
        </div>
      )}

      {/* Badges */}
      <div className="card card-amber">
        <div className="card-title">
          <span className="card-title-icon">🏅</span>
          Privilege Badges
          <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>
            {Object.values(ownedBadges).filter(Boolean).length}/3 earned
          </span>
        </div>
        <div className="badges-grid">
          {BADGES.map(badge => {
            const owned = ownedBadges[badge.type];
            const eligible = balanceNum >= badge.min;
            const isClaiming = claimingBadge === badge.type;
            return (
              <div key={badge.type} className={`badge-card ${owned ? "owned" : ""}`}>
                <span className="badge-emoji">{badge.emoji}</span>
                <div className="badge-name">{badge.label}</div>
                <div className="badge-req">{badge.threshold}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                  {badge.desc}
                </div>
                {owned ? (
                  <span className="badge-owned-tag">✓ Owned</span>
                ) : eligible ? (
                  <button
                    className="btn-primary"
                    onClick={() => claimBadge(badge.type, badge.uri)}
                    disabled={!!claimingBadge}
                  >
                    {isClaiming ? (
                      <><span className="spinner" />Claiming...</>
                    ) : "Claim Badge"}
                  </button>
                ) : (
                  <span className="badge-locked">
                    🔒 Need {badge.min - balanceNum > 0 ? (badge.min - balanceNum).toFixed(0) : 0} more CAMP
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.2rem" }}>
        <div className="card">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            Wallet Address
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.78rem", color: "var(--text-mono)", wordBreak: "break-all" }}>
            {account}
          </div>
        </div>
        <div className="card">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            Network
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal)", display: "inline-block", boxShadow: "0 0 8px var(--teal)" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", color: "var(--teal)" }}>Sepolia Testnet</span>
          </div>
          <div style={{ marginTop: "8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Chain ID: 11155111
          </div>
        </div>
      </div>
    </div>
  );
}
