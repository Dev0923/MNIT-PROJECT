import logging
from uuid import UUID
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.vehicle_permission import AuditLog

logger = logging.getLogger(__name__)

class AuditService:
    """Service for recording immutable audit logs."""
    
    def __init__(self, session: AsyncSession):
        self.session = session

    async def record_action(
        self,
        user_id: UUID,
        action: str,
        entity_type: str,
        entity_id: UUID,
        old_state: Optional[Dict[str, Any]] = None,
        new_state: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Record a state change or sensitive action into the audit_logs table.
        Uses the active transaction, so it commits along with the primary operation.
        """
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_state=old_state,
            new_state=new_state,
        )
        self.session.add(log_entry)
        # Flush to get the ID if needed, but usually commit is handled by caller
        await self.session.flush()
        
        logger.info(f"Audit: User {user_id} performed {action} on {entity_type} {entity_id}")
        return log_entry
