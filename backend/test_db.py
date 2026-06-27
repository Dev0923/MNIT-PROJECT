import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
from models.sql_models import User
from utils.jwt_handler import create_access_token
import urllib.request
import json

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("No users found in database.")
            return

        token = create_access_token(str(user.id))
        print("Got token for user:", user.id)
        
        req = urllib.request.Request('http://localhost:8000/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
        try:
            with urllib.request.urlopen(req) as response:
                print('Profile:', response.status)
                print("Success")
        except urllib.error.HTTPError as e:
            print('Profile:', e.code)
            print(e.read().decode())
        except Exception as e:
            print('Error:', e)

asyncio.run(main())
