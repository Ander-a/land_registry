import React, { useState } from 'react'
import { authAPI } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FiUser, FiLock } from 'react-icons/fi'
import './Login.css'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setAuthState } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    
    try{
      const res = await authAPI.login({ email, password })
      const token = res.data.access_token
      const user = res.data.user
      localStorage.setItem('token', token)
      setAuthState({ user, token })
      
      // Redirect based on user role
      if (user.role === 'resident') {
        navigate('/resident/dashboard')
      } else if (user.role === 'local_leader') {
        navigate('/leader')
      } else if (user.role === 'community_member') {
        navigate('/validate-claim')
      } else if (user.role === 'admin') {
        navigate('/dashboard-new')
      } else {
        navigate('/dashboard-new')
      }
    }catch(err){
      const errorMessage = err?.response?.data?.detail || 'Invalid email or password. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="login-page">
      {/* Left Side - Map */}
      <div className="login-map-side">
        <div className="map-container">
          <img 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=1000&fit=crop" 
            alt="Land Registry Map"
            className="map-image"
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-form-side">
        <div className="login-header">
          <h2 className="brand-name">Land Registry</h2>
        </div>

        <div className="login-card">
          <div className="login-content">
            <h1 className="login-title">Login</h1>
            <p className="login-subtitle">Access your Land Registry account</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Username or Email
                </label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your username or email"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </Link>
                </div>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <button type="submit" className="login-button">
                Login
              </button>
            </form>

            <div className="login-footer">
              <p className="footer-text">
                Don't have an account?{' '}
                <Link to="/signup" className="footer-link">
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="page-footer">
          <Link to="/terms" className="footer-link-item">Terms of Service</Link>
          <Link to="/privacy" className="footer-link-item">Privacy Policy</Link>
        </div>
      </div>
    </div>
  )
}
