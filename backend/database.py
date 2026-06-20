"""
Async MongoDB connection using motor.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    """Connect to MongoDB on app startup."""
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.mongodb_db_name]

    # Create indexes
    await db.otps.create_index("expires_at", expireAfterSeconds=0)  # TTL index
    await db.otps.create_index("identifier")
    await db.users.create_index("phone", sparse=True, unique=True)
    await db.users.create_index("email", sparse=True, unique=True)

    print(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")


async def disconnect_from_mongo():
    """Disconnect from MongoDB on app shutdown."""
    global client
    if client:
        client.close()
        print("🔌 Disconnected from MongoDB")


def get_db():
    """Get database instance."""
    return db
