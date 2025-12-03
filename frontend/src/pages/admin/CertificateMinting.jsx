import React, { useState, useEffect } from 'react';
import { FaFileContract, FaSpinner, FaFilter, FaSort } from 'react-icons/fa';
import AdminLayout from '../../layouts/AdminLayout';
import './CertificateMinting.css';

// Generate random transaction hash
const generateTransactionHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

const CertificateMinting = () => {
  const [claims, setClaims] = useState([
    {
      id: 'LRD-2024-8451',
      parcelId: '789012-C',
      owner: 'Eleanor Vance',
      approvalDate: '2024-07-28',
      approver: 'Dir. Castro',
      status: 'ready',
      hash: null
    },
    {
      id: 'LRD-2024-7329',
      parcelId: '456789-A',
      owner: 'Marcus Holloway',
      approvalDate: '2024-07-27',
      approver: 'Dir. Castro',
      status: 'ready',
      hash: null
    },
    {
      id: 'LRD-2024-6105',
      parcelId: '123456-B',
      owner: 'Anya Sharma',
      approvalDate: '2024-07-26',
      approver: 'Dir. Castro',
      status: 'issued',
      hash: '0x7a2f...c3e9'
    }
  ]);

  const [statusFilter, setStatusFilter] = useState('ready');
  const [sortBy, setSortBy] = useState('newest');

  // Load approved claims from API
  useEffect(() => {
    loadApprovedClaims();
  }, []);

  const loadApprovedClaims = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/claims?status=approved', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Transform API data to match our format
      const transformedClaims = data.slice(0, 10).map(claim => ({
        id: `LRD-2024-${Math.floor(Math.random() * 9999)}`,
        parcelId: claim.parcel_id,
        owner: claim.claimant_name,
        approvalDate: new Date(claim.updated_at).toISOString().split('T')[0],
        approver: 'Dir. Castro',
        status: 'ready',
        hash: null
      }));

      setClaims(transformedClaims);
    } catch (error) {
      console.error('Error loading approved claims:', error);
      // Keep mock data if API fails
    }
  };

  const handleMint = (claimId) => {
    // Update status to minting
    setClaims(prevClaims =>
      prevClaims.map(claim =>
        claim.id === claimId
          ? { ...claim, status: 'minting' }
          : claim
      )
    );

    // Simulate blockchain transaction (3 seconds)
    setTimeout(() => {
      const mockHash = generateTransactionHash();
      
      setClaims(prevClaims =>
        prevClaims.map(claim =>
          claim.id === claimId
            ? { ...claim, status: 'issued', hash: mockHash }
            : claim
        )
      );
    }, 3000);
  };

  // Filter claims
  const filteredClaims = claims.filter(claim => {
    if (statusFilter === 'all') return true;
    return claim.status === statusFilter;
  });

  // Sort claims
  const sortedClaims = [...filteredClaims].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.approvalDate) - new Date(a.approvalDate);
    } else {
      return new Date(a.approvalDate) - new Date(b.approvalDate);
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      'ready': { label: 'Ready to Mint', color: 'orange' },
      'minting': { label: 'Minting...', color: 'blue' },
      'issued': { label: 'Issued', color: 'green' }
    };
    return badges[status];
  };

  const getStatusColor = (status) => {
    const colors = {
      'ready': '#f59e0b',
      'minting': '#3b82f6',
      'issued': '#10b981'
    };
    return colors[status];
  };

  return (
    <AdminLayout>
      <div className="certificate-minting">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-link">Dashboard</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-link">Claims</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Certificate Minting</span>
        </div>

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Certificate Minting</h1>
            <p className="page-subtitle">
              Review and issue official blockchain-based title deeds for approved land claims.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="ready">Ready to Mint</option>
              <option value="minting">Minting</option>
              <option value="issued">Issued</option>
            </select>
          </div>

          <div className="filter-group">
            <FaSort className="filter-icon" />
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {/* Claims List */}
        <div className="claims-list">
          {sortedClaims.length === 0 ? (
            <div className="empty-state">
              <FaFileContract className="empty-icon" />
              <p>No claims found matching your filters</p>
            </div>
          ) : (
            sortedClaims.map((claim) => {
              const statusBadge = getStatusBadge(claim.status);
              
              return (
                <div key={claim.id} className="claim-card">
                  <div className="claim-content">
                    <div className="claim-header">
                      <div className="claim-title-row">
                        <h3 className="claim-title">
                          Claim ID: {claim.id} / Parcel: {claim.parcelId}
                        </h3>
                        <span 
                          className={`status-badge status-${claim.status}`}
                          style={{ backgroundColor: `${getStatusColor(claim.status)}20`, color: getStatusColor(claim.status) }}
                        >
                          {claim.status === 'minting' && <FaSpinner className="spinner" />}
                          {statusBadge.label}
                        </span>
                      </div>
                      <div className="claim-meta">
                        Owner: {claim.owner} | Approval Date: {claim.approvalDate} | Approver: {claim.approver}
                      </div>
                    </div>

                    {/* Action Buttons or Hash Display */}
                    <div className="claim-actions">
                      {claim.status === 'ready' && (
                        <button
                          className="mint-button"
                          onClick={() => handleMint(claim.id)}
                        >
                          <FaFileContract /> Mint Blockchain Title Deed
                        </button>
                      )}

                      {claim.status === 'minting' && (
                        <button className="mint-button minting" disabled>
                          <FaSpinner className="spinner" /> Minting... Please Wait
                        </button>
                      )}

                      {claim.status === 'issued' && (
                        <div className="transaction-hash">
                          <label>Transaction Hash ID</label>
                          <div className="hash-value">{claim.hash}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Box */}
                  <div className="title-deed-preview">
                    <span>Title Deed Preview</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CertificateMinting;
