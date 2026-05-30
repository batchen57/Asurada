import React, { useState, useEffect } from 'react';
import { BellRing, Filter, Clock, Search, RefreshCw, AlertTriangle, Zap, Trash2, ShieldAlert } from 'lucide-react';
import { Signal } from '../types';

interface SignalsProps {
  signals?: Signal[];
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export const Signals: React.FC<SignalsProps> = ({ signals: initialSignals }) => {
  const [signals, setSignals] = useState<Signal[]>(initialSignals || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Filters state
  const [directionFilter, setDirectionFilter] = useState<'all' | '买入' | '卖出' | '关注'>('all');
  const [strategyFilter, setStrategyFilter] = useState<'all' | 'VCP' | 'Brooks'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | '已触发' | '观察中' | '已完成'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Newly triggered signal ID for flash highlight animation
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const fetchSignals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/signals`);
      if (response.ok) {
        const json = await response.json();
        setSignals(json);
      } else {
        console.warn('Backend signals fetch returned non-ok status. Keeping current list.');
      }
    } catch (err) {
      console.warn('Backend server offline during signals fetch. Falling back to offline model.', err);
      // High-fidelity fallback initial signals if offline
      if (signals.length === 0) {
        setSignals([
          { id: 1, timestamp: '05-20 10:32', symbol: '300750.SZ', name: '宁德时代', direction: '买入', strategy_type: 'VCP', trigger_reason: '突破前高，量能放大 | 放量向上突破', status: '已触发' },
          { id: 2, timestamp: '05-20 09:55', symbol: '300760.SZ', name: '迈瑞医疗', direction: '关注', strategy_type: 'Brooks', trigger_reason: '价格接近支撑位 | 接近关键支撑位', status: '观察中' },
          { id: 3, timestamp: '05-19 14:21', symbol: '000002.SZ', name: '万科A', direction: '卖出', strategy_type: 'Brooks', trigger_reason: '跌破关键均线 | 跌破风控均线', status: '已完成' }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  const handleSimulateSignal = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/signals/test`, { method: 'POST' });
      if (response.ok) {
        const newSig = await response.json();
        setSignals(prev => [newSig, ...prev]);
        setHighlightedId(newSig.id);
        setTimeout(() => setHighlightedId(null), 3000); // Clear highlight after 3s
      }
    } catch (err) {
      console.warn('Offline simulation: creating high-fidelity mock signal local state', err);
      // High fidelity offline simulation
      const randomStocks = [
        { symbol: '600519.SH', name: '贵州茅台' },
        { symbol: '300750.SZ', name: '宁德时代' },
        { symbol: '300760.SZ', name: '迈瑞医疗' },
        { symbol: '000002.SZ', name: '万科A' }
      ];
      const selected = randomStocks[Math.floor(Math.random() * randomStocks.length)];
      const strat = Math.random() > 0.5 ? 'VCP' : 'Brooks';
      const direction = strat === 'VCP' ? '买入' : (Math.random() > 0.5 ? '关注' : '卖出');
      
      const now = new Date();
      const timeStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const mockSig: Signal = {
        id: Date.now(),
        timestamp: timeStr,
        symbol: selected.symbol,
        name: selected.name,
        direction,
        strategy_type: strat,
        trigger_reason: strat === 'VCP' 
          ? '日线级别筹码极度收拢，带量突破箱体上沿，触发买入信号'
          : (direction === '关注' ? '向下缩量探底，在关键黄金分割支撑线收出长下影看涨锤头线' : '高位长阴穿多线，量能显著放大，跌破中线布林带中轨防守位，强制清仓'),
        status: '已触发'
      };
      
      setSignals(prev => [mockSig, ...prev]);
      setHighlightedId(mockSig.id);
      setTimeout(() => setHighlightedId(null), 3000);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleClearSignals = async () => {
    if (!window.confirm('您确定要清空数据库中的所有历史信号记录吗？该操作不可撤销。')) return;
    setIsClearing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/signals`, { method: 'DELETE' });
      if (response.ok) {
        setSignals([]);
      }
    } catch (err) {
      console.warn('Offline clear: clearing local state', err);
      setSignals([]);
    } finally {
      setIsClearing(false);
    }
  };

  // Perform multi-dimensional client-side filtering on signals list
  const filteredSignals = signals.filter(sig => {
    const matchesDirection = directionFilter === 'all' || sig.direction === directionFilter;
    const matchesStrategy = strategyFilter === 'all' || sig.strategy_type === strategyFilter;
    const matchesStatus = statusFilter === 'all' || sig.status === statusFilter;
    
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      sig.symbol.toLowerCase().includes(query) || 
      sig.name.toLowerCase().includes(query) ||
      (sig.trigger_reason && sig.trigger_reason.toLowerCase().includes(query));

    return matchesDirection && matchesStrategy && matchesStatus && matchesSearch;
  });

  const getBadgeColor = (status: string) => {
    switch (status) {
      case '已触发': return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' };
      case '观察中': return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' };
      case '已完成': return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)' };
      default: return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.08)', border: '1px solid rgba(100, 116, 139, 0.15)' };
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case '买入': return { color: '#ef4444', text: '买入信号' }; // Red for Buy
      case '卖出': return { color: '#10b981', text: '卖出信号' }; // Green for Sell
      case '关注': return { color: '#f59e0b', text: '关注信号' }; // Orange for Watch
      default: return { color: '#1e5eff', text: '普通信号' };
    }
  };

  // Statistical counters
  const totalCount = filteredSignals.length;
  const buyCount = filteredSignals.filter(s => s.direction === '买入').length;
  const sellCount = filteredSignals.filter(s => s.direction === '卖出').length;
  const watchCount = filteredSignals.filter(s => s.direction === '关注').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card & Interactive Buttons */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BellRing size={22} style={{ color: '#1e5eff' }} />
            信号与告警 (Signals & Alerts)
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            审核历史产生的策略买卖决策点、风控破位警示和中性价格行为观察日志。
          </p>
        </div>

        {/* Dynamic simulator actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={fetchSignals}
            disabled={isLoading}
            className="btn-refresh"
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(226,232,240,0.9)',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleSimulateSignal}
            disabled={isSimulating}
            style={{
              background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: isSimulating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(30, 94, 255, 0.15)'
            }}
          >
            <Zap size={14} />
            {isSimulating ? '模拟派发中...' : '一键模拟信号'}
          </button>

          <button
            onClick={handleClearSignals}
            disabled={isClearing || signals.length === 0}
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: (isClearing || signals.length === 0) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (signals.length > 0) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
            }}
          >
            <Trash2 size={14} />
            {isClearing ? '正在清空...' : '清空信号日志'}
          </button>
        </div>
      </div>

      {/* Quick Statistics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>信号流总计</span>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#1e293b', fontFamily: "'Outfit', sans-serif" }}>{totalCount} <span style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>条</span></span>
        </div>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid #ef4444' }}>
          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>买入突破点</span>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#ef4444', fontFamily: "'Outfit', sans-serif" }}>{buyCount} <span style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>次</span></span>
        </div>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid #10b981' }}>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>风控卖出警示</span>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', fontFamily: "'Outfit', sans-serif" }}>{sellCount} <span style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>次</span></span>
        </div>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '4px', borderLeft: '3px solid #f59e0b' }}>
          <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>裸K支撑观察</span>
          <span style={{ fontSize: '22px', fontWeight: '800', color: '#f59e0b', fontFamily: "'Outfit', sans-serif" }}>{watchCount} <span style={{ fontSize: '12px', fontWeight: '500', color: '#94a3b8' }}>条</span></span>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'white' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={15} style={{ color: '#1e5eff' }} />
          多维条件精准过滤
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '16px', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="搜索股票代码、简称或触发原因..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                fontSize: '12px',
                outline: 'none',
                background: 'rgba(248,250,252,0.4)',
                color: '#334155',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #1e5eff'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(226,232,240,0.9)'}
            />
          </div>

          {/* Direction Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <select
              value={directionFilter}
              onChange={(e: any) => setDirectionFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                background: 'rgba(248,250,252,0.4)',
                fontSize: '12px',
                fontWeight: '500',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">全部买卖方向</option>
              <option value="买入">买入信号</option>
              <option value="卖出">卖出信号</option>
              <option value="关注">关注信号</option>
            </select>
          </div>

          {/* Strategy Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <select
              value={strategyFilter}
              onChange={(e: any) => setStrategyFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                background: 'rgba(248,250,252,0.4)',
                fontSize: '12px',
                fontWeight: '500',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">全部策略引擎</option>
              <option value="VCP">VCP 波动率收缩</option>
              <option value="Brooks">Brooks 裸K价格行为</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                background: 'rgba(248,250,252,0.4)',
                fontSize: '12px',
                fontWeight: '500',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">全部告警状态</option>
              <option value="已触发">已触发</option>
              <option value="观察中">观察中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>
        </div>
      </div>

      {/* Signals Trail Grid */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', minHeight: '350px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} style={{ color: '#94a3b8' }} />
            信号审计实时追踪流 ({filteredSignals.length} 条符合条件)
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>
            双向多维度拦截，非阻塞切面审计就绪
          </span>
        </h3>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', gap: '12px', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ color: '#1e5eff' }} />
            <span style={{ fontSize: '13px' }}>正在加载历史信号流...</span>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', gap: '16px', color: '#94a3b8', border: '1px dashed rgba(226,232,240,0.8)', borderRadius: '12px' }}>
            <ShieldAlert size={36} style={{ color: '#cbd5e1' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>暂无符合当前过滤条件的信号记录</p>
              <p style={{ fontSize: '11px', marginTop: '4px' }}>您可以调整上方筛选面板，或点击上方「一键模拟信号」派发新告警进行观测。</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <style>{`
              @keyframes flashGlow {
                0% { background-color: rgba(30, 94, 255, 0.15); border-color: rgba(30, 94, 255, 0.4); }
                100% { background-color: rgba(248, 250, 252, 0.5); border-color: rgba(226, 232, 240, 0.6); }
              }
            `}</style>
            
            {filteredSignals.map((sig) => {
              const { text: statusColor, bg: statusBg, border: statusBorder } = getBadgeColor(sig.status);
              const dirInfo = getDirectionColor(sig.direction);
              const isNew = sig.id === highlightedId;
              
              return (
                <div 
                  key={sig.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'rgba(248,250,252,0.5)',
                    border: '1px solid rgba(226,232,240,0.6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    animation: isNew ? 'flashGlow 3s ease forwards' : 'none',
                    boxShadow: isNew ? '0 0 15px rgba(30, 94, 255, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.borderColor = 'rgba(30, 94, 255, 0.25)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)';
                    e.currentTarget.style.boxShadow = isNew ? '0 0 15px rgba(30, 94, 255, 0.1)' : 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '80%' }}>
                    {/* Timestamp */}
                    <span style={{ 
                      fontSize: '12px', 
                      color: '#94a3b8', 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: '500',
                      width: '80px',
                      flexShrink: 0
                    }}>
                      {sig.timestamp}
                    </span>
                    
                    {/* Buy/Sell Direction Indicator */}
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '800', 
                      color: dirInfo.color,
                      width: '76px',
                      flexShrink: 0
                    }}>
                      【{sig.direction}】
                    </span>
                    
                    {/* Signal core content details */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                          {sig.name} ({sig.symbol})
                        </span>
                        <span style={{ 
                          fontSize: '10px', 
                          background: 'rgba(30, 94, 255, 0.05)',
                          color: '#1e5eff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          {sig.strategy_type} 引擎
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: '1.5' }}>
                        <strong>触发依据</strong>: {sig.trigger_reason}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    background: statusBg,
                    color: statusColor,
                    border: statusBorder,
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    textAlign: 'center',
                    width: '84px',
                    flexShrink: 0
                  }}>
                    {sig.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
