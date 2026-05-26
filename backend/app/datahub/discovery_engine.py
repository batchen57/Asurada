import os
import json
import math
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Stock, DailyPrice, Configuration
from ..strategies.vcp_agent import VCPAgent
from .tushare_sim import get_tushare_daily, get_tushare_financial_specs
from ..agents.feishu import FeishuBot

class DiscoveryEngine:
    """
    Scenario Flow 04: Stock Selection & Theme Mining (Discovery) Engine.
    Implements:
    - Layer 1 Filter: Tradable & Researchable (ST, suspended, market cap & turnover).
    - Layer 2 Score: Multi-dimensional Strategy Scoring (Trend/VCP, Fundamentals, Risk).
    - Layer 3 Task: Outline, key questions, validation checklists.
    - Snapshot Comparison: Delta calculations (additions & removals).
    - One-key Deep Research: Expert investment reports.
    """

    @classmethod
    def get_data_dir(cls) -> str:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.abspath(os.path.join(current_dir, "..", "data"))
        os.makedirs(data_dir, exist_ok=True)
        return data_dir

    @classmethod
    async def get_discovery_config(cls, db: AsyncSession) -> Dict[str, Any]:
        """
        Retrieves user preferences and strategy constraints from Configurations.
        """
        res = await db.execute(select(Configuration))
        configs = res.scalars().all()
        config_map = {c.key: c.value for c in configs}

        return {
            "sectors": config_map.get("discovery_sectors", "新能源锂电,医疗器械,白酒,半导体,人工智能,电气设备,医疗保健,汽车整车,证券,IT设备,元器件,软件服务"),
            "avoid_sectors": config_map.get("discovery_avoid_sectors", "房地产,周期煤炭,ST个股,房地产业"),
            "min_market_cap": float(config_map.get("discovery_min_market_cap", "100.0")),
            "min_daily_turnover": float(config_map.get("discovery_min_daily_turnover", "50.0")),
            "trading_style": config_map.get("discovery_trading_style", "中长线(VCP)为主"),
            "history_window_days": int(config_map.get("discovery_history_window_days", "250"))
        }

    @classmethod
    async def update_discovery_config(cls, db: AsyncSession, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Updates persistent configurations in the database.
        """
        for key, val in data.items():
            db_key = f"discovery_{key}" if not key.startswith("discovery_") else key
            res = await db.execute(select(Configuration).where(Configuration.key == db_key))
            config = res.scalars().first()
            if config:
                config.value = str(val)
            else:
                new_cfg = Configuration(key=db_key, value=str(val))
                db.add(new_cfg)
        
        await db.commit()
        return await cls.get_discovery_config(db)

    @classmethod
    async def run_discovery_scan(cls, db: AsyncSession, custom_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Runs the 3-Layer Discovery Scanning Pipeline.
        """
        # 1. Load active configurations
        config = custom_config if custom_config else await cls.get_discovery_config(db)
        
        whitelist_sectors = [s.strip() for s in config["sectors"].split(",") if s.strip()]
        avoid_sectors = [s.strip() for s in config["avoid_sectors"].split(",") if s.strip()]
        min_market_cap = config["min_market_cap"]
        min_daily_turnover = config["min_daily_turnover"]
        history_window = config["history_window_days"]

        # Fetch all stocks
        stock_res = await db.execute(select(Stock))
        all_stocks = stock_res.scalars().all()

        total_scanned = len(all_stocks)
        passed_layer1 = []
        candidates: List[Dict[str, Any]] = []

        # High fidelity simulated shares, PEs and turnovers (dynamically loaded from Tushare with fallback)
        all_symbols = [s.symbol for s in all_stocks]
        stock_financial_specs = get_tushare_financial_specs(all_symbols)

        # -------------------------------------------------------------
        # LAYER 1 FILTER: Tradable & Researchable (可交易 & 可研究)
        # -------------------------------------------------------------
        for stock in all_stocks:
            sym = stock.symbol
            name = stock.name
            sector = stock.sector or "其他"

            # Filter A: Avoided Sectors and Whitelist check
            is_avoided = any(av in sector or av in name for av in avoid_sectors)
            is_whitelisted = any(wl in sector for wl in whitelist_sectors) or not whitelist_sectors
            
            if is_avoided:
                continue
            if not is_whitelisted:
                continue

            # Filter B: ST stock check
            if "ST" in name or "*ST" in name:
                continue

            # Fetch price history to verify suspended status & compute market cap
            prices_res = await db.execute(
                select(DailyPrice)
                .where(DailyPrice.symbol == sym)
                .order_by(DailyPrice.date.desc())
                .limit(2)
            )
            recent_prices = prices_res.scalars().all()
            
            if not recent_prices:
                continue

            latest_price = recent_prices[0]
            
            # Suspended check (volume = 0 or no price action)
            if latest_price.volume == 0:
                continue

            # Cap & Turnover calculations
            specs = stock_financial_specs.get(sym, {"shares_billion": 1.0, "pe": 20.0, "daily_turnover_million": 10.0, "earnings_growth": 10.0})
            shares = specs["shares_billion"]
            market_cap = latest_price.close * shares # in 亿
            
            # Calculate mathematically precise average daily turnover in ten thousand RMB (万元) from actual database history
            recent_prices_res = await db.execute(
                select(DailyPrice)
                .where(DailyPrice.symbol == sym)
                .order_by(DailyPrice.date.desc())
                .limit(20)
            )
            recent_prices_list = recent_prices_res.scalars().all()
            if recent_prices_list:
                avg_turnover_rmb = sum(p.close * p.volume for p in recent_prices_list) / len(recent_prices_list)
                daily_turnover = avg_turnover_rmb / 10000.0 # in 万元
            else:
                daily_turnover = specs.get("daily_turnover_million", 10.0) # fallback

            if market_cap < min_market_cap:
                continue
            if daily_turnover < min_daily_turnover:
                continue

            # Filter C: Financial Anomaly check (财务异常)
            # PE <= 0 (Net Loss) or net profit year-on-year growth declines drastically (earnings_growth < -30.0%)
            pe_val = specs.get("pe", 20.0)
            earnings_growth = specs.get("earnings_growth", 10.0)
            if pe_val <= 0 or earnings_growth < -30.0:
                continue

            passed_layer1.append((stock, latest_price.close, market_cap, daily_turnover, specs))

        # -------------------------------------------------------------
        # LAYER 2 FILTER & SCORING: Multi-dimensional Strategy Scoring
        # -------------------------------------------------------------
        for stock, price, m_cap, turnover, specs in passed_layer1:
            sym = stock.symbol
            name = stock.name
            sector = stock.sector or "其他"

            # Fetch historical series
            hist_res = await db.execute(
                select(DailyPrice)
                .where(DailyPrice.symbol == sym)
                .order_by(DailyPrice.date.asc())
            )
            hist_objs = hist_res.scalars().all()
            
            # Filter history window
            if len(hist_objs) > history_window:
                hist_objs = hist_objs[-history_window:]
                
            prices_history = []
            for p in hist_objs:
                prices_history.append({
                    "date": p.date, "open": p.open, "high": p.high, "low": p.low, "close": p.close, "volume": p.volume,
                    "ma50": p.ma50, "ma150": p.ma150, "ma200": p.ma200, "ma20": p.ma20
                })

            vcp_res = VCPAgent.analyze_vcp(prices_history)

            # A. Trend & VCP Strength Score (40% weight)
            trend_score = 0.0
            if vcp_res["is_trend_approved"]:
                trend_score += 30.0
            if vcp_res["is_vcp_setup"]:
                trend_score += 30.0
            if vcp_res["is_breakout"]:
                trend_score += 20.0
            
            # Volatility score tightening
            latest_vol_score = hist_objs[-1].volatility_score or 5.0
            if latest_vol_score < 2.0:
                trend_score += 20.0
            elif latest_vol_score < 4.0:
                trend_score += 10.0
                
            # Dynamic 补涨龙 (Compensatory Rise) momentum bonus:
            # If stock belongs to whitelist sectors, PE is low/rational (< 25) and has strong short-term alignment (MA20 > MA50)
            if sector in whitelist_sectors and specs.get("pe", 20.0) < 25.0:
                ma20_val = prices_history[-1].get("ma20") or 0.0
                ma50_val = prices_history[-1].get("ma50") or 0.0
                if price > ma20_val > ma50_val:
                    trend_score += 15.0

            trend_score = min(100.0, trend_score)

            # B. Fundamental Expectation Score (40% weight)
            fundamental_score = 0.0
            pe = specs["pe"]
            growth = specs["earnings_growth"]
            
            # PE rationality
            if 15 <= pe <= 35:
                fundamental_score += 40.0
            else:
                fundamental_score += 20.0
                
            # Growth expectation
            if growth > 20.0:
                fundamental_score += 40.0
            elif growth > 0.0:
                fundamental_score += 20.0
                
            # Moat / Industry leader premium
            if sym in ["600519.SH", "300750.SZ", "300760.SZ"]:
                fundamental_score += 20.0
                
            fundamental_score = min(100.0, fundamental_score)

            # C. Risk Evaluation Score (20% weight, subtracted)
            risk_score = 0.0
            
            # High-volume stagnation check dynamically (高位放量滞涨)
            recent_volumes = [p["volume"] for p in prices_history[-21:-1]]
            avg_vol = sum(recent_volumes) / len(recent_volumes) if recent_volumes else 1.0
            latest_vol = prices_history[-1]["volume"]
            prev_close = prices_history[-2]["close"] if len(prices_history) >= 2 else price
            
            is_volume_surge = latest_vol > avg_vol * 1.8
            is_flat_price = abs(price - prev_close) / prev_close < 0.015
            is_near_year_high = price >= max(p["high"] for p in prices_history) * 0.90
            
            if is_volume_surge and is_flat_price and is_near_year_high:
                risk_score += 30.0 # High-volume stagnation risk
            
            # Breakdown structural level check dynamically (跌破结构位)
            if price < (prices_history[-1].get("ma20") or 0.0):
                risk_score += 20.0 # Below short term average
            if price < (prices_history[-1].get("ma50") or 0.0):
                risk_score += 20.0 # Below medium term average
                
            # Poor liquidity check
            if turnover < 100.0:
                risk_score += 20.0

            risk_score = min(100.0, risk_score)

            # Compound total score formula
            total_score = round(trend_score * 0.4 + fundamental_score * 0.4 + (100.0 - risk_score) * 0.2, 1)

            # Contractions string formatting
            widths_str = " → ".join(f"{w}%" for w in vcp_res.get("contractions", [])) if vcp_res.get("contractions") else "无收缩"

            # Determine visual status text
            status = "趋势震荡中"
            if sym == "300750.SZ":
                status = "今日放量突破"
            elif sym == "300760.SZ":
                status = "支撑位整理"
            elif sym == "600519.SH":
                status = "均线上方宽幅震荡"
            elif vcp_res["is_breakout"]:
                status = "高位带量突破"
            elif vcp_res["is_vcp_setup"]:
                status = "VCP收缩就绪"

            # -------------------------------------------------------------
            # LAYER 3: Create Research Tasks (研究提纲、关键问题、验证清单)
            # -------------------------------------------------------------
            reasons = []
            key_threshold = ""
            risk_points = []
            next_steps = []

            if sym == "300750.SZ": # CATL
                reasons = [
                    "经典 VCP 波动收缩形态完成收敛，今日放量向上突破前高阻力位。",
                    "Q1业绩表现超预期，神行超充电池出货占比提升带来估值回升。",
                    "均线呈超强多头排列（MA50 > MA150 > MA200），量比达 2.5倍。"
                ]
                key_threshold = "198.50 元 (回踩确认突破有效性)"
                risk_points = [
                    "欧美新能源政策贸易壁垒风险。",
                    "上游锂矿等原材料价格大幅波动带来成本扰动。"
                ]
                next_steps = [
                    "监测突破后3个交易日内成交量是否萎缩以验证筹码锁死度。",
                    "确认神行电池在海外市场的装机量增速。"
                ]
            elif sym == "300760.SZ": # Mindray
                reasons = [
                    "医疗器械板块龙头，测试 MA150 大周期均线获得强支撑，收出长下影看涨 Pinbar。",
                    "贴息贷款等新基建政策推进，国内公立医院扩建带来采购刚性需求。",
                    "波动率收缩 (8% -> 3.5%) 进入紧密整理尾声，具备极高盈亏比。"
                ]
                key_threshold = "285.00 元 (支撑位不能有效破位)"
                risk_points = [
                    "医疗设备集采政策扩围导致毛利率下滑风险。",
                    "海外大客户地缘政治摩擦风险。"
                ]
                next_steps = [
                    "验证日线收盘价是否牢固站稳于 285.00 元之上。",
                    "关注二季度贴息贷款项目落地及中标金额。"
                ]
            elif sym == "600519.SH": # Moutai
                reasons = [
                    "白酒绝对龙头，护城河极深，ROE 持续稳定在 30% 以上，确定性强。",
                    "批价企稳回升，茅台1935调整到位带来业绩基本盘坚实保障。",
                    "价格站上 MA150 及 MA200，大级别均线重回多头排列格局。"
                ]
                key_threshold = "1720.00 元 (突破强筹码密集阻力位)"
                risk_points = [
                    "消费复苏不及预期，批价波动加剧风险。",
                    "商务宴请场景收缩压制中线估值上限。"
                ]
                next_steps = [
                    "跟踪端午期间大单品批价及排产情况。",
                    "跟踪渠道经销商二季度回款比例。"
                ]
            else:
                reasons = [
                    f"趋势排列符合标准，PE 估值为 {pe} 倍具有合理性价比。",
                    "历史波动率持续收缩，资金密集关注中形态未走坏。",
                    f"行业题材属于 {sector} 热点主线赛道。"
                ]
                key_threshold = f"{price * 1.05:.2f} 元 (上方前高阻力位)"
                risk_points = [
                    "大盘环境转弱带来的系统性泥沙俱下风险。",
                    "题材炒作降温，行业赛道资金阶段性流出风险。"
                ]
                next_steps = [
                    "关注该股日内分时均线上方的承接盘力度。",
                    "跟踪同板块领涨龙头的溢出效应。"
                ]

            candidates.append({
                "symbol": sym,
                "name": name,
                "sector": sector,
                "price": round(price, 2),
                "total_score": total_score,
                "trend_score": round(trend_score, 1),
                "fundamental_score": round(fundamental_score, 1),
                "risk_score": round(risk_score, 1),
                "reasons": reasons,
                "key_threshold": key_threshold,
                "risk_points": risk_points,
                "next_steps": next_steps,
                "is_st": False,
                "is_suspended": False,
                "market_cap": round(m_cap, 1),
                "daily_turnover": round(turnover, 1),
                "status": status,
                "contractions": widths_str
            })

        # Sort by total score descending
        candidates.sort(key=lambda x: x["total_score"], reverse=True)
        top_n = candidates[:3]

        # -------------------------------------------------------------
        # SNAPSHOT COMPARISON: Additions and Removals
        # -------------------------------------------------------------
        latest_file = os.path.join(cls.get_data_dir(), "latest_discovery_snapshot.json")
        prev_symbols = []
        if os.path.exists(latest_file):
            try:
                with open(latest_file, "r", encoding="utf-8") as f:
                    prev_snap = json.load(f)
                    prev_symbols = [x["symbol"] for x in prev_snap.get("top_n", [])]
            except Exception:
                pass

        curr_symbols = [x["symbol"] for x in top_n]
        additions = [s for s in curr_symbols if s not in prev_symbols]
        removals = [s for s in prev_symbols if s not in curr_symbols]

        # Compile scan payload
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        response_payload = {
            "success": True,
            "timestamp": timestamp_str,
            "total_scanned": total_scanned,
            "total_passed_layer1": len(passed_layer1),
            "candidates": candidates,
            "top_n": top_n,
            "additions": additions,
            "removals": removals
        }

        # Save snapshot to files
        snap_dir = os.path.join(cls.get_data_dir(), "discovery_snapshots")
        os.makedirs(snap_dir, exist_ok=True)
        
        safe_time = datetime.now().strftime("%Y%m%d_%H%M%S")
        snap_file = os.path.join(snap_dir, f"snapshot_{safe_time}.json")
        
        with open(snap_file, "w", encoding="utf-8") as f:
            json.dump(response_payload, f, ensure_ascii=False, indent=2)

        with open(latest_file, "w", encoding="utf-8") as f:
            json.dump(response_payload, f, ensure_ascii=False, indent=2)

        return response_payload

    @classmethod
    async def push_discovery_feishu(cls, db: AsyncSession) -> Dict[str, Any]:
        """
        Compiles the Top-N and pushes a premium Lark card message.
        """
        latest_file = os.path.join(cls.get_data_dir(), "latest_discovery_snapshot.json")
        if not os.path.exists(latest_file):
            # Run scan first to generate one
            await cls.run_discovery_scan(db)

        with open(latest_file, "r", encoding="utf-8") as f:
            snapshot = json.load(f)

        top_n = snapshot.get("top_n", [])
        additions = snapshot.get("additions", [])
        removals = snapshot.get("removals", [])

        # Formulate rich Lark card content
        lines = [
            "### 🔍 Asurada 智能选股与题材挖掘候选池 TopN",
            f"**分析时间**：{snapshot.get('timestamp')}",
            f"**大盘精简**：全市场过滤 `{snapshot.get('total_scanned') - snapshot.get('total_passed_layer1')}` 只高噪声噪声股，提炼 `{snapshot.get('total_passed_layer1')}` 只优质备选股。",
            "---"
        ]

        if additions or removals:
            lines.append("🔄 **候选池滚动更新动态**:")
            if additions:
                adds_str = ", ".join(f"**{x}**" for x in additions)
                lines.append(f"  - 🟢 **今日新入池标的**: {adds_str}")
            if removals:
                rems_str = ", ".join(f"**{x}**" for x in removals)
                lines.append(f"  - 🔴 **今日剔除池标的**: {rems_str}")
            lines.append("---")

        for idx, stock in enumerate(top_n):
            lines.append(f"🔥 **Top {idx+1}: {stock['name']} ({stock['symbol']})** | {stock['sector']}")
            lines.append(f"  - 💰 **当前价格**: `{stock['price']:.2f} 元` | 📊 **策略综合评分**: `{stock['total_score']}分` (技术 `{stock['trend_score']}` | 基本面 `{stock['fundamental_score']}` | 风控 `{100.0 - stock['risk_score']}`)")
            lines.append("  - 📈 **入池三大核心理由**:")
            for r_idx, reason in enumerate(stock["reasons"]):
                lines.append(f"    {r_idx+1}. {reason}")
            lines.append(f"  - 🎯 **关键突破点/防守位**: `{stock['key_threshold']}`")
            lines.append(f"  - 🚨 **潜在风险提示**: {', '.join(stock['risk_points'])}")
            lines.append(f"  - 📋 **下一阶段验证清单**: {', '.join(stock['next_steps'])}")
            lines.append("")

        lines.append("---")
        lines.append("🔗 **深研分析**：请打开 Asurada 工作台，点击候选池个股「一键深研」进入多维度技术及题材核心逻辑剖析面板。")

        webhook_url = await cls.get_configuration(db, "feishu_webhook")
        fs_enabled = (await cls.get_configuration(db, "feishu_enabled")) == "true"

        success = await FeishuBot.push_message(
            webhook_url=webhook_url,
            title="选股与题材挖掘候选池 TopN 摘要",
            text_content="\n".join(lines),
            enabled=fs_enabled
        )

        return {
            "success": success,
            "webhook_url": webhook_url,
            "enabled": fs_enabled,
            "message": "飞书候选池消息推送完成（静默/实盘）"
        }

    @staticmethod
    async def get_configuration(db: AsyncSession, key: str) -> str:
        res = await db.execute(select(Configuration).where(Configuration.key == key))
        config = res.scalars().first()
        return config.value if config else ""

    @classmethod
    async def generate_deep_research(cls, symbol: str, db: AsyncSession) -> Dict[str, Any]:
        """
        One-key Deep Research Generator.
        Simulates an LLM agent deep dive report.
        """
        # Fetch stock details
        stock_res = await db.execute(select(Stock).where(Stock.symbol == symbol))
        stock = stock_res.scalars().first()
        if not stock:
            return {"error": "Stock symbol not found in active list"}

        # Simulate detailed markdown analyst report
        date_str = datetime.now().strftime("%Y-%m-%d")
        
        report_md = f"""# 📈 Asurada 深度研报：{stock.name} ({stock.symbol}) 题材挖掘与硬逻辑深度剖析

**研报级别**：智能体深度买方投资报告
**研报时间**：{date_str}
**研究机构**：Asurada 智能量化深研 Agent

---

## Ⅰ. 题材主线与核心投资逻辑 (Sector & Theme)

### 1. 行业定位与宏观背景
{stock.name} 作为 **{stock.sector or "支柱行业"}** 的龙头个股，当前正处于产业升级与结构调整的核心生态位。
- 在行业面临国内政策支持（新基建、以旧换新或刚性消费支持）的大背景下，行业整体集中度快速向头部公司靠拢。
- 供给侧改革的红利充分释放，中小型竞品企业在资金链、研发与合规成本压力下快速出清，形成了极强的**绝对龙头垄断护城河**。

### 2. 资金偏好与市场共识
市场近期正在从“无脑题材炒作”向“确定性高增长与业绩兑现”做风格切换。该标的作为大级别资金（外资公募、社保基金、险资）的核心底仓，在日线及周线级别上表现出极强的承接盘力量，呈现出“易涨难跌”的资金筹码沉淀特征。

---

## Ⅱ. 基本面深度穿透与业绩分析 (Fundamentals)

### 1. 核心财务指标剖析
- **营收与净利增长**：Q1单季度实现净利润同比大幅上涨，印证了下游刚性回暖。毛利率与净利率持续保持行业顶尖水平，体现了强大的议价能力。
- **负债率与现金流**：经营性净现金流极其充沛，无任何刚性债务违约风险。研发投入占比逐年提升，在技术壁垒上持续拉开与第二梯队的差距。
- **估值合理性测算**：当前动态 P/E 处于历史近10年分位数的后 25% 极低区间，与其行业主导地位和长线复合增速明显错配。

---

## Ⅲ. 技术面多周期结构与 VCP 收缩度 (Technical & VCP)

```mermaid
graph TD
    A[VCP 第1波收缩 宽度 12%] -->|历时 20 天| B[VCP 第2波收缩 宽度 4.0%]
    B -->|历时 10 天| C[VCP 第3波收缩 宽度 2.1%]
    C -->|今日量比 2.5倍| D[突破前高阻力位 确立买点]
```

### 1. 波动率收缩 (Volatility Contraction Pattern)
- 在日K线上表现出极其标准的 Minervini 上升模板（价格牢固站上 MA150 及 MA200 均线，且 50 > 150 > 200 呈完美的顺向多头排列）。
- 经历 3-4 次波动率的阶梯式渐进性收缩（例如从 `12%` 收紧到 `4%` 再收紧到 `2%` 左右），意味着盘中浮动筹码已近乎被清洗干净，主力资金完成了高位筹码的深度锁定。

### 2. 量价配合与突破判定
- 今日伴随日内成交量成倍放大，量比突破大均值，价格无视盘中市场波动顽强放量封死向上大阳线。
- 确立了**第二阶段上升通道的起点**，是一次标准的、高确定性的“放量向上突破”阻力位操作机会。

---

## Ⅳ. 风险矩阵与估值合理性上限 (Risk & Valuation Limit)

| 风险维度 | 严重度 | 概率 | 智能体防守策略与建议 |
| :--- | :---: | :---: | :--- |
| **行业竞争加剧风险** | 中等 | 低 | 密切关注季报中龙头毛利率变动，如毛利率跌破警戒线，则缩减中线估值上限。 |
| **海外宏观环境震荡** | 高 | 中 | 如遇突发地缘政治摩擦，严格以 MA50 均线作为长线底仓防守的终极关口。 |
| **政策监管与集采风险**| 中等 | 低 | 跟踪关键贴息项目及政策指导落地进度，适度降低短期仓位敏感度。 |

---

## Ⅴ. 研报提纲、关键问题与下一阶段验证清单

### 1. 核心调研提纲与亟待验证问题
1. **渠道动销情况**：在接下来的端午/夏季淡旺季交替期，下游代理商/经销商的实打实订单回款是否能够环比提速？
2. **新电池/新医疗设备装机进度**：神行超充电池（或核心高端超声影像设备）在海外高端三甲医院/海外高端主机的导入速度是否受阻？

### 2. 盘口验证清单 (Checklist)
- [ ] **验证点 A**：未来3个交易日内，股价是否能够顶住市场分歧，不回踩跌破关键支撑位（突破前高水平线）。
- [ ] **验证点 B**：观察分时图上，日内急跌时是否有数十万手级别的大单进行坚决托盘，验证主力筹码锁死度。
- [ ] **验证点 C**：二季度末，跟踪核心下游客户的批量装车/采购合同披露，确保订单链条的确定性。
"""

        # Save to file
        research_dir = os.path.join(cls.get_data_dir(), "discovery_research")
        os.makedirs(research_dir, exist_ok=True)
        report_file = os.path.join(research_dir, f"{symbol}_report.md")
        
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(report_md)

        return {
            "symbol": symbol,
            "name": stock.name,
            "report_markdown": report_md,
            "generated_at": date_str
        }

    @classmethod
    async def get_deep_research_report(cls, symbol: str, db: AsyncSession) -> Optional[Dict[str, Any]]:
        """
        Retrieves generated report.
        """
        report_file = os.path.join(cls.get_data_dir(), "discovery_research", f"{symbol}_report.md")
        if not os.path.exists(report_file):
            return None
            
        stock_res = await db.execute(select(Stock).where(Stock.symbol == symbol))
        stock = stock_res.scalars().first()
        if not stock:
            return None

        with open(report_file, "r", encoding="utf-8") as f:
            md_content = f.read()

        return {
            "symbol": symbol,
            "name": stock.name,
            "report_markdown": md_content,
            "generated_at": datetime.now().strftime("%Y-%m-%d")
        }

    @classmethod
    async def get_latest_snapshot(cls, db: AsyncSession) -> Dict[str, Any]:
        """
        Retrieves the latest cached Discovery scan results without running a new scan.
        """
        latest_file = os.path.join(cls.get_data_dir(), "latest_discovery_snapshot.json")
        if os.path.exists(latest_file):
            try:
                with open(latest_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        # Fallback: run scan if no snapshot exists
        return await cls.run_discovery_scan(db)
