import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import validationService from '../services/validation'

export default function LeaderEndorsement() {
  const [claims, setClaims] = useState([])
  const [validations, setValidations] = useState({})
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
      const claimsData = response.data

      // Fetch validation history for each claim
      const validationPromises = claimsData.map(async (claim) => {
        try {
          const valResponse = await validationService.getClaimValidations(claim.id)
          return { claimId: claim.id, validations: valResponse.data }
        } catch {
          return { claimId: claim.id, validations: [] }
        }
      })

      const validationResults = await Promise.all(validationPromises)
      const validationsMap = {}
      validationResults.forEach(({ claimId, validations }) => {
        validationsMap[claimId] = validations
      })

      setClaims(claimsData)
      setValidations(validationsMap)
      setError(null)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to load claims for endorsement')
    } finally {
      setLoading(false)
    }
  }

  const handleEndorse = async (claimId) => {
    setSubmitting(claimId)
    setError(null)
    setSuccess(null)

    try {
      const comment = comments[claimId] || ''
      const response = await validationService.leaderEndorseClaim(claimId, comment)
      setSuccess(response.data.message)
      
      // Remove claim from list
      setClaims(claims.filter(c => c.id !== claimId))
      
      // Clear comment
      setComments({ ...comments, [claimId]: '' })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to endorse claim')
    } finally {
      setSubmitting(null)
    }
  }

  const handleCommentChange = (claimId, value) => {
    setComments({ ...comments, [claimId]: value })
  }

  if (authState?.user?.role !== 'leader') {
    return (
      <div style={{ padding: '20px', background: '#ffebee', borderRadius: '4px', color: '#c62828' }}>
        Access Denied: Only leaders can access this page.
      </div>
    )
  }

  if (loading) return <div>Loading claims for endorsement...</div>

  return (
    <div>
      <h2>Leader Endorsement Panel</h2>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        As a community leader, you can endorse claims that have been witnessed by at least 2 community members.
        Your endorsement fully validates the claim.
      </p>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: '16px' }}>{success}</div>}

      {claims.length === 0 ? (
        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '4px' }}>
          No claims ready for leader endorsement. Claims need at least 2 witnesses before endorsement.
        </div>
      ) : (
        <div>
          {claims.map((claim) => {
            const claimValidations = validations[claim.id] || []
            const witnesses = claimValidations.filter(v => v.validator_role === 'witness')

            return (
              <div
                key={claim.id}
                style={{
                  border: '2px solid #4CAF50',
                  padding: '16px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  background: '#f1f8f4'
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
                    <div><strong>Witnesses:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>{claim.witness_count}</span></div>
                    <div><strong>Submitted:</strong> {new Date(claim.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* Witness List */}
                <div style={{ marginTop: '12px', marginBottom: '12px', padding: '12px', background: '#fff', borderRadius: '4px' }}>
                  <strong>Witness Endorsements:</strong>
                  {witnesses.length > 0 ? (
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {witnesses.map((w, idx) => (
                        <li key={idx}>
                          <div><strong>Witness {idx + 1}</strong> (ID: {w.validator_id.substring(0, 8)}...)</div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {w.comment || 'No comment'}
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {new Date(w.timestamp).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: '14px', color: '#999' }}>No witnesses yet</div>
                  )}
                </div>

                <div className="form" style={{ marginTop: '12px' }}>
                  <label htmlFor={`comment-${claim.id}`}>Leader Comment (optional):</label>
                  <textarea
                    id={`comment-${claim.id}`}
                    placeholder="Add your official endorsement comment..."
                    value={comments[claim.id] || ''}
                    onChange={(e) => handleCommentChange(claim.id, e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />

                  <button
                    onClick={() => handleEndorse(claim.id)}
                    disabled={submitting === claim.id}
                    style={{
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      cursor: submitting === claim.id ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {submitting === claim.id ? 'Endorsing...' : '✓ Endorse as Leader'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
