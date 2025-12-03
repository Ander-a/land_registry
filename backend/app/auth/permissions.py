from typing import Optional
from fastapi import Request, HTTPException, status
from functools import wraps
import logging

from app.models.user import User
from app.models.roles import UserRole

logger = logging.getLogger(__name__)


async def check_jurisdiction_access(user: User, jurisdiction_id: str) -> bool:
    """
    Check if a user has access to a specific jurisdiction.
    
    Args:
        user: The current user
        jurisdiction_id: The jurisdiction ID to check
    
    Returns:
        True if user has access, False otherwise
    """
    # Admins have access to all jurisdictions
    if user.role == UserRole.ADMIN:
        return True
    
    # Leaders have access to their assigned jurisdiction
    if user.role == UserRole.LOCAL_LEADER:
        return user.jurisdiction_id == jurisdiction_id
    
    # Community members and residents have access to their jurisdiction
    if user.role in [UserRole.COMMUNITY_MEMBER, UserRole.RESIDENT]:
        return user.jurisdiction_id == jurisdiction_id
    
    return False


async def check_approval_permission(user: User) -> bool:
    """
    Check if user has permission to approve claims.
    
    Args:
        user: The current user
    
    Returns:
        True if user can approve claims
    """
    # Admins and users with explicit approval permission
    if user.role == UserRole.ADMIN:
        return True
    
    # Local leaders with approval permission
    if user.role == UserRole.LOCAL_LEADER and user.can_approve_claims:
        return True
    
    return False


async def check_dispute_resolution_permission(user: User) -> bool:
    """
    Check if user has permission to resolve disputes.
    
    Args:
        user: The current user
    
    Returns:
        True if user can resolve disputes
    """
    # Admins and users with explicit dispute resolution permission
    if user.role == UserRole.ADMIN:
        return True
    
    # Local leaders with dispute resolution permission
    if user.role == UserRole.LOCAL_LEADER and user.can_resolve_disputes:
        return True
    
    return False


async def get_user_jurisdiction_filter(user: User) -> Optional[str]:
    """
    Get jurisdiction filter for user's data queries.
    
    Args:
        user: The current user
    
    Returns:
        Jurisdiction ID to filter by, or None for no filter (admins)
    """
    # Admins see everything
    if user.role == UserRole.ADMIN:
        return None
    
    # Others see only their jurisdiction
    return user.jurisdiction_id


def require_jurisdiction_access(jurisdiction_id_param: str = "jurisdiction_id"):
    """
    Decorator to require jurisdiction access.
    
    Args:
        jurisdiction_id_param: Name of the parameter containing jurisdiction_id
    
    Usage:
        @require_jurisdiction_access("jurisdiction_id")
        async def get_jurisdiction_data(jurisdiction_id: str, user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get user from kwargs (should be injected by Depends)
            user = kwargs.get('current_user') or kwargs.get('user')
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Get jurisdiction_id from kwargs
            jurisdiction_id = kwargs.get(jurisdiction_id_param)
            if not jurisdiction_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing {jurisdiction_id_param} parameter"
                )
            
            # Check access
            has_access = await check_jurisdiction_access(user, jurisdiction_id)
            if not has_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No access to this jurisdiction"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_approval_permission():
    """
    Decorator to require claim approval permission.
    
    Usage:
        @require_approval_permission()
        async def approve_claim(claim_id: str, user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = kwargs.get('current_user') or kwargs.get('user')
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            has_permission = await check_approval_permission(user)
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No permission to approve claims"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def require_dispute_permission():
    """
    Decorator to require dispute resolution permission.
    
    Usage:
        @require_dispute_permission()
        async def resolve_dispute(dispute_id: str, user: User = Depends(get_current_user)):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = kwargs.get('current_user') or kwargs.get('user')
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            has_permission = await check_dispute_resolution_permission(user)
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No permission to resolve disputes"
                )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def filter_claims_by_jurisdiction(user: User, claims_query):
    """
    Apply jurisdiction filter to claims query based on user role.
    
    Args:
        user: Current user
        claims_query: Beanie query object
    
    Returns:
        Filtered query
    """
    jurisdiction_id = await get_user_jurisdiction_filter(user)
    
    if jurisdiction_id:
        # Filter by jurisdiction
        from app.models.claim import Claim
        return claims_query.find(Claim.jurisdiction_id == jurisdiction_id)
    
    # Admins see all
    return claims_query


async def filter_disputes_by_jurisdiction(user: User, disputes_query):
    """
    Apply jurisdiction filter to disputes query based on user role.
    
    Args:
        user: Current user
        disputes_query: Beanie query object
    
    Returns:
        Filtered query
    """
    jurisdiction_id = await get_user_jurisdiction_filter(user)
    
    if jurisdiction_id:
        # Filter by jurisdiction
        # Note: Will need to add jurisdiction_id to Dispute model
        return disputes_query
    
    # Admins see all
    return disputes_query
