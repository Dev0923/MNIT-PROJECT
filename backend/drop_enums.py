import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from sqlalchemy import text

async def drop_enums():
    engine = create_async_engine(settings.DATABASE_URL, connect_args=settings.DB_CONNECT_ARGS)
    async with engine.begin() as conn:
        await conn.execute(text('DROP TYPE IF EXISTS userrole, vehicletype, vehiclecategory, permissionstatus, scandirection, logstatus CASCADE;'))
    await engine.dispose()
    print('Enums dropped successfully!')

if __name__ == "__main__":
    asyncio.run(drop_enums())
