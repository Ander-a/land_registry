"""
Certificate Model
Represents land title certificates issued for approved properties
"""
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class Certificate(Document):
    """Land Title Certificate"""
    
    # Related entities
    claim_id: str
    parcel_number: str
    user_id: str
    
    # Certificate details
    certificate_number: str = Field(unique=True)
    issued_date: datetime = Field(default_factory=datetime.utcnow)
    issuer_id: Optional[str] = None
    
    # Blockchain reference
    blockchain_hash: Optional[str] = None
    
    # Status
    status: str = Field(default="issued")  # issued, revoked, suspended
    revoked_at: Optional[datetime] = None
    revoked_by: Optional[str] = None
    revoke_reason: Optional[str] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "certificates"
        indexes = [
            "claim_id",
            "parcel_number",
            "user_id",
            "certificate_number",
            "issued_date"
        ]
