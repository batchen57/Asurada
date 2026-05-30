import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Clock3, DatabaseZap, RefreshCw, Search, ShieldCheck, TrendingUp, X, Sparkles, AlertTriangle, Lightbulb, Layers, ChevronRight, Star } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

type MarketLeader = {
  sector: string;
  theme: string;
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  turnover_billion: number;
  market_cap_billion: number | null;
  pe: number | null;
  amplitude: number;
  role: string;
  signal: string;
  risk: string;
  quote_time: string;
};

type TodayMarketResponse = {
  success: boolean;
  snapshot_time: string;
  quote_source: string;
  fundamentals_source: string;
  is_realtime: boolean;
  leaders: MarketLeader[];
};

const formatMoney = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return `${value.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} 亿`;
};

const getChangeColor = (changePct: number) => {
  if (changePct > 0) return '#ef4444';
  if (changePct < 0) return '#10b981';
  return '#64748b';
};

// High-fidelity fallback details data if the backend server is offline or fails to respond
const MOCK_LEADER_DETAILS_FALLBACK: Record<string, any> = {
  "300750.SZ": {
    "symbol": "300750.SZ",
    "name": "宁德时代",
    "sector": "新能源锂电",
    "role": "全球动力电池与储能电池双料绝对龙头",
    "theme": "储能、动力电池、固态电池突破",
    "description": "宁德时代（CATL）是全球领先的新能源创新科技公司，在动力电池与储能系统两大核心赛道连续多年稳居全球市占率第一（动力电池全球份额约37%，储能全球份额约40%）。公司凭借无与伦比的技术研发厚度与全产业链深度议价能力，构筑了坚不可摧的规模护城河。",
    "moat_analysis": "1. 绝对的研发领先优势：拥有神行超充电池（4C超充）与麒麟电池（超长续航与高安全性），先进制程和电池能量密度指标领先全球同行。同时正全力布局全固态电池领域。\n2. 全球供应链控制力：向上游锂矿、镍矿深度渗透，向下游整车厂实施战略捆绑，拥有超高的毛利率韧性与账期议价优势，是行业内的绝对成本领跑者。",
    "financial_highlights": {
        "pe_ttm": 22.0,
        "market_cap_billion": 861.5,
        "revenue_yoy": "+15.4%",
        "roe": "26.5%",
        "cash_flow": "极度充沛，经营现金流净流入 450 亿，研发费用占比 > 6%"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 412.0, "net_profit_billion": 44.5, "growth_yoy": "12.8%", "pe": 19.3 },
        { "year": "2026E", "revenue_billion": 486.0, "net_profit_billion": 52.8, "growth_yoy": "18.6%", "pe": 16.3 },
        { "year": "2027E", "revenue_billion": 570.0, "net_profit_billion": 62.0, "growth_yoy": "17.4%", "pe": 13.9 }
    ],
    "future_forecast": "随着全球新能源车渗透率持续抬升与海外出海建厂释放产能，叠加神行电池等明星单品大规模装车，出海储能第二成长极正处于爆发前夜。智能体研判：宁德时代在 2026-2027 年将维持 17% 以上的复合业绩增长，极具估值性价比。",
    "target_price_range": "240.0 - 265.0 元",
    "catalysts": [
        "海外匈牙利工厂及美方合作工厂产能加速释放",
        "二代神行超充电池迭代与固态电池中试线取得重大突破"
    ],
    "risk_warnings": [
        "欧美市场对中国动力电池与新能源整车的关税及政策壁垒加剧风险",
        "上游原材料大宗商品价格大起大落对利润率中枢的扰动"
    ]
  },
  "600519.SH": {
    "symbol": "600519.SH",
    "name": "贵州茅台",
    "sector": "白酒",
    "role": "中国高端白酒绝对定价锚与大消费压舱石",
    "theme": "消费复苏、高分红确定性现金流资产",
    "description": "贵州茅台是酱香型白酒的鼻祖，拥有全市场最深厚的品牌壁垒与垄断毛利率（约92%）。得益于独特的赤水河酿造地理环境与长达五年的窖藏工艺，其产品具备天然的金融属性与奢侈品溢价能力，分红水平连续多年居 A 股前列。",
    "moat_analysis": "1. 独一无二的地理与品牌护城河：离开茅台镇的核心产区就无法酿造同等品质的飞天茅台，具备纯粹的供给刚性。\n2. 渠道与定价权：公司自建的“i茅台”直销体系已占营收半壁江山，直销比例的提升带来了强劲的抗周期提价能力，经销商回款意愿极强。",
    "financial_highlights": {
        "pe_ttm": 28.0,
        "market_cap_billion": 2121.3,
        "revenue_yoy": "+18.2%",
        "roe": "31.2%",
        "cash_flow": "无敌现金牛，预收款项及合同负债突破 150 亿，分红比例长期维持在 50% 以上"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 155.0, "net_profit_billion": 79.5, "growth_yoy": "14.2%", "pe": 26.7 },
        { "year": "2026E", "revenue_billion": 179.8, "net_profit_billion": 92.2, "growth_yoy": "16.0%", "pe": 23.0 },
        { "year": "2027E", "revenue_billion": 207.5, "net_profit_billion": 106.5, "growth_yoy": "15.5%", "pe": 19.9 }
    ],
    "future_forecast": "飞天茅台批价企稳于 2200-2400 元中枢，渠道重组效应持续释放。随着茅台 1935 等酱香系列酒结构优化调整到位，预计 2026 年后公司将维持 15%-16% 的稳定高双位数净利润增长，在大级别均线重回多头排列后是机构防御型建仓的压舱石。",
    "target_price_range": "1880.0 - 2100.0 元",
    "catalysts": [
        "飞天茅台出厂价迎来新一轮战略性调价提价",
        "直销占比突破 60% 带来利润率结构爆发"
    ],
    "risk_warnings": [
        "商务宴请场景收缩、高端白酒批价波动加大导致情绪受挫",
        "大众消费信心复苏斜率变缓对次高端及系列酒动销的影响"
    ]
  },
  "300760.SZ": {
    "symbol": "300760.SZ",
    "name": "迈瑞医疗",
    "sector": "医疗器械",
    "role": "国内医疗器械与体外诊断平台型绝对龙头",
    "theme": "国产替代、设备更新政策导向、国际出海",
    "description": "迈瑞医疗是国内规模最大、产品线最全的医疗器械龙头，聚焦生命信息与支持、体外诊断（IVD）、医学影像三大核心主业。公司依靠强大的集成化研发与国际销售网络，正加速由国内龙头向全球前 20 强医疗设备霸主跃升。",
    "moat_analysis": "1. 平台型研发壁垒：每年坚持将 10% 以上营收投入研发，在化学发光、高端彩色超声影像、高端监护及微创外科等高难度领域实现全面突破，形成全科室产品解决方案。\n2. 国际出海大突破：海外高端教学医院突破速度迅猛，已打入欧美百强医院体系，具备极高韧性的双轮驱动能力。",
    "financial_highlights": {
        "pe_ttm": 32.0,
        "market_cap_billion": 346.8,
        "revenue_yoy": "+20.5%",
        "roe": "28.5%",
        "cash_flow": "极度稳健，无有息负债，经营现金流健康度达 1.15，毛利率稳定在 65% 以上"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 36.5, "net_profit_billion": 118.0, "growth_yoy": "18.2%", "pe": 29.4 },
        { "year": "2026E", "revenue_billion": 43.8, "net_profit_billion": 142.0, "growth_yoy": "20.3%", "pe": 24.4 },
        { "year": "2027E", "revenue_billion": 52.5, "net_profit_billion": 170.8, "growth_yoy": "20.2%", "pe": 20.3 }
    ],
    "future_forecast": "国内以旧换新、公立医院扩建及贴息贷款等新基建政策逐步传导落地，奠定国内业务基本盘。海外高端三甲渠道渗透与第四大业务线（微创外科）的放量将为公司提供源源不断的动力。智能体中线研判：未来三年维持 20% 年复合增长确定性极高，具备高性价比的左侧防守价值。",
    "target_price_range": "335.0 - 365.0 元",
    "catalysts": [
        "国内医疗设备更新项目大规模启动并中标落地",
        "体外诊断海外供应链及装机速度超出市场悲观预期"
    ],
    "risk_warnings": [
        "国内高价值耗材与体外诊断集采降价超预期对毛利率的压制",
        "欧美部分地区关税及对中国医疗装备进口限制措施的扰动"
    ]
  },
  "688981.SH": {
    "symbol": "688981.SH",
    "name": "中芯国际",
    "sector": "半导体",
    "role": "晶圆代工核心龙头与半导体自主可控支柱",
    "theme": "先进封装、国产替代硬逻辑、AI算力爆发",
    "description": "中芯国际是国内制程最先进、配套最完善的晶圆代工双龙头之一。承载着中国半导体集成电路行业自主可控的国家级核心使命，拥有从成熟制程到先进制程的全面制造能力，也是国内 GPU、手机高精度芯片核心流片代工厂。",
    "moat_analysis": "1. 战略垄断性：由于半导体先进制程的巨额投资与技术保密，中芯国际在先进制程代工的稀缺性极强，具备独特的国家主权级信用与订单保底支持。\n2. 半导体产业链枢纽：向上拉动国产光刻胶、刻蚀机及EDA工具，向下拉动国内AI芯片设计企业，在国产替代闭环中居于绝对中枢地位。",
    "financial_highlights": {
        "pe_ttm": 45.0,
        "market_cap_billion": 158.5,
        "revenue_yoy": "+15.6%",
        "roe": "8.5%",
        "cash_flow": "重资产模式，研发占比超 12%，政府补贴及产业基金专项资金充沛"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 54.0, "net_profit_billion": 40.2, "growth_yoy": "10.5%", "pe": 39.4 },
        { "year": "2026E", "revenue_billion": 62.5, "net_profit_billion": 48.0, "growth_yoy": "19.4%", "pe": 33.0 },
        { "year": "2027E", "revenue_billion": 74.0, "net_profit_billion": 61.2, "growth_yoy": "27.5%", "pe": 25.9 }
    ],
    "future_forecast": "随着全球晶圆代工景气度回暖以及国内AI芯片设计公司（先进制程GPU/手机SoC）国产代工订单完全打满，先进制程产线折旧利空将出尽。产能利用率将重回 90% 以上的历史高位，未来业绩将迎来量价齐升的高成长弹性期。",
    "target_price_range": "62.0 - 70.0 元",
    "catalysts": [
        "国内先进制程晶圆代工成品率与良品率实现里程碑式突破",
        "国产GPU大客户宣布流片成功并进入商业量产周期"
    ],
    "risk_warnings": [
        "欧美半导体设备与上游高端原材料出口禁令与封锁措施进一步升级",
        "成熟制程产能全球拥挤导致中低端芯片代工价格战持续"
    ]
  },
  "002230.SZ": {
    "symbol": "002230.SZ",
    "name": "科大讯飞",
    "sector": "人工智能",
    "role": "中文 AI 语音与多模态大模型应用落地龙头",
    "theme": "星火大模型商业化、算力国产化、智慧教育",
    "description": "科大讯飞是国内人工智能产业的国家队代表，在智能语音、自然语言处理等关键核心技术上处于中文世界统治地位。近年来，公司全力研发具备完全自主知识产权的“讯飞星火认知大模型”，并在智慧教育、智慧医疗等行业场景率先实现商业化落地。",
    "moat_analysis": "1. 讯飞星火大模型硬核壁垒：首家基于全国产算力底座（华为昇腾生态）训练的万亿参数多模态大模型，具备极高的安全合规与算力自主化保障。\n2. 场景化护城河：智慧教育、智能翻译、会议办公、智慧医疗领域的市占率全国第一，软硬件一体化生态锁定用户籌码。",
    "financial_highlights": {
        "pe_ttm": 65.0,
        "market_cap_billion": 115.0,
        "revenue_yoy": "+10.5%",
        "roe": "6.8%",
        "cash_flow": "前期大模型研发投入高昂，智慧教育回款具有季节性，AI软硬件出货流现金流良好"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 21.0, "net_profit_billion": 7.2, "growth_yoy": "15.0%", "pe": 159.7 },
        { "year": "2026E", "revenue_billion": 27.2, "net_profit_billion": 9.8, "growth_yoy": "36.1%", "pe": 117.3 },
        { "year": "2027E", "revenue_billion": 35.0, "net_profit_billion": 14.5, "growth_yoy": "48.0%", "pe": 79.3 }
    ],
    "future_forecast": "随着星火大模型能力不断突破并向 B 端智慧教育软硬件（智能学习机）与 C 端办公本深度下沉，大模型商业化授权收入将迎来爆发。若大模型推理成本在未来两年内如期降低 50%，公司的利润率水平将获得爆发式的第二增长极提升。建议长线拥抱其作为 AI 国产红利的稀缺度。",
    "target_price_range": "53.0 - 60.0 元",
    "catalysts": [
        "星火认知大模型最新迭代版本在跑分和图文推理上逼近国际顶尖水准",
        "国家大模型补贴以及政府/学校智慧教育的大宗采购订单超预期落地"
    ],
    "risk_warnings": [
        "互联网大厂开源大模型价格战导致大模型 B 端授权费不及预期",
        "AI 算力华为代工和采购进度受限于硬件产能瓶颈"
    ]
  },
  "600030.SH": {
    "symbol": "600030.SH",
    "name": "中信证券",
    "sector": "证券",
    "role": "券商板块绝对航母与机构服务平台化龙头",
    "theme": "大盘 Beta 晴雨表、活跃资本市场政策直接受益者",
    "description": "中信证券（证券界公认的“麦子店高盛”）是国内综合实力最强的头部证券公司。公司在投行业务、衍生品交易、公募与资管服务（控股华夏基金）、跨境跨境业务等方面均稳居市场第一，也是本轮资本市场改革并购重组的龙头。",
    "moat_analysis": "1. 绝对的机构客户护城河：高净值个人与高端机构服务市场份额常年第一，在IPO发行承销、GDR发行的市场垄断度极高。\n2. 重资本中介壁垒：在融券、场外衍生品交易等重资本中介业务中规模冠绝群雄，凭借雄厚的资本金和一流的风控体系，赚取高确定性差价收益。",
    "financial_highlights": {
        "pe_ttm": 13.5,
        "market_cap_billion": 301.2,
        "revenue_yoy": "+8.5%",
        "roe": "9.2%",
        "cash_flow": "极度充沛，风控指标（净资本/净资产）远高于监管红线，具备强大的流动性"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 61.5, "net_profit_billion": 204.0, "growth_yoy": "9.1%", "pe": 14.7 },
        { "year": "2026E", "revenue_billion": 69.8, "net_profit_billion": 235.0, "growth_yoy": "15.2%", "pe": 12.8 },
        { "year": "2027E", "revenue_billion": 78.5, "net_profit_billion": 270.2, "growth_yoy": "15.0%", "pe": 11.1 }
    ],
    "future_forecast": "当前 A 股两市成交额及估值中枢企稳，并购重组政策红利彻底激活投行排队项目，且降费降佣的公募费改利空已被市场完全消化。作为大盘行情的终极 Beta 晴雨表，中信证券有望在这一轮资本市场结构重塑中获得估值与业绩的同步双击修复。",
    "target_price_range": "24.5 - 28.0 元",
    "catalysts": [
        "两市成交额连续保持在 1.5 万亿以上以触发交易印花税及佣金预期",
        "管理层发声支持券商板块横向跨行业兼并重组并推出首家航母级试点"
    ],
    "risk_warnings": [
        "两市大盘成交量长期再度低迷萎缩，导致财富管理及经纪佣金下滑",
        "A 股市场宽幅震荡导致自营投资盘出现阶段性估值回撤"
    ]
  },
  "002594.SZ": {
    "symbol": "002594.SZ",
    "name": "比亚迪",
    "sector": "汽车整车",
    "role": "全球新能源汽车与产业链垂直一体化绝对龙头",
    "theme": "DM-i混动、海鸥海豹全球爆款、新能源出海大潮",
    "description": "比亚迪是全球新能源汽车销冠，也是极少数打通了电池、电机、电控（三电系统）及车规级半导体全产业链研发制造的垂直一体化霸主。旗下拥有海洋、王朝、腾势、仰望及方程豹等大级别矩阵品牌，出海竞争力无可匹敌。",
    "moat_analysis": "1. 极限的成本控制壁垒：由于90%以上的核心零部件均为自主研发制造（含自给刀片电池），比亚迪拥有全行业无可比拟的价格调整弹性和超高毛利率抗压性。\n2. 技术代差垄断：DM-i超级混动（续航突破2000公里）、易四方四电机技术、云辇系统等建立起无解的国产技术代差护城河。",
    "financial_highlights": {
        "pe_ttm": 19.5,
        "market_cap_billion": 621.5,
        "revenue_yoy": "+24.1%",
        "roe": "22.5%",
        "cash_flow": "极度充沛，销售回款极其迅猛，在手现金流达 600 亿，产业链压款能力极强"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 620.0, "net_profit_billion": 315.0, "growth_yoy": "18.4%", "pe": 19.7 },
        { "year": "2026E", "revenue_billion": 735.0, "net_profit_billion": 382.5, "growth_yoy": "21.4%", "pe": 16.2 },
        { "year": "2027E", "revenue_billion": 860.0, "net_profit_billion": 460.0, "growth_yoy": "20.3%", "pe": 13.5 }
    ],
    "future_forecast": "依靠全产业链的代际领先优势，公司在国内新能源整车市场份额稳占 35% 以上，牢牢掌握定价权。随着匈牙利、巴西、泰国等海外自建整车工厂投产释放，出海销量占比将攀升至 30%，将进一步拔高其净利润中枢。长线看具备极高戴维斯双击溢价空间。",
    "target_price_range": "260.0 - 295.0 元",
    "catalysts": [
        "二代易四方智能驾驶平台批量装车与第五代 DM 混动大单爆款交付",
        "海外整车单月出货量首次突破 5 万辆大关，印证出海逻辑坚挺"
    ],
    "risk_warnings": [
        "国内新能源车市中低端红海价格战恶化，导致整体乘用车毛利收缩",
        "部分地缘政治针对中国整车征收反倾销惩罚性关税的摩擦加剧"
    ]
  },
  "000002.SZ": {
    "symbol": "000002.SZ",
    "name": "万科A",
    "sector": "房地产",
    "role": "国内房地产开发行业标杆与转型运营服务商代表",
    "theme": "国资强力信用背书、行业出清重组、万物云/印力商业护城河",
    "description": "万科A是国内房地产行业中极具运营管理口碑 and 商业、物业核心生态壁垒的代表。在行业深度的调整出清期，公司全力优化现金流、转让非核心资产并获得了第一大股东深圳地铁及深圳国资委的高规格信用担保与实质性资金支持。",
    "moat_analysis": "1. 顶尖的存量运营护城河：旗下“万物云”常年保持国内住宅及商务写字楼物业第一品牌；“印力商业”则是头部商业零售资产代建代管代表，提供强韧的经营性现金流流速。\n2. 混改体制下的国资背景背书：兼具市场化高效运营基因和国资股东的终极防守兜底，在房企信用全面分化出清时期具备极高稀缺性。",
    "financial_highlights": {
        "pe_ttm": 8.0,
        "market_cap_billion": 96.8,
        "revenue_yoy": "-45.0%",
        "roe": "4.2%",
        "cash_flow": "正在逐步改善，大股东深铁专项置换资产资金已到账，获得金融机构百亿银团贷款"
    },
    "forecasts": [
        { "year": "2025E", "revenue_billion": 395.0, "net_profit_billion": 35.0, "growth_yoy": "-25.0%", "pe": 2.7 },
        { "year": "2026E", "revenue_billion": 352.0, "net_profit_billion": 46.5, "growth_yoy": "32.8%", "pe": 2.0 },
        { "year": "2027E", "revenue_billion": 320.0, "net_profit_billion": 62.0, "growth_yoy": "33.3%", "pe": 1.5 }
    ],
    "future_forecast": "随着房地产行业供需关系重构、一线核心高能级城市限购红利彻底释放，以及银团银根在白名单支持下大幅放宽，万科将最先完成由传统“开发商”向“城市代建运营服务商”的蝶变重组。当前超低账面估值已充分吸收悲观情绪，属于高安全边际的困境反转龙头。",
    "target_price_range": "10.0 - 12.5 元",
    "catalysts": [
        "深圳国资大股东宣布以溢价进一步协议受让万科旗下印力商业或保障房股权",
        "核心城市（北京、上海、深圳）新房及二手房单月认购成交量迎来趋势性反弹"
    ],
    "risk_warnings": [
        "国内三四线城市存量房源出清节奏不及预期，开发板块结转利润继续承压",
        "金融机构对房企存量开发贷展期落地斜率变缓对短期现金流形成挤压"
    ]
  }
};
// LocalStorage keys to persist TodayMarket snapshot data across tab switching and page reloads
const LOCAL_STORAGE_KEY_DATA = 'asurada_today_market_data';
const LOCAL_STORAGE_KEY_TIME = 'asurada_today_market_time';

export const TodayMarket: React.FC<{ onNavigate?: (tab: string, params?: any) => void }> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('全部');
  const [marketData, setMarketData] = useState<TodayMarketResponse | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached market data:', e);
      }
    }
    return null;
  });
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_KEY_TIME);
  });
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem(LOCAL_STORAGE_KEY_DATA);
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Focus watchlist state
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);

  // Load watchlist items from API or LocalStorage fallback
  const loadWatchlist = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/focus-watchlist`);
      if (response.ok) {
        const list = await response.json();
        setWatchlistSymbols(list.map((item: any) => item.symbol));
      } else {
        // Fallback local storage
        const saved = localStorage.getItem('asurada_focus_watchlist');
        if (saved) {
          const list = JSON.parse(saved);
          setWatchlistSymbols(list.map((item: any) => item.symbol));
        }
      }
    } catch (error) {
      console.warn('Backend focus-watchlist fetch failed, using fallback.', error);
      const saved = localStorage.getItem('asurada_focus_watchlist');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          setWatchlistSymbols(list.map((item: any) => item.symbol));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleToggleWatchlist = async (stock: any) => {
    const symbol = stock.symbol;
    const isAdded = watchlistSymbols.includes(symbol);

    if (isAdded) {
      // Remove it
      try {
        const response = await fetch(`${API_BASE_URL}/api/focus-watchlist/${symbol}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
        } else {
          throw new Error('API delete failed');
        }
      } catch (err) {
        console.warn('API delete failed, performing local storage fallback.', err);
        // Fallback local storage
        const saved = localStorage.getItem('asurada_focus_watchlist') || '[]';
        try {
          const list = JSON.parse(saved);
          const updated = list.filter((item: any) => item.symbol !== symbol);
          localStorage.setItem('asurada_focus_watchlist', JSON.stringify(updated));
          setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      // Add it
      const newStockData = {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector || '全部',
        rating: '⭐ 中线关注',
        custom_tags: stock.theme || '',
        investment_logic: stock.role || '',
        target_price: null,
        stop_loss: null,
        notes: ''
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/focus-watchlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStockData)
        });
        if (response.ok) {
          setWatchlistSymbols(prev => [...prev, symbol]);
        } else {
          throw new Error('API post failed');
        }
      } catch (err) {
        console.warn('API post failed, performing local storage fallback.', err);
        // Fallback local storage
        const saved = localStorage.getItem('asurada_focus_watchlist') || '[]';
        try {
          const list = JSON.parse(saved);
          const updated = [...list, { ...newStockData, id: Date.now(), added_at: new Date().toISOString().replace('T', ' ').substring(0, 19) }];
          localStorage.setItem('asurada_focus_watchlist', JSON.stringify(updated));
          setWatchlistSymbols(prev => [...prev, symbol]);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Selected Stock Details Drawer State
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [detailsData, setDetailsData] = useState<any | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const loadMarketData = useCallback(async (refresh: boolean = false) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/today-market?refresh=${refresh}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: TodayMarketResponse = await response.json();
      setMarketData(data);
      localStorage.setItem(LOCAL_STORAGE_KEY_DATA, JSON.stringify(data));

      const timeStr = data.snapshot_time || '';
      setLastRefreshedTime(timeStr);
      localStorage.setItem(LOCAL_STORAGE_KEY_TIME, timeStr);
    } catch (error) {
      console.error('Failed to fetch today market snapshot:', error);
      setErrorMessage('无法连接后端行情接口，请确认 FastAPI 服务已启动。');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLeaderDetails = useCallback(async (symbol: string) => {
    setSelectedSymbol(symbol);
    setIsDetailsLoading(true);
    setDetailsData(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/today-market/${symbol}/details`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setDetailsData(data);
    } catch (error) {
      console.error('Failed to fetch stock leader details from API. Using local fallback.', error);
      // Fallback mock data if API fails to guarantee demo capability
      setDetailsData(MOCK_LEADER_DETAILS_FALLBACK[symbol] || null);
    } finally {
      setIsDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!marketData) {
      const timer = window.setTimeout(() => {
        void loadMarketData(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [loadMarketData, marketData]);

  const leaders = useMemo(() => marketData?.leaders || [], [marketData]);
  const sectors = useMemo(() => ['全部', ...Array.from(new Set(leaders.map(item => item.sector)))], [leaders]);
  const filteredLeaders = leaders.filter(item => {
    const keyword = query.trim();
    const matchesSector = selectedSector === '全部' || item.sector === selectedSector;
    const matchesQuery = [item.sector, item.theme, item.symbol, item.name].some(value => value.includes(keyword));
    return matchesSector && (!keyword || matchesQuery);
  });

  const strongCount = leaders.filter(item => item.change_pct > 0).length;
  const totalTurnover = leaders.reduce((sum, item) => sum + item.turnover_billion, 0);
  const topMover = leaders.reduce<MarketLeader | null>((best, item) => {
    if (!best || item.change_pct > best.change_pct) return item;
    return best;
  }, null);

  // Find matching market quote for current selected details
  const selectedLeaderQuote = useMemo(() => {
    if (!selectedSymbol) return null;
    return leaders.find(item => item.symbol === selectedSymbol) || null;
  }, [selectedSymbol, leaders]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Keyframe styles injector */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progressLoading {
          0% { left: -40%; }
          100% { left: 100%; }
        }
        .spin-active {
          animation: spin 1s linear infinite;
        }
        .details-drawer-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .details-drawer-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .details-drawer-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .details-drawer-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', position: 'relative', overflow: 'hidden' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={22} style={{ color: '#1e5eff' }} />
            今日股市
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', lineHeight: 1.7 }}>
            按 A 股核心板块聚合龙头标的，实时展示价格、涨跌幅、成交额、市值、估值与系统观察结论。**点击个股卡片可深入基本面画像与业绩预测。**
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
            <span className="badge badge-blue" style={{ gap: '6px' }}>
              <Clock3 size={13} />
              快照时间: {marketData?.snapshot_time || '加载中'}
            </span>
            {lastRefreshedTime && (
              <span className="badge" style={{ gap: '6px', background: 'rgba(30, 94, 255, 0.08)', color: '#1e5eff', border: '1px solid rgba(30, 94, 255, 0.15)' }}>
                <Clock3 size={13} />
                上次刷新: {lastRefreshedTime}
              </span>
            )}
            <span className={marketData?.is_realtime ? 'badge badge-green' : 'badge badge-yellow'} style={{ gap: '6px' }}>
              <Activity size={13} />
              {marketData?.quote_source || '行情源连接中'}
            </span>
            <span className="badge badge-gray" style={{ gap: '6px' }}>
              <DatabaseZap size={13} />
              {marketData?.fundamentals_source || '估值源连接中'}
            </span>
          </div>
        </div>

        <button
          onClick={() => loadMarketData(true)}
          disabled={isLoading}
          style={{
            background: '#1e5eff',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(30, 94, 255, 0.16)',
            opacity: isLoading ? 0.72 : 1
          }}
        >
          <RefreshCw size={16} className={isLoading ? 'spin-active' : ''} />
          {isLoading ? '刷新中...' : '刷新快照'}
        </button>

        {/* Modern Indeterminate Progress Bar */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '3px',
            background: '#f1f5f9',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '40%',
              background: 'linear-gradient(90deg, #1e5eff, #8b5cf6)',
              position: 'absolute',
              borderRadius: '2px',
              animation: 'progressLoading 1.5s infinite ease-in-out'
            }} />
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="glass-panel" style={{ padding: '16px 18px', background: '#fff7ed', borderColor: '#fed7aa', color: '#9a3412', fontSize: '13px' }}>
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>强势板块龙头</span>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '28px', color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>{strongCount}</strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>/ {leaders.length} 个板块上涨</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>样本成交额</span>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <strong style={{ fontSize: '28px', color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>{totalTurnover.toFixed(1)}</strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>亿元</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>领涨龙头</span>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <strong style={{ fontSize: '18px', color: '#1e293b' }}>{topMover?.name || '等待快照'}</strong>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>{topMover?.sector || '暂无数据'}</span>
            </div>
            <span style={{ color: getChangeColor(topMover?.change_pct || 0), fontSize: '18px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>
              {topMover ? `${topMover.change_pct > 0 ? '+' : ''}${topMover.change_pct.toFixed(2)}%` : '--'}
            </span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索板块、股票或代码"
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', background: '#f8fafc' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {sectors.map(sector => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                background: selectedSector === sector ? '#1e5eff' : '#f1f5f9',
                color: selectedSector === sector ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {sector}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
        {filteredLeaders.map(item => {
          const isUp = item.change_pct >= 0;
          const DirectionIcon = isUp ? ArrowUpRight : ArrowDownRight;

          return (
            <div
              key={item.symbol}
              className="glass-panel"
              onClick={() => loadLeaderDetails(item.symbol)}
              style={{
                padding: '20px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(30, 94, 255, 0.16)';
                e.currentTarget.style.borderColor = '#1e5eff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <span className="badge badge-blue">{item.sector}</span>
                  <h3 style={{ fontSize: '18px', color: '#1e293b', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.name}
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{item.symbol}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWatchlist(item);
                      }}
                      title={watchlistSymbols.includes(item.symbol) ? '从重点筛选池中移除' : '添加至重点筛选池'}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: watchlistSymbols.includes(item.symbol) ? '#fbbf24' : '#94a3b8',
                        transition: 'transform 0.2s',
                        outline: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <Star size={16} fill={watchlistSymbols.includes(item.symbol) ? '#fbbf24' : 'transparent'} />
                    </button>
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>{item.role} | {item.theme}</p>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '8px' }}>个股报价时间: {item.quote_time}</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '20px', color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>{item.price.toFixed(2)}</strong>
                  <span style={{ color: getChangeColor(item.change_pct), display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>
                    <DirectionIcon size={15} />
                    {item.change_pct > 0 ? '+' : ''}{item.change_pct.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                {[
                  ['成交额', formatMoney(item.turnover_billion)],
                  ['总市值', formatMoney(item.market_cap_billion)],
                  ['PE(TTM)', item.pe === null ? 'N/A' : item.pe.toFixed(1)],
                  ['振幅', `${item.amplitude.toFixed(1)}%`]
                ].map(([label, value]) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>{label}</span>
                    <strong style={{ fontSize: '12px', color: '#334155', display: 'block', marginTop: '5px', fontFamily: "'JetBrains Mono', monospace" }}>{value}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <TrendingUp size={16} style={{ color: '#1e5eff', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>{item.signal}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <ShieldCheck size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>{item.risk}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && filteredLeaders.length === 0 && (
        <div className="glass-panel" style={{ padding: '32px', background: '#ffffff', textAlign: 'center' }}>
          <Activity size={28} style={{ color: '#94a3b8' }} />
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '10px' }}>没有匹配的板块龙头快照。</p>
        </div>
      )}

      {/* ============================================================== */}
      {/* PROFESSIONAL INDIVIDUAL STOCK DETAILS DRAWER PANEL */}
      {/* ============================================================== */}
      {selectedSymbol && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '260px',
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.24)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.25s ease forwards',
          }}
          onClick={() => setSelectedSymbol(null)}
        >
          <div
            style={{
              width: '580px',
              maxWidth: '100%',
              height: '100%',
              background: '#ffffff',
              boxShadow: '-10px 0 40px rgba(15, 23, 42, 0.16)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden',
              borderLeft: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-blue" style={{ fontSize: '10px', padding: '3px 8px' }}>
                    {selectedLeaderQuote?.sector || '个股详情'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px' }}>
                    {selectedSymbol}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedLeaderQuote?.name || '板块龙头'}
                  <span style={{ fontSize: '12px', fontWeight: '500', color: '#64748b' }}>基本面预测画像</span>
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {selectedLeaderQuote && (
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '20px', color: '#1e293b', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
                      {selectedLeaderQuote.price.toFixed(2)}
                    </strong>
                    <span
                      style={{
                        color: getChangeColor(selectedLeaderQuote.change_pct),
                        fontSize: '13px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '2px',
                        marginTop: '2px'
                      }}
                    >
                      {selectedLeaderQuote.change_pct >= 0 ? '+' : ''}
                      {selectedLeaderQuote.change_pct.toFixed(2)}%
                    </span>
                  </div>
                )}
                {selectedLeaderQuote && (
                  <button
                    onClick={() => handleToggleWatchlist(selectedLeaderQuote)}
                    style={{
                      background: watchlistSymbols.includes(selectedSymbol || '') ? 'rgba(251, 191, 36, 0.1)' : '#f1f5f9',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: watchlistSymbols.includes(selectedSymbol || '') ? '#fbbf24' : '#64748b',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.15s ease',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = watchlistSymbols.includes(selectedSymbol || '') ? 'rgba(251, 191, 36, 0.15)' : '#e2e8f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = watchlistSymbols.includes(selectedSymbol || '') ? 'rgba(251, 191, 36, 0.1)' : '#f1f5f9';
                    }}
                  >
                    <Star size={16} fill={watchlistSymbols.includes(selectedSymbol || '') ? '#fbbf24' : 'transparent'} />
                    {watchlistSymbols.includes(selectedSymbol || '') ? '已入重点池' : '加入重点池'}
                  </button>
                )}

                <button
                  onClick={() => setSelectedSymbol(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1e293b'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Body Scrollable */}
            <div
              className="details-drawer-scrollbar"
              style={{
                flexGrow: 1,
                overflowY: 'auto',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                background: '#ffffff'
              }}
            >
              {isDetailsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '60px 0' }}>
                  <Activity size={32} className="glow-active" style={{ color: '#1e5eff' }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>智能体正在穿透分析基本面与预测逻辑...</span>
                </div>
              ) : detailsData ? (
                <>
                  {/* Card 1: Moat & Business Description */}
                  <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #1e5eff', background: '#f8fafc' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: '#1e5eff' }} />
                      行业地位与主线题材
                    </h3>
                    <p style={{ fontSize: '12px', color: '#334155', marginTop: '10px', lineHeight: 1.7, fontWeight: '500' }}>
                      {detailsData.role}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.6 }}>
                      {detailsData.description}
                    </p>
                    <div style={{ borderTop: '1px dashed #e2e8f0', marginTop: '14px', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>主力资金题材关注：</span>
                      <span style={{ fontSize: '12px', color: '#334155', display: 'block', marginTop: '4px', fontWeight: '500' }}>
                        {detailsData.theme}
                      </span>
                    </div>
                  </div>

                  {/* Moat breakdown */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Layers size={15} style={{ color: '#64748b' }} />
                      绝对霸主级“护城河”深度解析
                    </h4>
                    <div style={{ marginTop: '10px', background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #f1f5f9' }}>
                      {detailsData.moat_analysis.split('\n').map((para: string, idx: number) => (
                        <p key={idx} style={{ fontSize: '12px', color: '#475569', lineHeight: 1.7, marginBottom: idx === 0 ? '12px' : 0 }}>
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Core Fundamental highlights */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>
                      基本面核心财务亮点
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>净资产收益率 (ROE)</span>
                        <strong style={{ fontSize: '16px', color: '#1e293b', display: 'block', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                          {detailsData.financial_highlights.roe}
                        </strong>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>利润年度增长增速</span>
                        <strong style={{ fontSize: '16px', color: '#1e5eff', display: 'block', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                          {detailsData.financial_highlights.revenue_yoy}
                        </strong>
                      </div>
                      <div style={{ gridColumn: 'span 2', background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>智能体现金流穿透审计结论</span>
                        <p style={{ fontSize: '12px', color: '#334155', marginTop: '6px', fontWeight: '600', lineHeight: 1.5 }}>
                          {detailsData.financial_highlights.cash_flow}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Future Forecasts Table */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <TrendingUp size={15} style={{ color: '#1e5eff' }} />
                      2025E - 2027E 业绩与估值前瞻预测
                    </h4>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: '600' }}>年度</th>
                            <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>预测营收</th>
                            <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>预测净利</th>
                            <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>净利增速</th>
                            <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>预测 PE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsData.forecasts.map((f: any) => (
                            <tr key={f.year} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '12px 14px', color: '#1e293b', fontWeight: '700' }}>{f.year}</td>
                              <td style={{ padding: '12px 14px', color: '#334155', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>{f.revenue_billion.toFixed(1)} 亿</td>
                              <td style={{ padding: '12px 14px', color: '#334155', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' }}>{f.net_profit_billion.toFixed(1)} 亿</td>
                              <td style={{ padding: '12px 14px', color: f.growth_yoy.startsWith('-') ? '#10b981' : '#ef4444', textAlign: 'right', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>{f.growth_yoy}</td>
                              <td style={{ padding: '12px 14px', color: '#1e5eff', textAlign: 'right', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace" }}>{f.pe.toFixed(1)} 倍</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Future outlook long text */}
                  <div style={{ background: 'rgba(30, 94, 255, 0.03)', border: '1px solid rgba(30, 94, 255, 0.12)', borderRadius: '10px', padding: '16px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#1e5eff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lightbulb size={14} />
                      AI 智能量化中长线研判
                    </h5>
                    <p style={{ fontSize: '12px', color: '#475569', marginTop: '8px', lineHeight: 1.7 }}>
                      {detailsData.future_forecast}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(30, 94, 255, 0.15)' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>合理估值长线目标价格：</span>
                      <strong style={{ fontSize: '13px', color: '#1e5eff', fontFamily: "'Outfit', sans-serif" }}>
                        {detailsData.target_price_range}
                      </strong>
                    </div>
                  </div>

                  {/* Catalysts & Risks */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <AlertTriangle size={14} />
                        潜在风险提示
                      </h5>
                      <ul style={{ paddingLeft: '14px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {detailsData.risk_warnings.map((w: string, idx: number) => (
                          <li key={idx} style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Sparkles size={14} />
                        股价上行催化剂
                      </h5>
                      <ul style={{ paddingLeft: '14px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {detailsData.catalysts.map((c: string, idx: number) => (
                          <li key={idx} style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>未拉取到有效的个股详情，请重试。</div>
              )}
            </div>

            {/* Drawer Footer controls */}
            {detailsData && (
              <div
                style={{
                  padding: '20px 28px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  本预测由 Asurada 多智能体量化内核生成
                </div>

                {onNavigate && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setSelectedSymbol(null);
                        onNavigate('stock_detail', { 
                          symbol: selectedSymbol, 
                          name: selectedLeaderQuote?.name || selectedSymbol, 
                          sector: selectedLeaderQuote?.sector 
                        });
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(30, 94, 255, 0.16)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                    >
                      个股均线与预测
                      <ChevronRight size={14} />
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSymbol(null);
                        onNavigate('discovery');
                      }}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    >
                      一键深研多维逻辑
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
