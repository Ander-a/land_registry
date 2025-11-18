import React, { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiCheckCircle, FiDownload, FiFlag } from 'react-icons/fi'
import claimsService from '../services/claims'
import validationService from '../services/validation'
import './ClaimDetailsNew.css'

export default function ClaimDetailsNew() {
  const { id } = useParams()
  const [claim, setClaim] = useState(null)
  const [validations, setValidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchClaimDetails()
    }
  }, [id])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      const claimResponse = await claimsService.getClaim(id)
      setClaim(claimResponse.data)

      const validationResponse = await validationService.getClaimValidations(id)
      setValidations(validationResponse.data)

      setError(null)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load claim details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadCertificate = () => {
    alert('Certificate download started!')
  }

  const handleReportIssue = () => {
    alert('Report issue form opened!')
  }

  if (loading) {
    return (
      <div className="claim-details-container">
        <p className="loading-message">Loading claim details...</p>
      </div>
    )
  }

  if (error || !claim) {
    return (
      <div className="claim-details-container">
        <p className="error-message">{error || 'Claim not found'}</p>
        <Link to="/my-claims" className="back-link">← Back to Claims</Link>
      </div>
    )
  }

  return (
    <div className="claim-details-container">
      {/* Header Section */}
      <div className="claim-header">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb">
          <Link to="/dashboard-new" className="breadcrumb-link">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/my-claims" className="breadcrumb-link">Claims</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Claim #{claim.id?.substring(0, 8)}</span>
        </nav>

        {/* Title and Badge */}
        <div className="title-row">
          <h1 className="page-title">Claim Details: #{claim.id?.substring(0, 8)}</h1>
          {claim.status === 'validated' && (
            <div className="verified-badge">
              <FiCheckCircle className="badge-icon" />
              <span className="badge-text">Verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Left Column - Content */}
        <div className="left-column">
          {/* Card 1: Original Uploaded Image */}
          <div className="content-card">
            <div className="card-header">
              <h2 className="card-title">Original Uploaded Image</h2>
              <p className="card-subtitle">
                A photo of the land plot with identifiable landmarks.
              </p>
            </div>
            <div className="image-container">
              <img
                src={`http://localhost:8000/${claim.photo_url}`}
                alt="Land plot with landmarks"
                className="claim-image"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop'
                }}
              />
            </div>
          </div>

          {/* Card 2: AI-Generated Boundary Polygon */}
          <div className="content-card">
            <div className="card-header">
              <h2 className="card-title">AI-Generated Boundary Polygon</h2>
              <p className="card-subtitle">
                Validated boundary overlayed on satellite imagery.
              </p>
            </div>
            <div className="image-container">
              <div className="map-placeholder">
                <div className="map-overlay">
                  <div className="boundary-polygon"></div>
                  <div className="map-marker"></div>
                  <div className="map-grid"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar (Sticky) */}
        <div className="right-column">
          {/* Card 1: Claim Information */}
          <div className="sidebar-card">
            <h2 className="card-title">Claim Information</h2>
            <dl className="info-list">
              <div className="info-item">
                <dt className="info-label">Claimant Name</dt>
                <dd className="info-value">{claim.claimant_name || 'N/A'}</dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Date Submitted</dt>
                <dd className="info-value">
                  {new Date(claim.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              <div className="info-item">
                <dt className="info-label">GPS Coordinates</dt>
                <dd className="info-value">
                  {claim.geolocation?.latitude?.toFixed(6)}, {claim.geolocation?.longitude?.toFixed(6)}
                </dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Plot Area</dt>
                <dd className="info-value">{claim.plot_area || 'N/A'} Hectares</dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Status</dt>
                <dd className="info-value" style={{ textTransform: 'capitalize' }}>
                  {claim.status}
                </dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Witnesses</dt>
                <dd className="info-value">{claim.witness_count || 0}</dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Leader Endorsed</dt>
                <dd className="info-value">{claim.endorsed_by_leader ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          {/* Card 2: Actions */}
          <div className="sidebar-card">
            <h2 className="card-title">Actions</h2>
            <div className="actions-list">
              <button 
                className="action-button primary"
                onClick={handleDownloadCertificate}
              >
                <FiDownload className="button-icon" />
                <span className="button-text">Download Certificate</span>
              </button>
              <button 
                className="action-button secondary"
                onClick={handleReportIssue}
              >
                <FiFlag className="button-icon" />
                <span className="button-text">Report Issue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
