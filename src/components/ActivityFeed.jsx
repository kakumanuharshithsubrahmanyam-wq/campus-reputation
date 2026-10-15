import { useState, useEffect, useCallback } from "react";
import { rawAmount } from "../../campTokens";

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(unixTimestamp) {
  const seconds = Math.floor(Date.now() / 1000) - unixTimestamp;
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function ActivityFeed({ tokenContract, provider }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async (isInitial = false) => {
    if (!tokenContract || !provider) return;

    if (isInitial) setLoading(true);
    try {
      setError("");
      const logs = await tokenContract.queryFilter(
        tokenContract.filters.TokensAwarded()
      );

      const sorted = [...logs]
        .sort((a, b) => {
          if (b.blockNumber !== a.blockNumber) return b.blockNumber - a.blockNumber;
          return b.index - a.index;
        })
        .slice(0, 20);

      const blockNumbers = [...new Set(sorted.map((e) => e.blockNumber))];
      const blockTimestamps = {};

      await Promise.all(
        blockNumbers.map(async (bn) => {
          const block = await provider.getBlock(bn);
          blockTimestamps[bn] = block?.timestamp ?? 0;
        })
      );

      const formatted = sorted.map((e) => ({
        student: e.args.student,
        amount: rawAmount(e.args.amount),
        reason: e.args.reason,
        txHash: e.transactionHash,
        timestamp: blockTimestamps[e.blockNumber],
      }));

      setEvents(formatted);
    } catch (e) {
      setError(e.reason || e.message || "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [tokenContract, provider]);

  useEffect(() => {
    fetchEvents(true);
    const id = setInterval(() => fetchEvents(false), 30000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 className="section-heading">◐ Activity Feed</h2>
        <p className="section-sub">
          Live on-chain token awards — refreshes every 30 seconds
        </p>
      </div>

      {/* Feed card */}
      <div className="card card-amber">
        <div className="card-title">
          <span className="card-title-icon">🏆</span>
          Recent Awards
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              fontWeight: 400,
            }}
          >
            {events.length} / 20
          </span>
        </div>

        {error && (
          <p
            style={{
              color: "#f87171",
              fontSize: "0.88rem",
              marginBottom: "1rem",
            }}
          >
            {error}
          </p>
        )}

        {loading && events.length === 0 ? (
          <div>
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              Loading activity...
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
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">No activity yet</div>
          </div>
        ) : (
          <div
            style={{
              maxHeight: "480px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            {events.map((event) => (
              <a
                key={`${event.txHash}-${event.student}`}
                href={`https://sepolia.etherscan.io/tx/${event.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="leaderboard-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr auto",
                  gap: "1rem",
                  alignItems: "center",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                {/* Emoji */}
                <div className="rank-num">
                  <span className="rank-medal">🏆</span>
                </div>

                {/* Address + reason + time */}
                <div>
                  <div className="lb-addr">
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {shortenAddress(event.student)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                      marginTop: "2px",
                    }}
                  >
                    {event.reason}
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {timeAgo(event.timestamp)}
                  </div>
                </div>

                {/* Amount */}
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "#d8b4fe",
                    textAlign: "right",
                  }}
                >
                  +{event.amount}
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      marginLeft: "3px",
                    }}
                  >
                    CAMP
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
