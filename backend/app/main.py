import os
import uvicorn
import csv
import io
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from .database import get_db, engine, DATABASE_URL
from .models import Stock, DailyPrice, Position, Signal, Task, SystemStatus, Configuration, AuditLog, User, FocusStock, ResearchSector, ResearchReport, IndustryChainNode, CostStructure, ResearchConclusion, Evidence, ModelConfig, ModelLog
from .schemas import (
    StockResponse, DailyPriceResponse, PositionResponse, PositionCreate, PositionUpdate,
    SignalResponse, TaskResponse, TaskUpdate, SystemStatusResponse, ConfigurationResponse,
    ConfigurationUpdate, WorkbenchDataResponse, OverviewResponse,
    DataHubOverviewResponse, DataHubSourceStatus, DataHubTableResponse, DataHubTableSummary,
    DataHubSyncResponse,
    DiscoveryConfigResponse, DiscoveryConfigUpdate,
    DiscoveryScanResponse, DeepResearchResponse, DeepResearchRequest,
    TodayMarketResponse, HierarchicalSectorConfig, SectorStockConfig,
    AuditLogResponse, AuditLogStatsResponse,
    UserLoginRequest, UserLoginResponse, UserResponse, UserCreate, UserUpdate,
    FocusStockCreate, FocusStockUpdate, FocusStockResponse,
    ResearchSectorCreate, ResearchSectorResponse,
    IndustryChainNodeCreate, IndustryChainNodeResponse,
    CostStructureCreate, CostStructureResponse,
    ResearchConclusionResponse,
    ResearchReportResponse, EvidenceResponse,
    ModelConfigCreate, ModelConfigUpdate, ModelConfigResponse, ModelLogResponse
)
from .utils.auth import hash_password, generate_salt, verify_password, create_access_token, verify_access_token
from .datahub.loader import initialize_db_schema, seed_database
from .datahub.sina_sim import SinaMCPSimulator
from .datahub.discovery_engine import DiscoveryEngine
from .datahub.market_today import get_today_market_snapshot
from .agents.orchestrator import OrchestratorAgent
from .agents.feishu import FeishuBot

app = FastAPI(
    title="Asurada System API",
    description="Backend API for Asurada Personal Trading Assistant System (A-Share focused)",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """
    On startup, create database tables and seed them with initial data.
    """
    await initialize_db_schema()
    async with AsyncSession(engine) as session:
        await seed_database(session)

# 1. Unified Workbench API
@app.get("/api/workbench", response_model=WorkbenchDataResponse)
async def get_workbench_data(db: AsyncSession = Depends(get_db)):
    """
    Fetches all dashboard data in a single request for the main screen.
    """
    # Real-time Indices
    indices_data = SinaMCPSimulator.get_market_indices()
    overview = OverviewResponse(
        indices=indices_data["indices"],
        turnover_billion=indices_data["turnover_billion"],
        turnover_change_pct=indices_data["turnover_change_pct"],
        data_cutoff=indices_data["data_cutoff"],
        is_realtime=indices_data.get("is_realtime", False)
    )
    
    # User Positions
    pos_res = await db.execute(select(Position))
    positions = pos_res.scalars().all()
    
    # Update position prices with real-time quotes to ensure accuracy
    quotes = SinaMCPSimulator.get_realtime_quotes()
    for pos in positions:
        quote = quotes.get(pos.symbol)
        if quote:
            pos.current_price = quote["price"]
            
    # Today's Tasks
    task_res = await db.execute(select(Task))
    tasks = task_res.scalars().all()
    
    # Recent Signals
    sig_res = await db.execute(select(Signal).order_by(Signal.id.desc()).limit(15))
    signals = sig_res.scalars().all()
    
    # System Status
    status_res = await db.execute(select(SystemStatus))
    system_status = status_res.scalars().all()
    
    return WorkbenchDataResponse(
        overview=overview,
        positions=positions,
        tasks=tasks,
        signals=signals,
        system_status=system_status
    )

@app.get("/api/stocks", response_model=List[StockResponse])
async def get_stocks(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Stock))
    return res.scalars().all()

@app.get("/api/stocks/{symbol}", response_model=StockResponse)
async def get_stock_by_symbol(symbol: str, db: AsyncSession = Depends(get_db)):
    """
    Get stock metadata by symbol.
    Instead of just local database lookup, it dynamically queries live external APIs (Sina Finance) 
    to fetch the absolute latest stock name!
    """
    clean_sym = symbol.upper().strip()
    
    # 1. Try to fetch the latest stock name from live Sina Finance API
    latest_name = None
    sina_symbol = ""
    try:
        code, market = clean_sym.split(".")
        sina_symbol = f"sh{code}" if market == "SH" else f"sz{code}"
        import httpx
        url = f"https://hq.sinajs.cn/list={sina_symbol}"
        # Setting a short timeout to prevent blocking in case of internet connection issues
        with httpx.Client(headers={"Referer": "https://finance.sina.com.cn/"}, timeout=1.5) as client:
            response = client.get(url)
            if response.status_code == 200:
                text = response.content.decode("gb18030", errors="ignore")
                for line in text.splitlines():
                    if "=" in line:
                           body = line.split("=")[1].replace('"', '').replace(';', '')
                           fields = body.split(",")
                           if fields and fields[0]:
                               latest_name = fields[0].strip()
                               break
    except Exception as e:
        print(f"Failed to fetch live stock name from Sina hq: {e}")
        
    # 2. Check if we have it in our local database cache
    res = await db.execute(select(Stock).where(Stock.symbol == clean_sym))
    stock = res.scalars().first()
    
    if latest_name:
        # If it exists locally, update its name with the latest fetched one
        if stock:
            if stock.name != latest_name:
                stock.name = latest_name
                await db.commit()
                await db.refresh(stock)
            return stock
        else:
            # If it does not exist locally, dynamically create it in stocks table so we can use it!
            new_stock = Stock(
                symbol=clean_sym,
                name=latest_name,
                sector="新晋题材",
                is_active=True
            )
            db.add(new_stock)
            await db.commit()
            await db.refresh(new_stock)
            
            # Record audit log for live API access
            try:
                from .utils.audit import record_audit_log_sync
                record_audit_log_sync(
                    service_name="新浪实时行情服务 (Sina Finance)",
                    interface_name="hq.sinajs.cn 个股外接查询",
                    request_url=f"https://hq.sinajs.cn/list={sina_symbol}",
                    request_params={"symbol": clean_sym},
                    response_status="SUCCESS",
                    response_summary=f"[外部动态带入] 成功抓取新股: {clean_sym} ({latest_name}) 并自动缓存入库",
                    duration_ms=80
                )
            except Exception:
                pass
                
            return new_stock
            
    # Fallback to local offline db record if Sina API is unavailable
    if stock:
        return stock
        
    raise HTTPException(status_code=404, detail="Stock not found on live API or local cache")

@app.get("/api/stocks/{symbol}/history", response_model=List[DailyPriceResponse])
async def get_stock_history(symbol: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(DailyPrice)
        .where(DailyPrice.symbol == symbol)
        .order_by(DailyPrice.date.asc())
    )
    history = res.scalars().all()
    if not history:
        raise HTTPException(status_code=404, detail="Stock history not found")
    return history

# 2.1 DataHub APIs
DATAHUB_TABLES: Dict[str, Dict[str, Any]] = {
    "stocks": {
        "label": "证券名录缓存表",
        "model": Stock,
        "cols": ["id", "symbol", "name", "sector", "is_active"],
        "order_by": Stock.id.asc(),
    },
    "daily_prices": {
        "label": "历史日K缓存表",
        "model": DailyPrice,
        "cols": ["id", "symbol", "date", "open", "high", "low", "close", "volume", "ma50", "ma200"],
        "order_by": DailyPrice.date.desc(),
    },
    "positions": {
        "label": "投资组合持仓表",
        "model": Position,
        "cols": ["id", "symbol", "name", "volume", "available_volume", "cost_price", "current_price"],
        "order_by": Position.id.asc(),
    },
    "signals": {
        "label": "策略信号触发日志表",
        "model": Signal,
        "cols": ["id", "timestamp", "symbol", "name", "direction", "strategy_type", "status"],
        "order_by": Signal.id.desc(),
    },
    "tasks": {
        "label": "今日流程待办表",
        "model": Task,
        "cols": ["id", "phase", "task_name", "status"],
        "order_by": Task.id.asc(),
    },
    "configuration": {
        "label": "系统设置键值表",
        "model": Configuration,
        "cols": ["id", "key", "value"],
        "order_by": Configuration.id.asc(),
    },
    "audit_logs": {
        "label": "接口调用审计日志表",
        "model": AuditLog,
        "cols": ["id", "timestamp", "service_name", "interface_name", "response_status", "duration_ms"],
        "order_by": AuditLog.id.desc(),
    },
    "users": {
        "label": "管理员用户表",
        "model": User,
        "cols": ["id", "username", "role", "is_active", "created_at"],
        "order_by": User.id.asc(),
    },
    "focus_stocks": {
        "label": "重点筛选股票池表",
        "model": FocusStock,
        "cols": ["id", "symbol", "name", "sector", "added_at", "rating", "custom_tags", "target_price", "stop_loss"],
        "order_by": FocusStock.id.desc(),
    },
}

async def _get_datahub_table_summaries(db: AsyncSession) -> List[DataHubTableSummary]:
    from sqlalchemy import func

    summaries: List[DataHubTableSummary] = []
    for name, meta in DATAHUB_TABLES.items():
        count_res = await db.execute(select(func.count(meta["model"].id)))
        summaries.append(DataHubTableSummary(
            name=name,
            label=meta["label"],
            count=count_res.scalar() or 0,
            cols=meta["cols"],
        ))
    return summaries

def _serialize_datahub_row(row: Any, cols: List[str]) -> Dict[str, Any]:
    return {col: getattr(row, col, None) for col in cols}

async def _get_datahub_sources(db: AsyncSession) -> List[DataHubSourceStatus]:
    token_res = await db.execute(select(Configuration).where(Configuration.key == "tushare_token"))
    token_cfg = token_res.scalars().first()
    tushare_token = (token_cfg.value if token_cfg else "").strip()
    quota = SinaMCPSimulator.get_quota_status()
    return [
        DataHubSourceStatus(
            name="Tushare Pro",
            status="已配置" if tushare_token else "模拟模式",
            detail="日线与基础资料缓存源；无可用 Token 时使用内置高仿真数据。",
        ),
        DataHubSourceStatus(
            name="Sina Finance MCP",
            status="在线",
            detail="指数快照、个股实时行情与分时K线模拟源。",
            requests_made=quota["requests_made"],
            quota_limit=quota["quota_limit"],
            quota_remaining=quota["quota_remaining"],
            rate_limit_per_min=quota["rate_limit_per_min"],
            current_rate=quota["current_rate"],
        ),
        DataHubSourceStatus(
            name="SQLite Cache",
            status="正常",
            detail="本地异步缓存库，供策略智能体和前端页面统一读取。",
        ),
    ]

@app.get("/api/datahub/overview", response_model=DataHubOverviewResponse)
async def get_datahub_overview(db: AsyncSession = Depends(get_db)):
    return DataHubOverviewResponse(
        generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        database_url=DATABASE_URL.replace("sqlite+aiosqlite:///", "sqlite:///"),
        sources=await _get_datahub_sources(db),
        tables=await _get_datahub_table_summaries(db),
    )

@app.get("/api/datahub/tables/{table_name}", response_model=DataHubTableResponse)
async def get_datahub_table(
    table_name: str,
    limit: int = 25,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    meta = DATAHUB_TABLES.get(table_name)
    if not meta:
        raise HTTPException(status_code=404, detail="DataHub table not found")

    summaries = await _get_datahub_table_summaries(db)
    table_summary = next(summary for summary in summaries if summary.name == table_name)
    safe_limit = max(1, min(limit, 100))
    safe_offset = max(0, offset)
    query = select(meta["model"]).order_by(meta["order_by"]).limit(safe_limit).offset(safe_offset)
    rows_res = await db.execute(query)
    rows = [_serialize_datahub_row(row, meta["cols"]) for row in rows_res.scalars().all()]
    return DataHubTableResponse(
        table=table_summary,
        rows=rows,
        limit=safe_limit,
        offset=safe_offset,
        total=table_summary.count,
    )

@app.get("/api/datahub/tables/{table_name}/export")
async def export_datahub_table(table_name: str, db: AsyncSession = Depends(get_db)):
    meta = DATAHUB_TABLES.get(table_name)
    if not meta:
        raise HTTPException(status_code=404, detail="DataHub table not found")

    rows_res = await db.execute(select(meta["model"]).order_by(meta["order_by"]))
    rows = [_serialize_datahub_row(row, meta["cols"]) for row in rows_res.scalars().all()]

    output = io.StringIO()
    output.write("\ufeff")
    writer = csv.DictWriter(output, fieldnames=meta["cols"], extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    export_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"asurada_datahub_{table_name}_{export_time}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@app.post("/api/datahub/sync", response_model=DataHubSyncResponse)
async def sync_datahub(db: AsyncSession = Depends(get_db)):
    quotes = SinaMCPSimulator.get_realtime_quotes()
    pos_res = await db.execute(select(Position))
    positions = pos_res.scalars().all()
    updated_positions = 0
    for pos in positions:
        quote = quotes.get(pos.symbol)
        if quote:
            pos.current_price = quote["price"]
            updated_positions += 1

    status_res = await db.execute(select(SystemStatus).where(SystemStatus.service_name == "数据服务"))
    data_status = status_res.scalars().first()
    if data_status:
        data_status.status = "正常"
        data_status.detail = f"最新同步 {datetime.now().strftime('%H:%M:%S')}"

    await db.commit()
    return DataHubSyncResponse(
        success=True,
        message="DataHub 已完成实时行情增量同步，并更新持仓缓存价格。",
        synced_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        updated_positions=updated_positions,
        quote_count=len(quotes),
        tables=await _get_datahub_table_summaries(db),
    )

# 3. Position Portfolio Management APIs
@app.get("/api/positions", response_model=List[PositionResponse])
async def get_positions(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Position))
    return res.scalars().all()

@app.post("/api/positions", response_model=PositionResponse)
async def create_position(pos: PositionCreate, db: AsyncSession = Depends(get_db)):
    db_pos = Position(**pos.dict())
    db.add(db_pos)
    await db.commit()
    await db.refresh(db_pos)
    return db_pos

@app.put("/api/positions/{symbol}", response_model=PositionResponse)
async def update_position(symbol: str, pos_data: PositionUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Position).where(Position.symbol == symbol))
    db_pos = res.scalars().first()
    if not db_pos:
        raise HTTPException(status_code=404, detail="Position not found")
        
    for key, value in pos_data.dict(exclude_unset=True).items():
        setattr(db_pos, key, value)
        
    await db.commit()
    await db.refresh(db_pos)
    return db_pos

@app.delete("/api/positions/{symbol}")
async def delete_position(symbol: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Position).where(Position.symbol == symbol))
    db_pos = res.scalars().first()
    if not db_pos:
        raise HTTPException(status_code=404, detail="Position not found")
        
    await db.delete(db_pos)
    await db.commit()
    return {"message": f"Position {symbol} deleted successfully"}

# 4. Tasks/Checklist APIs
@app.get("/api/tasks", response_model=List[TaskResponse])
async def get_tasks(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Task))
    return res.scalars().all()

@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Task).where(Task.id == task_id))
    db_task = res.scalars().first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db_task.status = task_data.status
    if task_data.result_content is not None:
        db_task.result_content = task_data.result_content
    await db.commit()
    await db.refresh(db_task)
    return db_task

@app.post("/api/tasks/reset")
async def reset_tasks(db: AsyncSession = Depends(get_db)):
    """
    Resets all tasks to initial state.
    """
    res = await db.execute(select(Task))
    tasks = res.scalars().all()
    default_statuses = {
        "Plan": "去完成",
        "Observe": "进行中",
        "Review": "待开始",
        "Iterate": "去执行"
    }
    for t in tasks:
        t.status = default_statuses.get(t.phase, "去完成")
        t.result_content = None
    await db.commit()
    return {"message": "Tasks checklist reset successfully"}

# 5. Signals APIs
@app.get("/api/signals", response_model=List[SignalResponse])
async def get_signals(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Signal).order_by(Signal.id.desc()))
    return res.scalars().all()

@app.delete("/api/signals")
async def clear_signals(db: AsyncSession = Depends(get_db)):
    """
    Clear all signal logs from the database.
    """
    from sqlalchemy import delete
    await db.execute(delete(Signal))
    
    # Reset system status details
    status_res = await db.execute(select(SystemStatus).where(SystemStatus.service_name == "信号与告警"))
    sig_status = status_res.scalars().first()
    if sig_status:
        sig_status.status = "正常"
        sig_status.detail = "未触发"
        
    await db.commit()
    return {"message": "All signals cleared successfully"}

@app.post("/api/signals/test", response_model=SignalResponse)
async def trigger_test_signal(db: AsyncSession = Depends(get_db)):
    """
    Triggers and simulates a high-fidelity strategy signal for either a VCP breakout or a Brooks naked K reversal.
    """
    import random
    from datetime import datetime
    
    # Pick a random stock from our database to make the signal feel realistic
    stocks_res = await db.execute(select(Stock))
    stocks_list = stocks_res.scalars().all()
    
    if not stocks_list:
        sym = "300750.SZ"
        name = "宁德时代"
    else:
        # Prefer active positions or focus pool stocks if available, otherwise any stock
        stock = random.choice(stocks_list)
        sym = stock.symbol
        name = stock.name
        
    now = datetime.now()
    time_str = now.strftime("%m-%d %H:%M")
    
    # Randomly select a strategy style
    strat = random.choice(["VCP", "Brooks"])
    if strat == "VCP":
        direction = "买入"
        reason = "波动率三次收缩整理完成，放量向上突破盘整阻力位，激活VCP策略做多进场点"
    else:
        direction = random.choice(["关注", "卖出"])
        if direction == "关注":
            reason = "缩量回踩关键大周期均线支撑位，日K收出长下影线锤子线(Pinbar)，做多盈亏比极佳"
        else:
            reason = "日线收盘长阴线有效跌破短周期持仓均线防守红线，符合风控出场纪律，坚决止损"
            
    test_sig = Signal(
        timestamp=time_str,
        symbol=sym,
        name=name,
        direction=direction,
        strategy_type=strat,
        trigger_reason=reason,
        status="已触发"
    )
    db.add(test_sig)
    
    # Update system status details to reflect alert trigger
    status_res = await db.execute(select(SystemStatus).where(SystemStatus.service_name == "信号与告警"))
    sig_status = status_res.scalars().first()
    if sig_status:
        sig_status.status = "正常"
        sig_status.detail = f"最新触发 {time_str}"
        
    await db.commit()
    await db.refresh(test_sig)
    return test_sig

# 6. Configuration Settings APIs
@app.get("/api/config", response_model=List[ConfigurationResponse])
async def get_configs(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Configuration))
    return res.scalars().all()

@app.put("/api/config/{key}", response_model=ConfigurationResponse)
async def update_config(key: str, data: ConfigurationUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Configuration).where(Configuration.key == key))
    cfg = res.scalars().first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Configuration not found")
    cfg.value = data.value
    await db.commit()
    await db.refresh(cfg)
    return cfg

# 7. Orchestrator Actions APIs
class OrchestratorRequest(BaseModel):
    phase: str # Plan / Observe / Review / Iterate
    sim_time: Optional[str] = None
    sim_symbol: Optional[str] = None
    sim_price: Optional[float] = None

@app.post("/api/orchestrator/run")
async def run_orchestrator(req: OrchestratorRequest, db: AsyncSession = Depends(get_db)):
    """
    Triggers the active phase scan of the Orchestrator Agent.
    """
    phase = req.phase
    if phase == "Plan":
        result = await OrchestratorAgent.run_plan_phase(db)
        return {"success": True, "phase": "Plan", "result": result}
    elif phase == "Observe":
        result = await OrchestratorAgent.run_observe_phase(
            db,
            sim_time=req.sim_time,
            sim_symbol=req.sim_symbol,
            sim_price=req.sim_price
        )
        return {"success": True, "phase": "Observe", "result": result}
    elif phase == "Review":
        result = await OrchestratorAgent.run_review_phase(db)
        return {"success": True, "phase": "Review", "result": result}
    elif phase == "Iterate":
        result = await OrchestratorAgent.run_weekly_iterate_phase(db)
        return {"success": True, "phase": "Iterate", "result": result}
    else:
        raise HTTPException(status_code=400, detail="Invalid phase specified. Must be Plan, Observe, Review, or Iterate.")

class FeishuPushRequest(BaseModel):
    content: str

@app.post("/api/orchestrator/push-feishu")
async def push_feishu_message(req: FeishuPushRequest, db: AsyncSession = Depends(get_db)):
    """
    Manually push customized plan content to Feishu Bot.
    """
    webhook_url = await OrchestratorAgent.get_configuration(db, "feishu_webhook")
    fs_enabled = (await OrchestratorAgent.get_configuration(db, "feishu_enabled")) == "true"
    
    success = await FeishuBot.push_message(
        webhook_url=webhook_url,
        title="盘前可执行计划一页纸",
        text_content=req.content,
        enabled=fs_enabled
    )
    return {"success": success, "webhook_url": webhook_url, "enabled": fs_enabled}

class ApplyOptimizationRequest(BaseModel):
    configs: Dict[str, str]

@app.post("/api/orchestrator/apply-optimization")
async def apply_optimization(req: ApplyOptimizationRequest, db: AsyncSession = Depends(get_db)):
    """
    Updates system configurations with recommended parameters for noise reduction.
    """
    for key, value in req.configs.items():
        res = await db.execute(select(Configuration).where(Configuration.key == key))
        cfg = res.scalars().first()
        if cfg:
            cfg.value = value
        else:
            new_cfg = Configuration(key=key, value=value)
            db.add(new_cfg)
    await db.commit()
    return {"success": True, "message": "降噪参数已优化应用并持久化保存。"}

@app.get("/api/orchestrator/review-files")
async def get_review_files(filename: Optional[str] = None):
    """
    Lists persisted review files or returns contents of a specific file.
    """
    import os
    import json
    current_dir = os.path.dirname(os.path.abspath(__file__))
    review_dir = os.path.abspath(os.path.join(current_dir, "data", "review_outputs"))
    
    if not os.path.exists(review_dir):
        return {"files": [], "content": None}
        
    files = sorted(os.listdir(review_dir), reverse=True)
    
    content = None
    if filename:
        # Sanitize filename to prevent directory traversal
        safe_name = os.path.basename(filename)
        file_path = os.path.join(review_dir, safe_name)
        if os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = json.load(f)
            except Exception as e:
                content = {"error": f"Failed to read file: {str(e)}"}
        else:
            content = {"error": "File not found"}
            
    return {
        "files": files,
        "content": content
    }

# ==========================================
# 8. Discovery (选股与题材) APIs
# ==========================================
@app.get("/api/discovery/config", response_model=DiscoveryConfigResponse)
async def get_discovery_config(db: AsyncSession = Depends(get_db)):
    """
    Fetch persistent Discovery configurations.
    """
    return await DiscoveryEngine.get_discovery_config(db)

@app.put("/api/discovery/config", response_model=DiscoveryConfigResponse)
async def update_discovery_config(data: DiscoveryConfigUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update and persist Discovery configurations.
    """
    return await DiscoveryEngine.update_discovery_config(db, data.dict())

@app.get("/api/discovery/scan", response_model=DiscoveryScanResponse)
async def get_discovery_snapshot(db: AsyncSession = Depends(get_db)):
    """
    Retrieves the latest cached Discovery scan results without running a new scan.
    """
    return await DiscoveryEngine.get_latest_snapshot(db)

@app.post("/api/discovery/scan", response_model=DiscoveryScanResponse)
async def run_discovery_scan(db: AsyncSession = Depends(get_db)):
    """
    Triggers the 3-Layer Discovery Scanning Pipeline.
    """
    return await DiscoveryEngine.run_discovery_scan(db)

@app.post("/api/discovery/push-feishu")
async def push_discovery_feishu(db: AsyncSession = Depends(get_db)):
    """
    Pushes Top-N Candidate pool briefing to Feishu.
    """
    return await DiscoveryEngine.push_discovery_feishu(db)

@app.post("/api/discovery/deep-research")
async def generate_deep_research(req: DeepResearchRequest, db: AsyncSession = Depends(get_db)):
    """
    Generates a high-fidelity Deep Research Report for the given symbol.
    """
    result = await DiscoveryEngine.generate_deep_research(req.symbol, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@app.get("/api/discovery/deep-research/{symbol}")
async def get_deep_research_report(symbol: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieves the generated Deep Research Report if it exists.
    """
    result = await DiscoveryEngine.get_deep_research_report(symbol, db)
    if not result:
        raise HTTPException(status_code=404, detail="Deep research report not found. Please click '一键深研' to generate.")
    return result

# Backend in-memory cache for Today's Stock Market snapshot
_today_market_memory_cache = None

@app.get("/api/discovery/today-market", response_model=TodayMarketResponse)
async def get_today_market(refresh: bool = False, db: AsyncSession = Depends(get_db)):
    """
    Fetches the latest A-share sector leader quote snapshot for the Today Market view.
    """
    global _today_market_memory_cache
    import json
    current_dir = os.path.dirname(os.path.abspath(__file__))
    snapshot_file = os.path.join(current_dir, "data", "latest_today_market_snapshot.json")
    
    if not refresh:
        # 1. Try backend memory cache first
        if _today_market_memory_cache is not None:
            return _today_market_memory_cache

        # 2. Try database Configuration table next
        try:
            db_res = await db.execute(select(Configuration).where(Configuration.key == "today_market_snapshot"))
            db_cfg = db_res.scalars().first()
            if db_cfg and db_cfg.value:
                cached_data = json.loads(db_cfg.value)
                if cached_data and isinstance(cached_data, dict) and "leaders" in cached_data:
                    _today_market_memory_cache = cached_data
                    return cached_data
        except Exception as e:
            print(f"Failed to read today market snapshot from database: {e}")

        # 3. Try local file system cache as a fallback
        if os.path.exists(snapshot_file):
            try:
                with open(snapshot_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                    if cached_data and isinstance(cached_data, dict) and "leaders" in cached_data:
                        _today_market_memory_cache = cached_data
                        # Proactively write it to the database so next time it is in the database
                        new_db_cfg = Configuration(key="today_market_snapshot", value=json.dumps(cached_data, ensure_ascii=False))
                        db.add(new_db_cfg)
                        await db.commit()
                        return cached_data
            except Exception as e:
                print(f"Failed to read today market snapshot cache from file: {e}")

    # Fetch/regenerate the snapshot
    res = await db.execute(select(Configuration).where(Configuration.key == "today_market_sectors"))
    cfg = res.scalars().first()
    
    leader_defs = None
    if cfg and cfg.value:
        try:
            sectors_data = json.loads(cfg.value)
            
            if sectors_data and isinstance(sectors_data, list):
                if len(sectors_data) > 0 and "stocks" in sectors_data[0]:
                    # hierarchical format
                    flattened = []
                    for sec in sectors_data:
                        sector_name = sec.get("sector", "")
                        for stock in sec.get("stocks", []):
                            flattened.append({
                                "sector": sector_name,
                                "symbol": stock.get("symbol", ""),
                                "name": stock.get("name", ""),
                                "theme": stock.get("theme", ""),
                                "role": stock.get("role", ""),
                                "signal": stock.get("signal", ""),
                                "risk": stock.get("risk", "")
                            })
                    leader_defs = flattened
                else:
                    # old flat format
                    leader_defs = sectors_data
        except Exception as e:
            print(f"Failed to parse today_market_sectors: {e}")
            
    snapshot = get_today_market_snapshot(leader_defs=leader_defs)
    
    # Save/Update both memory, database and file cache
    _today_market_memory_cache = snapshot
    
    # Save to database Configuration table
    try:
        db_res = await db.execute(select(Configuration).where(Configuration.key == "today_market_snapshot"))
        db_cfg = db_res.scalars().first()
        json_value = json.dumps(snapshot, ensure_ascii=False)
        if db_cfg:
            db_cfg.value = json_value
        else:
            new_db_cfg = Configuration(key="today_market_snapshot", value=json_value)
            db.add(new_db_cfg)
        await db.commit()
    except Exception as e:
        print(f"Failed to save today market snapshot to database: {e}")

    # Save to file
    try:
        os.makedirs(os.path.dirname(snapshot_file), exist_ok=True)
        with open(snapshot_file, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Failed to write today market snapshot cache to file: {e}")
        
    return snapshot

@app.get("/api/discovery/today-market/config", response_model=List[HierarchicalSectorConfig])
async def get_today_market_config(db: AsyncSession = Depends(get_db)):
    """
    Get configured sector leaders for the Today Market view.
    """
    res = await db.execute(select(Configuration).where(Configuration.key == "today_market_sectors"))
    cfg = res.scalars().first()
    
    def get_default_hierarchical_sectors():
        from .datahub.market_today import MARKET_LEADER_DEFS
        hierarchical_defaults = []
        sector_map = {}
        for item in MARKET_LEADER_DEFS:
            sec = item["sector"]
            stock_info = {
                "symbol": item["symbol"],
                "name": item["name"],
                "theme": item["theme"],
                "role": item["role"],
                "signal": item["signal"],
                "risk": item["risk"]
            }
            if sec not in sector_map:
                sec_obj = {"sector": sec, "stocks": []}
                hierarchical_defaults.append(sec_obj)
                sector_map[sec] = sec_obj
            sector_map[sec]["stocks"].append(stock_info)
        return hierarchical_defaults

    if cfg and cfg.value:
        try:
            import json
            data = json.loads(cfg.value)
            if data and isinstance(data, list):
                if len(data) > 0 and "stocks" in data[0]:
                    return data
                else:
                    # Convert flat list to hierarchical
                    hierarchical = []
                    sector_map = {}
                    for item in data:
                        sec = item.get("sector", "")
                        stock_info = {
                            "symbol": item.get("symbol", ""),
                            "name": item.get("name", ""),
                            "theme": item.get("theme", ""),
                            "role": item.get("role", ""),
                            "signal": item.get("signal", ""),
                            "risk": item.get("risk", "")
                        }
                        if sec not in sector_map:
                            sec_obj = {"sector": sec, "stocks": []}
                            hierarchical.append(sec_obj)
                            sector_map[sec] = sec_obj
                        sector_map[sec]["stocks"].append(stock_info)
                    return hierarchical
        except Exception as e:
            print(f"Failed to parse today_market_sectors: {e}")
            
    return get_default_hierarchical_sectors()

@app.put("/api/discovery/today-market/config")
async def update_today_market_config(data: List[HierarchicalSectorConfig], db: AsyncSession = Depends(get_db)):
    """
    Update configured sector leaders for the Today Market view.
    """
    res = await db.execute(select(Configuration).where(Configuration.key == "today_market_sectors"))
    cfg = res.scalars().first()
    
    import json
    serializable_data = []
    for sec in data:
        serializable_data.append({
            "sector": sec.sector,
            "stocks": [stock.dict() for stock in sec.stocks]
        })
    json_value = json.dumps(serializable_data, ensure_ascii=False)
    
    if cfg:
        cfg.value = json_value
    else:
        new_cfg = Configuration(key="today_market_sectors", value=json_value)
        db.add(new_cfg)
        
    await db.flush()

    # Helper function for MA calculation
    def calculate_ma(prices, period):
        ma_values = []
        for i in range(len(prices)):
            if i < period - 1:
                ma_values.append(None)
            else:
                window = prices[i - period + 1 : i + 1]
                ma_values.append(round(sum(p["close"] for p in window) / period, 2))
        return ma_values

    # 1. Sync stocks to db stocks table
    try:
        stocks_res = await db.execute(select(Stock))
        existing_stocks = {s.symbol: s for s in stocks_res.scalars().all()}
        
        for sec in data:
            for stock in sec.stocks:
                if stock.symbol in existing_stocks:
                    db_stock = existing_stocks[stock.symbol]
                    db_stock.name = stock.name
                    db_stock.sector = sec.sector
                else:
                    new_stock = Stock(
                        symbol=stock.symbol,
                        name=stock.name,
                        sector=sec.sector,
                        is_active=True
                    )
                    db.add(new_stock)
                    existing_stocks[stock.symbol] = new_stock
    except Exception as e:
        print(f"Failed to synchronize stocks to DB: {e}")

    # 2. Check and generate daily_prices historical data for newly added stocks
    try:
        from .datahub.tushare_sim import get_tushare_daily
        for sec in data:
            for stock in sec.stocks:
                dp_res = await db.execute(select(DailyPrice).where(DailyPrice.symbol == stock.symbol).limit(1))
                if not dp_res.scalars().first():
                    # Generate 250 daily price records
                    raw_prices = get_tushare_daily(stock.symbol, limit=250)
                    
                    ma5 = calculate_ma(raw_prices, 5)
                    ma10 = calculate_ma(raw_prices, 10)
                    ma20 = calculate_ma(raw_prices, 20)
                    ma50 = calculate_ma(raw_prices, 50)
                    ma150 = calculate_ma(raw_prices, 150)
                    ma200 = calculate_ma(raw_prices, 200)
                    
                    for idx, p in enumerate(raw_prices):
                        dp = DailyPrice(
                            symbol=stock.symbol,
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
                            volatility_score=5.0
                        )
                        db.add(dp)
    except Exception as e:
        print(f"Failed to generate daily prices for newly configured stocks: {e}")

    # 3. Clear memory and file caches
    global _today_market_memory_cache
    _today_market_memory_cache = None

    current_dir = os.path.dirname(os.path.abspath(__file__))
    snapshot_file = os.path.join(current_dir, "data", "latest_today_market_snapshot.json")
    if os.path.exists(snapshot_file):
        try:
            os.remove(snapshot_file)
        except Exception as e:
            print(f"Failed to delete today market snapshot file: {e}")

    # 4. Proactively regenerate the today market snapshot and seed caches
    try:
        leader_defs = []
        for sec in data:
            sector_name = sec.sector
            for stock in sec.stocks:
                leader_defs.append({
                    "sector": sector_name,
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "theme": stock.theme,
                    "role": stock.role,
                    "signal": stock.signal,
                    "risk": stock.risk
                })
        
        snapshot = get_today_market_snapshot(leader_defs=leader_defs)
        
        # Seed memory cache
        _today_market_memory_cache = snapshot
        
        # Safe Update/Insert for today_market_snapshot to avoid UNIQUE constraint conflicts
        snap_res = await db.execute(select(Configuration).where(Configuration.key == "today_market_snapshot"))
        snap_cfg = snap_res.scalars().first()
        json_value = json.dumps(snapshot, ensure_ascii=False)
        if snap_cfg:
            snap_cfg.value = json_value
        else:
            new_snap_cfg = Configuration(key="today_market_snapshot", value=json_value)
            db.add(new_snap_cfg)
        
        # Seed file cache
        os.makedirs(os.path.dirname(snapshot_file), exist_ok=True)
        with open(snapshot_file, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, ensure_ascii=False, indent=2)
            
    except Exception as e:
        print(f"Failed to proactively regenerate today market snapshot: {e}")

    await db.commit()
    return {"success": True, "message": "板块配置已成功保存并实时更新同步至系统表与今日行情中。"}

@app.get("/api/discovery/today-market/{symbol}/details")
async def get_market_leader_details_api(symbol: str, db: AsyncSession = Depends(get_db)):
    """
    获取个股各基本面整体的介绍与未来 2026E/2027E 预测数据，支持自定义标的动态退底生成
    """
    from .datahub.market_details_data import get_market_leader_details, generate_dynamic_stock_details
    details = get_market_leader_details(symbol)
    if not details:
        res = await db.execute(select(Stock).where(Stock.symbol == symbol))
        st = res.scalars().first()
        if st:
            details = generate_dynamic_stock_details(symbol, st.name, st.sector)
        else:
            res_focus = await db.execute(select(FocusStock).where(FocusStock.symbol == symbol))
            fs = res_focus.scalars().first()
            if fs:
                details = generate_dynamic_stock_details(symbol, fs.name, fs.sector)
            else:
                details = generate_dynamic_stock_details(symbol, symbol, "其它板块")
    return details

@app.get("/api/stocks/{symbol}/analysis")
async def get_stock_analysis_api(symbol: str, db: AsyncSession = Depends(get_db)):
    """
    获取个股的舆情分析、股票智能体技术评估、未来十个工作日股价预测
    """
    from .datahub.market_details_data import get_stock_predictions_and_analysis
    from datetime import datetime
    
    # 1. Query name & sector
    res_stock = await db.execute(select(Stock).where(Stock.symbol == symbol))
    st = res_stock.scalars().first()
    if st:
        name = st.name
        sector = st.sector
    else:
        res_focus = await db.execute(select(FocusStock).where(FocusStock.symbol == symbol))
        fs = res_focus.scalars().first()
        if fs:
            name = fs.name
            sector = fs.sector
        else:
            name = symbol
            sector = "其它板块"
            
    # 2. Query latest price and date
    res_price = await db.execute(
        select(DailyPrice)
        .where(DailyPrice.symbol == symbol)
        .order_by(DailyPrice.date.desc())
        .limit(1)
    )
    latest_dp = res_price.scalars().first()
    if latest_dp:
        price = latest_dp.close
        date_str = latest_dp.date
    else:
        price = 100.0
        date_str = datetime.now().strftime("%Y-%m-%d")
        
    analysis = get_stock_predictions_and_analysis(symbol, name, price, sector, date_str)
    return analysis

# ==========================================
# 9. Audit Logging (审计管理) APIs
# ==========================================
@app.get("/api/audit-logs", response_model=Dict[str, Any])
async def get_audit_logs(
    limit: int = 50,
    offset: int = 0,
    service_name: Optional[str] = None,
    response_status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches paginated and filtered audit logs.
    """
    from sqlalchemy import func
    
    query = select(AuditLog)
    
    if service_name and service_name != "All":
        query = query.where(AuditLog.service_name == service_name)
    if response_status and response_status != "All":
        query = query.where(AuditLog.response_status == response_status)
    if search:
        query = query.where(
            (AuditLog.interface_name.like(f"%{search}%")) |
            (AuditLog.request_url.like(f"%{search}%")) |
            (AuditLog.request_params.like(f"%{search}%")) |
            (AuditLog.response_summary.like(f"%{search}%"))
        )
        
    # Get total count before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0
    
    # Execute paginated query
    query = query.order_by(AuditLog.id.desc()).limit(limit).offset(offset)
    logs_res = await db.execute(query)
    logs = logs_res.scalars().all()
    
    return {
        "total": total,
        "logs": [AuditLogResponse.model_validate(log) for log in logs]
    }

@app.get("/api/audit-logs/stats", response_model=AuditLogStatsResponse)
async def get_audit_log_stats(db: AsyncSession = Depends(get_db)):
    """
    Fetches high-fidelity metrics summary for audit logs dashboard cards.
    """
    from sqlalchemy import func
    
    # Total calls
    total_res = await db.execute(select(func.count(AuditLog.id)))
    total_calls = total_res.scalar() or 0
    
    if total_calls == 0:
        return AuditLogStatsResponse(
            total_calls=0,
            success_rate=100.0,
            today_calls=0,
            avg_latency_ms=0.0
        )
        
    # Success rate
    success_res = await db.execute(select(func.count(AuditLog.id)).where(AuditLog.response_status == "SUCCESS"))
    success_calls = success_res.scalar() or 0
    success_rate = round((success_calls / total_calls) * 100, 1)
    
    # Today's calls
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_res = await db.execute(select(func.count(AuditLog.id)).where(AuditLog.timestamp.like(f"{today_str}%")))
    today_calls = today_res.scalar() or 0
    
    # Average latency
    avg_latency_res = await db.execute(select(func.avg(AuditLog.duration_ms)))
    avg_latency = avg_latency_res.scalar() or 0.0
    avg_latency = round(float(avg_latency), 1)
    
    return AuditLogStatsResponse(
        total_calls=total_calls,
        success_rate=success_rate,
        today_calls=today_calls,
        avg_latency_ms=avg_latency
    )

@app.delete("/api/audit-logs")
async def clear_audit_logs(db: AsyncSession = Depends(get_db)):
    """
    Clears all audit logs.
    """
    from sqlalchemy import delete
    await db.execute(delete(AuditLog))
    await db.commit()
    return {"message": "Audit logs cleared successfully"}


def map_model_log(log: ModelLog) -> ModelLogResponse:
    import json
    
    payload = None
    if log.request_payload:
        try:
            payload = json.loads(log.request_payload)
        except Exception:
            payload = log.request_payload
            
    resp_body = None
    if log.response_body:
        try:
            resp_body = json.loads(log.response_body)
        except Exception:
            resp_body = log.response_body
            
    return ModelLogResponse(
        id=log.id,
        task_name=log.task_name,
        task_id=log.task_id,
        username=log.username,
        user_id=log.user_id,
        model_id=log.model_id,
        model_url=log.model_url,
        status_code=log.status_code,
        started_at=log.started_at,
        ended_at=log.ended_at,
        input_tokens=log.input_tokens or 0,
        output_tokens=log.output_tokens or 0,
        request_payload=payload,
        response_body=resp_body
    )


@app.get("/api/model-logs", response_model=Dict[str, Any])
async def get_model_logs(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import func
    
    query = select(ModelLog)
    
    if search:
        query = query.where(
            (ModelLog.task_name.like(f"%{search}%")) |
            (ModelLog.task_id.like(f"%{search}%")) |
            (ModelLog.model_id.like(f"%{search}%")) |
            (ModelLog.username.like(f"%{search}%")) |
            (ModelLog.model_url.like(f"%{search}%"))
        )
        
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total = total_res.scalar() or 0
    
    query = query.order_by(ModelLog.id.desc()).limit(limit).offset(skip)
    logs_res = await db.execute(query)
    logs = logs_res.scalars().all()
    
    return {
        "total": total,
        "logs": [map_model_log(log) for log in logs]
    }


@app.get("/api/tts")
async def get_mock_tts(text: str, voice_id: Optional[str] = None):
    import io
    import math
    import wave
    import struct
    from fastapi.responses import Response
    
    sample_rate = 8000
    duration = 2.0  # 2 seconds
    frequency = 350.0  # 350 Hz pleasant tone
    
    wav_io = io.BytesIO()
    with wave.open(wav_io, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        num_samples = int(sample_rate * duration)
        for i in range(num_samples):
            t = i / sample_rate
            envelope = math.exp(-2.5 * t)  # decay factor
            value = int(24000.0 * envelope * math.sin(2.0 * math.pi * frequency * t))
            data = struct.pack('<h', value)
            wav_file.writeframesraw(data)
            
    wav_io.seek(0)
    audio_bytes = wav_io.read()
    
    return Response(content=audio_bytes, media_type="audio/wav")


# ==========================================
# 10. User Auth & Management (用户登录与管理) APIs
# ==========================================
@app.post("/api/auth/login", response_model=UserLoginResponse)
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate administrator user credentials and return a session token.
    """
    res = await db.execute(select(User).where(User.username == req.username))
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="该账户已被冻结"
        )
    if not verify_password(req.password, user.salt, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误"
        )
    
    # Create Access Token
    access_token = create_access_token(user.username, user.role)
    return UserLoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@app.get("/api/users", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db)):
    """
    Lists all administrator users.
    """
    res = await db.execute(select(User))
    return res.scalars().all()

@app.post("/api/users", response_model=UserResponse)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Creates a new administrator user.
    """
    # Check if username exists
    existing_res = await db.execute(select(User).where(User.username == data.username))
    if existing_res.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="用户名已存在"
        )
        
    salt = generate_salt()
    hashed = hash_password(data.password, salt)
    
    new_user = User(
        username=data.username,
        hashed_password=hashed,
        salt=salt,
        role=data.role or "admin",
        is_active=data.is_active if data.is_active is not None else True,
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, data: UserUpdate, req: Request, db: AsyncSession = Depends(get_db)):
    """
    Updates an administrator user (role, active status, or reset password).
    """
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
        
    # Prevent demoting or deactivating the primary 'admin' account to avoid lockout
    if user.username == "admin" and data.is_active is False:
        raise HTTPException(
            status_code=400,
            detail="系统保留的默认管理员账号不可冻结"
        )
        
    if data.password:
        # Check current logged-in user role
        auth_header = req.headers.get("Authorization")
        current_role = "operator"  # Safe default if token is missing
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_access_token(token)
            if payload:
                current_role = payload.get("role", "operator")
        
        # Prevent ordinary admin (operator) from resetting super admin (admin) password
        if current_role == "operator" and (user.role == "admin" or user.username == "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足：普通管理员无法重置超级管理员密码"
            )
            
        salt = generate_salt()
        user.salt = salt
        user.hashed_password = hash_password(data.password, salt)
        
    if data.role is not None:
        user.role = data.role
        
    if data.is_active is not None:
        user.is_active = data.is_active
        
    await db.commit()
    await db.refresh(user)
    return user

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Deletes an administrator user.
    """
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
        
    # Prevent deleting primary 'admin' account
    if user.username == "admin":
        raise HTTPException(
            status_code=400,
            detail="系统保留的默认管理员账号不可注销"
        )
        
    await db.delete(user)
    await db.commit()
    return {"success": True, "message": f"管理员 {user.username} 已注销"}


# ==========================================
# 11. Focus Watchlist (重点筛选池) APIs
# ==========================================
@app.get("/api/focus-watchlist", response_model=List[FocusStockResponse])
async def get_focus_watchlist(db: AsyncSession = Depends(get_db)):
    """
    获取重点筛选池中的所有个股
    """
    res = await db.execute(select(FocusStock).order_by(FocusStock.id.desc()))
    return res.scalars().all()


@app.post("/api/focus-watchlist", response_model=FocusStockResponse)
async def add_to_focus_watchlist(stock_data: FocusStockCreate, db: AsyncSession = Depends(get_db)):
    """
    添加个股到重点筛选池，自动排重并写入非阻塞调用审计
    """
    res = await db.execute(select(FocusStock).where(FocusStock.symbol == stock_data.symbol))
    existing = res.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="该股票已存在于重点筛选池中。")
    
    db_stock = FocusStock(
        symbol=stock_data.symbol,
        name=stock_data.name,
        sector=stock_data.sector,
        added_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        rating=stock_data.rating or "⭐ 中线关注",
        custom_tags=stock_data.custom_tags or "",
        investment_logic=stock_data.investment_logic or "",
        target_price=stock_data.target_price,
        stop_loss=stock_data.stop_loss,
        notes=stock_data.notes or ""
    )
    db.add(db_stock)
    await db.commit()
    await db.refresh(db_stock)
    
    # Non-blocking async audit log trigger
    from .utils.audit import record_audit_log_sync
    record_audit_log_sync(
        service_name="策略引擎",
        interface_name="添加重点池个股",
        request_url="/api/focus-watchlist",
        request_params=stock_data.dict(),
        response_status="SUCCESS",
        response_summary=f"添加 {db_stock.name} ({db_stock.symbol}) 至个人重点池",
        duration_ms=4
    )
    
    return db_stock


@app.put("/api/focus-watchlist/{symbol}", response_model=FocusStockResponse)
async def update_focus_stock(symbol: str, update_data: FocusStockUpdate, db: AsyncSession = Depends(get_db)):
    """
    对重点池中的个股进行结构化更新并记录审计
    """
    res = await db.execute(select(FocusStock).where(FocusStock.symbol == symbol))
    db_stock = res.scalars().first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="重点筛选池中未找到该股票。")
    
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(db_stock, key, value)
    
    await db.commit()
    await db.refresh(db_stock)
    
    # Non-blocking async audit log trigger
    from .utils.audit import record_audit_log_sync
    record_audit_log_sync(
        service_name="策略引擎",
        interface_name="更新重点池个股",
        request_url=f"/api/focus-watchlist/{symbol}",
        request_params=update_data.dict(exclude_unset=True),
        response_status="SUCCESS",
        response_summary=f"更新重点池 {db_stock.name} ({db_stock.symbol}) 的配置结构",
        duration_ms=3
    )
    
    return db_stock


@app.delete("/api/focus-watchlist/{symbol}")
async def delete_from_focus_watchlist(symbol: str, db: AsyncSession = Depends(get_db)):
    """
    从重点池中移出个股并记录审计
    """
    res = await db.execute(select(FocusStock).where(FocusStock.symbol == symbol))
    db_stock = res.scalars().first()
    if not db_stock:
        raise HTTPException(status_code=404, detail="重点筛选池中未找到该股票。")
    
    await db.delete(db_stock)
    await db.commit()
    
    # Non-blocking async audit log trigger
    from .utils.audit import record_audit_log_sync
    record_audit_log_sync(
        service_name="策略引擎",
        interface_name="移出重点池个股",
        request_url=f"/api/focus-watchlist/{symbol}",
        request_params={"symbol": symbol},
        response_status="SUCCESS",
        response_summary=f"移出重点池个股 {db_stock.name} ({db_stock.symbol})",
        duration_ms=2
    )
    
    return {"success": True, "message": f"成功从重点筛选池中移出个股 {db_stock.name} ({db_stock.symbol})"}


# ==========================================
# 10. AI 投研产业链驾驶舱 (Cockpit) APIs
# ==========================================

@app.get("/api/cockpit/sectors", response_model=List[ResearchSectorResponse])
async def get_cockpit_sectors(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ResearchSector))
    return res.scalars().all()

@app.post("/api/cockpit/sectors", response_model=ResearchSectorResponse)
async def create_cockpit_sector(sector: ResearchSectorCreate, db: AsyncSession = Depends(get_db)):
    db_sector = ResearchSector(**sector.dict())
    db.add(db_sector)
    await db.commit()
    await db.refresh(db_sector)
    return db_sector

@app.get("/api/cockpit/sectors/{sector_id}/nodes", response_model=List[IndustryChainNodeResponse])
async def get_cockpit_nodes(sector_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(IndustryChainNode).where(IndustryChainNode.sector_id == sector_id))
    return res.scalars().all()

@app.get("/api/cockpit/sectors/{sector_id}/costs", response_model=List[CostStructureResponse])
async def get_cockpit_costs(sector_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(CostStructure).where(CostStructure.sector_id == sector_id))
    return res.scalars().all()

@app.get("/api/cockpit/sectors/{sector_id}/conclusions", response_model=List[ResearchConclusionResponse])
async def get_cockpit_conclusions(sector_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ResearchConclusion).where(ResearchConclusion.sector_id == sector_id))
    return res.scalars().all()

@app.get("/api/cockpit/sectors/{sector_id}/reports", response_model=List[ResearchReportResponse])
async def get_cockpit_reports(sector_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ResearchReport).where(ResearchReport.sector_id == sector_id))
    return res.scalars().all()

@app.get("/api/cockpit/conclusions/{conclusion_id}/evidences", response_model=List[EvidenceResponse])
async def get_cockpit_evidences(conclusion_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Evidence).where(Evidence.conclusion_id == conclusion_id))
    return res.scalars().all()


def map_model_config(cfg: ModelConfig) -> ModelConfigResponse:
    caps = []
    if cfg.capabilities:
        caps = [c.strip() for c in cfg.capabilities.split(",") if c.strip()]
    return ModelConfigResponse(
        id=cfg.id,
        name=cfg.name,
        identifier=cfg.identifier,
        provider=cfg.provider,
        description=cfg.description,
        api_key=cfg.api_key,
        base_url=cfg.base_url,
        is_default=cfg.is_default,
        capabilities=caps,
        status=cfg.status or "unknown",
        error_message=cfg.error_message,
        latency_ms=cfg.latency_ms or 0,
        tested_at=cfg.tested_at,
        sort_order=cfg.sort_order or 0
    )


@app.get("/api/models", response_model=List[ModelConfigResponse])
async def list_models(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ModelConfig).order_by(ModelConfig.sort_order.asc(), ModelConfig.id.asc()))
    models = res.scalars().all()
    return [map_model_config(m) for m in models]


@app.post("/api/models", response_model=ModelConfigResponse)
async def create_model(model_data: ModelConfigCreate, db: AsyncSession = Depends(get_db)):
    caps_str = ",".join(model_data.capabilities) if model_data.capabilities else ""
    
    # If is_default is "true", reset all other models to "false"
    if model_data.is_default == "true":
        from sqlalchemy import update
        await db.execute(
            update(ModelConfig)
            .values(is_default="false")
        )
    
    db_model = ModelConfig(
        name=model_data.name,
        identifier=model_data.identifier,
        provider=model_data.provider,
        description=model_data.description,
        api_key=model_data.api_key,
        base_url=model_data.base_url,
        is_default=model_data.is_default or "false",
        capabilities=caps_str,
        sort_order=model_data.sort_order or 0,
        status="unknown",
        latency_ms=0
    )
    db.add(db_model)
    await db.commit()
    await db.refresh(db_model)
    return map_model_config(db_model)


@app.put("/api/models/{model_id}", response_model=ModelConfigResponse)
async def update_model(model_id: int, model_data: ModelConfigUpdate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ModelConfig).where(ModelConfig.id == model_id))
    db_model = res.scalars().first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model config not found")
    
    data_dict = model_data.dict(exclude_unset=True)
    
    # If is_default is changing to "true", reset all other models to "false"
    if data_dict.get("is_default") == "true":
        from sqlalchemy import update
        await db.execute(
            update(ModelConfig)
            .where(ModelConfig.id != model_id)
            .values(is_default="false")
        )
        
    if "capabilities" in data_dict:
        caps = data_dict.pop("capabilities")
        db_model.capabilities = ",".join(caps) if caps else ""
        
    for k, v in data_dict.items():
        setattr(db_model, k, v)
        
    await db.commit()
    await db.refresh(db_model)
    return map_model_config(db_model)


@app.delete("/api/models/{model_id}")
async def delete_model(model_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ModelConfig).where(ModelConfig.id == model_id))
    db_model = res.scalars().first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model config not found")
    await db.delete(db_model)
    await db.commit()
    return {"success": True, "message": "Model config deleted successfully"}


class UnsavedTestRequest(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    identifier: Optional[str] = None
    provider: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None


@app.post("/api/models/test")
async def test_model_connection(req: UnsavedTestRequest, db: AsyncSession = Depends(get_db)):
    import random
    from datetime import datetime
    
    # Simulating connection test
    model_name = ""
    api_key = ""
    base_url = ""
    db_model = None
    
    if req.id is not None:
        res = await db.execute(select(ModelConfig).where(ModelConfig.id == req.id))
        db_model = res.scalars().first()
        if not db_model:
            raise HTTPException(status_code=404, detail="Model config not found")
        model_name = db_model.name
        api_key = db_model.api_key or ""
        base_url = db_model.base_url or ""
    else:
        model_name = req.name or ""
        api_key = req.api_key or ""
        base_url = req.base_url or ""
        
    # Simulate validation rules
    if req.id is None and (not req.identifier or not req.provider):
        return {
            "status": "failed",
            "error_message": "Missing required fields: provider or identifier",
            "latency_ms": 0,
            "tested_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    success = True
    error_msg = None
    latency = random.randint(45, 185)
    
    if api_key == "fail" or (base_url and "invalid" in base_url):
        success = False
        error_msg = "Connection timed out or API key is invalid"
        latency = 0
        
    tested_at_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    status_str = "success" if success else "failed"
    
    if db_model:
        db_model.status = status_str
        db_model.error_message = error_msg
        db_model.latency_ms = latency
        db_model.tested_at = tested_at_str
        await db.commit()
        
    # Record to ModelLog for verification/audit
    import json
    from datetime import timedelta
    started_at_str = (datetime.now() - timedelta(milliseconds=latency)).strftime("%Y-%m-%d %H:%M:%S")
    ended_at_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    test_log = ModelLog(
        task_name="模型连接测试",
        task_id=f"TEST_{int(datetime.now().timestamp())}",
        username="admin",
        user_id="1",
        model_id=db_model.identifier if db_model else (req.identifier or "unknown"),
        model_url=base_url or "https://api.openai.com/v1",
        status_code="200" if success else "500",
        started_at=started_at_str,
        ended_at=ended_at_str,
        input_tokens=random.randint(10, 20),
        output_tokens=random.randint(20, 50) if success else 0,
        request_payload=json.dumps({
            "id": req.id,
            "name": model_name,
            "identifier": req.identifier or (db_model.identifier if db_model else None),
            "provider": req.provider or (db_model.provider if db_model else None),
            "base_url": base_url
        }, ensure_ascii=False),
        response_body=json.dumps({
            "status": status_str,
            "error_message": error_msg,
            "latency_ms": latency,
            "tested_at": tested_at_str
        }, ensure_ascii=False)
    )
    db.add(test_log)
    await db.commit()
        
    return {
        "status": status_str,
        "error_message": error_msg,
        "latency_ms": latency,
        "tested_at": tested_at_str
    }


if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)


