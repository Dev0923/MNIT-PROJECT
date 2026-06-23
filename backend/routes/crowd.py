"""
Routes for Crowd Density and Darshan Slot management using PostgreSQL.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy import desc

from database import get_db
from models.sql_models import CrowdDensityLog, DarshanSlot, User
from utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/crowd", tags=["Crowd Control"])

# ── Pydantic Request/Response Schemas ──────────────────

class CrowdDensityLogRequest(BaseModel):
    zone_name: str = Field(..., description="e.g., 'Inner Sanctum', 'Main Entrance', 'Waiting Hall A'")
    current_count: int = Field(..., ge=0, description="Estimated or sensor-measured count of people")
    status: Optional[str] = Field(None, description="Optional overrides e.g. 'Normal', 'Moderate', 'Dense', 'Critical'")

    @field_validator("zone_name")
    @classmethod
    def validate_zone(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Zone name cannot be empty")
        return v


class CrowdDensityLogResponse(BaseModel):
    id: int
    zone_name: str
    current_count: int
    status: str
    recorded_at: datetime

    class Config:
        from_attributes = True


class SlotConfigureRequest(BaseModel):
    slot_time: datetime = Field(..., description="Start hour of the slot")
    capacity: int = Field(1000, ge=1, description="Max allowed bookings for this slot")


class SlotResponse(BaseModel):
    id: int
    slot_time: datetime
    capacity: int
    booked_count: int

    class Config:
        from_attributes = True

# ── Helpers ────────────────────────────────────────────

def calculate_status(count: int) -> str:
    """Calculates density level based on headcount threshold."""
    if count < 300:
        return "Normal"
    elif count < 600:
        return "Moderate"
    elif count < 1000:
        return "Dense"
    else:
        return "Critical"

# ── Endpoints ──────────────────────────────────────────

@router.post("/density-log", response_model=CrowdDensityLogResponse)
async def submit_density_log(
    request: CrowdDensityLogRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a real-time crowd headcount reading for a specific zone.
    Status is automatically computed if not explicitly overridden.
    """
    computed_status = request.status if request.status else calculate_status(request.current_count)
    
    log = CrowdDensityLog(
        zone_name=request.zone_name,
        current_count=request.current_count,
        status=computed_status,
        recorded_at=datetime.now(timezone.utc)
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/density-status", response_model=List[CrowdDensityLogResponse])
async def get_current_density_status(db: AsyncSession = Depends(get_db)):
    """
    Get the latest crowd density count across all registered zones.
    Uses PostgreSQL-specific DISTINCT ON for optimized query execution.
    """
    # Select the latest record for each distinct zone_name
    result = await db.execute(
        select(CrowdDensityLog)
        .distinct(CrowdDensityLog.zone_name)
        .order_by(CrowdDensityLog.zone_name, desc(CrowdDensityLog.recorded_at))
    )
    return result.scalars().all()


@router.get("/density-history", response_model=List[CrowdDensityLogResponse])
async def get_density_history(
    zone_name: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve historical crowd readings (latest first).
    """
    query = select(CrowdDensityLog)
    if zone_name:
        query = query.where(CrowdDensityLog.zone_name == zone_name)
    query = query.order_by(desc(CrowdDensityLog.recorded_at)).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/slots/configure", response_model=SlotResponse)
async def configure_slot(
    request: SlotConfigureRequest,
    current_user: User = Depends(get_current_user),  # Admin check implicit
    db: AsyncSession = Depends(get_db)
):
    """
    Configure capacity for a specific hourly Darshan slot.
    """
    # Truncate slot time to start of hour
    slot_time = request.slot_time.replace(minute=0, second=0, microsecond=0)
    
    result = await db.execute(
        select(DarshanSlot).where(DarshanSlot.slot_time == slot_time)
    )
    slot = result.scalar_one_or_none()
    
    if slot:
        # Update capacity of existing slot
        slot.capacity = request.capacity
    else:
        # Create a new slot config
        slot = DarshanSlot(
            slot_time=slot_time,
            capacity=request.capacity,
            booked_count=0
        )
        db.add(slot)
        
    await db.commit()
    await db.refresh(slot)
    return slot


@router.get("/slots/availability", response_model=List[SlotResponse])
async def get_slots_availability(
    days: int = 7,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all hourly Darshan slots and capacity/booking details for the next N days.
    """
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=days)
    
    result = await db.execute(
        select(DarshanSlot)
        .where(DarshanSlot.slot_time >= now.replace(minute=0, second=0, microsecond=0))
        .where(DarshanSlot.slot_time <= end_date)
        .order_by(DarshanSlot.slot_time.asc())
    )
    existing_slots = {s.slot_time: s for s in result.scalars().all()}
    
    # Generate full lists of slots for the days (e.g. daily hours 06:00 to 21:00)
    # If slot doesn't exist in DB, mock a default response with booked_count = 0
    all_slots = []
    current_day = now.date()
    
    for d_offset in range(days):
        day = now.date() + timedelta(days=d_offset)
        # Assuming temple hours are 06:00 to 21:00
        for hour in range(6, 22):
            slot_dt = datetime(day.year, day.month, day.day, hour, 0, 0, tzinfo=timezone.utc)
            if slot_dt < now:
                continue
                
            if slot_dt in existing_slots:
                all_slots.append(existing_slots[slot_dt])
            else:
                # Add unconfigured virtual slot
                all_slots.append(
                    DarshanSlot(
                        id=0,
                        slot_time=slot_dt,
                        capacity=1000,
                        booked_count=0
                    )
                )
                
    return all_slots
