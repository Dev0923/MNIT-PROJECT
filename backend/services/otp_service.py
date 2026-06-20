"""
OTP generation, storage, and verification service.
"""

import random
import string
from datetime import datetime, timedelta, timezone

from ..config import settings
from ..database import get_db


async def generate_and_store_otp(identifier: str) -> str:
    """
    Generate a 6-digit OTP, store it in MongoDB, and return the OTP.
    In mock mode, always returns '123456'.
    """
    db = get_db()

    # Rate limiting: max 5 OTP requests per identifier per hour
    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
    recent_count = await db.otps.count_documents({
        "identifier": identifier,
        "created_at": {"$gte": one_hour_ago},
    })
    if recent_count >= 5:
        raise Exception("Too many OTP requests. Please try again later.")

    # Generate OTP
    if settings.otp_mode == "mock":
        otp_code = "123456"
    else:
        otp_code = "".join(random.choices(string.digits, k=6))

    # Delete any existing OTPs for this identifier
    await db.otps.delete_many({"identifier": identifier})

    # Store new OTP
    otp_doc = {
        "identifier": identifier,
        "otp_code": otp_code,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(
            minutes=settings.otp_expiry_minutes
        ),
        "verified": False,
    }
    await db.otps.insert_one(otp_doc)

    # Log in console (useful for development)
    print(f"📩 OTP for {identifier}: {otp_code}")

    return otp_code


async def verify_otp(identifier: str, otp_code: str) -> bool:
    """
    Verify OTP against stored value. Returns True if valid.
    """
    db = get_db()

    otp_doc = await db.otps.find_one({
        "identifier": identifier,
        "otp_code": otp_code,
        "verified": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)},
    })

    if not otp_doc:
        return False

    # Mark as verified and delete
    await db.otps.delete_one({"_id": otp_doc["_id"]})

    return True
