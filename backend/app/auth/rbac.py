"""
Role-Based Access Control (RBAC) Dependencies for FastAPI

This module provides reusable dependency classes for enforcing
role-based access control in protected routes.
"""

from typing import List
from fastapi import Depends, HTTPException, status
from ..models.user import User
from ..models.roles import UserRole
from .auth import JWTBearer


class RoleChecker:
    """
    Reusable dependency class for role-based access control.
    
    This class checks if the current authenticated user has one of the
    allowed roles. If not, it raises a 403 Forbidden exception.
    
    Usage:
        @app.get("/admin-only", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
        async def admin_route():
            return {"message": "Admin access granted"}
    
    Attributes:
        allowed_roles: List of UserRole enums that are permitted to access the route
    """
    
    def __init__(self, allowed_roles: List[UserRole]):
        """
        Initialize the RoleChecker with a list of allowed roles.
        
        Args:
            allowed_roles: List of UserRole enum values that can access the route
        """
        self.allowed_roles = allowed_roles
    
    async def __call__(self, current_user: User = Depends(JWTBearer())):
        """
        Check if the current user has an allowed role.
        
        Args:
            current_user: The authenticated user from JWT token
            
        Returns:
            User: The current user if role is authorized
            
        Raises:
            HTTPException: 403 Forbidden if user role is not in allowed_roles
            HTTPException: 403 Forbidden if user account is inactive
        """
        # Check if user account is active
        if not current_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        # Check if user role is in allowed roles
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in self.allowed_roles]}"
            )
        
        return current_user


class RequireAdmin(RoleChecker):
    """Dependency that requires ADMIN role."""
    
    def __init__(self):
        super().__init__([UserRole.ADMIN])


class RequireValidator(RoleChecker):
    """
    Dependency that requires validator roles (COMMUNITY_MEMBER or LOCAL_LEADER).
    Used for community validation and endorsement endpoints.
    """
    
    def __init__(self):
        super().__init__([UserRole.COMMUNITY_MEMBER, UserRole.LOCAL_LEADER])


class RequireLeader(RoleChecker):
    """Dependency that requires LOCAL_LEADER role."""
    
    def __init__(self):
        super().__init__([UserRole.LOCAL_LEADER])


class RequireResident(RoleChecker):
    """Dependency that requires RESIDENT role."""
    
    def __init__(self):
        super().__init__([UserRole.RESIDENT])


# Convenient pre-configured instances for common use cases
require_admin = RequireAdmin()
require_validator = RequireValidator()
require_leader = RequireLeader()
require_resident = RequireResident()
