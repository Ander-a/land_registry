from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: str  # MongoDB uses string IDs
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True
