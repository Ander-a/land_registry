from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field

class AIResult(Document):
    """MongoDB document for storing AI boundary detection results."""
    user_id: str
    claim_id: Optional[str] = None
    image_url: str
    detected_polygon: dict  # GeoJSON polygon
    method: str = "classical"  # "classical" or "ml"
    confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "ai_results"
        indexes = ["user_id", "claim_id"]
