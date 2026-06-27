"""
Routes for Online Donation functionality using PostgreSQL.
"""

from datetime import datetime, timezone
import time
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.sql_models import Donation, User
from models.donation import DonationCreateRequest, DonationResponse
from utils.jwt_handler import get_current_user, get_optional_current_user
from utils.activity_logger import log_user_activity

router = APIRouter(prefix="/api/donations", tags=["Donations"])


def generate_donation_id() -> str:
    """Generates a transaction reference code like TXN + 10 digits."""
    # Last 10 digits of timestamp in milliseconds
    ts = str(int(time.time() * 1000))[-10:]
    return f"TXN{ts}"


def format_donation(d: Donation) -> dict:
    """Helper to convert SQL fields to API response structure."""
    return {
        "_id": str(d.id),
        "donation_id": d.donation_id,
        "user_id": str(d.user_id) if d.user_id else None,
        "fullName": d.fullName,
        "mobile": d.mobile,
        "purpose": d.purpose,
        "amount": d.amount,
        "want80G": d.want80G,
        "panCard": d.panCard,
        "created_at": d.created_at,
    }


@router.post("/create", response_model=DonationResponse)
async def create_donation(
    request: DonationCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Register a donation transaction.
    Links to logged-in user if JWT is provided.
    """
    # Generate unique Donation ID
    donation_id = None
    for _ in range(5):
        temp_id = generate_donation_id()
        result_exist = await db.execute(select(Donation).where(Donation.donation_id == temp_id))
        if not result_exist.scalar_one_or_none():
            donation_id = temp_id
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique donation transaction ID. Please try again."
        )

    donation_doc = Donation(
        donation_id=donation_id,
        user_id=current_user.id if current_user else None,
        fullName=request.fullName,
        mobile=request.mobile,
        purpose=request.purpose,
        amount=request.amount,
        want80G=request.want80G,
        panCard=request.panCard if request.want80G else None,
        created_at=datetime.now(timezone.utc)
    )

    db.add(donation_doc)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Donation",
            title="Made a Donation",
            description=f"Donated ₹{request.amount} for {request.purpose}"
        )
        
    await db.commit()
    await db.refresh(donation_doc)

    return DonationResponse(**format_donation(donation_doc))


@router.get("/my-donations", response_model=List[DonationResponse])
async def get_my_donations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all donation transactions for the current authenticated user.
    """
    result = await db.execute(
        select(Donation).where(Donation.user_id == current_user.id).order_by(Donation.created_at.desc())
    )
    donations = result.scalars().all()
    return [DonationResponse(**format_donation(d)) for d in donations]
