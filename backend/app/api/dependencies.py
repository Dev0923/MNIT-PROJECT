from typing import Generator, AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from uuid import UUID

from app.core.exceptions import AppError
from app.core.security import AuthenticationError
from app.core.security import decode_token
from app.core.config import settings
from app.models.user import User, UserRole
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService

from app.services.vehicle_service import VehicleService
from app.services.permission_service import PermissionService
from app.services.entry_log_service import EntryLogService
from app.services.qr_service import QRService
from app.services.gate_service import GateService

# --- DB & Redis Dependencies ---
from app.db.session import async_session

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

import fakeredis.aioredis
from redis.exceptions import ConnectionError

async def get_redis_client() -> AsyncGenerator[redis.Redis, None]:
    client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    try:
        # Attempt to ping the real Redis server
        await client.ping()
        yield client
    except ConnectionError:
        # Fallback to in-memory FakeRedis if Docker/Redis is offline
        import logging
        logging.getLogger(__name__).warning("Real Redis unavailable. Falling back to in-memory FakeRedis.")
        fake_client = fakeredis.aioredis.FakeRedis(decode_responses=True)
        yield fake_client
    finally:
        await client.aclose()

# --- Service Dependencies ---
def get_audit_service(session: AsyncSession = Depends(get_db_session)) -> AuditService:
    return AuditService(session)

def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
    redis_client: redis.Redis = Depends(get_redis_client),
    audit_service: AuditService = Depends(get_audit_service)
) -> AuthService:
    return AuthService(session, redis_client, audit_service)

def get_vehicle_service(
    session: AsyncSession = Depends(get_db_session),
    audit_service: AuditService = Depends(get_audit_service)
) -> VehicleService:
    return VehicleService(session, audit_service)

def get_permission_service(
    session: AsyncSession = Depends(get_db_session),
    audit_service: AuditService = Depends(get_audit_service),
    vehicle_service: VehicleService = Depends(get_vehicle_service)
) -> PermissionService:
    return PermissionService(session, audit_service, vehicle_service)

def get_entry_log_service(
    session: AsyncSession = Depends(get_db_session),
    audit_service: AuditService = Depends(get_audit_service)
) -> EntryLogService:
    return EntryLogService(session, audit_service)

def get_qr_service(
    session: AsyncSession = Depends(get_db_session),
    permission_service: PermissionService = Depends(get_permission_service),
    vehicle_service: VehicleService = Depends(get_vehicle_service),
    entry_log_service: EntryLogService = Depends(get_entry_log_service),
    redis_client: redis.Redis = Depends(get_redis_client)
) -> QRService:
    return QRService(session, permission_service, vehicle_service, entry_log_service, redis_client)

def get_gate_service(
    session: AsyncSession = Depends(get_db_session)
) -> GateService:
    return GateService(session)

# --- Auth Dependencies ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """Validates the token and retrieves the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # decode_token strictly enforces expected_type="access" by default
        payload = decode_token(token)
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
            
        # Optional: check if token was revoked
        jti = payload.get("jti")
        if jti and await auth_service.is_token_revoked(jti):
            raise credentials_exception

    except AuthenticationError:
        raise credentials_exception

    # Fetch User
    from sqlalchemy.future import select
    stmt = select(User).where(User.id == UUID(user_id_str))
    result = await auth_service.session.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status_code=403, detail="User is inactive or deleted.")
        
    return user


class RoleChecker:
    """Dependency class to enforce RBAC."""
    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {[r.value for r in self.allowed_roles]}"
            )
        return user

# Pre-configured role guards
require_super_admin = RoleChecker([UserRole.SUPER_ADMIN])
require_admin = RoleChecker([UserRole.SUPER_ADMIN, UserRole.ADMIN])
require_operator = RoleChecker([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR])
