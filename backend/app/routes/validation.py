from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from bson import ObjectId

from ..models.user import User
from ..models.claim import Claim
from ..models.validation import Validation
from ..schemas.validation import ValidationCreate, ValidationRead, ValidationResponse
from ..auth.auth import JWTBearer

router = APIRouter(prefix="/validation", tags=["validation"])

def require_citizen(current_user: User = Depends(JWTBearer())) -> User:
    """Dependency to ensure user is a citizen."""
    if current_user.role not in ["citizen", "leader"]:  # Leaders can also witness
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can witness claims"
        )
    return current_user

def require_leader(current_user: User = Depends(JWTBearer())) -> User:
    """Dependency to ensure user is a leader."""
    if current_user.role != "leader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only leaders can endorse claims"
        )
    return current_user

@router.post("/witness", response_model=ValidationResponse)
async def witness_claim(
    validation_data: ValidationCreate,
    current_user: User = Depends(require_citizen)
):
    """
    Submit witness endorsement for a land claim.
    
    Business Rules:
    - A citizen can only witness a claim once
    - Status becomes "partially_validated" when witness_count >= 2
    - Cannot witness own claims
    
    Args:
        validation_data: Validation details (claim_id, status, comment)
        current_user: Authenticated user (citizen or leader)
    
    Returns:
        ValidationResponse with updated claim status
    """
    # Validate claim exists
    try:
        claim = await Claim.get(ObjectId(validation_data.claim_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid claim ID"
        )
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Rule: Cannot witness own claim
    if claim.user_id == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot witness your own claim"
        )
    
    # Rule: Check for duplicate witness
    existing_validation = await Validation.find_one(
        Validation.claim_id == validation_data.claim_id,
        Validation.validator_id == str(current_user.id),
        Validation.validator_role == "witness"
    )
    
    if existing_validation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already witnessed this claim"
        )
    
    # Create validation record
    validation = Validation(
        claim_id=validation_data.claim_id,
        validator_id=str(current_user.id),
        validator_role="witness",
        status=validation_data.status,
        comment=validation_data.comment
    )
    await validation.insert()
    
    # Update claim witness count
    if validation_data.status == "approved":
        claim.witness_count += 1
        
        # Rule: Set to partially_validated when witness_count >= 2
        if claim.witness_count >= 2:
            claim.validation_status = "partially_validated"
        
        await claim.save()
    
    return ValidationResponse(
        success=True,
        message=f"Claim witnessed successfully. Total witnesses: {claim.witness_count}",
        validation_id=str(validation.id),
        claim_validation_status=claim.validation_status,
        witness_count=claim.witness_count,
        endorsed_by_leader=claim.endorsed_by_leader
    )

@router.post("/leader", response_model=ValidationResponse)
async def leader_endorse_claim(
    validation_data: ValidationCreate,
    current_user: User = Depends(require_leader)
):
    """
    Leader endorsement for a land claim.
    
    Business Rules:
    - Only leaders can endorse
    - Claim must have at least 2 witnesses before leader endorsement
    - Sets validation_status to "fully_validated"
    - Sets endorsed_by_leader to true
    - Updates main claim status to "validated"
    
    Args:
        validation_data: Validation details (claim_id, status, comment)
        current_user: Authenticated leader user
    
    Returns:
        ValidationResponse with updated claim status
    """
    # Validate claim exists
    try:
        claim = await Claim.get(ObjectId(validation_data.claim_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid claim ID"
        )
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Rule: Leader can only endorse after at least 2 witnesses
    if claim.witness_count < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Claim must have at least 2 witnesses before leader endorsement. Current: {claim.witness_count}"
        )
    
    # Rule: Check for duplicate leader endorsement
    existing_endorsement = await Validation.find_one(
        Validation.claim_id == validation_data.claim_id,
        Validation.validator_id == str(current_user.id),
        Validation.validator_role == "leader"
    )
    
    if existing_endorsement:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already endorsed this claim"
        )
    
    # Create validation record
    validation = Validation(
        claim_id=validation_data.claim_id,
        validator_id=str(current_user.id),
        validator_role="leader",
        status=validation_data.status,
        comment=validation_data.comment
    )
    await validation.insert()
    
    # Update claim status
    if validation_data.status == "approved":
        claim.endorsed_by_leader = True
        claim.validation_status = "fully_validated"
        claim.status = "validated"  # Update main status
        await claim.save()
    
    return ValidationResponse(
        success=True,
        message="Claim endorsed by leader successfully. Claim is now fully validated.",
        validation_id=str(validation.id),
        claim_validation_status=claim.validation_status,
        witness_count=claim.witness_count,
        endorsed_by_leader=claim.endorsed_by_leader
    )

@router.get("/claim/{claim_id}", response_model=List[ValidationRead])
async def get_claim_validations(
    claim_id: str,
    current_user: User = Depends(JWTBearer())
):
    """
    Get validation history for a specific claim.
    
    Returns all witness endorsements and leader endorsements for the claim.
    
    Args:
        claim_id: The claim ID
        current_user: Authenticated user
    
    Returns:
        List of validations with validator info
    """
    # Validate claim exists
    try:
        claim = await Claim.get(ObjectId(claim_id))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid claim ID"
        )
    
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    
    # Get all validations for this claim
    validations = await Validation.find(Validation.claim_id == claim_id).to_list()
    
    # Convert to response format
    return [
        ValidationRead(
            id=str(v.id),
            claim_id=v.claim_id,
            validator_id=v.validator_id,
            validator_role=v.validator_role,
            status=v.status,
            comment=v.comment,
            timestamp=v.timestamp
        )
        for v in validations
    ]

@router.get("/pending-claims", response_model=List[dict])
async def get_pending_claims_for_validation(
    current_user: User = Depends(JWTBearer())
):
    """
    Get claims that are pending validation.
    
    For citizens/witnesses: Returns claims they haven't witnessed yet
    For leaders: Returns claims with 2+ witnesses that need leader endorsement
    
    Args:
        current_user: Authenticated user
    
    Returns:
        List of claims pending validation
    """
    if current_user.role == "leader":
        # Leaders see claims with 2+ witnesses that haven't been endorsed
        claims = await Claim.find(
            Claim.witness_count >= 2,
            Claim.endorsed_by_leader == False,
            Claim.validation_status != "fully_validated"
        ).to_list()
    else:
        # Citizens see all pending claims except their own
        claims = await Claim.find(
            Claim.user_id != str(current_user.id),
            Claim.validation_status != "fully_validated"
        ).to_list()
        
        # Filter out claims already witnessed by this user
        witnessed_claim_ids = set()
        user_validations = await Validation.find(
            Validation.validator_id == str(current_user.id),
            Validation.validator_role == "witness"
        ).to_list()
        witnessed_claim_ids = {v.claim_id for v in user_validations}
        
        claims = [c for c in claims if str(c.id) not in witnessed_claim_ids]
    
    # Format response
    from ..schemas.claim import ClaimRead, GeoLocation, GeoJSONPolygon
    
    result = []
    for claim in claims:
        result.append({
            "id": str(claim.id),
            "user_id": claim.user_id,
            "photo_url": claim.photo_url,
            "geolocation": claim.geolocation,
            "boundary": claim.boundary,
            "status": claim.status,
            "validation_status": claim.validation_status,
            "witness_count": claim.witness_count,
            "endorsed_by_leader": claim.endorsed_by_leader,
            "created_at": claim.created_at
        })
    
    return result
