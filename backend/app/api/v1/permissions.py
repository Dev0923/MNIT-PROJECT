from fastapi import APIRouter, Depends, status, HTTPException, Form, UploadFile, File, Query
import json
from datetime import datetime, date, time
from typing import List, Optional
from uuid import UUID
from app.models.user import User, UserRole
from app.models.enums import PermissionStatus, PurposeCategory
from app.api.dependencies import get_permission_service, get_qr_service, get_current_user, require_admin
from app.services.permission_service import PermissionService
from app.services.qr_service import QRService
from app.schemas.vehicle_permission import PermissionCreateReq, PermissionRes, PermissionStatusUpdateReq

router = APIRouter(prefix="/permissions", tags=["Permissions"])

@router.post("/", response_model=PermissionRes, status_code=status.HTTP_201_CREATED)
async def create_permission_request(
    vehicle_id: UUID = Form(...),
    allowed_gate_ids: str = Form(...),
    valid_from: datetime = Form(...),
    valid_until: datetime = Form(...),
    purpose: str = Form(...),
    driver_name: str = Form(None),
    driver_mobile_number: str = Form(None),
    driver_license_number: str = Form(None),
    license_valid_until: date = Form(None),
    time_from: time = Form(None),
    time_to: time = Form(None),
    start_point: str = Form(None),
    end_point: str = Form(None),
    route_details: str = Form(None),
    purpose_category: PurposeCategory = Form(None),
    expected_occupants: int = Form(None),
    organization_name: str = Form(None),
    emergency_contact_name: str = Form(None),
    emergency_contact_number: str = Form(None),
    insurance_policy_number: str = Form(None),
    insurance_valid_until: date = Form(None),
    rc_file: UploadFile = File(None),
    dl_file: UploadFile = File(None),
    vehicle_photo: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Request a new vehicle entry permission with documents."""
    try:
        gate_ids = [UUID(g) for g in json.loads(allowed_gate_ids)]
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="allowed_gate_ids must be a valid JSON array of UUIDs")

    req = PermissionCreateReq(
        vehicle_id=vehicle_id,
        allowed_gate_ids=gate_ids,
        valid_from=valid_from,
        valid_until=valid_until,
        purpose=purpose,
        driver_name=driver_name,
        driver_mobile_number=driver_mobile_number,
        driver_license_number=driver_license_number,
        license_valid_until=license_valid_until,
        time_from=time_from,
        time_to=time_to,
        start_point=start_point,
        end_point=end_point,
        route_details=route_details,
        purpose_category=purpose_category,
        expected_occupants=expected_occupants,
        organization_name=organization_name,
        emergency_contact_name=emergency_contact_name,
        emergency_contact_number=emergency_contact_number,
        insurance_policy_number=insurance_policy_number,
        insurance_valid_until=insurance_valid_until
    )
    return await permission_service.create_request(current_user.id, req, rc_file, dl_file, vehicle_photo)

@router.get("/", response_model=List[PermissionRes])
async def list_permissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """List permissions. Users see their own, Admins see all."""
    return await permission_service.list_permissions(current_user.id, current_user.role, skip, limit)

@router.get("/{permission_id}", response_model=PermissionRes)
async def get_permission(
    permission_id: UUID,
    current_user: User = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Get details of a specific permission."""
    perm = await permission_service.get_permission(permission_id)
    if current_user.role == UserRole.USER and perm.requester_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this permission.")
    return perm

@router.post("/{permission_id}/approve", response_model=PermissionRes, dependencies=[Depends(require_admin)])
async def approve_permission(
    permission_id: UUID,
    req: PermissionStatusUpdateReq,
    current_user: User = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Approve a pending permission (Admin only)."""
    req.status = PermissionStatus.APPROVED
    return await permission_service.update_status(current_user.id, permission_id, req)

@router.post("/{permission_id}/reject", response_model=PermissionRes, dependencies=[Depends(require_admin)])
async def reject_permission(
    permission_id: UUID,
    req: PermissionStatusUpdateReq,
    current_user: User = Depends(get_current_user),
    permission_service: PermissionService = Depends(get_permission_service)
):
    """Reject a pending permission (Admin only)."""
    req.status = PermissionStatus.REJECTED
    return await permission_service.update_status(current_user.id, permission_id, req)

@router.get("/{permission_id}/qr")
async def generate_qr(
    permission_id: UUID,
    current_user: User = Depends(get_current_user),
    qr_service: QRService = Depends(get_qr_service)
):
    """Generate and retrieve the QR token for an approved permission."""
    token = await qr_service.issue_qr_for_permission(permission_id, current_user.id, current_user.role)
    return {"qr_token": token}
