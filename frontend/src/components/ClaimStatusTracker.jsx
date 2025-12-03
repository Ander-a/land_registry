import React from 'react';
import { FaCheckCircle, FaClock, FaSpinner, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';
import './ClaimStatusTracker.css';

const ClaimStatusTracker = ({ claim }) => {
  const getStatusStages = () => {
    const stages = [
      {
        id: 'submitted',
        title: 'Submitted',
        description: 'Claim submitted successfully',
        icon: FaCheckCircle,
        status: 'completed',
        date: claim.created_at
      },
      {
        id: 'validation',
        title: 'Community Validation',
        description: 'Awaiting community validators',
        icon: FaSpinner,
        status: getValidationStatus(),
        date: claim.validation_started_at
      },
      {
        id: 'review',
        title: 'Leader Review',
        description: 'Under review by local leader',
        icon: FaClock,
        status: getReviewStatus(),
        date: claim.review_started_at
      },
      {
        id: 'decision',
        title: 'Final Decision',
        description: getFinalDescription(),
        icon: getFinalIcon(),
        status: getFinalStatus(),
        date: claim.decision_date
      }
    ];

    return stages;
  };

  const getValidationStatus = () => {
    if (claim.validation_status === 'validated') return 'completed';
    if (claim.validation_status === 'in_progress') return 'in-progress';
    if (claim.validation_status === 'rejected') return 'failed';
    return 'pending';
  };

  const getReviewStatus = () => {
    if (claim.status === 'approved' || claim.status === 'rejected' || claim.status === 'conditional') return 'completed';
    if (claim.validation_status === 'validated') return 'in-progress';
    return 'pending';
  };

  const getFinalStatus = () => {
    if (claim.status === 'approved') return 'completed';
    if (claim.status === 'rejected') return 'failed';
    if (claim.status === 'conditional') return 'warning';
    return 'pending';
  };

  const getFinalDescription = () => {
    switch(claim.status) {
      case 'approved':
        return 'Claim approved';
      case 'rejected':
        return 'Claim rejected';
      case 'conditional':
        return 'Conditional approval - action required';
      default:
        return 'Awaiting final decision';
    }
  };

  const getFinalIcon = () => {
    switch(claim.status) {
      case 'approved':
        return FaCheckCircle;
      case 'rejected':
        return FaTimesCircle;
      case 'conditional':
        return FaExclamationCircle;
      default:
        return FaClock;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const stages = getStatusStages();

  return (
    <div className="status-tracker">
      <h3 className="tracker-title">Claim Progress</h3>
      
      <div className="timeline">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          
          return (
            <div key={stage.id} className={`timeline-item ${stage.status}`}>
              <div className="timeline-marker">
                <div className="marker-circle">
                  <Icon className="marker-icon" />
                </div>
                {index < stages.length - 1 && (
                  <div className="timeline-connector" />
                )}
              </div>

              <div className="timeline-content">
                <div className="stage-header">
                  <h4 className="stage-title">{stage.title}</h4>
                  {stage.date && (
                    <span className="stage-date">{formatDate(stage.date)}</span>
                  )}
                </div>
                <p className="stage-description">{stage.description}</p>

                {/* Additional details based on stage */}
                {stage.id === 'validation' && claim.validation_count > 0 && (
                  <div className="stage-details">
                    <span className="detail-badge">
                      {claim.validation_count} validator{claim.validation_count !== 1 ? 's' : ''}
                    </span>
                    {claim.witness_count > 0 && (
                      <span className="detail-badge">
                        {claim.witness_count} witness{claim.witness_count !== 1 ? 'es' : ''}
                      </span>
                    )}
                  </div>
                )}

                {stage.id === 'decision' && claim.approval_reason && (
                  <div className="decision-details">
                    <p className="decision-reason">
                      <strong>Reason:</strong> {claim.approval_reason}
                    </p>
                    {claim.recommendations && (
                      <p className="decision-recommendations">
                        <strong>Recommendations:</strong> {claim.recommendations}
                      </p>
                    )}
                    {claim.conditions && claim.conditions.length > 0 && (
                      <div className="decision-conditions">
                        <strong>Conditions:</strong>
                        <ul>
                          {claim.conditions.map((condition, idx) => (
                            <li key={idx}>{condition}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall status badge */}
      <div className="overall-status">
        <span className={`status-badge status-${claim.status}`}>
          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default ClaimStatusTracker;
