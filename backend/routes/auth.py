"""
Authentication routes — registration, OTP login, password login.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.sql_models import User, OTP
from models.user import (
    RegisterRequest,
    LoginPasswordRequest,
    TokenResponse,
    UserResponse,
    MessageResponse,
    SendOTPRequest,
    VerifyOTPRequest,
)
from utils.jwt_handler import create_access_token, get_current_user
from utils.password_handler import hash_password, verify_password

import random, string

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ── Helpers ─────────────────────────────────────────────

def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _format_user(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        phone=user.phone,
        email=user.email,
        name=user.name,
        created_at=user.created_at,
        last_login=user.last_login,
    )


# ── OTP Endpoints ────────────────────────────────────────

@router.post("/send-otp", response_model=MessageResponse)
async def send_otp(
    request: SendOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Send a 6-digit OTP to the given phone or email.
    In mock mode the OTP is returned directly in the response message.
    """
    from config import settings
    from datetime import timedelta

    otp_code = _generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expiry_minutes)

    otp_entry = OTP(
        identifier=request.identifier,
        otp_code=otp_code,
        expires_at=expires_at,
        verified=False,
    )
    db.add(otp_entry)
    await db.commit()

    if settings.otp_mode == "mock":
        return MessageResponse(success=True, message=f"OTP sent (mock): {otp_code}")

    # Live mode: integrate SMS/email here
    return MessageResponse(success=True, message="OTP sent successfully.")


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    request: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify OTP and return a JWT token. Creates user account if first time.
    """
    from datetime import timedelta

    result = await db.execute(
        select(OTP)
        .where(OTP.identifier == request.identifier, OTP.otp_code == request.otp, OTP.verified == False)
        .order_by(OTP.created_at.desc())
    )
    otp_entry = result.scalar_one_or_none()

    if not otp_entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP.")

    if datetime.now(timezone.utc) > otp_entry.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired.")

    otp_entry.verified = True
    await db.commit()

    # Find or create user
    is_email = "@" in request.identifier
    if is_email:
        q = select(User).where(User.email == request.identifier)
    else:
        q = select(User).where(User.phone == request.identifier)

    result_user = await db.execute(q)
    user = result_user.scalar_one_or_none()

    if not user:
        user = User(
            email=request.identifier if is_email else None,
            phone=None if is_email else request.identifier,
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=_format_user(user))


# ── Password Endpoints ───────────────────────────────────

@router.post("/register", response_model=TokenResponse)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Devotee self-registration with OTP verification.
    """
    # Verify OTP first
    result_otp = await db.execute(
        select(OTP)
        .where(OTP.identifier == request.phone, OTP.otp_code == request.otp, OTP.verified == False)
        .order_by(OTP.created_at.desc())
    )
    otp_entry = result_otp.scalar_one_or_none()

    if not otp_entry:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

    otp_entry.verified = True

    # Check existing user
    result_existing = await db.execute(select(User).where(User.phone == request.phone))
    if result_existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered.")

    if request.email:
        result_email = await db.execute(select(User).where(User.email == request.email))
        if result_email.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered.")

    user = User(
        name=request.name,
        phone=request.phone,
        email=request.email,
        password_hash=hash_password(request.password),
        receive_updates=request.receive_updates,
        created_at=datetime.now(timezone.utc),
        last_login=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=_format_user(user))


@router.post("/login", response_model=TokenResponse)
async def login_with_password(
    request: LoginPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Login with phone/email + password. Works for both regular users and admins.
    """
    is_email = "@" in request.identifier
    if is_email:
        q = select(User).where(User.email == request.identifier)
    else:
        q = select(User).where(User.phone == request.identifier)

    result = await db.execute(q)
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=_format_user(user))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return _format_user(current_user)
