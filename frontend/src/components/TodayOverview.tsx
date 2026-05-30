import React from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Overview } from '../types';

interface TodayOverviewProps {
  overview: Overview;
  onRefresh: () => void;
  isLoading: boolean;
}

export const TodayOverview: React.FC<TodayOverviewProps> = ({ overview, onRefresh, isLoading }) => {
  const isRealtime = overview.is_realtime ?? false;
  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Title & Refresh */}
      <style>{`
        @keyframes spin-refresh {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>今日概览</h3>
          {!isRealtime && (
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
          )}
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            fontSize: '12px',
            color: '#1e5eff',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <RefreshCw 
            size={14} 
            className={isLoading ? 'glow-active' : ''} 
            style={{ 
              animation: isLoading ? 'spin-refresh 1s linear infinite' : 'none'
            }} 
          />
          刷新
        </button>
      </div>

      {/* Index list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1 }}>
        {overview.indices.map((idx) => {
          const isNegative = idx.change_pct < 0;
          return (
            <div 
              key={idx.code} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(241, 245, 249, 0.5)',
                border: '1px solid rgba(226, 232, 240, 0.4)'
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{idx.name}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px', fontFamily: "'Outfit', sans-serif" }}>{idx.code}</span>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '700', 
                  color: '#1e293b', 
                  fontFamily: "'JetBrains Mono', monospace" 
                }}>
                  {idx.price.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  gap: '4px',
                  color: isNegative ? '#ef4444' : '#10b981', 
                  fontSize: '12px', 
                  fontWeight: '600',
                  marginTop: '2px',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  {isNegative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                  <span>{isNegative ? '' : '+'}{idx.change_pct.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Market Turnover Volume */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: '10px',
          background: 'rgba(241, 245, 249, 0.5)',
          border: '1px solid rgba(226, 232, 240, 0.4)'
        }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>成交额</span>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>沪深两市全天</span>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              color: '#1e293b',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              {overview.turnover_billion} 亿
            </span>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end',
              gap: '4px',
              color: '#10b981', 
              fontSize: '12px', 
              fontWeight: '600',
              marginTop: '2px',
              fontFamily: "'Outfit', sans-serif"
            }}>
              <TrendingUp size={12} />
              <span>+{overview.turnover_change_pct.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Timestamp */}
      <div style={{ 
        marginTop: '20px', 
        fontSize: '11px', 
        color: '#94a3b8', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid rgba(226, 232, 240, 0.6)',
        paddingTop: '12px'
      }}>
        <span>数据截至 {overview.data_cutoff}</span>
        {!isRealtime ? (
          <span style={{ color: '#f59e0b', fontWeight: '500' }}>
            ⚠️ 仿真环境，仅供参考
          </span>
        ) : (
          <span style={{ color: '#10b981', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            实时行情 (新浪)
          </span>
        )}
      </div>
    </div>
  );
};
