import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import DashboardNew from './pages/DashboardNew'
import SubmitClaim from './pages/SubmitClaim'
import SubmitClaimNew from './pages/SubmitClaimNew'
import MyClaims from './pages/MyClaims'
import WitnessClaim from './pages/WitnessClaim'
import LeaderEndorsement from './pages/LeaderEndorsement'
import ClaimDetail from './pages/ClaimDetail'
import ClaimDetailsNew from './pages/ClaimDetailsNew'
import ValidateClaim from './pages/ValidateClaim'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const { isAuthenticated, logout, authState } = useAuth()
  const isLeader = authState?.user?.role === 'leader'

  return (
    <div className="container">
      <nav className="nav">
        <Link to="/">Home</Link> | <Link to="/signup">Request Access</Link> | <Link to="/login">Login</Link> | <Link to="/dashboard">Dashboard</Link> | <Link to="/dashboard-new">New Dashboard</Link>
        {isAuthenticated() && (
          <>
            {' | '}<Link to="/submit-claim">Submit Claim</Link>
            {' | '}<Link to="/submit-claim-new">New Submit</Link>
            {' | '}<Link to="/my-claims">My Claims</Link>
            {' | '}<Link to="/claim-details-new">Claim Details</Link>
            {' | '}<Link to="/validate-claim">Validate Claims</Link>
            {' | '}<Link to="/witness">Witness Claims</Link>
            {isLeader && <>{' | '}<Link to="/leader">Leader Panel</Link></>}
            <button onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard-new" element={<ProtectedRoute><DashboardNew /></ProtectedRoute>} />
        <Route path="/submit-claim" element={<ProtectedRoute><SubmitClaim /></ProtectedRoute>} />
        <Route path="/submit-claim-new" element={<ProtectedRoute><SubmitClaimNew /></ProtectedRoute>} />
        <Route path="/my-claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
        <Route path="/witness" element={<ProtectedRoute><WitnessClaim /></ProtectedRoute>} />
        <Route path="/leader" element={<ProtectedRoute><LeaderEndorsement /></ProtectedRoute>} />
        <Route path="/claim/:id" element={<ProtectedRoute><ClaimDetail /></ProtectedRoute>} />
        <Route path="/claim-details-new" element={<ProtectedRoute><ClaimDetailsNew /></ProtectedRoute>} />
        <Route path="/validate-claim" element={<ProtectedRoute><ValidateClaim /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
