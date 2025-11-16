import React, { useState } from 'react'
import { FaRegFileAlt } from 'react-icons/fa'
import { FiSearch } from 'react-icons/fi'
import { FaCheckCircle, FaUserCircle } from 'react-icons/fa'
import ClaimReviewCard from '../components/ClaimReviewCard'
import './ValidateClaim.css'

export default function ValidateClaim() {
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Sample claims data
  const [claims, setClaims] = useState([
    {
      id: 'CLM-2024-001',
      name: 'John Kamau',
      date: 'November 10, 2024',
      size: '0.35 Hectares',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop'
    },
    {
      id: 'CLM-2024-002',
      name: 'Mary Wanjiku',
      date: 'November 12, 2024',
      size: '0.48 Hectares',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop'
    },
    {
      id: 'CLM-2024-003',
      name: 'Peter Omondi',
      date: 'November 14, 2024',
      size: '0.22 Hectares',
      image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop'
    }
  ])

  const handleApprove = (claimId, comment) => {
    console.log(`Approved claim ${claimId} with comment:`, comment)
    // Remove the approved claim from the list
    setClaims(claims.filter(claim => claim.id !== claimId))
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
          {claims.length > 0 ? (
            claims.map((claim) => (
              <ClaimReviewCard
                key={claim.id}
                claim={claim}
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
