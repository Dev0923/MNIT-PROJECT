"""
OTP generation, storage, and verification service using PostgreSQL.
"""

import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from config import settings
from models.sql_models import OTP


async def generate_and_store_otp(db: AsyncSession, identifier: str) -> str:
    """
    Generate a 6-digit OTP, store it in PostgreSQL, and return the OTP.
    In mock mode, always returns '123456'.
    """
    # Rate limiting: max 5 OTP requests per identifier per hour
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    
    result = await db.execute(
        select(func.count(OTP.id)).where(
            OTP.identifier == identifier,
            OTP.created_at >= one_hour_ago
        )
    )
    recent_count = result.scalar() or 0
    
    if recent_count >= 5:
        raise Exception("Too many OTP requests. Please try again later.")

    # Generate OTP
    if settings.otp_mode == "mock":
        otp_code = "123456"
    else:
        otp_code = "".join(random.choices(string.digits, k=6))

    # Delete any existing OTPs for this identifier
    await db.execute(
        delete(OTP).where(OTP.identifier == identifier)
    )

    # Store new OTP
    otp_doc = OTP(
        identifier=identifier,
        otp_code=otp_code,
        created_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(
            minutes=settings.otp_expiry_minutes
        ),
        verified=False,
    )
    db.add(otp_doc)
    await db.commit()

    # Log in console (useful for development)
    print(f"[OTP] OTP for {identifier}: {otp_code}")

    return otp_code


async def verify_otp(db: AsyncSession, identifier: str, otp_code: str) -> bool:
    """
    Verify OTP against stored value. Returns True if valid.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(OTP).where(
            OTP.identifier == identifier,
            OTP.otp_code == otp_code,
            OTP.verified == False,
            OTP.expires_at > now
        )
    )
    otp_doc = result.scalar_one_or_none()

    if not otp_doc:
        return False

    # Delete verified OTP
    await db.delete(otp_doc)
    await db.commit()

    return True
