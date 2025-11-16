import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import SubmitClaim from './pages/SubmitClaim'
import MyClaims from './pages/MyClaims'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './contexts/AuthContext'

export default function App() {
  const { isAuthenticated, logout } = useAuth()
  return (
    <div className="container">
      <nav className="nav">
        <Link to="/">Home</Link> | <Link to="/register">Register</Link> | <Link to="/login">Login</Link> | <Link to="/dashboard">Dashboard</Link>
        {isAuthenticated() && (
          <>
            {' | '}<Link to="/submit-claim">Submit Claim</Link>
            {' | '}<Link to="/my-claims">My Claims</Link>
            <button onClick={logout} style={{ marginLeft: 8 }}>Logout</button>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/submit-claim" element={<ProtectedRoute><SubmitClaim /></ProtectedRoute>} />
        <Route path="/my-claims" element={<ProtectedRoute><MyClaims /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
