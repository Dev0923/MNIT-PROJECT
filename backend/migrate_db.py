import asyncio
from database import engine
from sqlalchemy import text

async def migrate():
    async with engine.connect() as conn:
        # Alter khatu_users table
        try:
            await conn.execute(text("ALTER TABLE khatu_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL"))
            await conn.commit()
            print("Successfully added is_admin column to khatu_users table.")
        except Exception as e:
            print("Failed to add is_admin column:", e)

        # Alter khatu_support_queries table - status
        try:
            await conn.execute(text("ALTER TABLE khatu_support_queries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open' NOT NULL"))
            await conn.commit()
            print("Successfully added status column to khatu_support_queries table.")
        except Exception as e:
            print("Failed to add status column:", e)

        # Alter khatu_support_queries table - admin_reply
        try:
            await conn.execute(text("ALTER TABLE khatu_support_queries ADD COLUMN IF NOT EXISTS admin_reply TEXT"))
            await conn.commit()
            print("Successfully added admin_reply column to khatu_support_queries table.")
        except Exception as e:
            print("Failed to add admin_reply column:", e)

if __name__ == "__main__":
    asyncio.run(migrate())
