"""
User and OTP Pydantic models / schemas.
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
import re


# ── Request Models ─────────────────────────────────────

class SendOTPRequest(BaseModel):
    """Request body for sending OTP. Accepts phone or email."""
    identifier: str = Field(..., description="Phone number (10 digits) or email address")

    @field_validator("identifier")
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Identifier (phone or email) is required")

        # Check if it's a valid email
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        # Check if it's a valid Indian phone number (10 digits)
        phone_pattern = r"^[6-9]\d{9}$"

        if not re.match(email_pattern, v) and not re.match(phone_pattern, v):
            raise ValueError(
                "Must be a valid email address or 10-digit Indian phone number"
            )
        return v


class VerifyOTPRequest(BaseModel):
    """Request body for verifying OTP."""
    identifier: str = Field(..., description="Phone number or email used to send OTP")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("OTP must contain only digits")
        return v


# ── Response Models ────────────────────────────────────

class UserResponse(BaseModel):
    """User data returned in API responses."""
    id: str = Field(..., description="User ID")
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None


class TokenResponse(BaseModel):
    """Response after successful OTP verification."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    """Simple message response."""
    success: bool
    message: str


# ── Helper to detect identifier type ──────────────────

def get_identifier_type(identifier: str) -> str:
    """Returns 'email' or 'phone' based on the identifier format."""
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if re.match(email_pattern, identifier):
        return "email"
    return "phone"


# ── New Signup & Password Login Requests ──────────────

class RegisterRequest(BaseModel):
    """Request body for devotee self-registration."""
    name: str = Field(..., min_length=2, description="Devotee full name")
    phone: str = Field(..., description="10-digit Indian phone number")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP sent to phone")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    confirm_password: str = Field(..., description="Confirm password")
    email: Optional[str] = Field(None, description="Optional email address")
    receive_updates: bool = Field(False, description="Agree to receive updates and news")

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Must be a valid 10-digit Indian phone number")
        return v

    @field_validator("otp")
    @classmethod
    def validate_otp(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit():
            raise ValueError("OTP must contain only digits")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v = v.strip().lower()
        if v == "":
            return None
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v):
            raise ValueError("Must be a valid email address")
        return v

    @model_validator(mode="after")
    def verify_passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self



class LoginPasswordRequest(BaseModel):
    """Request body for login with password."""
    identifier: str = Field(..., description="Phone number or email address")
    password: str = Field(..., description="Account password")

    @field_validator("identifier")
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Identifier (phone or email) is required")

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        phone_pattern = r"^[6-9]\d{9}$"

        if not re.match(email_pattern, v) and not re.match(phone_pattern, v):
            raise ValueError("Must be a valid email address or 10-digit Indian phone number")
        return v

