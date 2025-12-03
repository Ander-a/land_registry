/**
 * Analytics Service
 * Frontend API client for analytics and reporting endpoints
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/analytics';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Analytics Service
 */
export const analyticsService = {
  /**
   * Get system overview statistics
   * @returns {Promise} Overview stats with growth percentages
   */
  getOverview: async () => {
    const response = await api.get('/overview');
    return response.data;
  },

  /**
   * Get registration trends over time
   * @param {number} months - Number of months to retrieve (1-12)
   * @returns {Promise} Monthly registration trends
   */
  getRegistrationTrends: async (months = 6) => {
    const response = await api.get('/registrations', {
      params: { months }
    });
    return response.data;
  },

  /**
   * Get department activity breakdown
   * @returns {Promise} Activity by department (last 30 days)
   */
  getDepartmentActivity: async () => {
    const response = await api.get('/departments');
    return response.data;
  },

  /**
   * Get active users online
   * @returns {Promise} List of currently active users
   */
  getActiveUsers: async () => {
    const response = await api.get('/users/online');
    return response.data;
  },

  /**
   * Get system activity log
   * @param {number} limit - Number of activities to retrieve
   * @returns {Promise} Recent system activities
   */
  getActivityLog: async (limit = 50) => {
    const response = await api.get('/activity-log', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get property statistics
   * @returns {Promise} Comprehensive property stats
   */
  getPropertyStats: async () => {
    const response = await api.get('/property-stats');
    return response.data;
  },

  /**
   * Generate and download report
   * @param {Object} params - Report parameters
   * @param {string} params.reportType - Type: properties, transactions, taxes, certificates
   * @param {string} params.format - Format: csv or json
   * @param {string} params.startDate - Optional start date (ISO format)
   * @param {string} params.endDate - Optional end date (ISO format)
   * @param {string} params.status - Optional status filter
   * @returns {Promise} Report data or blob for download
   */
  generateReport: async ({ reportType, format = 'csv', startDate, endDate, status }) => {
    const params = {
      report_type: reportType,
      format,
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
      ...(status && { status })
    };

    if (format === 'csv') {
      const response = await api.post('/reports/generate', null, {
        params,
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } else {
      const response = await api.post('/reports/generate', null, { params });
      return response.data;
    }
  },

  /**
   * Get report summary statistics
   * @param {string} startDate - Optional start date (ISO format)
   * @param {string} endDate - Optional end date (ISO format)
   * @returns {Promise} Summary statistics
   */
  getReportSummary: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await api.get('/reports/summary', { params });
    return response.data;
  }
};

/**
 * Utility functions
 */
export const analyticsUtils = {
  /**
   * Format number with thousands separator
   */
  formatNumber: (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  },

  /**
   * Format currency in RWF
   */
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Format percentage with sign
   */
  formatPercentage: (value) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}%`;
  },

  /**
   * Get trend icon based on value
   */
  getTrendIcon: (value) => {
    return value > 0 ? '↑' : value < 0 ? '↓' : '→';
  },

  /**
   * Get trend color class
   */
  getTrendColor: (value) => {
    if (value > 0) return 'trend-up';
    if (value < 0) return 'trend-down';
    return 'trend-neutral';
  },

  /**
   * Format date for display
   */
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format datetime for display
   */
  formatDateTime: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Calculate time ago
   */
  timeAgo: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return analyticsUtils.formatDate(dateString);
  },

  /**
   * Get status color class
   */
  getStatusColor: (status) => {
    const statusColors = {
      'completed': 'status-success',
      'approved': 'status-success',
      'paid': 'status-success',
      'issued': 'status-success',
      'pending': 'status-warning',
      'under_review': 'status-info',
      'rejected': 'status-danger',
      'unpaid': 'status-danger',
      'disputed': 'status-danger'
    };
    return statusColors[status] || 'status-default';
  },

  /**
   * Get activity icon by type
   */
  getActivityIcon: (type) => {
    const icons = {
      'land_claim': '🏞️',
      'transaction': '💵',
      'certificate': '📜',
      'permit': '📝',
      'valuation': '💰',
      'tax': '🏦',
      'dispute': '⚖️'
    };
    return icons[type] || '📄';
  }
};

export default analyticsService;
