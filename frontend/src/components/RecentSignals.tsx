import React from 'react';
import { Signal } from '../types';

interface RecentSignalsProps {
  signals: Signal[];
  onViewAll?: () => void;
}

export const RecentSignals: React.FC<RecentSignalsProps> = ({ signals, onViewAll }) => {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case '已触发':
        return {
          background: 'rgba(16, 185, 129, 0.08)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.15)'
        };
      case '观察中':
        return {
          background: 'rgba(100, 116, 139, 0.08)',
          color: '#64748b',
          border: '1px solid rgba(100, 116, 139, 0.15)'
        };
      case '已完成':
        return {
          background: 'rgba(30, 94, 255, 0.08)',
          color: '#1e5eff',
          border: '1px solid rgba(30, 94, 255, 0.15)'
        };
      default:
        return {
          background: 'rgba(148, 163, 184, 0.1)',
          color: '#64748b',
          border: 'none'
        };
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case '买入': return '#ef4444'; // Red for buy in A-share
      case '卖出': return '#10b981'; // Green for sell in A-share
      case '关注': return '#f59e0b'; // Orange/yellow for watch
      default: return '#1e5eff';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>最近信号</h3>
          <span style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.08)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.15)',
            letterSpacing: '0.5px'
          }}>
            仿真数据
          </span>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '12px',
              color: '#1e5eff',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            查看全部
          </button>
        )}
      </div>

      {/* Signals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
        {signals.slice(0, 4).map((sig) => {
          const badgeStyle = getBadgeStyle(sig.status);
          const dirColor = getDirectionColor(sig.direction);
          
          return (
            <div 
              key={sig.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.5)',
                border: '1px solid rgba(226, 232, 240, 0.6)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Left Side: Time, Direction, Name/Ticker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  color: '#94a3b8', 
                  fontFamily: "'Outfit', sans-serif",
                  width: '76px',
                  flexShrink: 0
                }}>
                  {sig.timestamp}
                </span>
                
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: dirColor,
                  flexShrink: 0
                }}>
                  【{sig.direction}】
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    {sig.name} <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400', fontFamily: "'Outfit', sans-serif" }}>({sig.symbol})</span>
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {sig.trigger_reason}
                  </span>
                </div>
              </div>

              {/* Right Side: Status Badge */}
              <span 
                className="badge"
                style={{
                  ...badgeStyle,
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}
              >
                {sig.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
