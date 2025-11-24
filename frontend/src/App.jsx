import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import DashboardNew from './pages/DashboardNew'
import SubmitClaimNew from './pages/SubmitClaimNew'
import MyClaims from './pages/MyClaims'
import LeaderEndorsement from './pages/LeaderEndorsement'
import ClaimDetail from './pages/ClaimDetail'
import ClaimDetailsNew from './pages/ClaimDetailsNew'
import ValidateClaim from './pages/ValidateClaim'
import FileUpload from './components/FileUpload'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const { isAuthenticated, logout, authState } = useAuth()
  const isLeader = authState?.user?.role === 'leader'

  return (
    <div className="container">
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Land Registry
          </Link>
          
          <div className="nav-links">
            {!isAuthenticated() && (
              <>
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/signup" className="nav-link">Sign Up</Link>
                <Link to="/login" className="nav-link">Login</Link>
              </>
            )}
            
            {isAuthenticated() && (
              <>
                <Link to="/dashboard-new" className="nav-link">Dashboard</Link>
                <Link to="/my-claims" className="nav-link">My Claims</Link>
                <Link to="/validate-claim" className="nav-link">Validate</Link>
                {isLeader && <Link to="/leader" className="nav-link">Leader Panel</Link>}
                <button onClick={logout} className="nav-button">Logout</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/file-upload" element={<FileUpload />} />
        <Route path="/dashboard-new" element={<ProtectedRoute><DashboardNew /></ProtectedRoute>} />
        <Route path="/submit-claim-new" element={<ProtectedRoute><SubmitClaimNew /></ProtectedRoute>} />
        <Route path="/my-claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
        <Route path="/leader" element={<ProtectedRoute><LeaderEndorsement /></ProtectedRoute>} />
        <Route path="/claim/:id" element={<ProtectedRoute><ClaimDetail /></ProtectedRoute>} />
        <Route path="/claim-details-new" element={<ProtectedRoute><ClaimDetailsNew /></ProtectedRoute>} />
        <Route path="/validate-claim" element={<ProtectedRoute><ValidateClaim /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
