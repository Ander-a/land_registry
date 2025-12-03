import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHome, 
  FaPlus, 
  FaFileAlt, 
  FaBell,
  FaDownload,
  FaEye,
  FaMapMarkerAlt,
  FaCalendar,
  FaCheckCircle,
  FaClock,
  FaSignOutAlt,
  FaSearch,
  FaFilter
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import './TitleDeeds.css'

export default function TitleDeeds() {
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [titleDeeds, setTitleDeeds] = useState([])
  const [filteredDeeds, setFilteredDeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, validated, pending

  useEffect(() => {
    fetchTitleDeeds()
  }, [])

  useEffect(() => {
    filterDeeds()
  }, [searchQuery, statusFilter, titleDeeds])

  const fetchTitleDeeds = async () => {
    try {
      setLoading(true)
      const response = await claimsService.getAllMyClaims()
      const claims = response.data || []
      setTitleDeeds(claims)
      setFilteredDeeds(claims)
    } catch (err) {
      console.error('Failed to fetch title deeds:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterDeeds = () => {
    let filtered = titleDeeds

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(deed => 
        statusFilter === 'validated' 
          ? deed.status === 'validated' 
          : deed.status === 'pending'
      )
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(deed => 
        deed.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deed.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deed.title_number?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredDeeds(filtered)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      validated: { icon: <FaCheckCircle />, text: 'Validated', className: 'status-validated' },
      pending: { icon: <FaClock />, text: 'Pending', className: 'status-pending' },
      rejected: { icon: <FaCheckCircle />, text: 'Rejected', className: 'status-rejected' }
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`status-badge ${config.className}`}>
        {config.icon} {config.text}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const handleDownloadDeed = (deed) => {
    // TODO: Implement actual PDF download
    console.log('Downloading deed:', deed.id)
    alert(`Download functionality for deed ${deed.id} will be implemented with backend integration.`)
  }

  const handleViewDetails = (deedId) => {
    navigate(`/claim-details/${deedId}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const stats = {
    total: titleDeeds.length,
    validated: titleDeeds.filter(d => d.status === 'validated').length,
    pending: titleDeeds.filter(d => d.status === 'pending').length
  }

  return (
    <div className="title-deeds-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaHome className="logo-icon" />
          </div>
          <h2 className="sidebar-title">Land Registry</h2>
          <p className="sidebar-subtitle">Resident Portal</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/resident/dashboard" className="nav-item">
            <FaHome className="nav-icon" />
            <span>Dashboard</span>
          </Link>
          <Link to="/submit-claim-new" className="nav-item">
            <FaPlus className="nav-icon" />
            <span>Submit New Claim</span>
          </Link>
          <Link to="/my-claims" className="nav-item active">
            <FaFileAlt className="nav-icon" />
            <span>My Title Deeds</span>
          </Link>
          <Link to="/notifications" className="nav-item">
            <FaBell className="nav-icon" />
            <span>Notifications</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div>
              <h1 className="page-title">My Title Deeds</h1>
              <p className="page-subtitle">View and manage all your property title deeds</p>
            </div>
            <Link to="/submit-claim-new" className="primary-btn">
              <FaPlus /> Submit New Claim
            </Link>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaFileAlt />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Deeds</p>
              <h3 className="stat-value">{stats.total}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon validated">
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <p className="stat-label">Validated</p>
              <h3 className="stat-value">{stats.validated}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">
              <FaClock />
            </div>
            <div className="stat-content">
              <p className="stat-label">Pending</p>
              <h3 className="stat-value">{stats.pending}</h3>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="controls-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by location, title number, or claim ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="validated">Validated</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Title Deeds Grid */}
        <div className="deeds-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your title deeds...</p>
            </div>
          ) : filteredDeeds.length > 0 ? (
            <div className="deeds-grid">
              {filteredDeeds.map((deed) => (
                <div key={deed.id} className="deed-card">
                  <div className="deed-header">
                    <div className="deed-title-section">
                      <h3 className="deed-location">
                        <FaMapMarkerAlt /> {deed.location || 'Location Not Specified'}
                      </h3>
                      <p className="deed-id">Claim ID: {deed.id?.substring(0, 12)}...</p>
                    </div>
                    {getStatusBadge(deed.status)}
                  </div>

                  <div className="deed-details">
                    <div className="deed-detail-item">
                      <span className="detail-label">Title Number:</span>
                      <span className="detail-value">
                        {deed.title_number || `#${deed.id?.substring(0, 8).toUpperCase()}`}
                      </span>
                    </div>
                    <div className="deed-detail-item">
                      <span className="detail-label">Size:</span>
                      <span className="detail-value">{deed.size || 'N/A'} acres</span>
                    </div>
                    <div className="deed-detail-item">
                      <span className="detail-label">Submitted:</span>
                      <span className="detail-value">
                        <FaCalendar /> {formatDate(deed.created_at)}
                      </span>
                    </div>
                    {deed.validated_at && (
                      <div className="deed-detail-item">
                        <span className="detail-label">Validated:</span>
                        <span className="detail-value">
                          <FaCalendar /> {formatDate(deed.validated_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  {deed.description && (
                    <div className="deed-description">
                      <p>{deed.description}</p>
                    </div>
                  )}

                  <div className="deed-actions">
                    <button 
                      onClick={() => handleViewDetails(deed.id)}
                      className="action-btn view"
                    >
                      <FaEye /> View Details
                    </button>
                    {deed.status === 'validated' && (
                      <button 
                        onClick={() => handleDownloadDeed(deed)}
                        className="action-btn download"
                      >
                        <FaDownload /> Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FaFileAlt className="empty-icon" />
              <h3>No title deeds found</h3>
              <p>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : "You don't have any title deeds yet. Submit a claim to get started."}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link to="/submit-claim-new" className="empty-action-btn">
                  <FaPlus /> Submit Your First Claim
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
