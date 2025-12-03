from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import logging

from app.models.jurisdiction import (
    Jurisdiction,
    JurisdictionCreate,
    JurisdictionUpdate,
    JurisdictionResponse,
    JurisdictionStats
)
from app.models.activity_log import ActivityLog, ActivityLogResponse
from app.models.user import User
from app.models.claim import Claim
from app.auth import get_current_user
from app.auth.permissions import (
    check_jurisdiction_access,
    require_jurisdiction_access
)

router = APIRouter(prefix="/jurisdiction", tags=["jurisdiction"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=JurisdictionResponse, status_code=status.HTTP_201_CREATED)
async def create_jurisdiction(
    jurisdiction_data: JurisdictionCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new jurisdiction (Admin only).
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create jurisdictions"
        )
    
    try:
        # Check if code already exists
        existing = await Jurisdiction.find_one(Jurisdiction.code == jurisdiction_data.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Jurisdiction with code {jurisdiction_data.code} already exists"
            )
        
        # Create jurisdiction
        jurisdiction = Jurisdiction(
            name=jurisdiction_data.name,
            code=jurisdiction_data.code,
            level=jurisdiction_data.level,
            boundary_coordinates=jurisdiction_data.boundary_coordinates,
            center_lat=jurisdiction_data.center_lat,
            center_lon=jurisdiction_data.center_lon,
            leader_title=jurisdiction_data.leader_title,
            parent_jurisdiction_id=jurisdiction_data.parent_jurisdiction_id
        )
        
        await jurisdiction.save()
        
        return JurisdictionResponse(
            id=str(jurisdiction.id),
            name=jurisdiction.name,
            code=jurisdiction.code,
            level=jurisdiction.level,
            boundary_coordinates=jurisdiction.boundary_coordinates,
            center_lat=jurisdiction.center_lat,
            center_lon=jurisdiction.center_lon,
            assigned_leader_id=jurisdiction.assigned_leader_id,
            leader_name=jurisdiction.leader_name,
            leader_title=jurisdiction.leader_title,
            total_households=jurisdiction.total_households,
            registered_households=jurisdiction.registered_households,
            active_disputes=jurisdiction.active_disputes,
            pending_approvals=jurisdiction.pending_approvals,
            total_claims=jurisdiction.total_claims,
            approved_claims=jurisdiction.approved_claims,
            rejected_claims=jurisdiction.rejected_claims,
            parent_jurisdiction_id=jurisdiction.parent_jurisdiction_id,
            created_at=jurisdiction.created_at.isoformat(),
            is_active=jurisdiction.is_active
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating jurisdiction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating jurisdiction: {str(e)}"
        )


@router.get("/", response_model=List[JurisdictionResponse])
async def list_jurisdictions(
    level: Optional[str] = Query(None, description="Filter by level"),
    active_only: bool = Query(True, description="Only active jurisdictions"),
    current_user: User = Depends(get_current_user)
):
    """
    List all jurisdictions (with optional filters).
    """
    try:
        query = {}
        
        if level:
            query["level"] = level
        
        if active_only:
            query["is_active"] = True
        
        jurisdictions = await Jurisdiction.find(query).to_list()
        
        return [
            JurisdictionResponse(
                id=str(j.id),
                name=j.name,
                code=j.code,
                level=j.level,
                boundary_coordinates=j.boundary_coordinates,
                center_lat=j.center_lat,
                center_lon=j.center_lon,
                assigned_leader_id=j.assigned_leader_id,
                leader_name=j.leader_name,
                leader_title=j.leader_title,
                total_households=j.total_households,
                registered_households=j.registered_households,
                active_disputes=j.active_disputes,
                pending_approvals=j.pending_approvals,
                total_claims=j.total_claims,
                approved_claims=j.approved_claims,
                rejected_claims=j.rejected_claims,
                parent_jurisdiction_id=j.parent_jurisdiction_id,
                created_at=j.created_at.isoformat(),
                is_active=j.is_active
            )
            for j in jurisdictions
        ]
    
    except Exception as e:
        logger.error(f"Error listing jurisdictions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing jurisdictions: {str(e)}"
        )


@router.get("/{jurisdiction_id}", response_model=JurisdictionResponse)
async def get_jurisdiction(
    jurisdiction_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific jurisdiction by ID.
    """
    try:
        # Check access
        has_access = await check_jurisdiction_access(current_user, jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this jurisdiction"
            )
        
        jurisdiction = await Jurisdiction.get(jurisdiction_id)
        if not jurisdiction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jurisdiction not found"
            )
        
        return JurisdictionResponse(
            id=str(jurisdiction.id),
            name=jurisdiction.name,
            code=jurisdiction.code,
            level=jurisdiction.level,
            boundary_coordinates=jurisdiction.boundary_coordinates,
            center_lat=jurisdiction.center_lat,
            center_lon=jurisdiction.center_lon,
            assigned_leader_id=jurisdiction.assigned_leader_id,
            leader_name=jurisdiction.leader_name,
            leader_title=jurisdiction.leader_title,
            total_households=jurisdiction.total_households,
            registered_households=jurisdiction.registered_households,
            active_disputes=jurisdiction.active_disputes,
            pending_approvals=jurisdiction.pending_approvals,
            total_claims=jurisdiction.total_claims,
            approved_claims=jurisdiction.approved_claims,
            rejected_claims=jurisdiction.rejected_claims,
            parent_jurisdiction_id=jurisdiction.parent_jurisdiction_id,
            created_at=jurisdiction.created_at.isoformat(),
            is_active=jurisdiction.is_active
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting jurisdiction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting jurisdiction: {str(e)}"
        )


@router.patch("/{jurisdiction_id}", response_model=JurisdictionResponse)
async def update_jurisdiction(
    jurisdiction_id: str,
    update_data: JurisdictionUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update jurisdiction details (Admin only).
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update jurisdictions"
        )
    
    try:
        jurisdiction = await Jurisdiction.get(jurisdiction_id)
        if not jurisdiction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jurisdiction not found"
            )
        
        # Update fields
        update_dict = update_data.dict(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(jurisdiction, key, value)
        
        jurisdiction.updated_at = datetime.utcnow()
        await jurisdiction.save()
        
        # If leader was assigned, update user
        if update_data.assigned_leader_id:
            leader = await User.get(update_data.assigned_leader_id)
            if leader:
                leader.jurisdiction_id = jurisdiction_id
                leader.jurisdiction_name = jurisdiction.name
                await leader.save()
        
        return JurisdictionResponse(
            id=str(jurisdiction.id),
            name=jurisdiction.name,
            code=jurisdiction.code,
            level=jurisdiction.level,
            boundary_coordinates=jurisdiction.boundary_coordinates,
            center_lat=jurisdiction.center_lat,
            center_lon=jurisdiction.center_lon,
            assigned_leader_id=jurisdiction.assigned_leader_id,
            leader_name=jurisdiction.leader_name,
            leader_title=jurisdiction.leader_title,
            total_households=jurisdiction.total_households,
            registered_households=jurisdiction.registered_households,
            active_disputes=jurisdiction.active_disputes,
            pending_approvals=jurisdiction.pending_approvals,
            total_claims=jurisdiction.total_claims,
            approved_claims=jurisdiction.approved_claims,
            rejected_claims=jurisdiction.rejected_claims,
            parent_jurisdiction_id=jurisdiction.parent_jurisdiction_id,
            created_at=jurisdiction.created_at.isoformat(),
            is_active=jurisdiction.is_active
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating jurisdiction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating jurisdiction: {str(e)}"
        )


@router.get("/{jurisdiction_id}/stats", response_model=JurisdictionStats)
async def get_jurisdiction_stats(
    jurisdiction_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for a jurisdiction.
    """
    try:
        # Check access
        has_access = await check_jurisdiction_access(current_user, jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this jurisdiction"
            )
        
        jurisdiction = await Jurisdiction.get(jurisdiction_id)
        if not jurisdiction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jurisdiction not found"
            )
        
        # Calculate registration percentage
        reg_percentage = 0.0
        if jurisdiction.total_households > 0:
            reg_percentage = (jurisdiction.registered_households / jurisdiction.total_households) * 100
        
        # Calculate approval rate
        approval_rate = 0.0
        if jurisdiction.total_claims > 0:
            approval_rate = (jurisdiction.approved_claims / jurisdiction.total_claims) * 100
        
        return JurisdictionStats(
            jurisdiction_id=str(jurisdiction.id),
            jurisdiction_name=jurisdiction.name,
            total_households=jurisdiction.total_households,
            registered_households=jurisdiction.registered_households,
            registration_percentage=round(reg_percentage, 2),
            active_disputes=jurisdiction.active_disputes,
            pending_approvals=jurisdiction.pending_approvals,
            total_claims=jurisdiction.total_claims,
            approved_claims=jurisdiction.approved_claims,
            rejected_claims=jurisdiction.rejected_claims,
            approval_rate=round(approval_rate, 2)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting jurisdiction stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting jurisdiction stats: {str(e)}"
        )


@router.get("/{jurisdiction_id}/activities", response_model=List[ActivityLogResponse])
async def get_jurisdiction_activities(
    jurisdiction_id: str,
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of activities"),
    skip: int = Query(0, ge=0, description="Number of activities to skip"),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent activities for a jurisdiction.
    """
    try:
        # Check access
        has_access = await check_jurisdiction_access(current_user, jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this jurisdiction"
            )
        
        # Build query
        query = {"jurisdiction_id": jurisdiction_id}
        
        if activity_type:
            query["activity_type"] = activity_type
        
        if status:
            query["status"] = status
        
        # Get activities
        activities = await ActivityLog.find(query).sort("-timestamp").skip(skip).limit(limit).to_list()
        
        return [
            ActivityLogResponse(
                id=str(activity.id),
                jurisdiction_id=activity.jurisdiction_id,
                activity_type=activity.activity_type,
                description=activity.description,
                related_user_name=activity.related_user_name,
                related_parcel_number=activity.related_parcel_number,
                status=activity.status,
                status_color=activity.status_color,
                timestamp=activity.timestamp.isoformat()
            )
            for activity in activities
        ]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting jurisdiction activities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting jurisdiction activities: {str(e)}"
        )


@router.post("/{jurisdiction_id}/refresh-stats", response_model=JurisdictionStats)
async def refresh_jurisdiction_stats(
    jurisdiction_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Recalculate and update jurisdiction statistics (Admin or Leader only).
    """
    try:
        # Check if user is admin or assigned leader
        has_access = await check_jurisdiction_access(current_user, jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this jurisdiction"
            )
        
        jurisdiction = await Jurisdiction.get(jurisdiction_id)
        if not jurisdiction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Jurisdiction not found"
            )
        
        # Count claims by status
        total_claims = await Claim.find(Claim.jurisdiction_id == jurisdiction_id).count()
        approved_claims = await Claim.find(
            Claim.jurisdiction_id == jurisdiction_id,
            Claim.status == "validated"
        ).count()
        rejected_claims = await Claim.find(
            Claim.jurisdiction_id == jurisdiction_id,
            Claim.status == "rejected"
        ).count()
        
        # Count pending approvals (consensus reached but not yet approved)
        pending_approvals = await Claim.find(
            Claim.jurisdiction_id == jurisdiction_id,
            Claim.validation_status == "fully_validated",
            Claim.status == "under_review"
        ).count()
        
        # Update jurisdiction stats
        jurisdiction.total_claims = total_claims
        jurisdiction.approved_claims = approved_claims
        jurisdiction.rejected_claims = rejected_claims
        jurisdiction.pending_approvals = pending_approvals
        jurisdiction.updated_at = datetime.utcnow()
        
        await jurisdiction.save()
        
        # Calculate percentages
        reg_percentage = 0.0
        if jurisdiction.total_households > 0:
            reg_percentage = (jurisdiction.registered_households / jurisdiction.total_households) * 100
        
        approval_rate = 0.0
        if total_claims > 0:
            approval_rate = (approved_claims / total_claims) * 100
        
        return JurisdictionStats(
            jurisdiction_id=str(jurisdiction.id),
            jurisdiction_name=jurisdiction.name,
            total_households=jurisdiction.total_households,
            registered_households=jurisdiction.registered_households,
            registration_percentage=round(reg_percentage, 2),
            active_disputes=jurisdiction.active_disputes,
            pending_approvals=pending_approvals,
            total_claims=total_claims,
            approved_claims=approved_claims,
            rejected_claims=rejected_claims,
            approval_rate=round(approval_rate, 2)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing jurisdiction stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing jurisdiction stats: {str(e)}"
        )
