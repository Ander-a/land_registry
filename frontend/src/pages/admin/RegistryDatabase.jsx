import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaPlus, FaDownload } from 'react-icons/fa';
import AdminLayout from '../../layouts/AdminLayout';
import { analyticsUtils } from '../../services/analyticsService';
import './RegistryDatabase.css';

const RegistryDatabase = () => {
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    filterAndSortClaims();
  }, [claims, searchQuery, statusFilter, sortField, sortOrder]);

  const loadClaims = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/claims', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setClaims(data);
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortClaims = () => {
    let filtered = [...claims];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(claim =>
        claim.parcel_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.claimant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.national_id?.includes(searchQuery)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle date fields
      if (sortField === 'created_at' || sortField === 'updated_at') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredClaims(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleExport = async () => {
    try {
      const { analyticsService } = await import('../../services/analyticsService');
      await analyticsService.generateReport({
        reportType: 'properties',
        format: 'csv',
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClaims.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <AdminLayout>
      <div className="registry-database">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Registry Database</h1>
            <p className="page-subtitle">{filteredClaims.length} total records</p>
          </div>
          <div className="header-actions">
            <button className="export-btn" onClick={handleExport}>
              <FaDownload /> Export Data
            </button>
            <button className="add-claim-btn">
              <FaPlus /> Add New Claim
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section">
          {/* Search */}
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Parcel ID, Owner Name, or National ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="disputed">Disputed</option>
              <option value="under_review">Under Review</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="filter-group">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="filter-select"
            >
              <option value="created_at">Registration Date</option>
              <option value="parcel_id">Parcel ID</option>
              <option value="claimant_name">Owner Name</option>
              <option value="land_size">Land Size</option>
              <option value="status">Status</option>
            </select>
          </div>

          <button
            className="sort-order-btn"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('parcel_id')}>
                  Parcel ID {sortField === 'parcel_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('claimant_name')}>
                  Owner Name {sortField === 'claimant_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>National ID</th>
                <th>Location</th>
                <th onClick={() => handleSort('land_size')}>
                  Land Size {sortField === 'land_size' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('created_at')}>
                  Registered {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="loading-cell">Loading...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-cell">No records found</td>
                </tr>
              ) : (
                currentItems.map((claim) => (
                  <tr key={claim._id}>
                    <td className="parcel-id-cell">{claim.parcel_id}</td>
                    <td>{claim.claimant_name}</td>
                    <td className="national-id-cell">{claim.national_id}</td>
                    <td className="location-cell">
                      {claim.sector}, {claim.district}
                    </td>
                    <td>{claim.land_size} m²</td>
                    <td>
                      <span className={`status-badge ${analyticsUtils.getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="date-cell">
                      {new Date(claim.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="view-btn" title="View Details">
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="pagination-numbers">
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }

                return (
                  <button
                    key={pageNumber}
                    className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => paginate(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              className="pagination-btn"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>

            <span className="pagination-info">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RegistryDatabase;
