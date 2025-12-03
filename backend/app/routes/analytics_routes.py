"""
Analytics Routes
Endpoints for system analytics, statistics, and report generation
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime, timedelta
import io

from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.services.report_service import ReportService
from app.auth import get_current_user
from app.database import get_db


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
async def get_system_overview(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get comprehensive system overview statistics
    Requires: Any authenticated user (admin/leader gets full stats)
    """
    analytics_service = AnalyticsService(db)
    stats = await analytics_service.get_system_overview_stats()
    return stats


@router.get("/registrations")
async def get_registration_trends(
    months: int = Query(default=6, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get land registration trends over specified months
    Returns monthly data for charts
    """
    analytics_service = AnalyticsService(db)
    trends = await analytics_service.get_registration_trends(months)
    return {"trends": trends, "months": months}


@router.get("/departments")
async def get_department_activity(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get activity breakdown by department (last 30 days)
    Returns: surveying, legal, issuance, records counts
    """
    # Restrict to admin and leaders
    if current_user.role not in ["admin", "local_leader", "system_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    analytics_service = AnalyticsService(db)
    activity = await analytics_service.get_department_activity()
    return activity


@router.get("/users/online")
async def get_active_users(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get currently active users (last 15 minutes)
    Admin only
    """
    if current_user.role not in ["admin", "system_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    analytics_service = AnalyticsService(db)
    users = await analytics_service.get_active_users_online()
    return {"active_users": users, "count": len(users)}


@router.get("/activity-log")
async def get_activity_log(
    limit: int = Query(default=50, ge=10, le=100),
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get recent system activity log
    Returns latest actions across the system
    """
    if current_user.role not in ["admin", "local_leader", "system_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    analytics_service = AnalyticsService(db)
    activities = await analytics_service.get_activity_log(limit)
    return {"activities": activities, "total": len(activities)}


@router.get("/property-stats")
async def get_property_statistics(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get comprehensive property-related statistics
    Includes valuations, taxes, permits, transactions
    """
    analytics_service = AnalyticsService(db)
    stats = await analytics_service.get_property_statistics()
    return stats


@router.post("/reports/generate")
async def generate_report(
    report_type: str = Query(..., regex="^(properties|transactions|taxes|certificates)$"),
    format: str = Query(default="csv", regex="^(csv|json)$"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Generate and download report in specified format
    Formats: csv, json
    Report types: properties, transactions, taxes, certificates
    """
    # Admin/leader only
    if current_user.role not in ["admin", "local_leader", "system_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    report_service = ReportService()
    
    # Parse dates
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    # Generate report data based on type
    if report_type == "properties":
        data = await report_service.generate_property_report_data(start, end, status)
    elif report_type == "transactions":
        data = await report_service.generate_transaction_report_data(start, end, status)
    elif report_type == "taxes":
        data = await report_service.generate_tax_report_data(start, end, status)
    elif report_type == "certificates":
        data = await report_service.generate_certificate_report_data(start, end)
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    # Return in requested format
    if format == "csv":
        csv_content = report_service.generate_csv_report(data)
        
        # Create filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{report_type}_report_{timestamp}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    else:  # json
        return {"data": data, "total": len(data), "report_type": report_type}


@router.get("/reports/summary")
async def get_report_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get summary statistics for reports
    Used for report headers and overview
    """
    if current_user.role not in ["admin", "local_leader", "system_admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    report_service = ReportService()
    
    # Parse dates
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    summary = await report_service.generate_summary_statistics(start, end)
    return summary
