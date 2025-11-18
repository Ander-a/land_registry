import React, { useState } from 'react'
import { authAPI } from '../services/api'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { MdOutlineEmail } from 'react-icons/md'
import { FiLock } from 'react-icons/fi'
import { BiShow, BiHide } from 'react-icons/bi'
import { IoWarningOutline } from 'react-icons/io5'
import './Login.css'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const { setAuthState } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear any previous error
    setError('')
    
    // Check if fields are empty
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    
    // Try to login with the API
    try{
      const res = await authAPI.login({ email, password })
      const token = res.data.access_token
      const user = res.data.user
      localStorage.setItem('token', token)
      setAuthState({ user, token })
      console.log('Login Successful')
      navigate('/dashboard-new')
    }catch(err){
      // Dynamic error messages based on API response
      const errorMessage = err?.response?.data?.detail || 'Invalid email or password. Please try again.'
      
      // Check for specific error types
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
        setError('Email not found. Please try again.')
      } else if (errorMessage.includes('password') || errorMessage.includes('incorrect')) {
        setError('Invalid password. Please try again.')
      } else {
        setError(errorMessage)
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Title and Subtitle */}
        <div className="login-header">
          <h1 className="login-title">AI Land Registry Portal</h1>
          <p className="login-subtitle">Securely access your land registry data.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-box">
            <IoWarningOutline className="error-icon" />
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <MdOutlineEmail className="input-icon" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
              >
                {showPassword ? <BiHide /> : <BiShow />}
              </button>
            </div>
          </div>

          {/* Options Row */}
          <div className="options-row">
            <div className="remember-me">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox"
              />
              <label htmlFor="remember-me" className="checkbox-label">
                Remember me
              </label>
            </div>

            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="footer-text">
            Don't have an account?{' '}
            <Link to="/signup" className="footer-link">
              Request Access
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
