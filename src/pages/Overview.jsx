import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHead, Chip, Progress, ProofModal, LoadingBlock } from '../components/ui.jsx'
import { BarList } from '../components/charts.jsx'
import { useCampusData } from '../context/CampusDataContext.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { getStudentAchievements, getStudentActivity } from '../services/students.js'
import { mapAchievement } from '../utils/achievementMap.js'
import { progressToNextLevel, levelTone } from '../utils/levels.js'

export default function Overview() {
  const { account } = useWallet()
  const { data, loading, error, score, level, rank, achievementCount } = useCampusData()
  const [achievements, setAchievements] = useState([])
  const [activity, setActivity] = useState([])
  const [proof, setProof] = useState(null)
  const [proofTitle, setProofTitle] = useState('')

  const name = data?.onChainName || data?.profile?.name || 'there'
  const prog = progressToNextLevel(score, level)

  useEffect(() => {
    if (!account) return
    getStudentAchievements(account, 1, 4)
      .then((r) => setAchievements((r.items || []).map(mapAchievement)))
      .catch(() => setAchievements([]))
    getStudentActivity(account, 1, 4)
      .then((r) => setActivity(r.items || []))
      .catch(() => setActivity([]))
  }, [account, data?.campBalance])

  if (loading && !data) return <LoadingBlock text="Loading your dashboard…" />

  return (
    <div className="page">
      {error && <p className="sec sm muted" role="status">{error}</p>}
      <div className="page-head">
        <div><h2>Welcome back, {name.split(' ')[0]}</h2><p>Your verified achievements and CAMP Score at a glance.</p></div>
      </div>

      <div className="grid g-hero">
        <Card>
          <div className="row between">
            <span className="cap">CAMP Score · Campus Achievement &amp; Merit Points</span>
            <Chip tone={levelTone(level)}>{level} Level</Chip>
          </div>
          <div className="metric-xl" style={{ margin: '20px 0 4px' }}>{Number(score).toLocaleString()}</div>
          <p className="sec sm" style={{ marginBottom: 20 }}>{prog.next ? `${Math.round(prog.pct)}% toward ${prog.next}` : prog.label}</p>
          <Progress value={Math.round(prog.pct)} label={prog.label} />
        </Card>
        <div className="grid" style={{ gridTemplateRows: 'repeat(3, 1fr)', gap: 12 }}>
          {[['Campus rank', rank ? `#${rank}` : '—', 'Based on indexed students'], ['Verified achievements', achievementCount, 'Indexed from Sepolia'], ['Wallet', account?.slice(0, 10) + '…', 'Public profile available']].map(([l, v, s]) => (
            <Card key={l} style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><div className="cap">{l}</div><div className="sm muted">{s}</div></div>
              <div style={{ fontSize: l === 'Wallet' ? 14 : 24, fontWeight: 600 }}>{v}</div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid g-main">
        <Card>
          <CardHead title="Recent achievements" action={<Link to="/achievements" className="sm">View all</Link>} />
          {achievements.length === 0 ? (
            <p className="sec sm">No achievements yet. Verified achievements awarded by faculty will appear here.</p>
          ) : (
            <div className="tl">
              {achievements.map((a) => (
                <div className="tl-item" key={a.id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{a.title}</div>
                    <div className="sm muted">{a.category} · {a.date}</div>
                  </div>
                  <div className="stack" style={{ alignItems: 'flex-end', gap: 4 }}>
                    <span className="points">+{a.points}</span>
                    <button type="button" className="btn btn-ghost" style={{ height: 24, padding: '0 4px', fontSize: 12 }} onClick={() => { setProof(a.proof); setProofTitle(a.title) }}>Proof</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <CardHead title="Reputation breakdown" />
          <BarList data={achievements.reduce((acc, a) => {
            const row = acc.find((x) => x.label === a.category)
            if (row) row.value += a.points
            else acc.push({ label: a.category, value: a.points })
            return acc
          }, [])} />
          {achievements.length === 0 && <p className="sec sm">Breakdown appears once you have indexed achievements.</p>}
        </Card>
      </div>

      <Card>
        <CardHead title="Recent activity" action={<Link to="/activity" className="sm">View all</Link>} />
        {activity.length === 0 ? (
          <p className="sec sm">No activity recorded yet.</p>
        ) : (
          <div className="tl">
            {activity.slice(0, 4).map((a, i) => (
              <div className="tl-item" key={i}>
                <div>
                  <div style={{ fontWeight: 500 }}>{a.reason || a.type || a.eventName || 'Activity'}</div>
                  <div className="sm muted">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}</div>
                </div>
                {a.amount && <span className="points">+{a.amount}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ProofModal open={!!proof} proof={proof} title={proofTitle} onClose={() => setProof(null)} />
    </div>
  )
}
