from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field

class Claim(Document):
    user_id: str
    photo_url: str
    geolocation: dict  # {"latitude": float, "longitude": float}
    boundary: dict  # GeoJSON polygon
    status: str = Field(default="pending")  # "pending" | "validated" | "rejected"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Validation fields
    validation_status: str = Field(default="pending")  # "pending" | "partially_validated" | "fully_validated"
    endorsed_by_leader: bool = Field(default=False)
    witness_count: int = Field(default=0)

    class Settings:
        name = "claims"
        indexes = ["user_id", "status", "validation_status"]
