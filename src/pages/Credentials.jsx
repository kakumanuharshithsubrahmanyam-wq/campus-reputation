import { useEffect, useState } from 'react'
import { Medal, Lock } from 'lucide-react'
import { Card, CardHead, PageHeader, Chip, Progress, ProofModal, LoadingBlock, EmptyState, Button } from '../components/ui.jsx'
import { BarList } from '../components/charts.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { useCampusData } from '../context/CampusDataContext.jsx'
import { getStudentAchievements } from '../services/students.js'
import { mapAchievement } from '../utils/achievementMap.js'
import { progressToNextLevel, levelTone } from '../utils/levels.js'
import { ON_CHAIN_BADGES } from '../blockchain/config.js'
import { claimBadge } from '../blockchain/transactions.js'
export function Achievements() {
  const { account } = useWallet()
  const [filter, setFilter] = useState('All')
  const [proof, setProof] = useState(null)
  const [proofTitle, setProofTitle] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!account) return
    setLoading(true)
    getStudentAchievements(account, 1, 50)
      .then((r) => setList((r.items || []).map(mapAchievement)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [account])

  const categories = ['All', ...new Set(list.map((a) => a.category))]
  const filtered = list.filter((a) => filter === 'All' || a.category === filter)

  return (
    <div className="page">
      <PageHeader title="Achievements" text="Credentials awarded to you by faculty, each recorded on-chain." action={
        <select className="input" style={{ width: 170 }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by category">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>} />
      {loading && <LoadingBlock />}
      {error && <p className="err-text">{error}</p>}
      {!loading && filtered.length === 0 && (
        <EmptyState title="No achievements yet" text="Verified achievements awarded by faculty will appear here after awards are approved on Sepolia and indexed." />
      )}
      <div className="grid g-cards">
        {filtered.map((a) => (
          <Card key={a.id} className="cred">
            <div className="row between"><Chip>{a.category}</Chip><span className="points">+{a.points} CAMP</span></div>
            <h4>{a.title}</h4>
            <div className="sm muted">{a.date}</div>
            <div className="sm"><span className="muted">Recognized by</span><br />{a.by}</div>
            <div className="cred-foot">
              <Chip tone="ok">Verified on-chain</Chip>
              <button type="button" className="btn btn-ghost" onClick={() => { setProof(a.proof); setProofTitle(a.title) }}>View proof</button>
            </div>
          </Card>
        ))}
      </div>
      <ProofModal open={!!proof} proof={proof} title={proofTitle} onClose={() => setProof(null)} />
    </div>
  )
}

export function Reputation() {
  const { score, level, data, loading } = useCampusData()
  const { account } = useWallet()
  const [breakdown, setBreakdown] = useState([])
  const prog = progressToNextLevel(score, level)

  useEffect(() => {
    if (!account) return
    getStudentAchievements(account, 1, 100)
      .then((r) => {
        const mapped = (r.items || []).map(mapAchievement)
        setBreakdown(mapped.reduce((acc, a) => {
          const row = acc.find((x) => x.label === a.category)
          if (row) row.value += a.points
          else acc.push({ label: a.category, value: a.points })
          return acc
        }, []))
      })
      .catch(() => setBreakdown([]))
  }, [account, score])

  if (loading && !data) return <LoadingBlock />

  return (
    <div className="page">
      <PageHeader title="Reputation" text="How your CAMP Score has grown and where it comes from." />
      <div className="grid g-3">
        <Card><div className="cap">CAMP Score</div><div className="metric" style={{ marginTop: 8 }}>{Number(score).toLocaleString()}</div></Card>
        <Card><div className="cap">Level</div><div className="metric" style={{ marginTop: 8 }}>{level}</div></Card>
        <Card><div className="cap">{prog.next ? `To ${prog.next}` : 'On-chain max'}</div><div className="metric" style={{ marginTop: 8 }}>{prog.next ? `${Math.round(prog.pct)}%` : 'Gold'}</div></Card>
      </div>
      <div className="grid g-2">
        <Card><CardHead title="By category" /><BarList data={breakdown} /></Card>
        <Card>
          <CardHead title="Level progress" />
          <div className="stack">
            <div className="row between sm"><span>{level}</span><span className="muted">{prog.label}</span></div>
            <Progress value={Math.round(prog.pct)} label={prog.label} />
            <p className="sm sec">On-chain levels are Newcomer, Bronze, Silver, and Gold. Platinum is not an on-chain tier.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function Badges() {
  const { data, score, refresh } = useCampusData()
  const { canWrite } = useWallet()
  const badges = data?.badges || {}
  const [claiming, setClaiming] = useState('')
  const [msg, setMsg] = useState('')

  const onClaim = async (type) => {
    if (!canWrite) {
      setMsg('Connect MetaMask on Sepolia to claim badges.')
      return
    }
    setClaiming(type)
    setMsg('')
    try {
      await claimBadge(type)
      setMsg('Badge claim confirmed on-chain. Updating Campus Reputation…')
      await refresh()
    } catch (e) {
      setMsg(e.reason || e.message || 'Claim failed')
    } finally {
      setClaiming('')
    }
  }

  return (
    <div className="page">
      <PageHeader title="Badges" text="On-chain milestone badges minted from the Sepolia badge contract." />
      {msg && <p className="sec sm" role="status">{msg}</p>}
      <div className="grid g-cards">
        {ON_CHAIN_BADGES.map((b) => {
          const earned = Boolean(badges[b.type])
          const eligible = Number(score) >= b.min
          return (
            <Card key={b.type} className={`cred ${earned ? '' : 'locked'}`}>
              <div className="row" style={{ gap: 16 }}>
                <span className={`medal ${b.type.toLowerCase()}`}>{earned ? <Medal size={26} /> : <Lock size={24} />}</span>
                <div><h4>{b.label}</h4><div className="sm muted">{b.type} · {b.min}+ CAMP</div></div>
              </div>
              <p className="sm sec">{earned ? 'Minted on Sepolia.' : eligible ? 'You meet the CAMP threshold. Claim when ready.' : `Reach ${b.min} CAMP to unlock.`}</p>
              <div className="cred-foot">
                {earned ? <Chip tone="ok">Verified NFT</Chip> : eligible ? (
                  <Button variant="primary" disabled={!!claiming} onClick={() => onClaim(b.type)}>
                    {claiming === b.type ? 'Confirm in MetaMask…' : 'Claim badge'}
                  </Button>
                ) : <Chip>Locked</Chip>}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
