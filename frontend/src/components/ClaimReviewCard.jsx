import React, { useState } from 'react'
import { FaRegFileAlt } from 'react-icons/fa'

export default function ClaimReviewCard({ claim, onApprove, onReject }) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleApprove = () => {
    setIsSubmitting(true)
    onApprove(claim.id, comment)
    setIsSubmitting(false)
  }

  const handleReject = () => {
    setIsSubmitting(true)
    onReject(claim.id, comment)
    setIsSubmitting(false)
  }

  return (
    <div className="claim-review-card">
      {/* Top Section: Image and Details */}
      <div className="card-top">
        {/* Left: Image */}
        <div className="card-image-container">
          <img 
            src={claim.image} 
            alt={`Land plot for ${claim.name}`}
            className="card-image"
          />
        </div>

        {/* Right: Details */}
        <div className="card-details">
          <div className="detail-header">
            <span className="claim-id">Claim ID: {claim.id}</span>
            <div className="status-badge">
              <span className="status-dot"></span>
              <span className="status-text">Pending Review</span>
            </div>
          </div>

          <h3 className="claimant-name">{claim.name}</h3>

          <div className="claim-meta">
            <span className="meta-item">Submitted: {claim.date}</span>
            <span className="meta-separator">|</span>
            <span className="meta-item">Plot Size: {claim.size}</span>
          </div>

          <a href="#" className="view-documents-link">
            <FaRegFileAlt className="link-icon" />
            View Documents & Photos
          </a>
        </div>
      </div>

      {/* Bottom Section: Actions */}
      <div className="card-actions">
        <div className="comment-section">
          <textarea
            className="comment-textarea"
            placeholder="Add a comment (required for rejection)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        <div className="action-buttons">
          <button 
            className="action-button reject-button"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            Reject
          </button>
          <button 
            className="action-button approve-button"
            onClick={handleApprove}
            disabled={isSubmitting}
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}
