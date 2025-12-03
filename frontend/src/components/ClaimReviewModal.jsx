import { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaShareSquare } from 'react-icons/fa';
import axios from 'axios';
import './ClaimReviewModal.css';

function ClaimReviewModal({ claim, onClose, onSubmit }) {
  const [decision, setDecision] = useState('approved');
  const [reason, setReason] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [conditions, setConditions] = useState(['']);
  const [notes, setNotes] = useState('');
  const [evidenceReviewed, setEvidenceReviewed] = useState(false);
  const [validationReviewed, setValidationReviewed] = useState(false);
  const [aiReviewed, setAiReviewed] = useState(false);
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const handleAddCondition = () => {
    setConditions([...conditions, '']);
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index, value) => {
    const newConditions = [...conditions];
    newConditions[index] = value;
    setConditions(newConditions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please provide a reason for your decision');
      return;
    }

    const filteredConditions = conditions.filter(c => c.trim() !== '');

    const approvalData = {
      claim_id: claim.id,
      decision,
      reason,
      recommendations: recommendations || null,
      conditions: decision === 'conditional' && filteredConditions.length > 0 ? filteredConditions : null,
      evidence_reviewed: evidenceReviewed,
      validation_consensus_reviewed: validationReviewed,
      ai_analysis_reviewed: aiReviewed,
      notes: notes || null,
      follow_up_required: followUpRequired,
      follow_up_date: followUpRequired && followUpDate ? new Date(followUpDate).toISOString() : null
    };

    setSubmitting(true);
    try {
      await onSubmit(approvalData);
    } finally {
      setSubmitting(false);
    }
  };

  const getDecisionIcon = (dec) => {
    switch (dec) {
      case 'approved': return <FaCheckCircle />;
      case 'rejected': return <FaTimesCircle />;
      case 'conditional': return <FaExclamationTriangle />;
      case 'referred': return <FaShareSquare />;
      default: return null;
    }
  };

  const decisionOptions = [
    { value: 'approved', label: 'Approve', color: '#4CAF50', description: 'Claim meets all requirements' },
    { value: 'rejected', label: 'Reject', color: '#f44336', description: 'Claim does not meet requirements' },
    { value: 'conditional', label: 'Conditional', color: '#FF9800', description: 'Approve with conditions' },
    { value: 'referred', label: 'Refer', color: '#2196F3', description: 'Refer to higher authority' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review Claim</h2>
          <button className="close-modal-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Claim Details
          </button>
          <button
            className={`modal-tab ${activeTab === 'validation' ? 'active' : ''}`}
            onClick={() => setActiveTab('validation')}
          >
            Validation History
          </button>
          <button
            className={`modal-tab ${activeTab === 'decision' ? 'active' : ''}`}
            onClick={() => setActiveTab('decision')}
          >
            Make Decision
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'details' && (
            <div className="details-view">
              <div className="claim-info-grid">
                <div className="info-item">
                  <span className="info-label">Claimant:</span>
                  <span className="info-value">{claim.claimant_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{claim.claimant_email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Parcel Number:</span>
                  <span className="info-value">{claim.parcel_number || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Plot Area:</span>
                  <span className="info-value">{claim.plot_area?.toFixed(2)} m²</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge status-${claim.status}`}>{claim.status}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Validation:</span>
                  <span className={`validation-badge ${claim.validation_status}`}>
                    {claim.validation_status || 'Pending'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Submitted:</span>
                  <span className="info-value">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Witnesses:</span>
                  <span className="info-value">{claim.witness_count || 0}</span>
                </div>
              </div>

              {claim.photo_url && (
                <div className="evidence-section">
                  <h3>Photo Evidence</h3>
                  <img 
                    src={`http://localhost:8000${claim.photo_url}`} 
                    alt="Claim evidence"
                    className="claim-photo"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="validation-view">
              <div className="validation-summary">
                <h3>Community Validation</h3>
                <p className="validation-status">
                  Status: <strong>{claim.validation_status || 'Not validated'}</strong>
                </p>
                <p className="witness-count">
                  {claim.witness_count || 0} community member(s) validated this claim
                </p>
              </div>
              
              {claim.endorsed_by_leader && (
                <div className="endorsement-badge">
                  <FaCheckCircle />
                  <span>Previously endorsed by leader</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'decision' && (
            <form className="decision-form" onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Select Decision</h3>
                <div className="decision-options">
                  {decisionOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`decision-option ${decision === option.value ? 'selected' : ''}`}
                      style={{
                        borderColor: decision === option.value ? option.color : '#ddd'
                      }}
                    >
                      <input
                        type="radio"
                        name="decision"
                        value={option.value}
                        checked={decision === option.value}
                        onChange={(e) => setDecision(e.target.value)}
                      />
                      <div className="option-content">
                        <div className="option-header">
                          <span className="option-icon" style={{ color: option.color }}>
                            {getDecisionIcon(option.value)}
                          </span>
                          <span className="option-label">{option.label}</span>
                        </div>
                        <p className="option-description">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>Reason for Decision *</h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide detailed reasoning for your decision..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-section">
                <h3>Recommendations (Optional)</h3>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Any recommendations for the claimant..."
                  rows={3}
                />
              </div>

              {decision === 'conditional' && (
                <div className="form-section">
                  <h3>Conditions</h3>
                  {conditions.map((condition, index) => (
                    <div key={index} className="condition-input-group">
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => handleConditionChange(index, e.target.value)}
                        placeholder={`Condition ${index + 1}`}
                      />
                      {conditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(index)}
                          className="remove-condition-btn"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="add-condition-btn"
                  >
                    + Add Condition
                  </button>
                </div>
              )}

              <div className="form-section">
                <h3>Additional Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or comments..."
                  rows={3}
                />
              </div>

              <div className="form-section">
                <h3>Review Checklist</h3>
                <div className="checklist">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={evidenceReviewed}
                      onChange={(e) => setEvidenceReviewed(e.target.checked)}
                    />
                    <span>I have reviewed the photo evidence</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={validationReviewed}
                      onChange={(e) => setValidationReviewed(e.target.checked)}
                    />
                    <span>I have reviewed the validation consensus</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={aiReviewed}
                      onChange={(e) => setAiReviewed(e.target.checked)}
                    />
                    <span>I have reviewed the AI analysis</span>
                  </label>
                </div>
              </div>

              <div className="form-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                  />
                  <span>Follow-up required</span>
                </label>
                {followUpRequired && (
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="follow-up-date"
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={onClose} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="submit-btn">
                  {submitting ? 'Submitting...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClaimReviewModal;
