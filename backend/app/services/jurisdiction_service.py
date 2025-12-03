from typing import Optional
from datetime import datetime
import logging

from app.models.jurisdiction import Jurisdiction
from app.models.claim import Claim
from app.models.user import User

logger = logging.getLogger(__name__)


class JurisdictionService:
    """
    Service layer for jurisdiction management and statistics.
    """
    
    @staticmethod
    async def calculate_statistics(jurisdiction_id: str) -> dict:
        """
        Calculate all statistics for a jurisdiction.
        Returns a dictionary with all calculated stats.
        """
        try:
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            if not jurisdiction:
                raise ValueError(f"Jurisdiction {jurisdiction_id} not found")
            
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
            
            # Calculate percentages
            registration_percentage = 0.0
            if jurisdiction.total_households > 0:
                registration_percentage = (jurisdiction.registered_households / jurisdiction.total_households) * 100
            
            approval_rate = 0.0
            if total_claims > 0:
                approval_rate = (approved_claims / total_claims) * 100
            
            return {
                "total_claims": total_claims,
                "approved_claims": approved_claims,
                "rejected_claims": rejected_claims,
                "pending_approvals": pending_approvals,
                "registration_percentage": round(registration_percentage, 2),
                "approval_rate": round(approval_rate, 2)
            }
        
        except Exception as e:
            logger.error(f"Error calculating jurisdiction statistics: {e}")
            raise
    
    @staticmethod
    async def update_statistics(jurisdiction_id: str) -> Jurisdiction:
        """
        Recalculate and update jurisdiction statistics in the database.
        Returns the updated jurisdiction.
        """
        try:
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            if not jurisdiction:
                raise ValueError(f"Jurisdiction {jurisdiction_id} not found")
            
            # Get calculated statistics
            stats = await JurisdictionService.calculate_statistics(jurisdiction_id)
            
            # Update jurisdiction
            jurisdiction.total_claims = stats["total_claims"]
            jurisdiction.approved_claims = stats["approved_claims"]
            jurisdiction.rejected_claims = stats["rejected_claims"]
            jurisdiction.pending_approvals = stats["pending_approvals"]
            jurisdiction.updated_at = datetime.utcnow()
            
            await jurisdiction.save()
            
            logger.info(f"Updated statistics for jurisdiction {jurisdiction_id}")
            return jurisdiction
        
        except Exception as e:
            logger.error(f"Error updating jurisdiction statistics: {e}")
            raise
    
    @staticmethod
    async def assign_leader(
        jurisdiction_id: str,
        leader_id: str,
        leader_level: str = "chief"
    ) -> tuple[Jurisdiction, User]:
        """
        Assign a leader to a jurisdiction.
        Updates both jurisdiction and user records.
        Returns tuple of (jurisdiction, user).
        """
        try:
            # Get jurisdiction
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            if not jurisdiction:
                raise ValueError(f"Jurisdiction {jurisdiction_id} not found")
            
            # Get user
            user = await User.get(leader_id)
            if not user:
                raise ValueError(f"User {leader_id} not found")
            
            # Update jurisdiction
            jurisdiction.assigned_leader_id = str(user.id)
            jurisdiction.leader_name = user.full_name
            jurisdiction.updated_at = datetime.utcnow()
            await jurisdiction.save()
            
            # Update user
            user.jurisdiction_id = jurisdiction_id
            user.jurisdiction_name = jurisdiction.name
            user.leader_level = leader_level
            user.role = "local_leader"  # Update role
            await user.save()
            
            logger.info(f"Assigned leader {leader_id} to jurisdiction {jurisdiction_id}")
            return jurisdiction, user
        
        except Exception as e:
            logger.error(f"Error assigning leader: {e}")
            raise
    
    @staticmethod
    async def unassign_leader(jurisdiction_id: str) -> Jurisdiction:
        """
        Remove the assigned leader from a jurisdiction.
        Returns the updated jurisdiction.
        """
        try:
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            if not jurisdiction:
                raise ValueError(f"Jurisdiction {jurisdiction_id} not found")
            
            # Get current leader
            if jurisdiction.assigned_leader_id:
                leader = await User.get(jurisdiction.assigned_leader_id)
                if leader:
                    # Clear user's jurisdiction
                    leader.jurisdiction_id = None
                    leader.jurisdiction_name = None
                    leader.leader_level = None
                    leader.role = "community_member"  # Revert role
                    await leader.save()
            
            # Clear jurisdiction's leader
            jurisdiction.assigned_leader_id = None
            jurisdiction.leader_name = None
            jurisdiction.updated_at = datetime.utcnow()
            await jurisdiction.save()
            
            logger.info(f"Unassigned leader from jurisdiction {jurisdiction_id}")
            return jurisdiction
        
        except Exception as e:
            logger.error(f"Error unassigning leader: {e}")
            raise
    
    @staticmethod
    async def update_household_stats(
        jurisdiction_id: str,
        total_households: Optional[int] = None,
        registered_households: Optional[int] = None
    ) -> Jurisdiction:
        """
        Update household statistics for a jurisdiction.
        Returns the updated jurisdiction.
        """
        try:
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            if not jurisdiction:
                raise ValueError(f"Jurisdiction {jurisdiction_id} not found")
            
            if total_households is not None:
                jurisdiction.total_households = total_households
            
            if registered_households is not None:
                jurisdiction.registered_households = registered_households
            
            jurisdiction.updated_at = datetime.utcnow()
            await jurisdiction.save()
            
            logger.info(f"Updated household stats for jurisdiction {jurisdiction_id}")
            return jurisdiction
        
        except Exception as e:
            logger.error(f"Error updating household stats: {e}")
            raise
    
    @staticmethod
    async def get_child_jurisdictions(jurisdiction_id: str) -> list[Jurisdiction]:
        """
        Get all child jurisdictions for a parent jurisdiction.
        """
        try:
            children = await Jurisdiction.find(
                Jurisdiction.parent_jurisdiction_id == jurisdiction_id,
                Jurisdiction.is_active == True
            ).to_list()
            
            return children
        
        except Exception as e:
            logger.error(f"Error getting child jurisdictions: {e}")
            raise
    
    @staticmethod
    async def deactivate_jurisdiction(jurisdiction_id: str) -> Jurisdiction:
        """
        Deactivate a jurisdiction (soft delete).
        Returns the updated jurisdiction.
        """
        try:
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            if not jurisdiction:
                raise ValueError(f"Jurisdiction {jurisdiction_id} not found")
            
            jurisdiction.is_active = False
            jurisdiction.updated_at = datetime.utcnow()
            await jurisdiction.save()
            
            logger.info(f"Deactivated jurisdiction {jurisdiction_id}")
            return jurisdiction
        
        except Exception as e:
            logger.error(f"Error deactivating jurisdiction: {e}")
            raise
    
    @staticmethod
    async def activate_jurisdiction(jurisdiction_id: str) -> Jurisdiction:
        """
        Reactivate a jurisdiction.
        Returns the updated jurisdiction.
        """
        try:
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            if not jurisdiction:
                raise ValueError(f"Jurisdiction {jurisdiction_id} not found")
            
            jurisdiction.is_active = True
            jurisdiction.updated_at = datetime.utcnow()
            await jurisdiction.save()
            
            logger.info(f"Activated jurisdiction {jurisdiction_id}")
            return jurisdiction
        
        except Exception as e:
            logger.error(f"Error activating jurisdiction: {e}")
            raise
