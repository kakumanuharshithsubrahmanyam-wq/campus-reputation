import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { rawAmount } from "./campTokens";

const REASONS = [
  "Attendance",
  "Participation",
  "Volunteering",
  "Workshop Completed",
  "Competition Winner",
];

function shortenAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatStudentOption(student) {
  const short = `${student.addr.slice(0, 6)}...${student.addr.slice(-4)}`;
  const bal = Math.floor(Number(student.balance));
  if (student.name) return `${student.name} — ${short} (${bal} CAMP)`;
  return `${short} (${bal} CAMP)`;
}

export default function TeacherDashboard({ tokenContract, isOwner, registeredStudents = [] }) {
  const [myAddress, setMyAddress] = useState("");
  const [teacherAddr, setTeacherAddr] = useState("");
  const [addingTeacher, setAddingTeacher] = useState(false);
  const [addTeacherError, setAddTeacherError] = useState("");
  const [addTeacherSuccess, setAddTeacherSuccess] = useState("");
  const [studentAddr, setStudentAddr] = useState("");
  const [manualAddressMode, setManualAddressMode] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [proposing, setProposing] = useState(false);
  const [proposeError, setProposeError] = useState("");
  const [proposeSuccess, setProposeSuccess] = useState(null);

  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [proposalsError, setProposalsError] = useState("");
  const [approvingId, setApprovingId] = useState(null);
  const [approveError, setApproveError] = useState("");
  const [approveSuccess, setApproveSuccess] = useState("");

  useEffect(() => {
    async function resolveAddress() {
      try {
        if (tokenContract?.runner?.getAddress) {
          setMyAddress(await tokenContract.runner.getAddress());
        }
      } catch (e) {
        console.error(e);
      }
    }
    resolveAddress();
  }, [tokenContract]);

  const loadProposals = useCallback(async () => {
    if (!tokenContract) return;
    setLoadingProposals(true);
    setProposalsError("");
    try {
      const count = Number(await tokenContract.proposalCount());
      const items = [];

      for (let i = 0; i < count; i++) {
        const p = await tokenContract.proposals(i);
        const approved = myAddress
          ? await tokenContract.hasApproved(i, myAddress)
          : false;

        items.push({
          proposalId: i,
          student: p.student,
          amount: rawAmount(p.amount),
          reason: p.reason,
          proposer: p.proposer,
          approvalCount: Number(p.approvalCount),
          executed: p.executed,
          hasApproved: approved,
        });
      }

      setProposals(items);
    } catch (e) {
      setProposalsError(e.reason || e.message || "Failed to load proposals");
    } finally {
      setLoadingProposals(false);
    }
  }, [tokenContract, myAddress]);

  useEffect(() => {
    if (tokenContract) loadProposals();
  }, [loadProposals, tokenContract]);

  const handlePropose = async () => {
    if (!studentAddr || !amount) {
      setProposeError("Please fill all fields");
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(studentAddr)) {
      setProposeError("Invalid wallet address format");
      return;
    }

    try {
      setProposing(true);
      setProposeError("");
      setProposeSuccess(null);

      const tokenAmount = Math.floor(Number(amount));
      if (!Number.isFinite(tokenAmount) || tokenAmount < 1) {
        setProposeError("Please enter a valid token amount");
        return;
      }

      const tx = await tokenContract.proposeAward(
        studentAddr,
        tokenAmount,
        reason
      );
      const receipt = await tx.wait();

      let proposalId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = tokenContract.interface.parseLog(log);
          if (parsed?.name === "AwardProposed") {
            proposalId = parsed.args.proposalId.toString();
            break;
          }
        } catch {
          // skip unrelated logs
        }
      }

      setProposeSuccess({ proposalId: proposalId ?? "?", txHash: tx.hash });
      setStudentAddr("");
      setAmount("");
      await loadProposals();
    } catch (e) {
      setProposeError(e.reason || e.message || "Transaction failed");
    } finally {
      setProposing(false);
    }
  };

  const handleApprove = async (proposalId) => {
    try {
      setApprovingId(proposalId);
      setApproveError("");
      setApproveSuccess("");
      const tx = await tokenContract.approveAward(proposalId);
      await tx.wait();
      setApproveSuccess(tx.hash);
      await loadProposals();
    } catch (e) {
      setApproveError(e.reason || e.message || "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  const isApproveDisabled = (proposal) =>
    proposal.hasApproved ||
    proposal.proposer.toLowerCase() === myAddress.toLowerCase() ||
    proposal.executed;

  const handleAddTeacher = async () => {
    if (!teacherAddr) {
      setAddTeacherError("Please enter a wallet address");
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(teacherAddr)) {
      setAddTeacherError("Invalid wallet address format");
      return;
    }

    try {
      setAddingTeacher(true);
      setAddTeacherError("");
      setAddTeacherSuccess("");
      const tx = await tokenContract.addTeacher(teacherAddr);
      await tx.wait();
      setAddTeacherSuccess(tx.hash);
      setTeacherAddr("");
    } catch (e) {
      setAddTeacherError(e.reason || e.message || "Failed to add teacher");
    } finally {
      setAddingTeacher(false);
    }
  };

  return (
    <div>
      {/* Manage Teachers — owner only */}
      {isOwner && (
        <div className="card card-amber" style={{ marginBottom: "1.2rem" }}>
          <div className="card-title">
            <span className="card-title-icon">👨‍🏫</span>
            Manage Teachers
          </div>

          {addTeacherError && (
            <p style={{ color: "#f87171", fontSize: "0.88rem", marginBottom: "1rem" }}>
              {addTeacherError}
            </p>
          )}
          {addTeacherSuccess && (
            <p style={{ color: "#4ade80", fontSize: "0.88rem", marginBottom: "1rem" }}>
              ✅ Teacher added successfully!{" "}
              <a
                href={`https://sepolia.etherscan.io/tx/${addTeacherSuccess}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4ade80", textDecoration: "underline" }}
              >
                View on Etherscan →
              </a>
            </p>
          )}

          <div className="form-group">
            <label className="form-label">Teacher Wallet Address</label>
            <input
              className="form-input"
              value={teacherAddr}
              onChange={(e) => setTeacherAddr(e.target.value)}
              placeholder="0x... teacher wallet"
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleAddTeacher}
            disabled={addingTeacher}
            style={{ padding: "14px", marginBottom: "0.8rem" }}
          >
            {addingTeacher ? (
              <><span className="spinner" />Adding...</>
            ) : "Add Teacher"}
          </button>

          <p style={{ color: "#6b7280", fontSize: "0.75rem", lineHeight: 1.5 }}>
            Only the contract owner can add teachers.
            Teachers can propose and approve token awards.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="teacher-header">
        <div className="teacher-role-badge">⚡ Verified Teacher</div>
        <h2 className="teacher-heading">⬡ Teacher Dashboard</h2>
        <p className="teacher-sub">
          Propose token awards for peer teacher approval on the Sepolia blockchain
        </p>
      </div>

      {/* Section A — Propose Award */}
      <div className="card card-amber" style={{ marginBottom: "1.2rem" }}>
        <div className="card-title">
          <span className="card-title-icon">🏫</span>
          Propose Award
        </div>

        {proposeError && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            ⚠ {proposeError}
          </div>
        )}
        {proposeSuccess && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            ✅ Proposal #{proposeSuccess.proposalId} submitted! &nbsp;
            <a
              href={`https://sepolia.etherscan.io/tx/${proposeSuccess.txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Etherscan →
            </a>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Student Wallet Address</label>
          {manualAddressMode ? (
            <>
              <input
                className="form-input"
                value={studentAddr}
                onChange={(e) => setStudentAddr(e.target.value)}
                placeholder="0x..."
              />
              <button
                type="button"
                onClick={() => {
                  setManualAddressMode(false);
                  setStudentAddr("");
                }}
                style={{
                  marginTop: "8px",
                  background: "none",
                  border: "none",
                  color: "#d8b4fe",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Pick from list instead
              </button>
            </>
          ) : (
            <>
              <select
                className="form-select"
                value={studentAddr}
                onChange={(e) => setStudentAddr(e.target.value)}
              >
                <option value="">Select a registered student...</option>
                {registeredStudents.map((s) => (
                  <option key={s.addr} value={s.addr}>
                    {formatStudentOption(s)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setManualAddressMode(true);
                  setStudentAddr("");
                }}
                style={{
                  marginTop: "8px",
                  background: "none",
                  border: "none",
                  color: "#d8b4fe",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Enter address manually instead
              </button>
            </>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Amount (CAMP Tokens)</label>
          <input
            className="form-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50"
            type="number"
            min="1"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reason</label>
          <select
            className="form-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <button
          className="btn-primary"
          onClick={handlePropose}
          disabled={proposing}
          style={{ padding: "14px" }}
        >
          {proposing ? (
            <><span className="spinner" />Loading...</>
          ) : "Propose Award"}
        </button>
      </div>

      {/* Section B — Pending Proposals */}
      <div className="card card-amber">
        <div className="card-title">
          <span className="card-title-icon">⏳</span>
          Pending Proposals
          <button
            className="btn-secondary"
            onClick={loadProposals}
            disabled={loadingProposals}
            style={{
              marginLeft: "auto",
              width: "auto",
              padding: "6px 12px",
              fontSize: "0.8rem",
            }}
          >
            {loadingProposals ? "Loading..." : "Refresh"}
          </button>
        </div>

        {proposalsError && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            ⚠ {proposalsError}
          </div>
        )}
        {approveError && (
          <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
            ⚠ {approveError}
          </div>
        )}
        {approveSuccess && (
          <div className="alert alert-success" style={{ marginBottom: "1rem" }}>
            ✓ Approval submitted! &nbsp;
            <a
              href={`https://sepolia.etherscan.io/tx/${approveSuccess}`}
              target="_blank"
              rel="noreferrer"
            >
              View on Etherscan →
            </a>
          </div>
        )}

        {loadingProposals ? (
          <div className="lb-loading">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="lb-skeleton"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text" style={{ color: "var(--text-muted)" }}>
              No proposals yet
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {proposals.map((proposal) => {
              const approvalPct = (proposal.approvalCount / 2) * 100;
              const disabled = isApproveDisabled(proposal);

              return (
                <div key={proposal.proposalId} className="leaderboard-row" style={{ display: "block" }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <div className="lb-addr">
                        <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                          {shortenAddress(proposal.student)}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        <span style={{ color: "var(--amber)", fontWeight: 600 }}>+{proposal.amount} CAMP</span>
                        {" — "}{proposal.reason}
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        Proposer: {shortenAddress(proposal.proposer)}
                      </div>
                    </div>

                    {proposal.executed && (
                      <span
                        style={{
                          color: "#4ade80",
                          background: "rgba(20, 83, 45, 0.6)",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        ✅ Tokens Awarded
                      </span>
                    )}
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <div className="progress-label" style={{ marginBottom: "4px" }}>
                      {proposal.approvalCount}/2 Approvals
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(approvalPct, 100)}%`,
                          background: "linear-gradient(90deg, #7c3aed, #c084fc)",
                        }}
                      />
                    </div>
                  </div>

                  {!proposal.executed && (
                    <button
                      className="btn-primary"
                      onClick={() => handleApprove(proposal.proposalId)}
                      disabled={disabled || approvingId === proposal.proposalId}
                      style={{ width: "auto", padding: "8px 16px", fontSize: "0.82rem" }}
                    >
                      {approvingId === proposal.proposalId ? (
                        <><span className="spinner" />Loading...</>
                      ) : proposal.hasApproved ? (
                        "Already Approved"
                      ) : proposal.proposer.toLowerCase() === myAddress.toLowerCase() ? (
                        "Cannot Approve Own"
                      ) : (
                        "Approve"
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
