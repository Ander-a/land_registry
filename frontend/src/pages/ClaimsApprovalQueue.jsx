import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaMapMarkerAlt, 
  FaUser,
  FaClock,
  FaEye,
  FaFilter,
  FaSync,
  FaCheckSquare,
  FaSquare
} from 'react-icons/fa';
import { useJurisdiction } from '../contexts/JurisdictionContext';
import ClaimFilters from '../components/ClaimFilters';
import ClaimReviewModal from '../components/ClaimReviewModal';
import './ClaimsApprovalQueue.css';

const ClaimsApprovalQueue = () => {
  const { currentJurisdiction, userPermissions } = useJurisdiction();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Batch selection
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    priority: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadClaims();
    loadStats();
  }, [currentJurisdiction, filters]);

  const loadClaims = async () => {
    if (!currentJurisdiction) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query params from filters
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.sortBy) params.append('sort_by', filters.sortBy);
      if (filters.sortOrder) params.append('sort_order', filters.sortOrder);
      
      const response = await axios.get(
        `http://localhost:8000/approvals/queue?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setClaims(response.data);
    } catch (err) {
      console.error('Error loading claims:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentJurisdiction) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:8000/approvals/stats',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClaims();
    await loadStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleClaimSelection = (claimId) => {
    setSelectedClaims(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClaims.length === claims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(claims.map(c => c.id));
    }
  };

  const handleBatchApproval = async (decision) => {
    if (selectedClaims.length === 0) {
      alert('Please select claims to process');
      return;
    }

    const reason = prompt(`Provide reason for ${decision}:`);
    if (!reason) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        'http://localhost:8000/approvals/batch',
        {
          claim_ids: selectedClaims,
          decision,
          reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedClaims([]);
      setShowBatchActions(false);
      await loadClaims();
      await loadStats();
      alert(`Successfully processed ${selectedClaims.length} claims`);
    } catch (err) {
      console.error('Error batch processing claims:', err);
      alert('Failed to process claims');
    } finally {
      setProcessing(false);
    }
  };

  const handleReviewSubmit = async (approvalData) => {
    try {
      const token = localStorage.getItem('token');
      
      await axios.post(
        `http://localhost:8000/approvals/${approvalData.claim_id}/approve`,
        approvalData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedClaim(null);
      await loadClaims();
      await loadStats();
      alert('Decision submitted successfully!');
    } catch (err) {
      console.error('Error submitting decision:', err);
      alert(err.response?.data?.detail || 'Failed to submit decision');
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      dateFrom: '',
      dateTo: '',
      priority: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!userPermissions.canApprove && !userPermissions.isAdmin) {
    return (
      <div className="approvals-page">
        <div className="no-permission">
          <h2>No Permission</h2>
          <p>You don't have permission to approve claims.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="approvals-page">
      <div className="approvals-header">
        <div className="header-left">
          <h1 className="page-title">Claims Approval Queue</h1>
          <p className="page-subtitle">{currentJurisdiction?.name}</p>
        </div>
        <div className="header-actions">
          <button 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FaSync className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-value">{stats.pending_count}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.approved_count}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.rejected_count}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.approval_rate}%</div>
            <div className="stat-label">Approval Rate</div>
          </div>
          {stats.avg_processing_time_hours && (
            <div className="stat-card">
              <div className="stat-value">{stats.avg_processing_time_hours.toFixed(1)}h</div>
              <div className="stat-label">Avg. Processing</div>
            </div>
          )}
        </div>
      )}

      <div className="controls-bar">
        <ClaimFilters 
          onApplyFilters={handleApplyFilters}
          onReset={handleResetFilters}
        />
        
        {selectedClaims.length > 0 && (
          <div className="batch-actions">
            <span className="selected-count">{selectedClaims.length} selected</span>
            <button 
              className="batch-btn approve"
              onClick={() => handleBatchApproval('approved')}
              disabled={processing}
            >
              <FaCheckCircle /> Approve All
            </button>
            <button 
              className="batch-btn reject"
              onClick={() => handleBatchApproval('rejected')}
              disabled={processing}
            >
              <FaTimesCircle /> Reject All
            </button>
            <button 
              className="batch-btn clear"
              onClick={() => setSelectedClaims([])}
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-state">Loading claims...</div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          <FaCheckCircle className="empty-icon" />
          <h3>No claims found</h3>
          <p>There are no claims matching your filter criteria.</p>
        </div>
      ) : (
        <>
          <div className="select-all-bar">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={selectedClaims.length === claims.length}
                onChange={toggleSelectAll}
              />
              <span>Select All ({claims.length})</span>
            </label>
          </div>
          
          <div className="claims-grid">
            {claims.map((claim) => (
              <div key={claim.id} className={`claim-card ${selectedClaims.includes(claim.id) ? 'selected' : ''}`}>
                <div className="selection-checkbox">
                  <button
                    className="checkbox-btn"
                    onClick={() => toggleClaimSelection(claim.id)}
                  >
                    {selectedClaims.includes(claim.id) ? <FaCheckSquare /> : <FaSquare />}
                  </button>
                </div>

                {claim.photo_url && (
                  <div className="claim-image">
                    <img src={`http://localhost:8000${claim.photo_url}`} alt="Land" />
                  </div>
                )}
                
                <div className="claim-content">
                  <div className="claim-header">
                    <h3 className="claim-title">
                      {claim.parcel_number || `Claim #${claim.id.slice(-6)}`}
                    </h3>
                    <span className={`status-badge ${claim.status}`}>
                      {claim.status}
                    </span>
                  </div>

                  <div className="claim-details">
                    <div className="detail-item">
                      <FaUser className="detail-icon" />
                      <span>{claim.claimant_name}</span>
                    </div>
                    <div className="detail-item">
                      <FaMapMarkerAlt className="detail-icon" />
                      <span>{claim.plot_area?.toFixed(2)} m²</span>
                    </div>
                    <div className="detail-item">
                      <FaClock className="detail-icon" />
                      <span>{formatDate(claim.created_at)}</span>
                    </div>
                  </div>

                  {claim.validation_status && (
                    <div className="validation-badge">
                      <FaCheckCircle />
                      {claim.validation_status}
                    </div>
                  )}

                  {claim.approval_action && (
                    <div className="approval-info">
                      <small>
                        {claim.approval_action.decision} by {claim.approval_action.leader_name}
                      </small>
                    </div>
                  )}

                  <div className="claim-actions">
                    <button 
                      className="action-btn view"
                      onClick={() => setSelectedClaim(claim)}
                    >
                      <FaEye /> Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Claim Review Modal */}
      {selectedClaim && (
        <ClaimReviewModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </div>
  );
};

export default ClaimsApprovalQueue;
