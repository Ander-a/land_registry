from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.models.user import User
from app.models.notification import (
    Notification,
    NotificationPreference,
    NotificationResponse,
    NotificationPreferenceResponse,
    NotificationStats
)
from app.services.notification_service import NotificationService
from app.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])
notification_service = NotificationService()


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of notifications to return"),
    skip: int = Query(0, ge=0, description="Number of notifications to skip"),
    notification_type: Optional[str] = Query(None, description="Filter by notification type"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    current_user: User = Depends(get_current_user)
):
    """
    Get notifications for the current user.
    
    Query parameters:
    - unread_only: Only return unread notifications
    - limit: Maximum number of notifications (1-100, default 50)
    - skip: Pagination offset
    - notification_type: Filter by type (validation_received, consensus_reached, etc.)
    - priority: Filter by priority (low, medium, high, urgent)
    """
    try:
        # Build query
        query = {"user_id": str(current_user.id)}
        
        if unread_only:
            query["read"] = False
        
        if notification_type:
            query["type"] = notification_type
        
        if priority:
            query["priority"] = priority
        
        # Get notifications
        notifications = await Notification.find(
            query
        ).sort("-created_at").skip(skip).limit(limit).to_list()
        
        # Convert to response model
        return [
            NotificationResponse(
                id=str(n.id),
                user_id=n.user_id,
                type=n.type,
                title=n.title,
                message=n.message,
                priority=n.priority,
                read=n.read,
                claim_id=n.claim_id,
                validation_id=n.validation_id,
                badge_id=n.badge_id,
                data=n.data,
                action_url=n.action_url,
                created_at=n.created_at.isoformat() if n.created_at else None,
                read_at=n.read_at.isoformat() if n.read_at else None,
                expires_at=n.expires_at.isoformat() if n.expires_at else None
            )
            for n in notifications
        ]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")


@router.get("/unread", response_model=dict)
async def get_unread_count(
    current_user: User = Depends(get_current_user)
):
    """
    Get count of unread notifications for the current user.
    
    Returns:
    - count: Number of unread notifications
    """
    try:
        count = await Notification.find(
            Notification.user_id == str(current_user.id),
            Notification.read == False
        ).count()
        
        return {"count": count}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error counting unread notifications: {str(e)}")


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_current_user)
):
    """
    Get notification statistics for the current user.
    
    Returns statistics including:
    - total: Total notifications
    - unread: Unread count
    - by_type: Breakdown by notification type
    - by_priority: Breakdown by priority level
    """
    try:
        stats = await notification_service.get_notification_stats(str(current_user.id))
        
        return NotificationStats(
            total=stats['total'],
            unread=stats['unread'],
            by_type=stats['by_type'],
            by_priority=stats['by_priority']
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notification stats: {str(e)}")


@router.patch("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    
    Path parameters:
    - notification_id: ID of the notification to mark as read
    """
    try:
        # Get notification
        notification = await Notification.get(notification_id)
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Check ownership
        if notification.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to modify this notification")
        
        # Mark as read
        success = await notification_service.mark_as_read(notification_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to mark notification as read")
        
        return {"success": True, "message": "Notification marked as read"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")


@router.patch("/mark-all-read", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user)
):
    """
    Mark all notifications for the current user as read.
    
    Returns the count of notifications that were marked as read.
    """
    try:
        count = await notification_service.mark_all_as_read(str(current_user.id))
        
        return {
            "success": True,
            "message": f"Marked {count} notifications as read",
            "count": count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking all notifications as read: {str(e)}")


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete a specific notification.
    
    Path parameters:
    - notification_id: ID of the notification to delete
    """
    try:
        # Get notification
        notification = await Notification.get(notification_id)
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Check ownership
        if notification.user_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to delete this notification")
        
        # Delete
        success = await notification_service.delete_notification(notification_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete notification")
        
        return {"success": True, "message": "Notification deleted"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")


@router.delete("/clear-all", response_model=dict)
async def clear_all_read_notifications(
    current_user: User = Depends(get_current_user)
):
    """
    Delete all read notifications for the current user.
    
    Returns the count of notifications that were deleted.
    """
    try:
        # Get all read notifications
        read_notifications = await Notification.find(
            Notification.user_id == str(current_user.id),
            Notification.read == True
        ).to_list()
        
        count = 0
        for notification in read_notifications:
            await notification.delete()
            count += 1
        
        return {
            "success": True,
            "message": f"Cleared {count} read notifications",
            "count": count
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing notifications: {str(e)}")


@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user)
):
    """
    Get notification preferences for the current user.
    
    Returns all preference settings including:
    - Per-notification-type enable/disable flags
    - Delivery method preferences (in_app, email, push)
    - Quiet hours settings
    """
    try:
        preferences = await notification_service.get_or_create_preferences(str(current_user.id))
        
        if not preferences:
            raise HTTPException(status_code=500, detail="Failed to get preferences")
        
        return NotificationPreferenceResponse(
            id=str(preferences.id),
            user_id=preferences.user_id,
            validation_received=preferences.validation_received,
            consensus_reached=preferences.consensus_reached,
            claim_validated=preferences.claim_validated,
            claim_rejected=preferences.claim_rejected,
            badge_earned=preferences.badge_earned,
            trust_score_updated=preferences.trust_score_updated,
            new_claim_nearby=preferences.new_claim_nearby,
            dispute_raised=preferences.dispute_raised,
            validation_correct=preferences.validation_correct,
            validation_incorrect=preferences.validation_incorrect,
            in_app=preferences.in_app,
            email=preferences.email,
            push=preferences.push,
            quiet_hours_enabled=preferences.quiet_hours_enabled,
            quiet_hours_start=preferences.quiet_hours_start,
            quiet_hours_end=preferences.quiet_hours_end,
            updated_at=preferences.updated_at.isoformat() if preferences.updated_at else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching preferences: {str(e)}")


@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_notification_preferences(
    preferences_data: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Update notification preferences for the current user.
    
    Request body should contain preference fields to update:
    {
        "validation_received": true,
        "consensus_reached": true,
        "badge_earned": false,
        "email": true,
        "quiet_hours_enabled": true,
        "quiet_hours_start": "22:00",
        "quiet_hours_end": "08:00"
    }
    """
    try:
        updated_preferences = await notification_service.update_preferences(
            str(current_user.id),
            preferences_data
        )
        
        if not updated_preferences:
            raise HTTPException(status_code=500, detail="Failed to update preferences")
        
        return NotificationPreferenceResponse(
            id=str(updated_preferences.id),
            user_id=updated_preferences.user_id,
            validation_received=updated_preferences.validation_received,
            consensus_reached=updated_preferences.consensus_reached,
            claim_validated=updated_preferences.claim_validated,
            claim_rejected=updated_preferences.claim_rejected,
            badge_earned=updated_preferences.badge_earned,
            trust_score_updated=updated_preferences.trust_score_updated,
            new_claim_nearby=updated_preferences.new_claim_nearby,
            dispute_raised=updated_preferences.dispute_raised,
            validation_correct=updated_preferences.validation_correct,
            validation_incorrect=updated_preferences.validation_incorrect,
            in_app=updated_preferences.in_app,
            email=updated_preferences.email,
            push=updated_preferences.push,
            quiet_hours_enabled=updated_preferences.quiet_hours_enabled,
            quiet_hours_start=updated_preferences.quiet_hours_start,
            quiet_hours_end=updated_preferences.quiet_hours_end,
            updated_at=updated_preferences.updated_at.isoformat() if updated_preferences.updated_at else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")


@router.post("/test", response_model=NotificationResponse)
async def create_test_notification(
    current_user: User = Depends(get_current_user)
):
    """
    Create a test notification for the current user.
    
    Useful for testing the notification system.
    Only available in development mode.
    """
    try:
        notification = await notification_service.create_notification(
            user_id=str(current_user.id),
            notification_type="trust_score_updated",
            title="Test Notification",
            message="This is a test notification to verify the notification system is working correctly.",
            priority="low",
            data={"test": True}
        )
        
        if not notification:
            raise HTTPException(status_code=500, detail="Failed to create test notification")
        
        return NotificationResponse(
            id=str(notification.id),
            user_id=notification.user_id,
            type=notification.type,
            title=notification.title,
            message=notification.message,
            priority=notification.priority,
            read=notification.read,
            claim_id=notification.claim_id,
            validation_id=notification.validation_id,
            badge_id=notification.badge_id,
            data=notification.data,
            action_url=notification.action_url,
            created_at=notification.created_at.isoformat() if notification.created_at else None,
            read_at=notification.read_at.isoformat() if notification.read_at else None,
            expires_at=notification.expires_at.isoformat() if notification.expires_at else None
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating test notification: {str(e)}")
