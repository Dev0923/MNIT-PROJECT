import asyncio
import ssl
from backend.database import init_db

async def test():
    print("Initializing database...")
    await init_db()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(test())
