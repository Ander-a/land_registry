from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.models.activity_log import ActivityLog, ActivityLogCreate, ActivityLogResponse
from app.models.user import User
from app.auth import get_current_user
from app.auth.permissions import get_user_jurisdiction_filter

router = APIRouter(prefix="/activity-logs", tags=["activity-logs"])
logger = logging.getLogger(__name__)


@router.post("/", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
async def create_activity_log(
    activity_data: ActivityLogCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new activity log entry.
    Usually called internally by other services.
    """
    try:
        # Create activity log
        activity = ActivityLog(
            jurisdiction_id=activity_data.jurisdiction_id,
            jurisdiction_name=activity_data.jurisdiction_name,
            activity_type=activity_data.activity_type,
            description=activity_data.description,
            related_user_id=activity_data.related_user_id,
            related_user_name=activity_data.related_user_name,
            related_claim_id=activity_data.related_claim_id,
            related_dispute_id=activity_data.related_dispute_id,
            related_parcel_number=activity_data.related_parcel_number,
            status=activity_data.status,
            status_color=activity_data.status_color
        )
        
        await activity.save()
        
        return ActivityLogResponse(
            id=str(activity.id),
            jurisdiction_id=activity.jurisdiction_id,
            activity_type=activity.activity_type,
            description=activity.description,
            related_user_name=activity.related_user_name,
            related_parcel_number=activity.related_parcel_number,
            status=activity.status,
            status_color=activity.status_color,
            timestamp=activity.timestamp.isoformat()
        )
    
    except Exception as e:
        logger.error(f"Error creating activity log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating activity log: {str(e)}"
        )


@router.get("/", response_model=List[ActivityLogResponse])
async def list_activity_logs(
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    days: int = Query(7, ge=1, le=90, description="Number of days to look back"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of activities"),
    skip: int = Query(0, ge=0, description="Number of activities to skip"),
    current_user: User = Depends(get_current_user)
):
    """
    List activity logs with filters.
    Non-admin users only see activities from their jurisdiction.
    """
    try:
        # Build base query
        query = {}
        
        # Apply jurisdiction filter for non-admin users
        jurisdiction_filter = get_user_jurisdiction_filter(current_user)
        if jurisdiction_filter:
            query["jurisdiction_id"] = jurisdiction_filter
        
        # Apply activity type filter
        if activity_type:
            query["activity_type"] = activity_type
        
        # Apply status filter
        if status:
            query["status"] = status
        
        # Apply time filter
        start_date = datetime.utcnow() - timedelta(days=days)
        query["timestamp"] = {"$gte": start_date}
        
        # Get activities
        activities = await ActivityLog.find(query).sort("-timestamp").skip(skip).limit(limit).to_list()
        
        return [
            ActivityLogResponse(
                id=str(activity.id),
                jurisdiction_id=activity.jurisdiction_id,
                activity_type=activity.activity_type,
                description=activity.description,
                related_user_name=activity.related_user_name,
                related_parcel_number=activity.related_parcel_number,
                status=activity.status,
                status_color=activity.status_color,
                timestamp=activity.timestamp.isoformat()
            )
            for activity in activities
        ]
    
    except Exception as e:
        logger.error(f"Error listing activity logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing activity logs: {str(e)}"
        )


@router.get("/recent", response_model=List[ActivityLogResponse])
async def get_recent_activities(
    limit: int = Query(10, ge=1, le=50, description="Number of recent activities"),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent activities for the user's jurisdiction.
    Optimized for dashboard display.
    """
    try:
        # Build query
        query = {}
        
        # Apply jurisdiction filter
        jurisdiction_filter = get_user_jurisdiction_filter(current_user)
        if jurisdiction_filter:
            query["jurisdiction_id"] = jurisdiction_filter
        
        # Get recent activities
        activities = await ActivityLog.find(query).sort("-timestamp").limit(limit).to_list()
        
        return [
            ActivityLogResponse(
                id=str(activity.id),
                jurisdiction_id=activity.jurisdiction_id,
                activity_type=activity.activity_type,
                description=activity.description,
                related_user_name=activity.related_user_name,
                related_parcel_number=activity.related_parcel_number,
                status=activity.status,
                status_color=activity.status_color,
                timestamp=activity.timestamp.isoformat()
            )
            for activity in activities
        ]
    
    except Exception as e:
        logger.error(f"Error getting recent activities: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting recent activities: {str(e)}"
        )


@router.get("/stats", response_model=dict)
async def get_activity_stats(
    days: int = Query(30, ge=1, le=90, description="Number of days to analyze"),
    current_user: User = Depends(get_current_user)
):
    """
    Get activity statistics for the user's jurisdiction.
    Returns counts by activity type and status.
    """
    try:
        # Build base query
        query = {}
        
        # Apply jurisdiction filter
        jurisdiction_filter = get_user_jurisdiction_filter(current_user)
        if jurisdiction_filter:
            query["jurisdiction_id"] = jurisdiction_filter
        
        # Apply time filter
        start_date = datetime.utcnow() - timedelta(days=days)
        query["timestamp"] = {"$gte": start_date}
        
        # Get all activities in date range
        activities = await ActivityLog.find(query).to_list()
        
        # Count by type
        type_counts = {}
        for activity in activities:
            type_counts[activity.activity_type] = type_counts.get(activity.activity_type, 0) + 1
        
        # Count by status
        status_counts = {}
        for activity in activities:
            status_counts[activity.status] = status_counts.get(activity.status, 0) + 1
        
        return {
            "total_activities": len(activities),
            "by_type": type_counts,
            "by_status": status_counts,
            "period_days": days
        }
    
    except Exception as e:
        logger.error(f"Error getting activity stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting activity stats: {str(e)}"
        )
