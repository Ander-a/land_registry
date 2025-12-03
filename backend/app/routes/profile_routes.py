from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from beanie import PydanticObjectId

from app.models.user import User
from app.models.claim import Claim
from app.models.notification import NotificationPreference
from app.models.activity_log import ActivityLog
from app.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


# Pydantic Schemas
class NotificationPreferences(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = False
    claim_updates: bool = True
    validation_updates: bool = True
    approval_updates: bool = True
    community_updates: bool = False


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    sector: Optional[str] = None
    cell: Optional[str] = None
    village: Optional[str] = None
    notification_preferences: Optional[NotificationPreferences] = None


class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    sector: Optional[str] = None
    cell: Optional[str] = None
    village: Optional[str] = None
    role: str
    notification_preferences: Dict[str, bool]
    created_at: datetime


class ClaimStatsResponse(BaseModel):
    total_claims: int
    pending_claims: int
    validated_claims: int
    approved_claims: int
    rejected_claims: int


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    
    # Get notification preferences
    notification_prefs = await NotificationPreference.find_one(
        NotificationPreference.user_id == str(current_user.id)
    )
    
    prefs_dict = {
        "email_notifications": True,
        "sms_notifications": False,
        "claim_updates": True,
        "validation_updates": True,
        "approval_updates": True,
        "community_updates": False
    }
    
    if notification_prefs:
        prefs_dict = {
            "email_notifications": notification_prefs.email_notifications,
            "sms_notifications": notification_prefs.sms_notifications,
            "claim_updates": notification_prefs.claim_updates,
            "validation_updates": notification_prefs.validation_updates,
            "approval_updates": notification_prefs.approval_updates,
            "community_updates": notification_prefs.community_updates
        }
    
    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        address=current_user.address,
        district=current_user.district,
        sector=current_user.sector,
        cell=current_user.cell,
        village=current_user.village,
        role=current_user.role,
        notification_preferences=prefs_dict,
        created_at=current_user.created_at
    )


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    
    # Update user fields
    update_data = profile_data.dict(exclude_unset=True, exclude={"notification_preferences"})
    
    if update_data:
        for field, value in update_data.items():
            setattr(current_user, field, value)
        
        await current_user.save()
    
    # Update notification preferences
    if profile_data.notification_preferences:
        notification_prefs = await NotificationPreference.find_one(
            NotificationPreference.user_id == str(current_user.id)
        )
        
        prefs_data = profile_data.notification_preferences.dict()
        
        if notification_prefs:
            # Update existing preferences
            for field, value in prefs_data.items():
                setattr(notification_prefs, field, value)
            await notification_prefs.save()
        else:
            # Create new preferences
            notification_prefs = NotificationPreference(
                user_id=str(current_user.id),
                **prefs_data
            )
            await notification_prefs.insert()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="profile_updated",
        details=f"Profile updated by {current_user.full_name}",
        ip_address="unknown"
    )
    await activity.insert()
    
    # Get updated preferences
    notification_prefs = await NotificationPreference.find_one(
        NotificationPreference.user_id == str(current_user.id)
    )
    
    prefs_dict = {
        "email_notifications": True,
        "sms_notifications": False,
        "claim_updates": True,
        "validation_updates": True,
        "approval_updates": True,
        "community_updates": False
    }
    
    if notification_prefs:
        prefs_dict = {
            "email_notifications": notification_prefs.email_notifications,
            "sms_notifications": notification_prefs.sms_notifications,
            "claim_updates": notification_prefs.claim_updates,
            "validation_updates": notification_prefs.validation_updates,
            "approval_updates": notification_prefs.approval_updates,
            "community_updates": notification_prefs.community_updates
        }
    
    return ProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        phone=current_user.phone,
        address=current_user.address,
        district=current_user.district,
        sector=current_user.sector,
        cell=current_user.cell,
        village=current_user.village,
        role=current_user.role,
        notification_preferences=prefs_dict,
        created_at=current_user.created_at
    )


@router.get("/stats", response_model=ClaimStatsResponse)
async def get_my_claim_stats(current_user: User = Depends(get_current_user)):
    """Get statistics for current user's claims"""
    
    # Get all claims for this user
    all_claims = await Claim.find(
        Claim.user_id == str(current_user.id)
    ).to_list()
    
    stats = {
        "total_claims": len(all_claims),
        "pending_claims": 0,
        "validated_claims": 0,
        "approved_claims": 0,
        "rejected_claims": 0
    }
    
    for claim in all_claims:
        if claim.status == "pending":
            stats["pending_claims"] += 1
        elif claim.status == "validated":
            stats["validated_claims"] += 1
        elif claim.status == "approved":
            stats["approved_claims"] += 1
        elif claim.status == "rejected":
            stats["rejected_claims"] += 1
    
    return ClaimStatsResponse(**stats)


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user)
):
    """Get recent activity for current user"""
    
    activities = await ActivityLog.find(
        ActivityLog.user_id == str(current_user.id)
    ).sort(-ActivityLog.timestamp).limit(limit).to_list()
    
    return [
        {
            "id": str(activity.id),
            "action": activity.action,
            "details": activity.details,
            "timestamp": activity.timestamp,
            "ip_address": activity.ip_address
        }
        for activity in activities
    ]
