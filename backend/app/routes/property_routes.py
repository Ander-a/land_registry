from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.models.property_valuation import (
    PropertyValuation, ValuationCreate, ValuationResponse,
    ValuationStats, ValuationMethod, ValuationPurpose
)
from app.models.tax_assessment import (
    TaxAssessment, TaxAssessmentCreate, TaxPayment,
    TaxAssessmentUpdate, TaxAssessmentResponse, TaxStats,
    TaxStatus, PaymentMethod
)
from app.models.land_use_permit import (
    LandUsePermit, PermitCreate, PermitReview, PermitUpdate,
    PermitResponse, PermitStats, PermitType, PermitStatus
)
from app.models.claim import Claim
from app.models.user import User
from app.auth import get_current_user
from app.models.activity_log import ActivityLog

router = APIRouter(prefix="/property", tags=["property"])


# ============= VALUATION ENDPOINTS =============

@router.post("/valuations", response_model=ValuationResponse)
async def create_valuation(
    valuation_data: ValuationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a property valuation (admin/leader only)"""
    
    if current_user.role not in ["admin", "local_leader"]:
        raise HTTPException(status_code=403, detail="Only admin or leader can create valuations")
    
    # Verify claim exists
    claim = await Claim.get(valuation_data.claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Calculate price per sqm
    price_per_sqm = valuation_data.total_value / valuation_data.plot_area
    
    # Create valuation
    valuation = PropertyValuation(
        **valuation_data.dict(),
        price_per_sqm=price_per_sqm,
        appraiser_id=str(current_user.id)
    )
    
    await valuation.insert()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="valuation_created",
        details=f"Created valuation for parcel {valuation.parcel_number} - Value: {valuation.total_value}",
        ip_address="unknown"
    )
    await activity.insert()
    
    return ValuationResponse(
        id=str(valuation.id),
        **valuation.dict(exclude={"id"})
    )


@router.get("/valuations", response_model=List[ValuationResponse])
async def get_valuations(
    claim_id: Optional[str] = None,
    parcel_number: Optional[str] = None,
    purpose: Optional[ValuationPurpose] = None,
    limit: int = Query(50, le=100),
    skip: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get property valuations"""
    
    query = {}
    
    if claim_id:
        query["claim_id"] = claim_id
    if parcel_number:
        query["parcel_number"] = parcel_number
    if purpose:
        query["valuation_purpose"] = purpose
    
    valuations = await PropertyValuation.find(query).sort(-PropertyValuation.valuation_date).skip(skip).limit(limit).to_list()
    
    return [
        ValuationResponse(id=str(v.id), **v.dict(exclude={"id"}))
        for v in valuations
    ]


@router.get("/valuations/stats", response_model=ValuationStats)
async def get_valuation_stats(
    current_user: User = Depends(get_current_user)
):
    """Get valuation statistics (admin/leader only)"""
    
    if current_user.role not in ["admin", "local_leader"]:
        raise HTTPException(status_code=403, detail="Only admin or leader can view stats")
    
    all_valuations = await PropertyValuation.find().to_list()
    
    if not all_valuations:
        return ValuationStats(
            total_valuations=0,
            average_land_value=0,
            median_land_value=0,
            highest_valuation=0,
            lowest_valuation=0,
            average_price_per_sqm=0
        )
    
    land_values = [v.land_value for v in all_valuations]
    land_values.sort()
    
    median = land_values[len(land_values) // 2] if land_values else 0
    avg_price_sqm = sum(v.price_per_sqm for v in all_valuations) / len(all_valuations)
    
    return ValuationStats(
        total_valuations=len(all_valuations),
        average_land_value=sum(land_values) / len(land_values),
        median_land_value=median,
        highest_valuation=max(v.total_value for v in all_valuations),
        lowest_valuation=min(v.total_value for v in all_valuations),
        average_price_per_sqm=avg_price_sqm
    )


# ============= TAX ASSESSMENT ENDPOINTS =============

@router.post("/tax-assessments", response_model=TaxAssessmentResponse)
async def create_tax_assessment(
    tax_data: TaxAssessmentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a tax assessment (admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create tax assessments")
    
    # Calculate totals
    total_due = tax_data.tax_amount + tax_data.service_charges
    
    # Create assessment
    tax_assessment = TaxAssessment(
        **tax_data.dict(),
        total_due=total_due,
        balance_due=total_due
    )
    
    await tax_assessment.insert()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="tax_assessment_created",
        details=f"Created tax assessment for {tax_assessment.owner_name} - Year: {tax_assessment.tax_year}",
        ip_address="unknown"
    )
    await activity.insert()
    
    return TaxAssessmentResponse(
        id=str(tax_assessment.id),
        **tax_assessment.dict(exclude={"id"})
    )


@router.get("/tax-assessments", response_model=List[TaxAssessmentResponse])
async def get_tax_assessments(
    owner_id: Optional[str] = None,
    tax_year: Optional[int] = None,
    status: Optional[TaxStatus] = None,
    limit: int = Query(50, le=100),
    skip: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get tax assessments"""
    
    query = {}
    
    # Non-admin users can only see their own assessments
    if current_user.role not in ["admin", "local_leader"]:
        query["owner_id"] = str(current_user.id)
    elif owner_id:
        query["owner_id"] = owner_id
    
    if tax_year:
        query["tax_year"] = tax_year
    if status:
        query["status"] = status
    
    assessments = await TaxAssessment.find(query).sort(-TaxAssessment.tax_year).skip(skip).limit(limit).to_list()
    
    return [
        TaxAssessmentResponse(id=str(a.id), **a.dict(exclude={"id"}))
        for a in assessments
    ]


@router.post("/tax-assessments/{assessment_id}/payment", response_model=TaxAssessmentResponse)
async def record_tax_payment(
    assessment_id: str,
    payment: TaxPayment,
    current_user: User = Depends(get_current_user)
):
    """Record a tax payment"""
    
    assessment = await TaxAssessment.get(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Tax assessment not found")
    
    # Check access
    if current_user.role not in ["admin"] and assessment.owner_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update payment info
    assessment.amount_paid += payment.amount
    assessment.balance_due = assessment.total_due - assessment.amount_paid
    assessment.payment_date = datetime.utcnow()
    assessment.payment_method = payment.payment_method
    assessment.payment_reference = payment.payment_reference
    assessment.receipt_number = payment.receipt_number
    
    # Update status
    if assessment.balance_due <= 0:
        assessment.status = TaxStatus.paid
    elif assessment.amount_paid > 0:
        assessment.status = TaxStatus.partially_paid
    
    assessment.updated_at = datetime.utcnow()
    await assessment.save()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="tax_payment_recorded",
        details=f"Recorded payment of {payment.amount} for tax assessment {assessment_id}",
        ip_address="unknown"
    )
    await activity.insert()
    
    return TaxAssessmentResponse(
        id=str(assessment.id),
        **assessment.dict(exclude={"id"})
    )


@router.get("/tax-assessments/stats", response_model=TaxStats)
async def get_tax_stats(
    current_user: User = Depends(get_current_user)
):
    """Get tax statistics (admin only)"""
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view tax stats")
    
    all_assessments = await TaxAssessment.find().to_list()
    
    total_due = sum(a.total_due for a in all_assessments)
    total_collected = sum(a.amount_paid for a in all_assessments)
    total_outstanding = sum(a.balance_due for a in all_assessments)
    
    overdue = [a for a in all_assessments if a.status == TaxStatus.overdue]
    overdue_amount = sum(a.balance_due for a in overdue)
    
    collection_rate = (total_collected / total_due * 100) if total_due > 0 else 0
    
    return TaxStats(
        total_assessments=len(all_assessments),
        total_tax_due=total_due,
        total_collected=total_collected,
        total_outstanding=total_outstanding,
        collection_rate=collection_rate,
        overdue_assessments=len(overdue),
        overdue_amount=overdue_amount
    )


# ============= PERMIT ENDPOINTS =============

@router.post("/permits", response_model=PermitResponse)
async def create_permit(
    permit_data: PermitCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a land use permit application"""
    
    # Verify claim exists
    claim = await Claim.get(permit_data.claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Check ownership
    if claim.user_id != str(current_user.id) and current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Calculate total fees
    total_fees = permit_data.application_fee + permit_data.permit_fee
    
    # Create permit
    permit = LandUsePermit(
        **permit_data.dict(),
        total_fees=total_fees,
        status=PermitStatus.draft
    )
    
    await permit.insert()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="permit_created",
        details=f"Created {permit.permit_type} permit application for parcel {permit.parcel_number}",
        ip_address="unknown"
    )
    await activity.insert()
    
    return PermitResponse(
        id=str(permit.id),
        **permit.dict(exclude={"id"})
    )


@router.get("/permits", response_model=List[PermitResponse])
async def get_permits(
    owner_id: Optional[str] = None,
    permit_type: Optional[PermitType] = None,
    status: Optional[PermitStatus] = None,
    limit: int = Query(50, le=100),
    skip: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get land use permits"""
    
    query = {}
    
    # Non-admin users can only see their own permits
    if current_user.role not in ["admin", "local_leader"]:
        query["owner_id"] = str(current_user.id)
    elif owner_id:
        query["owner_id"] = owner_id
    
    if permit_type:
        query["permit_type"] = permit_type
    if status:
        query["status"] = status
    
    permits = await LandUsePermit.find(query).sort(-LandUsePermit.application_date).skip(skip).limit(limit).to_list()
    
    return [
        PermitResponse(id=str(p.id), **p.dict(exclude={"id"}))
        for p in permits
    ]


@router.put("/permits/{permit_id}/review", response_model=PermitResponse)
async def review_permit(
    permit_id: str,
    review: PermitReview,
    current_user: User = Depends(get_current_user)
):
    """Review and approve/reject a permit (admin/leader only)"""
    
    if current_user.role not in ["admin", "local_leader"]:
        raise HTTPException(status_code=403, detail="Only admin or leader can review permits")
    
    permit = await LandUsePermit.get(permit_id)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    
    # Update review info
    permit.status = review.status
    permit.reviewer_id = str(current_user.id)
    permit.reviewer_name = current_user.full_name
    permit.review_date = datetime.utcnow()
    permit.review_notes = review.review_notes
    
    if review.status == PermitStatus.approved:
        permit.approved_by = current_user.full_name
        permit.approved_date = datetime.utcnow()
        permit.approval_conditions = review.approval_conditions
        permit.issue_date = review.issue_date or datetime.utcnow()
        permit.expiry_date = review.expiry_date
        # Generate permit number
        permit.permit_number = f"LUP-{permit.permit_type.value.upper()}-{datetime.utcnow().year}-{str(permit.id)[:8]}"
    elif review.status == PermitStatus.rejected:
        permit.rejection_reason = review.rejection_reason
    
    permit.updated_at = datetime.utcnow()
    await permit.save()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="permit_reviewed",
        details=f"Reviewed permit {permit_id} - Status: {permit.status}",
        ip_address="unknown"
    )
    await activity.insert()
    
    return PermitResponse(
        id=str(permit.id),
        **permit.dict(exclude={"id"})
    )


@router.get("/permits/stats", response_model=PermitStats)
async def get_permit_stats(
    current_user: User = Depends(get_current_user)
):
    """Get permit statistics (admin/leader only)"""
    
    if current_user.role not in ["admin", "local_leader"]:
        raise HTTPException(status_code=403, detail="Only admin or leader can view stats")
    
    all_permits = await LandUsePermit.find().to_list()
    
    pending = sum(1 for p in all_permits if p.status in [PermitStatus.submitted, PermitStatus.under_review])
    approved = sum(1 for p in all_permits if p.status == PermitStatus.approved)
    rejected = sum(1 for p in all_permits if p.status == PermitStatus.rejected)
    expired = sum(1 for p in all_permits if p.status == PermitStatus.expired)
    
    # Permits by type
    by_type = {}
    for p in all_permits:
        type_name = p.permit_type.value
        by_type[type_name] = by_type.get(type_name, 0) + 1
    
    total_fees = sum(p.fees_paid for p in all_permits)
    
    return PermitStats(
        total_permits=len(all_permits),
        pending_permits=pending,
        approved_permits=approved,
        rejected_permits=rejected,
        expired_permits=expired,
        permits_by_type=by_type,
        total_fees_collected=total_fees
    )
