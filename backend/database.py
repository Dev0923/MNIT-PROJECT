"""
Async PostgreSQL connection using SQLAlchemy and asyncpg.
"""

import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from .config import settings

# ── Prepare database URL and connection args for asyncpg ────────────
db_url = settings.database_url
connect_args: dict = {}

if "sslmode" in db_url or "neon.tech" in db_url:
    # asyncpg does not understand ?sslmode=require — strip query params
    if "?" in db_url:
        db_url = db_url.split("?", 1)[0]

    # Create a permissive SSL context for cloud-hosted databases (Neon, Supabase, etc.)
    ssl_ctx = ssl.create_default_context()
    ssl_ctx.check_hostname = False
    ssl_ctx.verify_mode = ssl.CERT_NONE
    connect_args["ssl"] = ssl_ctx

    # Increase connect timeout for remote databases (default 60s is sometimes too low for cold starts)
    connect_args["timeout"] = 120          # asyncpg connect-level timeout
    connect_args["command_timeout"] = 60   # per-statement timeout


# ── Create async database engine ────────────────────────────────────
engine_kwargs = {
    "echo": False,
    "future": True,
    "pool_recycle": 300,
    "pool_pre_ping": True,
    "connect_args": connect_args,
}

if "sqlite" not in db_url:
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 10,
        "pool_timeout": 30,
    })

engine = create_async_engine(db_url, **engine_kwargs)


# ── Async session factory ───────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Initialize database: create tables if they do not exist."""
    from .models.sql_models import Base
    try:
        async with engine.begin() as conn:
            # Create all tables defined on the Base metadata
            await conn.run_sync(Base.metadata.create_all)
        print("[OK] PostgreSQL database tables initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to initialize database: {e}")
        print("   The server will start but database operations will fail until connectivity is restored.")
        # Re-raise so the lifespan handler knows startup failed
        raise


async def get_db():
    """FastAPI dependency yielding an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
