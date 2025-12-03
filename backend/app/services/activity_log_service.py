from typing import Optional
from datetime import datetime
import logging

from app.models.activity_log import ActivityLog, ActivityLogCreate
from app.models.claim import Claim
from app.models.user import User
from app.models.jurisdiction import Jurisdiction

logger = logging.getLogger(__name__)


class ActivityLogService:
    """
    Service layer for activity logging.
    """
    
    @staticmethod
    async def log_activity(
        jurisdiction_id: str,
        activity_type: str,
        description: str,
        status: str,
        related_user_id: Optional[str] = None,
        related_claim_id: Optional[str] = None,
        related_dispute_id: Optional[str] = None,
        related_parcel_number: Optional[str] = None
    ) -> ActivityLog:
        """
        Create an activity log entry.
        Helper method for consistent logging.
        """
        try:
            # Get jurisdiction name
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            jurisdiction_name = jurisdiction.name if jurisdiction else "Unknown"
            
            # Get user name if user_id provided
            user_name = None
            if related_user_id:
                user = await User.get(related_user_id)
                user_name = user.full_name if user else "Unknown User"
            
            # Determine status color
            status_color = ActivityLogService.get_status_color(status)
            
            # Create activity log
            activity = ActivityLog(
                jurisdiction_id=jurisdiction_id,
                jurisdiction_name=jurisdiction_name,
                activity_type=activity_type,
                description=description,
                related_user_id=related_user_id,
                related_user_name=user_name,
                related_claim_id=related_claim_id,
                related_dispute_id=related_dispute_id,
                related_parcel_number=related_parcel_number,
                status=status,
                status_color=status_color
            )
            
            await activity.save()
            logger.info(f"Created activity log: {activity_type} - {description}")
            return activity
        
        except Exception as e:
            logger.error(f"Error creating activity log: {e}")
            raise
    
    @staticmethod
    def get_status_color(status: str) -> str:
        """
        Get color code for status display.
        """
        color_map = {
            "pending": "#FFA500",
            "approved": "#4CAF50",
            "rejected": "#F44336",
            "closed": "#9E9E9E",
            "active": "#2196F3",
            "completed": "#4CAF50"
        }
        return color_map.get(status.lower(), "#9E9E9E")
    
    @staticmethod
    async def log_claim_activity(
        claim_id: str,
        activity_type: str,
        description: str,
        status: str
    ) -> Optional[ActivityLog]:
        """
        Log an activity related to a claim.
        Automatically extracts claim details.
        """
        try:
            claim = await Claim.get(claim_id)
            if not claim or not claim.jurisdiction_id:
                logger.warning(f"Claim {claim_id} not found or has no jurisdiction")
                return None
            
            return await ActivityLogService.log_activity(
                jurisdiction_id=claim.jurisdiction_id,
                activity_type=activity_type,
                description=description,
                status=status,
                related_user_id=str(claim.user_id) if claim.user_id else None,
                related_claim_id=claim_id,
                related_parcel_number=claim.parcel_number
            )
        
        except Exception as e:
            logger.error(f"Error logging claim activity: {e}")
            raise
    
    @staticmethod
    async def log_claim_submission(claim_id: str) -> Optional[ActivityLog]:
        """
        Log when a new claim is submitted.
        """
        try:
            claim = await Claim.get(claim_id)
            if not claim:
                return None
            
            user_name = "Unknown"
            if claim.user_id:
                user = await User.get(str(claim.user_id))
                user_name = user.full_name if user else "Unknown"
            
            return await ActivityLogService.log_claim_activity(
                claim_id=claim_id,
                activity_type="claim",
                description=f"New land claim submitted by {user_name}",
                status="pending"
            )
        
        except Exception as e:
            logger.error(f"Error logging claim submission: {e}")
            raise
    
    @staticmethod
    async def log_claim_validation(claim_id: str, validator_name: str, is_valid: bool) -> Optional[ActivityLog]:
        """
        Log when a claim is validated by a community member.
        """
        try:
            status = "active" if is_valid else "rejected"
            validation_text = "validated" if is_valid else "disputed"
            
            return await ActivityLogService.log_claim_activity(
                claim_id=claim_id,
                activity_type="validation",
                description=f"Claim {validation_text} by {validator_name}",
                status=status
            )
        
        except Exception as e:
            logger.error(f"Error logging claim validation: {e}")
            raise
    
    @staticmethod
    async def log_claim_approval(claim_id: str, approver_name: str, approved: bool) -> Optional[ActivityLog]:
        """
        Log when a claim is approved or rejected by a leader.
        """
        try:
            status = "approved" if approved else "rejected"
            action_text = "approved" if approved else "rejected"
            
            return await ActivityLogService.log_claim_activity(
                claim_id=claim_id,
                activity_type="approval",
                description=f"Claim {action_text} by {approver_name}",
                status=status
            )
        
        except Exception as e:
            logger.error(f"Error logging claim approval: {e}")
            raise
    
    @staticmethod
    async def log_dispute_activity(
        dispute_id: str,
        jurisdiction_id: str,
        activity_type: str,
        description: str,
        status: str,
        related_user_id: Optional[str] = None
    ) -> ActivityLog:
        """
        Log an activity related to a dispute.
        """
        try:
            return await ActivityLogService.log_activity(
                jurisdiction_id=jurisdiction_id,
                activity_type=activity_type,
                description=description,
                status=status,
                related_user_id=related_user_id,
                related_dispute_id=dispute_id
            )
        
        except Exception as e:
            logger.error(f"Error logging dispute activity: {e}")
            raise
    
    @staticmethod
    async def log_household_update(
        jurisdiction_id: str,
        description: str,
        updated_by_id: Optional[str] = None
    ) -> ActivityLog:
        """
        Log when household statistics are updated.
        """
        try:
            return await ActivityLogService.log_activity(
                jurisdiction_id=jurisdiction_id,
                activity_type="household_update",
                description=description,
                status="completed",
                related_user_id=updated_by_id
            )
        
        except Exception as e:
            logger.error(f"Error logging household update: {e}")
            raise
    
    @staticmethod
    async def log_leader_assignment(
        jurisdiction_id: str,
        leader_name: str,
        assigned_by_id: Optional[str] = None
    ) -> ActivityLog:
        """
        Log when a leader is assigned to a jurisdiction.
        """
        try:
            return await ActivityLogService.log_activity(
                jurisdiction_id=jurisdiction_id,
                activity_type="approval",
                description=f"{leader_name} assigned as jurisdiction leader",
                status="active",
                related_user_id=assigned_by_id
            )
        
        except Exception as e:
            logger.error(f"Error logging leader assignment: {e}")
            raise
