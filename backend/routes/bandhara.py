"""
Routes for Bhandara Permission & Slot Booking System.
"""
from datetime import datetime, timedelta, timezone
import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models.sql_models import BhandaraSpot, BhandaraBooking, User
from utils.jwt_handler import get_current_user, get_optional_current_user
from utils.activity_logger import log_user_activity

router = APIRouter(prefix="/api/bhandara", tags=["Bhandara Bookings"])

UPLOAD_DIR = "uploads/bhandara"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Default seed spots
DEFAULT_SPOTS = [
    {
        "name": "Shyam Toran Dwar Ground (Spot 1)",
        "capacity": 5000,
        "latitude": 27.4520,
        "longitude": 75.4050,
        "description": "Located near the main entrance gate (Toran Dwar), highly visible and accessible."
    },
    {
        "name": "Shyam Kund Marg Ground (Spot 2)",
        "capacity": 8000,
        "latitude": 27.4460,
        "longitude": 75.3980,
        "description": "Large open ground adjacent to Shyam Kund route."
    },
    {
        "name": "Parking Sector 4 Camp (Spot 3)",
        "capacity": 10000,
        "latitude": 27.4580,
        "longitude": 75.3920,
        "description": "Massive space inside Parking Sector 4, ideal for large organizations."
    },
    {
        "name": "Ringas Road Entry Point (Spot 4)",
        "capacity": 6000,
        "latitude": 27.4400,
        "longitude": 75.4120,
        "description": "Close to the Ringas road incoming passenger flow, convenient for incoming pilgrims."
    }
]


async def ensure_seeded_spots(db: AsyncSession):
    """Ensure Bhandara spots are seeded in the database."""
    result = await db.execute(select(BhandaraSpot))
    spots = result.scalars().all()
    if not spots:
        for ds in DEFAULT_SPOTS:
            spot = BhandaraSpot(
                name=ds["name"],
                capacity=ds["capacity"],
                latitude=ds["latitude"],
                longitude=ds["longitude"],
                description=ds["description"]
            )
            db.add(spot)
        await db.commit()


@router.get("/spots")
async def get_spots(db: AsyncSession = Depends(get_db)):
    """List all Bhandara spots. Auto-seeds if database is empty."""
    await ensure_seeded_spots(db)
    result = await db.execute(select(BhandaraSpot))
    spots = result.scalars().all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "capacity": s.capacity,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "description": s.description
        }
        for s in spots
    ]


@router.get("/spots/{spot_id}/availability")
async def get_spot_availability(spot_id: int, db: AsyncSession = Depends(get_db)):
    """Get active bookings / busy slots for a specific spot."""
    # Check if spot exists
    result_spot = await db.execute(select(BhandaraSpot).where(BhandaraSpot.id == spot_id))
    spot = result_spot.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Bhandara spot not found.")

    result = await db.execute(
        select(BhandaraBooking)
        .where(BhandaraBooking.spot_id == spot_id)
        .where(BhandaraBooking.status != "Rejected")
    )
    bookings = result.scalars().all()
    return [
        {
            "id": b.id,
            "start_time": b.start_time.isoformat(),
            "end_time": b.end_time.isoformat(),
            "duration_hours": b.duration_hours,
            "org_name": b.org_name,
            "status": b.status
        }
        for b in bookings
    ]


@router.post("/check")
async def check_availability(
    spot_id: int,
    start_time: datetime,
    duration_hours: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a spot is available for the given start_time and duration.
    If unavailable, suggests alternate slots within +/- 3 days.
    """
    # Parse times
    requested_start = start_time
    requested_end = start_time + timedelta(hours=duration_hours)

    # Validate requested spot
    result_spot = await db.execute(select(BhandaraSpot).where(BhandaraSpot.id == spot_id))
    spot = result_spot.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Bhandara spot not found.")

    # Check overlaps
    # overlap logic: booking.start_time < requested_end AND booking.end_time > requested_start
    result_overlap = await db.execute(
        select(BhandaraBooking)
        .where(BhandaraBooking.spot_id == spot_id)
        .where(BhandaraBooking.status != "Rejected")
        .where(BhandaraBooking.start_time < requested_end)
        .where(BhandaraBooking.end_time > requested_start)
    )
    overlap = result_overlap.scalar_one_or_none()

    if not overlap:
        return {"available": True, "message": "Slot is available."}

    # If unavailable, find alternate slots (+/- 3 days)
    # We will check daily offsets of -3, -2, -1, +1, +2, +3 at the same time of day
    alternatives = []
    offsets = [-3, -2, -1, 1, 2, 3]
    for offset in offsets:
        alt_start = requested_start + timedelta(days=offset)
        # Don't suggest past dates
        now_dt = datetime.now(timezone.utc) if alt_start.tzinfo else datetime.utcnow()
        if alt_start < now_dt:
            continue
        alt_end = alt_start + timedelta(hours=duration_hours)

        res_alt_overlap = await db.execute(
            select(BhandaraBooking)
            .where(BhandaraBooking.spot_id == spot_id)
            .where(BhandaraBooking.status != "Rejected")
            .where(BhandaraBooking.start_time < alt_end)
            .where(BhandaraBooking.end_time > alt_start)
        )
        alt_overlap = res_alt_overlap.scalar_one_or_none()
        if not alt_overlap:
            alternatives.append({
                "start_time": alt_start.isoformat(),
                "end_time": alt_end.isoformat(),
                "label": alt_start.strftime("%b %d, %I:%M %p")
            })

    return {
        "available": False,
        "message": "Selected slot is busy.",
        "alternatives": alternatives
    }


@router.post("/book", status_code=status.HTTP_201_CREATED)
async def create_bhandara_booking(
    spot_id: int = Form(...),
    start_time: str = Form(...),
    duration_hours: int = Form(...),
    org_name: str = Form(...),
    org_address: str = Form(...),
    organiser_type: str = Form(...),
    expected_meals: int = Form(...),
    location_description: Optional[str] = Form(None),
    purpose: str = Form(...),
    noc_file: Optional[UploadFile] = File(None),
    id_proof_file: Optional[UploadFile] = File(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a Bhandara slot booking / permission request.
    Validates slot availability, file type (.jpg/.pdf), and size (<500KB).
    """
    # 1. Parse start time
    try:
        dt_start = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")

    dt_end = dt_start + timedelta(hours=duration_hours)

    # 2. Check availability
    result_spot = await db.execute(select(BhandaraSpot).where(BhandaraSpot.id == spot_id))
    spot = result_spot.scalar_one_or_none()
    if not spot:
        raise HTTPException(status_code=404, detail="Bhandara spot not found.")

    # Validate meals count
    if expected_meals < 500:
        raise HTTPException(
            status_code=400,
            detail="The expected daily meals count must be at least 500."
        )

    if expected_meals > spot.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"The expected daily meals ({expected_meals}) exceeds the spot's maximum capacity ({spot.capacity})."
        )

    result_overlap = await db.execute(
        select(BhandaraBooking)
        .where(BhandaraBooking.spot_id == spot_id)
        .where(BhandaraBooking.status != "Rejected")
        .where(BhandaraBooking.start_time < dt_end)
        .where(BhandaraBooking.end_time > dt_start)
    )
    if result_overlap.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="The selected slot is no longer available. Please select another time or spot."
        )

    # Helper function to save file
    async def save_uploaded_file(upload_file: UploadFile, prefix: str) -> str:
        # Check size: 500KB limit
        content = await upload_file.read()
        if len(content) > 500 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File {upload_file.filename} exceeds the 500KB size limit."
            )

        # Check extension
        ext = os.path.splitext(upload_file.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".pdf"]:
            raise HTTPException(
                status_code=400,
                detail=f"File {upload_file.filename} has an invalid type. Only .jpg and .pdf are allowed."
            )

        # Generate unique filename
        filename = f"{prefix}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(content)
        return filename

    noc_filename = None
    id_proof_filename = None

    if noc_file and noc_file.filename:
        noc_filename = await save_uploaded_file(noc_file, "noc")

    if id_proof_file and id_proof_file.filename:
        id_proof_filename = await save_uploaded_file(id_proof_file, "id_proof")

    # Create Booking
    booking = BhandaraBooking(
        spot_id=spot_id,
        start_time=dt_start,
        end_time=dt_end,
        duration_hours=duration_hours,
        org_name=org_name,
        org_address=org_address,
        organiser_type=organiser_type,
        expected_meals=expected_meals,
        location_description=location_description,
        purpose=purpose,
        noc_filename=noc_filename,
        id_proof_filename=id_proof_filename,
        status="Pending",
        user_id=current_user.id if current_user else None,
        created_at=datetime.now(timezone.utc)
    )

    db.add(booking)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Bhandara",
            title="Booked Bhandara Slot",
            description=f"Requested slot for {expected_meals} meals"
        )
        
    await db.commit()
    await db.refresh(booking)

    return {
        "success": True,
        "message": "Bhandara permission request submitted successfully.",
        "booking_id": booking.id,
        "status": booking.status
    }


@router.get("/my-bookings")
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all Bhandara spot bookings for the current user.
    """
    result = await db.execute(
        select(BhandaraBooking)
        .where(BhandaraBooking.user_id == current_user.id)
        .order_by(BhandaraBooking.created_at.desc())
    )
    bookings = result.scalars().all()
    
    # We can also fetch the spot names for context
    output = []
    for b in bookings:
        spot_res = await db.execute(select(BhandaraSpot).where(BhandaraSpot.id == b.spot_id))
        spot = spot_res.scalar_one_or_none()
        output.append({
            "id": b.id,
            "spot_id": b.spot_id,
            "spot_name": spot.name if spot else "Unknown Spot",
            "start_time": b.start_time.isoformat(),
            "end_time": b.end_time.isoformat(),
            "duration_hours": b.duration_hours,
            "org_name": b.org_name,
            "org_address": b.org_address,
            "organiser_type": b.organiser_type,
            "expected_meals": b.expected_meals,
            "purpose": b.purpose,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return output


@router.post("/bookings/{booking_id}/cancel")
async def cancel_bhandara_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel an existing Bhandara spot booking.
    """
    result = await db.execute(
        select(BhandaraBooking).where(BhandaraBooking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bhandara booking ID {booking_id} not found."
        )
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this Bhandara booking."
        )
        
    booking.status = "Cancelled"
    await db.commit()
    await db.refresh(booking)
    return {
        "success": True,
        "booking_id": booking.id,
        "status": booking.status,
        "message": "Bhandara booking cancelled successfully."
    }
