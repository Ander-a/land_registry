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
    photo_url: str
    geolocation: GeoLocation
    boundary: GeoJSONPolygon
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ClaimUpdate(BaseModel):
    status: Optional[str] = None
