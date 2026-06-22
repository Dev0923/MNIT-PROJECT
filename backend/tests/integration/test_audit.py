import pytest
from httpx import AsyncClient
from sqlalchemy.future import select
from app.models.vehicle_permission import AuditLog

@pytest.mark.asyncio
async def test_login_audit_trail(async_client: AsyncClient, regular_user, db_session):
    # Perform login
    await async_client.post("/api/v1/auth/login", data={"username": "user@test.com", "password": "password123"})
    
    # Verify audit log
    stmt = select(AuditLog).where(AuditLog.action == "LOGIN_SUCCESS")
    result = await db_session.execute(stmt)
    logs = result.scalars().all()
    assert len(logs) >= 1
    assert logs[0].user_id == regular_user.id
