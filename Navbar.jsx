export default function Navbar({ account, isTeacher, activeTab, setActiveTab }) {
  const short = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "";

  const tabs = [
    { id: "student", label: "Student Dashboard", icon: "◈" },
    { id: "profile", label: "My Profile", icon: "◎" },
    ...(isTeacher ? [{ id: "teacher", label: "Teacher Dashboard", icon: "⬡" }] : []),
    { id: "leaderboard", label: "Leaderboard", icon: "◉" },
    { id: "activity", label: "Activity Feed", icon: "◐" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">🎓</div>
        <span className="brand-name">Campus<span>Token</span></span>
      </div>

      <div className="navbar-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        <div className="network-badge">
          <span className="network-dot" />
          Sepolia
        </div>
        {isTeacher && <span className="teacher-badge">⚡ Teacher</span>}
        <span className="wallet-address">{short}</span>
      </div>
    </nav>
  );
}
