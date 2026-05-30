import asyncio
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import engine, Base
from ..models import Stock, DailyPrice, Position, Task, SystemStatus, Signal, Configuration, User, FocusStock, ResearchSector, ResearchReport, IndustryChainNode, CostStructure, ResearchConclusion, Evidence, ModelConfig, ModelLog
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
    # 0. Check and seed default admin user
    user_result = await db.execute(select(User))
    if not user_result.scalars().first():
        print("Seeding default admin user...")
        from ..utils.auth import hash_password, generate_salt
        salt = generate_salt()
        hashed = hash_password("admin123", salt)
        admin_user = User(
            username="admin",
            hashed_password=hashed,
            salt=salt,
            role="admin",
            is_active=True,
            created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        db.add(admin_user)
        await db.commit()

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
        {"key": "discovery_history_window_days", "value": "250"},
        {"key": "vcp_ma_short", "value": "50"},
        {"key": "vcp_ma_long", "value": "200"},
        {"key": "vcp_volume_factor", "value": "1.5"},
        {"key": "brooks_lookback_window", "value": "5"},
        {"key": "brooks_stop_atr", "value": "1.5"}
    ]
    
    # Dynamically serialize and seed A-share sector leader definitions in a hierarchical format
    from .market_today import MARKET_LEADER_DEFS
    import json
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

    configs_to_seed.append({
        "key": "today_market_sectors",
        "value": json.dumps(hierarchical_defaults, ensure_ascii=False)
    })

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

    # Seed Model Configs (placed before early return to ensure execution)
    models_res = await db.execute(select(ModelConfig))
    if not models_res.scalars().first():
        presets = [
            { "name": 'Gemini 2.0 Pro', "provider": 'Google', "identifier": 'gemini-2.0-pro-exp-02-05', "base_url": '', "description": 'Google 顶尖多模态模型，支持原生视频理解。', "capabilities": 'text,image,video', "is_default": 'true', "sort_order": 10 },
            { "name": 'Qwen-VL-Max', "provider": 'Alibaba', "identifier": 'qwen-vl-max', "base_url": 'https://dashscope.aliyuncs.com/compatible-mode/v1', "description": '通义千问视觉大模型，视频理解能力强。', "capabilities": 'text,image,video', "is_default": 'false', "sort_order": 20 },
            { "name": 'DeepSeek Chat', "provider": 'DeepSeek', "identifier": 'deepseek-chat', "base_url": 'https://api.deepseek.com', "description": '深度求索高性能模型，环境分析极具性价比。', "capabilities": 'text', "is_default": 'false', "sort_order": 30 },
            { "name": 'GPT-4o', "provider": 'OpenAI', "identifier": 'gpt-4o', "base_url": 'https://api.openai.com/v1', "description": 'OpenAI 旗舰全能模型，推理能力卓越。', "capabilities": 'text,image,video', "is_default": 'false', "sort_order": 40 },
            { "name": 'MiniMax-M2.7', "provider": 'MiniMax', "identifier": 'MiniMax-M2.7', "base_url": 'https://api.minimax.chat/v1', "description": '国产大模型新锐，文本与视觉理解均衡。', "capabilities": 'text,image', "is_default": 'false', "sort_order": 50 }
        ]
        for p in presets:
            m_cfg = ModelConfig(
                name=p["name"],
                provider=p["provider"],
                identifier=p["identifier"],
                base_url=p["base_url"],
                description=p["description"],
                capabilities=p["capabilities"],
                is_default=p["is_default"],
                sort_order=p["sort_order"],
                status="unknown",
                latency_ms=0
            )
            db.add(m_cfg)
        await db.flush()

    await db.commit() # Commit to DB to make it visible to synchronous sqlite3 connections

    # Check if we already have stocks seeded
    result = await db.execute(select(Stock))
    if result.scalars().first():
        print("Database already seeded with stock data, but configuration keys verified/inserted.")
        return

    print("Seeding remaining database records...")

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

    # 7. Seed Cockpit Data (Mock)
    sectors_res = await db.execute(select(ResearchSector))
    if not sectors_res.scalars().first():
        sec1 = ResearchSector(name="人形机器人", category="制造", description="具身智能与先进制造的交叉领域", status="已分析", report_count=170, analysis_status="已生成", opportunity_level="A", risk_level="中", last_updated_at=datetime.now().strftime("%Y-%m-%d"))
        sec2 = ResearchSector(name="半导体设备", category="TMT", description="卡脖子突破与国产替代核心", status="分析中", report_count=98, analysis_status="未生成", opportunity_level="A", risk_level="中", last_updated_at=datetime.now().strftime("%Y-%m-%d"))
        sec3 = ResearchSector(name="固态电池", category="新能源", description="下一代电池技术路线", status="待复核", report_count=76, analysis_status="待人工确认", opportunity_level="B", risk_level="高", last_updated_at=datetime.now().strftime("%Y-%m-%d"))
        db.add_all([sec1, sec2, sec3])
        await db.flush() # flush to get IDs

        node1 = IndustryChainNode(sector_id=sec1.id, name="谐波减速器", node_type="核心零部件", cost_ratio="35%", localization_rate="中", barrier_score=88, substitution_risk_score=20, investment_score=85)
        node2 = IndustryChainNode(sector_id=sec1.id, name="行星滚柱丝杠", node_type="核心零部件", cost_ratio="20%", localization_rate="低", barrier_score=92, substitution_risk_score=15, investment_score=90)
        node3 = IndustryChainNode(sector_id=sec1.id, name="空心杯电机", node_type="核心零部件", cost_ratio="15%", localization_rate="中高", barrier_score=75, substitution_risk_score=30, investment_score=70)
        db.add_all([node1, node2, node3])
        await db.flush()


        cost1 = CostStructure(sector_id=sec1.id, node_id=node1.id, module_name="谐波减速器", current_cost="3500元", target_cost="1500元", cost_ratio="35%", decline_rate="-15% CAGR", year="2024", source_type="研报提取", confidence_score=0.92)
        cost2 = CostStructure(sector_id=sec1.id, node_id=node2.id, module_name="行星滚柱丝杠", current_cost="5000元", target_cost="2000元", cost_ratio="20%", decline_rate="-20% CAGR", year="2024", source_type="研报提取", confidence_score=0.85)
        db.add_all([cost1, cost2])

        con1 = ResearchConclusion(sector_id=sec1.id, target_type="板块", target_id=sec1.id, conclusion_type="核心驱动", content="国产替代加速 + 成本规模化下降 + 下游主机厂放量预期增强。", confidence_score=0.88, risk_level="低", review_status="已确认", created_at=datetime.now().strftime("%Y-%m-%d"))
        con2 = ResearchConclusion(sector_id=sec1.id, target_type="节点", target_id=node1.id, conclusion_type="替代风险", content="未来 5-10 年谐波减速器被其他路线替代的风险较低，投资壁垒深厚。", confidence_score=0.95, risk_level="低", review_status="已确认", created_at=datetime.now().strftime("%Y-%m-%d"))
        db.add_all([con1, con2])
        await db.flush()

        rep1 = ResearchReport(sector_id=sec1.id, title="人形机器人核心零部件报告", institution="华泰证券", author="张聪", publish_date="2024-03-15", file_url="/reports/robot_components.pdf", parse_status="已完成", quality_score=92.5, summary="系统分析人形机器人核心零部件的成本结构、国产化水平及发展趋势。", created_at=datetime.now().strftime("%Y-%m-%d"))
        rep2 = ResearchReport(sector_id=sec1.id, title="减速器行业深度研究报告", institution="中信证券", author="李明", publish_date="2024-02-20", file_url="/reports/speed_reducer.pdf", parse_status="已完成", quality_score=90.0, summary="减速器全球与中国市场竞争格局，哈默纳科与绿的谐波地位分析。", created_at=datetime.now().strftime("%Y-%m-%d"))
        db.add_all([rep1, rep2])
        await db.flush()

        ev1 = Evidence(conclusion_id=con2.id, report_id=rep1.id, original_text="华泰证券《人形机器人核心零部件报告》P18: 谐波减速器在手腕关节等轻负载高精度场景具备不可替代性...", evidence_type="研报原文", confidence_score=0.95)
        ev2 = Evidence(conclusion_id=con2.id, report_id=rep2.id, original_text="中信证券《减速器行业深度报告》P12: 替代路线尚未成熟，短期内无法撼动哈默纳科与绿的谐波地位。", evidence_type="研报原文", confidence_score=0.92)
        db.add_all([ev1, ev2])

    # 8. Seed Model Logs (Mock)
    model_logs_res = await db.execute(select(ModelLog))
    if not model_logs_res.scalars().first():
        print("Seeding default model logs...")
        import json
        from datetime import timedelta
        
        base_time = datetime.now()
        logs_to_seed = []
        
        # 1. Brooks candle pattern scan log
        logs_to_seed.append(ModelLog(
            task_name="裸K价格行为分析",
            task_id="TASK_BROOKS_1024",
            username="admin",
            user_id="1",
            model_id="deepseek-chat",
            model_url="https://api.deepseek.com/v1/chat/completions",
            status_code="200",
            started_at=(base_time - timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
            ended_at=(base_time - timedelta(minutes=45, seconds=-2)).strftime("%Y-%m-%d %H:%M:%S"),
            input_tokens=1250,
            output_tokens=380,
            request_payload=json.dumps({
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "You are a Brooks Price Action analysis agent."},
                    {"role": "user", "content": "Analyze 300760.SZ (迈瑞医疗) latest 5 daily bars for Pinbar/H1/H2."}
                ],
                "temperature": 0.1
            }, ensure_ascii=False),
            response_body=json.dumps({
                "id": "chatcmpl-923hjsdf",
                "object": "chat.completion",
                "created": int(base_time.timestamp()),
                "model": "deepseek-chat",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "### 迈瑞医疗 (300760.SZ) 裸K价格行为诊断\n\n1. **K线组合形态**:\n   - 倒数第2根日K线在MA150日均线支撑位收出强力看涨 **Pinbar**，下影线占比约 72%，买盘强劲。\n   - 今日收出阳包阴形态，确认支撑有效，触发 **H2 (High 2) 看涨买入形态**。\n2. **交易策略建议**:\n   - 突破前高 (288.50) 买入，止损设在 Pinbar 最低价 (274.20) 下方。\n   - 目标盈亏比 1:2，首要目标 315.00。"
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": 1250,
                    "completion_tokens": 380,
                    "total_tokens": 1630
                }
            }, ensure_ascii=False)
        ))
        
        # 2. Text-To-Speech log
        logs_to_seed.append(ModelLog(
            task_name="飞书音频报告生成",
            task_id="TASK_TTS_9001",
            username="admin",
            user_id="1",
            model_id="MiniMax-M2.7",
            model_url="https://api.minimax.chat/v1/t2a_v2",
            status_code="200",
            started_at=(base_time - timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S"),
            ended_at=(base_time - timedelta(minutes=30, seconds=-4)).strftime("%Y-%m-%d %H:%M:%S"),
            input_tokens=85,
            output_tokens=150,
            request_payload=json.dumps({
                "text": "Asurada 主调度智能体系统自检完成。当前策略配置正常，宁德时代波动率收缩形态已就绪，建议按盘前计划执行突破买入。",
                "voice_setting": {
                    "voice_id": "mimic-voice-001",
                    "speed": 1.0,
                    "pitch": 0
                }
            }, ensure_ascii=False),
            response_body=json.dumps({
                "base_resp": {"status_code": 0, "status_msg": "success"},
                "audio_url": "http://localhost:8000/api/tts?voice_id=mimic-voice-001",
                "extra_info": {"duration_ms": 5200}
            }, ensure_ascii=False)
        ))
        
        # 3. Vision log
        logs_to_seed.append(ModelLog(
            task_name="多模态形态审核",
            task_id="TASK_VISION_4522",
            username="operator_alpha",
            user_id="2",
            model_id="gemini-2.0-pro-exp-02-05",
            model_url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp-02-05:generateContent",
            status_code="200",
            started_at=(base_time - timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S"),
            ended_at=(base_time - timedelta(minutes=15, seconds=-3)).strftime("%Y-%m-%d %H:%M:%S"),
            input_tokens=2400,
            output_tokens=120,
            request_payload=json.dumps({
                "contents": [{
                    "parts": [
                        {"text": "Is this chart showing a standard Volatility Contraction Pattern (VCP)?"},
                        {"inline_data": {
                            "mime_type": "image/gif",
                            "data": "R0lGODlhAQABAIAAAAD/lhP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                        }}
                    ]
                }]
            }, ensure_ascii=False),
            response_body=json.dumps({
                "candidates": [{
                    "content": {
                        "parts": [{
                            "text": "Yes. The image shows a classic 3-contraction VCP. The contractions are narrowing from 12% to 4% and now at 1.8%, with volume drying up significantly on the contractions. A breakout above the pivot line with high volume is highly bullish."
                        }]
                    },
                    "finishReason": "STOP"
                }]
            }, ensure_ascii=False)
        ))

        db.add_all(logs_to_seed)
        await db.flush()

    await db.commit()
    print("Database seeding completed successfully.")

async def initialize_db_schema():
    """
    Creates tables if not exists.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
