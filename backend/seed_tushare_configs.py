import asyncio
from app.database import engine
from app.models import Configuration
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

async def main():
    async with AsyncSession(engine) as db:
        configs = [
            {"key": "tushare_data_latency_seconds", "value": "135"},
            {"key": "tushare_missing_rate_pct", "value": "0.2"},
            {"key": "tushare_anomaly_count", "value": "0"}
        ]
        for c in configs:
            res = await db.execute(select(Configuration).where(Configuration.key == c["key"]))
            cfg = res.scalars().first()
            if not cfg:
                db.add(Configuration(key=c["key"], value=c["value"]))
                print(f"Seeded configuration: {c['key']} = {c['value']}")
            else:
                print(f"Configuration already exists: {c['key']} = {cfg.value}")
        await db.commit()

if __name__ == "__main__":
    asyncio.run(main())
