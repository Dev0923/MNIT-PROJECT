"""
Pydantic schemas and models for Help & Support Queries.
"""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import re


class SupportQueryRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Devotee's name")
    email: str = Field(..., description="Email address for replies")
    subject: str = Field(..., min_length=3, description="Subject of query")
    message: str = Field(..., min_length=10, description="Detailed message body")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Must be a valid email address")
        return v


class SupportQueryResponse(BaseModel):
    id: str = Field(..., alias="_id", description="MongoDB Document ID")
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime

    class Config:
        populate_by_name = True
