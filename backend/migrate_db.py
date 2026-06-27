import asyncio
from database import engine
from sqlalchemy import text

async def migrate():
    async with engine.connect() as conn:
        is_sqlite = conn.dialect.name == "sqlite"

        # Alter khatu_users table
        try:
            if is_sqlite:
                await conn.execute(text("ALTER TABLE khatu_users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL"))
            else:
                await conn.execute(text("ALTER TABLE khatu_users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL"))
            await conn.commit()
            print("Successfully added is_admin column to khatu_users table.")
        except Exception as e:
            if is_sqlite and "duplicate column name" in str(e).lower():
                print("is_admin column already exists.")
            else:
                print("Failed to add is_admin column:", e)

        # Alter khatu_support_queries table - status
        try:
            if is_sqlite:
                await conn.execute(text("ALTER TABLE khatu_support_queries ADD COLUMN status VARCHAR(50) DEFAULT 'open' NOT NULL"))
            else:
                await conn.execute(text("ALTER TABLE khatu_support_queries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'open' NOT NULL"))
            await conn.commit()
            print("Successfully added status column to khatu_support_queries table.")
        except Exception as e:
            if is_sqlite and "duplicate column name" in str(e).lower():
                print("status column already exists.")
            else:
                print("Failed to add status column:", e)

        # Alter khatu_support_queries table - admin_reply
        try:
            if is_sqlite:
                await conn.execute(text("ALTER TABLE khatu_support_queries ADD COLUMN admin_reply TEXT"))
            else:
                await conn.execute(text("ALTER TABLE khatu_support_queries ADD COLUMN IF NOT EXISTS admin_reply TEXT"))
            await conn.commit()
            print("Successfully added admin_reply column to khatu_support_queries table.")
        except Exception as e:
            if is_sqlite and "duplicate column name" in str(e).lower():
                print("admin_reply column already exists.")
            else:
                print("Failed to add admin_reply column:", e)

        # Alter khatu_gallery_items table - category
        try:
            if is_sqlite:
                await conn.execute(text("ALTER TABLE khatu_gallery_items ADD COLUMN category VARCHAR(100)"))
            else:
                await conn.execute(text("ALTER TABLE khatu_gallery_items ADD COLUMN IF NOT EXISTS category VARCHAR(100)"))
            await conn.commit()
            print("Successfully added category column to khatu_gallery_items table.")
        except Exception as e:
            if is_sqlite and "duplicate column name" in str(e).lower():
                print("category column already exists.")
            else:
                print("Failed to add category column:", e)

        # Alter khatu_gallery_items table - photographer
        try:
            if is_sqlite:
                await conn.execute(text("ALTER TABLE khatu_gallery_items ADD COLUMN photographer VARCHAR(255)"))
            else:
                await conn.execute(text("ALTER TABLE khatu_gallery_items ADD COLUMN IF NOT EXISTS photographer VARCHAR(255)"))
            await conn.commit()
            print("Successfully added photographer column to khatu_gallery_items table.")
        except Exception as e:
            if is_sqlite and "duplicate column name" in str(e).lower():
                print("photographer column already exists.")
            else:
                print("Failed to add photographer column:", e)

if __name__ == "__main__":
    asyncio.run(migrate())

