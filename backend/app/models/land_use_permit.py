from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PermitType(str, Enum):
    construction = "construction"
    subdivision = "subdivision"
    zoning_change = "zoning_change"
    environmental = "environmental"
    agricultural = "agricultural"
    commercial = "commercial"
    residential = "residential"
    mining = "mining"
    forestry = "forestry"


class PermitStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    expired = "expired"
    revoked = "revoked"
    renewed = "renewed"


class LandUsePermit(Document):
    """Manage land use permits, zoning changes, and development approvals"""
    
    # Related entities
    claim_id: str
    parcel_number: str
    owner_id: str
    owner_name: str
    
    # Permit details
    permit_type: PermitType
    permit_number: Optional[str] = None
    application_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Proposed use
    current_land_use: str
    proposed_land_use: str
    project_description: str
    project_value: Optional[float] = None
    
    # Area and scope
    affected_area: float  # in square meters
    plot_coverage: Optional[float] = None  # percentage
    building_height: Optional[float] = None  # in meters
    number_of_units: Optional[int] = None
    
    # Environmental and planning
    environmental_impact_assessed: bool = False
    environmental_clearance_number: Optional[str] = None
    zoning_compliance: bool = False
    master_plan_compliance: bool = False
    
    # Review and approval
    status: PermitStatus = PermitStatus.draft
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_date: Optional[datetime] = None
    review_notes: Optional[str] = None
    
    approved_by: Optional[str] = None  # Authority who approved
    approved_date: Optional[datetime] = None
    approval_conditions: List[str] = []
    
    rejection_reason: Optional[str] = None
    
    # Validity
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    is_renewable: bool = True
    renewal_count: int = 0
    
    # Fees and payments
    application_fee: float = 0.0
    permit_fee: float = 0.0
    total_fees: float = 0.0
    fees_paid: float = 0.0
    payment_status: str = "pending"  # pending, partial, paid
    
    # Supporting documents
    documents: List[dict] = []  # [{name, url, type, uploaded_date}]
    technical_drawings: List[str] = []  # URLs to drawings
    
    # Conditions and restrictions
    conditions: List[str] = []
    restrictions: List[str] = []
    
    # Compliance and inspection
    inspection_required: bool = False
    last_inspection_date: Optional[datetime] = None
    compliance_status: Optional[str] = None
    violations: List[dict] = []  # [{date, description, resolved}]
    
    # Additional information
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "land_use_permits"
        indexes = [
            "claim_id",
            "parcel_number",
            "owner_id",
            "permit_type",
            "status",
            "permit_number",
            "application_date",
            "expiry_date",
            [("owner_id", 1), ("application_date", -1)],
            [("status", 1), ("expiry_date", 1)],
        ]


# Pydantic Schemas for API
class PermitCreate(BaseModel):
    claim_id: str
    parcel_number: str
    owner_id: str
    owner_name: str
    permit_type: PermitType
    current_land_use: str
    proposed_land_use: str
    project_description: str
    project_value: Optional[float] = None
    affected_area: float
    plot_coverage: Optional[float] = None
    building_height: Optional[float] = None
    number_of_units: Optional[int] = None
    application_fee: float = 0.0
    permit_fee: float = 0.0
    notes: Optional[str] = None


class PermitReview(BaseModel):
    status: PermitStatus
    review_notes: Optional[str] = None
    approval_conditions: List[str] = []
    rejection_reason: Optional[str] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None


class PermitUpdate(BaseModel):
    status: Optional[PermitStatus] = None
    environmental_impact_assessed: Optional[bool] = None
    environmental_clearance_number: Optional[str] = None
    zoning_compliance: Optional[bool] = None
    fees_paid: Optional[float] = None
    payment_status: Optional[str] = None
    compliance_status: Optional[str] = None
    notes: Optional[str] = None


class PermitResponse(BaseModel):
    id: str
    claim_id: str
    parcel_number: str
    owner_name: str
    permit_type: str
    permit_number: Optional[str] = None
    application_date: datetime
    proposed_land_use: str
    project_description: str
    status: str
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    total_fees: float
    fees_paid: float
    payment_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class PermitStats(BaseModel):
    total_permits: int
    pending_permits: int
    approved_permits: int
    rejected_permits: int
    expired_permits: int
    permits_by_type: dict
    total_fees_collected: float
