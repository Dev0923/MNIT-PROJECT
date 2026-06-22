import jwt
import logging
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from redis.exceptions import RedisError

from app.models.vehicle_permission import Permission
from app.models.enums import LogStatus, ScanDirection
from app.schemas.vehicle_permission import ScanVerifyRes, VehicleRes
from app.core.exceptions import QRValidationException
from app.core.config import settings
from app.services.permission_service import PermissionService
from app.services.vehicle_service import VehicleService
from app.services.entry_log_service import EntryLogService

class QRService:
    """Service handling QR generation and scanning workflows."""

    def __init__(
        self, 
        session: AsyncSession, 
        permission_service: PermissionService, 
        vehicle_service: VehicleService,
        entry_log_service: EntryLogService,
        redis_client: Optional[redis.Redis] = None,
        request_id: Optional[str] = None
    ):
        self.session = session
        self.permission_service = permission_service
        self.vehicle_service = vehicle_service
        self.entry_log_service = entry_log_service
        self.redis_client = redis_client
        self.logger = logging.LoggerAdapter(logging.getLogger(__name__), extra={"request_id": request_id or "N/A"})

    def generate_qr_token(self, permission: Permission) -> str:
        """Generate a signed JWT token serving as the QR payload."""
        payload = {
            "sub": str(permission.id),
            "jti": str(permission.permission_code),
            "exp": int(permission.valid_until.timestamp())
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    async def _check_cooldown(self, perm_id: UUID, gate_id: UUID) -> bool:
        """
        Uses Redis atomic SET NX EX to verify if a scan is a duplicate.
        Returns True if duplicate (cooldown active), False if fresh scan.
        If Redis is unavailable, logs a warning and fails OPEN (returns False)
        so gates are not blocked, prioritizing physical throughput over strict deduplication.
        """
        if not self.redis_client:
            self.logger.warning("Redis client not injected. Skipping cooldown check.")
            return False

        key = f"scan:{perm_id}:{gate_id}"
        try:
            # SET if Not eXists, EXpire in 30 seconds
            acquired = await self.redis_client.set(key, "1", ex=30, nx=True)
            return not acquired # If not acquired, it already exists, so it's a duplicate
        except RedisError as e:
            self.logger.error(f"Redis unavailable for cooldown check: {e}")
            return False # Fail open

    async def verify_scan(self, guard_id: UUID, qr_token: str, gate_id: UUID, direction: ScanDirection) -> ScanVerifyRes:
        """Execute the complete QR verification workflow, ensuring all attempts are committed."""
        try:
            # 1. Decode Token
            payload = jwt.decode(qr_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            perm_id = UUID(payload.get("sub"))
        except jwt.ExpiredSignatureError:
            raise QRValidationException("QR token has expired cryptographically.")
        except jwt.PyJWTError:
            raise QRValidationException("Invalid QR token signature.")

        # Centralized exit to guarantee commit on both success and failure
        async def _log_and_return(is_allowed: bool, status: LogStatus, msg: str, vehicle=None) -> ScanVerifyRes:
            await self.entry_log_service.log_scan(gate_id, guard_id, direction, status, perm_id)
            # Transaction Strategy: We commit immediately to persist the EntryLog,
            # regardless of whether the scan was allowed or denied.
            await self.session.commit()
            self.logger.info(f"Scan {status.value}: Perm {perm_id} at Gate {gate_id}. Msg: {msg}")
            v_info = VehicleRes.model_validate(vehicle) if vehicle else None
            return ScanVerifyRes(is_allowed=is_allowed, status=status, vehicle_info=v_info, message=msg)

        # 2. Cooldown Check
        is_duplicate = await self._check_cooldown(perm_id, gate_id)
        if is_duplicate:
            return await _log_and_return(False, LogStatus.DUPLICATE_SCAN, "Duplicate scan detected. Please wait 30 seconds.")

        # 3. DB Fetch
        try:
            perm = await self.permission_service.get_permission(perm_id)
            vehicle = perm.vehicle
        except Exception:
            raise QRValidationException("Permission record not found.")

        # Verify token exact match (prevents using revoked/re-issued but cryptographically valid tokens)
        if qr_token != perm.qr_token:
            return await _log_and_return(False, LogStatus.DENIED_REVOKED, "QR token is invalid or has been revoked.", vehicle)

        # 4. Blacklist Check
        if await self.vehicle_service.is_blacklisted(vehicle.id):
            return await _log_and_return(False, LogStatus.BLACKLISTED, "Vehicle is blacklisted.", vehicle)

        # 5. Validity Checks
        now = datetime.now(timezone.utc)
        if not (perm.valid_from <= now <= perm.valid_until):
            return await _log_and_return(False, LogStatus.DENIED_EXPIRED, "Permission is expired or not yet valid.", vehicle)

        if perm.status.value != "APPROVED":
            return await _log_and_return(False, LogStatus.DENIED_REVOKED, "Permission is not active/approved.", vehicle)

        allowed_gate_ids = [g.id for g in perm.allowed_gates]
        if gate_id not in allowed_gate_ids:
            return await _log_and_return(False, LogStatus.DENIED_INVALID_GATE, "Vehicle is not allowed at this gate.", vehicle)

        # 6. Success
        return await _log_and_return(True, LogStatus.SUCCESS, "Entry granted.", vehicle)

    async def issue_qr_for_permission(self, permission_id: UUID, current_user_id: UUID, role: str) -> str:
        """Validates ownership and issues a QR token for an approved permission."""
        from app.models.user import UserRole
        from app.models.enums import PermissionStatus
        from app.core.exceptions import PermissionDenied, InvalidStateTransition
        
        perm = await self.permission_service.get_permission(permission_id)
        if role == UserRole.USER and perm.requester_id != current_user_id:
            raise PermissionDenied("Not authorized to access this QR code.")
        
        if perm.status != PermissionStatus.APPROVED:
            raise InvalidStateTransition("Permission is not approved.")

        # Generate token if it doesn't exist natively
        if not perm.qr_token:
            token = self.generate_qr_token(perm)
            perm.qr_token = token
            await self.session.commit()
        
        return perm.qr_token
