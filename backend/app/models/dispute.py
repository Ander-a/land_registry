from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class DisputeParty(BaseModel):
    """Party involved in a dispute"""
    user_id: str
    name: str
    email: str
    role: str  # "claimant", "disputer", "witness"


class DisputeEvidence(BaseModel):
    """Evidence submitted for a dispute"""
    evidence_type: str  # "document", "photo", "testimony", "survey"
    description: str
    file_url: Optional[str] = None
    submitted_by: str
    submitted_by_name: str
    submitted_at: datetime = Field(default_factory=datetime.utcnow)


class DisputeResolution(BaseModel):
    """Resolution details for a dispute"""
    decision: str  # "upheld", "dismissed", "mediated", "referred"
    resolution_summary: str
    resolved_by_id: str
    resolved_by_name: str
    resolved_by_title: str
    resolved_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


class Dispute(Document):
    """
    Dispute model for land claim disputes.
    Handles conflicts between parties regarding land claims.
    """
    
    # Related entities
    claim_id: str
    jurisdiction_id: str
    jurisdiction_name: str
    parcel_number: Optional[str] = None
    
    # Dispute information
    dispute_type: str  # "boundary", "ownership", "documentation", "survey", "other"
    title: str
    description: str
    
    # Parties involved
    parties: List[DisputeParty] = []
    
    # Evidence
    evidence: List[DisputeEvidence] = []
    
    # Status tracking
    status: str = "open"  # "open", "investigating", "resolved", "closed"
    priority: str = "medium"  # "low", "medium", "high", "urgent"
    
    # Resolution
    resolution: Optional[DisputeResolution] = None
    
    # Timestamps
    filed_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None
    
    # Metadata
    created_by_id: str
    created_by_name: str
    assigned_to_id: Optional[str] = None  # Leader assigned to resolve
    assigned_to_name: Optional[str] = None
    
    class Settings:
        name = "disputes"
        indexes = [
            "claim_id",
            "jurisdiction_id",
            "status",
            "priority",
            "dispute_type",
            [("jurisdiction_id", 1), ("status", 1)],
            [("jurisdiction_id", 1), ("filed_at", -1)],
        ]


# Pydantic schemas for API
class DisputeCreate(BaseModel):
    """Schema for creating a new dispute"""
    claim_id: str
    jurisdiction_id: str
    jurisdiction_name: str
    parcel_number: Optional[str] = None
    dispute_type: str
    title: str
    description: str
    parties: List[DisputeParty] = []
    priority: str = "medium"


class DisputeUpdate(BaseModel):
    """Schema for updating a dispute"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None


class EvidenceSubmit(BaseModel):
    """Schema for submitting evidence"""
    evidence_type: str
    description: str
    file_url: Optional[str] = None


class DisputeResolve(BaseModel):
    """Schema for resolving a dispute"""
    decision: str
    resolution_summary: str
    notes: Optional[str] = None


class DisputeResponse(BaseModel):
    """Schema for dispute API responses"""
    id: str
    claim_id: str
    jurisdiction_id: str
    jurisdiction_name: str
    parcel_number: Optional[str]
    dispute_type: str
    title: str
    description: str
    parties: List[DisputeParty]
    evidence_count: int
    status: str
    priority: str
    resolution: Optional[DisputeResolution]
    filed_at: str
    last_updated: str
    closed_at: Optional[str]
    created_by_name: str
    assigned_to_name: Optional[str]


class DisputeDetailResponse(BaseModel):
    """Schema for detailed dispute response with evidence"""
    id: str
    claim_id: str
    jurisdiction_id: str
    jurisdiction_name: str
    parcel_number: Optional[str]
    dispute_type: str
    title: str
    description: str
    parties: List[DisputeParty]
    evidence: List[DisputeEvidence]
    status: str
    priority: str
    resolution: Optional[DisputeResolution]
    filed_at: str
    last_updated: str
    closed_at: Optional[str]
    created_by_id: str
    created_by_name: str
    assigned_to_id: Optional[str]
    assigned_to_name: Optional[str]
