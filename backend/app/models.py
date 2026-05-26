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

