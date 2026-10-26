import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, PageHeader, Chip, LoadingBlock, EmptyState } from '../components/ui.jsx'
import { getStudent, getPublicProfile, getStudentAchievements } from '../services/students.js'
import { mapAchievement } from '../utils/achievementMap.js'
import { initialsFromName, shortAddress } from '../utils/format.js'
import { Avatar } from '../components/ui.jsx'

export default function PublicStudent() {
  const { wallet } = useParams()
  const [student, setStudent] = useState(null)
  const [profile, setProfile] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!wallet) return
    setLoading(true)
    Promise.all([
      getStudent(wallet).catch(() => null),
      getPublicProfile(wallet).catch(() => null),
      getStudentAchievements(wallet, 1, 12).catch(() => ({ items: [] })),
    ])
      .then(([s, p, a]) => {
        setStudent(s)
        setProfile(p)
        setAchievements((a.items || []).map(mapAchievement))
        if (!s && !p) setError('Profile not found or private.')
      })
      .finally(() => setLoading(false))
  }, [wallet])

  if (loading) return <div className="page"><LoadingBlock /></div>
  if (error && !student) return <div className="page"><EmptyState title="Not available" text={error} /></div>

  const name = profile?.name || student?.onChainName || shortAddress(wallet)
  const showScore = profile?.preferences?.showCampScore !== false
  const showAchievements = profile?.preferences?.showAchievements !== false

  return (
    <div className="page">
      <PageHeader title={name} text="Public Campus Reputation profile" action={<Link to="/verify" className="btn">Verify achievement</Link>} />
      <Card>
        <div className="row" style={{ gap: 16 }}>
          <Avatar initials={initialsFromName(name, wallet)} large />
          <div>
            <div className="sm muted">{profile?.department || '—'}{profile?.year ? ` · Year ${profile.year}` : ''}</div>
            <div className="mono sm">{wallet}</div>
            {showScore && student && (
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                <Chip>{Number(student.campBalance).toLocaleString()} CAMP</Chip>
                <Chip tone="gold">{student.reputationLevel}</Chip>
              </div>
            )}
          </div>
        </div>
      </Card>
      {showAchievements && (
        <>
          <h3 style={{ margin: '24px 0 12px', fontWeight: 600 }}>Achievements</h3>
          {achievements.length === 0 ? (
            <EmptyState title="No public achievements" text="This student has no indexed achievements yet." />
          ) : (
            <div className="grid g-cards">
              {achievements.map((a) => (
                <Card key={a.id} className="cred">
                  <Chip>{a.category}</Chip>
                  <h4>{a.title}</h4>
                  <div className="sm muted">{a.date}</div>
                  <Link to="/verify" className="sm">View blockchain proof</Link>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
