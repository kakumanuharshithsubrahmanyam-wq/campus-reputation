import { useCallback, useEffect, useState } from 'react'
import { Check, CircleCheck, CircleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHead, PageHeader, Chip, Button, Avatar, LoadingBlock, EmptyState } from '../components/ui.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchAllProposals } from '../blockchain/tokenReads.js'
import { proposeAward, approveAward, addTeacher } from '../blockchain/transactions.js'
import { AWARD_REASONS } from '../blockchain/config.js'
import { listTeachers } from '../services/teachers.js'
import { getAdminStats } from '../services/admin.js'
import { initialsFromName, shortAddress } from '../utils/format.js'
import { sameAddress } from '../utils/address.js'

const Stat = ({ label, value, sub }) => (
  <Card><div className="cap">{label}</div><div className="metric" style={{ margin: '8px 0 2px' }}>{value}</div><div className="sm muted">{sub}</div></Card>
)

export function TeacherDashboard() {
  const { account } = useWallet()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!account) return
    setLoading(true)
    try {
      const items = await fetchAllProposals(account)
      setPending(items.filter((p) => !p.executed && !p.hasApproved && !sameAddress(p.proposer, account)))
    } catch {
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => { load() }, [load])

  return (
    <div className="page">
      <PageHeader title="Teacher dashboard" text="Recognize student work and keep track of your awards."
        action={<Link className="btn btn-primary" to="/teacher/award">Award a student</Link>} />
      <div className="grid g-3">
        <Stat label="Awaiting your approval" value={loading ? '…' : pending.length} sub="Open proposals on Sepolia" />
        <Stat label="Network" value="Sepolia" sub="Proposals require MetaMask" />
        <Stat label="Your wallet" value={shortAddress(account)} sub="Authorized teacher" />
      </div>
      <Card>
        <CardHead title="Awaiting your approval" action={<Link to="/teacher/approvals" className="sm">Review all</Link>} />
        {loading && <LoadingBlock />}
        {!loading && pending.length === 0 && <p className="sec sm">Nothing to review. New award requests will appear here.</p>}
        {!loading && pending.length > 0 && (
          <div className="tl">
            {pending.slice(0, 5).map((p) => (
              <div className="tl-item" key={p.proposalId}>
                <Avatar initials={p.student.slice(2, 4).toUpperCase()} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{p.reason}</div>
                  <div className="sm muted">{shortAddress(p.student)} · {p.approvalCount} approval(s)</div>
                </div>
                <span className="points">+{p.amount}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export function AwardStudent() {
  const { canWrite } = useWallet()
  const [f, setF] = useState({ student: '', title: '', category: AWARD_REASONS[0], points: '', note: '' })
  const [errors, setErrors] = useState({})
  const [txState, setTxState] = useState('idle')
  const [txMsg, setTxMsg] = useState('')

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (!/^0x[0-9a-fA-F]{40}$/.test(f.student.trim())) er.student = 'Enter a valid student wallet (0x…).'
    if (!f.title.trim()) er.title = 'Enter an achievement title.'
    if (!(Number(f.points) > 0)) er.points = 'Enter CAMP amount greater than 0.'
    setErrors(er)
    if (Object.keys(er).length) return
    if (!canWrite) {
      setTxMsg('Connect MetaMask on Sepolia to propose awards.')
      return
    }
    const reason = f.note.trim()
      ? `${f.category}: ${f.title} — ${f.note}`
      : `${f.category}: ${f.title}`
    setTxState('waiting')
    setTxMsg('Confirm award proposal in MetaMask.')
    try {
      const receipt = await proposeAward(f.student.trim(), f.points, reason)
      setTxState('confirmed')
      setTxMsg(`Confirmed on-chain (${receipt.hash.slice(0, 10)}…). Campus Reputation is updating — this may take a few minutes.`)
    } catch (err) {
      setTxState('failed')
      setTxMsg(err.code === 4001 ? 'Rejected in MetaMask.' : (err.reason || err.message || 'Transaction failed'))
    }
  }

  return (
    <div className="page">
      <PageHeader title="Award a student" text="On-chain fields are student wallet, CAMP amount, and reason. Title and category are included in the reason string." />
      {txMsg && <div className={`notice ${txState === 'failed' ? 'err' : 'ok'}`} role="status"><CircleCheck size={18} /><div>{txMsg}</div></div>}
      <Card style={{ maxWidth: 720 }}>
        <form className="form-grid" onSubmit={submit} noValidate>
          <div className="field"><label htmlFor="student">Student wallet</label>
            <input id="student" className="input" placeholder="0x…" value={f.student} onChange={set('student')} aria-invalid={!!errors.student} />
            {errors.student && <span className="err-text"><CircleAlert size={14} />{errors.student}</span>}</div>
          <div className="field"><label htmlFor="category">Category</label>
            <select id="category" className="input" value={f.category} onChange={set('category')}>{AWARD_REASONS.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div className="field"><label htmlFor="title">Achievement title</label>
            <input id="title" className="input" value={f.title} onChange={set('title')} aria-invalid={!!errors.title} />
            {errors.title && <span className="err-text">{errors.title}</span>}</div>
          <div className="field"><label htmlFor="points">CAMP points</label>
            <input id="points" type="number" min="1" className="input" value={f.points} onChange={set('points')} />
            {errors.points && <span className="err-text">{errors.points}</span>}</div>
          <div className="field span-2"><label htmlFor="note">Note (optional, stored in on-chain reason)</label>
            <textarea id="note" className="input" value={f.note} onChange={set('note')} /></div>
          <div className="span-2 row">
            <Button variant="primary" type="submit" disabled={txState === 'waiting'}>
              {txState === 'waiting' ? 'Waiting for MetaMask…' : 'Submit award proposal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export function Approvals() {
  const { account, canWrite } = useWallet()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    if (!account) return
    setLoading(true)
    try {
      const all = await fetchAllProposals(account)
      setItems(all.filter((p) => !p.executed))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => { load() }, [load])

  const approve = async (p) => {
    if (!canWrite) {
      setMsg('Switch to Sepolia to approve.')
      return
    }
    if (p.hasApproved || sameAddress(p.proposer, account)) return
    setApproving(p.proposalId)
    setMsg('')
    try {
      setMsg(`Waiting for MetaMask…`)
      const receipt = await approveAward(p.proposalId)
      setMsg(`Confirmed on-chain (${receipt.hash.slice(0, 10)}…). Campus Reputation is updating — this may take a few minutes.`)
      await load()
    } catch (e) {
      setMsg(e.code === 4001 ? 'Rejected in MetaMask.' : (e.reason || e.message))
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Approvals" text="Review awards before they are recorded on-chain. Rejection is not supported by the contract." />
      {msg && <div className="notice ok" role="status"><CircleCheck size={18} />{msg}</div>}
      {loading && <LoadingBlock />}
      {!loading && items.length === 0 && <EmptyState title="All caught up" text="Nothing to review. New award requests will appear here." />}
      {!loading && items.length > 0 && (
        <Card style={{ padding: 8 }}>
          <div className="table-wrap"><table>
            <thead><tr><th>Student</th><th>Reason</th><th className="num">CAMP</th><th>Status</th><th /></tr></thead>
            <tbody>{items.map((p) => {
              const disabled = p.hasApproved || p.executed || sameAddress(p.proposer, account)
              return (
                <tr key={p.proposalId}>
                  <td><div className="row"><Avatar initials={p.student.slice(2, 4).toUpperCase()} />{shortAddress(p.student)}</div></td>
                  <td><div style={{ fontWeight: 500 }}>{p.reason}</div><div className="sm muted">{p.approvalCount} approval(s){p.executed ? ' · Executed' : ''}</div></td>
                  <td className="num">+{p.amount}</td>
                  <td>{p.hasApproved ? <Chip tone="ok">You approved</Chip> : <Chip>Awaiting</Chip>}</td>
                  <td><div className="row" style={{ justifyContent: 'flex-end' }}>
                    <Button variant="primary" disabled={disabled || approving === p.proposalId} onClick={() => approve(p)}>
                      <Check size={15} />{approving === p.proposalId ? 'Pending…' : 'Approve'}
                    </Button>
                  </div></td>
                </tr>
              )
            })}</tbody>
          </table></div>
        </Card>
      )}
    </div>
  )
}

export function AdminDashboard() {
  const { authenticated, signIn, loading: authLoading } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authenticated) return
    getAdminStats()
      .then(setStats)
      .catch((e) => setError(e.message))
  }, [authenticated])

  return (
    <div className="page">
      <PageHeader title="Admin dashboard" text="Campus-wide activity across students and faculty." />
      {!authenticated && (
        <Card><p className="sec">Sign in with the owner wallet to load admin statistics.</p>
          <Button variant="primary" disabled={authLoading} onClick={signIn}>Sign in</Button></Card>
      )}
      {error && <p className="err-text">{error}</p>}
      {stats && (
        <div className="grid g-3">
          <Stat label="Students" value={stats.totalStudents ?? '—'} sub="Indexed profiles" />
          <Stat label="Achievements" value={stats.totalAchievements ?? '—'} sub="Indexed on-chain awards" />
          <Stat label="Teachers" value={stats.totalTeachers ?? '—'} sub="Profile records" />
        </div>
      )}
    </div>
  )
}

export function Teachers() {
  const { canWrite } = useWallet()
  const [list, setList] = useState([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ name: '', dept: '', wallet: '' })
  const [err, setErr] = useState('')
  const [txMsg, setTxMsg] = useState('')
  const [pending, setPending] = useState(false)

  const load = () => listTeachers(1, 100).then((r) => setList(r.items || [])).catch(() => setList([]))
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!/^0x[0-9a-fA-F]{40}$/.test(form.wallet.trim())) {
      setErr('Enter a valid teacher wallet address.')
      return
    }
    if (!canWrite) {
      setErr('Connect owner wallet on Sepolia.')
      return
    }
    setPending(true)
    setErr('')
    setTxMsg('Confirm addTeacher in MetaMask.')
    try {
      await addTeacher(form.wallet.trim())
      setTxMsg('Teacher authorized on-chain.')
      setShow(false)
      setForm({ name: '', dept: '', wallet: '' })
      load()
    } catch (e) {
      setErr(e.reason || e.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="page">
      <PageHeader title="Teachers" text="On-chain authorization via addTeacher(owner). Off-chain names come from indexed profiles." action={
        <Button variant="primary" onClick={() => setShow(!show)}>Add teacher</Button>} />
      {show && (
        <Card>
          <form className="form-grid" onSubmit={submit}>
            <div className="field"><label htmlFor="tw">Wallet address</label>
              <input id="tw" className="input" value={form.wallet} onChange={(e) => setForm({ ...form, wallet: e.target.value })} placeholder="0x…" /></div>
            <div className="field"><label htmlFor="tn">Name (off-chain profile when indexed)</label>
              <input id="tn" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="td">Department</label>
              <input id="td" className="input" value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} /></div>
            {err && <p className="err-text span-2">{err}</p>}
            {txMsg && <p className="sec sm span-2">{txMsg}</p>}
            <div className="span-2"><Button variant="primary" type="submit" disabled={pending}>{pending ? 'Transaction pending…' : 'Authorize on Sepolia'}</Button></div>
          </form>
        </Card>
      )}
      <Card style={{ padding: 8 }}>
        <div className="table-wrap"><table>
          <thead><tr><th>Teacher</th><th>Department</th><th>On-chain</th></tr></thead>
          <tbody>{list.length === 0 ? (
            <tr><td colSpan={3} className="sec">No teacher profiles indexed yet.</td></tr>
          ) : list.map((t) => (
            <tr key={t.walletAddress}>
              <td><div className="row"><Avatar initials={initialsFromName(t.name, t.walletAddress)} /><span style={{ fontWeight: 500 }}>{t.name || shortAddress(t.walletAddress)}</span></div></td>
              <td className="sec">{t.department || '—'}</td>
              <td><Chip tone={t.authorizedOnChain ? 'ok' : 'warn'}>{t.authorizedOnChain ? 'Active' : 'Not authorized'}</Chip></td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
    </div>
  )
}
