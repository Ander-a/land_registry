import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FaRegCheckCircle, 
  FaRegFileAlt, 
  FaRegClock, 
  FaRegTimesCircle,
  FaPlus,
  FaList,
  FaMap,
  FaChartBar
} from 'react-icons/fa'
import './DashboardNew.css'

export default function DashboardNew() {
  // Sample data for stat cards
  const stats = [
    {
      title: 'Total Land Claims',
      value: '1,234',
      change: '+5.2% this month',
      trend: 'positive'
    },
    {
      title: 'Pending Validation',
      value: '56',
      change: '+10% this week',
      trend: 'info'
    },
    {
      title: 'Claims Approved',
      value: '978',
      change: '+2.1% this month',
      trend: 'positive'
    },
    {
      title: 'Claims Rejected',
      value: '200',
      change: '-1.5% this month',
      trend: 'negative'
    }
  ]

  // Sample data for recent activity
  const activities = [
    {
      icon: <FaRegCheckCircle />,
      iconColor: 'green',
      text: 'Claim #12345 has been validated.',
      timestamp: '2 minutes ago'
    },
    {
      icon: <FaRegFileAlt />,
      iconColor: 'blue',
      text: 'New claim submitted by John Doe.',
      timestamp: '15 minutes ago'
    },
    {
      icon: <FaRegClock />,
      iconColor: 'yellow',
      text: 'Claim #98765 is pending review.',
      timestamp: '1 hour ago'
    },
    {
      icon: <FaRegTimesCircle />,
      iconColor: 'red',
      text: 'Claim #54321 was rejected.',
      timestamp: '3 hours ago'
    },
    {
      icon: <FaRegCheckCircle />,
      iconColor: 'green',
      text: 'Claim #11111 has been approved.',
      timestamp: '5 hours ago'
    }
  ]

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
      label: 'Access Map',
      icon: <FaMap />,
      link: '/map',
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
        <p className="dashboard-welcome">Welcome back, Alex! Here's what's happening today.</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="stat-cards-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <h3 className="stat-title">{stat.title}</h3>
            <p className="stat-value">{stat.value}</p>
            <p className={`stat-change ${stat.trend}`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="main-content-grid">
        {/* Recent Activity Card */}
        <div className="content-card activity-card">
          <h2 className="card-title">Recent Activity</h2>
          <div className="activity-list">
            {activities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.iconColor}`}>
                  {activity.icon}
                </div>
                <div className="activity-content">
                  <p className="activity-text">{activity.text}</p>
                  <span className="activity-timestamp">{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/notifications" className="view-all-link">
            View All Notifications →
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
    </div>
  )
}
