from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field, EmailStr
from .roles import UserRole


class User(Document):
    """
    MongoDB Document Model for User collection using Beanie ODM.
    
    This replaces traditional SQL table structure with a NoSQL document model
    optimized for async operations with Motor driver.
    """
    name: str
    email: Indexed(EmailStr, unique=True)  # Indexed and unique email field
    hashed_password: str = Field(alias="password_hash")  # Alias for backward compatibility
    role: UserRole = Field(default=UserRole.RESIDENT)  # Enum-based role with default
    is_active: bool = Field(default=True)  # Active status flag
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Community validation fields
    trust_score: float = Field(default=50.0, description="Validator trust score (0-100)")
    validations_count: int = Field(default=0, description="Total validations performed")
    successful_validations: int = Field(default=0, description="Correct validations")
    accuracy_rate: float = Field(default=0.0, description="Percentage of correct validations")
    
    # Jurisdiction and leadership fields
    jurisdiction_id: Optional[str] = Field(default=None, description="Assigned jurisdiction ID")
    jurisdiction_name: Optional[str] = Field(default=None, description="Jurisdiction name for display")
    leader_level: Optional[str] = Field(default=None, description="Leadership level: chief, assistant_chief, elder, or null")
    can_approve_claims: bool = Field(default=False, description="Permission to approve land claims")
    can_resolve_disputes: bool = Field(default=False, description="Permission to resolve disputes")

    class Settings:
        name = "users"
        indexes = [
            "email",  # Single field index for email lookups
            "role",   # Index for role-based queries
            "jurisdiction_id",  # Index for jurisdiction-based queries
        ]
    
    class Config:
        """Pydantic v2 configuration."""
        use_enum_values = True  # Store enum values as strings in DB
        populate_by_name = True  # Allow field population by alias
