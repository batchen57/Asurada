from sqlalchemy import Column, Integer, String, Float, Boolean
from .database import Base

class Stock(Base):
    __tablename__ = "stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class DailyPrice(Base):
    __tablename__ = "daily_prices"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    date = Column(String, index=True, nullable=False) # YYYY-MM-DD
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    ma5 = Column(Float, nullable=True)
    ma10 = Column(Float, nullable=True)
    ma20 = Column(Float, nullable=True)
    ma50 = Column(Float, nullable=True)
    ma150 = Column(Float, nullable=True)
    ma200 = Column(Float, nullable=True)
    volatility_score = Column(Float, nullable=True)

class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    volume = Column(Float, default=0.0)
    available_volume = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    current_price = Column(Float, default=0.0)

class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, nullable=False) # YYYY-MM-DD HH:MM
    symbol = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    direction = Column(String, nullable=False) # 买入 / 关注 / 卖出
    strategy_type = Column(String, nullable=False) # VCP / Brooks
    trigger_reason = Column(String, nullable=True)
    status = Column(String, default="已触发") # 已触发 / 观察中 / 已完成

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    phase = Column(String, index=True, nullable=False) # Plan / Observe / Review / Iterate
    task_name = Column(String, nullable=False)
    status = Column(String, default="去完成") # 去完成 / 进行中 / 待开始 / 已完成
    result_content = Column(String, nullable=True)

class SystemStatus(Base):
    __tablename__ = "system_status"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, unique=True, index=True, nullable=False) # 数据服务 / 策略引擎 / 智能体服务 / 信号与告警
    status = Column(String, default="正常") # 正常 / 异常
    detail = Column(String, nullable=True)

class Configuration(Base):
    __tablename__ = "configuration"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, index=True, nullable=False)
    service_name = Column(String, index=True, nullable=False)
    interface_name = Column(String, index=True, nullable=False)
    request_url = Column(String, nullable=False)
    request_params = Column(String, nullable=True)
    response_status = Column(String, index=True, nullable=False)
    response_summary = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=False)
    operator = Column(String, nullable=True, default="system")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    role = Column(String, default="admin", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(String, nullable=False)


class FocusStock(Base):
    __tablename__ = "focus_stocks"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    added_at = Column(String, nullable=False)
    rating = Column(String, nullable=True, default="⭐ 中线关注")
    custom_tags = Column(String, nullable=True, default="")
    investment_logic = Column(String, nullable=True, default="")
    target_price = Column(Float, nullable=True)
    stop_loss = Column(Float, nullable=True)
    notes = Column(String, nullable=True, default="")


# ==========================================
# AI 投研产业链驾驶舱 Models
# ==========================================

class ResearchSector(Base):
    __tablename__ = "research_sectors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="未开始")
    report_count = Column(Integer, default=0)
    analysis_status = Column(String, default="未生成")
    opportunity_level = Column(String, default="B")
    risk_level = Column(String, default="中")
    last_updated_at = Column(String, nullable=True)
    created_by = Column(String, default="system")

class ResearchReport(Base):
    __tablename__ = "research_reports"
    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, index=True, nullable=False)
    title = Column(String, nullable=False)
    institution = Column(String, nullable=True)
    author = Column(String, nullable=True)
    publish_date = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    parse_status = Column(String, default="已导入")
    quality_score = Column(Float, default=0.0)
    summary = Column(String, nullable=True)
    created_at = Column(String, nullable=False)

class IndustryChainNode(Base):
    __tablename__ = "industry_chain_nodes"
    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, index=True, nullable=False)
    name = Column(String, nullable=False)
    node_type = Column(String, default="中游制造")
    parent_id = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
    cost_ratio = Column(String, nullable=True)
    localization_rate = Column(String, default="中")
    barrier_score = Column(Float, default=50.0)
    substitution_risk_score = Column(Float, default=50.0)
    investment_score = Column(Float, default=50.0)

class CostStructure(Base):
    __tablename__ = "cost_structures"
    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, index=True, nullable=False)
    node_id = Column(Integer, index=True, nullable=False)
    module_name = Column(String, nullable=False)
    current_cost = Column(String, nullable=True)
    target_cost = Column(String, nullable=True)
    cost_ratio = Column(String, nullable=True)
    decline_rate = Column(String, nullable=True)
    year = Column(String, nullable=True)
    source_type = Column(String, default="AI推算")
    confidence_score = Column(Float, default=0.0)

class ResearchConclusion(Base):
    __tablename__ = "research_conclusions"
    id = Column(Integer, primary_key=True, index=True)
    sector_id = Column(Integer, index=True, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(Integer, nullable=True)
    conclusion_type = Column(String, nullable=False)
    content = Column(String, nullable=False)
    confidence_score = Column(Float, default=0.0)
    risk_level = Column(String, default="中")
    created_by_ai = Column(Boolean, default=True)
    review_status = Column(String, default="待复核")
    created_at = Column(String, nullable=False)

class Evidence(Base):
    __tablename__ = "evidences"
    id = Column(Integer, primary_key=True, index=True)
    conclusion_id = Column(Integer, index=True, nullable=False)
    report_id = Column(Integer, index=True, nullable=True)
    chunk_id = Column(Integer, nullable=True)
    page_no = Column(String, nullable=True)
    original_text = Column(String, nullable=False)
    evidence_type = Column(String, default="研报原文")
    confidence_score = Column(Float, default=0.0)


class ModelConfig(Base):
    __tablename__ = "model_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    identifier = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    description = Column(String, nullable=True)
    api_key = Column(String, nullable=True)
    base_url = Column(String, nullable=True)
    is_default = Column(String, default="false")
    capabilities = Column(String, nullable=True)  # stored as comma-separated string
    status = Column(String, default="unknown")
    error_message = Column(String, nullable=True)
    latency_ms = Column(Integer, default=0)
    tested_at = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)


class ModelLog(Base):
    __tablename__ = "model_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String, nullable=True)
    task_id = Column(String, index=True, nullable=False)
    username = Column(String, nullable=True)
    user_id = Column(String, nullable=True)
    model_id = Column(String, index=True, nullable=False)
    model_url = Column(String, nullable=False)
    status_code = Column(String, index=True, nullable=False)
    started_at = Column(String, nullable=False)
    ended_at = Column(String, nullable=False)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    request_payload = Column(String, nullable=True)
    response_body = Column(String, nullable=True)


