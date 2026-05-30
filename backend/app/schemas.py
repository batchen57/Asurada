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
    is_realtime: Optional[bool] = False

class WorkbenchDataResponse(BaseModel):
    overview: OverviewResponse
    positions: List[PositionResponse]
    tasks: List[TaskResponse]
    signals: List[SignalResponse]
    system_status: List[SystemStatusResponse]

class DataHubSourceStatus(BaseModel):
    name: str
    status: str
    detail: str
    requests_made: Optional[int] = None
    quota_limit: Optional[int] = None
    quota_remaining: Optional[int] = None
    rate_limit_per_min: Optional[int] = None
    current_rate: Optional[int] = None

class DataHubTableSummary(BaseModel):
    name: str
    label: str
    count: int
    cols: List[str]

class DataHubTableResponse(BaseModel):
    table: DataHubTableSummary
    rows: List[Dict[str, Any]]
    limit: int
    offset: int
    total: int

class DataHubOverviewResponse(BaseModel):
    generated_at: str
    database_url: str
    sources: List[DataHubSourceStatus]
    tables: List[DataHubTableSummary]

class DataHubSyncResponse(BaseModel):
    success: bool
    message: str
    synced_at: str
    updated_positions: int
    quote_count: int
    tables: List[DataHubTableSummary]

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

class TodayMarketLeaderResponse(BaseModel):
    sector: str
    theme: str
    symbol: str
    name: str
    price: float
    change_pct: float
    turnover_billion: float
    market_cap_billion: Optional[float] = None
    pe: Optional[float] = None
    amplitude: float
    role: str
    signal: str
    risk: str
    quote_time: str

class TodayMarketResponse(BaseModel):
    success: bool
    snapshot_time: str
    quote_source: str
    fundamentals_source: str
    is_realtime: bool
    leaders: List[TodayMarketLeaderResponse]

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
    operator: Optional[str] = "system"
    class Config:
        from_attributes = True

class AuditLogStatsResponse(BaseModel):
    total_calls: int
    success_rate: float
    today_calls: int
    avg_latency_ms: float

class SectorStockConfig(BaseModel):
    symbol: str
    name: str
    theme: str
    role: str
    signal: str
    risk: str

class HierarchicalSectorConfig(BaseModel):
    sector: str
    stocks: List[SectorStockConfig]


class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool
    created_at: str
    class Config:
        from_attributes = True

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "admin"
    is_active: Optional[bool] = True

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class FocusStockBase(BaseModel):
    symbol: str
    name: str
    sector: Optional[str] = None
    rating: Optional[str] = "⭐ 中线关注"
    custom_tags: Optional[str] = ""
    investment_logic: Optional[str] = ""
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    notes: Optional[str] = ""

class FocusStockCreate(FocusStockBase):
    pass

class FocusStockUpdate(BaseModel):
    rating: Optional[str] = None
    custom_tags: Optional[str] = None
    investment_logic: Optional[str] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    notes: Optional[str] = None

class FocusStockResponse(FocusStockBase):
    id: int
    added_at: str

# ==========================================
# AI 投研产业链驾驶舱 Schemas
# ==========================================

class ResearchSectorBase(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    status: Optional[str] = "未开始"
    report_count: Optional[int] = 0
    analysis_status: Optional[str] = "未生成"
    opportunity_level: Optional[str] = "B"
    risk_level: Optional[str] = "中"
    last_updated_at: Optional[str] = None
    created_by: Optional[str] = "system"

class ResearchSectorCreate(ResearchSectorBase):
    pass

class ResearchSectorResponse(ResearchSectorBase):
    id: int
    class Config:
        from_attributes = True

class IndustryChainNodeBase(BaseModel):
    sector_id: int
    name: str
    node_type: Optional[str] = "中游制造"
    parent_id: Optional[int] = None
    description: Optional[str] = None
    cost_ratio: Optional[str] = None
    localization_rate: Optional[str] = "中"
    barrier_score: Optional[float] = 50.0
    substitution_risk_score: Optional[float] = 50.0
    investment_score: Optional[float] = 50.0

class IndustryChainNodeCreate(IndustryChainNodeBase):
    pass

class IndustryChainNodeResponse(IndustryChainNodeBase):
    id: int
    class Config:
        from_attributes = True

class CostStructureBase(BaseModel):
    sector_id: int
    node_id: int
    module_name: str
    current_cost: Optional[str] = None
    target_cost: Optional[str] = None
    cost_ratio: Optional[str] = None
    decline_rate: Optional[str] = None
    year: Optional[str] = None
    source_type: Optional[str] = "AI推算"
    confidence_score: Optional[float] = 0.0

class CostStructureCreate(CostStructureBase):
    pass

class CostStructureResponse(CostStructureBase):
    id: int
    class Config:
        from_attributes = True

class ResearchConclusionBase(BaseModel):
    sector_id: int
    target_type: str
    target_id: Optional[int] = None
    conclusion_type: str
    content: str
    confidence_score: Optional[float] = 0.0
    risk_level: Optional[str] = "中"
    created_by_ai: Optional[bool] = True
    review_status: Optional[str] = "待复核"
    created_at: str

class ResearchConclusionResponse(ResearchConclusionBase):
    id: int
    class Config:
        from_attributes = True

class ResearchReportBase(BaseModel):
    sector_id: int
    title: str
    institution: Optional[str] = None
    author: Optional[str] = None
    publish_date: Optional[str] = None
    file_url: Optional[str] = None
    parse_status: Optional[str] = "已导入"
    quality_score: Optional[float] = 0.0
    summary: Optional[str] = None
    created_at: str

class ResearchReportResponse(ResearchReportBase):
    id: int
    class Config:
        from_attributes = True

class EvidenceBase(BaseModel):
    conclusion_id: int
    report_id: Optional[int] = None
    chunk_id: Optional[int] = None
    page_no: Optional[str] = None
    original_text: str
    evidence_type: Optional[str] = "研报原文"
    confidence_score: Optional[float] = 0.0

class EvidenceResponse(EvidenceBase):
    id: int
    class Config:
        from_attributes = True


class ModelConfigBase(BaseModel):
    name: str
    identifier: str
    provider: str
    description: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    is_default: Optional[str] = "false"
    capabilities: Optional[List[str]] = []

class ModelConfigCreate(ModelConfigBase):
    sort_order: Optional[int] = 0

class ModelConfigUpdate(BaseModel):
    name: Optional[str] = None
    identifier: Optional[str] = None
    provider: Optional[str] = None
    description: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    is_default: Optional[str] = None
    capabilities: Optional[List[str]] = None
    sort_order: Optional[int] = None
    status: Optional[str] = None
    error_message: Optional[str] = None
    latency_ms: Optional[int] = None
    tested_at: Optional[str] = None

class ModelConfigResponse(BaseModel):
    id: int
    name: str
    identifier: str
    provider: str
    description: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    is_default: str
    capabilities: List[str]
    status: str
    error_message: Optional[str] = None
    latency_ms: int
    tested_at: Optional[str] = None
    sort_order: int

    class Config:
        from_attributes = True


class ModelLogResponse(BaseModel):
    id: int
    task_name: Optional[str] = None
    task_id: str
    username: Optional[str] = None
    user_id: Optional[str] = None
    model_id: str
    model_url: str
    status_code: str
    started_at: str
    ended_at: str
    input_tokens: int
    output_tokens: int
    request_payload: Optional[Any] = None
    response_body: Optional[Any] = None

    class Config:
        from_attributes = True





