import logging
import uuid
from typing import Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import redis.asyncio as redis
from redis.exceptions import RedisError

from app.models.user import User
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, AuthenticationError, DUMMY_PASSWORD_HASH
from app.core.exceptions import AppError
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

class AccountLockedException(AppError):
    def __init__(self, message: str = "Account temporarily locked due to multiple failed login attempts."):
        super().__init__(message, code="ACCOUNT_LOCKED")

class AuthService:
    """Service handling user authentication, lockouts, and token revocation."""

    def __init__(self, session: AsyncSession, redis_client: redis.Redis, audit_service: AuditService):
        self.session = session
        self.redis_client = redis_client
        self.audit_service = audit_service
        
    async def _handle_failed_login(self, email: str, user: Optional[User] = None):
        """Increments failure counter and applies lockout if necessary."""
        fail_key = f"auth:fails:{email}"
        lock_key = f"auth:lock:{email}"
        
        # Log Audit failure
        if user:
            await self.audit_service.record_action(user.id, "LOGIN_FAILURE", "User", user.id)
            await self.session.commit()

        try:
            fails = await self.redis_client.incr(fail_key)
            if fails == 1:
                await self.redis_client.expire(fail_key, 900)

            if fails >= 5:
                await self.redis_client.set(lock_key, "1", ex=900)
                await self.redis_client.delete(fail_key)
                
                logger.warning(f"Account lockout triggered for {email}")
                if user:
                    await self.audit_service.record_action(
                        user_id=user.id, action="ACCOUNT_LOCKOUT", entity_type="User", entity_id=user.id,
                        new_state={"reason": "5 failed login attempts"}
                    )
                    await self.session.commit()
        except RedisError as e:
            logger.critical(f"SECURITY ALERT: Redis unavailable during failed login tracking. Brute force protection disabled. {e}")

    async def authenticate_user(self, email: str, password: str) -> Tuple[str, str]:
        """Authenticates a user and returns tokens. Prevents timing attacks and checks lockouts."""
        lock_key = f"auth:lock:{email}"
        
        try:
            if await self.redis_client.get(lock_key):
                raise AccountLockedException()
        except RedisError as e:
            logger.critical(f"SECURITY ALERT: Redis unavailable during lockout check. Failing open. {e}")

        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()

        is_authenticated = False
        if user and user.is_active:
            is_authenticated = verify_password(password, user.hashed_password)
        else:
            # Execute dummy hash to prevent timing attacks
            verify_password(password, DUMMY_PASSWORD_HASH)

        if not is_authenticated:
            await self._handle_failed_login(email, user)
            raise AuthenticationError("Incorrect email or password")

        # Clear failures
        try:
            await self.redis_client.delete(f"auth:fails:{email}")
        except RedisError:
            pass

        # Audit Success
        await self.audit_service.record_action(user.id, "LOGIN_SUCCESS", "User", user.id)
        await self.session.commit()

        # Tokens
        access_jti = str(uuid.uuid4())
        access_token = create_access_token(subject=str(user.id), jti=access_jti, additional_claims={"role": user.role.value})
        refresh_jti = str(uuid.uuid4())
        refresh_token = create_refresh_token(subject=str(user.id), jti=refresh_jti)
        
        return access_token, refresh_token

    async def revoke_token(self, jti: str, exp: int):
        """Adds a token's JTI to the Redis blacklist."""
        now = datetime.now(timezone.utc).timestamp()
        ttl = int(exp - now)
        if ttl > 0:
            try:
                await self.redis_client.set(f"auth:blacklist:{jti}", "1", ex=ttl)
            except RedisError as e:
                logger.critical(f"SECURITY ALERT: Failed to blacklist token. Redis down. {e}")

    async def is_token_revoked(self, jti: str) -> bool:
        """Checks if a token is blacklisted. Fails closed on error."""
        try:
            return bool(await self.redis_client.get(f"auth:blacklist:{jti}"))
        except RedisError as e:
            logger.critical(f"SECURITY ALERT: Redis unavailable during revocation check. Failing closed. {e}")
            raise AppError("Authentication system unavailable.", code="AUTH_SERVICE_UNAVAILABLE")

    async def refresh_tokens(self, refresh_token: str) -> Tuple[str, str]:
        """Validates refresh token securely and issues new pair."""
        payload = decode_token(refresh_token, expected_type="refresh")
        jti = payload.get("jti")
        exp = payload.get("exp")
        
        now = datetime.now(timezone.utc).timestamp()
        ttl = int(exp - now)
        if ttl <= 0:
            raise AuthenticationError("Refresh token expired.")

        # Revocation check (Fails closed)
        if await self.is_token_revoked(jti):
            raise AuthenticationError("Refresh token has been revoked.")

        # Replay Protection (Atomic SET NX)
        try:
            acquired = await self.redis_client.set(f"auth:used_refresh:{jti}", "1", ex=ttl, nx=True)
            if not acquired:
                logger.warning(f"SECURITY ALERT: Replay attack detected for refresh token JTI: {jti}")
                raise AuthenticationError("Refresh token has already been consumed.")
        except RedisError as e:
            logger.critical(f"SECURITY ALERT: Redis down during refresh consumption. Failing closed. {e}")
            raise AuthenticationError("Authentication system unavailable.")

        user_id = payload.get("sub")
        stmt = select(User).where(User.id == uuid.UUID(user_id))
        result = await self.session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise AuthenticationError("User is inactive or deleted.")

        await self.audit_service.record_action(user.id, "TOKEN_REFRESH", "User", user.id)
        await self.session.commit()

        # Issue new pair
        access_jti = str(uuid.uuid4())
        access_token = create_access_token(subject=str(user.id), jti=access_jti, additional_claims={"role": user.role.value})
        new_jti = str(uuid.uuid4())
        new_refresh_token = create_refresh_token(subject=str(user.id), jti=new_jti)

        return access_token, new_refresh_token
