import logging
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vehicle_permission import EntryLog
from app.models.enums import ScanDirection, LogStatus
from app.schemas.vehicle_permission import ScanOverrideReq
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

class EntryLogService:
    """Service for logging physical gate entries and overrides."""
    
    def __init__(self, session: AsyncSession, audit_service: AuditService):
        self.session = session
        self.audit_service = audit_service

    async def log_scan(
        self,
        gate_id: UUID,
        scanned_by: UUID,
        direction: ScanDirection,
        status: LogStatus,
        permission_id: Optional[UUID] = None,
        remarks: Optional[str] = None
    ) -> EntryLog:
        """Records a standard QR scan attempt."""
        entry = EntryLog(
            permission_id=permission_id,
            gate_id=gate_id,
            scanned_by=scanned_by,
            direction=direction,
            status=status,
            remarks=remarks
        )
        self.session.add(entry)
        await self.session.flush()
        
        logger.info(f"Scan Log: Gate {gate_id}, Perm {permission_id}, Status {status.value}")
        return entry

    async def log_override(
        self,
        override_data: ScanOverrideReq,
        guard_id: UUID,
        admin_id: UUID
    ) -> EntryLog:
        """
        Records a manual override granted by an admin/supervisor.
        Automatically invokes AuditService.
        """
        entry = EntryLog(
            permission_id=override_data.permission_id,
            gate_id=override_data.gate_id,
            scanned_by=guard_id,
            direction=override_data.direction,
            status=LogStatus.OVERRIDE_GRANTED,
            override_by=admin_id,
            override_reason=override_data.override_reason
        )
        self.session.add(entry)
        await self.session.flush()

        await self.audit_service.record_action(
            user_id=admin_id,
            action="MANUAL_SCAN_OVERRIDE",
            entity_type="EntryLog",
            entity_id=entry.id,
            new_state={"reason": override_data.override_reason, "gate_id": str(override_data.gate_id)}
        )

        logger.warning(f"Override Granted: Perm {override_data.permission_id} by Admin {admin_id}")
        return entry
