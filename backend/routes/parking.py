"""
Parking System Routes
- Legacy AI-camera endpoints (kept intact for backward compat)
- NEW: Zonal parking endpoints using loop detectors + boom barriers
"""

from datetime import datetime, timezone, timedelta
from typing import List, Optional
import asyncio

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, text

from database import get_db
from models.sql_models import ParkingLot, ParkingSnapshot, ParkingZone, ParkingZoneSensorLog
from utils.jwt_handler import get_admin_user, get_optional_current_user
from services.parking_ai import analyze_parking_lot
from utils.ws_manager import parking_ws_manager

router = APIRouter(prefix="/api/parking", tags=["Parking"])

# ── In-memory tailgating detector ───────────────────────────
# Maps (zone_id, gate_type) -> last trigger timestamp (UTC)
_last_trigger_ts: dict[tuple[int, str], datetime] = {}
_TAILGATE_WINDOW_SEC = 1.5   # triggers within this window are anomalous


# ═══════════════════════════════════════════════════════
#  Pydantic Schemas — Legacy AI system
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
#  Pydantic Schemas — NEW Zonal System
# ═══════════════════════════════════════════════════════

class ParkingZonePublicResponse(BaseModel):
    zone_id: int
    zone_name: str
    allowed_vehicle_type: str
    total_physical_capacity: int
    system_capacity_limit: int
    current_occupancy: int
    available_slots: int
    pct_full: float
    google_maps_coordinates: str
    barrier_state: str
    is_active: bool
    last_calibrated_at: datetime

    class Config:
        from_attributes = True


class ParkingZoneAdminResponse(ParkingZonePublicResponse):
    camera_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class GateTriggerRequest(BaseModel):
    zone_id: int
    gate_type: str = Field(..., pattern="^(entry|exit)$")
    sensor_id: str = Field(..., min_length=1, max_length=50)


class GateTriggerResponse(BaseModel):
    status: str
    message: str
    zone_id: int
    zone_name: str
    current_occupancy: int
    available_slots: int
    anomaly_flagged: bool


class ZoneAdjustRequest(BaseModel):
    new_occupancy: int = Field(..., ge=0)


class ZoneBarrierRequest(BaseModel):
    state: str = Field(..., pattern="^(auto|forced_down)$")


class ParkingZoneCreate(BaseModel):
    zone_name: str = Field(..., min_length=1, max_length=100)
    allowed_vehicle_type: str = Field(..., pattern="^(two_wheeler|four_wheeler|heavy)$")
    total_physical_capacity: int = Field(..., ge=1)
    system_capacity_limit: int = Field(..., ge=1)
    google_maps_coordinates: str = Field(..., description="'LAT,LONG' string")
    camera_url: Optional[str] = None
    is_active: bool = True


class ParkingAnomalyLogResponse(BaseModel):
    log_id: int
    zone_id: int
    gate_type: str
    sensor_id: str
    anomaly_flag: bool
    flag_reason: Optional[str]
    triggered_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════
#  Legacy AI Helpers
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
#  Zonal Helpers
# ═══════════════════════════════════════════════════════

def _zone_to_public(zone: ParkingZone) -> dict:
    available = max(0, zone.system_capacity_limit - zone.current_occupancy)
    pct_full = round((zone.current_occupancy / zone.system_capacity_limit) * 100, 1) if zone.system_capacity_limit else 0.0
    return {
        "zone_id": zone.zone_id,
        "zone_name": zone.zone_name,
        "allowed_vehicle_type": zone.allowed_vehicle_type,
        "total_physical_capacity": zone.total_physical_capacity,
        "system_capacity_limit": zone.system_capacity_limit,
        "current_occupancy": zone.current_occupancy,
        "available_slots": available,
        "pct_full": pct_full,
        "google_maps_coordinates": zone.google_maps_coordinates,
        "barrier_state": zone.barrier_state,
        "is_active": zone.is_active,
        "last_calibrated_at": zone.last_calibrated_at,
        "camera_url": zone.camera_url,
        "created_at": zone.created_at,
    }


# ═══════════════════════════════════════════════════════
#  PUBLIC Endpoints — Legacy AI
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
#  PUBLIC Endpoints — NEW Zonal System
# ═══════════════════════════════════════════════════════

@router.get("/zones", response_model=List[ParkingZonePublicResponse])
async def get_parking_zones(db: AsyncSession = Depends(get_db)):
    """
    Public: all active parking zones with live occupancy counts.
    Consumed by the devotee ParkingPage for real-time card display.
    """
    result = await db.execute(
        select(ParkingZone).where(ParkingZone.is_active == True).order_by(ParkingZone.zone_id)
    )
    zones = result.scalars().all()
    return [_zone_to_public(z) for z in zones]


@router.get("/zones/{zone_id}", response_model=ParkingZonePublicResponse)
async def get_parking_zone(zone_id: int, db: AsyncSession = Depends(get_db)):
    """Public: single zone details."""
    result = await db.execute(select(ParkingZone).where(ParkingZone.zone_id == zone_id))
    zone = result.scalar_one_or_none()
    if not zone or not zone.is_active:
        raise HTTPException(status_code=404, detail="Parking zone not found.")
    return _zone_to_public(zone)


# ═══════════════════════════════════════════════════════
#  GATE TRIGGER — loop detector hardware endpoint
# ═══════════════════════════════════════════════════════

@router.post("/gate-trigger", response_model=GateTriggerResponse)
async def gate_trigger(payload: GateTriggerRequest, db: AsyncSession = Depends(get_db)):
    """
    Called by gate hardware (buried loop detector) on every vehicle passage.
    - Entry: increments occupancy if below system_capacity_limit (else 403).
    - Exit: decrements occupancy (floor 0).
    - Tailgating detection: flags triggers within 1.5 s on same zone/lane.
    - Broadcasts real-time parking_count_update via WebSocket.
    Atomic row-level lock (SELECT FOR UPDATE) prevents race conditions.
    """
    # ── Row-level lock to prevent race conditions ────────
    result = await db.execute(
        select(ParkingZone)
        .where(ParkingZone.zone_id == payload.zone_id)
        .with_for_update()
    )
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Parking zone not found.")
    if not zone.is_active:
        raise HTTPException(status_code=403, detail="Parking zone is inactive.")

    # ── Tailgating / double-trigger anomaly detection ────
    key = (payload.zone_id, payload.gate_type)
    now_utc = datetime.now(timezone.utc)
    anomaly_flag = False
    flag_reason: Optional[str] = None
    last_ts = _last_trigger_ts.get(key)
    if last_ts and (now_utc - last_ts).total_seconds() < _TAILGATE_WINDOW_SEC:
        anomaly_flag = True
        flag_reason = "Possible Tailgating / Double Metal Trigger"
    _last_trigger_ts[key] = now_utc

    # ── Occupancy update ─────────────────────────────────
    barrier_close_triggered = False
    if payload.gate_type == "entry":
        if zone.current_occupancy >= zone.system_capacity_limit:
            # Log the attempt and respond with 403 (barrier should stay down)
            log = ParkingZoneSensorLog(
                zone_id=zone.zone_id,
                gate_type=payload.gate_type,
                sensor_id=payload.sensor_id,
                anomaly_flag=True,
                flag_reason="Entry blocked — zone at system capacity limit",
            )
            db.add(log)
            await db.commit()
            raise HTTPException(
                status_code=403,
                detail={
                    "message": "PARKING FULL — Close Barrier / Trigger LED",
                    "zone_id": zone.zone_id,
                    "zone_name": zone.zone_name,
                    "current_occupancy": zone.current_occupancy,
                    "system_capacity_limit": zone.system_capacity_limit,
                }
            )
        zone.current_occupancy += 1
        # Auto-close barrier if we just hit the limit
        if zone.current_occupancy >= zone.system_capacity_limit and zone.barrier_state == "auto":
            barrier_close_triggered = True
    else:  # exit
        zone.current_occupancy = max(0, zone.current_occupancy - 1)

    # ── Log the trigger ──────────────────────────────────
    log = ParkingZoneSensorLog(
        zone_id=zone.zone_id,
        gate_type=payload.gate_type,
        sensor_id=payload.sensor_id,
        anomaly_flag=anomaly_flag,
        flag_reason=flag_reason,
    )
    db.add(log)
    await db.commit()
    await db.refresh(zone)

    # ── WebSocket broadcast ──────────────────────────────
    anomaly_payload = None
    if anomaly_flag:
        anomaly_payload = {"sensor_id": payload.sensor_id, "reason": flag_reason}

    asyncio.create_task(
        parking_ws_manager.broadcast_zone_update(
            zone_id=zone.zone_id,
            zone_name=zone.zone_name,
            current_occupancy=zone.current_occupancy,
            system_capacity_limit=zone.system_capacity_limit,
            total_physical_capacity=zone.total_physical_capacity,
            anomaly=anomaly_payload,
        )
    )

    available = max(0, zone.system_capacity_limit - zone.current_occupancy)
    msg = "Entry recorded" if payload.gate_type == "entry" else "Exit recorded"
    if barrier_close_triggered:
        msg += " — Barrier auto-closed (zone full)"

    return GateTriggerResponse(
        status="ok",
        message=msg,
        zone_id=zone.zone_id,
        zone_name=zone.zone_name,
        current_occupancy=zone.current_occupancy,
        available_slots=available,
        anomaly_flagged=anomaly_flag,
    )


# ═══════════════════════════════════════════════════════
#  ADMIN Endpoints — Legacy AI
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


# ═══════════════════════════════════════════════════════
#  ADMIN Endpoints — NEW Zonal System
# ═══════════════════════════════════════════════════════

@router.get("/admin/zones", response_model=List[ParkingZoneAdminResponse])
async def admin_get_zones(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: all parking zones including camera URLs and full details."""
    result = await db.execute(select(ParkingZone).order_by(ParkingZone.zone_id))
    zones = result.scalars().all()
    return [_zone_to_public(z) for z in zones]


@router.post("/admin/zones", response_model=ParkingZoneAdminResponse, status_code=201)
async def admin_create_zone(
    payload: ParkingZoneCreate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: create a new parking zone."""
    zone = ParkingZone(
        zone_name=payload.zone_name,
        allowed_vehicle_type=payload.allowed_vehicle_type,
        total_physical_capacity=payload.total_physical_capacity,
        system_capacity_limit=payload.system_capacity_limit,
        current_occupancy=0,
        google_maps_coordinates=payload.google_maps_coordinates,
        camera_url=payload.camera_url,
        barrier_state="auto",
        is_active=payload.is_active,
    )
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return _zone_to_public(zone)


@router.post("/admin/zones/{zone_id}/reset", response_model=ParkingZoneAdminResponse)
async def admin_reset_zone(
    zone_id: int,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """
    Admin: reset occupancy to 0.
    Used for midnight maintenance / fresh-day calibration.
    """
    result = await db.execute(
        select(ParkingZone).where(ParkingZone.zone_id == zone_id).with_for_update()
    )
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Parking zone not found.")
    zone.current_occupancy = 0
    zone.last_calibrated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(zone)

    asyncio.create_task(
        parking_ws_manager.broadcast_zone_update(
            zone_id=zone.zone_id, zone_name=zone.zone_name,
            current_occupancy=0,
            system_capacity_limit=zone.system_capacity_limit,
            total_physical_capacity=zone.total_physical_capacity,
        )
    )
    return _zone_to_public(zone)


@router.post("/admin/zones/{zone_id}/adjust", response_model=ParkingZoneAdminResponse)
async def admin_adjust_zone(
    zone_id: int,
    payload: ZoneAdjustRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """
    Admin: manually set occupancy to a specific count.
    Used when 'ghost vehicle' drift accumulates and a physical count is done.
    """
    result = await db.execute(
        select(ParkingZone).where(ParkingZone.zone_id == zone_id).with_for_update()
    )
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Parking zone not found.")
    zone.current_occupancy = min(payload.new_occupancy, zone.system_capacity_limit)
    zone.last_calibrated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(zone)

    asyncio.create_task(
        parking_ws_manager.broadcast_zone_update(
            zone_id=zone.zone_id, zone_name=zone.zone_name,
            current_occupancy=zone.current_occupancy,
            system_capacity_limit=zone.system_capacity_limit,
            total_physical_capacity=zone.total_physical_capacity,
        )
    )
    return _zone_to_public(zone)


@router.post("/admin/zones/{zone_id}/barrier", response_model=ParkingZoneAdminResponse)
async def admin_set_barrier(
    zone_id: int,
    payload: ZoneBarrierRequest,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: force barrier state (auto | forced_down)."""
    result = await db.execute(select(ParkingZone).where(ParkingZone.zone_id == zone_id))
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Parking zone not found.")
    zone.barrier_state = payload.state
    await db.commit()
    await db.refresh(zone)
    return _zone_to_public(zone)


@router.get("/admin/anomalies", response_model=List[ParkingAnomalyLogResponse])
async def admin_get_anomalies(
    zone_id: Optional[int] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: paginated list of flagged anomaly triggers across all zones."""
    q = select(ParkingZoneSensorLog).where(ParkingZoneSensorLog.anomaly_flag == True)
    if zone_id:
        q = q.where(ParkingZoneSensorLog.zone_id == zone_id)
    q = q.order_by(desc(ParkingZoneSensorLog.triggered_at)).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/admin/sensor-logs", response_model=List[ParkingAnomalyLogResponse])
async def admin_get_sensor_logs(
    zone_id: Optional[int] = None,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_admin_user),
):
    """Admin: raw sensor log for a zone (all triggers, not only anomalies)."""
    q = select(ParkingZoneSensorLog)
    if zone_id:
        q = q.where(ParkingZoneSensorLog.zone_id == zone_id)
    q = q.order_by(desc(ParkingZoneSensorLog.triggered_at)).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


# ═══════════════════════════════════════════════════════
#  WebSocket — live parking updates
# ═══════════════════════════════════════════════════════

@router.websocket("/ws")
async def parking_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time parking count updates.
    Connect from admin panel or devotee app to receive parking_count_update events.
    Prefix: ws://host/api/parking/ws
    """
    await parking_ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; actual data flows server -> client via broadcast
            await websocket.receive_text()
    except WebSocketDisconnect:
        parking_ws_manager.disconnect(websocket)
