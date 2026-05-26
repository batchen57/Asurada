from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class StockBase(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    is_active: Optional[bool] = True

class StockResponse(StockBase):
    id: int
    class Config:
        from_attributes = True

class DailyPriceResponse(BaseModel):
    id: int
    symbol: str
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    ma5: Optional[float] = None
    ma10: Optional[float] = None
    ma20: Optional[float] = None
    ma50: Optional[float] = None
    ma150: Optional[float] = None
    ma200: Optional[float] = None
    volatility_score: Optional[float] = None
    class Config:
        from_attributes = True

class PositionBase(BaseModel):
    symbol: str
    name: str
    volume: float
    available_volume: float
    cost_price: float
    current_price: float

class PositionCreate(PositionBase):
    pass

class PositionUpdate(BaseModel):
    volume: Optional[float] = None
    available_volume: Optional[float] = None
    cost_price: Optional[float] = None
    current_price: Optional[float] = None

class PositionResponse(PositionBase):
    id: int
    class Config:
        from_attributes = True

class SignalResponse(BaseModel):
    id: int
    timestamp: str
    symbol: str
    name: str
    direction: str
    strategy_type: str
    trigger_reason: Optional[str] = None
    status: str
    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: int
    phase: str
    task_name: str
    status: str
    result_content: Optional[str] = None
    class Config:
        from_attributes = True

class TaskUpdate(BaseModel):
    status: str
    result_content: Optional[str] = None

class SystemStatusResponse(BaseModel):
    id: int
    service_name: str
    status: str
    detail: Optional[str] = None
    class Config:
        from_attributes = True

class ConfigurationResponse(BaseModel):
    id: int
    key: str
    value: str
    class Config:
        from_attributes = True

class ConfigurationUpdate(BaseModel):
    value: str

class OverviewResponse(BaseModel):
    indices: List[Dict[str, Any]]
    turnover_billion: float
    turnover_change_pct: float
    data_cutoff: str

class WorkbenchDataResponse(BaseModel):
    overview: OverviewResponse
    positions: List[PositionResponse]
    tasks: List[TaskResponse]
    signals: List[SignalResponse]
    system_status: List[SystemStatusResponse]

# Discovery (选股与题材) Schemas
class DiscoveryConfigResponse(BaseModel):
    sectors: str
    avoid_sectors: str
    min_market_cap: float
    min_daily_turnover: float
    trading_style: str
    history_window_days: int

class DiscoveryConfigUpdate(BaseModel):
    sectors: str
    avoid_sectors: str
    min_market_cap: float
    min_daily_turnover: float
    trading_style: str
    history_window_days: int

class DiscoveryStockDetail(BaseModel):
    symbol: str
    name: str
    sector: str
    price: float
    total_score: float
    trend_score: float
    fundamental_score: float
    risk_score: float
    reasons: List[str]
    key_threshold: str
    risk_points: List[str]
    next_steps: List[str]
    is_st: bool
    is_suspended: bool
    market_cap: float
    daily_turnover: float
    status: str
    contractions: Optional[str] = None

class DiscoveryScanResponse(BaseModel):
    success: bool
    timestamp: str
    total_scanned: int
    total_passed_layer1: int
    candidates: List[DiscoveryStockDetail]
    top_n: List[DiscoveryStockDetail]
    additions: List[str]
    removals: List[str]

class DeepResearchRequest(BaseModel):
    symbol: str

class DeepResearchResponse(BaseModel):
    symbol: str
    name: str
    report_markdown: str
    generated_at: str

class AuditLogResponse(BaseModel):
    id: int
    timestamp: str
    service_name: str
    interface_name: str
    request_url: str
    request_params: Optional[str] = None
    response_status: str
    response_summary: Optional[str] = None
    duration_ms: int
    class Config:
        from_attributes = True

class AuditLogStatsResponse(BaseModel):
    total_calls: int
    success_rate: float
    today_calls: int
    avg_latency_ms: float


