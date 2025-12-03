import React from 'react';
import './StatCard.css';
import { analyticsUtils } from '../services/analyticsService';

const StatCard = ({ 
  title, 
  value, 
  trend, 
  icon, 
  color = 'blue',
  loading = false 
}) => {
  const trendIcon = analyticsUtils.getTrendIcon(trend);
  const trendColor = analyticsUtils.getTrendColor(trend);
  const formattedTrend = analyticsUtils.formatPercentage(trend);

  if (loading) {
    return (
      <div className="stat-card loading">
        <div className="stat-skeleton"></div>
      </div>
    );
  }

  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-header">
        <div className="stat-icon">
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <div className={`stat-trend ${trendColor}`}>
            <span className="trend-icon">{trendIcon}</span>
            <span className="trend-value">{formattedTrend}</span>
          </div>
        )}
      </div>
      <div className="stat-body">
        <div className="stat-value">{analyticsUtils.formatNumber(value)}</div>
        <div className="stat-title">{title}</div>
      </div>
    </div>
  );
};

export default StatCard;
