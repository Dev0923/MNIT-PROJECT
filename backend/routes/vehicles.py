"""
Routes for Vehicle Registration and Entry Permissions using PostgreSQL.
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.sql_models import Vehicle, VehiclePermission, User
from utils.jwt_handler import get_current_user
from utils.activity_logger import log_user_activity

router = APIRouter(prefix="/api/vehicles", tags=["Vehicle Permissions"])

# ── Pydantic Request/Response Schemas ──────────────────

class VehicleRegisterRequest(BaseModel):
    plate_number: str = Field(..., description="Unique license plate number")
    vehicle_type: str = Field(..., description="'Car', 'Two-wheeler', 'Bus', 'VIP' etc.")
    model: Optional[str] = Field(None, description="Optional vehicle make/model")

    @field_validator("plate_number")
    @classmethod
    def validate_plate(cls, v: str) -> str:
        v = v.strip().upper()
        # Clean spacing and dashes
        v = re.sub(r"[\s\-]", "", v)
        if not v:
            raise ValueError("Plate number is required")
        if len(v) < 4 or len(v) > 15:
            raise ValueError("Invalid license plate length")
        return v


class VehicleResponse(BaseModel):
    id: int
    owner_id: Optional[int]
    plate_number: str
    vehicle_type: str
    model: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PermitRequest(BaseModel):
    vehicle_id: int = Field(..., description="ID of the registered vehicle")
    permit_type: str = Field(..., description="e.g. 'VIP Pass', 'Resident Pass', 'Staff Entry', 'Visitor Pass'")
    valid_from: datetime = Field(..., description="Start date/time of the permit validity")
    valid_to: datetime = Field(..., description="End date/time of the permit validity")
    allowed_zones: List[str] = Field(default=["Zone A"], description="Zones permitted e.g. ['VIP Parking', 'Gate 1']")

    @field_validator("allowed_zones")
    @classmethod
    def validate_zones(cls, v: List[str]) -> List[str]:
        cleaned = [z.strip() for z in v if z.strip()]
        if not cleaned:
            raise ValueError("At least one allowed zone must be specified")
        return cleaned


class PermitResponse(BaseModel):
    id: int
    vehicle_id: int
    permit_type: str
    status: str
    valid_from: datetime
    valid_to: datetime
    allowed_zones: List[str]
    approved_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class PermitApproveRequest(BaseModel):
    permit_id: int = Field(..., description="ID of the permit to review")
    status: str = Field(..., description="'Approved' or 'Denied'")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        v = v.strip().capitalize()
        if v not in ["Approved", "Denied"]:
            raise ValueError("Status must be either 'Approved' or 'Denied'")
        return v

# ── Endpoints ──────────────────────────────────────────

@router.post("/register", response_model=VehicleResponse)
async def register_vehicle(
    request: VehicleRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Register a devotee or visitor vehicle.
    """
    # Check if plate is already registered
    result = await db.execute(
        select(Vehicle).where(Vehicle.plate_number == request.plate_number)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Vehicle with plate {request.plate_number} is already registered."
        )

    vehicle = Vehicle(
        owner_id=current_user.id,
        plate_number=request.plate_number,
        vehicle_type=request.vehicle_type,
        model=request.model,
        created_at=datetime.now(timezone.utc)
    )
    db.add(vehicle)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Vehicle Registration",
            title="Registered a Vehicle",
            description=f"Plate: {request.plate_number}, Type: {request.vehicle_type}"
        )
        
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


@router.post("/permit/request", response_model=PermitResponse)
async def request_permit(
    request: PermitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit an entry/parking permit request for a registered vehicle.
    """
    # Verify vehicle belongs to user
    result_veh = await db.execute(
        select(Vehicle).where(Vehicle.id == request.vehicle_id)
    )
    vehicle = result_veh.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found."
        )
    if vehicle.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only request permits for vehicles you own."
        )

    if request.valid_from >= request.valid_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permit start date must be earlier than the end date."
        )

    permit = VehiclePermission(
        vehicle_id=request.vehicle_id,
        permit_type=request.permit_type,
        status="Pending",
        valid_from=request.valid_from,
        valid_to=request.valid_to,
        allowed_zones=request.allowed_zones,
        created_at=datetime.now(timezone.utc)
    )
    db.add(permit)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="Vehicle Permit",
            title="Requested Vehicle Permit",
            description=f"Permit type: {request.permit_type} for Vehicle {vehicle.plate_number}"
        )
        
    await db.commit()
    await db.refresh(permit)
    return permit


@router.get("/my-vehicles", response_model=List[VehicleResponse])
async def get_my_vehicles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all registered vehicles for the current user.
    """
    result = await db.execute(
        select(Vehicle).where(Vehicle.owner_id == current_user.id).order_by(Vehicle.created_at.desc())
    )
    return result.scalars().all()


@router.get("/my-permits", response_model=List[PermitResponse])
async def get_my_permits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all permit requests for the current user's vehicles.
    """
    result = await db.execute(
        select(VehiclePermission)
        .join(Vehicle)
        .where(Vehicle.owner_id == current_user.id)
        .order_by(VehiclePermission.created_at.desc())
    )
    return result.scalars().all()


@router.post("/permit/approve", response_model=PermitResponse)
async def approve_permit(
    request: PermitApproveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    (Admin/Staff only) Approve or deny a vehicle permit request.
    Note: For simplified demo/dev purposes, any active user functions as staff.
    """
    result_perm = await db.execute(
        select(VehiclePermission).where(VehiclePermission.id == request.permit_id)
    )
    permit = result_perm.scalar_one_or_none()
    if not permit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permit request not found."
        )

    permit.status = request.status
    permit.approved_by = current_user.id
    await db.commit()
    await db.refresh(permit)
    return permit
