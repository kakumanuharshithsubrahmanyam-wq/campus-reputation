import { useWallet } from '../context/WalletContext.jsx'
import { Button } from './ui.jsx'

export default function NetworkBanner() {
  const { isConnected, isSepolia, switchToSepolia } = useWallet()
  if (!isConnected || isSepolia) return null
  return (
    <div className="notice warn" role="status" style={{ margin: '0 0 16px' }}>
      <div style={{ flex: 1 }}>Switch to Ethereum Sepolia to view live reputation data and submit transactions.</div>
      <Button variant="primary" onClick={switchToSepolia}>Switch to Sepolia</Button>
    </div>
  )
}
