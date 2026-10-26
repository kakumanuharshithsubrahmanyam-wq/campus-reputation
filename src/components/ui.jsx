import { useEffect, useRef } from 'react'
import { BadgeCheck, X, ExternalLink } from 'lucide-react'
import { txUrl } from '../utils/etherscan.js'
import { formatDate, shortAddress } from '../utils/format.js'

export const Card = ({ children, className = '', ...p }) => <section className={`card ${className}`} {...p}>{children}</section>

export const CardHead = ({ title, action }) => (
  <div className="card-head"><h3>{title}</h3>{action}</div>
)

export const PageHeader = ({ title, text, action }) => (
  <div className="page-head"><div><h2>{title}</h2>{text && <p>{text}</p>}</div>{action}</div>
)

export const Button = ({ variant = 'secondary', className = '', ...p }) => (
  <button className={`btn ${variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : variant === 'danger' ? 'btn-danger' : ''} ${className}`} {...p} />
)

export const Chip = ({ tone = '', children }) => <span className={`chip ${tone ? 'chip-' + tone : ''}`}>{children}</span>

export const Verified = () => <Chip tone="ok"><BadgeCheck size={13} aria-hidden /> Verified on-chain</Chip>

export const Avatar = ({ initials, large }) => <span className={`avatar ${large ? 'lg' : ''}`} aria-hidden>{initials}</span>

export const initialsOf = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export const Progress = ({ value, label }) => (
  <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
    <span style={{ width: `${value}%` }} />
  </div>
)

export const Mono = ({ children }) => <span className="mono">{children}</span>

export function ProofModal({ open, onClose, proof, title }) {
  const closeRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement
    closeRef.current?.focus()
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => {
      window.removeEventListener('keydown', h)
      prev?.focus?.()
    }
  }, [open, onClose])
  if (!open || !proof) return null
  const rows = [
    ['Network', proof.network || 'Ethereum Sepolia'],
    ['Transaction', proof.transactionHash, true],
    ['Block', proof.blockNumber != null ? String(proof.blockNumber) : '—'],
    ['Student', proof.studentWallet, true],
    ['Teacher', proof.teacherWallet || '—', Boolean(proof.teacherWallet)],
    ['Contract', proof.contractAddress, true],
    ['Timestamp', formatDate(proof.timestamp)],
  ]
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="proof-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className="card-head">
          <div>
            <h3 id="proof-title" style={{ fontSize: 17, fontWeight: 600 }}>Verified on-chain</h3>
            <p className="muted sm">{title || 'Blockchain proof'}</p>
          </div>
          <button ref={closeRef} className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <Verified />
        {rows.map(([k, v, mono]) => (
          <div className="kv" key={k}>
            <span className="muted sm">{k}</span>
            {mono ? <Mono style={{ wordBreak: 'break-all' }}>{v}</Mono> : <span>{v}</span>}
          </div>
        ))}
        {proof.transactionHash && (
          <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
            <a className="btn" href={txUrl(proof.transactionHash)} target="_blank" rel="noreferrer noopener">
              View on Etherscan <ExternalLink size={14} />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ title, text }) {
  return (
    <Card>
      <h4 style={{ fontWeight: 600, marginBottom: 8 }}>{title}</h4>
      <p className="sec">{text}</p>
    </Card>
  )
}

export function LoadingBlock({ text = 'Loading…' }) {
  return <Card><p className="sec muted">{text}</p></Card>
}
