from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

class GeoLocation(BaseModel):
    latitude: float
    longitude: float

class GeoJSONPolygon(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # [[[lng, lat], [lng, lat], ...]]

class ClaimCreate(BaseModel):
    user_id: str
    boundary: GeoJSONPolygon

class ClaimRead(BaseModel):
    id: str
    user_id: str
    claimant_name: str
    claimant_email: str
    photo_url: str
    geolocation: GeoLocation
    boundary: GeoJSONPolygon
    plot_area: Optional[float] = None
    status: str
    validation_status: Optional[str] = "pending"
    endorsed_by_leader: Optional[bool] = False
    witness_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True

class ClaimUpdate(BaseModel):
    status: Optional[str] = None
