import React from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiDownload, FiFlag } from 'react-icons/fi'
import './ClaimDetailsNew.css'

export default function ClaimDetailsNew() {
  const claimId = '12345'

  const claimInfo = {
    claimantName: 'Amina Okoro',
    dateSubmitted: 'August 15, 2023',
    gpsCoordinates: '1.286389, 36.817223',
    plotArea: '0.25 Hectares',
    validatorId: 'VAL-AI-789'
  }

  const handleDownloadCertificate = () => {
    alert('Certificate download started!')
  }

  const handleReportIssue = () => {
    alert('Report issue form opened!')
  }

  return (
    <div className="claim-details-container">
      {/* Header Section */}
      <div className="claim-header">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb">
          <Link to="/dashboard" className="breadcrumb-link">Dashboard</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/my-claims" className="breadcrumb-link">Claims</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Claim #{claimId}</span>
        </nav>

        {/* Title and Badge */}
        <div className="title-row">
          <h1 className="page-title">Claim Details: #{claimId}</h1>
          <div className="verified-badge">
            <FiCheckCircle className="badge-icon" />
            <span className="badge-text">Verified</span>
          </div>
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
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop"
                alt="Land plot with landmarks"
                className="claim-image"
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
                <dd className="info-value">{claimInfo.claimantName}</dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Date Submitted</dt>
                <dd className="info-value">{claimInfo.dateSubmitted}</dd>
              </div>
              <div className="info-item">
                <dt className="info-label">GPS Coordinates</dt>
                <dd className="info-value">{claimInfo.gpsCoordinates}</dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Plot Area</dt>
                <dd className="info-value">{claimInfo.plotArea}</dd>
              </div>
              <div className="info-item">
                <dt className="info-label">Validator ID</dt>
                <dd className="info-value">{claimInfo.validatorId}</dd>
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
