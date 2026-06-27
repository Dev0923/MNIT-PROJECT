import asyncio
import asyncpg

DATABASE_URL = "postgresql://neondb_owner:npg_Dt5XbLTpd3ZI@ep-steep-cell-ao1zlfol.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

async def migrate():
    try:
        conn = await asyncpg.connect(DATABASE_URL, timeout=60)
        await conn.execute('''
        CREATE TABLE IF NOT EXISTS khatu_user_activities (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES khatu_users(id) ON DELETE CASCADE,
            activity_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS ix_khatu_user_activities_user_id ON khatu_user_activities (user_id);
        ''')
        print("Migration successful")
        await conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

asyncio.run(migrate())
