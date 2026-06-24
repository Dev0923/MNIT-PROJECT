"""
Async PostgreSQL connection using SQLAlchemy and asyncpg.
"""

import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from config import settings

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


async def seed_data():
    """Seed initial mock records if database tables are empty."""
    from .models.sql_models import Donation, Vehicle, VehiclePermission, SupportQuery, GeneralPermission, Booking
    from sqlalchemy.future import select
    from datetime import datetime, timedelta, timezone

    async with AsyncSessionLocal() as session:
        try:
            # 1. Donations
            res_donations = await session.execute(select(Donation).limit(1))
            if not res_donations.scalar_one_or_none():
                donations = [
                    Donation(donation_id="DON001", fullName="Ramesh Sharma", mobile="9876543210", purpose="Temple Maintenance", amount=5001.0, want80G=True, panCard="ABCDE1234F", created_at=datetime.now(timezone.utc) - timedelta(days=2)),
                    Donation(donation_id="DON002", fullName="Priya Agarwal", mobile="9123456789", purpose="Annadaan (Food Seva)", amount=1001.0, want80G=False, created_at=datetime.now(timezone.utc) - timedelta(days=2)),
                    Donation(donation_id="DON003", fullName="Suresh Gupta", mobile="9988776655", purpose="Special Puja & Havan", amount=11000.0, want80G=True, panCard="XYZAB5678G", created_at=datetime.now(timezone.utc) - timedelta(days=3)),
                    Donation(donation_id="DON004", fullName="Meena Verma", mobile="9567890123", purpose="Gau Seva", amount=501.0, want80G=False, created_at=datetime.now(timezone.utc) - timedelta(days=3)),
                    Donation(donation_id="DON005", fullName="Anil Kumar", mobile="9765432109", purpose="Education Fund", amount=2100.0, want80G=True, panCard="ANILK1234P", created_at=datetime.now(timezone.utc) - timedelta(days=4)),
                ]
                session.add_all(donations)

            # 2. General Permissions
            res_permissions = await session.execute(select(GeneralPermission).limit(1))
            if not res_permissions.scalar_one_or_none():
                permissions = [
                    GeneralPermission(permission_code="BAN001", name="Mahesh Trust", type="Bandhara", subtype="Community", purpose="Langar Ekadashi", date="21 Jun 2026", status="pending"),
                    GeneralPermission(permission_code="MED001", name="Dr. A. Sharma", type="Medical", subtype="Health Camp", purpose="Free OPD", date="20 Jun 2026", status="approved"),
                    GeneralPermission(permission_code="OTH001", name="Shyam Sena", type="Other", subtype="Stall", purpose="Prasad Stall", date="19 Jun 2026", status="pending"),
                    GeneralPermission(permission_code="BAN002", name="Agarwal Parivar", type="Bandhara", subtype="Family", purpose="Bhandara Seva", date="18 Jun 2026", status="approved"),
                ]
                session.add_all(permissions)

            # 3. Support Queries
            res_support = await session.execute(select(SupportQuery).limit(1))
            if not res_support.scalar_one_or_none():
                queries = [
                    SupportQuery(name="Rohit Jain", email="rohit@gmail.com", subject="E-Pass not received", message="I booked an E-Pass on 18th June but haven't received the confirmation email yet. Please help.", created_at=datetime.now(timezone.utc) - timedelta(days=2)),
                    SupportQuery(name="Seema Agarwal", email="seema@yahoo.com", subject="Donation refund request", message="Payment deducted but booking failed on 19th June. Transaction ref: 98765. Please process refund.", created_at=datetime.now(timezone.utc) - timedelta(days=3)),
                    SupportQuery(name="Amit Sharma", email="amit@gmail.com", subject="Vehicle permit rejected", message="My vehicle permit VEH003 was rejected. I am a registered devotee travelling from Madhya Pradesh.", created_at=datetime.now(timezone.utc) - timedelta(days=3)),
                    SupportQuery(name="Nisha Gupta", email="nisha@outlook.com", subject="80G certificate pending", message="I donated ₹11,000 on 16 June. The 80G certificate has not arrived in my email (XYZAB5678G).", created_at=datetime.now(timezone.utc) - timedelta(days=4)),
                ]
                session.add_all(queries)

            # 4. Vehicles & Permits
            res_veh_perm = await session.execute(select(VehiclePermission).limit(1))
            if not res_veh_perm.scalar_one_or_none():
                v1 = Vehicle(plate_number="RJ14AB1234", vehicle_type="Car", model="Swift", created_at=datetime.now(timezone.utc) - timedelta(days=2))
                v2 = Vehicle(plate_number="RJ21CD5678", vehicle_type="Bus", model="Tata LPO", created_at=datetime.now(timezone.utc) - timedelta(days=2))
                v3 = Vehicle(plate_number="MP09EF9012", vehicle_type="Car", model="Hyundai Creta", created_at=datetime.now(timezone.utc) - timedelta(days=2))
                v4 = Vehicle(plate_number="UP32GH3456", vehicle_type="Tempo", model="Force Traveller", created_at=datetime.now(timezone.utc) - timedelta(days=2))
                session.add_all([v1, v2, v3, v4])
                await session.flush()

                p1 = VehiclePermission(vehicle_id=v1.id, permit_type="Visitor Pass", status="Pending", valid_from=datetime.now(timezone.utc), valid_to=datetime.now(timezone.utc) + timedelta(days=1), allowed_zones=["Zone A"], created_at=datetime.now(timezone.utc) - timedelta(hours=5))
                p2 = VehiclePermission(vehicle_id=v2.id, permit_type="Group Pass", status="Approved", valid_from=datetime.now(timezone.utc), valid_to=datetime.now(timezone.utc) + timedelta(days=1), allowed_zones=["Zone A", "Zone B"], created_at=datetime.now(timezone.utc) - timedelta(hours=10))
                p3 = VehiclePermission(vehicle_id=v3.id, permit_type="Visitor Pass", status="Denied", valid_from=datetime.now(timezone.utc), valid_to=datetime.now(timezone.utc) + timedelta(days=1), allowed_zones=["Zone A"], created_at=datetime.now(timezone.utc) - timedelta(hours=15))
                p4 = VehiclePermission(vehicle_id=v4.id, permit_type="Visitor Pass", status="Pending", valid_from=datetime.now(timezone.utc), valid_to=datetime.now(timezone.utc) + timedelta(days=1), allowed_zones=["Zone B"], created_at=datetime.now(timezone.utc) - timedelta(hours=20))
                session.add_all([p1, p2, p3, p4])

            # 5. Bookings
            res_bookings = await session.execute(select(Booking).limit(1))
            if not res_bookings.scalar_one_or_none():
                b1 = Booking(booking_id="KSJ-EP001", booking_type="individual", date=datetime.now(timezone.utc) + timedelta(hours=2), phone="9876543210", city="Jaipur", individual_details={"name": "Ramesh Sharma", "age": 45}, created_at=datetime.now(timezone.utc) - timedelta(days=1))
                b2 = Booking(booking_id="KSJ-EP002", booking_type="individual", date=datetime.now(timezone.utc) + timedelta(hours=4), phone="9765432100", city="Delhi", individual_details={"name": "Priya Gupta", "age": 32}, created_at=datetime.now(timezone.utc) - timedelta(days=1))
                b3 = Booking(booking_id="KSJ-EP003", booking_type="individual", date=datetime.now(timezone.utc) - timedelta(hours=2), phone="9654321000", city="Gurgaon", individual_details={"name": "Suresh Verma", "age": 55}, created_at=datetime.now(timezone.utc) - timedelta(days=1))
                session.add_all([b1, b2, b3])

            await session.commit()
        except Exception as e:
            await session.rollback()
            print(f"[WARNING] Failed to seed database: {e}")


async def init_db():
    """Initialize database: create tables if they do not exist."""
    from models.sql_models import Base
    try:
        async with engine.begin() as conn:
            # Create all tables defined on the Base metadata
            await conn.run_sync(Base.metadata.create_all)
        print("[OK] PostgreSQL database tables initialized successfully.")
        
        # Seed the data
        await seed_data()
        print("[OK] Seeding completed.")
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
