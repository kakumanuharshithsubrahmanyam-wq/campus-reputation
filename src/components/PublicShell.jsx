import { Link } from 'react-router-dom'
import { Landmark } from 'lucide-react'

/** Minimal chrome for public pages (no wallet required). */
export default function PublicShell({ children }) {
  return (
    <div className="main" style={{ marginLeft: 0 }}>
      <header className="topbar" style={{ justifyContent: 'space-between' }}>
        <Link to="/connect" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <span className="brand-mark"><Landmark size={17} /></span>
          Campus Reputation
        </Link>
        <Link className="btn btn-ghost" to="/connect">Connect wallet</Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
