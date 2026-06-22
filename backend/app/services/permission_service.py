import logging
import uuid
from typing import Optional
import os
import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.vehicle_permission import Permission, Gate
from app.models.enums import PermissionStatus
from app.schemas.vehicle_permission import PermissionCreateReq, PermissionStatusUpdateReq
from app.core.exceptions import ResourceNotFound, InvalidStateTransition, PermissionDenied
from app.services.audit_service import AuditService
from app.services.vehicle_service import VehicleService

class PermissionService:
    """Service handling the lifecycle of vehicle permissions."""

    def __init__(self, session: AsyncSession, audit_service: AuditService, vehicle_service: VehicleService, request_id: Optional[str] = None):
        self.session = session
        self.audit_service = audit_service
        self.vehicle_service = vehicle_service
        self.logger = logging.LoggerAdapter(logging.getLogger(__name__), extra={"request_id": request_id or "N/A"})

    def _generate_code(self, category: str) -> str:
        """Generates a human-readable permission code."""
        short_id = str(uuid.uuid4())[:8].upper()
        return f"KSJ-2026-{category.upper()}-{short_id}"

    async def _save_upload(self, file: UploadFile, prefix: str) -> Optional[str]:
        """Saves an uploaded file locally and returns the path."""
        if not file:
            return None
        
        upload_dir = "uploads/permissions"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        file_name = f"{prefix}_{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(upload_dir, file_name)
        
        async with aiofiles.open(file_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        return f"/{file_path}"

    async def create_request(self, requester_id: uuid.UUID, req: PermissionCreateReq, rc_file: UploadFile = None, dl_file: UploadFile = None, vehicle_photo: UploadFile = None) -> Permission:
        """User submits a new permission request."""
        vehicle = await self.vehicle_service.get_vehicle(req.vehicle_id)
        
        if vehicle.user_id != requester_id:
            raise PermissionDenied("You can only request permissions for your own vehicles.")
            
        if await self.vehicle_service.is_blacklisted(vehicle.id):
            raise InvalidStateTransition("Cannot request permission for a blacklisted vehicle.")

        stmt = select(Gate).where(Gate.id.in_(req.allowed_gate_ids))
        result = await self.session.execute(stmt)
        gates = result.scalars().all()
        if not gates:
            raise ResourceNotFound("None of the specified gates were found.")

        rc_url = await self._save_upload(rc_file, "rc")
        dl_url = await self._save_upload(dl_file, "dl")
        vehicle_photo_url = await self._save_upload(vehicle_photo, "photo")

        perm = Permission(
            permission_code=self._generate_code(vehicle.vehicle_category.value),
            requester_id=requester_id,
            allowed_gates=list(gates),
            rc_url=rc_url,
            dl_url=dl_url,
            vehicle_photo_url=vehicle_photo_url,
            **req.model_dump(exclude={"allowed_gate_ids", "rc_url", "dl_url", "vehicle_photo_url"})
        )
        self.session.add(perm)
        await self.session.commit()
        await self.session.refresh(perm)
        
        self.logger.info(f"Permission request {perm.permission_code} created by {requester_id}")
        return perm

    async def update_status(self, admin_id: uuid.UUID, perm_id: uuid.UUID, req: PermissionStatusUpdateReq) -> Permission:
        """Admin approves or rejects a request."""
        # Use row-level locking to prevent concurrent double approvals
        stmt = select(Permission).where(Permission.id == perm_id).with_for_update()
        result = await self.session.execute(stmt)
        perm = result.scalar_one_or_none()
        
        if not perm:
            raise ResourceNotFound("Permission request not found.")

        if perm.status != PermissionStatus.PENDING and req.status in [PermissionStatus.APPROVED, PermissionStatus.REJECTED]:
            raise InvalidStateTransition(f"Cannot transition from {perm.status.value} to {req.status.value}")

        old_status = perm.status
        perm.status = req.status
        perm.approved_by = admin_id
        if req.remarks:
            perm.admin_remarks = req.remarks

        await self.session.flush()
        
        await self.audit_service.record_action(
            user_id=admin_id,
            action="UPDATE_PERMISSION_STATUS",
            entity_type="Permission",
            entity_id=perm.id,
            old_state={"status": old_status.value},
            new_state={"status": perm.status.value, "remarks": req.remarks}
        )
        await self.session.commit()
        await self.session.refresh(perm)
        self.logger.info(f"Permission {perm.id} updated to {perm.status.value} by {admin_id}")
        return perm

    async def list_permissions(self, user_id: uuid.UUID, role: str, skip: int = 0, limit: int = 100) -> list[Permission]:
        """List permissions with role-based filtering and pagination."""
        stmt = select(Permission)
        from app.models.user import UserRole
        if role == UserRole.USER:
            stmt = stmt.where(Permission.requester_id == user_id)
        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_permission(self, perm_id: uuid.UUID) -> Permission:
        stmt = select(Permission).where(Permission.id == perm_id)
        result = await self.session.execute(stmt)
        perm = result.scalar_one_or_none()
        if not perm:
            raise ResourceNotFound("Permission not found.")
        return perm
