from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from app.models.claim import Claim
from app.models.user import User
from app.models.approval_action import (
    ApprovalAction,
    ApprovalActionCreate,
    ApprovalActionResponse,
    BatchApprovalRequest,
    ApprovalStats,
    ApprovalDecision
)
from app.auth import get_current_user
from app.auth.permissions import check_approval_permission, check_jurisdiction_access
from app.services.activity_log_service import ActivityLogService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/approvals", tags=["approvals"])
logger = logging.getLogger(__name__)


@router.get("/queue", response_model=List[dict])
async def get_approval_queue(
    status_filter: Optional[str] = Query(None, alias="status"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|plot_area|validation_status)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """
    Get claims pending approval in the leader's jurisdiction with advanced filtering.
    """
    try:
        # Check approval permission
        has_permission = await check_approval_permission(current_user)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permission to approve claims"
            )
        
        # Build query for jurisdiction
        query = {}
        if current_user.role != "admin":
            if not current_user.jurisdiction_id:
                return []
            query["jurisdiction_id"] = current_user.jurisdiction_id
        
        # Status filter
        if status_filter:
            query["status"] = status_filter
        else:
            # Default to pending claims
            query["status"] = {"$in": ["pending", "validated"]}
        
        # Date range filter
        if date_from or date_to:
            date_query = {}
            if date_from:
                date_query["$gte"] = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            if date_to:
                date_query["$lte"] = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            if date_query:
                query["created_at"] = date_query
        
        # Get claims
        claims_query = Claim.find(query)
        
        # Apply sorting
        if sort_order == "desc":
            claims_query = claims_query.sort(f"-{sort_by}")
        else:
            claims_query = claims_query.sort(sort_by)
        
        claims = await claims_query.skip(skip).limit(limit).to_list()
        
        # Get approval actions for these claims
        claim_ids = [str(claim.id) for claim in claims]
        approval_actions = await ApprovalAction.find(
            {"claim_id": {"$in": claim_ids}}
        ).to_list()
        
        # Create lookup for approval actions
        action_lookup = {action.claim_id: action for action in approval_actions}
        
        # Enhance claims with approval info
        result = []
        for claim in claims:
            claim_dict = {
                "id": str(claim.id),
                "user_id": claim.user_id,
                "claimant_name": claim.claimant_name,
                "claimant_email": claim.claimant_email,
                "photo_url": claim.photo_url,
                "geolocation": claim.geolocation,
                "boundary": claim.boundary,
                "plot_area": claim.plot_area,
                "status": claim.status,
                "validation_status": claim.validation_status,
                "endorsed_by_leader": claim.endorsed_by_leader,
                "witness_count": claim.witness_count,
                "created_at": claim.created_at.isoformat(),
                "jurisdiction_id": claim.jurisdiction_id,
                "jurisdiction_name": claim.jurisdiction_name,
                "parcel_number": claim.parcel_number
            }
            
            # Add approval action if exists
            if str(claim.id) in action_lookup:
                action = action_lookup[str(claim.id)]
                claim_dict["approval_action"] = {
                    "decision": action.decision,
                    "leader_name": action.leader_name,
                    "action_date": action.action_date.isoformat(),
                    "reason": action.reason
                }
            
            result.append(claim_dict)
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting approval queue: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting approval queue: {str(e)}"
        )


@router.post("/{claim_id}/approve", response_model=ApprovalActionResponse)
async def approve_claim(
    claim_id: str,
    approval_data: ApprovalActionCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Approve a claim with detailed reasoning and recommendations.
    """
    try:
        # Check approval permission
        has_permission = await check_approval_permission(current_user)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permission to approve claims"
            )
        
        # Get claim
        claim = await Claim.get(ObjectId(claim_id))
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        # Check jurisdiction access
        has_access = await check_jurisdiction_access(current_user, claim.jurisdiction_id)
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this claim's jurisdiction"
            )
        
        # Create approval action
        approval_action = ApprovalAction(
            claim_id=claim_id,
            jurisdiction_id=claim.jurisdiction_id,
            decision=approval_data.decision,
            leader_id=str(current_user.id),
            leader_name=current_user.full_name,
            leader_title=current_user.leader_level or current_user.role,
            reason=approval_data.reason,
            recommendations=approval_data.recommendations,
            conditions=approval_data.conditions,
            evidence_reviewed=approval_data.evidence_reviewed,
            validation_consensus_reviewed=approval_data.validation_consensus_reviewed,
            ai_analysis_reviewed=approval_data.ai_analysis_reviewed,
            notes=approval_data.notes,
            follow_up_required=approval_data.follow_up_required,
            follow_up_date=approval_data.follow_up_date
        )
        
        await approval_action.insert()
        
        # Update claim status based on decision
        if approval_data.decision == ApprovalDecision.APPROVED:
            claim.status = "approved"
            claim.endorsed_by_leader = True
        elif approval_data.decision == ApprovalDecision.REJECTED:
            claim.status = "rejected"
        elif approval_data.decision == ApprovalDecision.CONDITIONAL:
            claim.status = "conditional_approval"
        elif approval_data.decision == ApprovalDecision.REFERRED:
            claim.status = "referred"
        
        await claim.save()
        
        # Log activity
        try:
            await ActivityLogService.log_activity(
                jurisdiction_id=claim.jurisdiction_id,
                activity_type="claim_approved" if approval_data.decision == ApprovalDecision.APPROVED else "claim_rejected",
                description=f"Claim {claim.parcel_number or claim_id} {approval_data.decision} by {current_user.full_name}",
                user_id=str(current_user.id),
                user_name=current_user.full_name,
                metadata={
                    "claim_id": claim_id,
                    "decision": approval_data.decision,
                    "reason": approval_data.reason
                }
            )
        except Exception as log_error:
            logger.warning(f"Failed to log activity: {log_error}")
        
        # Send notification to claimant
        try:
            await NotificationService.send_approval_notification(
                user_id=claim.user_id,
                claim_id=claim_id,
                decision=approval_data.decision,
                reason=approval_data.reason,
                recommendations=approval_data.recommendations
            )
        except Exception as notif_error:
            logger.warning(f"Failed to send notification: {notif_error}")
        
        return ApprovalActionResponse(
            id=str(approval_action.id),
            claim_id=approval_action.claim_id,
            jurisdiction_id=approval_action.jurisdiction_id,
            decision=approval_action.decision,
            leader_id=approval_action.leader_id,
            leader_name=approval_action.leader_name,
            leader_title=approval_action.leader_title,
            reason=approval_action.reason,
            recommendations=approval_action.recommendations,
            conditions=approval_action.conditions,
            evidence_reviewed=approval_action.evidence_reviewed,
            validation_consensus_reviewed=approval_action.validation_consensus_reviewed,
            ai_analysis_reviewed=approval_action.ai_analysis_reviewed,
            action_date=approval_action.action_date.isoformat(),
            notes=approval_action.notes,
            follow_up_required=approval_action.follow_up_required,
            follow_up_date=approval_action.follow_up_date.isoformat() if approval_action.follow_up_date else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving claim: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving claim: {str(e)}"
        )


@router.post("/batch", response_model=List[ApprovalActionResponse])
async def batch_approve_claims(
    batch_data: BatchApprovalRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Batch approve/reject multiple claims with the same decision.
    """
    try:
        # Check approval permission
        has_permission = await check_approval_permission(current_user)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permission to approve claims"
            )
        
        results = []
        
        for claim_id in batch_data.claim_ids:
            try:
                # Get claim
                claim = await Claim.get(ObjectId(claim_id))
                if not claim:
                    continue
                
                # Check jurisdiction access
                has_access = await check_jurisdiction_access(current_user, claim.jurisdiction_id)
                if not has_access:
                    continue
                
                # Create approval action
                approval_action = ApprovalAction(
                    claim_id=claim_id,
                    jurisdiction_id=claim.jurisdiction_id,
                    decision=batch_data.decision,
                    leader_id=str(current_user.id),
                    leader_name=current_user.full_name,
                    leader_title=current_user.leader_level or current_user.role,
                    reason=batch_data.reason,
                    recommendations=batch_data.recommendations,
                    conditions=batch_data.conditions,
                    notes=batch_data.notes
                )
                
                await approval_action.insert()
                
                # Update claim status
                if batch_data.decision == ApprovalDecision.APPROVED:
                    claim.status = "approved"
                    claim.endorsed_by_leader = True
                elif batch_data.decision == ApprovalDecision.REJECTED:
                    claim.status = "rejected"
                elif batch_data.decision == ApprovalDecision.CONDITIONAL:
                    claim.status = "conditional_approval"
                elif batch_data.decision == ApprovalDecision.REFERRED:
                    claim.status = "referred"
                
                await claim.save()
                
                results.append(ApprovalActionResponse(
                    id=str(approval_action.id),
                    claim_id=approval_action.claim_id,
                    jurisdiction_id=approval_action.jurisdiction_id,
                    decision=approval_action.decision,
                    leader_id=approval_action.leader_id,
                    leader_name=approval_action.leader_name,
                    leader_title=approval_action.leader_title,
                    reason=approval_action.reason,
                    recommendations=approval_action.recommendations,
                    conditions=approval_action.conditions,
                    evidence_reviewed=approval_action.evidence_reviewed,
                    validation_consensus_reviewed=approval_action.validation_consensus_reviewed,
                    ai_analysis_reviewed=approval_action.ai_analysis_reviewed,
                    action_date=approval_action.action_date.isoformat(),
                    notes=approval_action.notes,
                    follow_up_required=approval_action.follow_up_required,
                    follow_up_date=None
                ))
                
            except Exception as e:
                logger.warning(f"Failed to process claim {claim_id} in batch: {e}")
                continue
        
        return results
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error batch approving claims: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error batch approving claims: {str(e)}"
        )


@router.get("/stats", response_model=ApprovalStats)
async def get_approval_stats(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user)
):
    """
    Get approval statistics for the jurisdiction.
    """
    try:
        # Check approval permission
        has_permission = await check_approval_permission(current_user)
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No permission to view approval stats"
            )
        
        # Build query
        query = {}
        if current_user.role != "admin":
            if not current_user.jurisdiction_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No jurisdiction assigned"
                )
            query["jurisdiction_id"] = current_user.jurisdiction_id
        
        # Add date filter
        date_from = datetime.utcnow() - timedelta(days=days)
        query["action_date"] = {"$gte": date_from}
        
        # Get all approval actions
        actions = await ApprovalAction.find(query).to_list()
        
        # Calculate stats
        total_processed = len(actions)
        approved_count = sum(1 for a in actions if a.decision == ApprovalDecision.APPROVED)
        rejected_count = sum(1 for a in actions if a.decision == ApprovalDecision.REJECTED)
        conditional_count = sum(1 for a in actions if a.decision == ApprovalDecision.CONDITIONAL)
        referred_count = sum(1 for a in actions if a.decision == ApprovalDecision.REFERRED)
        
        approval_rate = (approved_count / total_processed * 100) if total_processed > 0 else 0
        
        # Calculate average processing time
        avg_processing_time = None
        if actions:
            processing_times = []
            for action in actions:
                try:
                    claim = await Claim.get(ObjectId(action.claim_id))
                    if claim:
                        time_diff = action.action_date - claim.created_at
                        processing_times.append(time_diff.total_seconds() / 3600)  # hours
                except Exception:
                    continue
            
            if processing_times:
                avg_processing_time = sum(processing_times) / len(processing_times)
        
        # Get pending count
        pending_query = {"status": {"$in": ["pending", "validated"]}}
        if current_user.role != "admin" and current_user.jurisdiction_id:
            pending_query["jurisdiction_id"] = current_user.jurisdiction_id
        
        pending_count = await Claim.find(pending_query).count()
        
        # Get follow-ups required
        follow_up_query = {"follow_up_required": True}
        if current_user.role != "admin" and current_user.jurisdiction_id:
            follow_up_query["jurisdiction_id"] = current_user.jurisdiction_id
        
        follow_ups_count = await ApprovalAction.find(follow_up_query).count()
        
        return ApprovalStats(
            total_processed=total_processed,
            approved_count=approved_count,
            rejected_count=rejected_count,
            conditional_count=conditional_count,
            referred_count=referred_count,
            approval_rate=round(approval_rate, 2),
            avg_processing_time_hours=round(avg_processing_time, 2) if avg_processing_time else None,
            pending_count=pending_count,
            follow_ups_required=follow_ups_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting approval stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting approval stats: {str(e)}"
        )


@router.get("/history/{claim_id}", response_model=List[ApprovalActionResponse])
async def get_approval_history(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get approval action history for a specific claim.
    """
    try:
        # Get claim
        claim = await Claim.get(ObjectId(claim_id))
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Claim not found"
            )
        
        # Check access
        has_access = await check_jurisdiction_access(current_user, claim.jurisdiction_id)
        if not has_access and str(current_user.id) != claim.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No access to this claim"
            )
        
        # Get approval actions
        actions = await ApprovalAction.find(
            {"claim_id": claim_id}
        ).sort("-action_date").to_list()
        
        return [
            ApprovalActionResponse(
                id=str(action.id),
                claim_id=action.claim_id,
                jurisdiction_id=action.jurisdiction_id,
                decision=action.decision,
                leader_id=action.leader_id,
                leader_name=action.leader_name,
                leader_title=action.leader_title,
                reason=action.reason,
                recommendations=action.recommendations,
                conditions=action.conditions,
                evidence_reviewed=action.evidence_reviewed,
                validation_consensus_reviewed=action.validation_consensus_reviewed,
                ai_analysis_reviewed=action.ai_analysis_reviewed,
                action_date=action.action_date.isoformat(),
                notes=action.notes,
                follow_up_required=action.follow_up_required,
                follow_up_date=action.follow_up_date.isoformat() if action.follow_up_date else None
            )
            for action in actions
        ]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting approval history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting approval history: {str(e)}"
        )
