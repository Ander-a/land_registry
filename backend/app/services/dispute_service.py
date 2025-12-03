from typing import Optional, List
from datetime import datetime
import logging

from app.models.dispute import Dispute, DisputeResolution, DisputeEvidence
from app.models.jurisdiction import Jurisdiction
from app.models.claim import Claim
from app.services.activity_log_service import ActivityLogService

logger = logging.getLogger(__name__)


class DisputeService:
    """
    Service layer for dispute management and resolution.
    """
    
    @staticmethod
    async def create_dispute(
        claim_id: str,
        jurisdiction_id: str,
        dispute_type: str,
        title: str,
        description: str,
        created_by_id: str,
        created_by_name: str,
        **kwargs
    ) -> Dispute:
        """
        Create a new dispute.
        """
        try:
            # Get claim and jurisdiction details
            claim = await Claim.get(claim_id)
            jurisdiction = await Jurisdiction.get(jurisdiction_id)
            
            dispute = Dispute(
                claim_id=claim_id,
                jurisdiction_id=jurisdiction_id,
                jurisdiction_name=jurisdiction.name if jurisdiction else kwargs.get('jurisdiction_name', ''),
                parcel_number=claim.parcel_number if claim else kwargs.get('parcel_number'),
                dispute_type=dispute_type,
                title=title,
                description=description,
                created_by_id=created_by_id,
                created_by_name=created_by_name,
                parties=kwargs.get('parties', []),
                priority=kwargs.get('priority', 'medium'),
                status='open'
            )
            
            await dispute.save()
            
            # Log activity
            try:
                await ActivityLogService.log_dispute_activity(
                    dispute_id=str(dispute.id),
                    jurisdiction_id=jurisdiction_id,
                    activity_type='dispute',
                    description=f"New {dispute_type} dispute filed: {title}",
                    status='active',
                    related_user_id=created_by_id
                )
            except Exception as log_error:
                logger.warning(f"Failed to log dispute creation: {log_error}")
            
            logger.info(f"Created dispute {dispute.id} for claim {claim_id}")
            return dispute
            
        except Exception as e:
            logger.error(f"Error creating dispute: {e}")
            raise
    
    @staticmethod
    async def assign_dispute(
        dispute_id: str,
        assigned_to_id: str,
        assigned_to_name: str
    ) -> Dispute:
        """
        Assign a dispute to a leader for resolution.
        """
        try:
            dispute = await Dispute.get(dispute_id)
            if not dispute:
                raise ValueError(f"Dispute {dispute_id} not found")
            
            dispute.assigned_to_id = assigned_to_id
            dispute.assigned_to_name = assigned_to_name
            dispute.status = 'investigating'
            dispute.last_updated = datetime.utcnow()
            
            await dispute.save()
            
            # Log activity
            try:
                await ActivityLogService.log_dispute_activity(
                    dispute_id=dispute_id,
                    jurisdiction_id=dispute.jurisdiction_id,
                    activity_type='dispute',
                    description=f"Dispute assigned to {assigned_to_name} for investigation",
                    status='active',
                    related_user_id=assigned_to_id
                )
            except Exception as log_error:
                logger.warning(f"Failed to log dispute assignment: {log_error}")
            
            logger.info(f"Assigned dispute {dispute_id} to {assigned_to_name}")
            return dispute
            
        except Exception as e:
            logger.error(f"Error assigning dispute: {e}")
            raise
    
    @staticmethod
    async def add_evidence(
        dispute_id: str,
        evidence_type: str,
        description: str,
        submitted_by: str,
        submitted_by_name: str,
        file_url: Optional[str] = None
    ) -> Dispute:
        """
        Add evidence to a dispute.
        """
        try:
            dispute = await Dispute.get(dispute_id)
            if not dispute:
                raise ValueError(f"Dispute {dispute_id} not found")
            
            evidence = DisputeEvidence(
                evidence_type=evidence_type,
                description=description,
                file_url=file_url,
                submitted_by=submitted_by,
                submitted_by_name=submitted_by_name
            )
            
            dispute.evidence.append(evidence)
            dispute.last_updated = datetime.utcnow()
            
            await dispute.save()
            
            logger.info(f"Added {evidence_type} evidence to dispute {dispute_id}")
            return dispute
            
        except Exception as e:
            logger.error(f"Error adding evidence: {e}")
            raise
    
    @staticmethod
    async def resolve_dispute(
        dispute_id: str,
        decision: str,
        resolution_summary: str,
        resolved_by_id: str,
        resolved_by_name: str,
        resolved_by_title: str,
        notes: Optional[str] = None
    ) -> Dispute:
        """
        Resolve a dispute with a decision.
        """
        try:
            dispute = await Dispute.get(dispute_id)
            if not dispute:
                raise ValueError(f"Dispute {dispute_id} not found")
            
            resolution = DisputeResolution(
                decision=decision,
                resolution_summary=resolution_summary,
                resolved_by_id=resolved_by_id,
                resolved_by_name=resolved_by_name,
                resolved_by_title=resolved_by_title,
                notes=notes
            )
            
            dispute.resolution = resolution
            dispute.status = 'resolved'
            dispute.last_updated = datetime.utcnow()
            dispute.closed_at = datetime.utcnow()
            
            await dispute.save()
            
            # Update jurisdiction stats
            jurisdiction = await Jurisdiction.get(dispute.jurisdiction_id)
            if jurisdiction and jurisdiction.active_disputes > 0:
                jurisdiction.active_disputes -= 1
                await jurisdiction.save()
            
            # Log activity
            try:
                await ActivityLogService.log_dispute_activity(
                    dispute_id=dispute_id,
                    jurisdiction_id=dispute.jurisdiction_id,
                    activity_type='dispute',
                    description=f"Dispute resolved: {decision} by {resolved_by_name}",
                    status='closed',
                    related_user_id=resolved_by_id
                )
            except Exception as log_error:
                logger.warning(f"Failed to log dispute resolution: {log_error}")
            
            logger.info(f"Resolved dispute {dispute_id} with decision: {decision}")
            return dispute
            
        except Exception as e:
            logger.error(f"Error resolving dispute: {e}")
            raise
    
    @staticmethod
    async def update_dispute_status(
        dispute_id: str,
        status: str,
        priority: Optional[str] = None
    ) -> Dispute:
        """
        Update dispute status and/or priority.
        """
        try:
            dispute = await Dispute.get(dispute_id)
            if not dispute:
                raise ValueError(f"Dispute {dispute_id} not found")
            
            old_status = dispute.status
            dispute.status = status
            
            if priority:
                dispute.priority = priority
            
            dispute.last_updated = datetime.utcnow()
            
            if status == 'closed' and not dispute.closed_at:
                dispute.closed_at = datetime.utcnow()
            
            await dispute.save()
            
            logger.info(f"Updated dispute {dispute_id} status from {old_status} to {status}")
            return dispute
            
        except Exception as e:
            logger.error(f"Error updating dispute status: {e}")
            raise
    
    @staticmethod
    async def get_jurisdiction_disputes(
        jurisdiction_id: str,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        dispute_type: Optional[str] = None
    ) -> List[Dispute]:
        """
        Get all disputes for a jurisdiction with optional filters.
        """
        try:
            query = {"jurisdiction_id": jurisdiction_id}
            
            if status:
                query["status"] = status
            
            if priority:
                query["priority"] = priority
            
            if dispute_type:
                query["dispute_type"] = dispute_type
            
            disputes = await Dispute.find(query).sort("-filed_at").to_list()
            
            return disputes
            
        except Exception as e:
            logger.error(f"Error getting jurisdiction disputes: {e}")
            raise
