import React from 'react';
import { 
  FaHome, 
  FaUsers, 
  FaBalanceScale, 
  FaCheckCircle,
  FaClipboardList,
  FaChartLine 
} from 'react-icons/fa';
import './JurisdictionStats.css';

const JurisdictionStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="jurisdiction-stats">
        <div className="stats-loading">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      icon: <FaHome />,
      title: 'Total Households',
      value: stats.total_households || 0,
      subtitle: `${stats.registered_households || 0} registered`,
      percentage: stats.registration_percentage || 0,
      color: '#3b82f6',
      trend: 'up'
    },
    {
      icon: <FaClipboardList />,
      title: 'Total Claims',
      value: stats.total_claims || 0,
      subtitle: `${stats.approved_claims || 0} approved`,
      percentage: stats.approval_rate || 0,
      color: '#10b981',
      trend: 'up'
    },
    {
      icon: <FaBalanceScale />,
      title: 'Active Disputes',
      value: stats.active_disputes || 0,
      subtitle: 'Require resolution',
      color: '#f59e0b',
      trend: stats.active_disputes > 5 ? 'down' : 'neutral'
    },
    {
      icon: <FaCheckCircle />,
      title: 'Pending Approvals',
      value: stats.pending_approvals || 0,
      subtitle: 'Ready for review',
      color: '#8b5cf6',
      trend: 'neutral'
    }
  ];

  return (
    <div className="jurisdiction-stats">
      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="stat-card" style={{ '--card-color': card.color }}>
            <div className="stat-icon" style={{ background: `${card.color}20`, color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <div className="stat-header">
                <h3 className="stat-title">{card.title}</h3>
                {card.percentage !== undefined && (
                  <span className="stat-badge">
                    {card.percentage.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="stat-value">{card.value.toLocaleString()}</div>
              <div className="stat-subtitle">{card.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="stats-summary">
        <div className="summary-item">
          <FaUsers className="summary-icon" />
          <div className="summary-content">
            <div className="summary-label">Registration Progress</div>
            <div className="summary-progress">
              <div 
                className="summary-progress-bar" 
                style={{ width: `${stats.registration_percentage || 0}%` }}
              />
            </div>
            <div className="summary-text">
              {stats.registered_households || 0} of {stats.total_households || 0} households registered
            </div>
          </div>
        </div>

        <div className="summary-item">
          <FaChartLine className="summary-icon" />
          <div className="summary-content">
            <div className="summary-label">Approval Rate</div>
            <div className="summary-progress">
              <div 
                className="summary-progress-bar approval" 
                style={{ width: `${stats.approval_rate || 0}%` }}
              />
            </div>
            <div className="summary-text">
              {stats.approved_claims || 0} of {stats.total_claims || 0} claims approved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JurisdictionStats;
