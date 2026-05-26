import os
import uvicorn
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from .database import get_db, engine
from .models import Stock, DailyPrice, Position, Signal, Task, SystemStatus, Configuration, AuditLog
from .schemas import (
    StockResponse, DailyPriceResponse, PositionResponse, PositionCreate, PositionUpdate,
    SignalResponse, TaskResponse, TaskUpdate, SystemStatusResponse, ConfigurationResponse,
    ConfigurationUpdate, WorkbenchDataResponse, OverviewResponse,
    DiscoveryConfigResponse, DiscoveryConfigUpdate,
    DiscoveryScanResponse, DeepResearchResponse, DeepResearchRequest,
    AuditLogResponse, AuditLogStatsResponse
)
from .datahub.loader import initialize_db_schema, seed_database
from .datahub.sina_sim import SinaMCPSimulator
from .datahub.discovery_engine import DiscoveryEngine
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
        data_cutoff=indices_data["data_cutoff"]
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

# 2. Stock Watchlist APIs
@app.get("/api/stocks", response_model=List[StockResponse])
async def get_stocks(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Stock))
    return res.scalars().all()

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

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)


