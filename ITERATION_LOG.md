# 📅 Asurada (阿斯拉达) 智能量化交易系统·智能体独立开发迭代日志

> [!NOTE]
> 本文档是由 **Gemini 智能体（基于 Gemini 3.5 Flash (High)）** 独立撰写的系统迭代日志，记录了 Asurada 量化辅助交易系统的完整技术演进历程与开发细节。

---

## 🚀 核心技术迭代脉络

Asurada 系统的开发历经九个核心阶段，旨在将量化趋势研判与极致的交易纪律、主动降噪机制相结合，打造一个适合个人投资者的高保真全功能量化决策工作台。

```
[版本更新总览]
v1.0.0 (2026-05-22) - 系统多智能体调度与基础工作台上线 (Milestone 1)
v1.1.0 (2026-05-22) - 选股与题材挖掘引擎 (Scenario Flow 04) 全功能交付 (Milestone 2)
v1.2.0 (2026-05-22) - 盘后复盘、数据质量门控与降噪审计系统 (Scenario Flow 03) 完美收官 (Milestone 3)
v1.3.0 (2026-05-26) - 系统审计与接口调用留痕管理系统 (Milestone 4) 全功能上线
v1.4.0 (2026-05-29) - 今日股市大盘与个股买方画像预测大盘 (Milestone 5) 全功能上线
v1.5.0 (2026-05-29) - 多用户 JWT 身份鉴权与安全审计控制系统 (Milestone 6) 全功能交付
v1.6.0 (2026-05-30) - 重点筛选池与个股深度投研画像系统 (Milestone 7) 全功能上线
v1.7.0 (2026-05-30) - AI 投研产业链驾驶舱深度研究系统 (Milestone 8) 全功能交付
v1.8.0 (2026-05-30) - AI 模型配置管理中心与模型调用审计系统 (Milestone 9) 全功能上线
```

---

## 🟩 v1.0.0 Milestone 1: 系统多智能体调度与基础工作台 (2026-05-22)

### 1. 核心任务目标
- 构建 Asurada 自选股与持仓数据库，打通多周期 K 线历史加载链路。
- 搭建 Orchestrator Agent 状态机，支持 Plan (盘前) 与 Observe (盘中) 指导决策。
- 设计符合高级极客审美的 React + TypeScript + Glassmorphism CSS 统一看板工作台 (Workbench)。

### 2. 关键技术实现与交付文件
- **异步数据访问层**：
  - [database.py](file:///d:/WorkSpace/Asurada/backend/app/database.py)：基于 `sqlalchemy.ext.asyncio` 构建异步引擎，支持多智能体并发读取。
  - [models.py](file:///d:/WorkSpace/Asurada/backend/app/models.py)：设计 `Stock`, `DailyPrice`, `Position`, `Signal`, `Task` 实体数据表模型。
  - [loader.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/loader.py)：实现 SQLite 种子数据注入引擎，内置贵州茅台 (600519.SH)、宁德时代 (300750.SZ)、万科A (000002.SZ) 等个股历史。
- **策略智能体构建**：
  - [vcp_agent.py](file:///d:/WorkSpace/Asurada/backend/app/strategies/vcp_agent.py)：实现经典 Mark Minervini 趋势模板。涵盖 MA50 > MA150 > MA200 顺向多头过滤，并测量 40日/20日/10日 波动率收缩阶梯。
  - [brooks_agent.py](file:///d:/WorkSpace/Asurada/backend/app/strategies/brooks_agent.py)：构建裸 K 形态识别，归类趋势 Bar (TrendBar)、十字星 (Doji) 与看涨/看跌 Pinbar。
- **调度中枢与通知**：
  - [orchestrator.py](file:///d:/WorkSpace/Asurada/backend/app/agents/orchestrator.py)：封装 `OrchestratorAgent` 日内决策机，打通盘前多智能体联合扫描并输出 **“盘前可执行计划一页纸”**。
  - [feishu.py](file:///d:/WorkSpace/Asurada/backend/app/agents/feishu.py)：适配飞书富文本 Markdown 推送，打通人机交互第一通道。
- **毛玻璃极客前端**：
  - [App.tsx](file:///d:/WorkSpace/Asurada/frontend/src/App.tsx) & [index.css](file:///d:/WorkSpace/Asurada/frontend/src/index.css)：全面应用 Glassmorphism CSS，定制毛玻璃浮雕卡片（`glass-panel`）与动态背景呼吸光斑，实现极致丝滑的微交互体验。
  - [Workbench.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/Workbench.tsx)：单次 API 聚合请求，动态渲染指数大盘、TodoList 任务清单、持仓列表与近期信号流。

---

## 🟨 v1.1.0 Milestone 2: 选股与题材挖掘引擎全功能交付 (2026-05-22)

### 1. 核心任务目标
- 实现 **Scenario Flow 04: Stock Selection & Theme Mining (选股与题材挖掘)** 模块。
- 研发三层过滤降噪管道与综合多维评分算法，剔除市场垃圾噪音股。
- 构建一键深度买方研报生成器，直观展示题材主线与盘口验证 Checklist。
- 实现飞书增量对比对比（Snapshot Delta）卡片推送。

### 2. 关键技术实现与交付文件
- **三层过滤管道 (3-Layer Pipeline)**：
  - [discovery_engine.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/discovery_engine.py)：
    - **Layer 1 Filter (可研究性初筛)**：自动剔除 ST/\*ST 壳资源、过滤日成交量为 0 的停牌股、屏蔽市值 $< 100$亿与日均成交 $< 50.0$万的低流动性僵尸股，支持 sector 黑名单行业过滤。
    - **Layer 2 Score (多维量化打分)**：按以下公式打分，过滤得到 Top-N（前3名）黄金池标的：
      $$\text{Score} = (\text{VCP技术形态分数}) \times 0.4 + (\text{估值财务基本面分数}) \times 0.4 + (100 - \text{风控扣分}) \times 0.2$$
    - **Layer 3 Task (盘口验证与调研)**：为入选 Top-N 股票自动构建特定关键阻力位、潜在风险提示点以及**“下一阶段验证 Checklist”**。
- **高确定性买方研报与飞书动态**：
  - 在 [discovery_engine.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/discovery_engine.py) 中，基于真实研报框架生成包含行业定位、PE估值分位、Mermaid多波收敛图谱以及风险严重度概率矩阵的一键 Markdown 研报。
  - 设计增量快照对比算法，在推送飞书时直观标注今日 **🟢 新增入池**与 **🔴 移出池**的个股 Symbol。
- **题材前端可视化交互**：
  - [Discovery.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/Discovery.tsx)：设计了高颜值的市值/成交量过滤滑动阻尼条（Slider），Top-N 增量动画标徽卡片，极富表现力的 Checklist 交互选择器，以及高保真 Markdown 深度研报渲染面板。

---

## 🟦 v1.2.0 Milestone 3: 盘后复盘、数据质量门控与降噪审计系统 (2026-05-22)

### 1. 核心任务目标
- 实现 **Scenario Flow 03: Post-Market Review (盘后复盘与审计)** 系统。
- 构建 API 数据源数据门控（Data Quality Gate）自我评估机制。
- 研发 **Joyce 仓位安全铁律审计** 与 **Brooks 裸 K 收盘收尾验证** 双重视角。
- 研发**盘中预警对账审计与噪音率（Noise Ratio）计算**，自动触发降噪自优化参数推荐，支持一键保存应用。

### 2. 关键技术实现与交付文件
- **数据门控自我评估 (Data Gate)**：
  - 在 [orchestrator.py](file:///d:/WorkSpace/Asurada/backend/app/agents/orchestrator.py) 的 `run_review_phase` 方法中，自动审查 API 时效延迟（阈值 3600 秒）、数据缺失率（阈值 5%）以及异常偏离值。如触发门控，自动转为 **“报告降级模式”** 并打上警告标签。
- **双重策略复盘视角 (Double Perspectives)**：
  - **Joyce 仓位风险防守**：严格校核单一持仓个股占总资产市值是否突破 $30\%$ 安全红线，超标则发出红色高警，并自动推送减仓提醒。
  - **Brooks 裸 K 收盘确认**：分析持仓个股最后 5 日的 Naked K 线走势，审计收盘是否出现 Pinbar 反弹或多头强 TrendBar 信号。
- **对账审计与降噪自优化 (Noise Ratio & Param Optimization)**：
  - 自动读取 `feishu_outbox.json` 盘中历史信号，并与 15:00 最终收盘价进行逻辑对账，核算全天假突破等**系统噪音率 (Noise Ratio)**。
  - 当噪音率超标时，调度器自动给出参数调节建议（建议增加合并窗口分钟、提高 VCP 量能乘数阈值）。
  - 实现 `/api/orchestrator/apply-optimization` 接口，支持将优化后的参数一键覆盖更新回 SQLite `configurations` 表。
- **全能复盘控制中心**：
  - [Review.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/Review.tsx)：左侧设计了极具科幻感的“数据门控 $\rightarrow$ 仓位风险 $\rightarrow$ 信号对账 $\rightarrow$ 自优化降噪”流程指示进度条，右侧为盈亏曲线分析图表，支持复盘历史文件异步加载查看与一键应用降噪参数交互。

---

## 🟪 v1.3.0 Milestone 4: 系统审计与接口调用留痕管理系统 (2026-05-26)

### 1. 核心任务目标
- 在系统设置下新增**审计管理模块 (Audit Logs)**，记录与追踪所有外部/仿真 API 服务接口调用（Sina 实时行情、Tushare 历史 K 线、飞书机器人推送等）。
- 实现高效、无阻塞的异步/同步双重审计日志记录工具，确保高频行情仿真与交易流调度的性能不受影响。
- 提供可视化审计日志大盘，展示调用量、成功率、今日频次、平均延迟等高保真指标。
- 支持高级多维过滤（按服务、状态、关键词检索 URL/参数/响应摘要）与分页浏览，并支持便捷日志清理。

### 2. 关键技术实现与交付文件
- **高时效异步审计引擎**：
  - [audit.py](file:///d:/WorkSpace/Asurada/backend/app/utils/audit.py)：独立研发底层核心审计组件。利用 `AsyncSession` 实现无阻塞异步日志写入，并设计同步包装器 `record_audit_log_sync` 适配多进程/同步仿真线程环境，自动捕获耗时并转存请求/响应载荷。
- **持久化数据表与 API 路由**：
  - [models.py](file:///d:/WorkSpace/Asurada/backend/app/models.py)：定义 `AuditLog` 关系表，物理留存 timestamp、service_name、interface_name、request_url、request_params、response_status、response_summary 及 duration_ms。
  - [main.py](file:///d:/WorkSpace/Asurada/backend/app/main.py)：
    - `GET /api/audit-logs`：支持 paginated & filtered 模糊检索查询接口。
    - `GET /api/audit-logs/stats`：实时计算总调用量、成功率（SUCCESS 占比）、今日总频次及毫秒级平均延迟（Average Latency）。
    - `DELETE /api/audit-logs`：清空历史日志。
  - [schemas.py](file:///d:/WorkSpace/Asurada/backend/app/schemas.py)：新增 `AuditLogResponse` 与 `AuditLogStatsResponse` Pydantic 数据规范契约。
- **全链路切面式审计整合**：
  - 在 [feishu.py](file:///d:/WorkSpace/Asurada/backend/app/agents/feishu.py) 中，记录 Orchestrator 每一阶段飞书群消息的发送响应与网络延迟。
  - 在 [sina_sim.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/sina_sim.py) 的日内行情多股、大盘仿真调度中，高频记录实时报价请求接口指标。
  - 在 [tushare_sim.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/tushare_sim.py) 的历史 K 线加载与门控降级逻辑中，切面捕获历史回溯加载状态。
- **系统设置级审计看板**：
  - [AuditLogs.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/AuditLogs.tsx)：设计了科技感拉满的毛玻璃浮雕审计看板：
    - 四大卡片指标：包含总调用频次、时序成功率、今日频次以及毫秒级平均耗时。
    - 服务及状态组合检索栏：提供实时关键字监听与防抖搜索过滤。
    - 精确明细列表：多色成功/失败指示器，列表悬浮行响应式变化。
    - 原生抽屉式详情面板：支持快速展开 raw 请求参数及原始返回 summary 数据。
    - 留痕数据一键清空：带双重防误触弹窗确认的一键清除操作。
  - [App.tsx](file:///d:/WorkSpace/Asurada/frontend/src/App.tsx) & [Sidebar.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/Sidebar.tsx)：路由和左侧导航栏无缝添加 `审计管理` 入口。

---

## 🟤 v1.4.0 Milestone 5: 今日股市大盘与个股买方画像预测大盘 (2026-05-29)

### 1. 核心任务目标
- 实现**今日股市大盘与核心龙头个股基本面穿透画像 (Today's Market & Valuation Center)** 模块。
- 深度整合实盘与高保真本地仿真数据源（Sina 实时大盘与个股报价，Tushare 专业财务基本面参数指标），保证在各种外部网络状况下皆能展现最佳数据状态。
- 支持行业板块多级分类，提供个股的买方深度财务画像（ROE/PE/PE历史分位/现金流优势/商业护城河分析）以及未来 3 年的经营/净利润预测多维数据。
- 构建行业板块及龙头个股分类的可视化层级配置中心，实现高灵活性 CRUD 编排并持久化同步 SQLite 库。

### 2. 关键技术实现与交付文件
- **行情与深度财务穿透链路**：
  - [market_today.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/market_today.py)：主导日内大盘行情数据聚合。支持实盘 Sina 接口提取实时快照，并针对数据断连/未交易时段引入了 Sina 仿真器及 Tushare 历史数据降级提取的双向兜底策略，将调用完整切面录入审计日志。
  - [market_details_data.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/market_details_data.py)：内置宁德时代 (300750.SZ)、贵州茅台 (600519.SH)、迈瑞医疗 (300760.SZ)、中芯国际 (688981.SH) 等核心权重的专业买方画像资产，涵盖详细经营优势、3年营业收入/净利润预测表、催化事件及风控红线。
- **配置编排持久化中心**：
  - [main.py](file:///d:/WorkSpace/Asurada/backend/app/main.py)：新增 `/api/discovery/today-market` 报价聚合终点、`/api/discovery/today-market/{symbol}/details` 基本面画像终点，以及个股板块层级配置的 GET/PUT 同步终点，完美读写 SQLite 库中的 `configuration` 表。
- **高颜值看板与动态抽屉**：
  - [TodayMarket.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/TodayMarket.tsx)：构建毛玻璃“今日股市”大盘。支持快速多维 HSL 板块分类快捷过滤与全文防抖检索，卡片动效悬停。
  - **右侧极客悬浮详情抽屉**：点击个股卡片以高级 CSS 过渡动画在右侧滑出画像面板，清晰渲染护城河详情、3年预测折合市盈率表格、催化因子列表及风险警告警示框，提供顶尖的沉浸式操作体验。
- **板块与个股层级配置编排**：
  - [SectorConfig.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/SectorConfig.tsx)：打造行业板块树分类配置模块。在交互上采取“轻量化设计原则”：创建板块时仅需维护板块名；而在具体板块中挂载股票时，才需设定地位、题材及买入/防御性警报触发词。自带 Preset Demo 数据的一键自动补全机制（Autofill）与出厂数据一键重置（Reset to Defaults）持久化。

---

## 🟤 v1.5.0 Milestone 6: 多用户 JWT 身份鉴权与安全审计控制系统 (2026-05-29)

### 1. 核心任务目标
- 研发**多用户认证与基于角色的访问控制权限（JWT Authentication & RBAC System）**。
- 引入符合高安全规范的 PBKDF2-SHA256 密码哈希存储机制，弃用一切不安全的明文比对。
- 实现标准 JWT (Header.Payload.Signature) 签发与签名自校验服务，不依赖重型外部库，提供轻量且可控的底层鉴权。
- 整合系统审计记录机制，升级 `AuditLog` 架构以实时审计追踪各用户（Operator）的物理接口操作，并在前端提供完备的管理员用户管理控制台。

### 2. 关键技术实现与交付文件
- **安全密码学与鉴权底座**：
  - [auth.py](file:///d:/WorkSpace/Asurada/backend/app/utils/auth.py)：开发独立的鉴权底座。使用标准 `hashlib.pbkdf2_hmac` 配合 secure random salt 实施 10 万次迭代 PBKDF2 Hashing。通过 `hmac-sha256` 以及 URL-safe base64 编解码实现标准 JWT 令牌的生成 `create_access_token` 与解密验证 `verify_access_token`。
- **数据表与接口认证层**：
  - [models.py](file:///d:/WorkSpace/Asurada/backend/app/models.py)：新增 `User` 表（物理存贮 username, hashed_password, salt, role 级别及 active 状态），并为 `AuditLog` 新增 `operator` 审计人字段。
  - [main.py](file:///d:/WorkSpace/Asurada/backend/app/main.py)：
    - `/api/auth/login`：用户安全登录并派发 signed JWT。
    - `/api/users` 族群 APIs：提供多用户管理全套 CRUD（支持重置密码、权限等级变更、用户激活锁定）。
    - 针对数据清空等高敏物理 API 路由整合鉴权逻辑，实时从 JWT 中提取 Username 并物理沉淀至 `AuditLog.operator` 中。
- **毛玻璃极客登入面板与用户大盘**：
  - [App.tsx](file:///d:/WorkSpace/Asurada/frontend/src/App.tsx)：在顶层无缝嵌入玻璃微光拟物化登入面板（Login Card），支持 `admin / admin123` 预置离线自适应鉴权及错误强回馈，保障系统初次部署时的即用性与安全性。
  - [AuditLogs.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/AuditLogs.tsx)（双 Tab 精致升级）：
    - **审计管理 Tab**：在物理明细表中新增 `👤 操作人 (Operator)` 标签指示器，区分系统自主调度 (system)、管理员 (admin) 及操作员行为。
    - **管理员管理 Tab**：新增完整的管理员人员管理大盘，支持添加管理员、一键重置密码弹框校验、角色角色锁（Admin/Operator）一键变更、锁定/激活用户等交互。基于 RBAC 规范限制不同角色之间的交互权限（普通管理员无权修改或重置超级管理员密码）。

---

## 🔵 v1.6.0 Milestone 7: 重点筛选池与个股深度投研画像系统 (2026-05-30)

### 1. 核心任务目标
- 构建个人化"重点筛选池 (Focus Watchlist)"，用户可从今日大盘或智能选股模块一键收藏关注标的。
- 对每只重点池个股提供全维度深度投研画像：买方评级、投资逻辑、止盈/止损目标、自定义标签及研究笔记。
- 实现个股详情穿透页面（StockDetail），整合 K 线图表、成本分布、基本面数据、资金流向等多模块视图。
- 完善重点池全套 CRUD API 并集成非阻塞审计日志记录。

### 2. 关键技术实现与交付文件
- **ORM 模型**: [models.py](file:///d:/WorkSpace/Asurada/backend/app/models.py) 新增 `FocusStock` 实体表，物理留存 symbol、name、sector、added_at、rating（⭐评级）、custom_tags（自定义标签）、investment_logic（投资逻辑）、target_price（目标价）、stop_loss（止损价）及 notes（研究笔记）。
- **全套 CRUD API**: [main.py](file:///d:/WorkSpace/Asurada/backend/app/main.py) 新增 `/api/focus-watchlist` GET/POST/PUT/DELETE 四端点。添加时自动排重，更新与删除时非阻塞审计 `record_audit_log_sync` 切面捕获。
- **Pydantic 契约**: [schemas.py](file:///d:/WorkSpace/Asurada/backend/app/schemas.py) 新增 `FocusStockBase`、`FocusStockCreate`、`FocusStockUpdate`、`FocusStockResponse` 四层数据模型。
- **重点筛选池前端**: [FocusWatchlist.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/FocusWatchlist.tsx) 构建高颜值重点池管理面板，支持卡片式一览、评级星标快捷筛选、自定义标签渲染、投资逻辑折叠展示，以及一键添加/编辑/移出操作。
- **个股详情穿透**: [StockDetail.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/StockDetail.tsx) 实现个股深度画像页面，涵盖 K 线走势图、成本分布柱状图、基本面指标卡片（ROE/PE/市值/换手率）及资金流向分析，支持从今日大盘与重点池无缝跳转。
- **导航整合**: [Sidebar.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/Sidebar.tsx) 在"选股与题材"分组下新增"重点筛选池 (Focus Watchlist)"入口，使用 Star 图标。

---

## 🟠 v1.7.0 Milestone 8: AI 投研产业链驾驶舱深度研究系统 (2026-05-30)

### 1. 核心任务目标
- 构建**研报驱动型产业链深度研究系统**，而非简单看板。核心定位："结论必须来自研报，AI 推理必须有证据溯源"。
- 实现投研板块（ResearchSector）生命周期管理，支持按行业主题（人形机器人、半导体设备、固态电池等）建立独立研究空间。
- 构建产业链节点画布（IndustryChainNode），可视化展示上中下游核心模块、成本占比、国产化率、壁垒评分及替代风险。
- 实现 BOM 成本结构监测（CostStructure），追踪降本路径与目标成本演化。
- 研发 AI 投研结论（ResearchConclusion）与证据溯源链（Evidence），每条 AI 结论追溯至：结论 → 研报 → 页码 → 原文片段 → 置信度评分。
- 构建研报索引系统（ResearchReport），录入机构研报元数据与质量评分。

### 2. 关键技术实现与交付文件
- **6 张核心 ORM 关系表**: [models.py](file:///d:/WorkSpace/Asurada/backend/app/models.py) 新增 `ResearchSector`（投研板块）、`ResearchReport`（研报索引）、`IndustryChainNode`（产业链节点）、`CostStructure`（成本结构）、`ResearchConclusion`（AI 投研结论）、`Evidence`（证据溯源链），构成完整的"板块 → 节点/成本/结论 → 研报证据"层级关系模型。
- **7 个 RESTful API 端点**: [main.py](file:///d:/WorkSpace/Asurada/backend/app/main.py) 新增 `/api/cockpit/sectors` GET/POST、`/api/cockpit/sectors/{sector_id}/nodes`、`/costs`、`/conclusions`、`/reports` 及 `/api/cockpit/conclusions/{conclusion_id}/evidences` 证据链穿透端点。
- **12 个 Pydantic 数据契约**: [schemas.py](file:///d:/WorkSpace/Asurada/backend/app/schemas.py) 新增覆盖全部 6 个实体的 Base/Create/Response 三层 Pydantic Schema。
- **种子数据**: [loader.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/loader.py) 预填充 3 个板块（人形机器人、半导体设备、固态电池）+ 3 个节点 + 2 个成本 + 2 条结论 + 2 份研报 + 2 条证据，实现首次启动即可演示。
- **板块管理列表**: [CockpitList.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/CockpitList.tsx) 实现高颜值投研板块管理面板，顶部四大统计指标（板块数/已分析/研报数/AI智能体），支持新建板块模态表单（名称/分类/机会等级/风险等级/描述），卡片式板块一览并可跳转产业链画布。
- **产业链深度画布**: [CockpitDashboard.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/CockpitDashboard.tsx) 实现沉浸式产业链研究驾驶舱：
  - **AI 结论横幅**：可点击展开的结论卡片，展示结论类型、内容、置信度评分、复核状态。
  - **产业链节点画布**：网格式节点卡片，展示核心模块名称/类型/成本占比/国产化率/投资价值分。点击节点展开"检测器"面板，显示壁垒评分与替代风险评分进度条。
  - **BOM 成本监测面板**：成本项列表，含当前成本/目标成本/降本速率/置信度/数据来源。
  - **证据溯源链**：展示研报原文片段引用，含页码、置信度、关联研报元数据。
  - **研报索引**：已录入研报列表及质量评分展示。
- **导航整合**: [Sidebar.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/Sidebar.tsx) 将"产业链驾驶舱 (Cockpit)"置为仅次于"工作台"的顶级一级导航项，使用 Network 图标。

---

## 🔴 v1.8.0 Milestone 9: AI 模型配置管理中心与模型调用审计系统 (2026-05-30)

### 1. 核心任务目标
- 构建系统级 AI 模型配置管理中心（ModelConfig），支持多模型注册、API 密钥管理、连接测试与默认模型切换。
- 实现模型调用审计日志系统（ModelLog），精确记录每次 AI 模型调用的任务名/调用方/模型标识/Token 消耗/请求载荷/响应体/耗时。
- 提供模型连接自动化测试（Test Connection），仿真环境下验证模型可达性并实时更新状态。

### 2. 关键技术实现与交付文件
- **ORM 模型**: [models.py](file:///d:/WorkSpace/Asurada/backend/app/models.py) 新增 `ModelConfig` 表（物理留存 name、identifier、provider、description、api_key、base_url、is_default、capabilities、status、error_message、latency_ms、tested_at、sort_order）及 `ModelLog` 表（留存 task_name、task_id、username、user_id、model_id、model_url、status_code、started_at、ended_at、input_tokens、output_tokens、request_payload、response_body）。
- **全套模型管理 API**: [main.py](file:///d:/WorkSpace/Asurada/backend/app/main.py) 新增 `/api/models` GET/POST/PUT/DELETE 四端点全套 CRUD，`/api/models/test` 连接测试端点（自动写入 ModelLog 审计），以及 `/api/model-logs` 日志分页检索端点（支持全文搜索）。设默认模型切换时自动互斥重置。
- **Pydantic 契约**: [schemas.py](file:///d:/WorkSpace/Asurada/backend/app/schemas.py) 新增 `ModelConfigBase`、`ModelConfigCreate`、`ModelConfigUpdate`、`ModelConfigResponse` 及 `ModelLogResponse` 数据模型。
- **模型配置前端**: [ModelConfig.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/ModelConfig.tsx) 构建模型配置管理面板。支持模型卡片式一览（含 Provider 徽章、Capabilities 标签、连接状态指示器、延迟毫秒数）、新增模型表单、编辑模型参数、一键测试连接、默认模型切换及删除操作。
- **模型调用记录前端**: [ModelLogs.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/ModelLogs.tsx) 在审计管理模块下新增"模型调用记录 (Model Logs)" Tab，展示模型调用明细表（任务名/调用方/模型/状态码/Token 消耗/耗时），支持全文搜索与详情抽屉展开查看 raw 请求/响应载荷。
- **导航整合**: [Sidebar.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/Sidebar.tsx) 在"审计管理"分组下新增"模型调用记录 (Model Logs)"入口（使用 Cpu 图标），在"配置中心"分组下新增"模型配置 (Model Config)"入口。

---

## 📈 核心交付文件清单

| 组件 | 文件路径 | 作用与职责说明 |
| :--- | :--- | :--- |
| **主配置** | [GEMINI.md](file:///d:/WorkSpace/Asurada/GEMINI.md) | 全景系统架构说明、多智能体协同设计及本地部署指南（遵循规则模版） |
| **后端** | [auth.py](file:///d:/WorkSpace/Asurada/backend/app/utils/auth.py) | 基于标准库及 PBKDF2-SHA256 / HMAC-SHA256 实现的标准 JWT 鉴权底层 |
| **后端** | [audit.py](file:///d:/WorkSpace/Asurada/backend/app/utils/audit.py) | 异步/同步核心审计记录引擎，提供切面化接口数据拦截与物理留存机制 |
| **后端** | [market_today.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/market_today.py) | 今日股市大盘与个股多数据源行情融合引擎，内置高时效审计日志调用拦截 |
| **后端** | [market_details_data.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/market_details_data.py) | 内置核心权重的专业级买方画像财务亮点、3年业绩预测矩阵数据源 |
| **后端** | [discovery_engine.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/discovery_engine.py) | 3层选股初筛与打分、买方深度 Markdown 研报生成器、飞书快照 Delta 滚动引擎 |
| **后端** | [orchestrator.py](file:///d:/WorkSpace/Asurada/backend/app/agents/orchestrator.py) | 主交易生命周期调度中枢，实现盘后数据质量门控、假预警信号对账、降噪自优化逻辑 |
| **后端** | [main.py](file:///d:/WorkSpace/Asurada/backend/app/main.py) | FastAPI 核心路由接口组，包含选股、审计统计、今日股市大盘、用户管理及 JWT 鉴权全套 APIs |
| **前端** | [TodayMarket.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/TodayMarket.tsx) | 今日大盘数据看板，支持 HSL 主动上色，个股基本面穿透与 3 年预测详情抽屉渲染 |
| **前端** | [AuditLogs.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/AuditLogs.tsx) | 审计与调用大盘，合并管理员用户管理 Tab，支持完整的管理员 CRUD 与密码重置编排 |
| **前端** | [SectorConfig.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/SectorConfig.tsx) | 极简板块/个股映射树编排后台，全量 CRUD 动作同步，自带 Demo 级快捷自动填补 |
| **前端** | [Discovery.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/Discovery.tsx) | 题材与选股面板，支持滑动条交互、Top-N 动画卡片、Checklist 盘口验证及研报阅读器 |
| **前端** | [Review.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/Review.tsx) | 盘后复盘控制台，多色状态徽章、降级警告悬浮弹窗、历史复盘文件查看与一键应用优化参数按钮 |
| **前端** | [index.css](file:///d:/WorkSpace/Asurada/frontend/src/index.css) | 毛玻璃微光（Glassmorphism）核心 CSS 变量系统与浮雕面板 Hover 等动效实现 |
| **后端** | [loader.py](file:///d:/WorkSpace/Asurada/backend/app/datahub/loader.py) | 数据库建表 + 种子数据注入引擎，含投研板块/节点/成本/研报/证据全量初始化 |
| **前端** | [FocusWatchlist.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/FocusWatchlist.tsx) | 重点筛选池管理面板，支持评级星标、标签渲染、投资逻辑展示与增删改操作 |
| **前端** | [StockDetail.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/StockDetail.tsx) | 个股深度投研画像页，涵盖 K 线/成本分布/基本面/资金流向穿透视图 |
| **前端** | [CockpitList.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/CockpitList.tsx) | 投研板块管理列表，统计指标汇总/板块创建/板块卡片导航至产业链画布 |
| **前端** | [CockpitDashboard.tsx](file:///d:/WorkSpace/Asurada/frontend/src/pages/CockpitDashboard.tsx) | 产业链深度研究驾驶舱，AI结论/节点画布/BOM成本/证据溯源/研报索引五维画面 |
| **前端** | [ModelConfig.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/ModelConfig.tsx) | AI 模型配置管理面板，模型注册/密钥管理/连接测试/默认模型切换全套 CRUD |
| **前端** | [ModelLogs.tsx](file:///d:/WorkSpace/Asurada/frontend/src/components/ModelLogs.tsx) | 模型调用审计记录，任务级明细/Token消耗追踪/请求响应载荷穿透查看 |

---
*“让交易更有纪律，让投资更加宁静。” — Asurada 智能交易开发委员会*
