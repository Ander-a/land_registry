import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FaHome, 
  FaUsers,
  FaMapMarkedAlt,
  FaTrophy,
  FaBell,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaUser,
  FaRulerCombined,
  FaFilter,
  FaSearch
} from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import claimsService from '../services/claims'
import './ClaimsNearYou.css'

export default function ClaimsNearYou() {
  const { authState, logout } = useAuth()
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [filteredClaims, setFilteredClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending') // all, pending, validated
  const [distanceFilter, setDistanceFilter] = useState('all') // all, nearby (< 5km), close (< 10km)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    getUserLocation()
    fetchClaims()
  }, [])

  useEffect(() => {
    filterClaims()
  }, [searchQuery, statusFilter, distanceFilter, claims])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation not available:', error)
          // Use default location (Nairobi) if geolocation fails
          setUserLocation({ lat: -1.286389, lon: 36.817223 })
        }
      )
    } else {
      // Default to Nairobi if geolocation not supported
      setUserLocation({ lat: -1.286389, lon: 36.817223 })
    }
  }

  const calculateDistance = (claimLat, claimLon) => {
    if (!userLocation) return null

    // Haversine formula
    const R = 6371 // Earth's radius in km
    const dLat = (claimLat - userLocation.lat) * Math.PI / 180
    const dLon = (claimLon - userLocation.lon) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(claimLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance.toFixed(1)
  }

  const fetchClaims = async () => {
    try {
      setLoading(true)
      const response = await claimsService.getAllClaims()
      const allClaims = response.data || []

      // Add mock distance data (in production, this would come from backend)
      const claimsWithDistance = allClaims.map(claim => {
        // Mock coordinates if not present
        const lat = claim.coordinates?.lat || (-1.286389 + (Math.random() - 0.5) * 0.1)
        const lon = claim.coordinates?.lon || (36.817223 + (Math.random() - 0.5) * 0.1)
        
        return {
          ...claim,
          coordinates: { lat, lon },
          distance: calculateDistance(lat, lon),
          days_pending: Math.floor((Date.now() - new Date(claim.created_at)) / (1000 * 60 * 60 * 24)),
          validators_count: claim.validators_count || Math.floor(Math.random() * 8),
          required_validators: claim.required_validators || 3
        }
      })

      // Sort by distance (closest first)
      claimsWithDistance.sort((a, b) => {
        const distA = parseFloat(a.distance) || 999
        const distB = parseFloat(b.distance) || 999
        return distA - distB
      })

      setClaims(claimsWithDistance)
      setFilteredClaims(claimsWithDistance)
    } catch (err) {
      console.error('Failed to fetch claims:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterClaims = () => {
    let filtered = claims

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(claim => claim.status === statusFilter)
    }

    // Distance filter
    if (distanceFilter === 'nearby') {
      filtered = filtered.filter(claim => parseFloat(claim.distance) < 5)
    } else if (distanceFilter === 'close') {
      filtered = filtered.filter(claim => parseFloat(claim.distance) < 10)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(claim => 
        claim.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.claimant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredClaims(filtered)
  }

  const getStatusBadge = (claim) => {
    const status = claim.status
    const validatorsNeeded = claim.required_validators - claim.validators_count

    if (status === 'validated') {
      return <span className="status-badge validated"><FaCheckCircle /> Validated</span>
    } else if (status === 'pending') {
      if (validatorsNeeded > 0) {
        return <span className="status-badge pending"><FaClock /> {validatorsNeeded} validators needed</span>
      } else {
        return <span className="status-badge reviewing"><FaExclamationCircle /> Under Review</span>
      }
    } else {
      return <span className="status-badge default">{status}</span>
    }
  }

  const handleValidateClaim = (claimId) => {
    navigate(`/community/validate/${claimId}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const stats = {
    total: filteredClaims.length,
    pending: filteredClaims.filter(c => c.status === 'pending').length,
    nearby: filteredClaims.filter(c => parseFloat(c.distance) < 5).length
  }

  return (
    <div className="claims-near-you-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <FaUsers className="logo-icon" />
          </div>
          <h2 className="sidebar-title">Land Registry</h2>
          <p className="sidebar-subtitle">Community Portal</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/community/feed" className="nav-item">
            <FaUsers className="nav-icon" />
            <span>Community Feed</span>
          </Link>
          <Link to="/community/claims" className="nav-item active">
            <FaMapMarkedAlt className="nav-icon" />
            <span>Claims Near You</span>
          </Link>
          <Link to="/community/score" className="nav-item">
            <FaTrophy className="nav-icon" />
            <span>Validator Score</span>
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
              <h1 className="page-title">Claims Near You</h1>
              <p className="page-subtitle">Validate land claims in your area and earn trust points</p>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon total">
              <FaMapMarkedAlt />
            </div>
            <div className="stat-content">
              <p className="stat-label">Available Claims</p>
              <h3 className="stat-value">{stats.total}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">
              <FaClock />
            </div>
            <div className="stat-content">
              <p className="stat-label">Pending Validation</p>
              <h3 className="stat-value">{stats.pending}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon nearby">
              <FaMapMarkerAlt />
            </div>
            <div className="stat-content">
              <p className="stat-label">Within 5km</p>
              <h3 className="stat-value">{stats.nearby}</h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="controls-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by location, claimant, or ID..."
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
              <option value="pending">Pending</option>
              <option value="validated">Validated</option>
            </select>
          </div>
          <div className="filter-group">
            <FaMapMarkerAlt className="filter-icon" />
            <select 
              value={distanceFilter} 
              onChange={(e) => setDistanceFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Distances</option>
              <option value="nearby">Within 5km</option>
              <option value="close">Within 10km</option>
            </select>
          </div>
        </div>

        {/* Claims Grid */}
        <div className="claims-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading claims near you...</p>
            </div>
          ) : filteredClaims.length > 0 ? (
            <div className="claims-grid">
              {filteredClaims.map((claim) => (
                <div key={claim.id} className="claim-card">
                  <div className="claim-image">
                    {claim.images && claim.images.length > 0 ? (
                      <img src={claim.images[0]} alt="Land claim" />
                    ) : (
                      <div className="placeholder-image">
                        <FaMapMarkedAlt />
                        <span>No image</span>
                      </div>
                    )}
                    <div className="distance-badge">
                      <FaMapMarkerAlt /> {claim.distance} km
                    </div>
                  </div>

                  <div className="claim-content">
                    <div className="claim-header">
                      <h3 className="claim-location">
                        {claim.location || 'Location Not Specified'}
                      </h3>
                      {getStatusBadge(claim)}
                    </div>

                    <div className="claim-details">
                      <div className="detail-row">
                        <FaUser className="detail-icon" />
                        <span className="detail-label">Claimant:</span>
                        <span className="detail-value">{claim.claimant_name || authState?.user?.name || 'Unknown'}</span>
                      </div>
                      <div className="detail-row">
                        <FaRulerCombined className="detail-icon" />
                        <span className="detail-label">Size:</span>
                        <span className="detail-value">{claim.size || 'N/A'} acres</span>
                      </div>
                      <div className="detail-row">
                        <FaClock className="detail-icon" />
                        <span className="detail-label">Pending:</span>
                        <span className="detail-value">{claim.days_pending} days</span>
                      </div>
                    </div>

                    <div className="validation-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${(claim.validators_count / claim.required_validators) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {claim.validators_count} / {claim.required_validators} validators
                      </span>
                    </div>

                    <button 
                      onClick={() => handleValidateClaim(claim.id)}
                      className="validate-btn"
                      disabled={claim.status === 'validated'}
                    >
                      {claim.status === 'validated' ? 'Validated' : 'Validate Claim'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FaMapMarkedAlt className="empty-icon" />
              <h3>No claims found</h3>
              <p>
                {searchQuery || statusFilter !== 'pending' || distanceFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'There are no claims near you at the moment. Check back later!'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
