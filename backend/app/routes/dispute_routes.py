from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import logging

from app.models.dispute import (
    Dispute,
    DisputeCreate,
    DisputeUpdate,
    EvidenceSubmit,
    DisputeResolve,
    DisputeResponse,
    DisputeDetailResponse
)
from app.models.user import User
from app.auth import get_current_user
from app.auth.permissions import check_jurisdiction_access, check_dispute_resolution_permission
from app.services.dispute_service import DisputeService

router = APIRouter(prefix="/disputes", tags=["disputes"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=DisputeDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_dispute(
    dispute_data: DisputeCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new dispute.
    """
    try:
        # Check jurisdiction access
        has_access = await check_jurisdiction_access(current_user, dispute_data.jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this jurisdiction"
            )
        
        dispute = await DisputeService.create_dispute(
            claim_id=dispute_data.claim_id,
            jurisdiction_id=dispute_data.jurisdiction_id,
            dispute_type=dispute_data.dispute_type,
            title=dispute_data.title,
            description=dispute_data.description,
            created_by_id=str(current_user.id),
            created_by_name=current_user.full_name,
            jurisdiction_name=dispute_data.jurisdiction_name,
            parcel_number=dispute_data.parcel_number,
            parties=dispute_data.parties,
            priority=dispute_data.priority
        )
        
        return DisputeDetailResponse(
            id=str(dispute.id),
            claim_id=dispute.claim_id,
            jurisdiction_id=dispute.jurisdiction_id,
            jurisdiction_name=dispute.jurisdiction_name,
            parcel_number=dispute.parcel_number,
            dispute_type=dispute.dispute_type,
            title=dispute.title,
            description=dispute.description,
            parties=dispute.parties,
            evidence=dispute.evidence,
            status=dispute.status,
            priority=dispute.priority,
            resolution=dispute.resolution,
            filed_at=dispute.filed_at.isoformat(),
            last_updated=dispute.last_updated.isoformat(),
            closed_at=dispute.closed_at.isoformat() if dispute.closed_at else None,
            created_by_id=dispute.created_by_id,
            created_by_name=dispute.created_by_name,
            assigned_to_id=dispute.assigned_to_id,
            assigned_to_name=dispute.assigned_to_name
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating dispute: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating dispute: {str(e)}"
        )


@router.get("/", response_model=List[DisputeResponse])
async def list_disputes(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    dispute_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """
    List disputes with optional filters.
    Non-admin users only see disputes from their jurisdiction.
    """
    try:
        # Build query
        query = {}
        
        # Apply jurisdiction filter for non-admin users
        if current_user.role != "admin":
            if not current_user.jurisdiction_id:
                return []
            query["jurisdiction_id"] = current_user.jurisdiction_id
        
        if status_filter:
            query["status"] = status_filter
        
        if priority:
            query["priority"] = priority
        
        if dispute_type:
            query["dispute_type"] = dispute_type
        
        # Get disputes
        disputes = await Dispute.find(query).sort("-filed_at").skip(skip).limit(limit).to_list()
        
        return [
            DisputeResponse(
                id=str(dispute.id),
                claim_id=dispute.claim_id,
                jurisdiction_id=dispute.jurisdiction_id,
                jurisdiction_name=dispute.jurisdiction_name,
                parcel_number=dispute.parcel_number,
                dispute_type=dispute.dispute_type,
                title=dispute.title,
                description=dispute.description,
                parties=dispute.parties,
                evidence_count=len(dispute.evidence),
                status=dispute.status,
                priority=dispute.priority,
                resolution=dispute.resolution,
                filed_at=dispute.filed_at.isoformat(),
                last_updated=dispute.last_updated.isoformat(),
                closed_at=dispute.closed_at.isoformat() if dispute.closed_at else None,
                created_by_name=dispute.created_by_name,
                assigned_to_name=dispute.assigned_to_name
            )
            for dispute in disputes
        ]
    
    except Exception as e:
        logger.error(f"Error listing disputes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing disputes: {str(e)}"
        )


@router.get("/{dispute_id}", response_model=DisputeDetailResponse)
async def get_dispute(
    dispute_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed dispute information including evidence.
    """
    try:
        dispute = await Dispute.get(dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found"
            )
        
        # Check jurisdiction access
        has_access = await check_jurisdiction_access(current_user, dispute.jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this dispute"
            )
        
        return DisputeDetailResponse(
            id=str(dispute.id),
            claim_id=dispute.claim_id,
            jurisdiction_id=dispute.jurisdiction_id,
            jurisdiction_name=dispute.jurisdiction_name,
            parcel_number=dispute.parcel_number,
            dispute_type=dispute.dispute_type,
            title=dispute.title,
            description=dispute.description,
            parties=dispute.parties,
            evidence=dispute.evidence,
            status=dispute.status,
            priority=dispute.priority,
            resolution=dispute.resolution,
            filed_at=dispute.filed_at.isoformat(),
            last_updated=dispute.last_updated.isoformat(),
            closed_at=dispute.closed_at.isoformat() if dispute.closed_at else None,
            created_by_id=dispute.created_by_id,
            created_by_name=dispute.created_by_name,
            assigned_to_id=dispute.assigned_to_id,
            assigned_to_name=dispute.assigned_to_name
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dispute: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting dispute: {str(e)}"
        )


@router.patch("/{dispute_id}", response_model=DisputeResponse)
async def update_dispute(
    dispute_id: str,
    update_data: DisputeUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update dispute details (Admin or assigned leader only).
    """
    try:
        dispute = await Dispute.get(dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found"
            )
        
        # Check if user can update (admin or assigned leader)
        if current_user.role != "admin" and dispute.assigned_to_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only assigned leader or admin can update dispute"
            )
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(dispute, key, value)
        
        dispute.last_updated = datetime.utcnow()
        await dispute.save()
        
        return DisputeResponse(
            id=str(dispute.id),
            claim_id=dispute.claim_id,
            jurisdiction_id=dispute.jurisdiction_id,
            jurisdiction_name=dispute.jurisdiction_name,
            parcel_number=dispute.parcel_number,
            dispute_type=dispute.dispute_type,
            title=dispute.title,
            description=dispute.description,
            parties=dispute.parties,
            evidence_count=len(dispute.evidence),
            status=dispute.status,
            priority=dispute.priority,
            resolution=dispute.resolution,
            filed_at=dispute.filed_at.isoformat(),
            last_updated=dispute.last_updated.isoformat(),
            closed_at=dispute.closed_at.isoformat() if dispute.closed_at else None,
            created_by_name=dispute.created_by_name,
            assigned_to_name=dispute.assigned_to_name
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating dispute: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating dispute: {str(e)}"
        )


@router.post("/{dispute_id}/evidence", response_model=DisputeDetailResponse)
async def add_evidence(
    dispute_id: str,
    evidence_data: EvidenceSubmit,
    current_user: User = Depends(get_current_user)
):
    """
    Add evidence to a dispute.
    """
    try:
        dispute = await Dispute.get(dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found"
            )
        
        # Check jurisdiction access
        has_access = await check_jurisdiction_access(current_user, dispute.jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this dispute"
            )
        
        dispute = await DisputeService.add_evidence(
            dispute_id=dispute_id,
            evidence_type=evidence_data.evidence_type,
            description=evidence_data.description,
            submitted_by=str(current_user.id),
            submitted_by_name=current_user.full_name,
            file_url=evidence_data.file_url
        )
        
        return DisputeDetailResponse(
            id=str(dispute.id),
            claim_id=dispute.claim_id,
            jurisdiction_id=dispute.jurisdiction_id,
            jurisdiction_name=dispute.jurisdiction_name,
            parcel_number=dispute.parcel_number,
            dispute_type=dispute.dispute_type,
            title=dispute.title,
            description=dispute.description,
            parties=dispute.parties,
            evidence=dispute.evidence,
            status=dispute.status,
            priority=dispute.priority,
            resolution=dispute.resolution,
            filed_at=dispute.filed_at.isoformat(),
            last_updated=dispute.last_updated.isoformat(),
            closed_at=dispute.closed_at.isoformat() if dispute.closed_at else None,
            created_by_id=dispute.created_by_id,
            created_by_name=dispute.created_by_name,
            assigned_to_id=dispute.assigned_to_id,
            assigned_to_name=dispute.assigned_to_name
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding evidence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error adding evidence: {str(e)}"
        )


@router.post("/{dispute_id}/resolve", response_model=DisputeDetailResponse)
async def resolve_dispute(
    dispute_id: str,
    resolution_data: DisputeResolve,
    current_user: User = Depends(get_current_user)
):
    """
    Resolve a dispute (requires dispute resolution permission).
    """
    try:
        # Check dispute resolution permission
        has_permission = await check_dispute_resolution_permission(current_user)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permission to resolve disputes"
            )
        
        dispute = await Dispute.get(dispute_id)
        if not dispute:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dispute not found"
            )
        
        # Check jurisdiction access
        has_access = await check_jurisdiction_access(current_user, dispute.jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this dispute"
            )
        
        dispute = await DisputeService.resolve_dispute(
            dispute_id=dispute_id,
            decision=resolution_data.decision,
            resolution_summary=resolution_data.resolution_summary,
            resolved_by_id=str(current_user.id),
            resolved_by_name=current_user.full_name,
            resolved_by_title=current_user.leader_level or "Official",
            notes=resolution_data.notes
        )
        
        return DisputeDetailResponse(
            id=str(dispute.id),
            claim_id=dispute.claim_id,
            jurisdiction_id=dispute.jurisdiction_id,
            jurisdiction_name=dispute.jurisdiction_name,
            parcel_number=dispute.parcel_number,
            dispute_type=dispute.dispute_type,
            title=dispute.title,
            description=dispute.description,
            parties=dispute.parties,
            evidence=dispute.evidence,
            status=dispute.status,
            priority=dispute.priority,
            resolution=dispute.resolution,
            filed_at=dispute.filed_at.isoformat(),
            last_updated=dispute.last_updated.isoformat(),
            closed_at=dispute.closed_at.isoformat() if dispute.closed_at else None,
            created_by_id=dispute.created_by_id,
            created_by_name=dispute.created_by_name,
            assigned_to_id=dispute.assigned_to_id,
            assigned_to_name=dispute.assigned_to_name
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving dispute: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error resolving dispute: {str(e)}"
        )


@router.post("/{dispute_id}/assign", response_model=DisputeResponse)
async def assign_dispute(
    dispute_id: str,
    assigned_to_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Assign dispute to a leader (Admin only).
    """
    try:
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can assign disputes"
            )
        
        # Get the user being assigned
        from app.models.user import User as UserModel
        assigned_user = await UserModel.get(assigned_to_id)
        if not assigned_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assigned user not found"
            )
        
        dispute = await DisputeService.assign_dispute(
            dispute_id=dispute_id,
            assigned_to_id=assigned_to_id,
            assigned_to_name=assigned_user.full_name
        )
        
        return DisputeResponse(
            id=str(dispute.id),
            claim_id=dispute.claim_id,
            jurisdiction_id=dispute.jurisdiction_id,
            jurisdiction_name=dispute.jurisdiction_name,
            parcel_number=dispute.parcel_number,
            dispute_type=dispute.dispute_type,
            title=dispute.title,
            description=dispute.description,
            parties=dispute.parties,
            evidence_count=len(dispute.evidence),
            status=dispute.status,
            priority=dispute.priority,
            resolution=dispute.resolution,
            filed_at=dispute.filed_at.isoformat(),
            last_updated=dispute.last_updated.isoformat(),
            closed_at=dispute.closed_at.isoformat() if dispute.closed_at else None,
            created_by_name=dispute.created_by_name,
            assigned_to_name=dispute.assigned_to_name
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning dispute: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error assigning dispute: {str(e)}"
        )
