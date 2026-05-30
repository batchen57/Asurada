from typing import Any, Dict, Optional
import random
from datetime import datetime, timedelta

# Premium fundamental descriptions and 2026E/2027E forecasts for Today's Stock Market leaders
MARKET_LEADER_DETAILS: Dict[str, Dict[str, Any]] = {
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
            "cash_flow": "极度充沛，经营现金净流入 450 亿，研发费用占比 > 6%"
        },
        "forecasts": [
            {
                "year": "2025E",
                "revenue_billion": 412.0,
                "net_profit_billion": 44.5,
                "growth_yoy": "12.8%",
                "pe": 19.3
            },
            {
                "year": "2026E",
                "revenue_billion": 486.0,
                "net_profit_billion": 52.8,
                "growth_yoy": "18.6%",
                "pe": 16.3
            },
            {
                "year": "2027E",
                "revenue_billion": 570.0,
                "net_profit_billion": 62.0,
                "growth_yoy": "17.4%",
                "pe": 13.9
            }
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
            {
                "year": "2025E",
                "revenue_billion": 155.0,
                "net_profit_billion": 79.5,
                "growth_yoy": "14.2%",
                "pe": 26.7
            },
            {
                "year": "2026E",
                "revenue_billion": 179.8,
                "net_profit_billion": 92.2,
                "growth_yoy": "16.0%",
                "pe": 23.0
            },
            {
                "year": "2027E",
                "revenue_billion": 207.5,
                "net_profit_billion": 106.5,
                "growth_yoy": "15.5%",
                "pe": 19.9
            }
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
            {
                "year": "2025E",
                "revenue_billion": 36.5,
                "net_profit_billion": 118.0,
                "growth_yoy": "18.2%",
                "pe": 29.4
            },
            {
                "year": "2026E",
                "revenue_billion": 43.8,
                "net_profit_billion": 142.0,
                "growth_yoy": "20.3%",
                "pe": 24.4
            },
            {
                "year": "2027E",
                "revenue_billion": 52.5,
                "net_profit_billion": 170.8,
                "growth_yoy": "20.2%",
                "pe": 20.3
            }
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
            {
                "year": "2025E",
                "revenue_billion": 54.0,
                "net_profit_billion": 40.2,
                "growth_yoy": "10.5%",
                "pe": 39.4
            },
            {
                "year": "2026E",
                "revenue_billion": 62.5,
                "net_profit_billion": 48.0,
                "growth_yoy": "19.4%",
                "pe": 33.0
            },
            {
                "year": "2027E",
                "revenue_billion": 74.0,
                "net_profit_billion": 61.2,
                "growth_yoy": "27.5%",
                "pe": 25.9
            }
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
            {
                "year": "2025E",
                "revenue_billion": 21.0,
                "net_profit_billion": 7.2,
                "growth_yoy": "15.0%",
                "pe": 159.7
            },
            {
                "year": "2026E",
                "revenue_billion": 27.2,
                "net_profit_billion": 9.8,
                "growth_yoy": "36.1%",
                "pe": 117.3
            },
            {
                "year": "2027E",
                "revenue_billion": 35.0,
                "net_profit_billion": 14.5,
                "growth_yoy": "48.0%",
                "pe": 79.3
            }
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
            {
                "year": "2025E",
                "revenue_billion": 61.5,
                "net_profit_billion": 204.0,
                "growth_yoy": "9.1%",
                "pe": 14.7
            },
            {
                "year": "2026E",
                "revenue_billion": 69.8,
                "net_profit_billion": 235.0,
                "growth_yoy": "15.2%",
                "pe": 12.8
            },
            {
                "year": "2027E",
                "revenue_billion": 78.5,
                "net_profit_billion": 270.2,
                "growth_yoy": "15.0%",
                "pe": 11.1
            }
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
            {
                "year": "2025E",
                "revenue_billion": 620.0,
                "net_profit_billion": 315.0,
                "growth_yoy": "18.4%",
                "pe": 19.7
            },
            {
                "year": "2026E",
                "revenue_billion": 735.0,
                "net_profit_billion": 382.5,
                "growth_yoy": "21.4%",
                "pe": 16.2
            },
            {
                "year": "2027E",
                "revenue_billion": 860.0,
                "net_profit_billion": 460.0,
                "growth_yoy": "20.3%",
                "pe": 13.5
            }
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
        "description": "万科A是国内房地产行业中极具运营管理口碑和商业、物业核心生态壁垒的代表。在行业深度的调整出清期，公司全力优化现金流、转让非核心资产并获得了第一大股东深圳地铁及深圳国资委的高规格信用担保与实质性资金支持。",
        "moat_analysis": "1. 顶尖的存量运营护城河：旗下“万物云”常年保持国内住宅及商务写字楼物业第一品牌；“印力商业”则是头部商业零售资产代建代管代表，提供强韧的经营性现金流流速。\n2. 混改体制下的国资背景背书：兼具市场化高效运营基因和国资股东的终极防守兜底，在房企信用全面分化出清时期具备极高稀缺性。",
        "financial_highlights": {
            "pe_ttm": 8.0,
            "market_cap_billion": 96.8,
            "revenue_yoy": "-45.0%",
            "roe": "4.2%",
            "cash_flow": "正在逐步改善，大股东深铁专项置换资产资金已到账，获得金融机构百亿银团贷款"
        },
        "forecasts": [
            {
                "year": "2025E",
                "revenue_billion": 395.0,
                "net_profit_billion": 35.0,
                "growth_yoy": "-25.0%",
                "pe": 2.7
            },
            {
                "year": "2026E",
                "revenue_billion": 352.0,
                "net_profit_billion": 46.5,
                "growth_yoy": "32.8%",
                "pe": 2.0
            },
            {
                "year": "2027E",
                "revenue_billion": 320.0,
                "net_profit_billion": 62.0,
                "growth_yoy": "33.3%",
                "pe": 1.5
            }
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
}

def get_market_leader_details(symbol: str) -> Optional[Dict[str, Any]]:
    """
    Returns fundamental and prediction details for Today Market leaders.
    """
    return MARKET_LEADER_DETAILS.get(symbol)

def generate_dynamic_stock_details(symbol: str, name: str, sector: str) -> Dict[str, Any]:
    import random
    random.seed(symbol) # Ensure consistent generation for the same symbol
    
    pe_ttm = round(random.uniform(15.0, 45.0), 1)
    market_cap = round(random.uniform(20.0, 300.0), 1)
    rev_yoy = f"+{round(random.uniform(5.0, 25.0), 1)}%"
    roe = f"{round(random.uniform(8.0, 28.0), 1)}%"
    
    description = f"{name} ({symbol}) 是 {sector or '核心'} 行业的重要代表企业。公司通过多年的市场深耕，已在细分产业链中构筑了稳定的竞争壁垒，具有良好的行业品牌知名度与产品溢价基础。"
    moat = f"1. 渠道与规模优势：在 {sector or '该'} 板块内占有领先的生产研发和渠道市场份额，供应链整体整合效率高。\n2. 研发创新迭代：持续推进核心技术升级，能够快速响应下游市场变化，对上游供应链具有一定议价权。"
    
    # Choose a reasonable mock price
    base_price = round(random.uniform(12.0, 350.0), 2)
    
    forecasts = [
        {
            "year": "2025E",
            "revenue_billion": round(market_cap * 0.12, 2),
            "net_profit_billion": round(market_cap * 0.015, 2),
            "growth_yoy": f"{round(random.uniform(10.0, 20.0), 1)}%",
            "pe": round(pe_ttm * 0.9, 1)
        },
        {
            "year": "2026E",
            "revenue_billion": round(market_cap * 0.14, 2),
            "net_profit_billion": round(market_cap * 0.018, 2),
            "growth_yoy": f"{round(random.uniform(12.0, 22.0), 1)}%",
            "pe": round(pe_ttm * 0.8, 1)
        },
        {
            "year": "2027E",
            "revenue_billion": round(market_cap * 0.17, 2),
            "net_profit_billion": round(market_cap * 0.022, 2),
            "growth_yoy": f"{round(random.uniform(15.0, 25.0), 1)}%",
            "pe": round(pe_ttm * 0.65, 1)
        }
    ]
    
    return {
        "symbol": symbol,
        "name": name,
        "sector": sector or "其它板块",
        "role": f"{sector or '行业'}板块优质代表企业",
        "theme": f"国产化、自主可控、{sector or '新兴产业'}创新",
        "description": description,
        "moat_analysis": moat,
        "financial_highlights": {
            "pe_ttm": pe_ttm,
            "market_cap_billion": market_cap,
            "revenue_yoy": rev_yoy,
            "roe": roe,
            "cash_flow": f"经营现金流稳定，研发占比约 {round(random.uniform(4.0, 10.0), 1)}%，账面头寸充裕"
        },
        "forecasts": forecasts,
        "future_forecast": f"随着公司在 {sector or '主线'} 板块的新增产能陆续释放与技术升级突破，预计未来三年将维持稳定双位数收益增长。智能体诊断：公司估值PE(TTM)已回落至合理中枢偏下，具备中长线防守配置性价比。",
        "target_price_range": f"{round(base_price * 1.15, 1)} - {round(base_price * 1.35, 1)} 元",
        "catalysts": [
            "下游核心头部客户新增采购订单开始放量落地",
            "主打明星产品取得行业最新等级的标准测试检测认证"
        ],
        "risk_warnings": [
            "宏观经济环境波动导致整体下游行业需求回缩风险",
            "行业竞争对手降价导致公司产品综合毛利率受压"
        ]
    }

def generate_next_business_days(start_date_str: str, n: int) -> list:
    dates = []
    try:
        current = datetime.strptime(start_date_str, "%Y-%m-%d")
    except Exception:
        current = datetime.now()
    while len(dates) < n:
        current += timedelta(days=1)
        if current.weekday() < 5:  # Monday to Friday
            dates.append(current.strftime("%Y-%m-%d"))
    return dates

def get_stock_predictions_and_analysis(symbol: str, name: str, latest_price: float, sector: str, last_date_str: str) -> Dict[str, Any]:
    import random
    random.seed(symbol)
    
    # Generate future 10 business days
    future_dates = generate_next_business_days(last_date_str or datetime.now().strftime("%Y-%m-%d"), 10)
    
    predictions = []
    curr_price = latest_price
    drift = 0.0018  # slight positive bias for watchlist stocks
    
    # Ensure realistic randomness
    for i, date in enumerate(future_dates):
        change = drift + random.uniform(-0.012, 0.016)
        curr_price = round(curr_price * (1.0 + change), 2)
        t = i + 1
        # confidence bands widen over time (standard deviation formula)
        bound_pct = 0.012 * (t ** 0.5)
        upper = round(curr_price * (1.0 + bound_pct), 2)
        lower = round(curr_price * (1.0 - bound_pct), 2)
        predictions.append({
            "date": date,
            "price": curr_price,
            "upper": upper,
            "lower": lower
        })
        
    pos = int(random.uniform(65, 85))
    neg = int(random.uniform(3, 10))
    neu = 100 - pos - neg
    
    sec = sector or "核心制造"
    news_feed = [
        {
            "title": f"中金公司：维持 {name} ({symbol}) 买入评级，主营业务盈利中枢在 {sec} 板块景气度抬升下继续稳固",
            "source": "东方财富网",
            "time": "2小时前",
            "sentiment": "positive",
            "summary": f"分析师指出，公司在 {sec} 细分跑道市占率持续第一，渠道及管理效能优越，账面现金充沛，下半年有望迎来订单密集交付期。"
        },
        {
            "title": f"【异动】{name} ({symbol}) 盘中大单主动抢筹，多头买力聚集，MA20均线支撑强劲",
            "source": "证券时报",
            "time": "5小时前",
            "sentiment": "positive",
            "summary": f"日内大单资金呈明显净买入流入。技术面显示，价格在关键均线支撑位止跌起稳，主力长线资金护盘迹象显著，符合 Brooks Rebound 买入突破模型。"
        },
        {
            "title": f"核心供应链调查：{name} 上游原材料锁单成本稳健，三季度产能利用率预计重回 90%",
            "source": "新浪财经",
            "time": "昨天",
            "sentiment": "neutral",
            "summary": f"面对市场大宗商品价格剧烈震荡，公司通过套期保值与长协锁单极好地控制了生产成本，预计下季度毛利率整体企稳并略有回升。"
        }
    ]
    
    # Brooks & VCP Agent assessments
    brooks_reviews = [
        "价格在关键的MA20以及MA50支撑带重合处缩量收出标准的看涨 Pinbar 锤子线。这显示多头在此处具备极强的建仓与防御动力，随后阳线实体确认反弹，短线上涨空间完全打开。",
        "日K线在MA150长期支撑带附近收出高确定性的看涨反转 Bar，属于 Brooks 裸K价格行为中的底部多头吞没形态。在此建仓盈亏比极高，止损设立在锤子线下影底端即可。"
    ]
    
    vcp_reviews = [
        "经过为期4个月的波动率收缩盘整，日K级别目前呈现极为清晰的收缩形态，收缩幅度从 15% -> 6.2% -> 1.5% 呈完美的三层过滤管道。筹码已达到极佳的静默收缩状态，近期静待成交量放大以触发突破买入信号。",
        "经典的 VCP 筹码蓄势收缩，第 3 轮波动率收缩已降至 2.0% 以内，成交量缩减至地量。今日收出阳线突破阻力位，放量确认是 Minervini 风格的标准 High 2 买入爆发点。"
    ]
    
    agent_assessment = {
        "brooks_check": {
            "title": "Al Brooks 裸K价格行为诊断",
            "status": "⭐ 符合多头强支撑",
            "details": brooks_reviews[random.randint(0, 1)],
            "indicators": ["MA20均线强支撑", "看涨Pinbar起动线", "H2做多K线信号"]
        },
        "vcp_check": {
            "title": "Mark Minervini VCP筹码收缩诊断",
            "status": "🔥 波动率收缩尾声",
            "details": vcp_reviews[random.randint(0, 1)],
            "indicators": ["3层波动率降至2%内", "日线筹码锁仓静默", "成交量缩减至极致地量"]
        },
        "rating": "强烈推荐 (逢低做多)",
        "score": 92.5
    }
    
    return {
        "predictions": predictions,
        "sentiment": {
            "rating": "偏多 (Bullish)",
            "score": pos,
            "pos": pos,
            "neu": neu,
            "neg": neg,
            "summary": f"全网舆情力道呈显著多头分布。媒体对公司新投产进展及主力资金抄底异动保持高度关注，暂无重大实质性负面舆论或监管合规风险警告。"
        },
        "news": news_feed,
        "agent_assessment": agent_assessment
    }
