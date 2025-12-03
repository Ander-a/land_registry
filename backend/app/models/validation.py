from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")


class ValidationAction(str):
    VOUCH = "vouch"
    DISPUTE = "dispute"
    UNSURE = "unsure"


class Validation(Document):
    """Individual validation record from a community validator"""
    claim_id: str = Field(..., description="ID of the claim being validated")
    validator_id: str = Field(..., description="ID of the validator")
    validator_name: str = Field(..., description="Name of the validator")
    validator_trust_score: float = Field(default=50.0, description="Trust score of validator at time of validation")
    action: str = Field(..., description="Validation action: vouch, dispute, or unsure")
    reason: Optional[str] = Field(None, description="Reason for dispute (required if action is dispute)")
    validator_location: Optional[dict] = Field(None, description="Validator's GPS location at time of validation")
    distance_to_claim: Optional[float] = Field(None, description="Distance from validator to claim in kilometers")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Consensus tracking
    weight: float = Field(default=1.0, description="Weighted value of this validation")
    is_counted: bool = Field(default=True, description="Whether this validation counts toward consensus")
    
    # Outcome tracking (updated after consensus)
    was_correct: Optional[bool] = Field(None, description="Whether this validation matched final consensus")
    trust_score_impact: Optional[float] = Field(None, description="Impact on validator's trust score")
    
    # Legacy fields for backward compatibility
    validator_role: Optional[str] = Field(None, description="Legacy: witness or leader")
    status: Optional[str] = Field(None, description="Legacy: approved, rejected, pending")
    comment: Optional[str] = Field(None, description="Legacy comment field")
    timestamp: Optional[datetime] = Field(None, description="Legacy timestamp field")

    class Settings:
        name = "validations"
        indexes = [
            "claim_id",
            "validator_id",
            [("claim_id", 1), ("validator_id", 1)],  # Compound index for uniqueness check
            "created_at",
            "validator_role"  # Legacy index
        ]


class ValidationConsensus(Document):
    """Consensus result for a claim based on community validations"""
    claim_id: str = Field(..., description="ID of the claim")
    
    # Validation counts
    total_validations: int = Field(default=0)
    vouch_count: int = Field(default=0)
    dispute_count: int = Field(default=0)
    unsure_count: int = Field(default=0)
    
    # Weighted scores
    vouch_weight: float = Field(default=0.0, description="Total weighted vouch score")
    dispute_weight: float = Field(default=0.0, description="Total weighted dispute score")
    unsure_weight: float = Field(default=0.0, description="Total weighted unsure score")
    total_weight: float = Field(default=0.0, description="Total weight of all validations")
    
    # Consensus result
    consensus_reached: bool = Field(default=False)
    consensus_action: Optional[str] = Field(None, description="Final consensus: validated or rejected")
    consensus_percentage: Optional[float] = Field(None, description="Percentage of winning consensus")
    confidence_level: Optional[str] = Field(None, description="low, medium, high, very_high")
    
    # Requirements
    minimum_validations_met: bool = Field(default=False)
    consensus_threshold_met: bool = Field(default=False)
    
    # Timestamps
    first_validation_at: Optional[datetime] = Field(None)
    consensus_reached_at: Optional[datetime] = Field(None)
    last_updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Statistics
    avg_validator_trust_score: Optional[float] = Field(None)
    avg_distance_to_claim: Optional[float] = Field(None)
    top_validators: List[dict] = Field(default_factory=list, description="List of top validators who participated")

    class Settings:
        name = "validation_consensus"
        indexes = [
            "claim_id",
            "consensus_reached",
            "last_updated_at"
        ]


# Pydantic models for API requests/responses
class ValidationCreate(BaseModel):
    claim_id: str
    action: str  # vouch, dispute, unsure
    reason: Optional[str] = None
    validator_location: Optional[dict] = None


class ValidationResponse(BaseModel):
    id: str
    claim_id: str
    validator_id: str
    validator_name: str
    action: str
    reason: Optional[str] = None
    distance_to_claim: Optional[float] = None
    trust_score_impact: Optional[float] = None
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }


class ConsensusResponse(BaseModel):
    claim_id: str
    consensus_reached: bool
    consensus_action: Optional[str] = None
    consensus_percentage: Optional[float] = None
    confidence_level: Optional[str] = None
    total_validations: int
    vouch_count: int
    dispute_count: int
    unsure_count: int
    minimum_validations_met: bool
    consensus_threshold_met: bool
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            ObjectId: lambda v: str(v)
        }
