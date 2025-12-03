import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  FaHome, 
  FaUsers,
  FaMapMarkedAlt,
  FaTrophy,
  FaBell,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaUser,
  FaCalendar,
  FaRulerCombined,
  FaCheckCircle,
  FaTimesCircle,
  FaQuestionCircle,
  FaFileAlt,
  FaImage,
  FaClock,
  FaArrowLeft,
  FaExclamationTriangle
} from 'react-icons/fa'
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import './ClaimValidation.css'

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function ClaimValidation() {
  const { claimId } = useParams()
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [claim, setClaim] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validationAction, setValidationAction] = useState(null) // vouch, dispute, unsure
  const [validationReason, setValidationReason] = useState('')
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  useEffect(() => {
    fetchClaimDetails()
  }, [claimId])

  const fetchClaimDetails = async () => {
    try {
      setLoading(true)
      const response = await claimsService.getClaimById(claimId)
      
      // Mock enhanced data
      const claimData = {
        ...response.data,
        claimant_name: response.data.claimant_name || authState?.user?.name || 'John Doe',
        claimant_email: response.data.claimant_email || 'claimant@example.com',
        claimant_phone: response.data.claimant_phone || '+254 712 345 678',
        coordinates: response.data.coordinates || { 
          lat: -1.286389 + (Math.random() - 0.5) * 0.01,
          lon: 36.817223 + (Math.random() - 0.5) * 0.01
        },
        boundaries: response.data.boundaries || [
          [-1.286389, 36.817223],
          [-1.286489, 36.817323],
          [-1.286589, 36.817223],
          [-1.286489, 36.817123],
        ],
        size: response.data.size || (Math.random() * 5 + 1).toFixed(2),
        documents: response.data.documents || [
          { name: 'Title Deed Copy.pdf', type: 'title_deed', uploaded_at: new Date().toISOString() },
          { name: 'Survey Report.pdf', type: 'survey', uploaded_at: new Date().toISOString() }
        ],
        validators: response.data.validators || [
          { name: 'Jane Mukami', action: 'vouch', trust_score: 92, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { name: 'David Omondi', action: 'vouch', trust_score: 85, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
        ],
        validation_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        images: response.data.images || []
      }
      
      setClaim(claimData)
    } catch (err) {
      console.error('Failed to fetch claim details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleValidationSubmit = async (action) => {
    if (action === 'dispute' && !validationReason.trim()) {
      alert('Please provide a reason for the dispute')
      return
    }

    try {
      setSubmitting(true)
      
      // TODO: Replace with actual API call
      // await validationService.submitValidation(claimId, {
      //   action,
      //   reason: validationReason,
      //   validator_location: userLocation
      // })

      console.log('Validation submitted:', { claimId, action, reason: validationReason })
      
      alert(`Successfully ${action === 'vouch' ? 'vouched for' : action === 'dispute' ? 'disputed' : 'marked as unsure on'} this claim!`)
      
      setShowDisputeModal(false)
      navigate('/community/claims')
    } catch (err) {
      console.error('Failed to submit validation:', err)
      alert('Failed to submit validation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleActionClick = (action) => {
    setValidationAction(action)
    if (action === 'dispute') {
      setShowDisputeModal(true)
    } else {
      handleValidationSubmit(action)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getDaysRemaining = (deadline) => {
    const days = Math.ceil((new Date(deadline) - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="claim-validation-page">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <FaUsers className="logo-icon" />
            </div>
            <h2 className="sidebar-title">Land Registry</h2>
            <p className="sidebar-subtitle">Community Portal</p>
          </div>
          <nav className="sidebar-nav">
            <Link to="/community/feed" className="nav-item">
              <FaUsers className="nav-icon" />
              <span>Community Feed</span>
            </Link>
            <Link to="/community/claims" className="nav-item">
              <FaMapMarkedAlt className="nav-icon" />
              <span>Claims Near You</span>
            </Link>
            <Link to="/community/score" className="nav-item">
              <FaTrophy className="nav-icon" />
              <span>Validator Score</span>
            </Link>
            <Link to="/notifications" className="nav-item">
              <FaBell className="nav-icon" />
              <span>Notifications</span>
            </Link>
          </nav>
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-btn">
              <FaSignOutAlt className="nav-icon" />
              <span>Logout</span>
            </button>
          </div>
        </aside>
        <main className="dashboard-main">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading claim details...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="claim-validation-page">
        <div className="error-state">
          <h2>Claim not found</h2>
          <Link to="/community/claims">Back to Claims</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="claim-validation-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaUsers className="logo-icon" />
          </div>
          <h2 className="sidebar-title">Land Registry</h2>
          <p className="sidebar-subtitle">Community Portal</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/community/feed" className="nav-item">
            <FaUsers className="nav-icon" />
            <span>Community Feed</span>
          </Link>
          <Link to="/community/claims" className="nav-item active">
            <FaMapMarkedAlt className="nav-icon" />
            <span>Claims Near You</span>
          </Link>
          <Link to="/community/score" className="nav-item">
            <FaTrophy className="nav-icon" />
            <span>Validator Score</span>
          </Link>
          <Link to="/notifications" className="nav-item">
            <FaBell className="nav-icon" />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="validation-main">
        {/* Header */}
        <header className="validation-header">
          <Link to="/community/claims" className="back-button">
            <FaArrowLeft /> Back to Claims
          </Link>
          <h1 className="validation-title">Validate Land Claim</h1>
        </header>

        {/* Content Layout */}
        <div className="validation-content">
          {/* Left Side - Map */}
          <div className="map-section">
            <div className="map-container">
              <MapContainer
                center={[claim.coordinates.lat, claim.coordinates.lon]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {claim.boundaries && claim.boundaries.length > 0 && (
                  <Polygon
                    positions={claim.boundaries}
                    pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.3 }}
                  />
                )}
                <Marker position={[claim.coordinates.lat, claim.coordinates.lon]}>
                  <Popup>
                    <strong>{claim.location}</strong>
                    <br />
                    Size: {claim.size} acres
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Claim Images */}
            {claim.images && claim.images.length > 0 && (
              <div className="images-section">
                <h3 className="section-subtitle">Property Images</h3>
                <div className="images-grid">
                  {claim.images.map((image, idx) => (
                    <div 
                      key={idx} 
                      className="image-thumbnail"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img src={image} alt={`Property ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Details & Validation */}
          <div className="details-section">
            {/* Claim Info Card */}
            <div className="info-card">
              <h2 className="card-title">Claim Information</h2>
              
              <div className="info-grid">
                <div className="info-item">
                  <FaMapMarkerAlt className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Location</span>
                    <span className="info-value">{claim.location}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaRulerCombined className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Land Size</span>
                    <span className="info-value">{claim.size} acres</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaCalendar className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Submitted</span>
                    <span className="info-value">{formatDate(claim.created_at)}</span>
                  </div>
                </div>

                <div className="info-item">
                  <FaClock className="info-icon" />
                  <div className="info-content">
                    <span className="info-label">Validation Deadline</span>
                    <span className="info-value">
                      {getDaysRemaining(claim.validation_deadline)} days remaining
                    </span>
                  </div>
                </div>
              </div>

              {claim.description && (
                <div className="description-section">
                  <h3 className="section-subtitle">Description</h3>
                  <p className="description-text">{claim.description}</p>
                </div>
              )}
            </div>

            {/* Claimant Info Card */}
            <div className="info-card">
              <h2 className="card-title">Claimant Information</h2>
              
              <div className="claimant-info">
                <div className="claimant-avatar">
                  {claim.claimant_name.charAt(0).toUpperCase()}
                </div>
                <div className="claimant-details">
                  <h3 className="claimant-name">{claim.claimant_name}</h3>
                  <p className="claimant-contact">{claim.claimant_email}</p>
                  <p className="claimant-contact">{claim.claimant_phone}</p>
                </div>
              </div>
            </div>

            {/* Documents Card */}
            {claim.documents && claim.documents.length > 0 && (
              <div className="info-card">
                <h2 className="card-title">Supporting Documents</h2>
                <div className="documents-list">
                  {claim.documents.map((doc, idx) => (
                    <div key={idx} className="document-item">
                      <FaFileAlt className="document-icon" />
                      <div className="document-info">
                        <span className="document-name">{doc.name}</span>
                        <span className="document-date">{formatDate(doc.uploaded_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Existing Validators */}
            {claim.validators && claim.validators.length > 0 && (
              <div className="info-card">
                <h2 className="card-title">Community Validators ({claim.validators.length})</h2>
                <div className="validators-list">
                  {claim.validators.map((validator, idx) => (
                    <div key={idx} className="validator-item">
                      <div className="validator-avatar">
                        {validator.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="validator-info">
                        <span className="validator-name">{validator.name}</span>
                        <span className="validator-trust">
                          <FaCheckCircle /> {validator.trust_score}% Trust
                        </span>
                      </div>
                      <div className={`validator-action ${validator.action}`}>
                        {validator.action === 'vouch' && <FaCheckCircle />}
                        {validator.action === 'dispute' && <FaTimesCircle />}
                        {validator.action === 'unsure' && <FaQuestionCircle />}
                        <span>{validator.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Actions */}
            <div className="validation-actions-card">
              <h2 className="card-title">Your Validation</h2>
              <p className="validation-prompt">
                Based on your local knowledge, do you believe this land claim is legitimate?
              </p>

              <div className="action-buttons">
                <button 
                  className="action-btn vouch"
                  onClick={() => handleActionClick('vouch')}
                  disabled={submitting}
                >
                  <FaCheckCircle />
                  <span>Vouch</span>
                  <small>I confirm this claim is valid</small>
                </button>

                <button 
                  className="action-btn unsure"
                  onClick={() => handleActionClick('unsure')}
                  disabled={submitting}
                >
                  <FaQuestionCircle />
                  <span>Unsure</span>
                  <small>I don't have enough information</small>
                </button>

                <button 
                  className="action-btn dispute"
                  onClick={() => handleActionClick('dispute')}
                  disabled={submitting}
                >
                  <FaTimesCircle />
                  <span>Dispute</span>
                  <small>I believe this claim is invalid</small>
                </button>
              </div>

              <div className="validation-warning">
                <FaExclamationTriangle />
                <p>Your validation will affect your trust score. Only validate claims you have direct knowledge about.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dispute This Claim</h2>
              <button className="modal-close" onClick={() => setShowDisputeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Please provide a detailed reason for disputing this claim:</p>
              <textarea
                className="dispute-reason"
                value={validationReason}
                onChange={(e) => setValidationReason(e.target.value)}
                placeholder="Explain why you believe this claim is invalid..."
                rows={6}
              />
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn cancel"
                onClick={() => setShowDisputeModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn submit"
                onClick={() => handleValidationSubmit('dispute')}
                disabled={!validationReason.trim() || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage} alt="Property" />
          </div>
        </div>
      )}
    </div>
  )
}
