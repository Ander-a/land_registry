import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DisputeResolution.css';

function DisputeResolution() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [decision, setDecision] = useState('mediated');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!resolutionSummary.trim()) {
      setError('Please provide a resolution summary');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const token = localStorage.getItem('token');

      await axios.post(
        `http://localhost:8000/disputes/${id}/resolve`,
        {
          decision,
          resolution_summary: resolutionSummary,
          notes: notes || null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Navigate back to dispute detail
      navigate(`/leader/disputes/${id}`);
    } catch (err) {
      console.error('Error resolving dispute:', err);
      setError(err.response?.data?.detail || 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const decisionOptions = [
    {
      value: 'upheld',
      label: 'Upheld',
      description: 'The claim/complaint is valid and should be upheld',
      icon: '✓',
      color: '#4CAF50'
    },
    {
      value: 'dismissed',
      label: 'Dismissed',
      description: 'The claim/complaint lacks merit and is dismissed',
      icon: '✗',
      color: '#f44336'
    },
    {
      value: 'mediated',
      label: 'Mediated',
      description: 'Parties reached a mediated settlement/agreement',
      icon: '⚖',
      color: '#FF9800'
    },
    {
      value: 'referred',
      label: 'Referred',
      description: 'Case referred to higher authority or court',
      icon: '↗',
      color: '#2196F3'
    }
  ];

  return (
    <div className="resolution-container">
      <div className="resolution-header">
        <button className="back-button" onClick={() => navigate(`/leader/disputes/${id}`)}>
          ← Back to Dispute
        </button>
        <h1>Resolve Dispute</h1>
        <p className="header-subtitle">
          Make a final decision on this dispute and provide a resolution summary
        </p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <form className="resolution-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Decision</h2>
          <p className="section-description">
            Select the final decision for this dispute
          </p>

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
                    <span 
                      className="option-icon"
                      style={{ color: option.color }}
                    >
                      {option.icon}
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
          <h2>Resolution Summary *</h2>
          <p className="section-description">
            Provide a detailed summary of the resolution and the reasoning behind your decision
          </p>
          <textarea
            className="summary-textarea"
            value={resolutionSummary}
            onChange={(e) => setResolutionSummary(e.target.value)}
            placeholder="Enter the resolution summary here...&#10;&#10;Include:&#10;- Key findings from the investigation&#10;- Evidence considered&#10;- Rationale for the decision&#10;- Any actions required by the parties"
            rows={12}
            required
          />
          <div className="character-count">
            {resolutionSummary.length} characters
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Notes (Optional)</h2>
          <p className="section-description">
            Add any additional notes, recommendations, or follow-up actions
          </p>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter additional notes here...&#10;&#10;For example:&#10;- Follow-up actions required&#10;- Recommendations for the parties&#10;- References to relevant laws or policies&#10;- Any conditions or stipulations"
            rows={8}
          />
          <div className="character-count">
            {notes.length} characters
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate(`/leader/disputes/${id}`)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={submitting || !resolutionSummary.trim()}
          >
            {submitting ? 'Submitting Resolution...' : 'Submit Resolution'}
          </button>
        </div>
      </form>

      <div className="warning-notice">
        <div className="notice-icon">⚠️</div>
        <div className="notice-content">
          <h3>Important Notice</h3>
          <p>
            This resolution will be final and will close the dispute. All parties will be 
            notified of this decision. Please ensure all information is accurate before submitting.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DisputeResolution;
