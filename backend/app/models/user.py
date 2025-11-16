from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field, EmailStr

class User(Document):
    name: str
    email: EmailStr = Field(unique=True)
    hashed_password: str
    role: str = Field(default="citizen")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = ["email"]
