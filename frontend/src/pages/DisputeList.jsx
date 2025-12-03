import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useJurisdiction } from '../contexts/JurisdictionContext';
import './DisputeList.css';

function DisputeList() {
  const navigate = useNavigate();
  const { currentJurisdiction } = useJurisdiction();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, priorityFilter, typeFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (typeFilter !== 'all') params.append('dispute_type', typeFilter);
      
      const response = await axios.get(
        `http://localhost:8000/disputes/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setDisputes(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching disputes:', err);
      setError(err.response?.data?.detail || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'status-badge status-open';
      case 'investigating':
        return 'status-badge status-investigating';
      case 'resolved':
        return 'status-badge status-resolved';
      case 'closed':
        return 'status-badge status-closed';
      default:
        return 'status-badge';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'priority-badge priority-urgent';
      case 'high':
        return 'priority-badge priority-high';
      case 'medium':
        return 'priority-badge priority-medium';
      case 'low':
        return 'priority-badge priority-low';
      default:
        return 'priority-badge';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDisputeTypeLabel = (type) => {
    const labels = {
      boundary: 'Boundary',
      ownership: 'Ownership',
      documentation: 'Documentation',
      survey: 'Survey',
      other: 'Other'
    };
    return labels[type] || type;
  };

  const getResolutionIcon = (decision) => {
    switch (decision) {
      case 'upheld':
        return '✓';
      case 'dismissed':
        return '✗';
      case 'mediated':
        return '⚖';
      case 'referred':
        return '↗';
      default:
        return '';
    }
  };

  return (
    <div className="dispute-list-container">
      <div className="dispute-list-header">
        <h1>Dispute Resolution Center</h1>
        {currentJurisdiction && (
          <p className="jurisdiction-name">
            {currentJurisdiction.name}
          </p>
        )}
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label>Status</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority</label>
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Type</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="boundary">Boundary</option>
            <option value="ownership">Ownership</option>
            <option value="documentation">Documentation</option>
            <option value="survey">Survey</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button 
          className="refresh-button"
          onClick={fetchDisputes}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading disputes...</p>
        </div>
      ) : (
        <div className="disputes-grid">
          {disputes.length === 0 ? (
            <div className="no-disputes">
              <p>No disputes found</p>
              <p className="no-disputes-subtitle">
                {statusFilter !== 'all' || priorityFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No disputes have been filed yet'
                }
              </p>
            </div>
          ) : (
            disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="dispute-card"
                onClick={() => navigate(`/leader/disputes/${dispute.id}`)}
              >
                <div className="dispute-card-header">
                  <div className="dispute-badges">
                    <span className={getStatusBadgeClass(dispute.status)}>
                      {dispute.status}
                    </span>
                    <span className={getPriorityBadgeClass(dispute.priority)}>
                      {dispute.priority}
                    </span>
                  </div>
                  <div className="dispute-type">
                    {getDisputeTypeLabel(dispute.dispute_type)}
                  </div>
                </div>

                <div className="dispute-card-body">
                  <h3 className="dispute-title">{dispute.title}</h3>
                  <p className="dispute-description">
                    {dispute.description.length > 150
                      ? `${dispute.description.substring(0, 150)}...`
                      : dispute.description
                    }
                  </p>

                  <div className="dispute-meta">
                    <div className="meta-item">
                      <span className="meta-label">Parcel:</span>
                      <span className="meta-value">{dispute.parcel_number}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Parties:</span>
                      <span className="meta-value">{dispute.parties.length}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Evidence:</span>
                      <span className="meta-value">{dispute.evidence_count}</span>
                    </div>
                  </div>

                  <div className="dispute-info">
                    <div className="info-row">
                      <span className="info-label">Filed by:</span>
                      <span className="info-value">{dispute.created_by_name}</span>
                    </div>
                    {dispute.assigned_to_name && (
                      <div className="info-row">
                        <span className="info-label">Assigned to:</span>
                        <span className="info-value">{dispute.assigned_to_name}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Filed:</span>
                      <span className="info-value">{formatDate(dispute.filed_at)}</span>
                    </div>
                  </div>

                  {dispute.resolution && (
                    <div className="resolution-indicator">
                      <span className="resolution-icon">
                        {getResolutionIcon(dispute.resolution.decision)}
                      </span>
                      <span className="resolution-text">
                        {dispute.resolution.decision.charAt(0).toUpperCase() + 
                         dispute.resolution.decision.slice(1)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="dispute-card-footer">
                  <button className="view-details-button">
                    View Details →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="dispute-summary">
        <p>{disputes.length} dispute{disputes.length !== 1 ? 's' : ''} found</p>
      </div>
    </div>
  );
}

export default DisputeList;
