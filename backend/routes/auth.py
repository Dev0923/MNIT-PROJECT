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
        is_admin=user.is_admin,
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


@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the current user's personal info plus all their activity history:
    darshan bookings, donations, accommodation bookings, and vehicle permits.
    """
    from models.sql_models import Booking, Donation, AccommodationBooking, Vehicle, VehiclePermission, AccommodationProperty, SOSAlert, BhandaraBooking, GeneralPermission, BhandaraSpot, LostItem, LostPerson
    from sqlalchemy.orm import selectinload

    # Darshan bookings
    res_bookings = await db.execute(
        select(Booking)
        .where(Booking.user_id == current_user.id)
        .order_by(Booking.date.desc())
    )
    bookings = res_bookings.scalars().all()

    # Donations
    res_donations = await db.execute(
        select(Donation)
        .where(Donation.user_id == current_user.id)
        .order_by(Donation.created_at.desc())
    )
    donations = res_donations.scalars().all()

    # SOS alerts
    res_sos = await db.execute(
        select(SOSAlert)
        .where(SOSAlert.user_id == current_user.id)
        .order_by(SOSAlert.created_at.desc())
    )
    sos_alerts = res_sos.scalars().all()

    # Bhandara spot bookings
    res_bhandara = await db.execute(
        select(BhandaraBooking)
        .where(BhandaraBooking.user_id == current_user.id)
        .order_by(BhandaraBooking.created_at.desc())
    )
    bhandara_bookings = res_bhandara.scalars().all()

    # General Permissions (camps & stalls)
    res_perms = await db.execute(
        select(GeneralPermission)
        .where(GeneralPermission.user_id == current_user.id)
        .order_by(GeneralPermission.created_at.desc())
    )
    general_permissions = res_perms.scalars().all()

    # Lost Items reported by user
    res_lost_items = await db.execute(
        select(LostItem)
        .where(LostItem.user_id == current_user.id)
        .order_by(LostItem.created_at.desc())
    )
    lost_items = res_lost_items.scalars().all()

    # Lost Persons reported by user
    res_lost_persons = await db.execute(
        select(LostPerson)
        .where(LostPerson.user_id == current_user.id)
        .order_by(LostPerson.created_at.desc())
    )
    lost_persons = res_lost_persons.scalars().all()

    # Accommodation bookings
    res_acc = await db.execute(
        select(AccommodationBooking)
        .where(AccommodationBooking.user_id == current_user.id)
        .order_by(AccommodationBooking.created_at.desc())
    )
    acc_bookings = res_acc.scalars().all()

    # Property names for accommodation bookings
    property_ids = list({b.property_id for b in acc_bookings})
    property_map = {}
    if property_ids:
        res_props = await db.execute(
            select(AccommodationProperty).where(AccommodationProperty.id.in_(property_ids))
        )
        for prop in res_props.scalars().all():
            property_map[prop.id] = prop.name

    # Vehicles + permits
    res_vehicles = await db.execute(
        select(Vehicle)
        .where(Vehicle.owner_id == current_user.id)
    )
    vehicles = res_vehicles.scalars().all()

    vehicle_data = []
    for v in vehicles:
        res_permits = await db.execute(
            select(VehiclePermission)
            .where(VehiclePermission.vehicle_id == v.id)
            .order_by(VehiclePermission.created_at.desc())
        )
        permits = res_permits.scalars().all()
        vehicle_data.append({
            "id": v.id,
            "plate_number": v.plate_number,
            "vehicle_type": v.vehicle_type,
            "model": v.model,
            "created_at": v.created_at.isoformat() if v.created_at else None,
            "permits": [
                {
                    "id": p.id,
                    "permit_type": p.permit_type,
                    "status": p.status,
                    "valid_from": p.valid_from.isoformat() if p.valid_from else None,
                    "valid_to": p.valid_to.isoformat() if p.valid_to else None,
                    "allowed_zones": p.allowed_zones,
                }
                for p in permits
            ],
        })

    # Activity log — from khatu_user_activities table
    activities_list = []
    try:
        from models.sql_models import UserActivity
        res_activities = await db.execute(
            select(UserActivity)
            .where(UserActivity.user_id == current_user.id)
            .order_by(UserActivity.created_at.desc())
            .limit(50)
        )
        raw_activities = res_activities.scalars().all()
        activities_list = [
            {
                "id": a.id,
                "activity_type": a.activity_type,
                "title": a.title,
                "description": a.description,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in raw_activities
        ]
    except Exception:
        activities_list = []

    # Derived medical / bhandara from general_permissions
    medical_perms = [gp for gp in general_permissions if gp.type.lower() == "medical"]
    bhandara_perms = [gp for gp in general_permissions if gp.type.lower() in ("bandhara", "bhandara")]

    output_profile = {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "phone": current_user.phone,
            "email": current_user.email,
            "is_admin": current_user.is_admin,
            "receive_updates": current_user.receive_updates,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        },
        "statistics": {
            "darshan": len(bookings),
            "donations": len(donations),
            "stays": len(acc_bookings),
            "bhandara": len(bhandara_bookings) + len(bhandara_perms),
            "medical": len(medical_perms),
            "vehicles": len(vehicles),
            "sos": len(sos_alerts),
            "lostFound": len(lost_items) + len(lost_persons),
        },
        "activities": activities_list,
        "bookings": [
            {
                "id": b.id,
                "booking_id": b.booking_id,
                "booking_type": b.booking_type,
                "date": b.date.isoformat() if b.date else None,
                "phone": b.phone,
                "city": b.city,
                "individual_details": b.individual_details,
                "group_details": b.group_details,
                "status": getattr(b, "status", "Confirmed"),
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in bookings
        ],
        "donations": [
            {
                "id": d.id,
                "donation_id": d.donation_id,
                "fullName": d.fullName,
                "purpose": d.purpose,
                "amount": d.amount,
                "want80G": d.want80G,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in donations
        ],
        "accommodation_bookings": [
            {
                "id": ab.id,
                "booking_id": ab.booking_id,
                "property_id": ab.property_id,
                "property_name": property_map.get(ab.property_id, "Unknown Property"),
                "room_type": ab.room_type,
                "check_in": ab.check_in.isoformat() if ab.check_in else None,
                "check_out": ab.check_out.isoformat() if ab.check_out else None,
                "adults": ab.adults,
                "children": ab.children,
                "total_amount": ab.total_amount,
                "status": ab.status,
                "created_at": ab.created_at.isoformat() if ab.created_at else None,
            }
            for ab in acc_bookings
        ],
        "vehicles": vehicle_data,
        "sos_alerts": [
            {
                "id": s.id,
                "status": s.status,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sos_alerts
        ],
        "bhandara_bookings": [],  # we'll populate below
        "lost_items": [
            {
                "id": li.id,
                "category": li.category,
                "date_lost": li.date_lost.isoformat() if li.date_lost else None,
                "location": li.location,
                "description": li.description,
                "contact_name": li.contact_name,
                "contact_phone": li.contact_phone,
                "status": li.status,
                "created_at": li.created_at.isoformat() if li.created_at else None,
            }
            for li in lost_items
        ],
        "lost_persons": [
            {
                "id": lp.id,
                "name": lp.name,
                "age": lp.age,
                "gender": lp.gender,
                "last_seen_location": lp.last_seen_location,
                "last_seen_time": lp.last_seen_time.isoformat() if lp.last_seen_time else None,
                "contact_name": lp.contact_name,
                "contact_phone": lp.contact_phone,
                "status": lp.status,
                "created_at": lp.created_at.isoformat() if lp.created_at else None,
            }
            for lp in lost_persons
        ],
    }

    # Fetch spot names and fill Bhandara bookings
    bhandara_list = []
    for bb in bhandara_bookings:
        spot_res = await db.execute(select(BhandaraSpot).where(BhandaraSpot.id == bb.spot_id))
        spot = spot_res.scalar_one_or_none()
        bhandara_list.append({
            "id": bb.id,
            "spot_id": bb.spot_id,
            "spot_name": spot.name if spot else "Unknown Spot",
            "start_time": bb.start_time.isoformat() if bb.start_time else None,
            "end_time": bb.end_time.isoformat() if bb.end_time else None,
            "duration_hours": bb.duration_hours,
            "org_name": bb.org_name,
            "expected_meals": bb.expected_meals,
            "purpose": bb.purpose,
            "status": bb.status,
            "created_at": bb.created_at.isoformat() if bb.created_at else None,
        })
    output_profile["bhandara_bookings"] = bhandara_list

    output_profile["general_permissions"] = [
        {
            "id": gp.id,
            "permission_code": gp.permission_code,
            "name": gp.name,
            "type": gp.type,
            "subtype": gp.subtype,
            "purpose": gp.purpose,
            "date": gp.date,
            "status": gp.status,
            "created_at": gp.created_at.isoformat() if gp.created_at else None,
        }
        for gp in general_permissions
    ]

    return output_profile
