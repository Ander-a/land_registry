from typing import List, Optional, Tuple, Dict
from math import radians, sin, cos, sqrt, atan2, degrees, asin
import logging

from app.models.claim import Claim
from app.models.user import User

logger = logging.getLogger(__name__)


class GeolocationService:
    """
    Service for geolocation-based operations in the land registry system.
    
    Features:
    - Distance calculations using Haversine formula
    - Nearby claims filtering by radius
    - Distance-based validator weighting
    - Location verification for validators
    - Geographical search and filtering
    """
    
    # Earth's radius in kilometers
    EARTH_RADIUS_KM = 6371.0
    
    # Default search radii in kilometers
    DEFAULT_RADIUS_KM = 10.0
    MAX_SEARCH_RADIUS_KM = 100.0
    
    # Distance tiers for filtering
    TIER_VERY_CLOSE = 5.0    # Within 5km
    TIER_CLOSE = 10.0         # Within 10km
    TIER_NEARBY = 25.0        # Within 25km
    TIER_REGIONAL = 50.0      # Within 50km
    
    def __init__(self):
        pass
    
    @staticmethod
    def calculate_distance(
        lat1: float, 
        lon1: float, 
        lat2: float, 
        lon2: float
    ) -> float:
        """
        Calculate distance between two GPS coordinates using Haversine formula.
        
        Args:
            lat1: Latitude of first point (degrees)
            lon1: Longitude of first point (degrees)
            lat2: Latitude of second point (degrees)
            lon2: Longitude of second point (degrees)
        
        Returns:
            Distance in kilometers (float)
        
        Example:
            distance = calculate_distance(-1.2921, 36.8219, -1.3000, 36.8300)
            # Returns: ~1.2 km
        """
        # Convert degrees to radians
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        # Haversine formula
        a = sin(delta_lat / 2) ** 2 + \
            cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        distance = GeolocationService.EARTH_RADIUS_KM * c
        return round(distance, 2)
    
    @staticmethod
    def calculate_bearing(
        lat1: float, 
        lon1: float, 
        lat2: float, 
        lon2: float
    ) -> float:
        """
        Calculate bearing (direction) from point 1 to point 2.
        
        Returns:
            Bearing in degrees (0-360), where 0=North, 90=East, 180=South, 270=West
        """
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lon = radians(lon2 - lon1)
        
        x = sin(delta_lon) * cos(lat2_rad)
        y = cos(lat1_rad) * sin(lat2_rad) - \
            sin(lat1_rad) * cos(lat2_rad) * cos(delta_lon)
        
        bearing_rad = atan2(x, y)
        bearing_deg = (degrees(bearing_rad) + 360) % 360
        
        return round(bearing_deg, 2)
    
    @staticmethod
    def get_cardinal_direction(bearing: float) -> str:
        """
        Convert bearing to cardinal direction (N, NE, E, SE, S, SW, W, NW).
        
        Args:
            bearing: Bearing in degrees (0-360)
        
        Returns:
            Cardinal direction string
        """
        directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
        index = int((bearing + 22.5) // 45) % 8
        return directions[index]
    
    @staticmethod
    def is_within_radius(
        lat1: float, 
        lon1: float, 
        lat2: float, 
        lon2: float, 
        radius_km: float
    ) -> bool:
        """
        Check if two points are within a specified radius.
        
        Args:
            lat1, lon1: First point coordinates
            lat2, lon2: Second point coordinates
            radius_km: Maximum distance in kilometers
        
        Returns:
            True if points are within radius, False otherwise
        """
        distance = GeolocationService.calculate_distance(lat1, lon1, lat2, lon2)
        return distance <= radius_km
    
    async def get_nearby_claims(
        self,
        user_lat: float,
        user_lon: float,
        radius_km: float = DEFAULT_RADIUS_KM,
        status_filter: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Find all claims within a specified radius of a user's location.
        
        Args:
            user_lat: User's latitude
            user_lon: User's longitude
            radius_km: Search radius in kilometers (default 10km)
            status_filter: Optional status filter (pending, validated, rejected)
            limit: Maximum number of results to return
        
        Returns:
            List of claims with distance and bearing information
        """
        try:
            # Validate radius
            if radius_km > self.MAX_SEARCH_RADIUS_KM:
                logger.warning(f"Search radius {radius_km}km exceeds max, using {self.MAX_SEARCH_RADIUS_KM}km")
                radius_km = self.MAX_SEARCH_RADIUS_KM
            
            # Build query
            query = {}
            if status_filter:
                query['status'] = status_filter
            
            # Get all claims (we'll filter by distance in Python)
            # Note: For production with millions of claims, use MongoDB geospatial queries
            all_claims = await Claim.find(query).to_list()
            
            nearby_claims = []
            
            for claim in all_claims:
                # Get claim coordinates
                claim_lat, claim_lon = self._extract_coordinates(claim)
                
                if claim_lat is None or claim_lon is None:
                    continue
                
                # Calculate distance
                distance = self.calculate_distance(
                    user_lat, user_lon, claim_lat, claim_lon
                )
                
                # Filter by radius
                if distance <= radius_km:
                    # Calculate bearing and direction
                    bearing = self.calculate_bearing(
                        user_lat, user_lon, claim_lat, claim_lon
                    )
                    direction = self.get_cardinal_direction(bearing)
                    
                    # Get distance tier
                    tier = self._get_distance_tier(distance)
                    
                    nearby_claims.append({
                        'claim': claim,
                        'distance_km': distance,
                        'bearing': bearing,
                        'direction': direction,
                        'tier': tier,
                        'claim_id': str(claim.id),
                        'location': claim.location or f"{claim_lat}, {claim_lon}",
                        'status': claim.status,
                        'claimant_name': claim.claimant_name
                    })
            
            # Sort by distance (closest first)
            nearby_claims.sort(key=lambda x: x['distance_km'])
            
            # Apply limit
            nearby_claims = nearby_claims[:limit]
            
            logger.info(f"Found {len(nearby_claims)} claims within {radius_km}km")
            return nearby_claims
        
        except Exception as e:
            logger.error(f"Error finding nearby claims: {e}")
            return []
    
    def _extract_coordinates(self, claim: Claim) -> Tuple[Optional[float], Optional[float]]:
        """
        Extract latitude and longitude from a claim document.
        
        Tries multiple fields for backward compatibility:
        - coordinates dict (new format)
        - geolocation dict (old format)
        """
        try:
            # Try new format: coordinates.lat, coordinates.lon
            if hasattr(claim, 'coordinates') and claim.coordinates:
                lat = claim.coordinates.get('lat')
                lon = claim.coordinates.get('lon')
                if lat is not None and lon is not None:
                    return float(lat), float(lon)
            
            # Try old format: geolocation.latitude, geolocation.longitude
            if hasattr(claim, 'geolocation') and claim.geolocation:
                lat = claim.geolocation.get('latitude')
                lon = claim.geolocation.get('longitude')
                if lat is not None and lon is not None:
                    return float(lat), float(lon)
            
            return None, None
        
        except Exception as e:
            logger.warning(f"Error extracting coordinates from claim: {e}")
            return None, None
    
    def _get_distance_tier(self, distance_km: float) -> str:
        """
        Categorize distance into tiers for UI display.
        
        Returns:
            Tier string: very_close, close, nearby, regional, far
        """
        if distance_km <= self.TIER_VERY_CLOSE:
            return "very_close"
        elif distance_km <= self.TIER_CLOSE:
            return "close"
        elif distance_km <= self.TIER_NEARBY:
            return "nearby"
        elif distance_km <= self.TIER_REGIONAL:
            return "regional"
        else:
            return "far"
    
    async def get_claims_by_tier(
        self,
        user_lat: float,
        user_lon: float,
        tier: str = "close",
        status_filter: Optional[str] = None
    ) -> List[Dict]:
        """
        Get claims within a specific distance tier.
        
        Args:
            user_lat: User's latitude
            user_lon: User's longitude
            tier: Distance tier (very_close, close, nearby, regional)
            status_filter: Optional status filter
        
        Returns:
            List of claims within the specified tier
        """
        tier_radius = {
            "very_close": self.TIER_VERY_CLOSE,
            "close": self.TIER_CLOSE,
            "nearby": self.TIER_NEARBY,
            "regional": self.TIER_REGIONAL,
            "far": self.MAX_SEARCH_RADIUS_KM
        }
        
        radius = tier_radius.get(tier, self.DEFAULT_RADIUS_KM)
        
        return await self.get_nearby_claims(
            user_lat, user_lon, radius, status_filter
        )
    
    async def get_validator_distance_to_claim(
        self,
        validator_id: str,
        claim_id: str,
        validator_location: Optional[Dict] = None
    ) -> Optional[float]:
        """
        Calculate distance from a validator to a specific claim.
        
        Args:
            validator_id: ID of the validator
            claim_id: ID of the claim
            validator_location: Optional dict with lat/lon, otherwise uses user's stored location
        
        Returns:
            Distance in kilometers, or None if coordinates unavailable
        """
        try:
            # Get claim
            claim = await Claim.get(claim_id)
            if not claim:
                logger.warning(f"Claim {claim_id} not found")
                return None
            
            claim_lat, claim_lon = self._extract_coordinates(claim)
            if claim_lat is None or claim_lon is None:
                logger.warning(f"Claim {claim_id} has no coordinates")
                return None
            
            # Get validator location
            if validator_location:
                val_lat = validator_location.get('lat')
                val_lon = validator_location.get('lon')
            else:
                # Try to get from user profile (if stored)
                user = await User.get(validator_id)
                if not user or not hasattr(user, 'location'):
                    logger.warning(f"Validator {validator_id} has no location")
                    return None
                val_lat = user.location.get('lat')
                val_lon = user.location.get('lon')
            
            if val_lat is None or val_lon is None:
                return None
            
            distance = self.calculate_distance(
                float(val_lat), float(val_lon),
                claim_lat, claim_lon
            )
            
            return distance
        
        except Exception as e:
            logger.error(f"Error calculating validator distance: {e}")
            return None
    
    def calculate_distance_weight(
        self,
        distance_km: float,
        weight_scheme: str = "standard"
    ) -> float:
        """
        Calculate a weight multiplier based on distance.
        
        Args:
            distance_km: Distance in kilometers
            weight_scheme: Weighting scheme to use (standard, strict, lenient)
        
        Returns:
            Weight multiplier (0.5 to 1.5)
        
        Weight Schemes:
        - standard: Balanced weighting
        - strict: Heavily favors local validators
        - lenient: More accepting of distant validators
        """
        if weight_scheme == "strict":
            # Strict scheme: Strong preference for local knowledge
            if distance_km <= 2:
                return 2.0
            elif distance_km <= 5:
                return 1.5
            elif distance_km <= 10:
                return 1.0
            elif distance_km <= 25:
                return 0.5
            else:
                return 0.25
        
        elif weight_scheme == "lenient":
            # Lenient scheme: More accepting of distant validators
            if distance_km <= 10:
                return 1.5
            elif distance_km <= 25:
                return 1.25
            elif distance_km <= 50:
                return 1.0
            else:
                return 0.75
        
        else:
            # Standard scheme (default)
            if distance_km <= 5:
                return 1.5
            elif distance_km <= 10:
                return 1.25
            elif distance_km <= 25:
                return 1.0
            elif distance_km <= 50:
                return 0.75
            else:
                return 0.5
    
    async def verify_validator_location(
        self,
        validator_location: Dict,
        claim_id: str,
        max_distance_km: Optional[float] = None
    ) -> Dict:
        """
        Verify that a validator is within acceptable distance to validate a claim.
        
        Args:
            validator_location: Dict with lat/lon
            claim_id: ID of the claim
            max_distance_km: Optional maximum acceptable distance (default: no limit)
        
        Returns:
            Dict with verification result:
            {
                'valid': bool,
                'distance_km': float,
                'reason': str,
                'weight': float
            }
        """
        try:
            # Calculate distance
            distance = await self.get_validator_distance_to_claim(
                validator_id=None,  # Not needed for this check
                claim_id=claim_id,
                validator_location=validator_location
            )
            
            if distance is None:
                return {
                    'valid': False,
                    'distance_km': None,
                    'reason': 'Unable to determine distance (missing coordinates)',
                    'weight': 0.0
                }
            
            # Check max distance if specified
            if max_distance_km and distance > max_distance_km:
                return {
                    'valid': False,
                    'distance_km': distance,
                    'reason': f'Validator too far from claim ({distance}km > {max_distance_km}km limit)',
                    'weight': 0.0
                }
            
            # Calculate weight
            weight = self.calculate_distance_weight(distance)
            
            return {
                'valid': True,
                'distance_km': distance,
                'reason': 'Location verified',
                'weight': weight,
                'tier': self._get_distance_tier(distance)
            }
        
        except Exception as e:
            logger.error(f"Error verifying validator location: {e}")
            return {
                'valid': False,
                'distance_km': None,
                'reason': f'Error: {str(e)}',
                'weight': 0.0
            }
    
    async def get_claims_statistics(
        self,
        user_lat: float,
        user_lon: float
    ) -> Dict:
        """
        Get statistical summary of claims around a location.
        
        Returns:
            Dict with statistics by distance tier
        """
        try:
            all_nearby = await self.get_nearby_claims(
                user_lat, user_lon, 
                radius_km=self.MAX_SEARCH_RADIUS_KM,
                limit=1000
            )
            
            stats = {
                'total': len(all_nearby),
                'by_tier': {
                    'very_close': 0,
                    'close': 0,
                    'nearby': 0,
                    'regional': 0,
                    'far': 0
                },
                'by_status': {
                    'pending': 0,
                    'validated': 0,
                    'rejected': 0,
                    'under_review': 0
                },
                'closest_distance': None,
                'farthest_distance': None,
                'average_distance': None
            }
            
            if not all_nearby:
                return stats
            
            distances = []
            
            for item in all_nearby:
                # Count by tier
                tier = item['tier']
                stats['by_tier'][tier] = stats['by_tier'].get(tier, 0) + 1
                
                # Count by status
                status = item['status']
                stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
                
                # Track distances
                distances.append(item['distance_km'])
            
            stats['closest_distance'] = min(distances)
            stats['farthest_distance'] = max(distances)
            stats['average_distance'] = round(sum(distances) / len(distances), 2)
            
            return stats
        
        except Exception as e:
            logger.error(f"Error calculating claims statistics: {e}")
            return {}
    
    def format_distance(self, distance_km: float) -> str:
        """
        Format distance for human-readable display.
        
        Returns:
            Formatted string like "1.2 km" or "250 m"
        """
        if distance_km < 1:
            meters = int(distance_km * 1000)
            return f"{meters} m"
        else:
            return f"{distance_km:.1f} km"
    
    def get_location_context(self, distance_km: float, direction: str) -> str:
        """
        Generate human-readable location context.
        
        Example: "1.2 km to the north"
        """
        formatted_distance = self.format_distance(distance_km)
        direction_map = {
            'N': 'north',
            'NE': 'northeast',
            'E': 'east',
            'SE': 'southeast',
            'S': 'south',
            'SW': 'southwest',
            'W': 'west',
            'NW': 'northwest'
        }
        direction_text = direction_map.get(direction, direction.lower())
        
        return f"{formatted_distance} to the {direction_text}"
