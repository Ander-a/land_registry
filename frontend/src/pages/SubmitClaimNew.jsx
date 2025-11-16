import React, { useState } from 'react'
import { FiUpload, FiCheckCircle, FiX } from 'react-icons/fi'
import { MdAutoFixHigh } from 'react-icons/md'
import './SubmitClaimNew.css'

export default function SubmitClaimNew() {
  const [showToast, setShowToast] = useState(true)

  // Sample uploaded files data
  const uploadedFiles = [
    {
      name: 'IMG_4582.jpg',
      status: 'uploading',
      progress: 65
    },
    {
      name: 'EVIDENCE_01.png',
      status: 'complete',
      progress: 100
    }
  ]

  const handleAutoDetect = () => {
    alert('Auto-detect boundary feature activated!')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowToast(true)
  }

  return (
    <div className="submit-claim-container">
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <FiCheckCircle className="toast-icon" />
            <div className="toast-text">
              <h4 className="toast-title">Claim Submitted Successfully</h4>
              <p className="toast-message">Your land claim #2024-A4B8 has been received.</p>
            </div>
            <button 
              className="toast-close"
              onClick={() => setShowToast(false)}
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Submit a New Land Claim</h1>
        <p className="page-subtitle">
          Follow the steps below to define your parcel, upload evidence, and submit your claim for review.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="main-content-grid">
        {/* Left Column - Upload Geotagged Evidence */}
        <div className="content-card">
          <h2 className="card-title">Upload Geotagged Evidence</h2>
          
          {/* Drag & Drop Area */}
          <div className="drag-drop-area">
            <FiUpload className="upload-icon" />
            <p className="drag-drop-text">Drag & drop images here or click to browse.</p>
            <p className="drag-drop-note">At least one image is required.</p>
          </div>

          {/* Upload Button */}
          <button className="upload-button">
            <FiUpload className="button-icon" />
            Upload Files
          </button>

          {/* Uploaded Files Section */}
          <div className="uploaded-files-section">
            <h3 className="section-title">Uploaded Files</h3>
            
            {uploadedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className={`file-status ${file.status}`}>
                    {file.status === 'complete' && <FiCheckCircle className="status-icon" />}
                    {file.status === 'uploading' ? 'Uploading...' : 'Complete'}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${file.status}`}
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Define Parcel Boundary */}
        <div className="content-card">
          <h2 className="card-title">Define Parcel Boundary</h2>
          <p className="card-description">
            Click on the map to draw the boundary of your land parcel, or use the 'Auto-detect' feature.
          </p>

          {/* Map Placeholder */}
          <div className="map-placeholder">
            <div className="map-overlay">
              <div className="map-marker"></div>
              <div className="map-grid"></div>
              <p className="map-text">Interactive Map</p>
            </div>
          </div>

          {/* Auto-detect Button */}
          <button className="auto-detect-button" onClick={handleAutoDetect}>
            <MdAutoFixHigh className="button-icon" />
            Auto-detect Boundary
          </button>
        </div>
      </div>

      {/* Bottom Section - Claim Information */}
      <div className="content-card claim-info-card">
        <h2 className="card-title">Claim Information</h2>

        <form onSubmit={handleSubmit}>
          {/* Parcel Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Parcel Description
            </label>
            <textarea
              id="description"
              className="form-textarea"
              rows={4}
              placeholder="e.g., Vacant lot behind the community market, used for farming since 2005."
            ></textarea>
          </div>

          {/* Boundary Coordinates */}
          <div className="form-group">
            <label htmlFor="coordinates" className="form-label">
              Boundary Coordinates
            </label>
            <input
              id="coordinates"
              type="text"
              className="form-input"
              value="[-74.0068, 40.7128], [-74.0058, 40.7138], [-74.0048, 40.7128], [-74.0068, 40.7118]"
              readOnly
            />
            <p className="form-help-text">
              Coordinates are automatically populated from the map.
            </p>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-button">
            Submit Claim
          </button>
        </form>
      </div>
    </div>
  )
}
