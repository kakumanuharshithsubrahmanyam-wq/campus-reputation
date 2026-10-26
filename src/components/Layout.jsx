import { useState, useEffect, useCallback, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Landmark, LayoutDashboard, Medal, TrendingUp, BadgeCheck, Trophy, Activity,
  SearchCheck, GraduationCap, UserPlus, ClipboardCheck, ShieldCheck, Users,
  Bell, Search, Menu, Ellipsis, User,
} from 'lucide-react'
import { Avatar } from './ui.jsx'
import NetworkBanner from './NetworkBanner.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCampusData } from '../context/CampusDataContext.jsx'
import { initialsFromName, shortAddress } from '../utils/format.js'
import { searchQuery } from '../services/search.js'
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notifications.js'

function buildNav(isTeacher, isOwner) {
  const groups = [
    { items: [{ to: '/', label: 'Overview', icon: LayoutDashboard }] },
    {
      label: 'My record',
      items: [
        { to: '/achievements', label: 'Achievements', icon: Medal },
        { to: '/reputation', label: 'Reputation', icon: TrendingUp },
        { to: '/badges', label: 'Badges', icon: BadgeCheck },
        { to: '/profile', label: 'Profile', icon: User },
      ],
    },
    {
      label: 'Discover',
      items: [
        { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
        { to: '/activity', label: 'Activity', icon: Activity },
        { to: '/verify', label: 'Verify', icon: SearchCheck },
      ],
    },
  ]
  if (isTeacher || isOwner) {
    groups.push({
      label: 'Teacher',
      items: [
        { to: '/teacher', label: 'Teacher Dashboard', icon: GraduationCap },
        { to: '/teacher/award', label: 'Award Student', icon: UserPlus },
        { to: '/teacher/approvals', label: 'Approvals', icon: ClipboardCheck },
      ],
    })
  }
  if (isOwner) {
    groups.push({
      label: 'Admin',
      items: [
        { to: '/admin', label: 'Admin Dashboard', icon: ShieldCheck },
        { to: '/admin/teachers', label: 'Teachers', icon: Users },
      ],
    })
  }
  return groups
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchHits, setSearchHits] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)

  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { account, isTeacher, isOwner, rolesLoading, connectWallet, isConnecting, hasMetaMask } = useWallet()
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const { authenticated, signIn, loading: authLoading } = useAuth()
  const { data } = useCampusData()

  const displayName = data?.onChainName || data?.profile?.name || 'Student'
  const initials = initialsFromName(displayName, account)
  const groups = buildNav(rolesLoading ? false : isTeacher, rolesLoading ? false : isOwner)
  const all = groups.flatMap((g) => g.items)
  const mobile = [all[0], all[1], all[5] || all[4], all[all.length - 1]].filter(Boolean)
  const title = (all.find((i) => i.to === pathname) || all[0]).label

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onDoc = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!authenticated) {
      setNotifications([])
      setUnread(0)
      return
    }
    try {
      const res = await listNotifications(1, 30)
      setNotifications(res.items || [])
      setUnread((res.items || []).filter((n) => !n.isRead).length)
    } catch {
      setNotifications([])
      setUnread(0)
    }
  }, [authenticated])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications, pathname])

  useEffect(() => {
    if (!searchQ.trim()) {
      setSearchHits([])
      return
    }
    const t = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await searchQuery(searchQ.trim())
        const hits = [
          ...(res.students || []).map((s) => ({ type: 'student', wallet: s.walletAddress, name: s.name })),
          ...(res.achievements || []).map((a) => ({ type: 'achievement', id: a.id, title: a.title || a.reason, wallet: a.studentWallet })),
        ]
        setSearchHits(hits)
      } catch {
        setSearchHits([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQ])

  const pickSearch = (hit) => {
    setSearchOpen(false)
    setSearchQ('')
    if (hit.type === 'student' && hit.wallet) navigate(`/student/${hit.wallet}`)
    else if (hit.type === 'achievement' && hit.id) navigate('/verify')
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary">
        <div className="brand"><span className="brand-mark"><Landmark size={17} /></span>Campus Reputation</div>
        <nav>
          {groups.map((g, i) => (
            <div key={i}>
              {g.label && <div className="nav-label">{g.label}</div>}
              {g.items.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={17} aria-hidden /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <Link to="/profile" className="profile" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Avatar initials={initials} />
            <div>
              <div style={{ fontWeight: 600 }}>{displayName}</div>
              <div className="cap">{isOwner ? 'Owner' : isTeacher ? 'Teacher' : 'Student'}</div>
            </div>
          </Link>
          <div className="wallet">
            <span className="dot" aria-hidden />
            {account ? (
              <>Connected <span className="mono addr" style={{ fontSize: 12 }}>{shortAddress(account)}</span></>
            ) : (
              <button type="button" className="btn btn-ghost" disabled={!hasMetaMask || isConnecting} onClick={connectWallet}>
                Connect wallet
              </button>
            )}
          </div>
          {account && !authenticated && (
            <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={authLoading} onClick={signIn}>
              {authLoading ? 'Signing…' : 'Sign in for profile edits'}
            </button>
          )}
        </div>
      </aside>
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <h1>{title}</h1>
          <div className="top-right">
            <div style={{ position: 'relative' }} ref={searchRef}>
              <label className="search">
                <Search size={16} aria-hidden />
                <input
                  placeholder="Search students or achievements"
                  aria-label="Search"
                  value={searchQ}
                  onChange={(e) => { setSearchQ(e.target.value); setSearchOpen(true) }}
                  onFocus={() => setSearchOpen(true)}
                />
              </label>
              {searchOpen && searchQ.trim() && (
                <CardDropdown>
                  {searchLoading && <p className="sm muted">Searching…</p>}
                  {!searchLoading && searchHits.length === 0 && <p className="sm muted">No results</p>}
                  {searchHits.map((hit) => (
                    <button type="button" key={`${hit.type}-${hit.id || hit.wallet}`} className="search-hit" onClick={() => pickSearch(hit)}>
                      <span className="cap">{hit.type}</span>
                      <span>{hit.name || hit.title || hit.wallet}</span>
                    </button>
                  ))}
                </CardDropdown>
              )}
            </div>
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="icon-btn" aria-label="Notifications" onClick={() => { setNotifOpen(!notifOpen); if (!authenticated) signIn() }}>
                <Bell size={18} />
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {notifOpen && (
                <CardDropdown wide>
                  {!authenticated && <p className="sm sec">Sign in to view notifications.</p>}
                  {authenticated && notifications.length === 0 && <p className="sm sec">You&apos;re all caught up.</p>}
                  {notifications.map((n) => (
                    <button
                      type="button"
                      key={n.id}
                      className={`search-hit ${n.isRead ? '' : 'unread'}`}
                      onClick={async () => {
                        await markNotificationRead(n.id)
                        loadNotifications()
                      }}
                    >
                      <strong>{n.title}</strong>
                      <span className="sm muted">{n.message}</span>
                    </button>
                  ))}
                  {authenticated && notifications.length > 0 && (
                    <button type="button" className="btn btn-ghost sm" onClick={() => markAllNotificationsRead().then(loadNotifications)}>
                      Mark all read
                    </button>
                  )}
                </CardDropdown>
              )}
            </div>
            <Link to="/profile"><Avatar initials={initials} /></Link>
          </div>
        </header>
        <main>
          <NetworkBanner />
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Quick navigation">
        {mobile.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `bn ${isActive ? 'active' : ''}`}>
            <Icon size={20} />{label.split(' ')[0]}
          </NavLink>
        ))}
        <button className="bn" type="button" onClick={() => setOpen(true)}><Ellipsis size={20} />More</button>
      </nav>
    </>
  )
}

function CardDropdown({ children, wide }) {
  return (
    <div className="card dropdown-panel" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, minWidth: wide ? 320 : 260, zIndex: 20, padding: 8 }}>
      {children}
    </div>
  )
}
