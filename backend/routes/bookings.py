"""
Routes for Darshan Booking functionality using PostgreSQL.
"""

from datetime import datetime, timezone
import time
import random
import string
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.sql_models import Booking, User, DarshanSlot
from models.booking import BookingCreateRequest, BookingResponse
from utils.jwt_handler import get_current_user, get_optional_current_user

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


def format_booking(b: Booking) -> dict:
    """Helper to convert SQL fields to API response dict structure."""
    return {
        "_id": str(b.id),
        "booking_id": b.booking_id,
        "user_id": str(b.user_id) if b.user_id else None,
        "booking_type": b.booking_type,
        "date": b.date,
        "phone": b.phone,
        "city": b.city,
        "individual_details": b.individual_details,
        "group_details": b.group_details,
        "status": getattr(b, "status", "Confirmed"),
        "created_at": b.created_at,
    }


@router.post("/create", response_model=BookingResponse)
async def create_booking(
    request: BookingCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Book a Darshan slot.
    Links to logged-in user if JWT is provided, otherwise creates an anonymous booking.
    Natively controls crowd slot capacities using database locks.
    """
    # 1. Truncate requested visit time to the hour to check the Darshan Slot
    slot_time = request.date.replace(minute=0, second=0, microsecond=0)
    
    # 2. Query and lock the slot to prevent race conditions during updates
    result_slot = await db.execute(
        select(DarshanSlot).where(DarshanSlot.slot_time == slot_time).with_for_update()
    )
    slot = result_slot.scalar_one_or_none()
    
    if not slot:
        # Create a new slot config if it doesn't exist yet (default capacity = 1000)
        slot = DarshanSlot(slot_time=slot_time, capacity=1000, booked_count=0)
        db.add(slot)
        # Flush to generate ID and secure the lock
        await db.flush()

    # 3. Calculate booking count
    booking_size = 1
    if request.booking_type == "group" and request.group_details:
        booking_size = request.group_details.count

    # 4. Check capacity
    if slot.booked_count + booking_size > slot.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The selected hourly slot ({slot_time.strftime('%H:%M')}) is fully booked. "
                   f"Only {slot.capacity - slot.booked_count} spots are left."
        )

    # 5. Generate a unique Booking ID and ensure no collision in PostgreSQL
    booking_id = None
    for _ in range(5):
        temp_id = generate_booking_id()
        result_exist = await db.execute(select(Booking).where(Booking.booking_id == temp_id))
        if not result_exist.scalar_one_or_none():
            booking_id = temp_id
            break
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique booking ID. Please try again."
        )

    # 6. Create booking record
    booking_doc = Booking(
        booking_id=booking_id,
        user_id=current_user.id if current_user else None,
        booking_type=request.booking_type,
        date=request.date,
        phone=request.phone,
        city=request.city,
        individual_details=request.individual_details.model_dump() if request.individual_details else None,
        group_details=request.group_details.model_dump() if request.group_details else None,
        created_at=datetime.now(timezone.utc)
    )
    
    # Update slot count
    slot.booked_count += booking_size

    db.add(booking_doc)
    await db.commit()
    await db.refresh(booking_doc)

    return BookingResponse(**format_booking(booking_doc))


@router.get("/my-bookings", response_model=List[BookingResponse])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all bookings for the current authenticated user.
    """
    result = await db.execute(
        select(Booking).where(Booking.user_id == current_user.id).order_by(Booking.date.asc())
    )
    bookings = result.scalars().all()
    return [BookingResponse(**format_booking(b)) for b in bookings]


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking_details(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve booking details by Booking ID. Used for QR code scanning.
    """
    result = await db.execute(
        select(Booking).where(Booking.booking_id == booking_id.upper())
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking code {booking_id} not found."
        )
        
    return BookingResponse(**format_booking(booking))


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel an upcoming Darshan booking.
    """
    result = await db.execute(
        select(Booking).where(Booking.booking_id == booking_id.upper())
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking code {booking_id} not found."
        )
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this booking."
        )
    
    booking.status = "Cancelled"
    
    # Restoring slot capacity if slot is found
    try:
        slot_time = booking.date.replace(minute=0, second=0, microsecond=0)
        result_slot = await db.execute(
            select(DarshanSlot).where(DarshanSlot.slot_time == slot_time).with_for_update()
        )
        slot = result_slot.scalar_one_or_none()
        if slot:
            booking_size = 1
            if booking.booking_type == "group" and booking.group_details:
                booking_size = booking.group_details.get("count", 1)
            slot.booked_count = max(0, slot.booked_count - booking_size)
    except Exception as e:
        print(f"[WARNING] Could not restore slot capacity during cancellation: {e}")

    await db.commit()
    await db.refresh(booking)
    return BookingResponse(**format_booking(booking))
