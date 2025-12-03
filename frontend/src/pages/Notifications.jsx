import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHome, 
  FaPlus, 
  FaFileAlt, 
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaUsers,
  FaSignOutAlt,
  FaCheck,
  FaTrash
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import './Notifications.css'

export default function Notifications() {
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all') // all, unread, read
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      // TODO: Replace with actual API call
      // const response = await notificationsService.getAll()
      
      // Mock data for now
      const mockNotifications = [
        {
          id: '1',
          type: 'success',
          title: 'Claim Validated',
          message: 'Your land claim #12345 has been successfully validated by the community.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/my-claims'
        },
        {
          id: '2',
          type: 'info',
          title: 'New Community Member',
          message: 'John Doe joined as a validator in your area.',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          read: false,
          actionUrl: '/community'
        },
        {
          id: '3',
          type: 'warning',
          title: 'Dispute Filed',
          message: 'A dispute has been filed against your claim #12346. Please review.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/disputes'
        },
        {
          id: '4',
          type: 'success',
          title: 'Badge Earned',
          message: 'Congratulations! You earned the "Early Adopter" badge.',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/profile'
        },
        {
          id: '5',
          type: 'info',
          title: 'Document Uploaded',
          message: 'Your supporting document for claim #12345 was successfully uploaded.',
          timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          read: true,
          actionUrl: '/my-claims'
        }
      ]
      
      setNotifications(mockNotifications)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon success" />
      case 'warning':
        return <FaExclamationTriangle className="notification-icon warning" />
      case 'info':
        return <FaInfoCircle className="notification-icon info" />
      case 'community':
        return <FaUsers className="notification-icon community" />
      default:
        return <FaBell className="notification-icon default" />
    }
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const notifTime = new Date(timestamp)
    const diffMs = now - notifTime
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    } else {
      return notifTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
    // TODO: Call API to mark as read
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    // TODO: Call API to mark all as read
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
    // TODO: Call API to delete notification
  }

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
    }
  }

  return (
    <div className="notifications-page">
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
          <Link to="/notifications" className="nav-item active">
            <FaBell className="nav-icon" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
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
            <h1 className="page-title">Notifications</h1>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-read-btn">
                  <FaCheck /> Mark all as read
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="notifications-content">
          {/* Filter Tabs */}
          <div className="notifications-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
            <button 
              className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {loading ? (
              <div className="loading-state">Loading notifications...</div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-body">
                    <div className="notification-header">
                      <h3 className="notification-title">{notification.title}</h3>
                      <span className="notification-time">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        className="icon-action-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        title="Mark as read"
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button 
                      className="icon-action-btn delete"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <FaBell className="empty-icon" />
                <h3>No notifications</h3>
                <p>
                  {filter === 'unread' 
                    ? "You're all caught up!" 
                    : filter === 'read'
                    ? "No read notifications"
                    : "You don't have any notifications yet."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
