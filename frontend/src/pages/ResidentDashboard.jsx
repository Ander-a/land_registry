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
  FaSignOutAlt,
  FaChartLine,
  FaUser,
  FaTimes,
  FaExclamationCircle,
  FaBuilding
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import ClaimSubmissionWizard from '../components/ClaimSubmissionWizard'
import ClaimStatusTracker from '../components/ClaimStatusTracker'
import ResidentProfile from '../components/ResidentProfile'
import './ResidentDashboard.css'

export default function ResidentDashboard() {
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState([])
  const [allClaims, setAllClaims] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [stats, setStats] = useState({
    total_claims: 0,
    pending_claims: 0,
    validated_claims: 0,
    approved_claims: 0,
    rejected_claims: 0
  })
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch user's claims (which will be their properties)
      const response = await claimsService.getAllMyClaims()
      const claims = response.data || []
      
      setAllClaims(claims)

      // Filter validated claims as properties
      const validatedClaims = claims.filter(c => c.status === 'validated' || c.status === 'approved')
      setProperties(validatedClaims)

      // Calculate stats
      const claimStats = {
        total_claims: claims.length,
        pending_claims: claims.filter(c => c.status === 'pending').length,
        validated_claims: claims.filter(c => c.status === 'validated').length,
        approved_claims: claims.filter(c => c.status === 'approved').length,
        rejected_claims: claims.filter(c => c.status === 'rejected').length
      }
      setStats(claimStats)

      // Generate recent activities from claims
      const activities = generateActivities(claims)
      setRecentActivities(activities.slice(0, 5))
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWizardSubmit = async (formData) => {
    try {
      // Create FormData for file uploads
      const submitData = new FormData()
      
      // Add basic fields
      submitData.append('parcel_number', formData.parcel_number)
      submitData.append('district', formData.district)
      submitData.append('sector', formData.sector)
      submitData.append('cell', formData.cell)
      submitData.append('village', formData.village)
      submitData.append('plot_area', formData.plot_area)
      
      if (formData.coordinates.lat && formData.coordinates.lng) {
        submitData.append('latitude', formData.coordinates.lat)
        submitData.append('longitude', formData.coordinates.lng)
      }
      
      if (formData.supporting_info) {
        submitData.append('supporting_info', formData.supporting_info)
      }
      
      // Add photos
      formData.photos.forEach((photo, index) => {
        submitData.append('photos', photo)
      })
      
      // Add witnesses
      submitData.append('witnesses', JSON.stringify(formData.witnesses))
      
      // Submit claim
      await claimsService.submitClaim(submitData)
      
      // Close wizard and refresh data
      setShowWizard(false)
      fetchDashboardData()
      
      alert('Claim submitted successfully!')
    } catch (error) {
      console.error('Failed to submit claim:', error)
      alert('Failed to submit claim. Please try again.')
    }
  }

  const handleProfileUpdate = async (profileData) => {
    try {
      // Call API to update profile
      const response = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify(profileData)
      })
      
      if (!response.ok) throw new Error('Failed to update profile')
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
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
          <button onClick={() => setShowWizard(true)} className="nav-item nav-btn">
            <FaPlus className="nav-icon" />
            <span>Submit New Claim</span>
          </button>
          <Link to="/my-claims" className="nav-item">
            <FaFileAlt className="nav-icon" />
            <span>My Claims</span>
          </Link>
          <Link to="/property-management" className="nav-item">
            <FaBuilding className="nav-icon" />
            <span>Property Management</span>
          </Link>
          <button onClick={() => setShowProfile(true)} className="nav-item nav-btn">
            <FaUser className="nav-icon" />
            <span>My Profile</span>
          </button>
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
            <p className="welcome-subtitle">Here's a summary of your claims and recent activities.</p>
          </section>

          {/* Statistics Cards */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <FaChartLine />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Claims</p>
                <p className="stat-value">{stats.total_claims}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <FaClock />
              </div>
              <div className="stat-content">
                <p className="stat-label">Pending</p>
                <p className="stat-value">{stats.pending_claims}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon validated">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <p className="stat-label">Validated</p>
                <p className="stat-value">{stats.validated_claims}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon approved">
                <FaCheckCircle />
              </div>
              <div className="stat-content">
                <p className="stat-label">Approved</p>
                <p className="stat-value">{stats.approved_claims}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rejected">
                <FaExclamationCircle />
              </div>
              <div className="stat-content">
                <p className="stat-label">Rejected</p>
                <p className="stat-value">{stats.rejected_claims}</p>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="quick-actions-section">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button onClick={() => setShowWizard(true)} className="action-btn primary">
                <FaPlus className="btn-icon" />
                Submit a New Claim
              </button>
              <Link to="/my-claims" className="action-btn secondary">
                <FaFileAlt className="btn-icon" />
                View All My Claims
              </Link>
              <button onClick={() => setShowProfile(true)} className="action-btn tertiary">
                <FaUser className="btn-icon" />
                Edit My Profile
              </button>
            </div>
          </section>

          {/* Main Grid */}
          <div className="content-grid">
            {/* Recent Claims with Status Tracker */}
            <section className="card recent-claims-card">
              <h3 className="card-title">Recent Claims</h3>
              <div className="claims-list">
                {loading ? (
                  <div className="loading-state">Loading claims...</div>
                ) : allClaims.length > 0 ? (
                  allClaims.slice(0, 3).map((claim, index) => (
                    <div key={claim.id || index} className="claim-summary-item">
                      <div className="claim-summary-header">
                        <h4 className="claim-parcel">
                          {claim.parcel_number || `Claim ${index + 1}`}
                        </h4>
                        <span className={`claim-status-badge status-${claim.status}`}>
                          {claim.status}
                        </span>
                      </div>
                      <p className="claim-location">
                        {claim.village}, {claim.cell}, {claim.sector}
                      </p>
                      <p className="claim-area">{claim.plot_area} m²</p>
                      <button 
                        className="view-status-btn"
                        onClick={() => setSelectedClaim(claim)}
                      >
                        View Progress
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No claims yet</p>
                    <button onClick={() => setShowWizard(true)} className="text-link">
                      Submit your first claim →
                    </button>
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

      {/* Modals */}
      {showWizard && (
        <ClaimSubmissionWizard
          onClose={() => setShowWizard(false)}
          onSubmit={handleWizardSubmit}
        />
      )}

      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowProfile(false)}>
              <FaTimes />
            </button>
            <ResidentProfile
              user={authState?.user}
              onUpdate={handleProfileUpdate}
            />
          </div>
        </div>
      )}

      {selectedClaim && (
        <div className="modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedClaim(null)}>
              <FaTimes />
            </button>
            <ClaimStatusTracker claim={selectedClaim} />
          </div>
        </div>
      )}
    </div>
  )
}
