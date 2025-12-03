from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from ..models.roles import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = Field(default=UserRole.RESIDENT)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserRead(BaseModel):
    """Schema for reading user data (response model)."""
    id: str  # MongoDB ObjectId as string
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True


class UserUpdate(BaseModel):
    """Schema for updating user data."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserRead
