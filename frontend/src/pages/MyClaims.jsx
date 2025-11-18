import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import { Link } from 'react-router-dom'
import { FiPlus, FiMapPin } from 'react-icons/fi'
import { BiArea } from 'react-icons/bi'
import { FaRegFileAlt } from 'react-icons/fa'
import './MyClaims.css'

export default function MyClaims() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { authState } = useAuth()

  useEffect(() => {
    async function fetchClaims() {
      try {
        const response = await claimsService.getAllMyClaims()
        setClaims(response.data)
      } catch (err) {
        setError(err?.response?.data?.detail || 'Failed to load claims')
      } finally {
        setLoading(false)
      }
    }
    fetchClaims()
  }, [])

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'validated': return 'status-validated'
      case 'rejected': return 'status-rejected'
      default: return 'status-pending'
    }
  }

  const getValidationClass = (status) => {
    switch (status) {
      case 'pending': return 'validation-pending'
      case 'partially_validated': return 'validation-partial'
      case 'fully_validated': return 'validation-full'
      default: return 'validation-pending'
    }
  }

  const calculateStats = () => {
    return {
      total: claims.length,
      pending: claims.filter(c => c.status === 'pending').length,
      validated: claims.filter(c => c.validation_status === 'fully_validated').length
    }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <div className="my-claims-container">
        <div className="my-claims-content">
          <div className="loading-state">Loading claims...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-claims-container">
        <div className="my-claims-content">
          <div className="error-state">Error: {error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="my-claims-container">
      <div className="my-claims-content">
        <div className="my-claims-header">
          <h1 className="my-claims-title">My Land Claims</h1>
          <Link to="/submit-claim-new" className="submit-new-claim-btn">
            <FiPlus size={20} />
            Submit New Claim
          </Link>
        </div>

        {claims.length > 0 && (
          <div className="claims-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Claims</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.validated}</div>
              <div className="stat-label">Validated</div>
            </div>
          </div>
        )}

        {claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FaRegFileAlt />
            </div>
            <h2 className="empty-state-title">No Claims Yet</h2>
            <p className="empty-state-text">
              You haven't submitted any land claims. Start by submitting your first claim.
            </p>
            <Link to="/submit-claim-new" className="submit-new-claim-btn">
              <FiPlus size={20} />
              Submit Your First Claim
            </Link>
          </div>
        ) : (
          <div className="claims-grid">
            {claims.map((claim) => (
              <div key={claim.id} className="claim-card">
                <div className="claim-card-content">
                  <img
                    src={`http://localhost:8000/${claim.photo_url}`}
                    alt="Land"
                    className="claim-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x150?text=No+Image'
                    }}
                  />
                  <div className="claim-details">
                    <div className="claim-detail-row">
                      <span className="claim-detail-label">Claim ID:</span>
                      <span className="claim-detail-value">{claim.id.slice(0, 8)}...</span>
                    </div>
                    
                    <div className="claim-detail-row">
                      <span className="claim-detail-label">Claimant:</span>
                      <span className="claim-detail-value">{claim.claimant_name || authState?.user?.name || 'N/A'}</span>
                    </div>

                    {claim.plot_area && (
                      <div className="claim-detail-row">
                        <span className="claim-detail-label">
                          <BiArea style={{ marginRight: '4px' }} />
                          Plot Area:
                        </span>
                        <span className="claim-detail-value">{claim.plot_area} hectares</span>
                      </div>
                    )}

                    <div className="claim-detail-row">
                      <span className="claim-detail-label">Status:</span>
                      <span className={`status-badge ${getStatusClass(claim.status)}`}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="claim-detail-row">
                      <span className="claim-detail-label">Validation:</span>
                      <span className={`validation-badge ${getValidationClass(claim.validation_status)}`}>
                        {claim.validation_status?.replace('_', ' ') || 'pending'}
                      </span>
                    </div>

                    <div className="claim-detail-row">
                      <span className="claim-detail-label">Witnesses:</span>
                      <span className="claim-detail-value">{claim.witness_count || 0} / 2</span>
                    </div>

                    <div className="claim-detail-row">
                      <span className="claim-detail-label">Leader Endorsed:</span>
                      <span className="claim-detail-value">
                        {claim.endorsed_by_leader ? '✓ Yes' : '✗ No'}
                      </span>
                    </div>

                    <div className="claim-detail-row">
                      <span className="claim-detail-label">
                        <FiMapPin style={{ marginRight: '4px' }} />
                        Location:
                      </span>
                      <span className="claim-detail-value">
                        {claim.geolocation.latitude.toFixed(4)}, {claim.geolocation.longitude.toFixed(4)}
                      </span>
                    </div>

                    <div className="claim-detail-row">
                      <span className="claim-detail-label">Submitted:</span>
                      <span className="claim-detail-value">
                        {new Date(claim.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <Link to={`/claim-details-new/${claim.id}`} className="view-details-btn">
                      View Full Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

