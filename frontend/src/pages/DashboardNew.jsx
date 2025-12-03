import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FaRegCheckCircle, 
  FaRegFileAlt, 
  FaRegClock, 
  FaRegTimesCircle,
  FaPlus,
  FaList,
  FaMap,
  FaChartBar,
  FaBuilding
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import './DashboardNew.css'

export default function DashboardNew() {
  const { authState } = useAuth()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0
  })
  const [recentClaims, setRecentClaims] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch user's claims
      const response = await claimsService.getAllMyClaims()
      const claims = response.data

      // Calculate stats
      const total = claims.length
      const pending = claims.filter(c => c.status === 'pending').length
      const validated = claims.filter(c => c.status === 'validated').length
      const rejected = claims.filter(c => c.status === 'rejected').length

      setStats({ total, pending, validated, rejected })
      
      // Get 5 most recent claims
      setRecentClaims(claims.slice(0, 5))
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Display stats with real data
  const statsDisplay = [
    {
      title: 'Total Land Claims',
      value: stats.total.toString(),
      change: '',
      trend: 'positive'
    },
    {
      title: 'Pending Validation',
      value: stats.pending.toString(),
      change: '',
      trend: 'info'
    },
    {
      title: 'Claims Approved',
      value: stats.validated.toString(),
      change: '',
      trend: 'positive'
    },
    {
      title: 'Claims Rejected',
      value: stats.rejected.toString(),
      change: '',
      trend: 'negative'
    }
  ]

  // Generate activities from recent claims
  const activities = recentClaims.map(claim => {
    const statusIcons = {
      'pending': { icon: <FaRegClock />, color: 'yellow', text: 'pending review' },
      'validated': { icon: <FaRegCheckCircle />, color: 'green', text: 'has been validated' },
      'rejected': { icon: <FaRegTimesCircle />, color: 'red', text: 'was rejected' }
    }

    const status = statusIcons[claim.status] || statusIcons['pending']
    const timeAgo = new Date(claim.created_at).toLocaleDateString()

    return {
      icon: status.icon,
      iconColor: status.color,
      text: `Claim #${claim.id?.substring(0, 8)} ${status.text}.`,
      timestamp: timeAgo
    }
  })

  // Quick actions data
  const quickActions = [
    {
      label: 'Start a New Claim',
      icon: <FaPlus />,
      link: '/submit-claim',
      primary: true
    },
    {
      label: 'View All Claims',
      icon: <FaList />,
      link: '/my-claims',
      primary: false
    },
    {
      label: 'Property Management',
      icon: <FaBuilding />,
      link: '/property-management',
      primary: false
    },
    {
      label: 'Generate Report',
      icon: <FaChartBar />,
      link: '/reports',
      primary: false
    }
  ]

  return (
    <div className="dashboard-container">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-welcome">
          Welcome back, {authState?.user?.name || 'User'}! Here's what's happening today.
        </p>
      </div>

      {loading ? (
        <div className="loading-message">Loading dashboard data...</div>
      ) : (
        <>
          {/* Stat Cards Grid */}
          <div className="stat-cards-grid">
            {statsDisplay.map((stat, index) => (
              <div key={index} className="stat-card">
                <h3 className="stat-title">{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
                {stat.change && <p className={`stat-change ${stat.trend}`}>{stat.change}</p>}
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="main-content-grid">
            {/* Recent Activity Card */}
            <div className="content-card activity-card">
              <h2 className="card-title">Recent Activity</h2>
              <div className="activity-list">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className={`activity-icon ${activity.iconColor}`}>
                        {activity.icon}
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">{activity.text}</p>
                        <span className="activity-timestamp">{activity.timestamp}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data-message">No recent activity</p>
                )}
              </div>
              <Link to="/my-claims" className="view-all-link">
                View All Claims →
              </Link>
            </div>

            {/* Quick Actions Card */}
            <div className="content-card quick-actions-card">
              <h2 className="card-title">Quick Actions</h2>
              <div className="quick-actions-list">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.link}
                    className={`action-button ${action.primary ? 'primary' : 'secondary'}`}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
