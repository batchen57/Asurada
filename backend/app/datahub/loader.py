import asyncio
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import engine, Base
from ..models import Stock, DailyPrice, Position, Task, SystemStatus, Signal, Configuration
from .tushare_sim import get_tushare_daily, get_tushare_all_metadata

def calculate_ma(prices, period):
    """
    Calculates simple moving average for a given period.
    """
    ma_values = []
    for i in range(len(prices)):
        if i < period - 1:
            ma_values.append(None)
        else:
            window = prices[i - period + 1 : i + 1]
            ma_values.append(round(sum(p["close"] for p in window) / period, 2))
    return ma_values

async def seed_database(db: AsyncSession):
    # Check if we already have stocks seeded
    result = await db.execute(select(Stock))
    if result.scalars().first():
        print("Database already seeded.")
        return

    print("Seeding database...")
    
    # 1. Seed Configurations FIRST so they are readable by subsequent sync Tushare Pro calls
    configs_to_seed = [
        {"key": "tushare_token", "value": "a416a177f1a064175e1e1bc2ef915ac33a49b9cc47244684b13e9910"},
        {"key": "feishu_webhook", "value": "https://open.feishu.cn/open-apis/bot/v2/hook/demo-webhook-id"},
        {"key": "feishu_enabled", "value": "false"},
        {"key": "is_trading_simulation", "value": "true"},
        {"key": "observe_max_daily_alerts", "value": "5"},
        {"key": "observe_merge_window_minutes", "value": "15"},
        {"key": "observe_enable_kline", "value": "false"},
        {"key": "observe_market_hours", "value": "09:30-11:30,13:00-15:00"},
        {"key": "discovery_sectors", "value": "新能源锂电,医疗器械,白酒,半导体,人工智能,电气设备,医疗保健,汽车整车,证券,IT设备,元器件,软件服务"},
        {"key": "discovery_avoid_sectors", "value": "房地产,周期煤炭,ST个股,房地产业"},
        {"key": "discovery_min_market_cap", "value": "100.0"},
        {"key": "discovery_min_daily_turnover", "value": "50.0"},
        {"key": "discovery_trading_style", "value": "中长线(VCP)为主"},
        {"key": "discovery_history_window_days", "value": "250"}
    ]
    for c in configs_to_seed:
        res = await db.execute(select(Configuration).where(Configuration.key == c["key"]))
        cfg = res.scalars().first()
        if not cfg:
            config_obj = Configuration(
                key=c["key"],
                value=c["value"]
            )
            db.add(config_obj)
    await db.flush()
    await db.commit() # Commit to DB to make it visible to synchronous sqlite3 connections

    # 2. Seed Stocks
    meta_stocks = get_tushare_all_metadata()
    stock_objs = []
    for s in meta_stocks:
        stock_obj = Stock(
            symbol=s["symbol"],
            name=s["name"],
            sector=s["sector"],
            is_active=True
        )
        db.add(stock_obj)
        stock_objs.append(stock_obj)
    
    await db.flush()

    # 2. Seed Daily Prices and calculate MAs
    for s in meta_stocks:
        symbol = s["symbol"]
        raw_prices = get_tushare_daily(symbol, limit=250)
        
        # Calculate moving averages
        ma5 = calculate_ma(raw_prices, 5)
        ma10 = calculate_ma(raw_prices, 10)
        ma20 = calculate_ma(raw_prices, 20)
        ma50 = calculate_ma(raw_prices, 50)
        ma150 = calculate_ma(raw_prices, 150)
        ma200 = calculate_ma(raw_prices, 200)
        
        for idx, p in enumerate(raw_prices):
            # Calculate simulated volatility score (tightening at the end for VCP)
            vol_score = 5.0
            if symbol == "300750.SZ":
                # CATL VCP: volatility decreases over time
                vol_score = max(0.8, 12.0 * (1 - (idx / len(raw_prices)) * 0.9))
            
            dp = DailyPrice(
                symbol=symbol,
                date=p["date"],
                open=p["open"],
                high=p["high"],
                low=p["low"],
                close=p["close"],
                volume=float(p["volume"]),
                ma5=ma5[idx],
                ma10=ma10[idx],
                ma20=ma20[idx],
                ma50=ma50[idx],
                ma150=ma150[idx],
                ma200=ma200[idx],
                volatility_score=vol_score
            )
            db.add(dp)

    # 3. Seed User Positions (matching mockup)
    positions_to_seed = [
        {"symbol": "600519.SH", "name": "贵州茅台", "volume": 100.0, "available_volume": 100.0, "cost_price": 1620.0, "current_price": 1688.50},
        {"symbol": "300750.SZ", "name": "宁德时代", "volume": 200.0, "available_volume": 200.0, "cost_price": 185.0, "current_price": 195.80},
        {"symbol": "300760.SZ", "name": "迈瑞医疗", "volume": 100.0, "available_volume": 100.0, "cost_price": 275.0, "current_price": 286.66}
    ]
    for p in positions_to_seed:
        pos = Position(
            symbol=p["symbol"],
            name=p["name"],
            volume=p["volume"],
            available_volume=p["available_volume"],
            cost_price=p["cost_price"],
            current_price=p["current_price"]
        )
        db.add(pos)

    # 4. Seed Today's Tasks Checklist (matching mockup)
    tasks_to_seed = [
        {"phase": "Plan", "task_name": "盘前计划：生成今日计划清单", "status": "去完成"},
        {"phase": "Observe", "task_name": "盘中盯盘：低频巡检与阈值监控", "status": "进行中"},
        {"phase": "Review", "task_name": "盘后复盘：生成复盘报告", "status": "待开始"},
        {"phase": "Iterate", "task_name": "候选池：更新与初筛", "status": "去执行"}
    ]
    for t in tasks_to_seed:
        task = Task(
            phase=t["phase"],
            task_name=t["task_name"],
            status=t["status"]
        )
        db.add(task)

    # 5. Seed System Status Health Metrics (matching mockup)
    statuses_to_seed = [
        {"service_name": "数据服务", "status": "正常", "detail": "延迟 2.3s"},
        {"service_name": "策略引擎", "status": "正常", "detail": "运行中"},
        {"service_name": "智能体服务", "status": "正常", "detail": "3/3 在线"},
        {"service_name": "信号与告警", "status": "正常", "detail": "未触发"}
    ]
    for s in statuses_to_seed:
        stat = SystemStatus(
            service_name=s["service_name"],
            status=s["status"],
            detail=s["detail"]
        )
        db.add(stat)

    # 6. Seed Recent Signals (matching mockup)
    signals_to_seed = [
        {
            "timestamp": "05-20 10:32",
            "symbol": "300750.SZ",
            "name": "宁德时代",
            "direction": "买入",
            "strategy_type": "VCP",
            "trigger_reason": "突破前高，量能放大",
            "status": "已触发"
        },
        {
            "timestamp": "05-20 09:55",
            "symbol": "300760.SZ",
            "name": "迈瑞医疗",
            "direction": "关注",
            "strategy_type": "Brooks",
            "trigger_reason": "价格接近支撑位",
            "status": "观察中"
        },
        {
            "timestamp": "05-19 14:21",
            "symbol": "000002.SZ",
            "name": "万科A",
            "direction": "卖出",
            "strategy_type": "Brooks",
            "trigger_reason": "跌破关键均线",
            "status": "已完成"
        }
    ]
    for sig in signals_to_seed:
        signal_obj = Signal(
            timestamp=sig["timestamp"],
            symbol=sig["symbol"],
            name=sig["name"],
            direction=sig["direction"],
            strategy_type=sig["strategy_type"],
            trigger_reason=sig["trigger_reason"],
            status=sig["status"]
        )
        db.add(signal_obj)

    await db.commit()
    print("Database seeding completed successfully.")

async def initialize_db_schema():
    """
    Creates tables if not exists.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
