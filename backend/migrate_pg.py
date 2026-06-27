import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_Dt5XbLTpd3ZI@ep-steep-cell-ao1zlfol.c-2.ap-southeast-1.aws.neon.tech/neondb?ssl=require"

async def migrate():
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE khatu_lost_persons ADD COLUMN user_id INTEGER REFERENCES khatu_users(id) ON DELETE SET NULL;"))
            print("Migration successful")
        except Exception as e:
            print(f"Migration failed: {e}")
    await engine.dispose()

asyncio.run(migrate())
