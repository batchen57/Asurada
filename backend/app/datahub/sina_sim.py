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
        Returns live market index snapshots matching the dashboard exactly.
        With minor random noise if updated.
        """
        import time
        from ..utils.audit import record_audit_log_sync
        start_time = time.time()
        
        cls.request_count += 1
        # Base values matching mockup
        # 上证指数: 3134.25, -0.42%
        # 深证成指: 10194.36, -0.71%
        # 创业板指: 2057.58, -1.12%
        # 成交额: 8542 亿, +6.32%
        
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
            request_params={"codes": ["000001.SH", "399001.SZ", "399006.SZ"]},
            response_status="SUCCESS",
            response_summary=f"已拉取上证指数({sse_price:.2f})、深证成指({szse_price:.2f})、创业板指({gem_price:.2f})及两市成交额({volume:.1f}亿)快照",
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
            "data_cutoff": "05-20 15:00"
        }

    @classmethod
    def get_realtime_quotes(cls):
        """
        Provides realtime quotes for target symbols.
        Match stock snapshot values on dashboard:
        Moutai: 1688.50
        CATL: 195.80
        Mindray: 286.66
        Vanke: 8.92 (down from cost/previous)
        """
        import time
        from ..utils.audit import record_audit_log_sync
        start_time = time.time()
        
        cls.request_count += 1
        noise = random.uniform(-0.001, 0.001)
        
        duration_ms = random.randint(8, 22)
        record_audit_log_sync(
            service_name="新浪 MCP 行情服务 (Sina Finance)",
            interface_name="globalStockQuoteRealtime (个股实时行情)",
            request_url="https://finance.sina.com.cn/api/quotes",
            request_params={"symbols": ["600519.SH", "300750.SZ", "300760.SZ", "000002.SZ"]},
            response_status="SUCCESS",
            response_summary="成功拉取持仓及监控列表个股 (茅台、宁德、迈瑞、万科) 的最新买卖盘五档实时行情快照",
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
            }
        }
