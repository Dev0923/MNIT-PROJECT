"""
Routes for Accommodation Booking System.
"""
from datetime import datetime, timezone
import random
import string
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from database import get_db
from models.sql_models import AccommodationProperty, AccommodationRoom, AccommodationBooking, User
from utils.jwt_handler import get_optional_current_user, get_current_user
from utils.activity_logger import log_user_activity

router = APIRouter(prefix="/api/accommodation", tags=["Accommodation Bookings"])


# Pydantic Schemas
class GuestDetailsSchema(BaseModel):
    name: str
    email: str
    phone: str
    id_type: str
    id_number: str


class PilgrimageDetailsSchema(BaseModel):
    darshan_date: Optional[str] = None
    count: Optional[int] = 1
    transport: Optional[str] = None


class EmergencyContactSchema(BaseModel):
    name: str
    relation: str
    phone: str


class BookingCreateRequest(BaseModel):
    property_id: int
    room_type: str
    check_in: str  # ISO string or YYYY-MM-DD
    check_out: str # ISO string or YYYY-MM-DD
    adults: int
    children: int
    seniors: int
    guest_details: GuestDetailsSchema
    pilgrimage_details: PilgrimageDetailsSchema
    emergency_contact: EmergencyContactSchema
    total_amount: float


# Helper function to generate a unique booking reference
def generate_booking_ref() -> str:
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=6))
    return f"KSJ-AC-{suffix}"


@router.get("/properties")
async def get_properties(
    type: Optional[str] = None,
    price_max: Optional[float] = None,
    category: Optional[str] = None, # "AC" or "Non-AC"
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(AccommodationProperty)
    
    result = await db.execute(query)
    properties = result.scalars().all()
    
    # Filter python side or build dynamic queries. Simple dynamic filter works.
    filtered_properties = []
    for prop in properties:
        # Search query filter
        if search and search.lower() not in prop.name.lower() and search.lower() not in prop.description.lower():
            continue
            
        # Type filter
        if type and type.lower() != prop.type.lower():
            continue
            
        # Max Price filter
        if price_max and prop.price_start > price_max:
            continue
            
        # Fetch rooms for this property to check AC/Non-AC categories
        room_stmt = select(AccommodationRoom).where(AccommodationRoom.property_id == prop.id)
        room_res = await db.execute(room_stmt)
        rooms = room_res.scalars().all()
        
        # Category (AC/Non-AC) filter
        if category:
            has_matching_room = any(r.category.lower() == category.lower() for r in rooms)
            if not has_matching_room:
                continue

        # Prepare property output
        prop_data = {
            "id": prop.id,
            "name": prop.name,
            "type": prop.type,
            "latitude": prop.latitude,
            "longitude": prop.longitude,
            "distance": prop.distance,
            "price_start": prop.price_start,
            "description": prop.description,
            "amenities": prop.amenities,
            "image_url": prop.image_url,
            "policies": prop.policies,
            "rooms": [{"id": r.id, "type": r.type, "category": r.category, "base_price": r.base_price, "available_rooms": r.available_rooms} for r in rooms]
        }
        filtered_properties.append(prop_data)
        
    return filtered_properties


@router.get("/properties/{property_id}")
async def get_property_detail(property_id: int, db: AsyncSession = Depends(get_db)):
    prop_stmt = select(AccommodationProperty).where(AccommodationProperty.id == property_id)
    prop_res = await db.execute(prop_stmt)
    prop = prop_res.scalar_one_or_none()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    room_stmt = select(AccommodationRoom).where(AccommodationRoom.property_id == prop.id)
    room_res = await db.execute(room_stmt)
    rooms = room_res.scalars().all()
    
    return {
        "id": prop.id,
        "name": prop.name,
        "type": prop.type,
        "latitude": prop.latitude,
        "longitude": prop.longitude,
        "distance": prop.distance,
        "price_start": prop.price_start,
        "description": prop.description,
        "amenities": prop.amenities,
        "image_url": prop.image_url,
        "policies": prop.policies,
        "rooms": [{"id": r.id, "type": r.type, "category": r.category, "base_price": r.base_price, "available_rooms": r.available_rooms, "total_rooms": r.total_rooms} for r in rooms]
    }


@router.post("/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(
    request: BookingCreateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify property exists
    prop_stmt = select(AccommodationProperty).where(AccommodationProperty.id == request.property_id)
    prop_res = await db.execute(prop_stmt)
    prop = prop_res.scalar_one_or_none()
    if not prop:
        raise HTTPException(status_code=404, detail="Accommodation property not found")
        
    # Parse dates
    try:
        check_in_date = datetime.fromisoformat(request.check_in.replace("Z", "+00:00"))
        check_out_date = datetime.fromisoformat(request.check_out.replace("Z", "+00:00"))
    except ValueError:
        try:
            check_in_date = datetime.strptime(request.check_in, "%Y-%m-%d")
            check_out_date = datetime.strptime(request.check_out, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD or ISO datetime.")
            
    # Generate unique booking ID
    booking_id = generate_booking_ref()
    
    # Save booking to DB
    booking = AccommodationBooking(
        booking_id=booking_id,
        user_id=current_user.id if current_user else None,
        property_id=request.property_id,
        room_type=request.room_type,
        check_in=check_in_date,
        check_out=check_out_date,
        adults=request.adults,
        children=request.children,
        seniors=request.seniors,
        guest_details=request.guest_details.dict(),
        pilgrimage_details=request.pilgrimage_details.dict(),
        emergency_contact=request.emergency_contact.dict(),
        total_amount=request.total_amount,
        status="Confirmed"
    )
    
    # Decrement available rooms for demonstration
    room_stmt = select(AccommodationRoom).where(
        (AccommodationRoom.property_id == request.property_id)
    )
    room_res = await db.execute(room_stmt)
    all_rooms = room_res.scalars().all()
    room = None
    for r in all_rooms:
        room_str = f"{r.type} ({r.category})"
        if room_str.lower() == request.room_type.lower() or r.type.lower() in request.room_type.lower():
            room = r
            break
                
    if room:
        if room.available_rooms > 0:
            room.available_rooms -= 1
            
    db.add(booking)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Accommodation",
            title="Booked Accommodation",
            description=f"Booked {request.room_type} at {prop.name}"
        )
        
    await db.commit()
    await db.refresh(booking)
    
    return {
        "id": booking.id,
        "booking_id": booking.booking_id,
        "status": booking.status,
        "property_name": prop.name,
        "room_type": booking.room_type,
        "check_in": booking.check_in.isoformat(),
        "check_out": booking.check_out.isoformat(),
        "total_amount": booking.total_amount,
        "guest_details": booking.guest_details
    }


@router.get("/bookings/my")
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AccommodationBooking, AccommodationProperty).join(
        AccommodationProperty, AccommodationBooking.property_id == AccommodationProperty.id
    ).where(AccommodationBooking.user_id == current_user.id).order_by(AccommodationBooking.created_at.desc())
    
    res = await db.execute(stmt)
    bookings = res.all()
    
    output = []
    for booking, prop in bookings:
        output.append({
            "id": booking.id,
            "booking_id": booking.booking_id,
            "property_name": prop.name,
            "property_type": prop.type,
            "room_type": booking.room_type,
            "check_in": booking.check_in.isoformat(),
            "check_out": booking.check_out.isoformat(),
            "adults": booking.adults,
            "children": booking.children,
            "seniors": booking.seniors,
            "total_amount": booking.total_amount,
            "status": booking.status,
            "guest_details": booking.guest_details,
            "created_at": booking.created_at.isoformat()
        })
        
    return output


@router.post("/bookings/{booking_id}/cancel")
async def cancel_accommodation_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel an accommodation (stay) booking.
    """
    result = await db.execute(
        select(AccommodationBooking).where(AccommodationBooking.booking_id == booking_id.upper())
    )
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Accommodation booking {booking_id} not found."
        )
    if booking.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this accommodation booking."
        )
        
    booking.status = "Cancelled"
    
    # Increment available rooms back
    try:
        room_stmt = select(AccommodationRoom).where(
            (AccommodationRoom.property_id == booking.property_id)
        )
        room_res = await db.execute(room_stmt)
        all_rooms = room_res.scalars().all()
        for r in all_rooms:
            room_str = f"{r.type} ({r.category})"
            if room_str.lower() == booking.room_type.lower() or r.type.lower() in booking.room_type.lower():
                r.available_rooms = min(r.total_rooms, r.available_rooms + 1)
                break
    except Exception as e:
        print(f"[WARNING] Could not restore room capacity during cancellation: {e}")
        
    await db.commit()
    await db.refresh(booking)
    return {
        "success": True,
        "booking_id": booking.booking_id,
        "status": booking.status,
        "message": "Stay booking cancelled successfully."
    }
