import pytest
import pytest_asyncio
import fakeredis.aioredis
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from main import app
from app.api.dependencies import get_db_session, get_redis_client
from app.db.base import Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash, create_access_token
from app.models.vehicle_permission import Gate

# Test database URL (PostgreSQL)
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/test_db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        yield session
        # rollback to keep tests clean
        await session.rollback()

@pytest_asyncio.fixture
async def redis_client():
    client = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield client
    await client.flushall()
    await client.aclose()

@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession, redis_client: fakeredis.aioredis.FakeRedis) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session
        
    async def override_get_redis():
        yield redis_client

    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_redis_client] = override_get_redis

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()

# --- User Factories ---
@pytest_asyncio.fixture
async def user_factory(db_session: AsyncSession):
    async def _factory(email: str, role: UserRole) -> User:
        user = User(
            email=email,
            hashed_password=get_password_hash("password123"),
            full_name=f"Test {role.value}",
            role=role,
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user
    return _factory

@pytest_asyncio.fixture
async def regular_user(user_factory):
    return await user_factory("user@test.com", UserRole.USER)

@pytest_asyncio.fixture
async def operator_user(user_factory):
    return await user_factory("operator@test.com", UserRole.OPERATOR)

@pytest_asyncio.fixture
async def admin_user(user_factory):
    return await user_factory("admin@test.com", UserRole.ADMIN)

@pytest_asyncio.fixture
async def superadmin_user(user_factory):
    return await user_factory("superadmin@test.com", UserRole.SUPER_ADMIN)

# --- Auth Header Factories ---
@pytest.fixture
def auth_headers():
    def _factory(user: User):
        token = create_access_token(str(user.id), "test-jti", {"role": user.role.value})
        return {"Authorization": f"Bearer {token}"}
    return _factory

@pytest_asyncio.fixture
async def test_gate(db_session: AsyncSession):
    gate = Gate(name="North Gate", description="Main Entrance", max_vehicles_per_hour=100)
    db_session.add(gate)
    await db_session.commit()
    await db_session.refresh(gate)
    return gate
