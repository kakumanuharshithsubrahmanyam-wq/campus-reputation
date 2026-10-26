import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Card, PageHeader, Button, Chip, LoadingBlock } from '../components/ui.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCampusData } from '../context/CampusDataContext.jsx'
import { updateProfile } from '../services/profile.js'
import { initialsFromName } from '../utils/format.js'
import { publicStudentProfileUrl } from '../utils/publicUrl.js'

export default function Profile() {
  const { account } = useWallet()
  const { authenticated, signIn, loading: authLoading } = useAuth()
  const { data, score, level, loading, refresh } = useCampusData()
  const [form, setForm] = useState({ name: '', department: '', year: '', studentId: '', bio: '' })
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const p = data?.profile
    setForm({
      name: p?.name || data?.onChainName || '',
      department: p?.department || '',
      year: p?.year ? String(p.year) : '',
      studentId: p?.studentId || '',
      bio: p?.bio || '',
    })
  }, [data])

  const save = async (e) => {
    e.preventDefault()
    if (!authenticated) {
      await signIn()
      return
    }
    setSaving(true)
    setMsg('')
    try {
      await updateProfile({
        name: form.name || undefined,
        department: form.department || undefined,
        year: form.year ? Number(form.year) : undefined,
        studentId: form.studentId || undefined,
        bio: form.bio || undefined,
      })
      setMsg('Profile updated.')
      await refresh()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) return <LoadingBlock />

  const initials = initialsFromName(form.name || data?.onChainName, account)
  const qrValue = account ? publicStudentProfileUrl(account) : ''

  return (
    <div className="page">
      <PageHeader title="Your profile" text="On-chain name and CAMP Score come from Sepolia. Edit optional campus metadata when signed in." />
      <div className="grid g-main">
        <Card>
          <div className="row" style={{ gap: 16, marginBottom: 20 }}>
            <span className="avatar lg">{initials}</span>
            <div>
              <h3 style={{ fontWeight: 600 }}>{form.name || data?.onChainName || 'Student'}</h3>
              <p className="sm muted mono">{account}</p>
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <Chip tone="gold">{level}</Chip>
                <Chip>{Number(score).toLocaleString()} CAMP</Chip>
              </div>
            </div>
          </div>
          {!authenticated && (
            <Button variant="primary" disabled={authLoading} onClick={signIn} style={{ marginBottom: 16 }}>
              Sign in to edit profile
            </Button>
          )}
          <form className="form-grid" onSubmit={save}>
            <div className="field"><label htmlFor="name">Display name</label>
              <input id="name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!authenticated} /></div>
            <div className="field"><label htmlFor="dept">Department</label>
              <input id="dept" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} disabled={!authenticated} /></div>
            <div className="field"><label htmlFor="year">Year</label>
              <input id="year" className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} disabled={!authenticated} /></div>
            <div className="field"><label htmlFor="sid">Student ID</label>
              <input id="sid" className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} disabled={!authenticated} /></div>
            <div className="field span-2"><label htmlFor="bio">Bio</label>
              <textarea id="bio" className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} disabled={!authenticated} /></div>
            {msg && <p className="sec sm span-2">{msg}</p>}
            <div className="span-2"><Button variant="primary" type="submit" disabled={!authenticated || saving}>{saving ? 'Saving…' : 'Save profile'}</Button></div>
          </form>
        </Card>
        <Card>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Share your record</h3>
          <p className="sec sm" style={{ marginBottom: 16 }}>QR code links to your public Campus Reputation profile—not Etherscan.</p>
          {qrValue && <QRCodeSVG value={qrValue} size={180} />}
          <p className="sm mono" style={{ marginTop: 12, wordBreak: 'break-all' }}>{qrValue}</p>
        </Card>
      </div>
    </div>
  )
}
