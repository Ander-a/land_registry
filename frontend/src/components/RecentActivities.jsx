import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClock, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import './RecentActivities.css';

const RecentActivities = ({ jurisdictionId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadActivities();
    // Refresh activities every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [jurisdictionId]);

  const loadActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/activity-logs/recent?limit=15', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'claim':
        return '📋';
      case 'validation':
        return '✓';
      case 'approval':
        return '✅';
      case 'dispute':
        return '⚖️';
      case 'household_update':
        return '🏠';
      default:
        return '•';
    }
  };

  if (loading) {
    return (
      <div className="recent-activities">
        <div className="activities-header">
          <h2 className="activities-title">Recent Activity</h2>
        </div>
        <div className="activities-loading">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recent-activities">
        <div className="activities-header">
          <h2 className="activities-title">Recent Activity</h2>
        </div>
        <div className="activities-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="recent-activities">
      <div className="activities-header">
        <h2 className="activities-title">Recent Activity</h2>
        <button className="refresh-button" onClick={loadActivities} title="Refresh">
          🔄
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="activities-empty">
          <p>No recent activities</p>
        </div>
      ) : (
        <div className="activities-list">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(activity.activity_type)}
              </div>
              <div className="activity-content">
                <div className="activity-description">{activity.description}</div>
                <div className="activity-meta">
                  {activity.related_user_name && (
                    <span className="activity-user">
                      <FaUser className="meta-icon" />
                      {activity.related_user_name}
                    </span>
                  )}
                  {activity.related_parcel_number && (
                    <span className="activity-parcel">
                      <FaMapMarkerAlt className="meta-icon" />
                      {activity.related_parcel_number}
                    </span>
                  )}
                  <span className="activity-time">
                    <FaClock className="meta-icon" />
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
              <div 
                className="activity-status" 
                style={{ background: activity.status_color }}
                title={activity.status}
              >
                <span className="status-dot"></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivities;
