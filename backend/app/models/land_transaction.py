from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    sale = "sale"
    transfer = "transfer"
    inheritance = "inheritance"
    gift = "gift"
    lease = "lease"
    mortgage = "mortgage"


class TransactionStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"
    cancelled = "cancelled"


class LandTransaction(Document):
    """Track property transfers, sales, and ownership changes"""
    
    # Related entities
    claim_id: str  # The property/claim being transacted
    parcel_number: str
    
    # Transaction details
    transaction_type: TransactionType
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Parties involved
    seller_id: Optional[str] = None  # Previous owner user ID
    seller_name: str
    buyer_id: Optional[str] = None  # New owner user ID
    buyer_name: str
    
    # Financial details
    transaction_amount: Optional[float] = None  # Sale price or value
    currency: str = "RWF"  # Rwandan Franc
    tax_paid: Optional[float] = None
    registration_fee: Optional[float] = None
    
    # Legal details
    deed_number: Optional[str] = None
    contract_reference: Optional[str] = None
    notary_name: Optional[str] = None
    witness_names: List[str] = []
    
    # Status and approval
    status: TransactionStatus = TransactionStatus.pending
    approved_by: Optional[str] = None  # Admin/Leader who approved
    approved_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    
    # Additional information
    notes: Optional[str] = None
    conditions: List[str] = []
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "land_transactions"
        indexes = [
            "claim_id",
            "parcel_number",
            "seller_id",
            "buyer_id",
            "transaction_type",
            "status",
            "transaction_date",
            [("claim_id", 1), ("transaction_date", -1)],
        ]


# Pydantic Schemas for API
class TransactionCreate(BaseModel):
    claim_id: str
    parcel_number: str
    transaction_type: TransactionType
    seller_name: str
    buyer_name: str
    buyer_id: Optional[str] = None
    transaction_amount: Optional[float] = None
    currency: str = "RWF"
    deed_number: Optional[str] = None
    contract_reference: Optional[str] = None
    notary_name: Optional[str] = None
    witness_names: List[str] = []
    notes: Optional[str] = None
    conditions: List[str] = []


class TransactionUpdate(BaseModel):
    status: Optional[TransactionStatus] = None
    rejection_reason: Optional[str] = None
    transaction_amount: Optional[float] = None
    tax_paid: Optional[float] = None
    registration_fee: Optional[float] = None
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    claim_id: str
    parcel_number: str
    transaction_type: str
    transaction_date: datetime
    seller_name: str
    buyer_name: str
    transaction_amount: Optional[float] = None
    currency: str
    status: str
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    deed_number: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TransactionStats(BaseModel):
    total_transactions: int
    pending_transactions: int
    completed_transactions: int
    total_value: float
    average_transaction_value: float
    transactions_by_type: dict
