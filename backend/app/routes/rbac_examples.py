"""
RBAC Example Routes

This module demonstrates the Role-Based Access Control (RBAC) system
with example protected routes for each role type.

These routes serve as implementation examples and can be adapted
for actual functionality in the Land Registry System.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from ..models.user import User
from ..models.roles import UserRole
from ..auth.auth import get_current_user
from ..auth.rbac import (
    RoleChecker,
    require_admin,
    require_validator,
    require_leader,
    require_resident
)


router = APIRouter(prefix="/rbac-examples", tags=["RBAC Examples"])


# ============================================================================
# EXAMPLE 1: Admin-Only Route
# ============================================================================

@router.get(
    "/admin/dashboard",
    dependencies=[Depends(require_admin)],
    summary="Admin Dashboard (Admin Only)",
    description="This route is accessible ONLY to users with ADMIN role"
)
async def admin_dashboard(current_user: User = Depends(get_current_user)):
    """
    Example admin-only route.
    
    Access: ✅ ADMIN only
    """
    return {
        "message": "Welcome to Admin Dashboard",
        "admin_email": current_user.email,
        "role": current_user.role.value,
        "permissions": ["manage_users", "view_all_claims", "system_settings"]
    }


@router.delete(
    "/admin/users/{user_id}",
    dependencies=[Depends(require_admin)],
    summary="Delete User (Admin Only)"
)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Example route for deleting users - admin privilege required.
    
    Access: ✅ ADMIN only
    """
    return {
        "message": f"User {user_id} would be deleted",
        "deleted_by": current_user.email,
        "admin_role": current_user.role.value
    }


# ============================================================================
# EXAMPLE 2: Validator Routes (Community Member + Local Leader)
# ============================================================================

@router.get(
    "/claims/{claim_id}/validate",
    dependencies=[Depends(RoleChecker([UserRole.COMMUNITY_MEMBER, UserRole.LOCAL_LEADER]))],
    summary="Validate Claim (Validators Only)",
    description="""
    **Community Validation Endpoint**
    
    This demonstrates the key RBAC requirement from your specification:
    - ✅ COMMUNITY_MEMBER: Can validate
    - ✅ LOCAL_LEADER: Can validate  
    - ❌ RESIDENT: Cannot validate
    - ❌ ADMIN: Cannot validate
    """
)
async def validate_claim_example(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Example validation endpoint - COMMUNITY_MEMBER and LOCAL_LEADER only.
    
    This is the exact implementation requested in your requirements
    for the "Community Validation" module.
    
    Access:
    - ✅ COMMUNITY_MEMBER
    - ✅ LOCAL_LEADER
    - ❌ RESIDENT (will get 403)
    - ❌ ADMIN (will get 403)
    """
    return {
        "claim_id": claim_id,
        "validated_by": current_user.email,
        "validator_role": current_user.role.value,
        "message": f"Claim {claim_id} validation accessed by {current_user.role.value}",
        "allowed_roles": ["community_member", "local_leader"]
    }


@router.get(
    "/validation/my-queue",
    dependencies=[Depends(require_validator)],
    summary="Get My Validation Queue"
)
async def get_validation_queue(current_user: User = Depends(get_current_user)):
    """
    Get claims pending validation for the current validator.
    
    Access: ✅ COMMUNITY_MEMBER, ✅ LOCAL_LEADER
    """
    return {
        "validator": current_user.email,
        "role": current_user.role.value,
        "pending_validations": [
            {"claim_id": "claim_001", "location": "Plot 45"},
            {"claim_id": "claim_002", "location": "Plot 67"}
        ]
    }


# ============================================================================
# EXAMPLE 3: Local Leader Exclusive Routes
# ============================================================================

@router.post(
    "/claims/{claim_id}/final-endorsement",
    dependencies=[Depends(require_leader)],
    summary="Final Endorsement (Local Leader Only)"
)
async def final_endorsement(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Example route for final claim endorsement - LOCAL_LEADER only.
    
    Access: ✅ LOCAL_LEADER only
    """
    return {
        "claim_id": claim_id,
        "endorsed_by": current_user.email,
        "leader_role": current_user.role.value,
        "message": "Final leadership endorsement recorded"
    }


# ============================================================================
# EXAMPLE 4: Resident Routes
# ============================================================================

@router.post(
    "/claims/submit",
    dependencies=[Depends(require_resident)],
    summary="Submit Claim (Residents Only)"
)
async def submit_claim_example(current_user: User = Depends(get_current_user)):
    """
    Example route for submitting claims - RESIDENT only.
    
    Access: ✅ RESIDENT only
    """
    return {
        "message": "Claim submitted successfully",
        "submitted_by": current_user.email,
        "resident_role": current_user.role.value
    }


@router.get(
    "/my-claims",
    dependencies=[Depends(require_resident)],
    summary="Get My Claims (Residents Only)"
)
async def get_my_claims(current_user: User = Depends(get_current_user)):
    """
    Get all claims submitted by the current resident.
    
    Access: ✅ RESIDENT only
    """
    return {
        "resident": current_user.email,
        "my_claims": [
            {"claim_id": "claim_100", "status": "pending"},
            {"claim_id": "claim_101", "status": "validated"}
        ]
    }


# ============================================================================
# EXAMPLE 5: Multiple Role Access
# ============================================================================

@router.get(
    "/claims/{claim_id}/details",
    summary="Get Claim Details (All Authenticated Users)"
)
async def get_claim_details(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Example route accessible to all authenticated users regardless of role.
    
    Access: ✅ ALL authenticated users
    """
    return {
        "claim_id": claim_id,
        "viewer": current_user.email,
        "viewer_role": current_user.role.value,
        "message": "Claim details visible to all authenticated users"
    }


@router.get(
    "/claims/{claim_id}/endorse",
    dependencies=[Depends(RoleChecker([UserRole.COMMUNITY_MEMBER, UserRole.LOCAL_LEADER, UserRole.ADMIN]))],
    summary="Endorse Claim (Validators + Admin)"
)
async def endorse_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Example route with custom role combination.
    
    Access: ✅ COMMUNITY_MEMBER, ✅ LOCAL_LEADER, ✅ ADMIN
    """
    return {
        "claim_id": claim_id,
        "endorsed_by": current_user.email,
        "endorser_role": current_user.role.value,
        "allowed_roles": ["community_member", "local_leader", "admin"]
    }


# ============================================================================
# EXAMPLE 6: Role Information Endpoint
# ============================================================================

@router.get(
    "/my-role-info",
    summary="Get Current User's Role Information"
)
async def get_my_role_info(current_user: User = Depends(get_current_user)):
    """
    Get information about the current user's role and permissions.
    
    Access: ✅ ALL authenticated users
    """
    permissions = {
        UserRole.RESIDENT: [
            "submit_claims",
            "view_own_claims",
            "upload_documents"
        ],
        UserRole.COMMUNITY_MEMBER: [
            "submit_claims",
            "view_own_claims",
            "validate_claims",
            "witness_claims"
        ],
        UserRole.LOCAL_LEADER: [
            "submit_claims",
            "view_own_claims",
            "validate_claims",
            "witness_claims",
            "final_endorsement",
            "view_community_claims"
        ],
        UserRole.ADMIN: [
            "full_system_access",
            "manage_users",
            "system_configuration",
            "view_all_claims",
            "generate_reports"
        ]
    }
    
    return {
        "user": current_user.email,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "permissions": permissions.get(current_user.role, []),
        "can_validate_claims": current_user.role in [UserRole.COMMUNITY_MEMBER, UserRole.LOCAL_LEADER],
        "is_admin": current_user.role == UserRole.ADMIN
    }


# ============================================================================
# EXAMPLE 7: Testing Unauthorized Access
# ============================================================================

@router.get(
    "/test/unauthorized",
    dependencies=[Depends(RoleChecker([UserRole.ADMIN]))],
    summary="Test Unauthorized Access (Admins Only)"
)
async def test_unauthorized():
    """
    This route will return 403 Forbidden if accessed by non-admin users.
    Use this to test the RBAC system.
    
    Expected responses:
    - ADMIN: 200 OK with success message
    - RESIDENT/COMMUNITY_MEMBER/LOCAL_LEADER: 403 Forbidden
    """
    return {
        "message": "Access granted - you are an admin!",
        "test_status": "RBAC working correctly"
    }
