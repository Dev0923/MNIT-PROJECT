import asyncio
from sqlalchemy import select
from datetime import datetime, timezone

from database import AsyncSessionLocal
from models.sql_models import User
from utils.password_handler import hash_password

async def bootstrap():
    print("Connecting to database...")
    # pyrefly: ignore [missing-import]
    from database import init_db
    await init_db()
    
    email = "admin@ksj.com"
    password = "AdminPassword123!"
    
    async with AsyncSessionLocal() as session:
        # Check if admin exists
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            print(f"Admin user {email} already exists.")
            return

        print("Creating admin user...")
        hashed_pw = hash_password(password)
        
        new_admin = User(
            email=email,
            password_hash=hashed_pw,
            is_admin=True,
            created_at=datetime.now(timezone.utc),
            last_login=datetime.now(timezone.utc)
        )
        
        session.add(new_admin)
        await session.commit()
        print(f"Successfully created SUPER_ADMIN:")
        print(f"Email: {email}")
        print(f"Password: {password}")

if __name__ == "__main__":
    asyncio.run(bootstrap())
