"""
Admin-specific request/response schemas for the Land Registry System.
"""

from pydantic import BaseModel, Field
from app.models.roles import UserRole


class RoleUpdateRequest(BaseModel):
    """
    Request model for updating a user's role.
    
    Used by Admin to promote or demote users by changing their roles.
    This supports the "Manage Users" use case where Admins assign
    "Local Leader" or "Community Member" privileges to residents.
    """
    role: UserRole = Field(
        ...,
        description="The new role to assign to the user",
        example=UserRole.COMMUNITY_MEMBER
    )
    
    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "role": "community_member"
            }
        }


class UserRoleResponse(BaseModel):
    """Response model for user role updates."""
    id: str = Field(..., description="User's unique identifier")
    name: str = Field(..., description="User's full name")
    email: str = Field(..., description="User's email address")
    role: UserRole = Field(..., description="User's current role")
    is_active: bool = Field(..., description="User's active status")
    
    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "John Doe",
                "email": "john.doe@example.com",
                "role": "community_member",
                "is_active": True
            }
        }
