import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import validationService from '../services/validation'

export default function WitnessClaim() {
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(null)
  const [comments, setComments] = useState({})
  const [success, setSuccess] = useState(null)
  const { authState } = useAuth()

  useEffect(() => {
    fetchPendingClaims()
  }, [])

  const fetchPendingClaims = async () => {
    try {
      setLoading(true)
      const response = await validationService.getPendingClaims()
      setClaims(response.data)
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load pending claims')
    } finally {
      setLoading(false)
    }
  }

  const handleWitness = async (claimId) => {
    setSubmitting(claimId)
    setError(null)
    setSuccess(null)

    try {
      const comment = comments[claimId] || ''
      const response = await validationService.witnessClaim(claimId, comment)
      setSuccess(response.data.message)
      
      // Remove claim from list
      setClaims(claims.filter(c => c.id !== claimId))
      
      // Clear comment
      setComments({ ...comments, [claimId]: '' })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to witness claim')
    } finally {
      setSubmitting(null)
    }
  }

  const handleCommentChange = (claimId, value) => {
    setComments({ ...comments, [claimId]: value })
  }

  if (loading) return <div>Loading pending claims...</div>

  return (
    <div>
      <h2>Witness Land Claims</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        As a community member, you can witness land claims to help validate ownership.
        Each claim needs at least 2 witnesses before a leader can endorse it.
      </p>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '16px' }}>{success}</div>}

      {claims.length === 0 ? (
        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '4px' }}>
          No claims available for witnessing at this time.
        </div>
      ) : (
        <div>
          {claims.map((claim) => (
            <div
              key={claim.id}
              style={{
                border: '1px solid #ddd',
                padding: '16px',
                marginBottom: '16px',
                borderRadius: '8px',
                background: '#fff'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <img
                  src={`http://localhost:8000/${claim.photo_url}`}
                  alt="Land"
                  style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <div style={{ flex: 1 }}>
                  <div><strong>Claim ID:</strong> {claim.id}</div>
                  <div><strong>Location:</strong> {claim.geolocation.latitude.toFixed(6)}, {claim.geolocation.longitude.toFixed(6)}</div>
                  <div><strong>Status:</strong> <span style={{ color: 'orange' }}>{claim.validation_status}</span></div>
                  <div><strong>Current Witnesses:</strong> {claim.witness_count}</div>
                  <div><strong>Submitted:</strong> {new Date(claim.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="form" style={{ marginTop: '12px' }}>
                <label htmlFor={`comment-${claim.id}`}>Your Comment (optional):</label>
                <textarea
                  id={`comment-${claim.id}`}
                  placeholder="Add any observations or comments about this claim..."
                  value={comments[claim.id] || ''}
                  onChange={(e) => handleCommentChange(claim.id, e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />

                <button
                  onClick={() => handleWitness(claim.id)}
                  disabled={submitting === claim.id}
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    cursor: submitting === claim.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting === claim.id ? 'Submitting...' : '✓ Approve as Witness'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
