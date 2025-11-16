from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form, Depends
from typing import List
import json

from ..models.claim import Claim
from ..models.user import User
from ..schemas.claim import ClaimCreate, ClaimRead, GeoJSONPolygon, GeoLocation
from ..utils.storage import save_upload_file, get_file_path
from ..utils.geotag import extract_geolocation
from ..auth.auth import JWTBearer

router = APIRouter(prefix="/claims", tags=["claims"])

@router.post("/", response_model=ClaimRead, status_code=status.HTTP_201_CREATED)
async def create_claim(
    photo: UploadFile = File(...),
    boundary: str = Form(...),
    current_user: User = Depends(JWTBearer())
):
    """
    Submit a new land claim with photo and boundary.
    
    - **photo**: Image file with GPS EXIF data
    - **boundary**: GeoJSON polygon as JSON string
    - **current_user**: Authenticated user from JWT
    """
    # Parse boundary JSON
    try:
        boundary_data = json.loads(boundary)
        boundary_obj = GeoJSONPolygon(**boundary_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid boundary format: {str(e)}"
        )
    
    # Validate boundary is not empty
    if not boundary_obj.coordinates or len(boundary_obj.coordinates[0]) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Boundary must have at least 3 points"
        )
    
    # Save uploaded photo
    photo_path = await save_upload_file(photo)
    
    # Extract geolocation from photo
    file_full_path = get_file_path(photo_path)
    geolocation = extract_geolocation(str(file_full_path))
    
    if not geolocation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No GPS data found in image EXIF. Please upload a geotagged photo."
        )
    
    # Create claim document
    claim = Claim(
        user_id=str(current_user.id),
        photo_url=photo_path,
        geolocation=geolocation,
        boundary=boundary_obj.model_dump(),
        status="pending"
    )
    
    await claim.insert()
    
    # Return response
    return ClaimRead(
        id=str(claim.id),
        user_id=claim.user_id,
        photo_url=claim.photo_url,
        geolocation=GeoLocation(**claim.geolocation),
        boundary=GeoJSONPolygon(**claim.boundary),
        status=claim.status,
        created_at=claim.created_at
    )

@router.get("/{claim_id}", response_model=ClaimRead)
async def get_claim(claim_id: str):
    """Fetch a single claim by ID."""
    from bson import ObjectId
    
    try:
        claim = await Claim.get(ObjectId(claim_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid claim ID format"
        )
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    return ClaimRead(
        id=str(claim.id),
        user_id=claim.user_id,
        photo_url=claim.photo_url,
        geolocation=GeoLocation(**claim.geolocation),
        boundary=GeoJSONPolygon(**claim.boundary),
        status=claim.status,
        created_at=claim.created_at
    )

@router.get("/user/{user_id}", response_model=List[ClaimRead])
async def get_user_claims(user_id: str, current_user: User = Depends(JWTBearer())):
    """List all claims by a specific user."""
    # Ensure user can only access their own claims (or add admin check)
    if str(current_user.id) != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own claims"
        )
    
    claims = await Claim.find(Claim.user_id == user_id).to_list()
    
    return [
        ClaimRead(
            id=str(claim.id),
            user_id=claim.user_id,
            photo_url=claim.photo_url,
            geolocation=GeoLocation(**claim.geolocation),
            boundary=GeoJSONPolygon(**claim.boundary),
            status=claim.status,
            created_at=claim.created_at
        )
        for claim in claims
    ]

@router.get("/", response_model=List[ClaimRead])
async def get_all_claims(current_user: User = Depends(JWTBearer())):
    """Get all claims for the authenticated user."""
    claims = await Claim.find(Claim.user_id == str(current_user.id)).to_list()
    
    return [
        ClaimRead(
            id=str(claim.id),
            user_id=claim.user_id,
            photo_url=claim.photo_url,
            geolocation=GeoLocation(**claim.geolocation),
            boundary=GeoJSONPolygon(**claim.boundary),
            status=claim.status,
            created_at=claim.created_at
        )
        for claim in claims
    ]
