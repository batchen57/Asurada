# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Asurada（阿斯拉达）是一个专注 A 股的多智能体量化交易辅助系统。核心理念是"降噪至上、稳健优先"，融合 Mark Minervini 的 VCP（波动率收缩形态）与 Al Brooks 的裸 K 价格行为学。技术栈：FastAPI + SQLAlchemy 2.0 + aiosqlite（后端），React 19 + TypeScript + Vite 8 + Recharts 3（前端）。

## 常用命令

### 后端
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_tushare_configs.py   # 初始化额外配置项（首次）
python run.py                    # 启动开发服务器 → http://127.0.0.1:8000
```

### 前端
```powershell
cd frontend
npm install
npm run dev       # Vite 热更新开发服务器 → http://localhost:5173
npm run build     # 生产构建（tsc 类型检查 + vite build）
npm run lint      # ESLint
```

## 架构概览

```
frontend/src/
  App.tsx          — 路由/布局/状态管理/安全登录遮罩/AI 助手抽屉
  types.ts         — 所有前端类型定义（与 Pydantic schema 对应）
  pages/           — Workbench, TodayMarket, FocusWatchlist, StockDetail, Discovery, Plan, Observe, Review, DataHubCenter, StrategyCenter, AgentCenter, Signals, AuditLogs (含用户管理/模型调用Tab), SectorConfig, CockpitList, CockpitDashboard, Settings
  components/      — Sidebar, Topbar, CardWorkflow, TodoList, RecentSignals, SystemStatus, TodayOverview, PlanStockCard, ModelConfig, ModelLogs

backend/app/
  main.py          — FastAPI 应用入口 + 所有 API 路由（大盘实时报价、个股财务详情、鉴权及多用户CRUD、重点池管理、产业链驾驶舱、模型配置管理、安全审计过滤）
  database.py      — 异步 SQLite 引擎 + get_db 依赖注入
  models.py        — SQLAlchemy ORM: Stock, DailyPrice, Position, Signal, Task, SystemStatus, Configuration, AuditLog, User, FocusStock, ResearchSector, ResearchReport, IndustryChainNode, CostStructure, ResearchConclusion, Evidence, ModelConfig, ModelLog
  schemas.py       — Pydantic 请求/响应模型（含 FocusStock/Cockpit/ModelConfig/ModelLog 全系列数据契约）
  utils/
    audit.py       — 异步/同步底层审计组件（提供切面化接口数据拦截，含 Operator 追踪）
    auth.py        — 独立安全鉴权底座（PBKDF2-SHA256 密码哈希、HMAC-SHA256 JWT 自验证签发）
  agents/
    orchestrator.py — 主调度 Agent，统筹 Plan → Observe → Review → Iterate 四阶段交易流程
    feishu.py       — 飞书群机器人推送（集成审计日志捕获）
  strategies/
    vcp_agent.py    — VCP 波动率收缩形态识别（Mark Minervini 风格）
    brooks_agent.py — 裸 K 价格行为学分析（Al Brooks 风格，Pinbar/H1/H2）
  datahub/
    loader.py       — 数据库建表 + 种子数据填充（含投研板块/节点/成本/研报/证据全量初始化）
    tushare_sim.py  — Tushare 日线历史数据仿真生成器（集成审计日志捕获）
    sina_sim.py     — 新浪财经实时行情仿真（集成审计日志捕获）
    market_today.py — 今日大盘与个股行情融合聚合器（整合实盘Sina API与本地仿真）
    market_details_data.py — 板块龙头个股财务亮点、ROE、3年预测折合市盈率矩阵静态库
    discovery_engine.py — 选股题材引擎（三层过滤管道+深度研报生成）
```

### 核心数据流

1. **后端启动** → `main.py startup_event` → `initialize_db_schema()` + `seed_database()` → SQLite 数据库就绪
2. **前端加载** → `GET /api/workbench` → 单次聚合返回 indices、positions、tasks、signals、system_status
3. **四阶段工作流** → 前端触发 `POST /api/orchestrator/run {phase}` → OrchestratorAgent 调度 VCPAgent/BrooksAgent → 更新 Task 状态 + 飞书推送
4. **选股扫描** → `POST /api/discovery/scan` → DiscoveryEngine 三层过滤 → 评分排序 → Top-N 快照落盘
5. **接口调用审计** → 行情仿真（Sina / Tushare）或消息推送（Feishu）触发 → 通过 `audit.py` 写入 `AuditLog` 并入库 → 前端 `AuditLogs.tsx` 查询与展示。
6. **今日股市与个股穿透** → 前端加载 `/api/discovery/today-market` -> 调用 `market_today.py` 与 `market_details_data.py` -> 实盘与高保真本地仿真秒级拼装 -> 渲染个股基本面与 3 年预测详情抽屉。
7. **身份验证与安全审计** → 登录 `/api/auth/login` -> 签发 JWT 令牌 -> 携带于后续 HTTP 请求头中 -> 后端自校验权限并审计 Operator 操作人属性。
8. **重点筛选池管理** → 前端触发 `/api/focus-watchlist` CRUD → 后端 `FocusStock` 表读写 → 添加/更新/移出操作均切面审计入库 → `FocusWatchlist.tsx` 渲染管理面板。
9. **产业链驾驶舱研究** → 前端加载 `/api/cockpit/sectors` → 选择板块后钻取 `/api/cockpit/sectors/{id}/nodes`、`/costs`、`/conclusions`、`/reports` → 证据溯源 `/api/cockpit/conclusions/{id}/evidences` → `CockpitDashboard.tsx` 五维画面渲染。
10. **AI 模型配置与调用** → 前端 `/api/models` CRUD 管理模型注册 → `/api/models/test` 连接测试写入 `ModelLog` → `/api/model-logs` 分页检索调用审计 → `ModelConfig.tsx` 与 `ModelLogs.tsx` 双面板渲染。

### 关键设计点

- **数据库是模拟的**：所有数据由 `tushare_sim.py` 和 `sina_sim.py` 程序生成，不存在真实的外部 API 依赖。`feishu_enabled` 默认 false，飞书推送也不会真实发出。
- **前端自带 mock fallback**：`App.tsx` 的 catch 块中有 `getMockDataFallback()`，且 `AuditLogs.tsx`、`TodayMarket.tsx` 等页面在后端离线时依然提供高保真 mock fallback 数据支持，保障纯前端演示效果。
- **发现引擎有增量对比**：扫描结果与 `latest_discovery_snapshot.json` 比对，输出 additions/removals 供飞书卡片展示。
- **配置持久化**：所有系统参数通过 `Configuration` 表读写，前端 Settings 页可编辑，Orchestrator 复盘时可一键应用优化参数。
- **非阻塞切面审计机制**：审计功能基于异步/同步双通道实现。高频仿真环境下的调用记录通过事件循环的 `create_task` 派发或新开事件循环，实现物理数据库秒级落盘而不阻塞日内 Tick 报价产生。
- **JWT与PBKDF2-SHA256密码安全**：弃用第三方复杂鉴权库，使用标准库自研 JWT 签名算法；密码存储使用标准 `hashlib` 的 10 万次迭代哈希防爆。
- **板块与个股树轻量化 CRUD**：在 SectorConfig 模块上以“板块”为唯一聚合容器，股票配置参数高内聚，支持一键填充 Preset 演示数据及 SQLite 持久化。
- **研报驱动的证据溯源**：产业链驾驶舱的每条 AI 结论必须追溯至：结论 → 研报 → 页码 → 原文片段 → 置信度评分。系统通过 `Evidence` 表物理关联 `ResearchConclusion` 与 `ResearchReport`，确保"结论来自研报，而非 AI 随机生成"。
- **重点池审计切面**：FocusWatchlist 的增删改操作均通过 `record_audit_log_sync` 非阻塞写入审计日志，保障操作可追溯性。
- **模型配置互斥默认**：设置默认模型时自动将其余模型的 `is_default` 重置为 "false"，连接测试结果实时回写 `ModelConfig` 并审计至 `ModelLog`。

---
## 编码行为准则

旨在减少大语言模型（LLM）常见编程错误的行為准则。

**权衡取舍：** 这些准则更倾向于"谨慎"而非"速度"。对于微不足道的简单任务，请自行斟酌判定。

---

### 1. 编码前先思考 (Think Before Coding)

**不要盲目假设。不要隐瞒疑惑。明确权衡利弊。**

在开始编写代码前：
- 明确陈述你的假设。如果存在不确定性，请主动提问。
- 如果存在多种理解或实现方式，请将它们呈现给用户——切勿默默自行选择。
- 如果存在更简单的替代方案，请明确提出。在合理情况下，应推动方案简化。
- 如果有任何不清晰的地方，请立即停止。指出令人困惑的具体问题并向用户提问。

---

### 2. 简约至上 (Simplicity First)

**用最精简的代码解决问题。不做任何投机性/猜测性的设计。**

- 绝不添加用户未要求的任何额外功能。
- 绝不为单次使用的代码做过度抽象。
- 绝不引入未经请求的"灵活性"或"可配置性"。
- 绝不对不可能发生的场景编写冗余的错误处理逻辑。
- 如果写了 200 行代码，但实际上 50 行就能解决，请重写它。

经常问自己："一位资深工程师会觉得这个设计过于复杂了吗？"如果是，请立即简化。

---

### 3. 外科手术式修改 (Surgical Changes)

**只触碰必须修改的部分。只清理自己造成的改动。**

编辑现有代码时：
- 不要顺手去"改进"相邻的代码、注释或格式。
- 不要重构没有损坏或能正常工作的逻辑。
- 必须匹配既有的代码风格，即使你自己习惯的方式与此不同。
- 如果你注意到了不相关的废弃代码，请向用户提及——切勿直接删除它。

当你的改动使其他代码失效或成为孤立代码（孤儿代码）时：
- 仅清除由于你的改动而变得不再使用的 import 导入、变量或函数。
- 除非用户明确要求，否则不要清除先前就已存在的废弃代码。

**终极检验**：确保你修改的每一行代码，都能直接追溯到用户的具体请求上。

---

### 4. 目标驱动执行 (Goal-Driven Execution)

**明确成功标准。持续循环验证，直至完全通过。**

将开发任务转化为可验证的目标：
- "添加校验逻辑" → "编写针对无效输入的测试用例，然后使其通过"
- "修复该 Bug" → "编写一个能复现该 Bug 的测试用例，然后使其通过"
- "重构模块 X" → "确保重构前和重构后测试均能全数通过"

对于多步骤的复杂任务，应列出一个简要的执行计划：
```
1. [执行步骤] → 验证依据: [检查项]
2. [执行步骤] → 验证依据: [检查项]
3. [执行步骤] → 验证依据: [检查项]
```

清晰、强力的成功标准能让你自主闭环迭代。含糊不清的标准（例如"能跑通即可"）则会需要频繁的沟通确认。

---

**检验本准则是否生效的标志**：代码差异（Diff）中无意义的改动减少、因设计过度复杂导致的重写次数减少，以及在编码实现前（而非犯错后）进行的澄清提问增加。
