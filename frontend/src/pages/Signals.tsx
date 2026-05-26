import React, { useState } from 'react';
import { BellRing, Filter, Clock } from 'lucide-react';
import { Signal } from '../types';

interface SignalsProps {
  signals: Signal[];
}

export const Signals: React.FC<SignalsProps> = ({ signals }) => {
  const [filter, setFilter] = useState<'all' | '买入' | '卖出' | '关注'>('all');

  const filteredSignals = signals.filter(s => filter === 'all' || s.direction === filter);

  const getBadgeColor = (status: string) => {
    switch (status) {
      case '已触发': return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
      case '观察中': return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' };
      case '已完成': return { text: '#1e5eff', bg: 'rgba(30, 94, 255, 0.08)' };
      default: return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' };
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case '买入': return '#ef4444';
      case '卖出': return '#10b981';
      case '关注': return '#f59e0b';
      default: return '#1e5eff';
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BellRing size={22} style={{ color: '#1e5eff' }} />
            信号与告警 (Signals & Alerts)
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            审核历史产生的策略买卖决策点、风控破位警示和中性价格行为观察日志。
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#64748b' }} />
          <select 
            value={filter}
            onChange={(e: any) => setFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(226,232,240,0.8)',
              background: 'white',
              fontSize: '12px',
              fontWeight: '500',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="all">全部方向</option>
            <option value="买入">买入信号</option>
            <option value="卖出">卖出信号</option>
            <option value="关注">关注信号</option>
          </select>
        </div>
      </div>

      {/* Signals Trail Grid */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} style={{ color: '#94a3b8' }} />
          信号流审计日志 ({filteredSignals.length} 条数据)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSignals.map((sig) => {
            const { text: statusColor, bg: statusBg } = getBadgeColor(sig.status);
            const dirColor = getDirectionColor(sig.direction);
            
            return (
              <div 
                key={sig.id}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(248,250,252,0.5)',
                  border: '1px solid rgba(226,232,240,0.6)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>{sig.timestamp}</span>
                  
                  <span style={{ fontSize: '14px', fontWeight: '700', color: dirColor }}>【{sig.direction}】</span>
                  
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                      {sig.name} ({sig.symbol})
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '12px' }}>
                      类型: {sig.strategy_type} 引擎
                    </span>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      <strong>触发原因</strong>: {sig.trigger_reason}
                    </p>
                  </div>
                </div>

                <span style={{
                  background: statusBg,
                  color: statusColor,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {sig.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
