import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { QRCodeSVG } from "qrcode.react";
import { weiToCamp } from "../../campTokens";

const BADGE_TYPES = [
  { type: "BRONZE", emoji: "🥉", label: "Bronze Scholar" },
  { type: "SILVER", emoji: "🥈", label: "Silver Scholar" },
  { type: "GOLD", emoji: "🥇", label: "Gold Scholar" },
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

function getProgress(balance) {
  if (balance >= 500) {
    return { pct: 100, label: "Max level reached — Gold" };
  }
  if (balance >= 300) {
    return {
      pct: ((balance - 300) / 200) * 100,
      label: `${balance} / 500 CAMP to Gold`,
    };
  }
  if (balance >= 100) {
    return {
      pct: ((balance - 100) / 200) * 100,
      label: `${balance} / 300 CAMP to Silver`,
    };
  }
  return {
    pct: (balance / 100) * 100,
    label: `${balance} / 100 CAMP to Bronze`,
  };
}

export default function StudentProfile({ account, tokenContract, badgeContract }) {
  const [balance, setBalance] = useState(0);
  const [level, setLevel] = useState("Newcomer");
  const [studentName, setStudentName] = useState("");
  const [ownedBadges, setOwnedBadges] = useState({});
  const [registerName, setRegisterName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  const loadData = async () => {
    if (!tokenContract || !badgeContract || !account) return;
    try {
      const bal = await tokenContract.balanceOf(account);
      setBalance(weiToCamp(bal));

      const lvl = await tokenContract.getReputationLevel(account);
      setLevel(lvl);

      const name = await tokenContract.studentNames(account);
      setStudentName(name || "");

      const badges = {};
      for (const b of BADGE_TYPES) {
        badges[b.type] = await badgeContract.hasBadge(account, b.type);
      }
      setOwnedBadges(badges);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [tokenContract, badgeContract, account]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setError("Failed to copy address");
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim()) return;
    try {
      setRegistering(true);
      setError("");
      setTxHash("");
      const tx = await tokenContract.registerStudent(registerName.trim());
      await tx.wait();
      setTxHash(tx.hash);
      setRegisterName("");
      await loadData();
    } catch (e) {
      setError(e.reason || e.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("profile-qr");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.download = "repuchain-profile.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const progress = getProgress(balance);
  const initials = account ? account.slice(2, 4).toUpperCase() : "??";

  return (
    <div>
      {/* Register if no name */}
      {studentName === "" && (
        <div className="register-section">
          <div className="register-title">🎓 Register Name</div>
          <div className="register-sub">Set your on-chain student name to complete your profile</div>
          <div className="register-form">
            <input
              className="form-input"
              placeholder="Your full name"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
            <button className="btn-primary" onClick={handleRegister} disabled={registering}>
              {registering ? "Registering..." : "Register Name"}
            </button>
          </div>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
          ⚠ {error}
        </div>
      )}
      {txHash && (
        <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
          ✓ Registered successfully! &nbsp;
          <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">
            View on Etherscan →
          </a>
        </div>
      )}

      {/* Score / Profile Card */}
      <div className="score-card" style={{ marginBottom: "1.2rem" }}>
        <div className="score-card-inner">
          <div>
            {/* Avatar + Name + Level */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.2rem" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #9333ea, #c084fc)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                  boxShadow: "0 0 20px rgba(147, 51, 234, 0.3)",
                }}
              >
                {initials}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {studentName || "Unregistered Student"}
                </div>
                <span className={`score-level ${LEVEL_CLASS[level] || "level-newcomer"}`}>
                  {LEVEL_ICON[level] || "◌"} {level}
                </span>
              </div>
            </div>

            <div className="score-label">Reputation Score</div>
            <div className="score-value">
              {balance}
              <span>CAMP</span>
            </div>

            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(progress.pct, 100)}%` }} />
            </div>
            <div className="progress-label">{progress.label}</div>
          </div>

          <div className="score-visual">
            <div className="score-ring">
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke="url(#profile-grad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(Math.min(progress.pct, 100) / 100) * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
                <defs>
                  <linearGradient id="profile-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#c084fc" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="score-ring-label">
                <span className="score-ring-pct" style={{ color: "#c084fc" }}>
                  {Math.min(progress.pct, 100).toFixed(0)}%
                </span>
                <span className="score-ring-sub">TO NEXT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Address Card */}
      <div className="card" style={{ marginBottom: "1.2rem" }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Wallet Address
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.78rem",
            color: "var(--text-mono)",
            wordBreak: "break-all",
            marginBottom: "12px",
          }}
        >
          {account}
        </div>
        <button
          className="btn-secondary"
          onClick={handleCopy}
          style={{ width: "auto", padding: "8px 16px", fontSize: "0.82rem" }}
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      {/* Badges */}
      <div className="card card-amber" style={{ marginBottom: "1.2rem" }}>
        <div className="card-title">
          <span className="card-title-icon">🏅</span>
          My Badges
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              fontWeight: 400,
            }}
          >
            {Object.values(ownedBadges).filter(Boolean).length}/3 owned
          </span>
        </div>
        <div className="badges-grid">
          {BADGE_TYPES.map((badge) => {
            const owned = ownedBadges[badge.type];
            return (
              <div key={badge.type} className={`badge-card ${owned ? "owned" : ""}`}>
                <span className="badge-emoji">{badge.emoji}</span>
                <div className="badge-name">{badge.label}</div>
                {owned ? (
                  <span className="badge-owned-tag">✓ Owned</span>
                ) : (
                  <span className="badge-locked">🔒 Locked</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Code Section */}
      <div className="card" style={{ textAlign: "center" }}>
        <div className="card-title" style={{ justifyContent: "center" }}>
          <span className="card-title-icon">◈</span>
          On-Chain Verification
        </div>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            marginBottom: "1.2rem",
          }}
        >
          Scan to verify my on-chain reputation
        </p>
        <div
          style={{
            display: "inline-block",
            background: "#fff",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.2rem",
          }}
        >
          <QRCodeSVG
            id="profile-qr"
            value={`https://sepolia.etherscan.io/address/${account}`}
            size={180}
          />
        </div>
        <div>
          <button
            className="btn-primary"
            onClick={handleDownloadQR}
            style={{ width: "auto", padding: "12px 24px", display: "inline-block" }}
          >
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
}
