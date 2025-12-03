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

    class Settings:
        name = "users"
        indexes = [
            "email",  # Single field index for email lookups
            "role",   # Index for role-based queries
        ]
    
    class Config:
        """Pydantic v2 configuration."""
        use_enum_values = True  # Store enum values as strings in DB
        populate_by_name = True  # Allow field population by alias
