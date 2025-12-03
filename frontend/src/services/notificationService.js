import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Notification Service
 * 
 * Frontend service for managing notifications.
 * Features:
 * - Fetch user notifications with filters
 * - Mark notifications as read
 * - Get unread count
 * - Manage notification preferences
 * - Poll for new notifications
 */
class NotificationService {
  constructor() {
    this.pollingInterval = null;
    this.pollingFrequency = 30000; // 30 seconds
  }

  /**
   * Get authorization header from localStorage
   */
  getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get notifications for the current user
   * @param {Object} filters - Filters (unread_only, limit, skip, notification_type, priority)
   * @returns {Promise<Array>} Array of notifications
   */
  async getNotifications(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.unread_only) params.append('unread_only', 'true');
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.skip) params.append('skip', filters.skip);
      if (filters.notification_type) params.append('notification_type', filters.notification_type);
      if (filters.priority) params.append('priority', filters.priority);

      const response = await axios.get(
        `${API_BASE_URL}/notifications/?${params.toString()}`,
        { headers: this.getAuthHeader() }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/unread`,
        { headers: this.getAuthHeader() }
      );

      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Get notification statistics
   * @returns {Promise<Object>} Stats (total, unread, by_type, by_priority)
   */
  async getStats() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/stats`,
        { headers: this.getAuthHeader() }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   */
  async markAsRead(notificationId) {
    try {
      await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: this.getAuthHeader() }
      );

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<number>} Count of notifications marked as read
   */
  async markAllAsRead() {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        { headers: this.getAuthHeader() }
      );

      return response.data.count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteNotification(notificationId) {
    try {
      await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`,
        { headers: this.getAuthHeader() }
      );

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Clear all read notifications
   * @returns {Promise<number>} Count of notifications deleted
   */
  async clearAllRead() {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/notifications/clear-all`,
        { headers: this.getAuthHeader() }
      );

      return response.data.count;
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      return 0;
    }
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Preferences object
   */
  async getPreferences() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/preferences`,
        { headers: this.getAuthHeader() }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   * @param {Object} preferences - Preferences to update
   * @returns {Promise<Object>} Updated preferences
   */
  async updatePreferences(preferences) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/notifications/preferences`,
        preferences,
        { headers: this.getAuthHeader() }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Create a test notification
   * @returns {Promise<Object>} Created notification
   */
  async createTestNotification() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/test`,
        {},
        { headers: this.getAuthHeader() }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating test notification:', error);
      throw error;
    }
  }

  /**
   * Start polling for new notifications
   * @param {Function} callback - Callback function to call with unread count
   */
  startPolling(callback) {
    if (this.pollingInterval) {
      this.stopPolling();
    }

    // Initial fetch
    this.getUnreadCount().then(callback);

    // Set up polling
    this.pollingInterval = setInterval(async () => {
      const count = await this.getUnreadCount();
      callback(count);
    }, this.pollingFrequency);
  }

  /**
   * Stop polling for notifications
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {string} Emoji icon
   */
  getNotificationIcon(type) {
    const icons = {
      validation_received: '👁️',
      consensus_reached: '✅',
      claim_validated: '✅',
      claim_rejected: '❌',
      badge_earned: '🏆',
      trust_score_updated: '📊',
      new_claim_nearby: '📍',
      dispute_raised: '⚠️',
      validation_correct: '✅',
      validation_incorrect: '❌'
    };

    return icons[type] || '🔔';
  }

  /**
   * Get notification color based on priority
   * @param {string} priority - Priority level
   * @returns {string} CSS color class
   */
  getNotificationColor(priority) {
    const colors = {
      urgent: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'gray'
    };

    return colors[priority] || 'gray';
  }

  /**
   * Format time ago (e.g., "5 minutes ago")
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time
   */
  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return time.toLocaleDateString();
  }

  /**
   * Group notifications by date
   * @param {Array} notifications - Array of notifications
   * @returns {Object} Grouped notifications
   */
  groupByDate(notifications) {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notification => {
      const notifDate = new Date(notification.created_at);
      const notifDay = new Date(notifDate.getFullYear(), notifDate.getMonth(), notifDate.getDate());

      if (notifDay.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else if (notifDay >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }

  /**
   * Filter notifications by type
   * @param {Array} notifications - Array of notifications
   * @param {string} type - Notification type to filter by
   * @returns {Array} Filtered notifications
   */
  filterByType(notifications, type) {
    if (!type) return notifications;
    return notifications.filter(n => n.type === type);
  }

  /**
   * Filter notifications by priority
   * @param {Array} notifications - Array of notifications
   * @param {string} priority - Priority level to filter by
   * @returns {Array} Filtered notifications
   */
  filterByPriority(notifications, priority) {
    if (!priority) return notifications;
    return notifications.filter(n => n.priority === priority);
  }

  /**
   * Get notification type label
   * @param {string} type - Notification type
   * @returns {string} Human-readable label
   */
  getTypeLabel(type) {
    const labels = {
      validation_received: 'Validation Received',
      consensus_reached: 'Consensus Reached',
      claim_validated: 'Claim Validated',
      claim_rejected: 'Claim Rejected',
      badge_earned: 'Badge Earned',
      trust_score_updated: 'Trust Score Updated',
      new_claim_nearby: 'New Claim Nearby',
      dispute_raised: 'Dispute Raised',
      validation_correct: 'Validation Correct',
      validation_incorrect: 'Validation Incorrect'
    };

    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Sort notifications by date (newest first)
   * @param {Array} notifications - Array of notifications
   * @returns {Array} Sorted notifications
   */
  sortByDate(notifications) {
    return [...notifications].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  /**
   * Sort notifications by priority
   * @param {Array} notifications - Array of notifications
   * @returns {Array} Sorted notifications
   */
  sortByPriority(notifications) {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...notifications].sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
