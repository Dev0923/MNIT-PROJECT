from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from database import get_db
from models.sql_models import SystemSetting, GateTicket
from utils.ws_manager import gate_ws_manager
from pydantic import BaseModel
router = APIRouter(prefix="/api/gate", tags=["Gate Operations"])

# ── Pydantic Schemas ───────────────────────────────────

class ScanRequest(BaseModel):
    ticket_id: str

class SettingsUpdateRequest(BaseModel):
    max_capacity: int

class CreateTicketRequest(BaseModel):
    ticket_id: str
    booking_type: str  # 'online' or 'counter'
    verification_medium: str  # 'smartphone' or 'paper_slip'

# ── Stats Helper ───────────────────────────────────────

async def get_headcount_stats(db: AsyncSession):
    # 1. Fetch max_capacity
    setting_res = await db.execute(
        select(SystemSetting).filter(SystemSetting.setting_key == 'max_capacity')
    )
    setting = setting_res.scalar_one_or_none()
    max_capacity = int(setting.setting_value) if setting else 2000

    # 2. Count current inside (entered status)
    inside_res = await db.execute(
        select(func.count()).select_from(GateTicket).filter(GateTicket.status == 'entered')
    )
    current_inside = inside_res.scalar_one()

    # 3. Count online scans today (status entered or exited)
    # We filter for tickets scanned today (IST timezone check)
    tz = timezone(timedelta(hours=5, minutes=30))
    today_start = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)

    online_res = await db.execute(
        select(func.count()).select_from(GateTicket).filter(
            GateTicket.booking_type == 'online',
            GateTicket.status.in_(['entered', 'exited']),
            GateTicket.scanned_at_entry >= today_start
        )
    )
    online_scans_today = online_res.scalar_one()

    # 4. Count counter scans today (status entered or exited)
    counter_res = await db.execute(
        select(func.count()).select_from(GateTicket).filter(
            GateTicket.booking_type == 'counter',
            GateTicket.status.in_(['entered', 'exited']),
            GateTicket.scanned_at_entry >= today_start
        )
    )
    counter_scans_today = counter_res.scalar_one()

    # 5. Fetch all scans for the devotee log (entered or exited)
    logs_res = await db.execute(
        select(GateTicket)
        .filter(GateTicket.status.in_(['entered', 'exited']))
        .order_by(desc(func.coalesce(GateTicket.scanned_at_exit, GateTicket.scanned_at_entry)))
        .limit(50)
    )
    logs = logs_res.scalars().all()
    
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "ticket_id": log.ticket_id,
            "booking_type": log.booking_type,
            "verification_medium": log.verification_medium,
            "status": log.status,
            "scanned_at_entry": log.scanned_at_entry.isoformat() if log.scanned_at_entry else None,
            "scanned_at_exit": log.scanned_at_exit.isoformat() if log.scanned_at_exit else None,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })

    # 6. Hourly trend (6 AM to 9 PM)
    trend_data = []
    today = datetime.now(tz).date()
    for hour in range(6, 22):
        hour_start_local = datetime.combine(today, datetime.min.time().replace(hour=hour)).replace(tzinfo=tz)
        hour_end_local = datetime.combine(today, datetime.min.time().replace(hour=hour, minute=59, second=59)).replace(tzinfo=tz)
        
        q = select(func.count()).select_from(GateTicket).filter(
            GateTicket.scanned_at_entry <= hour_end_local,
            (GateTicket.scanned_at_exit == None) | (GateTicket.scanned_at_exit > hour_start_local),
            GateTicket.scanned_at_entry >= datetime.combine(today, datetime.min.time()).replace(tzinfo=tz)
        )
        res = await db.execute(q)
        count = res.scalar_one()
        
        ampm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
        label = f"{display_hour:02d}:00 {ampm}"
        
        trend_data.append({
            "time": label,
            "count": count
        })

    return {
        "max_capacity": max_capacity,
        "current_inside": current_inside,
        "online_scans_today": online_scans_today,
        "counter_scans_today": counter_scans_today,
        "recent_logs": formatted_logs,
        "trend_data": trend_data
    }

# ── Endpoints ──────────────────────────────────────────

@router.get("/dashboard-data")
async def get_dashboard_data(db: AsyncSession = Depends(get_db)):
    """Fetch the initial dashboard data."""
    try:
        return await get_headcount_stats(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-ticket")
async def create_ticket(request: CreateTicketRequest, db: AsyncSession = Depends(get_db)):
    """Create a ticket in booked status for scan simulation."""
    # Check if ticket already exists
    existing = await db.execute(select(GateTicket).filter(GateTicket.ticket_id == request.ticket_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ticket ID already exists")

    ticket = GateTicket(
        ticket_id=request.ticket_id,
        booking_type=request.booking_type,
        verification_medium=request.verification_medium,
        status="booked"
    )
    db.add(ticket)
    await db.commit()
    return {"status": "created", "ticket_id": ticket.ticket_id}

@router.post("/entry-scan")
async def entry_scan(request: ScanRequest, db: AsyncSession = Depends(get_db)):
    """
    Handle Gate Entry Scan.
    Uses pessimistic transaction locks on system settings to serialize concurrent scan validations.
    """
    async with db.begin():
        # 1. Fetch max_capacity with a row-level lock (FOR UPDATE)
        setting_query = select(SystemSetting).filter(SystemSetting.setting_key == 'max_capacity').with_for_update()
        setting_res = await db.execute(setting_query)
        setting = setting_res.scalar_one_or_none()
        max_capacity = int(setting.setting_value) if setting else 2000

        # 2. Count entered tickets inside
        inside_query = select(func.count()).select_from(GateTicket).filter(GateTicket.status == 'entered')
        inside_res = await db.execute(inside_query)
        current_count = inside_res.scalar_one()

        # 3. Enforce Capacity limit
        if current_count >= max_capacity:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Temple Full. Hold Entry."
            )

        # 4. Fetch the ticket to update (also locked with FOR UPDATE to prevent double entry)
        ticket_query = select(GateTicket).filter(GateTicket.ticket_id == request.ticket_id).with_for_update()
        ticket_res = await db.execute(ticket_query)
        ticket = ticket_res.scalar_one_or_none()

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket ID not found.")
        
        if ticket.status == 'entered':
            raise HTTPException(status_code=400, detail="Ticket already entered.")
        
        if ticket.status == 'exited':
            raise HTTPException(status_code=400, detail="Ticket already exited.")

        # 5. Update status
        ticket.status = 'entered'
        ticket.scanned_at_entry = datetime.now(timezone.utc)
        
    # Transaction committed automatically outside the begin block. Let's broadcast updates.
    # Refresh DB session or query stats in a new session block
    async with AsyncSession(db.bind, expire_on_commit=False) as new_session:
        stats = await get_headcount_stats(new_session)
        await gate_ws_manager.broadcast({
            "event": "headcount_update",
            "data": stats
        })

    return {"status": "allowed", "ticket_id": request.ticket_id}

@router.post("/exit-scan")
async def exit_scan(request: ScanRequest, db: AsyncSession = Depends(get_db)):
    """Handle Gate Exit Scan."""
    async with db.begin():
        # Fetch ticket
        ticket_query = select(GateTicket).filter(GateTicket.ticket_id == request.ticket_id).with_for_update()
        ticket_res = await db.execute(ticket_query)
        ticket = ticket_res.scalar_one_or_none()

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket ID not found.")
        
        if ticket.status == 'exited':
            raise HTTPException(status_code=400, detail="Ticket already exited.")
        
        if ticket.status != 'entered':
            raise HTTPException(status_code=400, detail="Ticket has not entered yet.")

        # Update status
        ticket.status = 'exited'
        ticket.scanned_at_exit = datetime.now(timezone.utc)

    # Broadcast updates
    async with AsyncSession(db.bind, expire_on_commit=False) as new_session:
        stats = await get_headcount_stats(new_session)
        await gate_ws_manager.broadcast({
            "event": "headcount_update",
            "data": stats
        })

    return {"status": "exited", "ticket_id": request.ticket_id}

@router.post("/settings")
async def update_settings(request: SettingsUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update max capacity setting and notify all clients."""
    async with db.begin():
        setting_query = select(SystemSetting).filter(SystemSetting.setting_key == 'max_capacity').with_for_update()
        setting_res = await db.execute(setting_query)
        setting = setting_res.scalar_one_or_none()

        if not setting:
            setting = SystemSetting(setting_key='max_capacity', setting_value=str(request.max_capacity))
            db.add(setting)
        else:
            setting.setting_value = str(request.max_capacity)

    # Broadcast updates
    async with AsyncSession(db.bind, expire_on_commit=False) as new_session:
        stats = await get_headcount_stats(new_session)
        await gate_ws_manager.broadcast({
            "event": "headcount_update",
            "data": stats
        })

    return {"status": "updated", "max_capacity": request.max_capacity}


# ── WebSocket Route ───────────────────────────────────

# We register the websocket handler under /ws/gate/live-updates in the main app,
# or we can define it here. Since routers can handle websockets in FastAPI:
@router.websocket_route("/ws/live-updates")
async def websocket_endpoint(websocket: WebSocket):
    await gate_ws_manager.connect(websocket)
    try:
        # Upon connection, send initial stats
        from database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            stats = await get_headcount_stats(session)
            await websocket.send_json({
                "event": "initial_state",
                "data": stats
            })
            
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        gate_ws_manager.disconnect(websocket)
    except Exception:
        gate_ws_manager.disconnect(websocket)
