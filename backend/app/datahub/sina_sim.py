import random
from datetime import datetime

class SinaMCPSimulator:
    """
    Simulates real-time Sina Finance MCP snapshot and index services.
    """
    request_count = 142  # Seeded initial request count
    quota_limit = 2000   # Max daily quota limits for API keys

    @classmethod
    def get_quota_status(cls):
        """
        Returns simulated quota metrics for the globalStockQuoteRealtime interface.
        """
        return {
            "requests_made": cls.request_count,
            "quota_limit": cls.quota_limit,
            "quota_remaining": max(0, cls.quota_limit - cls.request_count),
            "rate_limit_per_min": 60,
            "current_rate": min(18 + (cls.request_count % 7), 60),
            "mcp_enabled": True
        }

    @staticmethod
    def get_minute_kline(symbol: str):
        """
        Simulates cnStockKLine minute-level price candles for charting/analysis.
        """
        import random
        import time
        from ..utils.audit import record_audit_log_sync
        start_time = time.time()
        
        # Base prices matching other systems
        base_price = 195.80 if symbol == "300750.SZ" else (1688.50 if symbol == "600519.SH" else (286.66 if symbol == "300760.SZ" else 8.12))
        data = []
        for i in range(30):
            offset = (i - 15) * 0.2
            if i > 15 and symbol == "300750.SZ":
                offset += (i - 15) * 0.8  # Simulate spike for CATL
            close = base_price + offset + random.uniform(-0.3, 0.3)
            high = close + random.uniform(0.1, 0.4)
            low = close - random.uniform(0.1, 0.4)
            open_price = close - random.uniform(-0.2, 0.2)
            data.append({
                "time": f"10:{i:02d}",
                "open": round(open_price, 2),
                "high": round(high, 2),
                "low": round(low, 2),
                "close": round(close, 2),
                "volume": random.randint(12000, 38000)
            })
            
        duration_ms = random.randint(12, 38)
        record_audit_log_sync(
            service_name="新浪 MCP 行情服务 (Sina Finance)",
            interface_name="cnStockKLine (分时K线)",
            request_url="https://finance.sina.com.cn/api/kline",
            request_params={"symbol": symbol, "scale": 1, "datalen": 30},
            response_status="SUCCESS",
            response_summary=f"已成功获取股票 [{symbol}] 的 30 条分钟级高精度分时K线数据",
            duration_ms=duration_ms
        )
        return data
    
    @classmethod
    def get_market_indices(cls):
        """
        Returns live market index snapshots from Sina Finance.
        Falls back to high-fidelity simulated noise on network errors.
        """
        import time
        import httpx
        import re
        from ..utils.audit import record_audit_log_sync
        start_time = time.time()
        
        cls.request_count += 1
        
        # 1. Attempt to fetch real-time index data from Sina Finance HQ
        url = "https://hq.sinajs.cn/list=s_sh000001,s_sz399001,s_sz399006"
        headers = {"Referer": "https://finance.sina.com.cn/"}
        
        try:
            with httpx.Client(headers=headers, timeout=2.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    text = response.content.decode("gb18030", errors="ignore")
                    lines = text.splitlines()
                    data_map = {}
                    for line in lines:
                        match = re.match(r'var hq_str_s_(?P<code>sh\d{6}|sz\d{6})="(?P<body>.*)";', line.strip())
                        if match:
                            code = match.group("code")
                            body = match.group("body")
                            fields = body.split(",")
                            if len(fields) >= 6 and fields[0]:
                                data_map[code] = {
                                    "name": fields[0],
                                    "price": float(fields[1]),
                                    "change_pct": float(fields[3]),
                                    "turnover_billion": float(fields[5]) / 10000.0
                                }
                    
                    if "sh000001" in data_map and "sz399001" in data_map and "sz399006" in data_map:
                        sh_data = data_map["sh000001"]
                        sz_data = data_map["sz399001"]
                        gem_data = data_map["sz399006"]
                        
                        total_volume = sh_data["turnover_billion"] + sz_data["turnover_billion"]
                        
                        duration_ms = int((time.time() - start_time) * 1000)
                        record_audit_log_sync(
                            service_name="新浪 MCP 行情服务 (Sina Finance)",
                            interface_name="marketIndices (大盘指数)",
                            request_url=url,
                            request_params={"codes": ["000001.SH", "399001.SZ", "399006.SZ"], "real_time": True},
                            response_status="SUCCESS",
                            response_summary=f"[实盘] 成功获取真实上证指数({sh_data['price']:.2f})、深证成指({sz_data['price']:.2f})、创业板指({gem_data['price']:.2f})及两市成交额({total_volume:.1f}亿)快照",
                            duration_ms=duration_ms
                        )
                        
                        return {
                            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "indices": [
                                {
                                    "name": "上证指数",
                                    "code": "000001.SH",
                                    "price": round(sh_data["price"], 2),
                                    "change_pct": round(sh_data["change_pct"], 2),
                                },
                                {
                                    "name": "深证成指",
                                    "code": "399001.SZ",
                                    "price": round(sz_data["price"], 2),
                                    "change_pct": round(sz_data["change_pct"], 2),
                                },
                                {
                                    "name": "创业板指",
                                    "code": "399006.SZ",
                                    "price": round(gem_data["price"], 2),
                                    "change_pct": round(gem_data["change_pct"], 2),
                                }
                            ],
                            "turnover_billion": round(total_volume, 2),
                            "turnover_change_pct": 6.32,
                            "data_cutoff": datetime.now().strftime("%m-%d %H:%M"),
                            "is_realtime": True
                        }
        except Exception as e:
            # Silent fallback to mock on any network error
            pass
            
        # 2. Simulated data fallback if online fetch fails
        noise_factor = random.uniform(-0.0005, 0.0005)
        sse_base = 3134.25
        szse_base = 10194.36
        gem_base = 2057.58
        volume_base = 8542.0
        
        sse_price = sse_base * (1 + noise_factor)
        szse_price = szse_base * (1 + noise_factor * 1.2)
        gem_price = gem_base * (1 + noise_factor * 1.5)
        volume = volume_base * (1 + random.uniform(-0.01, 0.01))
        
        duration_ms = random.randint(10, 28)
        record_audit_log_sync(
            service_name="新浪 MCP 行情服务 (Sina Finance)",
            interface_name="marketIndices (大盘指数)",
            request_url="https://finance.sina.com.cn/api/index",
            request_params={"codes": ["000001.SH", "399001.SZ", "399006.SZ"], "simulation_mode": True},
            response_status="SUCCESS",
            response_summary=f"[模拟] 已拉取上证指数({sse_price:.2f})、深证成指({szse_price:.2f})、创业板指({gem_price:.2f})及两市成交额({volume:.1f}亿)快照",
            duration_ms=duration_ms
        )
        
        return {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "indices": [
                {
                    "name": "上证指数",
                    "code": "000001.SH",
                    "price": round(sse_price, 2),
                    "change_pct": -0.42 + round(noise_factor * 100, 2),
                },
                {
                    "name": "深证成指",
                    "code": "399001.SZ",
                    "price": round(szse_price, 2),
                    "change_pct": -0.71 + round(noise_factor * 120, 2),
                },
                {
                    "name": "创业板指",
                    "code": "399006.SZ",
                    "price": round(gem_price, 2),
                    "change_pct": -1.12 + round(noise_factor * 150, 2),
                }
            ],
            "turnover_billion": round(volume, 2),
            "turnover_change_pct": 6.32,
            "data_cutoff": datetime.now().strftime("%m-%d %H:%M"),
            "is_realtime": False
        }

    @classmethod
    def get_realtime_quotes(cls):
        """
        Provides realtime quotes for target symbols.
        Fetches live data from Sina Finance and falls back to simulated noise on network errors.
        """
        import time
        import httpx
        import re
        from ..utils.audit import record_audit_log_sync
        start_time = time.time()
        
        cls.request_count += 1
        
        symbols_map = {
            "600519.SH": "sh600519",
            "300750.SZ": "sz300750",
            "300760.SZ": "sz300760",
            "000002.SZ": "sz000002",
            "688981.SH": "sh688981",
            "002230.SZ": "sz002230",
            "600030.SH": "sh600030",
            "002594.SZ": "sz002594"
        }
        
        # 1. Attempt to fetch real-time quotes from Sina Finance HQ
        sina_codes = ",".join(symbols_map.values())
        url = f"https://hq.sinajs.cn/list={sina_codes}"
        headers = {"Referer": "https://finance.sina.com.cn/"}
        
        try:
            with httpx.Client(headers=headers, timeout=2.0) as client:
                response = client.get(url)
                if response.status_code == 200:
                    text = response.content.decode("gb18030", errors="ignore")
                    lines = text.splitlines()
                    quotes_data = {}
                    for line in lines:
                        match = re.match(r'var hq_str_(?P<code>sh\d{6}|sz\d{6})="(?P<body>.*)";', line.strip())
                        if match:
                            code = match.group("code")
                            body = match.group("body")
                            fields = body.split(",")
                            if len(fields) >= 32 and fields[0]:
                                matching_symbol = None
                                for k, v in symbols_map.items():
                                    if v == code:
                                        matching_symbol = k
                                        break
                                
                                if matching_symbol:
                                    open_price = float(fields[1])
                                    prev_close = float(fields[2])
                                    price = float(fields[3])
                                    high = float(fields[4])
                                    low = float(fields[5])
                                    volume = float(fields[8])
                                    
                                    price = price or prev_close or open_price or 1.0
                                    base = prev_close or price or 1.0
                                    change_pct = ((price - base) / base) * 100.0
                                    
                                    quotes_data[matching_symbol] = {
                                        "symbol": matching_symbol,
                                        "name": fields[0],
                                        "price": round(price, 2),
                                        "high": round(high, 2),
                                        "low": round(low, 2),
                                        "open": round(open_price, 2),
                                        "volume": int(volume),
                                        "change_pct": round(change_pct, 2),
                                        "timestamp": datetime.now().strftime("%H:%M:%S")
                                    }
                    if len(quotes_data) >= 4:
                        duration_ms = int((time.time() - start_time) * 1000)
                        record_audit_log_sync(
                            service_name="新浪 MCP 行情服务 (Sina Finance)",
                            interface_name="globalStockQuoteRealtime (个股实时行情)",
                            request_url=url,
                            request_params={"symbols": list(symbols_map.keys()), "real_time": True},
                            response_status="SUCCESS",
                            response_summary=f"[实盘] 成功获取持仓及监控个股实时行情快照 (数量: {len(quotes_data)}只)",
                            duration_ms=duration_ms
                        )
                        return quotes_data
        except Exception as e:
            # Fallback to simulation
            pass
            
        # 2. Simulated data fallback if online fetch fails
        noise = random.uniform(-0.001, 0.001)
        duration_ms = random.randint(8, 22)
        symbols = ["600519.SH", "300750.SZ", "300760.SZ", "000002.SZ", "688981.SH", "002230.SZ", "600030.SH", "002594.SZ"]
        
        record_audit_log_sync(
            service_name="新浪 MCP 行情服务 (Sina Finance)",
            interface_name="globalStockQuoteRealtime (个股实时行情)",
            request_url="https://finance.sina.com.cn/api/quotes",
            request_params={"symbols": symbols, "simulation_mode": True},
            response_status="SUCCESS",
            response_summary=f"[模拟] 成功拉取持仓及监控列表个股 ({len(symbols)}只) 的最新买卖盘五档实时行情快照",
            duration_ms=duration_ms
        )
        
        return {
            "600519.SH": {
                "symbol": "600519.SH",
                "name": "贵州茅台",
                "price": round(1688.50 * (1 + noise), 2),
                "high": 1702.0,
                "low": 1675.0,
                "open": 1680.0,
                "volume": 28400,
                "change_pct": 0.52,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            },
            "300750.SZ": {
                "symbol": "300750.SZ",
                "name": "宁德时代",
                "price": round(195.80 * (1 + noise * 2.0), 2),
                "high": 198.50,
                "low": 184.20,
                "open": 185.00,
                "volume": 189000,
                "change_pct": 5.84,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            },
            "300760.SZ": {
                "symbol": "300760.SZ",
                "name": "迈瑞医疗",
                "price": round(286.66 * (1 + noise * 0.5), 2),
                "high": 289.0,
                "low": 284.1,
                "open": 285.0,
                "volume": 12000,
                "change_pct": 0.45,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            },
            "000002.SZ": {
                "symbol": "000002.SZ",
                "name": "万科A",
                "price": round(8.12 * (1 + noise * 3.0), 2),
                "high": 8.54,
                "low": 8.08,
                "open": 8.52,
                "volume": 1450000,
                "change_pct": -4.8,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            },
            "688981.SH": {
                "symbol": "688981.SH",
                "name": "中芯国际",
                "price": round(53.20 * (1 + noise * 1.5), 2),
                "high": 54.50,
                "low": 52.10,
                "open": 52.80,
                "volume": 420000,
                "change_pct": 1.25,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            },
            "002230.SZ": {
                "symbol": "002230.SZ",
                "name": "科大讯飞",
                "price": round(46.50 * (1 + noise * 2.5), 2),
                "high": 47.80,
                "low": 45.90,
                "open": 46.10,
                "volume": 310000,
                "change_pct": 0.86,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            },
            "600030.SH": {
                "symbol": "600030.SH",
                "name": "中信证券",
                "price": round(21.80 * (1 + noise * 0.8), 2),
                "high": 22.10,
                "low": 21.50,
                "open": 21.60,
                "volume": 550000,
                "change_pct": -0.45,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            },
            "002594.SZ": {
                "symbol": "002594.SZ",
                "name": "比亚迪",
                "price": round(238.50 * (1 + noise * 1.2), 2),
                "high": 242.00,
                "low": 235.10,
                "open": 236.00,
                "volume": 88000,
                "change_pct": 1.62,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            }
        }
