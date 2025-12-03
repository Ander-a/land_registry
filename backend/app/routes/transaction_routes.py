from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from beanie import PydanticObjectId

from app.models.land_transaction import (
    LandTransaction, TransactionCreate, TransactionUpdate,
    TransactionResponse, TransactionStats, TransactionType, TransactionStatus
)
from app.models.property_valuation import (
    PropertyValuation, ValuationCreate, ValuationResponse,
    ValuationStats
)
from app.models.claim import Claim
from app.models.user import User
from app.auth import get_current_user
from app.models.activity_log import ActivityLog

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new land transaction"""
    
    # Verify claim exists
    claim = await Claim.get(transaction_data.claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Create transaction
    transaction = LandTransaction(
        **transaction_data.dict(),
        seller_id=str(current_user.id)  # Current owner is seller
    )
    
    # Calculate price per sqm if amount provided
    if transaction.transaction_amount and claim.plot_area:
        transaction.price_per_sqm = transaction.transaction_amount / claim.plot_area
    
    await transaction.insert()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="transaction_created",
        details=f"Created {transaction.transaction_type} transaction for parcel {transaction.parcel_number}",
        ip_address="unknown"
    )
    await activity.insert()
    
    return TransactionResponse(
        id=str(transaction.id),
        **transaction.dict(exclude={"id"})
    )


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    claim_id: Optional[str] = None,
    parcel_number: Optional[str] = None,
    transaction_type: Optional[TransactionType] = None,
    status: Optional[TransactionStatus] = None,
    limit: int = Query(50, le=100),
    skip: int = 0,
    current_user: User = Depends(get_current_user)
):
    """Get transactions with optional filters"""
    
    query = {}
    
    if claim_id:
        query["claim_id"] = claim_id
    if parcel_number:
        query["parcel_number"] = parcel_number
    if transaction_type:
        query["transaction_type"] = transaction_type
    if status:
        query["status"] = status
    
    # Non-admin users can only see their own transactions
    if current_user.role not in ["admin", "local_leader"]:
        query["$or"] = [
            {"seller_id": str(current_user.id)},
            {"buyer_id": str(current_user.id)}
        ]
    
    transactions = await LandTransaction.find(query).sort(-LandTransaction.transaction_date).skip(skip).limit(limit).to_list()
    
    return [
        TransactionResponse(id=str(t.id), **t.dict(exclude={"id"}))
        for t in transactions
    ]


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific transaction"""
    
    transaction = await LandTransaction.get(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Check access
    if current_user.role not in ["admin", "local_leader"]:
        if transaction.seller_id != str(current_user.id) and transaction.buyer_id != str(current_user.id):
            raise HTTPException(status_code=403, detail="Not authorized to view this transaction")
    
    return TransactionResponse(
        id=str(transaction.id),
        **transaction.dict(exclude={"id"})
    )


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a transaction (admin/leader only)"""
    
    if current_user.role not in ["admin", "local_leader"]:
        raise HTTPException(status_code=403, detail="Only admin or leader can update transactions")
    
    transaction = await LandTransaction.get(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update fields
    update_dict = update_data.dict(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(transaction, field, value)
    
    # If status changed to approved
    if update_data.status == TransactionStatus.approved:
        transaction.approved_by = str(current_user.id)
        transaction.approved_date = datetime.utcnow()
        
        # Update claim ownership if this is a transfer/sale
        if transaction.transaction_type in [TransactionType.sale, TransactionType.transfer]:
            claim = await Claim.get(transaction.claim_id)
            if claim and transaction.buyer_id:
                claim.user_id = transaction.buyer_id
                await claim.save()
    
    # Recalculate total_due for tax transactions
    if hasattr(transaction, 'total_due'):
        transaction.total_due = transaction.tax_amount + transaction.penalty_amount - transaction.discount_amount
    
    transaction.updated_at = datetime.utcnow()
    await transaction.save()
    
    # Log activity
    activity = ActivityLog(
        user_id=str(current_user.id),
        action="transaction_updated",
        details=f"Updated transaction {transaction_id} - Status: {transaction.status}",
        ip_address="unknown"
    )
    await activity.insert()
    
    return TransactionResponse(
        id=str(transaction.id),
        **transaction.dict(exclude={"id"})
    )


@router.get("/stats/summary", response_model=TransactionStats)
async def get_transaction_stats(
    current_user: User = Depends(get_current_user)
):
    """Get transaction statistics (admin/leader only)"""
    
    if current_user.role not in ["admin", "local_leader"]:
        raise HTTPException(status_code=403, detail="Only admin or leader can view stats")
    
    all_transactions = await LandTransaction.find().to_list()
    
    total = len(all_transactions)
    pending = sum(1 for t in all_transactions if t.status == TransactionStatus.pending)
    completed = sum(1 for t in all_transactions if t.status == TransactionStatus.completed)
    
    # Calculate total value
    total_value = sum(t.transaction_amount or 0 for t in all_transactions)
    avg_value = total_value / total if total > 0 else 0
    
    # Transactions by type
    by_type = {}
    for t in all_transactions:
        type_name = t.transaction_type.value
        by_type[type_name] = by_type.get(type_name, 0) + 1
    
    return TransactionStats(
        total_transactions=total,
        pending_transactions=pending,
        completed_transactions=completed,
        total_value=total_value,
        average_transaction_value=avg_value,
        transactions_by_type=by_type
    )
