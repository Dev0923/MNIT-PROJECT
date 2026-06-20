"""
Routes for Darshan Booking functionality.
"""

from datetime import datetime, timezone
import time
import random
import string
from typing import List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..models.booking import BookingCreateRequest, BookingResponse
from ..utils.jwt_handler import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/bookings", tags=["Darshan Bookings"])


def generate_booking_id() -> str:
    """Generates a unique booking code like KSJ-BASE36-RAND."""
    def encode_b36(num: int) -> str:
        alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        if num == 0:
            return "0"
        arr = []
        base = len(alphabet)
        while num:
            num, rem = divmod(num, base)
            arr.append(alphabet[rem])
        return ''.join(reversed(arr))
    
    # Use current timestamp in seconds
    ts_encoded = encode_b36(int(time.time()))
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"KSJ-{ts_encoded}-{rand}"


def format_booking_doc(doc: dict) -> dict:
    """Helper to convert MongoDB fields to API response structure."""
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc and doc["user_id"]:
        doc["user_id"] = str(doc["user_id"])
    return doc


@router.post("/create", response_model=BookingResponse)
async def create_booking(
    request: BookingCreateRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """
    Book a Darshan slot.
    Links to logged-in user if JWT is provided, otherwise creates an anonymous booking.
    """
    db = get_db()
    
    # Generate unique Booking ID and ensure no collision (highly unlikely)
    for _ in range(5):
        booking_id = generate_booking_id()
        existing = await db.bookings.find_one({"booking_id": booking_id})
        if not existing:
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique booking ID. Please try again."
        )

    booking_doc = {
        "booking_id": booking_id,
        "user_id": current_user["_id"] if current_user else None,
        "booking_type": request.booking_type,
        "date": request.date,
        "phone": request.phone,
        "city": request.city,
        "individual_details": request.individual_details.model_dump() if request.individual_details else None,
        "group_details": request.group_details.model_dump() if request.group_details else None,
        "created_at": datetime.now(timezone.utc)
    }

    result = await db.bookings.insert_one(booking_doc)
    booking_doc["_id"] = result.inserted_id

    return BookingResponse(**format_booking_doc(booking_doc))


@router.get("/my-bookings", response_model=List[BookingResponse])
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    """
    Get all bookings for the current authenticated user.
    """
    db = get_db()
    cursor = db.bookings.find({"user_id": current_user["_id"]}).sort("date", 1)
    bookings = []
    async for doc in cursor:
        bookings.append(BookingResponse(**format_booking_doc(doc)))
    return bookings


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_details(booking_id: str):
    """
    Retrieve booking details by Booking ID. Used for QR code scanning.
    """
    db = get_db()
    booking = await db.bookings.find_one({"booking_id": booking_id.upper()})
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking code {booking_id} not found."
        )
        
    return BookingResponse(**format_booking_doc(booking))
