from beanie import Document
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class ValuationMethod(str, Enum):
    market_comparison = "market_comparison"
    cost_approach = "cost_approach"
    income_approach = "income_approach"
    automated_valuation = "automated_valuation"
    professional_appraisal = "professional_appraisal"


class ValuationPurpose(str, Enum):
    sale = "sale"
    taxation = "taxation"
    mortgage = "mortgage"
    insurance = "insurance"
    inheritance = "inheritance"
    general_assessment = "general_assessment"


class PropertyValuation(Document):
    """Store property valuations, market prices, and assessment data"""
    
    # Related entities
    claim_id: str
    parcel_number: str
    
    # Valuation details
    valuation_date: datetime = Field(default_factory=datetime.utcnow)
    valuation_method: ValuationMethod
    valuation_purpose: ValuationPurpose
    
    # Property characteristics
    plot_area: float  # in square meters
    built_area: Optional[float] = None  # if any structures
    property_type: str = "land"  # land, residential, commercial, agricultural
    
    # Valuation amounts
    land_value: float  # Base land value
    improvement_value: Optional[float] = None  # Value of structures/improvements
    total_value: float  # Total assessed value
    currency: str = "RWF"
    
    # Market data
    price_per_sqm: float  # Price per square meter
    comparable_sales: Optional[dict] = None  # Reference sales used
    market_conditions: Optional[str] = None  # Current market description
    
    # Appraiser information
    appraiser_name: Optional[str] = None
    appraiser_id: Optional[str] = None  # User ID if internal
    appraiser_license: Optional[str] = None
    appraisal_company: Optional[str] = None
    
    # Factors affecting value
    location_score: Optional[int] = None  # 1-10 scale
    access_road_quality: Optional[str] = None
    utilities_available: List[str] = []  # water, electricity, sewage, etc.
    zoning: Optional[str] = None
    development_potential: Optional[str] = None
    
    # Validity and status
    valid_until: Optional[datetime] = None
    is_certified: bool = False
    certificate_number: Optional[str] = None
    
    # Additional information
    notes: Optional[str] = None
    report_url: Optional[str] = None  # Link to full appraisal report
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "property_valuations"
        indexes = [
            "claim_id",
            "parcel_number",
            "valuation_date",
            "valuation_purpose",
            "appraiser_id",
            [("claim_id", 1), ("valuation_date", -1)],
        ]


# Pydantic Schemas for API
class ValuationCreate(BaseModel):
    claim_id: str
    parcel_number: str
    valuation_method: ValuationMethod
    valuation_purpose: ValuationPurpose
    plot_area: float
    built_area: Optional[float] = None
    property_type: str = "land"
    land_value: float
    improvement_value: Optional[float] = None
    total_value: float
    currency: str = "RWF"
    appraiser_name: Optional[str] = None
    appraiser_license: Optional[str] = None
    appraisal_company: Optional[str] = None
    location_score: Optional[int] = None
    access_road_quality: Optional[str] = None
    utilities_available: List[str] = []
    zoning: Optional[str] = None
    notes: Optional[str] = None
    valid_until: Optional[datetime] = None
    is_certified: bool = False


class ValuationResponse(BaseModel):
    id: str
    claim_id: str
    parcel_number: str
    valuation_date: datetime
    valuation_method: str
    valuation_purpose: str
    plot_area: float
    total_value: float
    price_per_sqm: float
    currency: str
    appraiser_name: Optional[str] = None
    is_certified: bool
    valid_until: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ValuationStats(BaseModel):
    total_valuations: int
    average_land_value: float
    median_land_value: float
    highest_valuation: float
    lowest_valuation: float
    average_price_per_sqm: float
