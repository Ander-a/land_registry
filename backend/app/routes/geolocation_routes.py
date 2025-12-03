from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from pydantic import BaseModel, Field
import logging

from app.models.user import User
from app.models.claim import Claim
from app.routes.auth import get_current_user
from app.services.geolocation_service import GeolocationService

router = APIRouter(prefix="/geolocation", tags=["geolocation"])
logger = logging.getLogger(__name__)


# Pydantic models for requests/responses
class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")


class DistanceCalculationRequest(BaseModel):
    lat1: float = Field(..., ge=-90, le=90)
    lon1: float = Field(..., ge=-180, le=180)
    lat2: float = Field(..., ge=-90, le=90)
    lon2: float = Field(..., ge=-180, le=180)


class DistanceResponse(BaseModel):
    distance_km: float
    distance_m: float
    bearing: float
    direction: str
    formatted_distance: str
    context: str


class NearbyClaimResponse(BaseModel):
    claim_id: str
    location: str
    claimant_name: str
    status: str
    distance_km: float
    bearing: float
    direction: str
    tier: str
    formatted_distance: str
    context: str


class ClaimsStatisticsResponse(BaseModel):
    total: int
    by_tier: dict
    by_status: dict
    closest_distance: Optional[float]
    farthest_distance: Optional[float]
    average_distance: Optional[float]


class LocationVerificationResponse(BaseModel):
    valid: bool
    distance_km: Optional[float]
    reason: str
    weight: float
    tier: Optional[str] = None


@router.post("/calculate-distance", response_model=DistanceResponse)
async def calculate_distance(
    request: DistanceCalculationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate distance and bearing between two GPS coordinates.
    
    Uses Haversine formula for accurate distance calculation on Earth's surface.
    """
    try:
        geo_service = GeolocationService()
        
        distance_km = geo_service.calculate_distance(
            request.lat1, request.lon1, request.lat2, request.lon2
        )
        
        bearing = geo_service.calculate_bearing(
            request.lat1, request.lon1, request.lat2, request.lon2
        )
        
        direction = geo_service.get_cardinal_direction(bearing)
        formatted_distance = geo_service.format_distance(distance_km)
        context = geo_service.get_location_context(distance_km, direction)
        
        return DistanceResponse(
            distance_km=distance_km,
            distance_m=distance_km * 1000,
            bearing=bearing,
            direction=direction,
            formatted_distance=formatted_distance,
            context=context
        )
    
    except Exception as e:
        logger.error(f"Error calculating distance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating distance: {str(e)}"
        )


@router.get("/nearby-claims", response_model=List[NearbyClaimResponse])
async def get_nearby_claims(
    latitude: float = Query(..., ge=-90, le=90, description="User's latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="User's longitude"),
    radius_km: float = Query(10.0, gt=0, le=100, description="Search radius in kilometers"),
    status_filter: Optional[str] = Query(None, description="Filter by claim status"),
    tier: Optional[str] = Query(None, description="Filter by distance tier"),
    limit: int = Query(50, gt=0, le=200, description="Maximum results"),
    current_user: User = Depends(get_current_user)
):
    """
    Get all claims within a specified radius of the user's location.
    
    Distance tiers:
    - very_close: ≤5km
    - close: ≤10km
    - nearby: ≤25km
    - regional: ≤50km
    - far: >50km
    """
    try:
        geo_service = GeolocationService()
        
        # Get nearby claims
        if tier:
            nearby_claims = await geo_service.get_claims_by_tier(
                latitude, longitude, tier, status_filter
            )
        else:
            nearby_claims = await geo_service.get_nearby_claims(
                latitude, longitude, radius_km, status_filter, limit
            )
        
        # Format response
        response = []
        for item in nearby_claims:
            formatted_distance = geo_service.format_distance(item['distance_km'])
            context = geo_service.get_location_context(
                item['distance_km'], 
                item['direction']
            )
            
            response.append(NearbyClaimResponse(
                claim_id=item['claim_id'],
                location=item['location'],
                claimant_name=item['claimant_name'],
                status=item['status'],
                distance_km=item['distance_km'],
                bearing=item['bearing'],
                direction=item['direction'],
                tier=item['tier'],
                formatted_distance=formatted_distance,
                context=context
            ))
        
        logger.info(f"Found {len(response)} claims within {radius_km}km for user {current_user.id}")
        return response
    
    except Exception as e:
        logger.error(f"Error finding nearby claims: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error finding nearby claims: {str(e)}"
        )


@router.get("/claims-statistics", response_model=ClaimsStatisticsResponse)
async def get_claims_statistics(
    latitude: float = Query(..., ge=-90, le=90, description="User's latitude"),
    longitude: float = Query(..., ge=-180, le=180, description="User's longitude"),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistical summary of claims around a user's location.
    
    Provides breakdowns by distance tier and claim status.
    """
    try:
        geo_service = GeolocationService()
        
        stats = await geo_service.get_claims_statistics(latitude, longitude)
        
        return ClaimsStatisticsResponse(**stats)
    
    except Exception as e:
        logger.error(f"Error getting claims statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting statistics: {str(e)}"
        )


@router.post("/verify-validator-location", response_model=LocationVerificationResponse)
async def verify_validator_location(
    claim_id: str,
    validator_location: LocationRequest,
    max_distance_km: Optional[float] = Query(None, description="Maximum acceptable distance"),
    current_user: User = Depends(get_current_user)
):
    """
    Verify that a validator is within acceptable distance to validate a claim.
    
    Returns validation status, distance, and calculated weight.
    """
    try:
        geo_service = GeolocationService()
        
        # Check if claim exists
        claim = await Claim.get(claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        # Verify location
        result = await geo_service.verify_validator_location(
            validator_location={"lat": validator_location.latitude, "lon": validator_location.longitude},
            claim_id=claim_id,
            max_distance_km=max_distance_km
        )
        
        return LocationVerificationResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying validator location: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying location: {str(e)}"
        )


@router.get("/validator-distance/{claim_id}", response_model=DistanceResponse)
async def get_validator_distance_to_claim(
    claim_id: str,
    validator_location: Optional[LocationRequest] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate distance from current validator to a specific claim.
    
    If validator_location not provided, uses stored location from user profile.
    """
    try:
        geo_service = GeolocationService()
        
        # Check if claim exists
        claim = await Claim.get(claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        # Get claim coordinates
        if hasattr(claim, 'coordinates') and claim.coordinates:
            claim_lat = claim.coordinates.get('lat')
            claim_lon = claim.coordinates.get('lon')
        elif hasattr(claim, 'geolocation') and claim.geolocation:
            claim_lat = claim.geolocation.get('latitude')
            claim_lon = claim.geolocation.get('longitude')
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Claim has no coordinates"
            )
        
        # Get validator location
        if validator_location:
            val_lat = validator_location.latitude
            val_lon = validator_location.longitude
        else:
            # Try to get from user profile
            if not hasattr(current_user, 'location') or not current_user.location:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Validator location not provided and not stored in profile"
                )
            val_lat = current_user.location.get('lat')
            val_lon = current_user.location.get('lon')
        
        # Calculate distance
        distance_km = geo_service.calculate_distance(
            val_lat, val_lon, claim_lat, claim_lon
        )
        
        bearing = geo_service.calculate_bearing(
            val_lat, val_lon, claim_lat, claim_lon
        )
        
        direction = geo_service.get_cardinal_direction(bearing)
        formatted_distance = geo_service.format_distance(distance_km)
        context = geo_service.get_location_context(distance_km, direction)
        
        return DistanceResponse(
            distance_km=distance_km,
            distance_m=distance_km * 1000,
            bearing=bearing,
            direction=direction,
            formatted_distance=formatted_distance,
            context=context
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating validator distance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating distance: {str(e)}"
        )


@router.get("/distance-weight")
async def calculate_distance_weight(
    distance_km: float = Query(..., gt=0, description="Distance in kilometers"),
    weight_scheme: str = Query("standard", description="Weighting scheme: standard, strict, or lenient"),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate distance-based weight multiplier for validator votes.
    
    Weight schemes:
    - standard: Balanced weighting (default)
    - strict: Heavily favors local validators
    - lenient: More accepting of distant validators
    """
    try:
        geo_service = GeolocationService()
        
        weight = geo_service.calculate_distance_weight(distance_km, weight_scheme)
        
        tier = geo_service._get_distance_tier(distance_km)
        formatted = geo_service.format_distance(distance_km)
        
        return {
            "distance_km": distance_km,
            "formatted_distance": formatted,
            "weight": weight,
            "tier": tier,
            "weight_scheme": weight_scheme,
            "description": f"Validator at {formatted} gets {weight}x weight multiplier"
        }
    
    except Exception as e:
        logger.error(f"Error calculating distance weight: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating weight: {str(e)}"
        )


@router.get("/check-radius")
async def check_if_within_radius(
    lat1: float = Query(..., ge=-90, le=90),
    lon1: float = Query(..., ge=-180, le=180),
    lat2: float = Query(..., ge=-90, le=90),
    lon2: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(..., gt=0),
    current_user: User = Depends(get_current_user)
):
    """
    Check if two points are within a specified radius.
    
    Useful for validating if a validator is close enough to validate a claim.
    """
    try:
        geo_service = GeolocationService()
        
        is_within = geo_service.is_within_radius(lat1, lon1, lat2, lon2, radius_km)
        distance = geo_service.calculate_distance(lat1, lon1, lat2, lon2)
        
        return {
            "within_radius": is_within,
            "radius_km": radius_km,
            "actual_distance_km": distance,
            "formatted_distance": geo_service.format_distance(distance),
            "difference_km": abs(distance - radius_km) if not is_within else 0
        }
    
    except Exception as e:
        logger.error(f"Error checking radius: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking radius: {str(e)}"
        )
