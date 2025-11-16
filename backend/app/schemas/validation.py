from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ValidationCreate(BaseModel):
    claim_id: str
    status: str = "approved"  # "approved" or "rejected"
    comment: Optional[str] = None

class ValidationRead(BaseModel):
    id: str
    claim_id: str
    validator_id: str
    validator_role: str
    status: str
    comment: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class ValidationResponse(BaseModel):
    success: bool
    message: str
    validation_id: Optional[str] = None
    claim_validation_status: Optional[str] = None
    witness_count: Optional[int] = None
    endorsed_by_leader: Optional[bool] = None
