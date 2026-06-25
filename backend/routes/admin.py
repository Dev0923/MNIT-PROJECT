"""
Admin-only routes for managing users, donations, bookings,
vehicle permits, and support tickets.
All endpoints require is_admin = True on the JWT user.
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_

from database import get_db
from models.sql_models import (
    User, Booking, Donation, SupportQuery,
    Vehicle, VehiclePermission, GeneralPermission, Announcement
)
from utils.jwt_handler import get_admin_user
from utils.password_handler import hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ═══════════════════════════════════════════════════════
# Response / Request Schemas
# ═══════════════════════════════════════════════════════

class AdminUserResponse(BaseModel):
    id: int
    name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    is_admin: bool
    receive_updates: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_admin: Optional[bool] = None
    receive_updates: Optional[bool] = None
    password: Optional[str] = Field(None, description="New password (optional)")


class AdminDonationResponse(BaseModel):
    id: int
    donation_id: str
    user_id: Optional[int]
    fullName: str
    mobile: str
    purpose: str
    amount: float
    want80G: bool
    panCard: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminBookingResponse(BaseModel):
    id: int
    booking_id: str
    user_id: Optional[int]
    booking_type: str
    date: datetime
    phone: str
    city: str
    individual_details: Optional[dict]
    group_details: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminSupportResponse(BaseModel):
    id: int
    name: str
    email: str
    subject: str
    message: str
    status: str
    admin_reply: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SupportStatusUpdate(BaseModel):
    status: str = Field(..., description="'open' | 'in-progress' | 'resolved'")
    admin_reply: Optional[str] = None


class AdminVehiclePermitResponse(BaseModel):
    id: int
    vehicle_id: int
    plate_number: str
    vehicle_type: str
    vehicle_model: Optional[str]
    owner_name: Optional[str]
    owner_phone: Optional[str]
    permit_type: str
    status: str
    valid_from: datetime
    valid_to: datetime
    allowed_zones: List[str]
    created_at: datetime


class PermitStatusUpdate(BaseModel):
    status: str = Field(..., description="'Approved' | 'Denied' | 'Pending'")

class StatusUpdateRequest(BaseModel):
    status: str


class AdminStats(BaseModel):
    total_users: int
    total_donations: int
    total_donated_amount: float
    total_bookings: int
    open_tickets: int
    pending_permits: int


class CreateAdminRequest(BaseModel):
    name: str
    email: str
    password: str


# ═══════════════════════════════════════════════════════
# STATS
# ═══════════════════════════════════════════════════════

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
):
    """Aggregated dashboard KPIs for admin overview."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_donations = (await db.execute(select(func.count(Donation.id)))).scalar_one()
    total_donated_amount = (
        (await db.execute(select(func.coalesce(func.sum(Donation.amount), 0.0)))).scalar_one()
    )
    total_bookings = (await db.execute(select(func.count(Booking.id)))).scalar_one()
    open_tickets = (
        (await db.execute(
            select(func.count(SupportQuery.id)).where(SupportQuery.status == "open")
        )).scalar_one()
    )
    pending_permits = (
        (await db.execute(
            select(func.count(VehiclePermission.id)).where(VehiclePermission.status == "Pending")
        )).scalar_one()
    )

    return AdminStats(
        total_users=total_users,
        total_donations=total_donations,
        total_donated_amount=float(total_donated_amount),
        total_bookings=total_bookings,
        open_tickets=open_tickets,
        pending_permits=pending_permits,
    )


# ═══════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════

@router.get("/users", response_model=List[AdminUserResponse])
async def list_users(
    q: Optional[str] = Query(None, description="Search by name, phone, or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all registered users with optional search."""
    query = select(User).order_by(desc(User.created_at)).offset(skip).limit(limit)
    if q:
        q_lower = f"%{q.lower()}%"
        query = query.where(
            or_(
                func.lower(User.name).like(q_lower),
                func.lower(User.email).like(q_lower),
                User.phone.like(f"%{q}%"),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def get_user(
    user_id: int,
     _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: int,
    body: AdminUserUpdate,
     _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's profile fields or admin flag."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if body.name is not None:
        user.name = body.name
    if body.phone is not None:
        user.phone = body.phone
    if body.email is not None:
        user.email = body.email
    if body.is_admin is not None:
        user.is_admin = body.is_admin
    if body.receive_updates is not None:
        user.receive_updates = body.receive_updates
    if body.password:
        user.password_hash = hash_password(body.password)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user account (cannot delete yourself)."""
    if current_admin.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    await db.delete(user)
    await db.commit()
    return {"success": True, "message": f"User {user_id} deleted."}


@router.post("/create-admin", response_model=AdminUserResponse)
async def create_admin_user(
    body: CreateAdminRequest,
     _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new admin user with a password."""
    # Check uniqueness
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already in use.")

    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        is_admin=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ═══════════════════════════════════════════════════════
# DONATIONS
# ═══════════════════════════════════════════════════════

@router.get("/donations", response_model=List[AdminDonationResponse])
async def list_donations(
    q: Optional[str] = Query(None, description="Search by donor name or mobile"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all donations with optional search."""
    query = select(Donation).order_by(desc(Donation.created_at)).offset(skip).limit(limit)
    if q:
        q_lower = f"%{q.lower()}%"
        query = query.where(
            or_(
                func.lower(Donation.fullName).like(q_lower),
                Donation.mobile.like(f"%{q}%"),
                func.lower(Donation.purpose).like(q_lower),
                Donation.donation_id.like(f"%{q.upper()}%"),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


# ═══════════════════════════════════════════════════════
# BOOKINGS (E-PASS / DARSHAN)
# ═══════════════════════════════════════════════════════

@router.get("/bookings", response_model=List[AdminBookingResponse])
async def list_bookings(
    q: Optional[str] = Query(None, description="Search by booking ID, phone, or city"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all Darshan bookings with optional search."""
    query = select(Booking).order_by(desc(Booking.created_at)).offset(skip).limit(limit)
    if q:
        query = query.where(
            or_(
                Booking.booking_id.like(f"%{q.upper()}%"),
                Booking.phone.like(f"%{q}%"),
                func.lower(Booking.city).like(f"%{q.lower()}%"),
            )
        )
    result = await db.execute(query)
    return result.scalars().all()


# ═══════════════════════════════════════════════════════
# SUPPORT TICKETS
# ═══════════════════════════════════════════════════════

@router.get("/support", response_model=List[AdminSupportResponse])
async def list_support_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all support/help tickets, optionally filtered by status."""
    query = select(SupportQuery).order_by(desc(SupportQuery.created_at)).offset(skip).limit(limit)
    if status_filter:
        query = query.where(SupportQuery.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/support/{ticket_id}/status", response_model=AdminSupportResponse)
async def update_ticket_status(
    ticket_id: int,
    body: SupportStatusUpdate,
   _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a support ticket's status and optionally add an admin reply."""
    allowed = {"open", "in-progress", "resolved"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {allowed}")

    result = await db.execute(select(SupportQuery).where(SupportQuery.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    ticket.status = body.status
    if body.admin_reply is not None:
        ticket.admin_reply = body.admin_reply

    await db.commit()
    await db.refresh(ticket)
    return ticket


# ═══════════════════════════════════════════════════════
# VEHICLE PERMITS
# ═══════════════════════════════════════════════════════

@router.get("/vehicle-permits", response_model=List[AdminVehiclePermitResponse])
async def list_vehicle_permits(
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None, description="Search by plate number or owner name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """List all vehicle permit requests with vehicle and owner details."""
    query = (
        select(VehiclePermission, Vehicle, User)
        .join(Vehicle, VehiclePermission.vehicle_id == Vehicle.id)
        .outerjoin(User, Vehicle.owner_id == User.id)
        .order_by(desc(VehiclePermission.created_at))
        .offset(skip)
        .limit(limit)
    )
    if status_filter:
        query = query.where(VehiclePermission.status == status_filter)
    if q:
        query = query.where(
            or_(
                Vehicle.plate_number.like(f"%{q.upper()}%"),
                func.lower(User.name).like(f"%{q.lower()}%"),
            )
        )

    result = await db.execute(query)
    rows = result.all()

    output = []
    for perm, vehicle, owner in rows:
        output.append(AdminVehiclePermitResponse(
            id=perm.id,
            vehicle_id=vehicle.id,
            plate_number=vehicle.plate_number,
            vehicle_type=vehicle.vehicle_type,
            vehicle_model=vehicle.model,
            owner_name=owner.name if owner else None,
            owner_phone=owner.phone if owner else None,
            permit_type=perm.permit_type,
            status=perm.status,
            valid_from=perm.valid_from,
            valid_to=perm.valid_to,
            allowed_zones=perm.allowed_zones or [],
            created_at=perm.created_at,
        ))
    return output


@router.put("/vehicle-permits/{permit_id}/approve", response_model=AdminVehiclePermitResponse)
async def approve_vehicle_permit(
    permit_id: int,
    body: PermitStatusUpdate,
    current_admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Approve or deny a vehicle permit request."""
    allowed = {"Approved", "Denied", "Pending"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {allowed}")

    result = await db.execute(
        select(VehiclePermission, Vehicle, User)
        .join(Vehicle, VehiclePermission.vehicle_id == Vehicle.id)
        .outerjoin(User, Vehicle.owner_id == User.id)
        .where(VehiclePermission.id == permit_id)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Permit not found.")

    perm, vehicle, owner = row
    perm.status = body.status
    perm.approved_by = current_admin.id

    await db.commit()
    await db.refresh(perm)

    return AdminVehiclePermitResponse(
        id=perm.id,
        vehicle_id=vehicle.id,
        plate_number=vehicle.plate_number,
        vehicle_type=vehicle.vehicle_type,
        vehicle_model=vehicle.model,
        owner_name=owner.name if owner else None,
        owner_phone=owner.phone if owner else None,
        permit_type=perm.permit_type,
        status=perm.status,
        valid_from=perm.valid_from,
        valid_to=perm.valid_to,
        allowed_zones=perm.allowed_zones or [],
        created_at=perm.created_at,
    )

# ═══════════════════════════════════════════════════════
# GENERAL PERMISSIONS
# ═══════════════════════════════════════════════════════

@router.get("/general-permissions")
async def get_all_general_permissions(
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all general permissions (Bandhara, Medical, Other).
    """
    result = await db.execute(select(GeneralPermission).order_by(desc(GeneralPermission.created_at)))
    permissions = result.scalars().all()
    return [
        {
            "id": p.permission_code,
            "db_id": p.id,
            "name": p.name,
            "type": p.type,
            "subtype": p.subtype,
            "date": p.date,
            "purpose": p.purpose,
            "status": p.status.lower()
        }
        for p in permissions
    ]

@router.post("/general-permissions/{perm_id}/status")
async def update_general_permission_status(
    perm_id: int,
    req: StatusUpdateRequest,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or reject a general permission request.
    """
    result = await db.execute(
        select(GeneralPermission).where(GeneralPermission.id == perm_id)
    )
    perm = result.scalar_one_or_none()
    if not perm:
        raise HTTPException(status_code=404, detail="Permission request not found.")
    
    perm.status = req.status.strip().lower()
    await db.commit()
    return {"message": "Permission status updated successfully"}


# ═══════════════════════════════════════════════════════
# ANNOUNCEMENTS
# ═══════════════════════════════════════════════════════

class AnnouncementCreate(BaseModel):
    text: str = Field(..., min_length=1, description="Announcement text")
    active: bool = True

class AnnouncementUpdate(BaseModel):
    text: Optional[str] = None
    active: Optional[bool] = None

class AnnouncementResponse(BaseModel):
    id: int
    text: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/announcements", response_model=List[AnnouncementResponse])
async def list_announcements(
    active_only: bool = Query(False, description="If true, return only active announcements"),
    db: AsyncSession = Depends(get_db),
):
    """List all announcements. Public endpoint — no admin auth required so devotee Home page can read it."""
    stmt = select(Announcement).order_by(desc(Announcement.created_at))
    if active_only:
        stmt = stmt.where(Announcement.active == True)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/announcements", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
async def create_announcement(
    body: AnnouncementCreate,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new announcement."""
    ann = Announcement(text=body.text.strip(), active=body.active)
    db.add(ann)
    await db.commit()
    await db.refresh(ann)
    return ann


@router.put("/announcements/{ann_id}", response_model=AnnouncementResponse)
async def update_announcement(
    ann_id: int,
    body: AnnouncementUpdate,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle active state or update text."""
    result = await db.execute(select(Announcement).where(Announcement.id == ann_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    if body.text is not None:
        ann.text = body.text.strip()
    if body.active is not None:
        ann.active = body.active
    await db.commit()
    await db.refresh(ann)
    return ann


@router.delete("/announcements/{ann_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_announcement(
    ann_id: int,
    _: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an announcement permanently."""
    result = await db.execute(select(Announcement).where(Announcement.id == ann_id))
    ann = result.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")
    await db.delete(ann)
    await db.commit()
