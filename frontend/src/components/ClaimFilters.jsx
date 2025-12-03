import { useState } from 'react';
import { FaFilter, FaTimes } from 'react-icons/fa';
import './ClaimFilters.css';

function ClaimFilters({ onApplyFilters, onReset }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    priority: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setShowFilters(false);
  };

  const handleReset = () => {
    const resetFilters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      priority: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    };
    setFilters(resetFilters);
    onReset();
    setShowFilters(false);
  };

  const hasActiveFilters = filters.status || filters.dateFrom || filters.dateTo || filters.priority;

  return (
    <div className="claim-filters">
      <button 
        className={`filter-toggle-btn ${hasActiveFilters ? 'has-filters' : ''}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <FaFilter />
        {hasActiveFilters ? 'Filters Active' : 'Filter & Sort'}
      </button>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-header">
            <h3>Filter & Sort Claims</h3>
            <button className="close-btn" onClick={() => setShowFilters(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="filter-content">
            <div className="filter-section">
              <h4>Status</h4>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="validated">Validated</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="conditional_approval">Conditional Approval</option>
                <option value="referred">Referred</option>
              </select>
            </div>

            <div className="filter-section">
              <h4>Date Range</h4>
              <div className="date-range">
                <div className="date-input-group">
                  <label>From:</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="filter-input"
                  />
                </div>
                <div className="date-input-group">
                  <label>To:</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            </div>

            <div className="filter-section">
              <h4>Sort By</h4>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="created_at">Date Submitted</option>
                <option value="plot_area">Plot Area</option>
                <option value="validation_status">Validation Status</option>
              </select>
            </div>

            <div className="filter-section">
              <h4>Sort Order</h4>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="desc"
                    checked={filters.sortOrder === 'desc'}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  />
                  <span>Descending (Newest First)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="asc"
                    checked={filters.sortOrder === 'asc'}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  />
                  <span>Ascending (Oldest First)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="filter-actions">
            <button className="reset-btn" onClick={handleReset}>
              Reset All
            </button>
            <button className="apply-btn" onClick={handleApply}>
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimFilters;
