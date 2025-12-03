from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import BaseModel, Field
from bson import ObjectId


class NotificationType(str):
    VALIDATION_RECEIVED = "validation_received"
    CONSENSUS_REACHED = "consensus_reached"
    CLAIM_VALIDATED = "claim_validated"
    CLAIM_REJECTED = "claim_rejected"
    BADGE_EARNED = "badge_earned"
    TRUST_SCORE_UPDATED = "trust_score_updated"
    NEW_CLAIM_NEARBY = "new_claim_nearby"
    DISPUTE_RAISED = "dispute_raised"
    VALIDATION_CORRECT = "validation_correct"
    VALIDATION_INCORRECT = "validation_incorrect"


class NotificationPriority(str):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Document):
    """Notification document for user alerts and updates"""
    user_id: str = Field(..., description="ID of user receiving notification")
    type: str = Field(..., description="Type of notification")
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification message/content")
    
    # Priority and status
    priority: str = Field(default="medium", description="Notification priority level")
    read: bool = Field(default=False, description="Whether notification has been read")
    
    # Related entities
    claim_id: Optional[str] = Field(None, description="Related claim ID")
    validation_id: Optional[str] = Field(None, description="Related validation ID")
    badge_id: Optional[str] = Field(None, description="Related badge ID")
    
    # Additional data
    data: Optional[dict] = Field(default_factory=dict, description="Additional notification data")
    action_url: Optional[str] = Field(None, description="URL for notification action")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = Field(None, description="When notification was read")
    expires_at: Optional[datetime] = Field(None, description="Optional expiration time")
    
    # Delivery tracking
    delivered: bool = Field(default=False, description="Whether notification was delivered")
    delivery_method: Optional[str] = Field(None, description="How notification was delivered (push, email, etc)")

    class Settings:
        name = "notifications"
        indexes = [
            "user_id",
            "type",
            "read",
            "created_at",
            [("user_id", 1), ("read", 1)],  # Compound index for unread notifications
            [("user_id", 1), ("created_at", -1)]  # Compound index for recent notifications
        ]


class NotificationPreference(Document):
    """User preferences for notification delivery"""
    user_id: str = Field(..., description="User ID")
    
    # Notification type preferences
    validation_received: bool = Field(default=True)
    consensus_reached: bool = Field(default=True)
    claim_validated: bool = Field(default=True)
    claim_rejected: bool = Field(default=True)
    badge_earned: bool = Field(default=True)
    trust_score_updated: bool = Field(default=True)
    new_claim_nearby: bool = Field(default=False)
    dispute_raised: bool = Field(default=True)
    validation_correct: bool = Field(default=True)
    validation_incorrect: bool = Field(default=True)
    
    # Delivery preferences
    in_app: bool = Field(default=True, description="Show in-app notifications")
    email: bool = Field(default=False, description="Send email notifications")
    push: bool = Field(default=False, description="Send push notifications")
    
    # Quiet hours
    quiet_hours_enabled: bool = Field(default=False)
    quiet_hours_start: Optional[str] = Field(None, description="Start time (HH:MM)")
    quiet_hours_end: Optional[str] = Field(None, description="End time (HH:MM)")
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notification_preferences"
        indexes = ["user_id"]


# Pydantic models for API requests/responses
class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    priority: str = "medium"
    claim_id: Optional[str] = None
    validation_id: Optional[str] = None
    badge_id: Optional[str] = None
    data: Optional[dict] = None
    action_url: Optional[str] = None


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    priority: str
    read: bool
    claim_id: Optional[str] = None
    validation_id: Optional[str] = None
    badge_id: Optional[str] = None
    data: Optional[dict] = None
    action_url: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }


class NotificationPreferenceResponse(BaseModel):
    user_id: str
    validation_received: bool
    consensus_reached: bool
    claim_validated: bool
    claim_rejected: bool
    badge_earned: bool
    trust_score_updated: bool
    new_claim_nearby: bool
    dispute_raised: bool
    validation_correct: bool
    validation_incorrect: bool
    in_app: bool
    email: bool
    push: bool
    quiet_hours_enabled: bool
    quiet_hours_start: Optional[str]
    quiet_hours_end: Optional[str]
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class NotificationStats(BaseModel):
    total: int
    unread: int
    by_type: dict
    by_priority: dict
