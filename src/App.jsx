import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import PublicShell from './components/PublicShell.jsx'
import ConnectScreen from './components/ConnectScreen.jsx'
import RegisterGate from './components/RegisterGate.jsx'
import { RequireWallet, RequireTeacher, RequireOwner } from './components/ProtectedRoute.jsx'
import Overview from './pages/Overview.jsx'
import { Achievements, Reputation, Badges } from './pages/Credentials.jsx'
import { Leaderboard, ActivityPage, Verify } from './pages/Discover.jsx'
import { TeacherDashboard, AwardStudent, Approvals, AdminDashboard, Teachers } from './pages/Staff.jsx'
import Profile from './pages/Profile.jsx'
import PublicStudent from './pages/PublicStudent.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/connect" element={<ConnectScreen />} />
      <Route
        path="/student/:wallet"
        element={
          <PublicShell>
            <PublicStudent />
          </PublicShell>
        }
      />
      <Route
        element={
          <RequireWallet>
            <RegisterGate>
              <Layout />
            </RegisterGate>
          </RequireWallet>
        }
      >
        <Route index element={<Overview />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="reputation" element={<Reputation />} />
        <Route path="badges" element={<Badges />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="verify" element={<Verify />} />
        <Route path="profile" element={<Profile />} />
        <Route path="teacher" element={<RequireTeacher><TeacherDashboard /></RequireTeacher>} />
        <Route path="teacher/award" element={<RequireTeacher><AwardStudent /></RequireTeacher>} />
        <Route path="teacher/approvals" element={<RequireTeacher><Approvals /></RequireTeacher>} />
        <Route path="admin" element={<RequireOwner><AdminDashboard /></RequireOwner>} />
        <Route path="admin/teachers" element={<RequireOwner><Teachers /></RequireOwner>} />
        <Route path="*" element={<Overview />} />
      </Route>
    </Routes>
  )
}
