import asyncio
import asyncpg
import ssl

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

async def migrate():
    try:
        conn = await asyncpg.connect(
            host='ep-steep-cell-ao1zlfol.c-2.ap-southeast-1.aws.neon.tech',
            port=5432,
            user='neondb_owner',
            password='npg_Dt5XbLTpd3ZI',
            database='neondb',
            ssl=ssl_ctx,
            timeout=60
        )
        print('Connected!')
        await conn.execute('''
        CREATE TABLE IF NOT EXISTS khatu_user_activities (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES khatu_users(id) ON DELETE CASCADE,
            activity_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ''')
        try:
            await conn.execute('CREATE INDEX IF NOT EXISTS ix_khatu_user_activities_user_id ON khatu_user_activities (user_id);')
        except Exception as e:
            print(f'Index warning: {e}')
        print('Migration successful')
        await conn.close()
    except Exception as e:
        print(f'Migration failed: {type(e).__name__}: {e}')

asyncio.run(migrate())
