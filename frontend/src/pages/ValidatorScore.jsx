import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faMapMarkedAlt, 
  faUsers, 
  faBell, 
  faChartLine, 
  faTrophy,
  faAward,
  faStar,
  faCheckCircle,
  faExclamationTriangle,
  faQuestionCircle,
  faShieldAlt,
  faMedal,
  faCrown,
  faFire,
  faArrowUp,
  faArrowDown,
  faClock,
  faMapMarkerAlt,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/AuthContext'
import './ValidatorScore.css'

export default function ValidatorScore() {
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [badges, setBadges] = useState([])
  const [activities, setActivities] = useState([])
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    fetchValidatorData()
  }, [])

  const fetchValidatorData = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // const statsResponse = await validatorService.getStats()
      // const badgesResponse = await validatorService.getBadges()
      // const activitiesResponse = await validatorService.getActivities()
      // const leaderboardResponse = await validatorService.getLeaderboard()

      // Mock data for now
      setTimeout(() => {
        setStats({
          trustScore: 85,
          rank: 12,
          totalRank: 156,
          claimsValidated: 47,
          disputesRaised: 8,
          accuracy: 94.3,
          vouched: 38,
          disputed: 8,
          unsure: 1,
          streak: 7,
          avgResponseTime: '2.5 hours',
          successfulDisputes: 7,
          failedDisputes: 1
        })

        setBadges([
          {
            id: 1,
            name: 'Early Adopter',
            description: 'Among the first 100 validators',
            icon: 'star',
            earned: true,
            earnedDate: '2025-01-15',
            color: '#f59e0b'
          },
          {
            id: 2,
            name: 'Guardian',
            description: 'Validated 50+ claims',
            icon: 'shield',
            earned: false,
            progress: 47,
            total: 50,
            color: '#10b981'
          },
          {
            id: 3,
            name: 'Top 10%',
            description: 'Trust score in top 10%',
            icon: 'trophy',
            earned: true,
            earnedDate: '2025-02-20',
            color: '#8b5cf6'
          },
          {
            id: 4,
            name: 'Sheriff',
            description: 'Successfully disputed 10 claims',
            icon: 'medal',
            earned: false,
            progress: 7,
            total: 10,
            color: '#ef4444'
          },
          {
            id: 5,
            name: 'Hot Streak',
            description: '7 days of continuous validation',
            icon: 'fire',
            earned: true,
            earnedDate: '2025-11-28',
            color: '#f97316'
          },
          {
            id: 6,
            name: 'Accuracy King',
            description: 'Maintain 95% accuracy',
            icon: 'crown',
            earned: false,
            progress: 94,
            total: 95,
            color: '#fbbf24'
          }
        ])

        setActivities([
          {
            id: 1,
            type: 'vouch',
            claim: 'CLM-2547',
            location: 'Westlands, Nairobi',
            action: 'Vouched',
            date: '2025-12-03T10:30:00',
            trustImpact: '+2'
          },
          {
            id: 2,
            type: 'vouch',
            claim: 'CLM-2543',
            location: 'Karen, Nairobi',
            action: 'Vouched',
            date: '2025-12-02T15:45:00',
            trustImpact: '+2'
          },
          {
            id: 3,
            type: 'dispute',
            claim: 'CLM-2538',
            location: 'Kilimani, Nairobi',
            action: 'Disputed',
            date: '2025-12-01T09:20:00',
            trustImpact: '+5',
            outcome: 'Upheld'
          },
          {
            id: 4,
            type: 'vouch',
            claim: 'CLM-2535',
            location: 'Lavington, Nairobi',
            action: 'Vouched',
            date: '2025-11-30T14:10:00',
            trustImpact: '+2'
          },
          {
            id: 5,
            type: 'unsure',
            claim: 'CLM-2530',
            location: 'Parklands, Nairobi',
            action: 'Marked Unsure',
            date: '2025-11-29T11:35:00',
            trustImpact: '0'
          },
          {
            id: 6,
            type: 'vouch',
            claim: 'CLM-2525',
            location: 'Kileleshwa, Nairobi',
            action: 'Vouched',
            date: '2025-11-28T16:50:00',
            trustImpact: '+2'
          },
          {
            id: 7,
            type: 'dispute',
            claim: 'CLM-2520',
            location: 'Runda, Nairobi',
            action: 'Disputed',
            date: '2025-11-27T08:15:00',
            trustImpact: '-3',
            outcome: 'Rejected'
          },
          {
            id: 8,
            type: 'vouch',
            claim: 'CLM-2515',
            location: 'Muthaiga, Nairobi',
            action: 'Vouched',
            date: '2025-11-26T13:40:00',
            trustImpact: '+2'
          }
        ])

        setLeaderboard([
          {
            id: 1,
            rank: 1,
            name: 'John Kamau',
            trustScore: 98,
            claimsValidated: 156,
            accuracy: 98.7,
            change: 'up'
          },
          {
            id: 2,
            rank: 2,
            name: 'Mary Wanjiku',
            trustScore: 96,
            claimsValidated: 143,
            accuracy: 97.2,
            change: 'up'
          },
          {
            id: 3,
            rank: 3,
            name: 'Peter Omondi',
            trustScore: 94,
            claimsValidated: 128,
            accuracy: 96.8,
            change: 'down'
          },
          {
            id: 4,
            rank: 4,
            name: 'Grace Muthoni',
            trustScore: 92,
            claimsValidated: 119,
            accuracy: 96.1,
            change: 'same'
          },
          {
            id: 5,
            rank: 5,
            name: 'David Kipchoge',
            trustScore: 91,
            claimsValidated: 112,
            accuracy: 95.9,
            change: 'up'
          },
          {
            id: 6,
            rank: 6,
            name: 'Sarah Njeri',
            trustScore: 89,
            claimsValidated: 105,
            accuracy: 95.2,
            change: 'down'
          },
          {
            id: 7,
            rank: 7,
            name: 'James Mutua',
            trustScore: 88,
            claimsValidated: 98,
            accuracy: 94.8,
            change: 'same'
          },
          {
            id: 8,
            rank: 8,
            name: 'Lucy Akinyi',
            trustScore: 87,
            claimsValidated: 92,
            accuracy: 94.5,
            change: 'up'
          },
          {
            id: 9,
            rank: 9,
            name: 'Michael Otieno',
            trustScore: 86,
            claimsValidated: 87,
            accuracy: 94.2,
            change: 'same'
          },
          {
            id: 10,
            rank: 10,
            name: 'Jane Wambui',
            trustScore: 85,
            claimsValidated: 81,
            accuracy: 93.9,
            change: 'down'
          },
          {
            id: 11,
            rank: 11,
            name: 'Patrick Kariuki',
            trustScore: 85,
            claimsValidated: 76,
            accuracy: 93.7,
            change: 'up'
          },
          {
            id: 12,
            rank: 12,
            name: authState?.user?.name || 'You',
            trustScore: 85,
            claimsValidated: 47,
            accuracy: 94.3,
            change: 'up',
            isCurrentUser: true
          }
        ])

        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching validator data:', error)
      setLoading(false)
    }
  }

  const getBadgeIcon = (iconName) => {
    const icons = {
      star: faStar,
      shield: faShieldAlt,
      trophy: faTrophy,
      medal: faMedal,
      fire: faFire,
      crown: faCrown
    }
    return icons[iconName] || faStar
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'vouch':
        return faCheckCircle
      case 'dispute':
        return faExclamationTriangle
      case 'unsure':
        return faQuestionCircle
      default:
        return faCheckCircle
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'vouch':
        return '#10b981'
      case 'dispute':
        return '#ef4444'
      case 'unsure':
        return '#f59e0b'
      default:
        return '#6b7280'
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="validator-score-page">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <FontAwesomeIcon icon={faMapMarkedAlt} className="logo-icon" />
            </div>
            <h2 className="sidebar-title">Community Validator</h2>
            <p className="sidebar-subtitle">Decentralized Verification</p>
          </div>
          <nav className="sidebar-nav">
            <Link to="/community/feed" className="nav-item">
              <FontAwesomeIcon icon={faUsers} className="nav-icon" />
              Community Feed
            </Link>
            <Link to="/community/claims" className="nav-item">
              <FontAwesomeIcon icon={faMapMarkedAlt} className="nav-icon" />
              Claims Near You
            </Link>
            <Link to="/community/score" className="nav-item active">
              <FontAwesomeIcon icon={faChartLine} className="nav-icon" />
              Validator Score
            </Link>
            <Link to="/notifications" className="nav-item">
              <FontAwesomeIcon icon={faBell} className="nav-icon" />
              Notifications
            </Link>
          </nav>
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-btn">
              <FontAwesomeIcon icon={faSignOutAlt} />
              Logout
            </button>
          </div>
        </aside>
        <main className="dashboard-main">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading validator data...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="validator-score-page">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FontAwesomeIcon icon={faMapMarkedAlt} className="logo-icon" />
          </div>
          <h2 className="sidebar-title">Community Validator</h2>
          <p className="sidebar-subtitle">Decentralized Verification</p>
        </div>
        <nav className="sidebar-nav">
          <Link to="/community/feed" className="nav-item">
            <FontAwesomeIcon icon={faUsers} className="nav-icon" />
            Community Feed
          </Link>
          <Link to="/community/claims" className="nav-item">
            <FontAwesomeIcon icon={faMapMarkedAlt} className="nav-icon" />
            Claims Near You
          </Link>
          <Link to="/community/score" className="nav-item active">
            <FontAwesomeIcon icon={faChartLine} className="nav-icon" />
            Validator Score
          </Link>
          <Link to="/notifications" className="nav-item">
            <FontAwesomeIcon icon={faBell} className="nav-icon" />
            Notifications
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FontAwesomeIcon icon={faSignOutAlt} />
            Logout
          </button>
        </div>
      </aside>

      <main className="score-main">
        <div className="score-header">
          <div>
            <h1 className="score-title">Validator Dashboard</h1>
            <p className="score-subtitle">Track your performance and earn badges</p>
          </div>
        </div>

        <div className="score-content">
          {/* Trust Score Hero */}
          <div className="trust-score-hero">
            <div className="score-circle-container">
              <svg className="score-circle" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(stats.trustScore / 100) * 565.48} 565.48`}
                  transform="rotate(-90 100 100)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="score-value">
                <div className="score-number">{stats.trustScore}</div>
                <div className="score-label">Trust Score</div>
              </div>
            </div>
            <div className="score-details">
              <div className="rank-info">
                <FontAwesomeIcon icon={faTrophy} className="rank-icon" />
                <div>
                  <div className="rank-number">#{stats.rank}</div>
                  <div className="rank-label">out of {stats.totalRank} validators</div>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.claimsValidated}</div>
                  <div className="stat-label">Claims Validated</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.accuracy}%</div>
                  <div className="stat-label">Accuracy Rate</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.streak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="badges-section">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faAward} /> Badges & Achievements
            </h2>
            <div className="badges-grid">
              {badges.map(badge => (
                <div key={badge.id} className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
                  <div className="badge-icon-container" style={{ background: badge.earned ? badge.color : '#e5e7eb' }}>
                    <FontAwesomeIcon icon={getBadgeIcon(badge.icon)} className="badge-icon" />
                  </div>
                  <div className="badge-info">
                    <h3 className="badge-name">{badge.name}</h3>
                    <p className="badge-description">{badge.description}</p>
                    {badge.earned ? (
                      <div className="badge-earned">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        Earned on {new Date(badge.earnedDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="badge-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${(badge.progress / badge.total) * 100}%`,
                              background: badge.color
                            }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          {badge.progress} / {badge.total}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-section">
            <h2 className="section-title">
              <FontAwesomeIcon icon={faChartLine} /> Validation Statistics
            </h2>
            <div className="stats-cards">
              <div className="stat-card vouch">
                <div className="stat-card-header">
                  <FontAwesomeIcon icon={faCheckCircle} className="stat-card-icon" />
                  <span className="stat-card-label">Vouched</span>
                </div>
                <div className="stat-card-value">{stats.vouched}</div>
                <div className="stat-card-footer">
                  {((stats.vouched / stats.claimsValidated) * 100).toFixed(1)}% of total
                </div>
              </div>

              <div className="stat-card dispute">
                <div className="stat-card-header">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="stat-card-icon" />
                  <span className="stat-card-label">Disputed</span>
                </div>
                <div className="stat-card-value">{stats.disputed}</div>
                <div className="stat-card-footer">
                  {stats.successfulDisputes} upheld, {stats.failedDisputes} rejected
                </div>
              </div>

              <div className="stat-card unsure">
                <div className="stat-card-header">
                  <FontAwesomeIcon icon={faQuestionCircle} className="stat-card-icon" />
                  <span className="stat-card-label">Unsure</span>
                </div>
                <div className="stat-card-value">{stats.unsure}</div>
                <div className="stat-card-footer">
                  {((stats.unsure / stats.claimsValidated) * 100).toFixed(1)}% of total
                </div>
              </div>

              <div className="stat-card response">
                <div className="stat-card-header">
                  <FontAwesomeIcon icon={faClock} className="stat-card-icon" />
                  <span className="stat-card-label">Avg Response</span>
                </div>
                <div className="stat-card-value">{stats.avgResponseTime}</div>
                <div className="stat-card-footer">
                  Time to validate claims
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="two-column-layout">
            {/* Activity Timeline */}
            <div className="activity-section">
              <h2 className="section-title">
                <FontAwesomeIcon icon={faClock} /> Recent Activity
              </h2>
              <div className="activity-timeline">
                {activities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div 
                      className="activity-icon-container" 
                      style={{ background: getActivityColor(activity.type) }}
                    >
                      <FontAwesomeIcon icon={getActivityIcon(activity.type)} />
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-action">{activity.action}</span>
                        <span className="activity-date">{formatDate(activity.date)}</span>
                      </div>
                      <div className="activity-claim">
                        <span className="claim-id">{activity.claim}</span>
                        <span className="claim-location">
                          <FontAwesomeIcon icon={faMapMarkerAlt} />
                          {activity.location}
                        </span>
                      </div>
                      <div className="activity-footer">
                        <span className={`trust-impact ${activity.trustImpact.startsWith('+') ? 'positive' : activity.trustImpact.startsWith('-') ? 'negative' : 'neutral'}`}>
                          {activity.trustImpact} trust score
                        </span>
                        {activity.outcome && (
                          <span className={`outcome ${activity.outcome.toLowerCase()}`}>
                            {activity.outcome}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="leaderboard-section">
              <h2 className="section-title">
                <FontAwesomeIcon icon={faTrophy} /> Top Validators
              </h2>
              <div className="leaderboard-list">
                {leaderboard.map(validator => (
                  <div 
                    key={validator.id} 
                    className={`leaderboard-item ${validator.isCurrentUser ? 'current-user' : ''}`}
                  >
                    <div className="validator-rank">
                      {validator.rank <= 3 ? (
                        <FontAwesomeIcon 
                          icon={faCrown} 
                          className={`crown-icon rank-${validator.rank}`}
                        />
                      ) : (
                        <span className="rank-number">#{validator.rank}</span>
                      )}
                    </div>
                    <div className="validator-info">
                      <div className="validator-name">{validator.name}</div>
                      <div className="validator-stats">
                        <span>{validator.claimsValidated} claims</span>
                        <span>•</span>
                        <span>{validator.accuracy}% accuracy</span>
                      </div>
                    </div>
                    <div className="validator-score">
                      <div className="score-value">{validator.trustScore}</div>
                      {validator.change === 'up' && (
                        <FontAwesomeIcon icon={faArrowUp} className="change-icon up" />
                      )}
                      {validator.change === 'down' && (
                        <FontAwesomeIcon icon={faArrowDown} className="change-icon down" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
