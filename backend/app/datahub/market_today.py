import re
import time
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from .sina_sim import SinaMCPSimulator
from .tushare_sim import get_tushare_daily, get_tushare_financial_specs
from ..utils.audit import record_audit_log_sync


MARKET_LEADER_DEFS = [
    {
        "sector": "新能源锂电",
        "theme": "储能、动力电池",
        "symbol": "300750.SZ",
        "name": "宁德时代",
        "role": "全球动力电池龙头",
        "signal": "跟踪放量突破与回踩承接",
        "risk": "短线波动受锂价与新能源车景气预期影响",
    },
    {
        "sector": "白酒",
        "theme": "消费复苏、现金流资产",
        "symbol": "600519.SH",
        "name": "贵州茅台",
        "role": "高端白酒定价锚",
        "signal": "观察机构底仓稳定性与成交额变化",
        "risk": "估值弹性弱，趋势确认前不宜追高",
    },
    {
        "sector": "医疗器械",
        "theme": "国产替代、设备更新",
        "symbol": "300760.SZ",
        "name": "迈瑞医疗",
        "role": "医疗设备平台型龙头",
        "signal": "关注长均线附近承接强度",
        "risk": "行业政策扰动仍会影响估值修复节奏",
    },
    {
        "sector": "半导体",
        "theme": "先进封装、国产算力",
        "symbol": "688981.SH",
        "name": "中芯国际",
        "role": "晶圆代工核心龙头",
        "signal": "板块资金聚焦时通常先看成交额确认",
        "risk": "高弹性行业，需防止题材拥挤后的快速回撤",
    },
    {
        "sector": "人工智能",
        "theme": "大模型、算力基础设施",
        "symbol": "002230.SZ",
        "name": "科大讯飞",
        "role": "中文 AI 应用龙头",
        "signal": "观察分歧震荡后的右侧突破",
        "risk": "题材交易属性强，单日冲高回落概率较高",
    },
    {
        "sector": "证券",
        "theme": "活跃资本市场",
        "symbol": "600030.SH",
        "name": "中信证券",
        "role": "券商板块权重龙头",
        "signal": "指数成交量回暖时具备 Beta 修复弹性",
        "risk": "高度依赖两市成交额连续性",
    },
    {
        "sector": "汽车整车",
        "theme": "智能驾驶、出口链",
        "symbol": "002594.SZ",
        "name": "比亚迪",
        "role": "新能源整车与电池一体化龙头",
        "signal": "观察低波动整理后的均线抬升",
        "risk": "价格战会压制利润率预期",
    },
    {
        "sector": "房地产",
        "theme": "政策修复、信用出清",
        "symbol": "000002.SZ",
        "name": "万科A",
        "role": "房企信用样本龙头",
        "signal": "只做风险观察，不做趋势确认前的主动加仓",
        "risk": "若继续弱于均线系统，仍按回避名单处理",
    },
]


def _to_sina_symbol(symbol: str) -> str:
    code, market = symbol.split(".")
    if market == "SH":
        return f"sh{code}"
    return f"sz{code}"


def _parse_sina_quote_line(line: str, symbol_map: Dict[str, Dict[str, str]]) -> Optional[Dict[str, Any]]:
    match = re.match(r'var hq_str_(?P<sina>[a-z]{2}\d{6})="(?P<body>.*)";', line.strip())
    if not match:
        return None

    sina_symbol = match.group("sina")
    leader = symbol_map.get(sina_symbol)
    if not leader:
        return None

    fields = match.group("body").split(",")
    if len(fields) < 32 or not fields[0]:
        return None

    try:
        open_price = float(fields[1] or 0.0)
        prev_close = float(fields[2] or 0.0)
        current_price = float(fields[3] or 0.0)
        high = float(fields[4] or 0.0)
        low = float(fields[5] or 0.0)
        volume = float(fields[8] or 0.0)
        amount = float(fields[9] or 0.0)
    except ValueError:
        return None

    price = current_price or prev_close or open_price
    base = prev_close or price or 1.0
    change_pct = ((price - base) / base) * 100.0 if base else 0.0
    amplitude = ((high - low) / base) * 100.0 if base and high and low else 0.0
    quote_time = f"{fields[30]} {fields[31]}".strip()

    return {
        "symbol": leader["symbol"],
        "name": fields[0] or leader["name"],
        "price": round(price, 2),
        "change_pct": round(change_pct, 2),
        "turnover_billion": round(amount / 100000000.0, 2),
        "amplitude": round(amplitude, 2),
        "volume": volume,
        "quote_time": quote_time,
    }


def _fallback_quotes(leader_defs: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Dict[str, Any]]:
    defs = leader_defs if leader_defs is not None else MARKET_LEADER_DEFS
    simulator_quotes = SinaMCPSimulator.get_realtime_quotes()
    quotes = {
        symbol: {
            **quote,
            "turnover_billion": round((quote.get("price", 0.0) * quote.get("volume", 0.0) * 100.0) / 100000000.0, 2),
            "amplitude": round(((quote.get("high", 0.0) - quote.get("low", 0.0)) / max(quote.get("open", 1.0), 1.0)) * 100.0, 2),
            "quote_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }
        for symbol, quote in simulator_quotes.items()
    }

    for leader in defs:
        symbol = leader["symbol"]
        if symbol in quotes:
            continue

        daily = get_tushare_daily(symbol, limit=2)
        if not daily:
            continue

        latest = daily[-1]
        previous = daily[-2] if len(daily) > 1 else latest
        price = float(latest["close"])
        base = float(previous["close"]) or price or 1.0
        high = float(latest["high"])
        low = float(latest["low"])
        volume = float(latest["volume"])

        quotes[symbol] = {
            "symbol": symbol,
            "name": leader["name"],
            "price": round(price, 2),
            "change_pct": round(((price - base) / base) * 100.0, 2) if base else 0.0,
            "turnover_billion": round((price * volume) / 100000000.0, 2),
            "amplitude": round(((high - low) / base) * 100.0, 2) if base else 0.0,
            "volume": volume,
            "quote_time": latest.get("date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

    return quotes


def fetch_sina_realtime_quotes(leader_defs: Optional[List[Dict[str, Any]]] = None) -> tuple[Dict[str, Dict[str, Any]], str, bool]:
    from .tushare_sim import is_simulation_mode
    defs = leader_defs if leader_defs is not None else MARKET_LEADER_DEFS
    if is_simulation_mode():
        return _fallback_quotes(leader_defs=defs), "本地模拟行情降级", False

    start_time = time.time()
    symbol_map = {_to_sina_symbol(item["symbol"]): item for item in defs}
    sina_symbols = ",".join(symbol_map.keys())
    url = f"https://hq.sinajs.cn/list={sina_symbols}"

    try:
        with httpx.Client(headers={"Referer": "https://finance.sina.com.cn/"}, timeout=1.5) as client:
            response = client.get(url)
            response.raise_for_status()

        text = response.content.decode("gb18030", errors="ignore")
        quotes: Dict[str, Dict[str, Any]] = {}
        for line in text.splitlines():
            parsed = _parse_sina_quote_line(line, symbol_map)
            if parsed:
                quotes[parsed["symbol"]] = parsed

        if len(quotes) >= 4:
            duration_ms = int((time.time() - start_time) * 1000)
            record_audit_log_sync(
                service_name="新浪实时行情服务 (Sina Finance)",
                interface_name="hq.sinajs.cn A股实时快照",
                request_url=url,
                request_params={"symbols": [item["symbol"] for item in defs]},
                response_status="SUCCESS",
                response_summary=f"[实盘] 成功获取 {len(quotes)} 只A股板块龙头实时行情快照",
                duration_ms=duration_ms,
            )
            return quotes, "Sina Finance 实时行情", True
    except Exception as exc:
        duration_ms = int((time.time() - start_time) * 1000)
        record_audit_log_sync(
            service_name="新浪实时行情服务 (Sina Finance)",
            interface_name="hq.sinajs.cn A股实时快照",
            request_url=url,
            request_params={"symbols": [item["symbol"] for item in defs]},
            response_status="FAILED",
            response_summary=f"[实盘] 请求失败，今日股市模块降级至本地缓存: {exc}",
            duration_ms=duration_ms,
        )

    return _fallback_quotes(leader_defs=defs), "本地模拟行情降级", False


def get_today_market_snapshot(leader_defs: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    defs = leader_defs if leader_defs is not None else MARKET_LEADER_DEFS
    quotes, quote_source, is_realtime = fetch_sina_realtime_quotes(leader_defs=defs)
    symbols = [item["symbol"] for item in defs]
    specs = get_tushare_financial_specs(symbols)
    has_real_fundamentals = any("total_mv_billion" in item for item in specs.values())

    leaders = []
    quote_times: List[str] = []
    for leader_def in defs:
        symbol = leader_def["symbol"]
        quote = quotes.get(symbol)
        if not quote:
            continue

        stock_specs = specs.get(symbol, {})
        market_cap = stock_specs.get("total_mv_billion")
        if market_cap is None and stock_specs.get("shares_billion") and quote.get("price"):
            market_cap = float(stock_specs["shares_billion"]) * float(quote["price"])

        quote_time = quote.get("quote_time") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        quote_times.append(quote_time)

        leaders.append({
            **leader_def,
            "name": quote.get("name") or leader_def["name"],
            "price": quote["price"],
            "change_pct": quote["change_pct"],
            "turnover_billion": quote["turnover_billion"],
            "market_cap_billion": round(market_cap, 1) if market_cap is not None else None,
            "pe": round(float(stock_specs["pe"]), 1) if stock_specs.get("pe") is not None else None,
            "amplitude": quote["amplitude"],
            "quote_time": quote_time,
        })

    snapshot_time = max(quote_times) if quote_times else datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return {
        "success": bool(leaders),
        "snapshot_time": snapshot_time,
        "quote_source": quote_source,
        "fundamentals_source": "Tushare Pro daily_basic" if has_real_fundamentals else "内置估值缓存降级",
        "is_realtime": is_realtime,
        "leaders": leaders,
    }
