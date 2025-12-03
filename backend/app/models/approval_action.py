from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ApprovalDecision(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    CONDITIONAL = "conditional"
    REFERRED = "referred"


class ApprovalAction(Document):
    """
    Document to track approval/rejection actions on claims.
    Provides detailed audit trail of leadership decisions.
    """
    claim_id: str
    jurisdiction_id: str
    decision: ApprovalDecision
    
    # Leader information
    leader_id: str
    leader_name: str
    leader_title: Optional[str] = None
    
    # Decision details
    reason: str  # Detailed reason for the decision
    recommendations: Optional[str] = None  # Recommendations for claimant
    conditions: Optional[List[str]] = None  # Conditions for conditional approval
    
    # Evidence review
    evidence_reviewed: bool = False
    validation_consensus_reviewed: bool = False
    ai_analysis_reviewed: bool = False
    
    # Timestamps
    action_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata
    notes: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None
    
    class Settings:
        name = "approval_actions"
        indexes = [
            "claim_id",
            "jurisdiction_id",
            "leader_id",
            "decision",
            "action_date",
            [("jurisdiction_id", 1), ("decision", 1)],
            [("claim_id", 1), ("action_date", -1)]
        ]


# Pydantic Schemas for API
class ApprovalActionCreate(BaseModel):
    claim_id: str
    decision: ApprovalDecision
    reason: str
    recommendations: Optional[str] = None
    conditions: Optional[List[str]] = None
    evidence_reviewed: bool = False
    validation_consensus_reviewed: bool = False
    ai_analysis_reviewed: bool = False
    notes: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[datetime] = None


class BatchApprovalRequest(BaseModel):
    claim_ids: List[str]
    decision: ApprovalDecision
    reason: str
    recommendations: Optional[str] = None
    conditions: Optional[List[str]] = None
    notes: Optional[str] = None


class ApprovalActionResponse(BaseModel):
    id: str
    claim_id: str
    jurisdiction_id: str
    decision: ApprovalDecision
    leader_id: str
    leader_name: str
    leader_title: Optional[str]
    reason: str
    recommendations: Optional[str]
    conditions: Optional[List[str]]
    evidence_reviewed: bool
    validation_consensus_reviewed: bool
    ai_analysis_reviewed: bool
    action_date: str
    notes: Optional[str]
    follow_up_required: bool
    follow_up_date: Optional[str]


class ApprovalStats(BaseModel):
    """Statistics for approval performance"""
    total_processed: int
    approved_count: int
    rejected_count: int
    conditional_count: int
    referred_count: int
    approval_rate: float
    avg_processing_time_hours: Optional[float]
    pending_count: int
    follow_ups_required: int
