import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import claimsService from '../services/claims'
import validationService from '../services/validation'

export default function ClaimDetail() {
  const { id } = useParams()
  const [claim, setClaim] = useState(null)
  const [validations, setValidations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchClaimDetails()
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

  if (loading) return <div>Loading claim details...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
  if (!claim) return <div>Claim not found</div>

  const witnesses = validations.filter(v => v.validator_role === 'witness')
  const leaders = validations.filter(v => v.validator_role === 'leader')

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'partially_validated': return '#FF9800'
      case 'fully_validated': return 'green'
      default: return '#666'
    }
  }

  return (
    <div>
      <h2>Claim Details</h2>

      {/* Main Claim Info */}
      <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <img
            src={`http://localhost:8000/${claim.photo_url}`}
            alt="Land"
            style={{ width: '300px', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
          />
          <div style={{ flex: 1 }}>
            <div><strong>Claim ID:</strong> {claim.id}</div>
            <div><strong>Status:</strong> <span style={{ color: getStatusColor(claim.status) }}>{claim.status}</span></div>
            <div><strong>Location:</strong> {claim.geolocation.latitude.toFixed(6)}, {claim.geolocation.longitude.toFixed(6)}</div>
            <div><strong>Boundary Points:</strong> {claim.boundary.coordinates[0].length}</div>
            <div><strong>Submitted:</strong> {new Date(claim.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Validation Status Section */}
      <div style={{ border: '2px solid #4CAF50', padding: '16px', borderRadius: '8px', marginBottom: '16px', background: '#f1f8f4' }}>
        <h3>Validation Status</h3>
        
        <div style={{ marginTop: '12px' }}>
          <div><strong>Overall Status:</strong> <span style={{ color: getStatusColor(claim.validation_status), fontWeight: 'bold', textTransform: 'capitalize' }}>{claim.validation_status.replace('_', ' ')}</span></div>
          <div><strong>Witness Count:</strong> {claim.witness_count}</div>
          <div><strong>Leader Endorsed:</strong> {claim.endorsed_by_leader ? <span style={{ color: 'green' }}>✓ Yes</span> : <span style={{ color: 'orange' }}>✗ No</span>}</div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>Validation Progress:</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '24px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: claim.endorsed_by_leader ? '100%' : claim.witness_count >= 2 ? '66%' : `${(claim.witness_count / 2) * 66}%`,
                  height: '100%',
                  background: claim.endorsed_by_leader ? '#4CAF50' : claim.witness_count >= 2 ? '#FF9800' : '#FFC107',
                  transition: 'width 0.3s'
                }}
              />
            </div>
            <div style={{ fontSize: '14px', minWidth: '80px' }}>
              {claim.endorsed_by_leader ? '100%' : claim.witness_count >= 2 ? '66%' : `${Math.round((claim.witness_count / 2) * 66)}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Timeline */}
      <div style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px' }}>
        <h3>Validation Timeline</h3>

        {validations.length === 0 ? (
          <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '4px', marginTop: '12px' }}>
            No validations yet. This claim is awaiting community witnesses.
          </div>
        ) : (
          <div style={{ marginTop: '12px' }}>
            {/* Witnesses */}
            {witnesses.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#4CAF50' }}>Community Witnesses ({witnesses.length})</h4>
                {witnesses.map((w, idx) => (
                  <div key={w.id} style={{ padding: '12px', background: '#f9f9f9', borderRadius: '4px', marginTop: '8px', borderLeft: '4px solid #4CAF50' }}>
                    <div><strong>Witness {idx + 1}</strong> <span style={{ fontSize: '12px', color: '#999' }}>(ID: {w.validator_id.substring(0, 12)}...)</span></div>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>{w.comment || 'No comment provided'}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{new Date(w.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Leader Endorsements */}
            {leaders.length > 0 && (
              <div>
                <h4 style={{ color: '#2196F3' }}>Leader Endorsements</h4>
                {leaders.map((l, idx) => (
                  <div key={l.id} style={{ padding: '12px', background: '#e3f2fd', borderRadius: '4px', marginTop: '8px', borderLeft: '4px solid #2196F3' }}>
                    <div><strong>Leader</strong> <span style={{ fontSize: '12px', color: '#999' }}>(ID: {l.validator_id.substring(0, 12)}...)</span></div>
                    <div style={{ fontSize: '14px', marginTop: '4px', fontStyle: 'italic' }}>{l.comment || 'Official endorsement - No comment'}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{new Date(l.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
