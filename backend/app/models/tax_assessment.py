from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TaxStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    overdue = "overdue"
    partially_paid = "partially_paid"
    waived = "waived"
    disputed = "disputed"


class PaymentMethod(str, Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    mobile_money = "mobile_money"
    check = "check"
    card = "card"


class TaxAssessment(Document):
    """Track property tax assessments, payments, and outstanding balances"""
    
    # Related entities
    claim_id: str
    parcel_number: str
    owner_id: str
    owner_name: str
    
    # Assessment period
    tax_year: int
    assessment_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime
    
    # Property details
    plot_area: float
    assessed_value: float  # Property value for tax calculation
    
    # Tax calculation
    base_tax_rate: float  # Percentage or fixed rate
    tax_amount: float  # Total tax due
    penalty_amount: float = 0.0  # Late payment penalties
    discount_amount: float = 0.0  # Early payment discounts
    total_due: float  # tax_amount + penalty - discount
    
    # Payment tracking
    amount_paid: float = 0.0
    balance_due: float  # Remaining amount
    status: TaxStatus = TaxStatus.pending
    
    # Payment history
    payment_date: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    payment_reference: Optional[str] = None
    receipt_number: Optional[str] = None
    
    # Additional charges/credits
    service_charges: float = 0.0
    exemptions: List[dict] = []  # [{type, amount, reason}]
    
    # Status and notes
    is_disputed: bool = False
    dispute_reason: Optional[str] = None
    waiver_reason: Optional[str] = None
    waived_by: Optional[str] = None
    waived_date: Optional[datetime] = None
    
    notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "tax_assessments"
        indexes = [
            "claim_id",
            "parcel_number",
            "owner_id",
            "tax_year",
            "status",
            "due_date",
            [("owner_id", 1), ("tax_year", -1)],
            [("status", 1), ("due_date", 1)],
        ]


# Pydantic Schemas for API
class TaxAssessmentCreate(BaseModel):
    claim_id: str
    parcel_number: str
    owner_id: str
    owner_name: str
    tax_year: int
    due_date: datetime
    plot_area: float
    assessed_value: float
    base_tax_rate: float
    tax_amount: float
    service_charges: float = 0.0
    notes: Optional[str] = None


class TaxPayment(BaseModel):
    amount: float
    payment_method: PaymentMethod
    payment_reference: str
    receipt_number: Optional[str] = None
    notes: Optional[str] = None


class TaxAssessmentUpdate(BaseModel):
    status: Optional[TaxStatus] = None
    penalty_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    waiver_reason: Optional[str] = None
    dispute_reason: Optional[str] = None
    notes: Optional[str] = None


class TaxAssessmentResponse(BaseModel):
    id: str
    claim_id: str
    parcel_number: str
    owner_name: str
    tax_year: int
    assessment_date: datetime
    due_date: datetime
    assessed_value: float
    tax_amount: float
    penalty_amount: float
    discount_amount: float
    total_due: float
    amount_paid: float
    balance_due: float
    status: str
    payment_date: Optional[datetime] = None
    receipt_number: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TaxStats(BaseModel):
    total_assessments: int
    total_tax_due: float
    total_collected: float
    total_outstanding: float
    collection_rate: float  # Percentage
    overdue_assessments: int
    overdue_amount: float
