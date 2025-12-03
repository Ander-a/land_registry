import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHome, 
  FaPlus, 
  FaFileAlt, 
  FaBell,
  FaExclamationTriangle,
  FaSignOutAlt
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import './Disputes.css'

export default function Disputes() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="disputes-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaHome className="logo-icon" />
          </div>
          <h2 className="sidebar-title">Land Registry</h2>
          <p className="sidebar-subtitle">Resident Portal</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/resident/dashboard" className="nav-item">
            <FaHome className="nav-icon" />
            <span>Dashboard</span>
          </Link>
          <Link to="/submit-claim-new" className="nav-item">
            <FaPlus className="nav-icon" />
            <span>Submit New Claim</span>
          </Link>
          <Link to="/my-claims" className="nav-item">
            <FaFileAlt className="nav-icon" />
            <span>My Title Deeds</span>
          </Link>
          <Link to="/notifications" className="nav-item">
            <FaBell className="nav-icon" />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <h1 className="page-title">Disputes</h1>
          </div>
        </header>

        {/* Content Area */}
        <div className="disputes-content">
          <div className="coming-soon-state">
            <div className="coming-soon-icon">
              <FaExclamationTriangle />
            </div>
            <h2>Disputes Management Coming Soon</h2>
            <p>
              The disputes management feature will allow you to:
            </p>
            <ul className="features-list">
              <li>View all disputes filed against your claims</li>
              <li>File disputes against suspicious claims</li>
              <li>Upload evidence to support your case</li>
              <li>Track dispute resolution status</li>
              <li>Communicate with validators and mediators</li>
            </ul>
            <p className="note">
              This feature will be implemented in Phase 5 of the development roadmap.
            </p>
            <Link to="/resident/dashboard" className="back-btn">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
