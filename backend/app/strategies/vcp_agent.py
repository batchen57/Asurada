from typing import List, Dict, Any, Optional

class VCPAgent:
    """
    Agent A: VCP (Volatility Contraction Pattern) Leader Trend Strategy.
    Scans historical stock data to detect Mark Minervini style volatility contractions
    and breakout signals.
    """
    
    @staticmethod
    def analyze_vcp(
        prices_history: List[Dict[str, Any]],
        ma_short: int = 50,
        ma_long: int = 200,
        volume_factor: float = 1.5
    ) -> Dict[str, Any]:
        """
        Analyzes a chronological list of daily prices for VCP characteristics.
        Each item in prices_history should contain:
        'date', 'open', 'high', 'low', 'close', 'volume', 'ma50', 'ma150', 'ma200'
        
        Returns:
            Dict containing:
                is_trend_approved (bool)
                contractions (list of floats representing contractions width %)
                is_vcp_setup (bool)
                is_breakout (bool)
                summary (str)
        """
        if len(prices_history) < 200:
            return {
                "is_trend_approved": False,
                "is_vcp_setup": False,
                "is_breakout": False,
                "summary": "数据长度不足，至少需要200个交易日"
            }
            
        latest = prices_history[-1]
        close = latest["close"]
        
        # 1. Trend Template Filters (Minervini's rules)
        # Rule A: Current price is above MA150 and MA_long
        ma_short_val = latest.get(f"ma{ma_short}") or latest.get("ma50") or 0.0
        ma_long_val = latest.get(f"ma{ma_long}") or latest.get("ma200") or 0.0
        ma150 = latest.get("ma150") or 0.0
        
        is_above_mas = close > ma150 and close > ma_long_val
        is_ma_alignment = ma_short_val > ma150 > ma_long_val
        
        # Rule B: Long moving average is trending up (at least flat or up over 1 month)
        past_month_index = max(0, len(prices_history) - 22)
        past_ma_long = prices_history[past_month_index].get(f"ma{ma_long}") or prices_history[past_month_index].get("ma200") or 0.0
        is_ma200_up = ma_long_val >= past_ma_long * 0.99
        
        # Rule C: Current price is within 25% of 52-week high
        highs = [p["high"] for p in prices_history]
        year_high = max(highs)
        is_near_high = close >= year_high * 0.75
        
        is_trend_approved = is_above_mas and is_ma_alignment and is_ma200_up and is_near_high
        
        # 2. Measure Volatility Contractions (looking at periods: 40 days, 20 days, 10 days)
        # Contraction width = (Highest High - Lowest Low) / Lowest Low * 100
        c1_prices = prices_history[-40:-20] if len(prices_history) >= 40 else []
        c2_prices = prices_history[-20:-10] if len(prices_history) >= 20 else []
        c3_prices = prices_history[-10:]
        
        widths = []
        if len(c1_prices) > 0:
            w1 = (max(p["high"] for p in c1_prices) - min(p["low"] for p in c1_prices)) / min(p["low"] for p in c1_prices) * 100
            widths.append(round(w1, 2))
        if len(c2_prices) > 0:
            w2 = (max(p["high"] for p in c2_prices) - min(p["low"] for p in c2_prices)) / min(p["low"] for p in c2_prices) * 100
            widths.append(round(w2, 2))
        if len(c3_prices) > 0:
            w3 = (max(p["high"] for p in c3_prices) - min(p["low"] for p in c3_prices)) / min(p["low"] for p in c3_prices) * 100
            widths.append(round(w3, 2))
            
        # VCP Setup criteria: progressive contraction widths, e.g., w1 > w2 > w3, and w3 is very tight (< 6%)
        is_vcp_setup = False
        if len(widths) >= 3:
            is_contracting = widths[0] > widths[1] > widths[2]
            is_tight = widths[-1] < 6.0
            is_vcp_setup = is_contracting and is_tight
        elif len(widths) == 2:
            is_vcp_setup = widths[0] > widths[1] and widths[-1] < 5.0
            
        # 3. Breakout verification (volume spike and price breakthrough)
        # Volume > volume_factor x of the 20-day average volume
        recent_volumes = [p["volume"] for p in prices_history[-21:-1]]
        avg_vol = sum(recent_volumes) / len(recent_volumes) if recent_volumes else 1.0
        latest_vol = latest["volume"]
        is_volume_spike = latest_vol > avg_vol * volume_factor
        
        # Price closes near the highs of the last 15 days
        recent_high = max(p["high"] for p in prices_history[-15:-1])
        is_price_breakout = close >= recent_high * 0.995
        
        is_breakout = is_trend_approved and is_vcp_setup and is_volume_spike and is_price_breakout
        
        # Formulate summary
        summary = ""
        if not is_trend_approved:
            summary = "趋势过滤未通过：价格或均线排列不符合长期上升趋势模板"
        elif is_breakout:
            summary = f"VCP突破激活！经历 {len(widths)} 次波动率收缩 (宽度: {'% -> '.join(str(w) for w in widths)}%)，今日价格放量突破前高 {recent_high:.2f} 元"
        elif is_vcp_setup:
            summary = f"VCP形态筹码收敛中。波动率收缩情况：{'% -> '.join(str(w) for w in widths)}%，目前处于高位窄幅整理阶段，等待放量突破信号"
        else:
            summary = f"处于上升趋势中，但筹码结构并非典型VCP收敛。当前波动率宽度为 {'% -> '.join(str(w) for w in widths)}%"
            
        return {
            "is_trend_approved": is_trend_approved,
            "contractions": widths,
            "is_vcp_setup": is_vcp_setup,
            "is_breakout": is_breakout,
            "summary": summary
        }
