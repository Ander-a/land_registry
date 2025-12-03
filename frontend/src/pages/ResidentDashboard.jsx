import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHome, 
  FaPlus, 
  FaFileAlt, 
  FaBell,
  FaCheckCircle,
  FaClock,
  FaUserEdit,
  FaSignOutAlt
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import './ResidentDashboard.css'

export default function ResidentDashboard() {
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch user's claims (which will be their properties)
      const response = await claimsService.getAllMyClaims()
      const claims = response.data || []

      // Filter validated claims as properties
      const validatedClaims = claims.filter(c => c.status === 'validated')
      setProperties(validatedClaims)

      // Generate recent activities from claims
      const activities = generateActivities(claims)
      setRecentActivities(activities.slice(0, 3))
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateActivities = (claims) => {
    const activities = []

    // Add recent validated claims
    claims.filter(c => c.status === 'validated').forEach(claim => {
      activities.push({
        icon: <FaCheckCircle className="activity-icon-check" />,
        title: `Title deed for ${claim.location || 'property'} was updated.`,
        date: formatDate(claim.updated_at || claim.created_at),
        type: 'success'
      })
    })

    // Add recent submissions
    claims.filter(c => c.status === 'pending').forEach(claim => {
      activities.push({
        icon: <FaClock className="activity-icon-pending" />,
        title: `New claim #${claim.id?.substring(0, 8)} submitted.`,
        date: formatDate(claim.created_at),
        type: 'info'
      })
    })

    // Add profile update (mock for now)
    if (authState?.user?.updated_at) {
      activities.push({
        icon: <FaUserEdit className="activity-icon-profile" />,
        title: 'Profile information was successfully updated.',
        date: formatDate(authState.user.updated_at),
        type: 'info'
      })
    }

    // Sort by date (most recent first)
    return activities.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  const getUserFirstName = () => {
    const name = authState?.user?.name || 'User'
    return name.split(' ')[0]
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="resident-dashboard">
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
          <Link to="/resident/dashboard" className="nav-item active">
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
            <h1 className="page-title">Dashboard</h1>
            <div className="header-actions">
              <button className="icon-btn">
                <FaBell />
              </button>
              <div className="user-avatar">
                {getUserFirstName().charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <h2 className="welcome-title">Welcome back, {getUserFirstName()}!</h2>
            <p className="welcome-subtitle">Here's a summary of your account and recent activities.</p>
          </section>

          {/* Quick Actions */}
          <section className="quick-actions-section">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions-grid">
              <Link to="/submit-claim-new" className="action-btn primary">
                <FaPlus className="btn-icon" />
                Submit a New Claim
              </Link>
              <Link to="/my-claims" className="action-btn secondary">
                <FaFileAlt className="btn-icon" />
                View My Title Deeds
              </Link>
            </div>
          </section>

          {/* Main Grid */}
          <div className="content-grid">
            {/* My Properties */}
            <section className="card properties-card">
              <h3 className="card-title">My Properties</h3>
              <div className="properties-list">
                {loading ? (
                  <div className="loading-state">Loading properties...</div>
                ) : properties.length > 0 ? (
                  properties.slice(0, 2).map((property, index) => (
                    <div key={property.id || index} className="property-item">
                      <div className="property-info">
                        <h4 className="property-address">
                          {property.location || `Property ${index + 1}`}
                        </h4>
                        <p className="property-title">
                          Title #{property.id?.substring(0, 12) || 'N/A'}
                        </p>
                      </div>
                      <span className="property-status verified">Verified</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No verified properties yet</p>
                    <Link to="/submit-claim-new" className="text-link">
                      Submit your first claim →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="card activity-card">
              <h3 className="card-title">Recent Activity</h3>
              <div className="activity-list">
                {loading ? (
                  <div className="loading-state">Loading activities...</div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className={`activity-icon-wrapper ${activity.type}`}>
                        {activity.icon}
                      </div>
                      <div className="activity-content">
                        <p className="activity-title">{activity.title}</p>
                        <span className="activity-date">{activity.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
