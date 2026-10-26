import { Navigate } from 'react-router-dom'
import { useWallet } from '../context/WalletContext.jsx'
import { Card, PageHeader, LoadingBlock } from './ui.jsx'

export function RequireWallet({ children }) {
  const { isConnected } = useWallet()
  if (!isConnected) return <Navigate to="/connect" replace />
  return children
}

export function RequireTeacher({ children }) {
  const { isTeacher, isOwner, rolesLoading } = useWallet()
  if (rolesLoading) {
    return <div className="page"><LoadingBlock text="Verifying faculty access…" /></div>
  }
  if (!isTeacher && !isOwner) {
    return (
      <div className="page">
        <PageHeader title="Access denied" text="This area is for authorized faculty wallets." />
        <Card><p className="sec">Connect a wallet that has been authorized as a teacher on Sepolia.</p></Card>
      </div>
    )
  }
  return children
}

export function RequireOwner({ children }) {
  const { isOwner, rolesLoading } = useWallet()
  if (rolesLoading) {
    return <div className="page"><LoadingBlock text="Verifying administrator access…" /></div>
  }
  if (!isOwner) {
    return (
      <div className="page">
        <PageHeader title="Access denied" text="Administrator access requires the contract owner wallet." />
        <Card><p className="sec">Connect the campus contract owner wallet to manage teachers and view admin stats.</p></Card>
      </div>
    )
  }
  return children
}
