"""Quick script to inspect existing Neon database schema."""
import asyncio
import ssl
import asyncpg

async def main():
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    conn = await asyncpg.connect(
        "postgresql://neondb_owner:npg_Dt5XbLTpd3ZI@ep-steep-cell-ao1zlfol.c-2.ap-southeast-1.aws.neon.tech/neondb",
        ssl=ctx,
        timeout=30,
    )

    # List tables
    rows = await conn.fetch(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    )
    tables = [r["table_name"] for r in rows]
    print("Existing tables:", tables)

    for table in ["users", "vehicles", "bookings", "donations"]:
        if table in tables:
            cols = await conn.fetch(
                f"SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name='{table}' ORDER BY ordinal_position"
            )
            print(f"\n{table} table columns:")
            for r in cols:
                print(f"  {r['column_name']}: {r['data_type']} ({r['udt_name']})")
        else:
            print(f"\nNo '{table}' table found.")

    await conn.close()

asyncio.run(main())
