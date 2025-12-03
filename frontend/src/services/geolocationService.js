import axios from 'axios'

const API_URL = 'http://localhost:8000'

class GeolocationService {
  constructor() {
    this.currentPosition = null
  }

  /**
   * Get user's current GPS position using browser Geolocation API
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          resolve(this.currentPosition)
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location'
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.'
              break
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.'
              break
          }
          
          reject(new Error(errorMessage))
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // Cache for 5 minutes
        }
      )
    })
  }

  /**
   * Calculate distance between two points
   */
  async calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_URL}/geolocation/calculate-distance`,
        { lat1, lon1, lat2, lon2 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    } catch (error) {
      console.error('Error calculating distance:', error)
      throw error
    }
  }

  /**
   * Get nearby claims within a radius
   */
  async getNearByClaims(latitude, longitude, options = {}) {
    try {
      const token = localStorage.getItem('token')
      const params = {
        latitude,
        longitude,
        radius_km: options.radius_km || 10,
        ...(options.status_filter && { status_filter: options.status_filter }),
        ...(options.tier && { tier: options.tier }),
        limit: options.limit || 50
      }

      const response = await axios.get(
        `${API_URL}/geolocation/nearby-claims`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching nearby claims:', error)
      throw error
    }
  }

  /**
   * Get claims by distance tier
   */
  async getClaimsByTier(latitude, longitude, tier, statusFilter = null) {
    return this.getNearByClaims(latitude, longitude, {
      tier,
      status_filter: statusFilter
    })
  }

  /**
   * Get claims statistics for a location
   */
  async getClaimsStatistics(latitude, longitude) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${API_URL}/geolocation/claims-statistics`,
        {
          params: { latitude, longitude },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error fetching claims statistics:', error)
      throw error
    }
  }

  /**
   * Verify validator location for a claim
   */
  async verifyValidatorLocation(claimId, latitude, longitude, maxDistanceKm = null) {
    try {
      const token = localStorage.getItem('token')
      const params = {
        claim_id: claimId,
        ...(maxDistanceKm && { max_distance_km: maxDistanceKm })
      }

      const response = await axios.post(
        `${API_URL}/geolocation/verify-validator-location`,
        { latitude, longitude },
        {
          params,
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error verifying validator location:', error)
      throw error
    }
  }

  /**
   * Get distance from validator to claim
   */
  async getValidatorDistanceToClaim(claimId, validatorLocation = null) {
    try {
      const token = localStorage.getItem('token')
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      if (validatorLocation) {
        config.data = validatorLocation
      }

      const response = await axios.get(
        `${API_URL}/geolocation/validator-distance/${claimId}`,
        config
      )
      return response.data
    } catch (error) {
      console.error('Error getting validator distance:', error)
      throw error
    }
  }

  /**
   * Calculate distance weight for validation
   */
  async getDistanceWeight(distanceKm, weightScheme = 'standard') {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${API_URL}/geolocation/distance-weight`,
        {
          params: {
            distance_km: distanceKm,
            weight_scheme: weightScheme
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error calculating distance weight:', error)
      throw error
    }
  }

  /**
   * Check if two points are within a radius
   */
  async checkWithinRadius(lat1, lon1, lat2, lon2, radiusKm) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `${API_URL}/geolocation/check-radius`,
        {
          params: { lat1, lon1, lat2, lon2, radius_km: radiusKm },
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    } catch (error) {
      console.error('Error checking radius:', error)
      throw error
    }
  }

  /**
   * Client-side Haversine calculation (for offline use)
   */
  calculateDistanceOffline(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in kilometers
    
    const toRad = (value) => (value * Math.PI) / 180
    
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    return Math.round(distance * 100) / 100
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`
    }
    return `${distanceKm.toFixed(1)} km`
  }

  /**
   * Get distance tier label
   */
  getDistanceTierLabel(tier) {
    const labels = {
      very_close: 'Very Close (≤5km)',
      close: 'Close (≤10km)',
      nearby: 'Nearby (≤25km)',
      regional: 'Regional (≤50km)',
      far: 'Far (>50km)'
    }
    return labels[tier] || tier
  }

  /**
   * Get distance tier color
   */
  getDistanceTierColor(tier) {
    const colors = {
      very_close: '#10b981',
      close: '#3b82f6',
      nearby: '#f59e0b',
      regional: '#ef4444',
      far: '#6b7280'
    }
    return colors[tier] || '#6b7280'
  }

  /**
   * Request location permission
   */
  async requestLocationPermission() {
    try {
      await this.getCurrentPosition()
      return true
    } catch (error) {
      console.error('Location permission denied:', error)
      return false
    }
  }

  /**
   * Check if location services are available
   */
  isLocationAvailable() {
    return 'geolocation' in navigator
  }

  /**
   * Watch position (for real-time tracking)
   */
  watchPosition(onSuccess, onError) {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation not supported'))
      return null
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }
        onSuccess(this.currentPosition)
      },
      onError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )

    return watchId
  }

  /**
   * Stop watching position
   */
  clearWatch(watchId) {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId)
    }
  }

  /**
   * Get cached position (if available)
   */
  getCachedPosition() {
    return this.currentPosition
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearingOffline(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180
    const toDeg = (value) => (value * 180) / Math.PI

    const dLon = toRad(lon2 - lon1)
    const y = Math.sin(dLon) * Math.cos(toRad(lat2))
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon)

    let bearing = toDeg(Math.atan2(y, x))
    bearing = (bearing + 360) % 360

    return Math.round(bearing * 100) / 100
  }

  /**
   * Get cardinal direction from bearing
   */
  getCardinalDirection(bearing) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(bearing / 45) % 8
    return directions[index]
  }

  /**
   * Get location context string
   */
  getLocationContext(distanceKm, direction) {
    const formattedDistance = this.formatDistance(distanceKm)
    const directionMap = {
      N: 'north',
      NE: 'northeast',
      E: 'east',
      SE: 'southeast',
      S: 'south',
      SW: 'southwest',
      W: 'west',
      NW: 'northwest'
    }
    const directionText = directionMap[direction] || direction.toLowerCase()
    return `${formattedDistance} to the ${directionText}`
  }
}

export default new GeolocationService()
