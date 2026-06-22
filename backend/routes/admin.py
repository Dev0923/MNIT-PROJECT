"""
Routes for Admin Dashboard APIs using SQLAlchemy.
"""

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models.sql_models import Donation, Booking, VehiclePermission, Vehicle, SupportQuery, GeneralPermission
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

# ── Pydantic Request/Response Schemas ──────────────────

class StatusUpdateRequest(BaseModel):
    status: str

# ── Endpoints ──────────────────────────────────────────

@router.get("/stats")
async def get_admin_stats(db: AsyncSession = Depends(get_db)):
    """
    Fetch unified stats and KPIs for the dashboard.
    """
    # 1. Total Donations sum
    result_donations = await db.execute(select(Donation))
    donations = result_donations.scalars().all()
    total_donations = sum(d.amount for d in donations)

    # 2. Pending Approvals (Vehicle + General)
    result_veh_pending = await db.execute(
        select(VehiclePermission).where(VehiclePermission.status.ilike("pending"))
    )
    pending_veh = len(result_veh_pending.scalars().all())

    result_gen_pending = await db.execute(
        select(GeneralPermission).where(GeneralPermission.status.ilike("pending"))
    )
    pending_gen = len(result_gen_pending.scalars().all())
    pending_approvals = pending_veh + pending_gen

    # 3. Active passes count (Bookings today)
    result_bookings = await db.execute(select(Booking))
    total_passes = len(result_bookings.scalars().all())

    # 4. Open tickets count
    result_support = await db.execute(select(SupportQuery))
    open_tickets = len(result_support.scalars().all()) # in this simplified model, we treat all submitted queries as open/new

    return {
        "totalDonations": total_donations,
        "pendingApprovals": pending_approvals,
        "activePasses": total_passes,
        "openTickets": open_tickets
    }


@router.get("/donations")
async def get_all_donations(db: AsyncSession = Depends(get_db)):
    """
    Get all donations in the database.
    """
    result = await db.execute(select(Donation).order_by(Donation.created_at.desc()))
    donations = result.scalars().all()
    return [
        {
            "id": d.donation_id,
            "name": d.fullName,
            "mobile": d.mobile,
            "purpose": d.purpose,
            "amount": d.amount,
            "want80G": d.want80G,
            "date": d.created_at.strftime("%d %b %Y") if d.created_at else "",
            "status": "completed"
        }
        for d in donations
    ]


@router.get("/vehicle-permits")
async def get_all_vehicle_permits(db: AsyncSession = Depends(get_db)):
    """
    Get all vehicle permits including license plate and type details.
    """
    # Join VehiclePermission with Vehicle to get plate details
    result = await db.execute(
        select(VehiclePermission)
        .options(selectinload(VehiclePermission.vehicle))
        .order_by(VehiclePermission.created_at.desc())
    )
    permits = result.scalars().all()
    
    return [
        {
            "id": f"VEH{p.id:03d}",
            "db_id": p.id,
            "name": "Applicant", # Placeholder name as owner is a relation
            "vehicle": p.vehicle.plate_number if p.vehicle else "—",
            "type": "Vehicle",
            "subtype": p.vehicle.vehicle_type if p.vehicle else "Car",
            "date": p.created_at.strftime("%d %b %Y") if p.created_at else "",
            "purpose": p.permit_type,
            "status": p.status.lower()
        }
        for p in permits
    ]


@router.post("/vehicle-permits/{permit_id}/status")
async def update_vehicle_permit_status(
    permit_id: int,
    req: StatusUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Approve or reject a vehicle permit request.
    """
    result = await db.execute(
        select(VehiclePermission).where(VehiclePermission.id == permit_id)
    )
    permit = result.scalar_one_or_none()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit request not found.")
    
    # Capitalize to match 'Approved', 'Denied' or keep as passed
    new_status = req.status.strip().capitalize()
    if new_status == "Rejected":
        new_status = "Denied"
    permit.status = new_status
    await db.commit()
    return {"message": "Permit status updated successfully"}


@router.get("/general-permissions")
async def get_all_general_permissions(db: AsyncSession = Depends(get_db)):
    """
    Get all general permissions (Bandhara, Medical, Other).
    """
    result = await db.execute(select(GeneralPermission).order_by(GeneralPermission.created_at.desc()))
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


@router.get("/bookings")
async def get_all_bookings(db: AsyncSession = Depends(get_db)):
    """
    Get all darshan slot bookings/epasses.
    """
    result = await db.execute(select(Booking).order_by(Booking.created_at.desc()))
    bookings = result.scalars().all()
    
    epasses = []
    for i, b in enumerate(bookings):
        name = "Devotee"
        if b.individual_details and "name" in b.individual_details:
            name = b.individual_details["name"]
        elif b.group_details and "count" in b.group_details:
            name = f"Group (Size: {b.group_details['count']})"

        # Format booking time as a readable slot string
        slot_str = b.date.strftime("%I:%M %p") if b.date else "08:00 AM"
        
        epasses.append({
            "id": b.booking_id,
            "devotee": name,
            "mobile": b.phone,
            "date": b.date.strftime("%d %b %Y") if b.date else "",
            "slot": slot_str,
            "type": "Sheegh Darshan" if b.booking_type == "individual" else "General",
            "status": "active" if (b.date and b.date.replace(tzinfo=None) > datetime.now()) else "used"
        })
    return epasses


@router.get("/support-tickets")
async def get_all_support_tickets(db: AsyncSession = Depends(get_db)):
    """
    Get all support tickets.
    """
    result = await db.execute(select(SupportQuery).order_by(SupportQuery.created_at.desc()))
    tickets = result.scalars().all()
    return [
        {
            "id": f"TKT{t.id:03d}",
            "db_id": t.id,
            "name": t.name,
            "email": t.email,
            "subject": t.subject,
            "message": t.message,
            "date": t.created_at.strftime("%d %b %Y") if t.created_at else "",
            "status": "open"  # SupportQuery has no status column; all stored tickets are open (resolved = deleted)
        }
        for t in tickets
    ]


@router.post("/support-tickets/{ticket_id}/resolve")
async def resolve_support_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Resolve/Delete a support ticket.
    """
    result = await db.execute(select(SupportQuery).where(SupportQuery.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    
    await db.delete(ticket)
    await db.commit()
    return {"message": "Ticket resolved/removed successfully"}
