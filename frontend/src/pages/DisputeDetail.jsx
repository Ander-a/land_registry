import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DisputeDetail.css';

function DisputeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  // Evidence submission
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [evidenceType, setEvidenceType] = useState('document');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFileUrl, setEvidenceFileUrl] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  useEffect(() => {
    fetchDispute();
  }, [id]);

  const fetchDispute = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/disputes/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setDispute(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dispute:', err);
      setError(err.response?.data?.detail || 'Failed to fetch dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceDescription.trim()) {
      alert('Please provide evidence description');
      return;
    }

    try {
      setSubmittingEvidence(true);
      const token = localStorage.getItem('token');
      
      await axios.post(
        `http://localhost:8000/disputes/${id}/evidence`,
        {
          evidence_type: evidenceType,
          description: evidenceDescription,
          file_url: evidenceFileUrl || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Reset form
      setEvidenceDescription('');
      setEvidenceFileUrl('');
      setEvidenceType('document');
      setShowEvidenceForm(false);

      // Refresh dispute
      await fetchDispute();
    } catch (err) {
      console.error('Error submitting evidence:', err);
      alert(err.response?.data?.detail || 'Failed to submit evidence');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open': return 'status-badge status-open';
      case 'investigating': return 'status-badge status-investigating';
      case 'resolved': return 'status-badge status-resolved';
      case 'closed': return 'status-badge status-closed';
      default: return 'status-badge';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'priority-badge priority-urgent';
      case 'high': return 'priority-badge priority-high';
      case 'medium': return 'priority-badge priority-medium';
      case 'low': return 'priority-badge priority-low';
      default: return 'priority-badge';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisputeTypeLabel = (type) => {
    const labels = {
      boundary: 'Boundary Dispute',
      ownership: 'Ownership Dispute',
      documentation: 'Documentation Dispute',
      survey: 'Survey Dispute',
      other: 'Other Dispute'
    };
    return labels[type] || type;
  };

  const getEvidenceTypeIcon = (type) => {
    switch (type) {
      case 'document': return '📄';
      case 'photo': return '📷';
      case 'testimony': return '💬';
      case 'survey': return '📐';
      default: return '📎';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'claimant': return '👤';
      case 'disputer': return '⚠️';
      case 'witness': return '👁️';
      default: return '👥';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dispute details...</p>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Dispute not found'}</p>
        <button onClick={() => navigate('/leader/disputes')}>
          Back to Disputes
        </button>
      </div>
    );
  }

  return (
    <div className="dispute-detail-container">
      <div className="dispute-header">
        <button className="back-button" onClick={() => navigate('/leader/disputes')}>
          ← Back to Disputes
        </button>
        
        <div className="header-content">
          <div className="title-section">
            <h1>{dispute.title}</h1>
            <div className="badges">
              <span className={getStatusBadgeClass(dispute.status)}>
                {dispute.status}
              </span>
              <span className={getPriorityBadgeClass(dispute.priority)}>
                {dispute.priority}
              </span>
              <span className="type-badge">
                {getDisputeTypeLabel(dispute.dispute_type)}
              </span>
            </div>
          </div>

          <div className="action-buttons">
            {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
              <button 
                className="resolve-button"
                onClick={() => navigate(`/leader/disputes/${id}/resolve`)}
              >
                Resolve Dispute
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`tab ${activeTab === 'parties' ? 'active' : ''}`}
          onClick={() => setActiveTab('parties')}
        >
          Parties ({dispute.parties?.length || 0})
        </button>
        <button
          className={`tab ${activeTab === 'evidence' ? 'active' : ''}`}
          onClick={() => setActiveTab('evidence')}
        >
          Evidence ({dispute.evidence?.length || 0})
        </button>
        {dispute.resolution && (
          <button
            className={`tab ${activeTab === 'resolution' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolution')}
          >
            Resolution
          </button>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'details' && (
          <div className="details-tab">
            <div className="info-grid">
              <div className="info-card">
                <h3>Dispute Information</h3>
                <div className="info-rows">
                  <div className="info-row">
                    <span className="label">Parcel Number:</span>
                    <span className="value">{dispute.parcel_number}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Jurisdiction:</span>
                    <span className="value">{dispute.jurisdiction_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Filed:</span>
                    <span className="value">{formatDate(dispute.filed_at)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Last Updated:</span>
                    <span className="value">{formatDate(dispute.last_updated)}</span>
                  </div>
                  {dispute.closed_at && (
                    <div className="info-row">
                      <span className="label">Closed:</span>
                      <span className="value">{formatDate(dispute.closed_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="info-card">
                <h3>Assignment</h3>
                <div className="info-rows">
                  <div className="info-row">
                    <span className="label">Filed by:</span>
                    <span className="value">{dispute.created_by_name}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Assigned to:</span>
                    <span className="value">
                      {dispute.assigned_to_name || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="description-card">
              <h3>Description</h3>
              <p>{dispute.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'parties' && (
          <div className="parties-tab">
            {dispute.parties && dispute.parties.length > 0 ? (
              <div className="parties-grid">
                {dispute.parties.map((party, index) => (
                  <div key={index} className="party-card">
                    <div className="party-header">
                      <span className="party-icon">{getRoleIcon(party.role)}</span>
                      <span className="party-role">{party.role}</span>
                    </div>
                    <div className="party-info">
                      <h4>{party.name}</h4>
                      <p className="party-email">{party.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No parties information available</p>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="evidence-tab">
            <div className="evidence-header">
              <h3>Evidence Submitted</h3>
              {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                <button
                  className="add-evidence-button"
                  onClick={() => setShowEvidenceForm(!showEvidenceForm)}
                >
                  {showEvidenceForm ? 'Cancel' : '+ Add Evidence'}
                </button>
              )}
            </div>

            {showEvidenceForm && (
              <form className="evidence-form" onSubmit={handleSubmitEvidence}>
                <div className="form-group">
                  <label>Evidence Type</label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                    required
                  >
                    <option value="document">Document</option>
                    <option value="photo">Photo</option>
                    <option value="testimony">Testimony</option>
                    <option value="survey">Survey</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={evidenceDescription}
                    onChange={(e) => setEvidenceDescription(e.target.value)}
                    placeholder="Describe this evidence..."
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>File URL (optional)</label>
                  <input
                    type="url"
                    value={evidenceFileUrl}
                    onChange={(e) => setEvidenceFileUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="submit"
                  className="submit-evidence-button"
                  disabled={submittingEvidence}
                >
                  {submittingEvidence ? 'Submitting...' : 'Submit Evidence'}
                </button>
              </form>
            )}

            {dispute.evidence && dispute.evidence.length > 0 ? (
              <div className="evidence-list">
                {dispute.evidence.map((item, index) => (
                  <div key={index} className="evidence-item">
                    <div className="evidence-icon">
                      {getEvidenceTypeIcon(item.evidence_type)}
                    </div>
                    <div className="evidence-content">
                      <div className="evidence-header-row">
                        <span className="evidence-type">{item.evidence_type}</span>
                        <span className="evidence-date">
                          {formatDate(item.submitted_at)}
                        </span>
                      </div>
                      <p className="evidence-description">{item.description}</p>
                      <div className="evidence-footer">
                        <span className="submitted-by">
                          Submitted by {item.submitted_by_name}
                        </span>
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="evidence-link"
                          >
                            View File →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !showEvidenceForm && (
                <p className="no-data">No evidence submitted yet</p>
              )
            )}
          </div>
        )}

        {activeTab === 'resolution' && dispute.resolution && (
          <div className="resolution-tab">
            <div className="resolution-card">
              <div className="resolution-header">
                <h3>Resolution</h3>
                <span className={`decision-badge decision-${dispute.resolution.decision}`}>
                  {dispute.resolution.decision}
                </span>
              </div>

              <div className="resolution-content">
                <div className="resolution-section">
                  <h4>Summary</h4>
                  <p>{dispute.resolution.resolution_summary}</p>
                </div>

                {dispute.resolution.notes && (
                  <div className="resolution-section">
                    <h4>Additional Notes</h4>
                    <p>{dispute.resolution.notes}</p>
                  </div>
                )}

                <div className="resolution-footer">
                  <div className="resolver-info">
                    <span className="label">Resolved by:</span>
                    <span className="value">
                      {dispute.resolution.resolved_by_name}
                      {dispute.resolution.resolved_by_title && 
                        ` (${dispute.resolution.resolved_by_title})`
                      }
                    </span>
                  </div>
                  <div className="resolution-date">
                    {formatDate(dispute.resolution.resolved_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DisputeDetail;
