import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import SubmitClaim from './pages/SubmitClaim'
import MyClaims from './pages/MyClaims'
import WitnessClaim from './pages/WitnessClaim'
import LeaderEndorsement from './pages/LeaderEndorsement'
import ClaimDetail from './pages/ClaimDetail'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const { isAuthenticated, logout, authState } = useAuth()
  const isLeader = authState?.user?.role === 'leader'

  return (
    <div className="container">
      <nav className="nav">
        <Link to="/">Home</Link> | <Link to="/signup">Request Access</Link> | <Link to="/login">Login</Link> | <Link to="/dashboard">Dashboard</Link>
        {isAuthenticated() && (
          <>
            {' | '}<Link to="/submit-claim">Submit Claim</Link>
            {' | '}<Link to="/my-claims">My Claims</Link>
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
        <Route path="/submit-claim" element={<ProtectedRoute><SubmitClaim /></ProtectedRoute>} />
        <Route path="/my-claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
        <Route path="/witness" element={<ProtectedRoute><WitnessClaim /></ProtectedRoute>} />
        <Route path="/leader" element={<ProtectedRoute><LeaderEndorsement /></ProtectedRoute>} />
        <Route path="/claim/:id" element={<ProtectedRoute><ClaimDetail /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
