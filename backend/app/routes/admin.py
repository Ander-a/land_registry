"""
Admin Routes for User Management

This module handles administrative operations including user role management,
which is required for the "Manage Users" use case where admins assign
privileges to residents.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from beanie import PydanticObjectId
from datetime import datetime

from app.models.user import User
from app.models.roles import UserRole
from app.schemas.admin import RoleUpdateRequest, UserRoleResponse
from app.auth.rbac import RoleChecker

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.patch(
    "/users/{user_id}/role",
    response_model=UserRoleResponse,
    status_code=status.HTTP_200_OK,
    summary="Update User Role",
    description="""
    Update a user's role (Admin only).
    
    This endpoint allows administrators to promote or demote users by changing
    their roles. This is essential for the "Manage Users" use case where an
    Admin assigns "Local Leader" or "Community Member" privileges to specific
    residents.
    
    **Permissions:** ADMIN only
    
    **Supported Role Changes:**
    - RESIDENT → COMMUNITY_MEMBER (promote to validator)
    - RESIDENT → LOCAL_LEADER (promote to endorser)
    - COMMUNITY_MEMBER → LOCAL_LEADER (promote validator to leader)
    - LOCAL_LEADER → COMMUNITY_MEMBER (demote leader to validator)
    - Any role → RESIDENT (demote to basic user)
    
    **Note:** Admins cannot demote themselves to prevent lockout.
    """,
    dependencies=[Depends(RoleChecker([UserRole.ADMIN]))]
)
async def update_user_role(
    user_id: str,
    role_update: RoleUpdateRequest,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """
    Update a user's role.
    
    Args:
        user_id: The ID of the user to update
        role_update: The new role to assign
        current_user: The authenticated admin user (injected by dependency)
    
    Returns:
        UserRoleResponse: The updated user object
    
    Raises:
        HTTPException 404: If user not found
        HTTPException 400: If trying to modify own role or invalid operation
        HTTPException 403: If not admin (handled by dependency)
    """
    # Validate ObjectId format
    try:
        object_id = PydanticObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Fetch the target user from MongoDB
    target_user = await User.get(object_id)
    
    # Check if user exists
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Prevent admin from modifying their own role (security measure)
    if str(target_user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own role. Ask another admin."
        )
    
    # Store old role for logging/audit purposes
    old_role = target_user.role
    
    # Update the user's role
    target_user.role = role_update.role
    target_user.updated_at = datetime.utcnow()
    
    # Save changes to MongoDB using Beanie's save method
    await target_user.save()
    
    # Return the updated user object
    return UserRoleResponse(
        id=str(target_user.id),
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        is_active=target_user.is_active
    )


@router.get(
    "/users",
    response_model=list[UserRoleResponse],
    summary="List All Users",
    description="Get a list of all users in the system (Admin only)",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN]))]
)
async def list_users(
    role: UserRole | None = None,
    is_active: bool | None = None,
    skip: int = 0,
    limit: int = 100
):
    """
    List all users with optional filtering.
    
    Args:
        role: Filter by specific role
        is_active: Filter by active status
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
    
    Returns:
        List of users matching the criteria
    """
    # Build query filter
    query_filter = {}
    if role:
        query_filter["role"] = role
    if is_active is not None:
        query_filter["is_active"] = is_active
    
    # Fetch users from MongoDB
    users = await User.find(query_filter).skip(skip).limit(limit).to_list()
    
    # Convert to response model
    return [
        UserRoleResponse(
            id=str(user.id),
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active
        )
        for user in users
    ]


@router.get(
    "/users/{user_id}",
    response_model=UserRoleResponse,
    summary="Get User Details",
    description="Get detailed information about a specific user (Admin only)",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN]))]
)
async def get_user_details(user_id: str):
    """
    Get detailed information about a specific user.
    
    Args:
        user_id: The ID of the user to retrieve
    
    Returns:
        UserRoleResponse: User details
    
    Raises:
        HTTPException 404: If user not found
        HTTPException 400: If invalid user ID format
    """
    # Validate ObjectId format
    try:
        object_id = PydanticObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Fetch user from MongoDB
    user = await User.get(object_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    return UserRoleResponse(
        id=str(user.id),
        name=user.name,
        email=user.email,
        role=user.role,
        is_active=user.is_active
    )


@router.patch(
    "/users/{user_id}/status",
    response_model=UserRoleResponse,
    summary="Toggle User Active Status",
    description="Activate or deactivate a user account (Admin only)",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN]))]
)
async def toggle_user_status(
    user_id: str,
    is_active: bool,
    current_user: User = Depends(RoleChecker([UserRole.ADMIN]))
):
    """
    Toggle a user's active status.
    
    Args:
        user_id: The ID of the user to update
        is_active: New active status (True/False)
        current_user: The authenticated admin user
    
    Returns:
        UserRoleResponse: The updated user object
    
    Raises:
        HTTPException 404: If user not found
        HTTPException 400: If trying to deactivate own account
    """
    # Validate ObjectId format
    try:
        object_id = PydanticObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Fetch the target user
    target_user = await User.get(object_id)
    
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Prevent admin from deactivating themselves
    if str(target_user.id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Update active status
    target_user.is_active = is_active
    target_user.updated_at = datetime.utcnow()
    
    # Save changes
    await target_user.save()
    
    return UserRoleResponse(
        id=str(target_user.id),
        name=target_user.name,
        email=target_user.email,
        role=target_user.role,
        is_active=target_user.is_active
    )
