import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, LayersControl, useMap } from 'react-leaflet';
import { FaEye, FaEyeSlash, FaSearch, FaTimes } from 'react-icons/fa';
import AdminLayout from '../../layouts/AdminLayout';
import 'leaflet/dist/leaflet.css';
import './MasterGISMap.css';

// Fix Leaflet default marker icon
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MasterGISMap = () => {
  const [parcels, setParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState({
    verified: true,
    pending: true,
    disputed: true,
    underReview: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredParcels, setFilteredParcels] = useState([]);

  useEffect(() => {
    loadParcels();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = parcels.filter(parcel =>
        parcel.parcel_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parcel.claimant_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredParcels(filtered);
    } else {
      setFilteredParcels(parcels);
    }
  }, [searchQuery, parcels]);

  const loadParcels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/claims', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      // Filter claims with coordinates
      const parcelsWithCoords = data.filter(claim => 
        claim.coordinates && claim.coordinates.length > 0
      );
      
      setParcels(parcelsWithCoords);
      setFilteredParcels(parcelsWithCoords);
    } catch (error) {
      console.error('Error loading parcels:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = (layerName) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const getParcelColor = (status) => {
    const colors = {
      'approved': '#10b981',  // Green - Verified
      'pending': '#3b82f6',   // Blue - Pending
      'disputed': '#ef4444',  // Red - Disputed
      'under_review': '#8b5cf6' // Purple - Under Review
    };
    return colors[status] || '#6b7280';
  };

  const shouldShowParcel = (parcel) => {
    const statusLayerMap = {
      'approved': 'verified',
      'pending': 'pending',
      'disputed': 'disputed',
      'under_review': 'underReview'
    };
    
    const layerName = statusLayerMap[parcel.status];
    return layers[layerName];
  };

  const handleParcelClick = (parcel) => {
    setSelectedParcel(parcel);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Calculate center from all parcels
  const getMapCenter = () => {
    if (parcels.length === 0) return [-1.9403, 29.8739]; // Rwanda center
    
    const firstParcel = parcels[0];
    if (firstParcel.coordinates && firstParcel.coordinates.length > 0) {
      const firstCoord = firstParcel.coordinates[0];
      return [firstCoord.lat, firstCoord.lng];
    }
    return [-1.9403, 29.8739];
  };

  return (
    <AdminLayout>
      <div className="master-gis-map">
        {/* Page Header */}
        <div className="map-header">
          <div>
            <h1 className="page-title">Master GIS Map</h1>
            <p className="page-subtitle">Interactive Parcel Visualization</p>
          </div>

          {/* Search Bar */}
          <div className="map-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by Parcel ID or Owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={clearSearch}>
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        <div className="map-container-wrapper">
          {/* Layer Controls */}
          <div className="layer-controls">
            <h3 className="layer-title">Map Layers</h3>
            
            <div className="layer-item">
              <label className="layer-checkbox">
                <input
                  type="checkbox"
                  checked={layers.verified}
                  onChange={() => toggleLayer('verified')}
                />
                <span className="layer-icon verified-icon"></span>
                <span>Verified Parcels</span>
                <span className="layer-count">
                  {parcels.filter(p => p.status === 'approved').length}
                </span>
              </label>
            </div>

            <div className="layer-item">
              <label className="layer-checkbox">
                <input
                  type="checkbox"
                  checked={layers.pending}
                  onChange={() => toggleLayer('pending')}
                />
                <span className="layer-icon pending-icon"></span>
                <span>Pending Parcels</span>
                <span className="layer-count">
                  {parcels.filter(p => p.status === 'pending').length}
                </span>
              </label>
            </div>

            <div className="layer-item">
              <label className="layer-checkbox">
                <input
                  type="checkbox"
                  checked={layers.disputed}
                  onChange={() => toggleLayer('disputed')}
                />
                <span className="layer-icon disputed-icon"></span>
                <span>Disputed Zones</span>
                <span className="layer-count">
                  {parcels.filter(p => p.status === 'disputed').length}
                </span>
              </label>
            </div>

            <div className="layer-item">
              <label className="layer-checkbox">
                <input
                  type="checkbox"
                  checked={layers.underReview}
                  onChange={() => toggleLayer('underReview')}
                />
                <span className="layer-icon under-review-icon"></span>
                <span>Under Review</span>
                <span className="layer-count">
                  {parcels.filter(p => p.status === 'under_review').length}
                </span>
              </label>
            </div>

            <div className="layer-stats">
              <div className="stat-row">
                <span>Total Parcels:</span>
                <strong>{parcels.length}</strong>
              </div>
              <div className="stat-row">
                <span>Visible:</span>
                <strong>{filteredParcels.filter(shouldShowParcel).length}</strong>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="map-view">
            <MapContainer
              center={getMapCenter()}
              zoom={13}
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {filteredParcels
                .filter(shouldShowParcel)
                .map((parcel) => (
                  <Polygon
                    key={parcel._id}
                    positions={parcel.coordinates.map(coord => [coord.lat, coord.lng])}
                    pathOptions={{
                      color: getParcelColor(parcel.status),
                      fillColor: getParcelColor(parcel.status),
                      fillOpacity: 0.3,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => handleParcelClick(parcel)
                    }}
                  >
                    <Popup>
                      <div className="parcel-popup">
                        <h4>{parcel.parcel_id}</h4>
                        <p><strong>Owner:</strong> {parcel.claimant_name}</p>
                        <p><strong>Size:</strong> {parcel.land_size} sqm</p>
                        <p><strong>Status:</strong> <span className={`status-${parcel.status}`}>{parcel.status}</span></p>
                      </div>
                    </Popup>
                  </Polygon>
                ))}
            </MapContainer>
          </div>

          {/* Parcel Details Sidebar */}
          {selectedParcel && (
            <div className="parcel-details-sidebar">
              <div className="sidebar-header">
                <h3>Parcel Details</h3>
                <button 
                  className="close-sidebar"
                  onClick={() => setSelectedParcel(null)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="sidebar-content">
                <div className="detail-group">
                  <label>Parcel ID</label>
                  <div className="detail-value">{selectedParcel.parcel_id}</div>
                </div>

                <div className="detail-group">
                  <label>Owner</label>
                  <div className="detail-value">{selectedParcel.claimant_name}</div>
                </div>

                <div className="detail-group">
                  <label>National ID</label>
                  <div className="detail-value">{selectedParcel.national_id}</div>
                </div>

                <div className="detail-group">
                  <label>Land Size</label>
                  <div className="detail-value">{selectedParcel.land_size} sqm</div>
                </div>

                <div className="detail-group">
                  <label>Location</label>
                  <div className="detail-value">
                    {selectedParcel.province}, {selectedParcel.district}
                    <br />
                    {selectedParcel.sector}, {selectedParcel.cell}
                  </div>
                </div>

                <div className="detail-group">
                  <label>Status</label>
                  <div className="detail-value">
                    <span className={`status-badge status-${selectedParcel.status}`}>
                      {selectedParcel.status}
                    </span>
                  </div>
                </div>

                <div className="detail-group">
                  <label>Registered</label>
                  <div className="detail-value">
                    {new Date(selectedParcel.created_at).toLocaleDateString()}
                  </div>
                </div>

                <button className="view-full-record-btn">
                  View Full Record
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default MasterGISMap;
