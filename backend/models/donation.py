"""
Pydantic schemas and models for Online Donations.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
import re


class DonationCreateRequest(BaseModel):
    fullName: str = Field(..., min_length=2, description="Donor's full name")
    mobile: str = Field(..., description="10-digit mobile number")
    purpose: str = Field(..., description="Donation purpose category")
    amount: float = Field(..., ge=1, description="Donation amount in INR")
    want80G: bool = Field(False, description="Whether 80G certificate is requested")
    panCard: Optional[str] = Field(None, description="PAN Card number (10 characters)")

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Must be a valid 10-digit Indian mobile number")
        return v

    @field_validator("panCard")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().upper()
        if v == "":
            return None
        if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", v):
            raise ValueError("Must be a valid 10-character PAN (e.g., ABCDE1234F)")
        return v

    @model_validator(mode="after")
    def check_pan_if_80g(self):
        if self.want80G and not self.panCard:
            raise ValueError("PAN Card is required when requesting 80G tax exemption")
        return self


class DonationResponse(BaseModel):
    id: str = Field(..., alias="_id", description="MongoDB Document ID")
    donation_id: str = Field(..., description="Unique generated Transaction/Donation ID")
    user_id: Optional[str] = Field(None, description="Associated authenticated user ID if logged in")
    fullName: str
    mobile: str
    purpose: str
    amount: float
    want80G: bool
    panCard: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True
