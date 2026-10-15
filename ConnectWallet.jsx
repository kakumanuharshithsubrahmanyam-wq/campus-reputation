export default function ConnectWallet({ connect }) {
  return (
    <div className="connect-page">
      <div className="connect-container">
        {/* LEFT — branding */}
        <div className="connect-left">
          <div className="connect-eyebrow">Blockchain · Sepolia Testnet</div>
          <h1 className="connect-title">
            Campus
            <span className="accent">Reputation</span>
          </h1>
          <p className="connect-desc">
            Every token earned. Every badge minted. Every achievement — permanently recorded on-chain.
            No favoritism. No manipulation. Just proof.
          </p>
          <div className="connect-features">
            {[
              "Tamper-proof reputation scores on Ethereum",
              "NFT badges for real academic achievements",
              "Token decay ensures active participation",
              "Transparent, verifiable student records"
            ].map(f => (
              <div className="connect-feature" key={f}>
                <span className="connect-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — connect */}
        <div className="connect-right">
          <div className="metamask-logo">🦊</div>
          <h2 className="connect-card-title">Connect Your Wallet</h2>
          <p className="connect-card-sub">
            Use MetaMask on the Sepolia testnet to access your on-chain reputation dashboard.
          </p>
          <button className="btn-connect" onClick={connect}>
            Connect MetaMask
          </button>
          <p className="connect-note">
            <span>🔒</span>
            Read-only connection — we never request funds
          </p>
        </div>
      </div>
    </div>
  );
}
