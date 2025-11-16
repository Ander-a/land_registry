from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class Validation(Document):
    """MongoDB document for storing claim validations (witness/leader endorsements)."""
    claim_id: str
    validator_id: str
    validator_role: str  # "witness" or "leader"
    status: str  # "approved", "rejected", "pending"
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "validations"
        indexes = ["claim_id", "validator_id", "validator_role"]
