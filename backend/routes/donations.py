"""
Routes for Online Donation functionality.
"""

from datetime import datetime, timezone
import time
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..models.donation import DonationCreateRequest, DonationResponse
from ..utils.jwt_handler import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/donations", tags=["Donations"])


def generate_donation_id() -> str:
    """Generates a transaction reference code like TXN + 10 digits."""
    # Last 10 digits of timestamp in milliseconds
    ts = str(int(time.time() * 1000))[-10:]
    return f"TXN{ts}"


def format_donation_doc(doc: dict) -> dict:
    """Helper to convert MongoDB fields to API response structure."""
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc and doc["user_id"]:
        doc["user_id"] = str(doc["user_id"])
    return doc


@router.post("/create", response_model=DonationResponse)
async def create_donation(
    request: DonationCreateRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Register a donation transaction.
    Links to logged-in user if JWT is provided.
    """
    db = get_db()
    
    # Generate unique Donation ID
    for _ in range(5):
        donation_id = generate_donation_id()
        existing = await db.donations.find_one({"donation_id": donation_id})
        if not existing:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique donation transaction ID. Please try again."
        )

    donation_doc = {
        "donation_id": donation_id,
        "user_id": current_user["_id"] if current_user else None,
        "fullName": request.fullName,
        "mobile": request.mobile,
        "purpose": request.purpose,
        "amount": request.amount,
        "want80G": request.want80G,
        "panCard": request.panCard if request.want80G else None,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.donations.insert_one(donation_doc)
    donation_doc["_id"] = result.inserted_id

    return DonationResponse(**format_donation_doc(donation_doc))


@router.get("/my-donations", response_model=List[DonationResponse])
async def get_my_donations(current_user: dict = Depends(get_current_user)):
    """
    Get all donation transactions for the current authenticated user.
    """
    db = get_db()
    cursor = db.donations.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    donations = []
    async for doc in cursor:
        donations.append(DonationResponse(**format_donation_doc(doc)))
    return donations
