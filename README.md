# 🏁 Asurada (阿斯拉达)

> **专注 A 股的多智能体个人量化交易辅助系统**
>
> 秉承“降噪至上、稳健优先”的核心投资理念，将 Mark Minervini 的**波动率收缩形态（VCP）**与 Al Brooks 的**裸 K 价格行为学（Price Action）**深度融合，构建了集盘前计划、盘中盯盘、盘后复盘、选股题材挖掘于一体的全封闭式多智能体决策系统。

---

## 🎨 界面视觉设计风格 (Design Aesthetics)
系统前端采用前沿的 **玻璃微光拟物化 (Glassmorphism & Radial Glow)** 视觉风格，搭配精细调整的极客暗蓝与柔和高亮色彩系统：
- **毛玻璃浮雕卡片**：采用 `backdrop-filter: blur(12px)` 与超细微光渐变边框，界面层次分明且通透。
- **动态呼吸光斑**：背景配备高质感的径向漫反射蓝色微光，带来极致的沉浸式极客体验。
- **丰富微动画**：所有按钮及卡片均具有流畅的贝塞尔曲线悬停动效与状态呼吸动画。

---

## 🛠️ 技术栈 (Technology Stack)
- **前端 (Frontend)**：React 19 + TypeScript + Vite 8 + Recharts 3 + Lucide Icons + Glassmorphism Vanilla CSS.
- **后端 (Backend)**：FastAPI 0.100+ + SQLAlchemy 2.0+ + Async SQLite (aiosqlite) + Uvicorn.
- **智能体与通信 (Agents & Pushing)**：主调度 Orchestrator Agent + 波动率收缩趋势 VCPAgent + 价格行为 BrooksAgent + 飞书智能通知卡片 FeishuBot。

---

## 📂 核心功能模块与场景流
1. **统一工作台 (Workbench)**：聚合全市场核心指数、今日待办清单、个人持仓占比、近期关键预警以及多智能体服务状态。
2. **盘前计划一页纸 (Plan Phase)**：每日盘前调用 VCPAgent 与 BrooksAgent，自动扫描产生包含止损防守位与仓位上限的**盘前可执行计划一页纸**，并通过飞书静默/强力推送。
3. **盘中盯盘降噪审计 (Observe Phase)**：仿真高频日内 Tick 数据流，辅以**“15-30分钟合并窗口拦截”**与**“单日预警数量上限门控”**，剔除 90% 以上日内盘中毛刺噪音。
4. **盘后智能复盘审计 (Review Phase)**：
   - **Tushare 数据门控**：监测 API 数据延迟与缺失异常，超时则自动触发**“报告已降级”**警告。
   - **双重策略复盘视角**：审计 Joyce 仓位风险红线（单个股 $\le 30\%$ 占比）与 Brooks 裸 K 经典收盘反弹判定。
   - **信号对账与自优化**：盘后比对盘中异动与收盘表现，计算全天信号噪音率。如噪音率过高，Orchestrator 自动激活优化建议，支持**“一键优化应用降噪参数”**持久化至配置库。
5. **智能选股与题材挖掘 (Discovery Phase)**：
   - **三层过滤管道**：Layer 1 基础过滤（剔除 ST、停牌、低市值及低流动性），Layer 2 多维量化打分（技术 VCP、基本面预期、风险评估），Layer 3 自动输出亟待调研关键提纲与盘口验证 Checklist。
   - **一键深度研报 (Deep Research)**：生成买方高确定性题材穿透与硬逻辑深度剖析报告。
6. **系统审计与留痕管理 (Audit & Logging)**：
   - **全切面网络捕获**：对 Sina 实时行情、Tushare 历史 K 线加载以及飞书机器人推送等核心外部接口实施非阻塞性 AOP 式耗时与内容监控。
   - **可视化指标大盘**：直观展示系统累积调用量、成功率、今日频次、平均延迟等高保真运行状况（Health Status）。
   - **高级检索与排查**：支持多维复合检索（服务源、响应状态、全文关键词），支持原生折叠抽屉查看 Raw 载荷（Params & Summary），并提供一键清空机制。
7. **今日大盘与龙头画像 (Today's Market & Valuation)**：
   - **板块龙头报价**：整合 Sina 实时行情与本地高保真模拟行情，提供 A 股核心行业板块（白酒、半导体、新能源、AI等）龙头的实时状态。
   - **穿透式基本面画像**：右侧滑出浮动抽屉，展示 ROE、在手现金流、买方商业护城河分析，以及未来 3 年（2025E-2027E）的营业收入与净利润复合增长预测。
   - **分类层级配置树**：在配置中心支持板块与个股的全动态 CRUD，以“板块”为聚合容器，个股单独维护风控触发条件，并一键持久化同步至 SQLite。
8. **安全防线与鉴权审计 (Authentication & RBAC)**：
   - **多用户认证**：整合基于标准 `hashlib` 实现的 PBKDF2-SHA256 安全哈希密码存储，并自研轻量级 HMAC-SHA256 JWT 自签名与权限校验机制。
   - **基于角色的鉴权**：在接口层整合 RBAC。对清空日志、编辑配置等高敏 API 实施硬防护；在物理明细审计日志中，将操作者账户名（Operator）无缝捕获落库。
   - **管理员维护中心**：新增人员管理 Tab，支持密码重置、权限升降级（Admin/Operator）和账户封禁，实现安全审计全回路闭环。
9. **重点筛选池与个股画像 (Focus Watchlist & Stock Detail)**：
   - **个人重点池**：从今日大盘或智能选股模块一键收藏关注标的，支持买方评级（⭐星标）、投资逻辑摘要、止盈/止损目标价及自定义标签。
   - **个股深度画像**：穿透至个股详情页，整合 K 线走势、成本分布柱状图、基本面指标卡片（ROE/PE/市值/换手率）及资金流向分析。
   - **全链路 CRUD**：完整的添加、编辑、移出操作，每次变更自动切面审计入库。
10. **AI 投研产业链驾驶舱 (Industry Chain Cockpit)**：
   - **研报驱动深度研究**：核心定位是"结论必须来自研报"，每条 AI 结论追溯至研报原文页码与置信度评分。
   - **投研板块管理**：按行业主题（人形机器人、半导体设备、固态电池等）建立独立研究空间。
   - **产业链节点画布**：可视化展示上中下游核心模块、成本占比、国产化率、壁垒评分及替代风险。
   - **BOM 成本监测**：追踪各核心模块的当前成本、目标成本、降本速率及数据来源可信度。
   - **证据溯源链**：AI 结论 → 研报 → 页码 → 原文片段 → 置信度评分，完整证据链路闭环。
11. **AI 模型配置与调用审计 (Model Config & Logs)**：
   - **多模型管理中心**：注册多个 AI 模型（OpenAI/Claude/Gemini等），管理 API 密钥、服务端点、能力标签与默认模型切换。
   - **连接测试**：一键测试模型可达性，实时展示状态与延迟毫秒数。
   - **调用审计追踪**：精确记录每次模型调用的任务名、调用方、Token 消耗、请求/响应载荷与耗时，支持全文搜索与详情穿透。

---

## 📚 Gemini 智能体文档与开发日志
关于本系统多智能体协作细节、各模块开发历程、核心算法公式、增量 delta 飞书动态更新机制以及里程碑交付，请查阅专门的说明文件与开发日志：

👉 **[查看系统架构与主配置文档 (GEMINI.md)](file:///d:/WorkSpace/Asurada/GEMINI.md)**

👉 **[查看多智能体独立开发迭代日志 (ITERATION_LOG.md)](file:///d:/WorkSpace/Asurada/ITERATION_LOG.md)**

👉 **[查看 Claude/Gemini 行为指南与架构总览 (CLAUDE.md / AGENTS.md)](file:///d:/WorkSpace/Asurada/CLAUDE.md)**

---

## 🚀 极速本地部署指南

### 1. 后端启动 (FastAPI)
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seed_tushare_configs.py  # 初始化数据库并预填数据
python run.py                   # 启动开发服务器
```
*后端将在 `http://127.0.0.1:8000` 运行。*

### 2. 前端启动 (React + Vite)
```powershell
cd frontend
npm install
npm run dev
```
*前端将在 `http://localhost:5173` 运行，打开浏览器即可体验最前沿的阿斯拉达智能投资世界。*

---
*“让交易更有纪律，让投资更加宁静。” — Asurada 智能交易开发委员会*
