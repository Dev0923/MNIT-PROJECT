"""
Pydantic schemas and models for Darshan Booking.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


class IndividualDetails(BaseModel):
    name: str = Field(..., min_length=2, description="Devotee name")
    age: int = Field(..., ge=1, le=120, description="Age of devotee")
    wheelchair: str = Field("no", description="'yes' or 'no'")

    @field_validator("wheelchair")
    @classmethod
    def validate_wheelchair(cls, v: str) -> str:
        if v.lower() not in ["yes", "no"]:
            raise ValueError("wheelchair must be either 'yes' or 'no'")
        return v.lower()


class GroupDetails(BaseModel):
    count: int = Field(..., ge=2, le=50, description="Total group size")
    names: List[str] = Field(..., description="Names of all group members")
    wheelchairs: int = Field(0, description="Number of wheelchairs needed")

    @field_validator("names")
    @classmethod
    def validate_names(cls, v: List[str], values) -> List[str]:
        # If count is specified, validate names length
        # Pydantic v2 validation check: count is in the data dictionary
        # Let's clean the names list
        cleaned = [name.strip() for name in v if name.strip()]
        if not cleaned:
            raise ValueError("Names list cannot be empty")
        return cleaned


class BookingCreateRequest(BaseModel):
    booking_type: str = Field(..., description="'individual' or 'group'")
    date: datetime = Field(..., description="Date and time of visit")
    phone: str = Field(..., description="10-digit contact phone number")
    city: str = Field(..., description="Contact city")
    
    # Optional fields depending on booking_type
    individual_details: Optional[IndividualDetails] = None
    group_details: Optional[GroupDetails] = None

    @field_validator("booking_type")
    @classmethod
    def validate_booking_type(cls, v: str) -> str:
        if v.lower() not in ["individual", "group"]:
            raise ValueError("booking_type must be either 'individual' or 'group'")
        return v.lower()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Must be a valid 10-digit Indian phone number")
        return v

    @field_validator("city")
    @classmethod
    def validate_city(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("City is required")
        return v


class BookingResponse(BaseModel):
    id: str = Field(..., alias="_id", description="MongoDB Document ID")
    booking_id: str = Field(..., description="Unique generated Booking code (e.g. KSJ-XXXX-XXXX)")
    user_id: Optional[str] = Field(None, description="Authenticated User ID if logged in")
    booking_type: str
    date: datetime
    phone: str
    city: str
    individual_details: Optional[IndividualDetails] = None
    group_details: Optional[GroupDetails] = None
    status: str = "Confirmed"
    created_at: datetime

    class Config:
        populate_by_name = True
