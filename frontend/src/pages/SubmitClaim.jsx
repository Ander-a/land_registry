import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MapBoundaryDrawer from '../components/MapBoundaryDrawer'
import claimsService from '../services/claims'

export default function SubmitClaim() {
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [boundary, setBoundary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  
  const { authState } = useAuth()
  const navigate = useNavigate()

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleBoundaryChange = (newBoundary) => {
    setBoundary(newBoundary)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!photo) {
      setError('Please upload a photo')
      return
    }

    if (!boundary) {
      setError('Please draw a boundary on the map')
      return
    }

    setLoading(true)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('photo', photo)
      formData.append('boundary', JSON.stringify(boundary))

      // Submit claim
      const response = await claimsService.createClaim(formData)
      
      setSuccess(true)
      setError(null)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to submit claim. Make sure your photo has GPS data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Submit Land Claim</h2>
      
      <form onSubmit={handleSubmit} className="form">
        {/* Photo Upload */}
        <div>
          <label htmlFor="photo">Upload Land Photo (with GPS data):</label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            required
          />
          {photoPreview && (
            <div style={{ marginTop: '8px' }}>
              <img src={photoPreview} alt="Preview" style={{ maxWidth: '300px', maxHeight: '200px' }} />
            </div>
          )}
        </div>

        {/* Map for Boundary Drawing */}
        <div style={{ marginTop: '16px' }}>
          <label>Draw Land Boundary:</label>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Use the polygon tool on the map to draw your land boundary. Click to add points, double-click to finish.
          </p>
          <MapBoundaryDrawer onBoundaryChange={handleBoundaryChange} />
          {boundary && (
            <div style={{ fontSize: '12px', color: 'green' }}>
              ✓ Boundary drawn ({boundary.coordinates[0].length} points)
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={loading || !photo || !boundary}>
          {loading ? 'Submitting...' : 'Submit Claim'}
        </button>

        {/* Error/Success Messages */}
        {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
        {success && (
          <div style={{ color: 'green', marginTop: '8px' }}>
            ✓ Claim submitted successfully! Redirecting...
          </div>
        )}
      </form>

      <div style={{ marginTop: '24px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
        <h4>Requirements:</h4>
        <ul style={{ fontSize: '14px' }}>
          <li>Photo must contain GPS EXIF data (take photo with smartphone location enabled)</li>
          <li>Draw boundary polygon on the map using the polygon tool</li>
          <li>Boundary must have at least 3 points</li>
        </ul>
      </div>
    </div>
  )
}
