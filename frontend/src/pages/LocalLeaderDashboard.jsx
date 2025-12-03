import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMapMarkedAlt, 
  FaClipboardCheck, 
  FaBalanceScale,
  FaChartBar,
  FaSync,
  FaUserTie
} from 'react-icons/fa';
import { useJurisdiction } from '../contexts/JurisdictionContext';
import JurisdictionStats from '../components/JurisdictionStats';
import RecentActivities from '../components/RecentActivities';
import './LocalLeaderDashboard.css';

const LocalLeaderDashboard = () => {
  const navigate = useNavigate();
  const { currentJurisdiction, userPermissions, refreshJurisdictionStats } = useJurisdiction();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (currentJurisdiction) {
      loadStats();
    }
  }, [currentJurisdiction]);

  const loadStats = async () => {
    if (!currentJurisdiction) return;

    try {
      setLoadingStats(true);
      const statsData = await refreshJurisdictionStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRefreshStats = async () => {
    setRefreshing(true);
    await loadStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!currentJurisdiction) {
    return (
      <div className="leader-dashboard">
        <div className="no-jurisdiction">
          <FaMapMarkedAlt className="no-jurisdiction-icon" />
          <h2>No Jurisdiction Assigned</h2>
          <p>You need to be assigned to a jurisdiction to access this dashboard.</p>
          <p>Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leader-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <FaUserTie className="header-icon" />
            <div className="header-text">
              <h1 className="dashboard-title">Local Leader Dashboard</h1>
              <p className="dashboard-subtitle">
                {currentJurisdiction.leader_title || 'Leader'} - {currentJurisdiction.name}
              </p>
            </div>
          </div>
          <button 
            className={`refresh-stats-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefreshStats}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh Stats'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {userPermissions.canApprove && (
            <button 
              className="action-card approval"
              onClick={() => navigate('/leader/approvals')}
            >
              <div className="action-icon">
                <FaClipboardCheck />
              </div>
              <div className="action-content">
                <h3>Claims for Approval</h3>
                <p className="action-count">{stats?.pending_approvals || 0} pending</p>
              </div>
            </button>
          )}

          {userPermissions.canResolveDisputes && (
            <button 
              className="action-card disputes"
              onClick={() => navigate('/leader/disputes')}
            >
              <div className="action-icon">
                <FaBalanceScale />
              </div>
              <div className="action-content">
                <h3>Active Disputes</h3>
                <p className="action-count">{stats?.active_disputes || 0} active</p>
              </div>
            </button>
          )}

          <button 
            className="action-card reports"
            onClick={() => navigate('/leader/reports')}
          >
            <div className="action-icon">
              <FaChartBar />
            </div>
            <div className="action-content">
              <h3>View Reports</h3>
              <p className="action-description">Analytics & insights</p>
            </div>
          </button>

          <button 
            className="action-card map"
            onClick={() => navigate('/leader/map')}
          >
            <div className="action-icon">
              <FaMapMarkedAlt />
            </div>
            <div className="action-content">
              <h3>Jurisdiction Map</h3>
              <p className="action-description">View on map</p>
            </div>
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="dashboard-section">
        <h2 className="section-title">Jurisdiction Overview</h2>
        <JurisdictionStats stats={stats} loading={loadingStats} />
      </div>

      {/* Recent Activities */}
      <div className="dashboard-section">
        <RecentActivities jurisdictionId={currentJurisdiction.id} />
      </div>

      {/* Jurisdiction Info Card */}
      <div className="jurisdiction-info-card">
        <h3 className="info-title">Jurisdiction Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Code:</span>
            <span className="info-value">{currentJurisdiction.code}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Level:</span>
            <span className="info-value">{currentJurisdiction.level}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Leader:</span>
            <span className="info-value">{currentJurisdiction.leader_name || 'Not assigned'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Title:</span>
            <span className="info-value">{currentJurisdiction.leader_title || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalLeaderDashboard;
