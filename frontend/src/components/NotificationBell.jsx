import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import notificationService from '../services/notificationService';
import websocketService from '../services/websocketService';
import './NotificationBell.css';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Setup WebSocket listeners for real-time notifications
    websocketService.on('new_notification', handleNewNotification);
    websocketService.on('validation_received', handleValidationReceived);
    websocketService.on('consensus_reached', handleConsensusReached);
    websocketService.on('badge_earned', handleBadgeEarned);

    // Cleanup
    return () => {
      websocketService.off('new_notification', handleNewNotification);
      websocketService.off('validation_received', handleValidationReceived);
      websocketService.off('consensus_reached', handleConsensusReached);
      websocketService.off('badge_earned', handleBadgeEarned);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchRecentNotifications = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const notifications = await notificationService.getNotifications({
        limit: 5,
        unread_only: false
      });
      setNotifications(notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewNotification = (notification) => {
    // Increment unread count
    setUnreadCount(prev => prev + 1);

    // Add to notifications list if dropdown is open
    if (showDropdown) {
      setNotifications(prev => [notification, ...prev].slice(0, 5));
    }

    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: notification.id
      });
    }
  };

  const handleValidationReceived = (data) => {
    setUnreadCount(prev => prev + 1);
  };

  const handleConsensusReached = (data) => {
    setUnreadCount(prev => prev + 1);
  };

  const handleBadgeEarned = (data) => {
    setUnreadCount(prev => prev + 1);
  };

  const handleBellClick = async () => {
    if (!showDropdown) {
      await fetchRecentNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update notification in list
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navigate to action URL if provided
    if (notification.action_url) {
      navigate(notification.action_url);
      setShowDropdown(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    return notificationService.getNotificationIcon(type);
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <FaBell className="bell-icon" />
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="dropdown-content">
            {loading ? (
              <div className="dropdown-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="dropdown-empty">
                <FaBell className="empty-icon" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {notificationService.formatTimeAgo(notification.created_at)}
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="unread-indicator"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown-footer">
            <button
              className="view-all-btn"
              onClick={handleViewAll}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
