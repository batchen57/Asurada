from typing import List, Dict, Any, Tuple, Optional

class BrooksAgent:
    """
    Agent B: Al Brooks Naked K Price Action Strategy.
    Analyzes candlestick structures (bars) for High 1/2, Low 1/2 triggers,
    and reversal Pinbars at support/resistance levels.
    """

    @staticmethod
    def identify_bar_type(bar: Dict[str, Any]) -> str:
        """
        Classifies a single bar into a Trend Bar, Doji, or Reversal Bar.
        """
        o, h, l, c = bar["open"], bar["high"], bar["low"], bar["close"]
        bar_range = h - l if h - l > 0 else 0.01
        body = abs(c - o)
        body_ratio = body / bar_range
        
        # Bottom shadow
        bottom_shadow = min(o, c) - l
        # Top shadow
        top_shadow = h - max(o, c)
        
        if body_ratio >= 0.6:
            return "TrendBar_" + ("Bull" if c > o else "Bear")
        elif bottom_shadow > bar_range * 0.5:
            return "Pinbar_Bull" # Reversal bar with long bottom tail
        elif top_shadow > bar_range * 0.5:
            return "Pinbar_Bear" # Reversal bar with long top wick
        else:
            return "Doji"

    @staticmethod
    def analyze_price_action(prices_history: List[Dict[str, Any]], support_price: Optional[float] = None) -> Dict[str, Any]:
        """
        Scans the recent 10-15 bars to detect pullback signals (High 1 / High 2)
        and support confirmations.
        """
        if len(prices_history) < 15:
            return {
                "signal": "无信号",
                "reason": "数据样本太少",
                "is_triggered": False
            }

        latest_bars = prices_history[-15:]
        latest_bar = latest_bars[-1]
        prev_bar = latest_bars[-2]
        
        # 1. Identify support proximity
        # Let's say we check if the lowest price of the latest 2 bars is close to the support_price
        is_at_support = False
        support_reason = ""
        if support_price:
            low_dist = abs(latest_bar["low"] - support_price) / support_price
            if low_dist < 0.015: # within 1.5% of key support
                is_at_support = True
                support_reason = f"价格接近关键支撑位 ({support_price:.2f}元)"

        # 2. Count pullback high breakouts in the last few bars
        # An H1 is the first time a bar's high exceeds the prior bar's high in a pullback.
        # An H2 is the second time it occurs.
        # Pullback begins when we have consecutive lower highs/closes.
        
        # Simple simulated pullback logic:
        # Check if we were in an uptrend (MA20 > MA50) and had a short pullback (2-5 bars of lower highs)
        ma20 = latest_bar.get("ma20") or 0.0
        ma50 = latest_bar.get("ma50") or 0.0
        is_bull_trend = ma20 > ma50
        
        highs = [b["high"] for b in latest_bars]
        
        # Detect if latest bar breaks above prior bar's high
        is_high_breakout = latest_bar["high"] > prev_bar["high"]
        
        # Count how many times high broke prior high in the recent 5 days
        breakout_count = 0
        pullback_bars = latest_bars[-6:-1] # prior 5 bars
        for idx in range(1, len(pullback_bars)):
            if pullback_bars[idx]["high"] > pullback_bars[idx-1]["high"]:
                breakout_count += 1
                
        signal = "无信号"
        reason = "没有明显的裸K价格行为触发点"
        is_triggered = False
        
        bar_type = BrooksAgent.identify_bar_type(latest_bar)
        
        if is_bull_trend and is_high_breakout:
            if breakout_count == 0:
                signal = "High 1"
                reason = "强上升趋势回调后，首次突破前一K线高点，High 1 买入信号触发"
                is_triggered = True
            elif breakout_count == 1:
                signal = "High 2"
                reason = "上升通道两次回踩完成，High 2 进场信号确立，属于高概率做多点"
                is_triggered = True
                
        # Pinbar bounce at support
        if is_at_support and "Pinbar_Bull" in bar_type:
            signal = "支撑区反转"
            reason = f"{support_reason}，且今日收出强力看涨锤子线（Pinbar），尾盘买入力量强劲"
            is_triggered = True
            
        # Breakdown signal
        is_low_breakdown = latest_bar["close"] < prev_bar["low"]
        if not is_bull_trend and is_low_breakdown:
            signal = "Low 1"
            reason = "下跌趋势中跌破前一日低点，空头动能延续"
            is_triggered = False # Not a buy, just analytical

        return {
            "signal": signal,
            "reason": reason,
            "is_triggered": is_triggered,
            "bar_type": bar_type,
            "is_at_support": is_at_support
        }
