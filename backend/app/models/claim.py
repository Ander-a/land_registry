from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field

class Claim(Document):
    user_id: str
    claimant_name: str  # Name of the person making the claim
    claimant_email: str  # Email of the claimant
    photo_url: str
    geolocation: dict  # {"latitude": float, "longitude": float}
    boundary: dict  # GeoJSON polygon
    plot_area: Optional[float] = None  # Area in hectares
    status: str = Field(default="pending")  # "pending" | "validated" | "rejected" | "under_review"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    validated_at: Optional[datetime] = None  # Timestamp when consensus was reached
    
    # Validation fields
    validation_status: str = Field(default="pending")  # "pending" | "partially_validated" | "fully_validated"
    endorsed_by_leader: bool = Field(default=False)
    witness_count: int = Field(default=0)
    
    # Additional fields for community validation
    location: Optional[str] = None  # Human-readable location
    coordinates: Optional[dict] = None  # {"lat": float, "lon": float} for consistency with validation
    
    # Jurisdiction fields
    jurisdiction_id: Optional[str] = None  # Jurisdiction this claim belongs to
    jurisdiction_name: Optional[str] = None  # For display purposes
    parcel_number: Optional[str] = None  # Official parcel number (e.g., "KJD-12345")

    class Settings:
        name = "claims"
        indexes = ["user_id", "status", "validation_status", "jurisdiction_id"]
