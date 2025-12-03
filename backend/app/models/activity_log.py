from beanie import Document
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ActivityLog(Document):
    """
    Activity log for tracking all actions within a jurisdiction.
    
    This provides audit trail and recent activity feed for leaders.
    """
    
    # Jurisdiction Context
    jurisdiction_id: str
    jurisdiction_name: str
    
    # Activity Details
    activity_type: str  # "claim", "dispute", "approval", "validation", "household_update"
    description: str  # Human-readable description
    
    # Related Entities
    related_user_id: str  # User who performed the action
    related_user_name: str
    related_claim_id: Optional[str] = None
    related_dispute_id: Optional[str] = None
    related_parcel_number: Optional[str] = None
    
    # Status
    status: str  # "pending", "approved", "rejected", "closed", "active", "completed"
    status_color: str = "blue"  # For UI display: "blue", "green", "red", "yellow", "gray"
    
    # Metadata
    timestamp: datetime = datetime.utcnow()
    
    class Settings:
        name = "activity_logs"
        indexes = [
            "jurisdiction_id",
            "activity_type",
            "status",
            "timestamp",
            ("jurisdiction_id", "timestamp"),  # Compound index for recent activities
            ("jurisdiction_id", "activity_type"),  # Filter by type within jurisdiction
        ]


class ActivityLogCreate(BaseModel):
    """Schema for creating activity log entry."""
    jurisdiction_id: str
    jurisdiction_name: str
    activity_type: str
    description: str
    related_user_id: str
    related_user_name: str
    related_claim_id: Optional[str] = None
    related_dispute_id: Optional[str] = None
    related_parcel_number: Optional[str] = None
    status: str
    status_color: str = "blue"


class ActivityLogResponse(BaseModel):
    """Schema for activity log API response."""
    id: str
    jurisdiction_id: str
    activity_type: str
    description: str
    related_user_name: str
    related_parcel_number: Optional[str]
    status: str
    status_color: str
    timestamp: str
