import { useEffect, useState } from 'react'
import { SearchCheck, CircleAlert } from 'lucide-react'
import { Card, PageHeader, Chip, Avatar, Verified, Button, Mono, LoadingBlock, EmptyState } from '../components/ui.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { getLeaderboard } from '../services/leaderboard.js'
import { getActivity } from '../services/activity.js'
import { verifyWallet, verifyTransaction, verifyAchievement } from '../services/verification.js'
import { initialsFromName, shortAddress } from '../utils/format.js'
import { sameAddress } from '../utils/address.js'
import { txUrl } from '../utils/etherscan.js'
import { mapAchievement } from '../utils/achievementMap.js'

export function Leaderboard() {
  const { account } = useWallet()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getLeaderboard({ page: 1, limit: 50 })
      .then((r) => setRows(r.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <PageHeader title="Leaderboard" text="Top students by live CAMP Score on Sepolia." />
      {loading && <LoadingBlock />}
      {error && <p className="err-text">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <EmptyState title="No ranked students yet" text="No ranked students are available yet. Students appear after they hold a positive on-chain CAMP balance." />
      )}
      {rows.length > 0 && (
        <Card style={{ padding: 8 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Student</th><th>Department</th><th>Level</th><th className="num">CAMP Score</th></tr></thead>
              <tbody>
                {rows.map((s) => {
                  const me = account && sameAddress(s.wallet, account)
                  const label = s.name || shortAddress(s.wallet)
                  return (
                    <tr key={s.wallet} className={me ? 'me' : ''}>
                      <td style={{ width: 64 }}>{s.rank}</td>
                      <td><div className="row"><Avatar initials={initialsFromName(label, s.wallet)} /><span style={{ fontWeight: 500 }}>{label}{me && <span className="muted"> (you)</span>}</span></div></td>
                      <td className="sec">{s.department || '—'}</td>
                      <td><Chip tone={s.level === 'Gold' ? 'gold' : ''}>{s.level}</Chip></td>
                      <td className="num" style={{ fontWeight: 600 }}>{Number(s.campBalance).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export function ActivityPage() {
  const { account } = useWallet()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!account) return
    setLoading(true)
    getActivity({ page: 1, limit: 40, student: account })
      .then((r) => setItems(r.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [account])

  return (
    <div className="page">
      <PageHeader title="Activity" text="Awards, approvals and level changes on your record." />
      {loading && <LoadingBlock />}
      {error && <p className="err-text">{error}</p>}
      {!loading && items.length === 0 && (
        <EmptyState title="No activity yet" text="No activity recorded yet. Events appear after the backend indexer processes Sepolia transactions." />
      )}
      {items.length > 0 && (
        <Card>
          <div className="tl">
            {items.map((a, i) => (
              <div className="tl-item" key={i}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{a.reason || a.type || 'Event'}</div>
                  <div className="sm muted">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</div>
                  {a.transactionHash && (
                    <a className="sm" href={txUrl(a.transactionHash)} target="_blank" rel="noreferrer noopener">View blockchain proof</a>
                  )}
                </div>
                {a.amount && <span className="points">+{a.amount}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export function Verify() {
  const [q, setQ] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async (e) => {
    e.preventDefault()
    const v = q.trim()
    if (!v) return setResult({ status: 'error', error: 'Enter a wallet address, achievement ID, or transaction hash.' })
    setLoading(true)
    setResult(null)
    try {
      if (/^0x[0-9a-fA-F]{40}$/.test(v)) {
        const data = await verifyWallet(v)
        setResult({ status: 'verified', kind: 'wallet', data })
      } else if (/^0x[0-9a-fA-F]{64}$/.test(v)) {
        const data = await verifyTransaction(v)
        if (data.verified && !data.linkedAchievement) {
          setResult({ status: 'indexing_pending', kind: 'tx', data })
        } else {
          setResult({ status: data.verified ? 'verified' : 'invalid', kind: 'tx', data })
        }
      } else {
        const data = await verifyAchievement(v)
        setResult({ status: data.verified ? 'verified' : 'invalid', kind: 'achievement', data })
      }
    } catch (err) {
      setResult({ status: err.status === 404 ? 'not_found' : 'error', error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Verify achievement" text="Confirm reputation and achievement records using wallet, achievement ID, or Sepolia transaction hash." />
      <Card>
        <form className="stack" onSubmit={run} noValidate>
          <div className="field">
            <label htmlFor="q">Wallet, achievement ID, or transaction hash</label>
            <input id="q" className="input" placeholder="0x… or achievement id" value={q} onChange={(e) => setQ(e.target.value)} aria-invalid={!!(result && result.error)} />
            <div>{result?.error && <span className="err-text"><CircleAlert size={15} />{result.error}</span>}</div>
          </div>
          <div><Button variant="primary" type="submit" disabled={loading}><SearchCheck size={16} />{loading ? 'Verifying…' : 'Verify'}</Button></div>
        </form>
      </Card>
      {result?.status === 'verified' && result.kind === 'wallet' && (
        <Card><Verified /><p>CAMP Score: <strong>{result.data.campBalance}</strong> · Level: {result.data.reputationLevel}</p></Card>
      )}
      {result?.status === 'verified' && result.kind === 'achievement' && (() => {
        const a = mapAchievement(result.data.achievement)
        return (
          <Card className="cred">
            <Verified /><h4>{a.title}</h4>
            <div className="sm muted">{a.category} · {a.date}</div>
            <div className="sm">Transaction <Mono>{a.proof.transactionHash.slice(0, 18)}…</Mono></div>
          </Card>
        )
      })()}
      {result?.status === 'verified' && result.kind === 'tx' && (
        <Card><Verified /><p>Transaction confirmed on Sepolia (block {result.data.blockNumber ?? '—'}).</p></Card>
      )}
      {result?.status === 'indexing_pending' && result.kind === 'tx' && (
        <Card>
          <Verified />
          <p>Confirmed on Sepolia (block {result.data.blockNumber ?? '—'}).</p>
          <p className="sec sm">Indexing pending — Campus Reputation is updating. Check again in a few minutes.</p>
        </Card>
      )}
      {result?.status === 'not_found' && <Card><p className="sec">NOT FOUND — no matching indexed record.</p></Card>}
      {result?.status === 'invalid' && <Card><p className="sec">INVALID or unconfirmed on Sepolia.</p></Card>}
    </div>
  )
}
