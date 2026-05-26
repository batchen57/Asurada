import asyncio
import os
import sys

# Ensure backend root is in the Python search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, AsyncSessionLocal
from app.datahub.loader import seed_database
from sqlalchemy.future import select
from app.models import Stock

async def reseed():
    print("[Reseed] Resetting SQLite database...")
    async with engine.begin() as conn:
        # Drop all tables first to ensure we clean out simulated structures
        await conn.run_sync(Base.metadata.drop_all)
        print("[Reseed] Dropped all tables.")
        await conn.run_sync(Base.metadata.create_all)
        print("[Reseed] Created all tables.")

    print("[Reseed] Seeding database using Tushare Pro API...")
    async with AsyncSessionLocal() as session:
        await seed_database(session)
        
        # Verify seeding
        res = await session.execute(select(Stock))
        stocks = res.scalars().all()
        print(f"[Reseed] Verification successful! Active stocks count in database: {len(stocks)}")
        for s in stocks:
            print(f" - {s.symbol}: {s.name} ({s.sector})")

if __name__ == "__main__":
    asyncio.run(reseed())
