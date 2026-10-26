import { Navigate } from 'react-router-dom'
import { Landmark } from 'lucide-react'
import { useWallet } from '../context/WalletContext.jsx'
import { Button, Card } from './ui.jsx'

export default function ConnectScreen() {
  const {
    connectWallet,
    isConnecting,
    hasMetaMask,
    error,
    isConnected,
    isSepolia,
    switchToSepolia,
  } = useWallet()

  if (isConnected && isSepolia) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="connect-wrap">
      <Card style={{ maxWidth: 480, margin: '48px auto', padding: 32 }}>
        <div className="brand" style={{ marginBottom: 24 }}>
          <span className="brand-mark"><Landmark size={17} /></span>
          Campus Reputation
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Connect your wallet</h2>
        <p className="sec sm" style={{ marginBottom: 24 }}>
          Use MetaMask on Ethereum Sepolia to access your CAMP Score, achievements, and faculty tools.
        </p>
        {!hasMetaMask && (
          <p className="err-text" role="alert">MetaMask is required to perform blockchain actions.</p>
        )}
        {error && <p className="err-text" role="alert">{error}</p>}
        {isConnected && !isSepolia && (
          <div className="stack" style={{ gap: 12, marginBottom: 16 }}>
            <p className="sec sm">Switch to Sepolia to continue.</p>
            <Button variant="primary" onClick={switchToSepolia}>Switch to Sepolia</Button>
          </div>
        )}
        <Button
          variant="primary"
          disabled={!hasMetaMask || isConnecting}
          onClick={connectWallet}
          style={{ width: '100%' }}
        >
          {isConnecting ? 'Connecting…' : 'Connect MetaMask'}
        </Button>
      </Card>
    </div>
  )
}
