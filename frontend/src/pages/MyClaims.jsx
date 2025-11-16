import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import { Link } from 'react-router-dom'

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

  const getValidationStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'partially_validated': return '#FF9800'
      case 'fully_validated': return 'green'
      default: return '#666'
    }
  }

  if (loading) return <div>Loading claims...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>

  return (
    <div>
      <h2>My Land Claims</h2>
      <Link to="/submit-claim">
        <button style={{ marginBottom: '16px' }}>+ Submit New Claim</button>
      </Link>

      {claims.length === 0 ? (
        <p>No claims submitted yet.</p>
      ) : (
        <div>
          {claims.map((claim) => (
            <div
              key={claim.id}
              style={{
                border: '1px solid #ddd',
                padding: '12px',
                marginBottom: '12px',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                <img
                  src={`http://localhost:8000/${claim.photo_url}`}
                  alt="Land"
                  style={{ width: '150px', height: '100px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div><strong>Claim ID:</strong> {claim.id}</div>
                  <div><strong>Status:</strong> <span style={{ 
                    color: claim.status === 'pending' ? 'orange' : claim.status === 'validated' ? 'green' : 'red'
                  }}>{claim.status}</span></div>
                  <div><strong>Validation:</strong> <span style={{ 
                    color: getValidationStatusColor(claim.validation_status),
                    textTransform: 'capitalize'
                  }}>{claim.validation_status.replace('_', ' ')}</span></div>
                  <div><strong>Witnesses:</strong> {claim.witness_count}</div>
                  <div><strong>Leader Endorsed:</strong> {claim.endorsed_by_leader ? '✓ Yes' : '✗ No'}</div>
                  <div><strong>Location:</strong> {claim.geolocation.latitude.toFixed(6)}, {claim.geolocation.longitude.toFixed(6)}</div>
                  <div><strong>Submitted:</strong> {new Date(claim.created_at).toLocaleDateString()}</div>
                  <Link to={`/claim/${claim.id}`}>
                    <button style={{ marginTop: '8px', fontSize: '14px' }}>View Details</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

