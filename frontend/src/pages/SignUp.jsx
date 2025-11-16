import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { FaMountain, FaRegUser } from 'react-icons/fa'
import { MdOutlineEmail } from 'react-icons/md'
import { FiLock } from 'react-icons/fi'
import { BiShow, BiHide } from 'react-icons/bi'
import { BsBuilding } from 'react-icons/bs'
import './SignUp.css'

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'official'
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.register(formData)
      // Redirect to login after successful registration
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-container">
      {/* Logo Header */}
      <div className="signup-logo">
        <FaMountain className="logo-icon" />
        <h1 className="logo-text">AI Land Registry</h1>
      </div>

      {/* Signup Card */}
      <div className="signup-card">
        {/* Card Header */}
        <div className="signup-header">
          <h2 className="signup-title">Create Your Account</h2>
          <p className="signup-subtitle">
            Join the AI-Assisted Land Registry System to get started.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-box">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form className="signup-form" onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name
            </label>
            <div className="input-wrapper">
              <FaRegUser className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="John Doe"
              />
            </div>
          </div>

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
                value={formData.email}
                onChange={handleChange}
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Create a strong password"
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

          {/* Role Selection Field */}
          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Select Your Role
            </label>
            <div className="input-wrapper">
              <BsBuilding className="input-icon" />
              <select
                id="role"
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="form-select"
              >
                <option value="official">Government Official</option>
                <option value="citizen">Citizen</option>
                <option value="surveyor">Land Surveyor</option>
                <option value="leader">Community Leader</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="signup-button"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="signup-footer">
          <p className="footer-text">
            Already have an account?{' '}
            <Link to="/login" className="footer-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
