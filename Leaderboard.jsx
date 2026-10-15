import { useState, useEffect, useCallback } from "react";
import { fetchStudentsWithBalances } from "./campTokens";

const MEDALS = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function Leaderboard({ currentAccount, tokenContract }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRankings = useCallback(async () => {
    if (!tokenContract) {
      setRankings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const students = await fetchStudentsWithBalances(tokenContract);
      setRankings(students.slice(0, 10));
    } catch (e) {
      setError(e.reason || e.message || "Failed to load leaderboard");
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, [tokenContract]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  useEffect(() => {
    if (!tokenContract) return;

    const refresh = () => loadRankings();
    tokenContract.on(tokenContract.filters.TokensAwarded(), refresh);
    tokenContract.on(tokenContract.filters.TokensDecayed(), refresh);

    return () => {
      tokenContract.off(tokenContract.filters.TokensAwarded(), refresh);
      tokenContract.off(tokenContract.filters.TokensDecayed(), refresh);
    };
  }, [tokenContract, loadRankings]);

  const totalTokens = rankings.reduce((sum, s) => sum + s.balance, 0);
  const topScore = rankings[0]?.balance || 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-heading">🏆 Leaderboard</h2>
        <p className="section-sub">
          Top students with on-chain CAMP tokens — live from Sepolia
        </p>
      </div>

      {error && (
        <p style={{ color: "#f87171", fontSize: "0.88rem", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {/* Stats row */}
      <div className="lb-stat-row">
        <div className="lb-stat">
          <div className="lb-stat-value">{rankings.length}</div>
          <div className="lb-stat-label">Students</div>
        </div>
        <div className="lb-stat">
          <div className="lb-stat-value">{totalTokens.toFixed(0)}</div>
          <div className="lb-stat-label">Total CAMP</div>
        </div>
        <div className="lb-stat">
          <div className="lb-stat-value">{topScore.toFixed(0)}</div>
          <div className="lb-stat-label">Top Score</div>
        </div>
      </div>

      {/* Leaderboard card */}
      <div
        className="card card-amber"
        style={{
          background: "#1f2937",
          borderRadius: "1rem",
          border: "1px solid #6b21a8",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.2rem",
          }}
        >
          <div className="card-title" style={{ marginBottom: 0 }}>
            <span className="card-title-icon">◉</span>
            Top 10 Students
          </div>
          <button
            onClick={loadRankings}
            disabled={loading}
            style={{
              background: "#374151",
              color: "#fff",
              fontSize: "0.8rem",
              padding: "4px 12px",
              borderRadius: "0.5rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#4b5563";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#374151";
            }}
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>

        {loading ? (
          <div>
            <p
              style={{
                fontSize: "0.88rem",
                color: "#9ca3af",
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              Loading leaderboard...
            </p>
            <div className="lb-loading">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="lb-skeleton"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        ) : rankings.length === 0 ? (
          <p
            style={{
              color: "#6b7280",
              textAlign: "center",
              padding: "2rem 0",
              fontSize: "0.9rem",
            }}
          >
            No students yet. Be the first to earn CAMP tokens!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {rankings.map((student, i) => {
              const isMe =
                student.addr?.toLowerCase() === currentAccount?.toLowerCase();
              const displayName = student.name || shortenAddress(student.addr);

              return (
                <div
                  key={student.addr}
                  style={{
                    background: "#374151",
                    borderRadius: "0.75rem",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    border: isMe ? "1px solid rgba(245, 166, 35, 0.3)" : "1px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>
                      {MEDALS[i] || `${i + 1}`}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.88rem",
                          fontFamily: "'JetBrains Mono', monospace",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {displayName}
                        {isMe && (
                          <span style={{ color: "var(--amber)", fontSize: "0.65rem", marginLeft: "6px" }}>
                            ← you
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#9ca3af", fontSize: "0.7rem", marginTop: "2px" }}>
                        {student.level || "Newcomer"}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div
                      style={{
                        color: "#d8b4fe",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {student.balance.toFixed(0)}
                    </div>
                    <div style={{ color: "#9ca3af", fontSize: "0.65rem" }}>CAMP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Levels legend */}
      <div className="card" style={{ marginTop: "1.2rem" }}>
        <div className="card-title">
          <span className="card-title-icon">◈</span>
          Reputation Levels
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.8rem" }}>
          {[
            { level: "Newcomer", range: "0–99", desc: "Just starting out" },
            { level: "Bronze", range: "100–299", desc: "Lab priority access" },
            { level: "Silver", range: "300–499", desc: "Seminar fast track" },
            { level: "Gold", range: "500+", desc: "Placement fast track" },
          ].map((item) => (
            <div
              key={item.level}
              style={{
                background: "var(--bg-elevated)",
                borderRadius: "var(--radius-sm)",
                padding: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  color: "var(--text-primary)",
                  marginBottom: "6px",
                }}
              >
                {item.level}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.72rem",
                  color: "var(--amber)",
                  marginBottom: "4px",
                }}
              >
                {item.range} CAMP
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
