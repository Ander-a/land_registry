from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
import logging

from app.models.validation import (
    Validation, 
    ValidationConsensus, 
    ValidationCreate, 
    ValidationResponse,
    ConsensusResponse
)
from app.models.claim import Claim
from app.models.user import User
from app.auth.auth import get_current_user
from app.services.consensus_engine import ConsensusEngine
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/validations", tags=["validations"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=ValidationResponse, status_code=status.HTTP_201_CREATED)
async def create_validation(
    validation_data: ValidationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Submit a validation for a claim (vouch, dispute, or unsure).
    
    This endpoint processes community validation and triggers consensus checking.
    """
    try:
        # Validate action
        if validation_data.action not in ["vouch", "dispute", "unsure"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action must be 'vouch', 'dispute', or 'unsure'"
            )
        
        # Require reason for disputes
        if validation_data.action == "dispute" and not validation_data.reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reason is required for disputes"
            )
        
        # Check if claim exists
        claim = await Claim.get(validation_data.claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        # Check if user already validated this claim
        existing_validation = await Validation.find_one(
            Validation.claim_id == validation_data.claim_id,
            Validation.validator_id == str(current_user.id)
        )
        
        if existing_validation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already validated this claim"
            )
        
        # Check if user is the claimant
        if str(claim.user_id) == str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot validate your own claim"
            )
        
        # Get user's trust score (default to 50 if not set)
        trust_score = getattr(current_user, 'trust_score', 50.0)
        
        # Create validation record
        validation = Validation(
            claim_id=validation_data.claim_id,
            validator_id=str(current_user.id),
            validator_name=current_user.name,
            validator_trust_score=trust_score,
            action=validation_data.action,
            reason=validation_data.reason,
            validator_location=validation_data.validator_location,
            created_at=datetime.utcnow()
        )
        
        await validation.save()
        
        # Notify claim owner of new validation
        notification_service = NotificationService()
        await notification_service.notify_validation_received(
            claim_owner_id=str(claim.user_id),
            validator_name=current_user.name,
            action=validation_data.action,
            claim_id=validation_data.claim_id,
            validation_id=str(validation.id)
        )
        
        # If it's a dispute, send a separate high-priority notification
        if validation_data.action == "dispute":
            await notification_service.notify_dispute_raised(
                claim_owner_id=str(claim.user_id),
                validator_name=current_user.name,
                reason=validation_data.reason or "No reason provided",
                claim_id=validation_data.claim_id,
                validation_id=str(validation.id)
            )
        
        # Process validation through consensus engine
        consensus_engine = ConsensusEngine()
        consensus = await consensus_engine.process_validation(validation, claim)
        
        # Prepare response
        response = ValidationResponse(
            id=str(validation.id),
            claim_id=validation.claim_id,
            validator_id=validation.validator_id,
            validator_name=validation.validator_name,
            action=validation.action,
            reason=validation.reason,
            distance_to_claim=validation.distance_to_claim,
            trust_score_impact=validation.trust_score_impact,
            created_at=validation.created_at
        )
        
        logger.info(
            f"Validation created: {validation.action} by {current_user.name} "
            f"for claim {validation_data.claim_id}"
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating validation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating validation: {str(e)}"
        )


@router.get("/claim/{claim_id}", response_model=List[ValidationResponse])
async def get_claim_validations(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all validations for a specific claim."""
    try:
        # Check if claim exists
        claim = await Claim.get(claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        # Get all validations for this claim
        validations = await Validation.find(
            Validation.claim_id == claim_id
        ).sort("-created_at").to_list()
        
        return [
            ValidationResponse(
                id=str(v.id),
                claim_id=v.claim_id,
                validator_id=v.validator_id,
                validator_name=v.validator_name,
                action=v.action,
                reason=v.reason,
                distance_to_claim=v.distance_to_claim,
                trust_score_impact=v.trust_score_impact,
                created_at=v.created_at
            )
            for v in validations
        ]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching claim validations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching validations: {str(e)}"
        )


@router.get("/consensus/{claim_id}", response_model=ConsensusResponse)
async def get_claim_consensus(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get consensus status for a specific claim."""
    try:
        # Check if claim exists
        claim = await Claim.get(claim_id)
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        # Get consensus record
        consensus = await ValidationConsensus.find_one(
            ValidationConsensus.claim_id == claim_id
        )
        
        if not consensus:
            # Return empty consensus if no validations yet
            return ConsensusResponse(
                claim_id=claim_id,
                consensus_reached=False,
                total_validations=0,
                vouch_count=0,
                dispute_count=0,
                unsure_count=0,
                minimum_validations_met=False,
                consensus_threshold_met=False
            )
        
        return ConsensusResponse(
            claim_id=consensus.claim_id,
            consensus_reached=consensus.consensus_reached,
            consensus_action=consensus.consensus_action,
            consensus_percentage=consensus.consensus_percentage,
            confidence_level=consensus.confidence_level,
            total_validations=consensus.total_validations,
            vouch_count=consensus.vouch_count,
            dispute_count=consensus.dispute_count,
            unsure_count=consensus.unsure_count,
            minimum_validations_met=consensus.minimum_validations_met,
            consensus_threshold_met=consensus.consensus_threshold_met
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching consensus: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching consensus: {str(e)}"
        )


@router.get("/my-validations", response_model=List[ValidationResponse])
async def get_my_validations(
    current_user: User = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """Get current user's validation history."""
    try:
        validations = await Validation.find(
            Validation.validator_id == str(current_user.id)
        ).sort("-created_at").skip(skip).limit(limit).to_list()
        
        return [
            ValidationResponse(
                id=str(v.id),
                claim_id=v.claim_id,
                validator_id=v.validator_id,
                validator_name=v.validator_name,
                action=v.action,
                reason=v.reason,
                distance_to_claim=v.distance_to_claim,
                trust_score_impact=v.trust_score_impact,
                created_at=v.created_at
            )
            for v in validations
        ]
    
    except Exception as e:
        logger.error(f"Error fetching user validations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching validations: {str(e)}"
        )


@router.delete("/{validation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_validation(
    validation_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a validation (only allowed by validator or admin, and only if consensus not reached).
    """
    try:
        validation = await Validation.get(validation_id)
        if not validation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Validation not found"
            )
        
        # Check permissions
        if str(validation.validator_id) != str(current_user.id) and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this validation"
            )
        
        # Check if consensus already reached
        consensus = await ValidationConsensus.find_one(
            ValidationConsensus.claim_id == validation.claim_id
        )
        
        if consensus and consensus.consensus_reached:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete validation after consensus is reached"
            )
        
        await validation.delete()
        
        # Recalculate consensus after deletion
        if consensus:
            claim = await Claim.get(validation.claim_id)
            if claim:
                consensus_engine = ConsensusEngine()
                # Recalculate by processing remaining validations
                # This is a simplified approach - in production you'd want to
                # rebuild the entire consensus from scratch
                logger.info(f"Validation {validation_id} deleted, consensus may need recalculation")
        
        return None
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting validation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting validation: {str(e)}"
        )
