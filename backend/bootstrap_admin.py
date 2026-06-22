import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select

from app.core.config import settings
from app.models.user import User, UserRole
from app.core.security import get_password_hash

async def bootstrap():
    print("Connecting to database...")
    engine = create_async_engine(settings.DATABASE_URL, connect_args=settings.DB_CONNECT_ARGS)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    email = "superadmin@ksj.com"
    password = "SuperSecretPassword123!"
    
    async with async_session() as session:
        # Check if admin exists
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            print(f"Admin user {email} already exists.")
            return

        print("Creating SUPER_ADMIN user...")
        hashed_pw = get_password_hash(password)
        
        new_admin = User(
            email=email,
            hashed_password=hashed_pw,
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        
        session.add(new_admin)
        await session.commit()
        print(f"Successfully created SUPER_ADMIN:")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(bootstrap())
