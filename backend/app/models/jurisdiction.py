from beanie import Document
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class Jurisdiction(Document):
    """
    Jurisdiction model for managing geographic administrative areas.
    
    Each jurisdiction is managed by a local leader (chief, assistant chief, etc.)
    and contains claims, disputes, and households within its boundaries.
    """
    
    # Basic Information
    name: str  # e.g., "Kajiado North", "Kajiado South"
    code: str  # Unique identifier, e.g., "KJD-NORTH"
    level: str  # "county", "sub_county", "ward", "village"
    
    # Geographic Data
    boundary_coordinates: Dict  # GeoJSON polygon for map boundaries
    center_lat: float  # Center point latitude
    center_lon: float  # Center point longitude
    
    # Leadership
    assigned_leader_id: Optional[str] = None  # User ID of the leader
    leader_name: Optional[str] = None
    leader_title: str = "Local Leader"  # "Chief", "Assistant Chief", "Elder"
    
    # Statistics
    total_households: int = 0
    registered_households: int = 0
    active_disputes: int = 0
    pending_approvals: int = 0
    total_claims: int = 0
    approved_claims: int = 0
    rejected_claims: int = 0
    
    # Parent/Child Relationships
    parent_jurisdiction_id: Optional[str] = None
    child_jurisdictions: List[str] = []
    
    # Metadata
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    is_active: bool = True
    
    class Settings:
        name = "jurisdictions"
        indexes = [
            "code",
            "assigned_leader_id",
            "level",
            "parent_jurisdiction_id"
        ]


class JurisdictionCreate(BaseModel):
    """Schema for creating a new jurisdiction."""
    name: str
    code: str
    level: str
    boundary_coordinates: Dict
    center_lat: float
    center_lon: float
    leader_title: str = "Local Leader"
    parent_jurisdiction_id: Optional[str] = None


class JurisdictionUpdate(BaseModel):
    """Schema for updating jurisdiction."""
    name: Optional[str] = None
    boundary_coordinates: Optional[Dict] = None
    center_lat: Optional[float] = None
    center_lon: Optional[float] = None
    assigned_leader_id: Optional[str] = None
    leader_name: Optional[str] = None
    leader_title: Optional[str] = None
    is_active: Optional[bool] = None


class JurisdictionResponse(BaseModel):
    """Schema for jurisdiction API responses."""
    id: str
    name: str
    code: str
    level: str
    boundary_coordinates: Dict
    center_lat: float
    center_lon: float
    assigned_leader_id: Optional[str]
    leader_name: Optional[str]
    leader_title: str
    total_households: int
    registered_households: int
    active_disputes: int
    pending_approvals: int
    total_claims: int
    approved_claims: int
    rejected_claims: int
    parent_jurisdiction_id: Optional[str]
    created_at: str
    is_active: bool


class JurisdictionStats(BaseModel):
    """Schema for jurisdiction statistics."""
    jurisdiction_id: str
    jurisdiction_name: str
    total_households: int
    registered_households: int
    registration_percentage: float
    active_disputes: int
    pending_approvals: int
    total_claims: int
    approved_claims: int
    rejected_claims: int
    approval_rate: float
