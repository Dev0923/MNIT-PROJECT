"""
Parking System Routes
- Public: slot availability (no camera URLs)
- Admin-only: lot management, camera feeds, AI analysis, snapshot history
"""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.sql_models import ParkingLot, ParkingSnapshot
from utils.jwt_handler import get_admin_user, get_optional_current_user
from services.parking_ai import analyze_parking_lot

router = APIRouter(prefix="/api/parking", tags=["Parking"])


# ═══════════════════════════════════════════════════════
#  Pydantic Schemas
# ═══════════════════════════════════════════════════════

class ParkingLotCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    total_slots: int = Field(..., ge=1)
    camera_url: Optional[str] = Field(None, description="YouTube/HLS/RTSP stream URL")
    location_description: Optional[str] = None
    is_active: bool = True


class ParkingLotUpdate(BaseModel):
    name: Optional[str] = None
    total_slots: Optional[int] = Field(None, ge=1)
    camera_url: Optional[str] = None
    location_description: Optional[str] = None
    is_active: Optional[bool] = None


class ParkingLotPublicResponse(BaseModel):
    """Returned to regular users — no camera_url."""
    id: int
    name: str
    total_slots: int
    location_description: Optional[str]
    is_active: bool
    occupied_slots: int
    available_slots: int
    occupancy_pct: float
    last_updated: Optional[datetime]

    class Config:
        from_attributes = True


class ParkingLotAdminResponse(BaseModel):
    """Returned to admins — includes camera_url."""
    id: int
    name: str
    total_slots: int
    camera_url: Optional[str]
    location_description: Optional[str]
    is_active: bool
    occupied_slots: int
    available_slots: int
    occupancy_pct: float
    last_updated: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ParkingSnapshotResponse(BaseModel):
    id: int
    lot_id: int
    occupied_slots: int
    available_slots: int
    confidence_score: Optional[float]
    vehicle_boxes: Optional[list]
    snapshot_image_url: Optional[str]
    recorded_at: datetime

    class Config:
        from_attributes = True


class SnapshotSubmitRequest(BaseModel):
    """Manual snapshot submission (e.g., from an edge device)."""
    lot_id: int
    occupied_slots: int
    confidence_score: Optional[float] = None
    vehicle_boxes: Optional[list] = None
    snapshot_image_url: Optional[str] = None


# ═══════════════════════════════════════════════════════
#  Helpers
# ═══════════════════════════════════════════════════════

async def _get_lot_with_latest(db: AsyncSession, lot: ParkingLot) -> dict:
    """Attach the latest snapshot counts to a lot dict."""
    result = await db.execute(
        select(ParkingSnapshot)
        .where(ParkingSnapshot.lot_id == lot.id)
        .order_by(desc(ParkingSnapshot.recorded_at))
        .limit(1)
    )
    snap = result.scalar_one_or_none()
    occupied = snap.occupied_slots if snap else 0
    available = snap.available_slots if snap else lot.total_slots
    last_updated = snap.recorded_at if snap else None
    occ_pct = round((occupied / lot.total_slots) * 100, 1) if lot.total_slots else 0.0
    return {
        "id": lot.id,
        "name": lot.name,
        "total_slots": lot.total_slots,
        "camera_url": lot.camera_url,
        "location_description": lot.location_description,
        "is_active": lot.is_active,
        "occupied_slots": occupied,
        "available_slots": available,
        "occupancy_pct": occ_pct,
        "last_updated": last_updated,
        "created_at": lot.created_at,
    }


# ═══════════════════════════════════════════════════════
#  PUBLIC Endpoints
# ═══════════════════════════════════════════════════════

@router.get("/availability", response_model=List[ParkingLotPublicResponse])
async def get_parking_availability(db: AsyncSession = Depends(get_db)):
    """
    Public endpoint: returns slot availability for all active lots.
    No camera URLs are exposed.
    """
    result = await db.execute(
        select(ParkingLot).where(ParkingLot.is_active == True).order_by(ParkingLot.id)
    )
    lots = result.scalars().all()
    return [await _get_lot_with_latest(db, lot) for lot in lots]


@router.get("/availability/{lot_id}", response_model=ParkingLotPublicResponse)
async def get_lot_availability(lot_id: int, db: AsyncSession = Depends(get_db)):
    """Public: single lot availability."""
    result = await db.execute(select(ParkingLot).where(ParkingLot.id == lot_id))
    lot = result.scalar_one_or_none()
    if not lot or not lot.is_active:
        raise HTTPException(status_code=404, detail="Parking lot not found.")
    return await _get_lot_with_latest(db, lot)


# ═══════════════════════════════════════════════════════
#  ADMIN Endpoints
# ═══════════════════════════════════════════════════════

@router.get("/admin/lots", response_model=List[ParkingLotAdminResponse])
async def admin_get_lots(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: all parking lots including camera URLs."""
    result = await db.execute(select(ParkingLot).order_by(ParkingLot.id))
    lots = result.scalars().all()
    return [await _get_lot_with_latest(db, lot) for lot in lots]


@router.post("/admin/lots", response_model=ParkingLotAdminResponse, status_code=201)
async def admin_create_lot(
    payload: ParkingLotCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: create a new parking lot."""
    lot = ParkingLot(
        name=payload.name,
        total_slots=payload.total_slots,
        camera_url=payload.camera_url,
        location_description=payload.location_description,
        is_active=payload.is_active,
        created_at=datetime.now(timezone.utc),
    )
    db.add(lot)
    await db.commit()
    await db.refresh(lot)
    return await _get_lot_with_latest(db, lot)


@router.put("/admin/lots/{lot_id}", response_model=ParkingLotAdminResponse)
async def admin_update_lot(
    lot_id: int,
    payload: ParkingLotUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: update parking lot details."""
    result = await db.execute(select(ParkingLot).where(ParkingLot.id == lot_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lot, field, value)
    await db.commit()
    await db.refresh(lot)
    return await _get_lot_with_latest(db, lot)


@router.delete("/admin/lots/{lot_id}", status_code=204)
async def admin_delete_lot(
    lot_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: deactivate (soft-delete) a parking lot."""
    result = await db.execute(select(ParkingLot).where(ParkingLot.id == lot_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")
    lot.is_active = False
    await db.commit()


@router.post("/admin/analyze/{lot_id}", response_model=ParkingSnapshotResponse)
async def admin_analyze_lot(
    lot_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """
    Admin: trigger on-demand AI vehicle detection on a lot's camera feed.
    Saves result as a new ParkingSnapshot.
    """
    result = await db.execute(select(ParkingLot).where(ParkingLot.id == lot_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")

    detection = await analyze_parking_lot(
        camera_url=lot.camera_url,
        total_slots=lot.total_slots,
        lot_id=lot.id,
    )

    snap = ParkingSnapshot(
        lot_id=lot.id,
        occupied_slots=detection["occupied_slots"],
        available_slots=detection["available_slots"],
        confidence_score=detection.get("confidence_score"),
        vehicle_boxes=detection.get("vehicle_boxes"),
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(snap)
    await db.commit()
    await db.refresh(snap)
    return snap


@router.post("/admin/snapshot", response_model=ParkingSnapshotResponse, status_code=201)
async def admin_submit_snapshot(
    payload: SnapshotSubmitRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin/Edge-device: manually submit a vehicle detection snapshot."""
    result = await db.execute(select(ParkingLot).where(ParkingLot.id == payload.lot_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Parking lot not found.")

    available = max(0, lot.total_slots - payload.occupied_slots)
    snap = ParkingSnapshot(
        lot_id=payload.lot_id,
        occupied_slots=payload.occupied_slots,
        available_slots=available,
        confidence_score=payload.confidence_score,
        vehicle_boxes=payload.vehicle_boxes,
        snapshot_image_url=payload.snapshot_image_url,
        recorded_at=datetime.now(timezone.utc),
    )
    db.add(snap)
    await db.commit()
    await db.refresh(snap)
    return snap


@router.get("/admin/snapshots/{lot_id}", response_model=List[ParkingSnapshotResponse])
async def admin_get_snapshots(
    lot_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: historical detection snapshots for a lot."""
    result = await db.execute(
        select(ParkingSnapshot)
        .where(ParkingSnapshot.lot_id == lot_id)
        .order_by(desc(ParkingSnapshot.recorded_at))
        .limit(limit)
    )
    return result.scalars().all()
