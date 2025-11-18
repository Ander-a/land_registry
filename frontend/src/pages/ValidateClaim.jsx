import React, { useState, useEffect } from 'react'
import { FaRegFileAlt } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { FaCheckCircle, FaUserCircle } from 'react-icons/fa'
import ClaimReviewCard from '../components/ClaimReviewCard'
import validationService from '../services/validation'
import './ValidateClaim.css'

export default function ValidateClaim() {
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const handleApprove = async (claimId, comment) => {
    try {
      await validationService.witnessClaim(claimId, comment)
      // Remove the approved claim from the list
      setClaims(claims.filter(claim => claim.id !== claimId))
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to approve claim')
    }
  }

  const handleReject = (claimId, comment) => {
    if (!comment.trim()) {
      alert('Please add a comment explaining the reason for rejection.')
      return
    }
    console.log(`Rejected claim ${claimId} with comment:`, comment)
    // Remove the rejected claim from the list
    setClaims(claims.filter(claim => claim.id !== claimId))
  }

  // Filter claims based on search term
  const filteredClaims = claims.filter(claim => {
    const matchesSearch = searchTerm === '' || 
      claim.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimant_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="validate-claim-container">
      {/* Header */}
      <header className="validate-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">🏛️</div>
            <h1 className="logo-text">Land Registry System</h1>
          </div>
          <button className="profile-button">
            <FaUserCircle className="profile-icon" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="validate-main">
        {/* Page Title */}
        <div className="page-header">
          <h2 className="page-title">Pending Claim Validation</h2>
          <p className="page-subtitle">
            Please review the following land claims submitted by community members.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <select 
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">Filter by Date</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Filter by Status</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="search"
              className="search-input"
              placeholder="Search by claimant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Claim List */}
        <div className="claims-list">
          {loading ? (
            <p className="loading-message">Loading claims...</p>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : filteredClaims.length > 0 ? (
            filteredClaims.map((claim) => (
              <ClaimReviewCard
                key={claim.id}
                claim={{
                  id: claim.id,
                  name: claim.claimant_name || 'Unknown',
                  date: new Date(claim.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }),
                  size: claim.plot_area ? `${claim.plot_area} Hectares` : 'N/A',
                  image: `http://localhost:8000/${claim.photo_url}`
                }}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))
          ) : (
            /* End of List Card */
            <div className="end-of-list-card">
              <div className="check-icon-container">
                <FaCheckCircle className="check-icon" />
              </div>
              <h3 className="end-title">All Claims Reviewed</h3>
              <p className="end-message">
                There are no more pending claims for you to validate. Great work!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
