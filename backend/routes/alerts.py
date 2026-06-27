"""
WebSocket-based real-time alert system.

- /api/v1/alerts/ws   — WebSocket endpoint for user clients
- /api/v1/alerts/send — POST endpoint for admin to broadcast a message
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.sql_models import SOSAlert, User
from utils.jwt_handler import get_current_user
from database import get_db
from utils.activity_logger import log_user_activity

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


class ConnectionManager:
    """Keeps track of every active WebSocket connection."""

    def __init__(self) -> None:
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict) -> None:
        """Send *message* to every connected client, silently dropping dead sockets."""
        dead: list[WebSocket] = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ── WebSocket endpoint (users connect here) ─────────────────────
@router.websocket("/ws")
async def alert_ws(ws: WebSocket):
    print("WS ENDPOINT STARTED")
    try:
        await manager.connect(ws)
        print("WS ACCEPTED")
        while True:
            data = await ws.receive_text()
            print("WS RECEIVED:", data)
    except Exception as e:
        print("WS EXCEPTION:", repr(e))
    finally:
        manager.disconnect(ws)
        print("WS DISCONNECTED")


# ── Broadcast endpoint (admin calls this) ───────────────────────
class AlertPayload(BaseModel):
    message: str
    severity: str = "info"  # info | warning | critical


@router.post("/send")
async def send_alert(payload: AlertPayload):
    """Broadcast an alert to every connected user client."""
    data = {
        "type": "alert",
        "message": payload.message,
        "severity": payload.severity,
        "timestamp": datetime.utcnow().isoformat(),
    }
    await manager.broadcast(data)
    return {
        "status": "sent",
        "recipients": len(manager.active),
        "message": payload.message,
    }


# ── SOS Emergency Endpoints ─────────────────────────────────────
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.sql_models import SOSAlert, User
from utils.jwt_handler import get_current_user
from typing import Optional

class SOSActivateRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@router.post("/sos/activate")
async def activate_sos(
    payload: SOSActivateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger/Activate a devotee SOS distress call.
    Automatically cancels any active SOS alerts for this user first.
    """
    # Cancel previous active SOS signals for this user
    active_res = await db.execute(
        select(SOSAlert)
        .where(SOSAlert.user_id == current_user.id)
        .where(SOSAlert.status == "Activated")
    )
    for alert in active_res.scalars().all():
        alert.status = "Cancelled"

    # Create new SOS record
    new_sos = SOSAlert(
        user_id=current_user.id,
        status="Activated",
        latitude=payload.latitude,
        longitude=payload.longitude,
        created_at=datetime.utcnow()
    )
    db.add(new_sos)
    
    if current_user:
        await log_user_activity(
            db=db,
            user_id=current_user.id,
            activity_type="SOS",
            title="Submitted SOS Request",
            description=f"Distress signal from lat {payload.latitude}, lon {payload.longitude}"
        )
        
    await db.commit()
    
    # Broadcast to admin clients via WebSockets
    try:
        distress_msg = {
            "type": "sos_alert",
            "user_id": current_user.id,
            "user_name": current_user.name,
            "user_phone": current_user.phone,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "timestamp": new_sos.created_at.isoformat()
        }
        await manager.broadcast(distress_msg)
    except Exception as e:
        print(f"[WARNING] Failed to broadcast SOS WebSocket alert: {e}")

    await db.commit()
    await db.refresh(new_sos)
    
    return {
        "success": True,
        "message": "Emergency SOS distress signal has been recorded and broadcasted. Help is on the way.",
        "sos": {
            "id": new_sos.id,
            "status": new_sos.status,
            "latitude": new_sos.latitude,
            "longitude": new_sos.longitude,
            "created_at": new_sos.created_at.isoformat()
        }
    }


@router.post("/sos/cancel")
async def cancel_sos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel all active SOS distress calls for the devotee.
    """
    active_res = await db.execute(
        select(SOSAlert)
        .where(SOSAlert.user_id == current_user.id)
        .where(SOSAlert.status == "Activated")
    )
    active_alerts = active_res.scalars().all()
    for alert in active_alerts:
        alert.status = "Cancelled"
        
    await db.commit()
    return {
        "success": True,
        "message": "SOS active distress signals cancelled successfully.",
        "cancelled_count": len(active_alerts)
    }
