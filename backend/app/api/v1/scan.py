from fastapi import APIRouter, Depends, status
from app.api.dependencies import get_qr_service, get_entry_log_service, get_current_user, require_operator, require_admin
from app.services.qr_service import QRService
from app.services.entry_log_service import EntryLogService
from app.schemas.vehicle_permission import ScanVerifyReq, ScanVerifyRes, ScanOverrideReq, EntryLogRes
from app.models.user import User

router = APIRouter(prefix="/scan", tags=["QR Scanning"])

@router.post("/verify", response_model=ScanVerifyRes, dependencies=[Depends(require_operator)])
async def verify_qr_scan(
    req: ScanVerifyReq,
    current_user: User = Depends(get_current_user),
    qr_service: QRService = Depends(get_qr_service)
):
    """Verify a QR scan at a specific gate (Operator only)."""
    return await qr_service.verify_scan(
        guard_id=current_user.id,
        qr_token=req.qr_token,
        gate_id=req.gate_id,
        direction=req.direction
    )

@router.post("/override", response_model=EntryLogRes, dependencies=[Depends(require_admin)])
async def override_scan(
    req: ScanOverrideReq,
    current_user: User = Depends(get_current_user),
    entry_log_service: EntryLogService = Depends(get_entry_log_service)
):
    """
    Manually override a denied scan to grant entry.
    Requires Supervisor/Admin privileges.
    """
    # Using the current admin as both the "guard" and the "admin" for simplicity, 
    # unless a guard ID was explicitly provided in the request body.
    return await entry_log_service.log_override(
        override_data=req,
        guard_id=current_user.id,
        admin_id=current_user.id
    )
