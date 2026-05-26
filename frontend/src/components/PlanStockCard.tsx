import React from 'react';
import { Zap, Target, AlertCircle, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

interface PlanStockCardProps {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
  vcpStatus: 'breakout' | 'setup' | 'normal' | 'weak';
  vcpContractions: number[];
  brooksStatus: string;
  brooksReason: string;
  isSelected?: boolean;
  onClick?: () => void;
}

export const PlanStockCard: React.FC<PlanStockCardProps> = ({
  symbol,
  name,
  sector,
  price,
  changePct,
  vcpStatus,
  vcpContractions,
  brooksStatus,
  brooksReason,
  isSelected = false,
  onClick
}) => {
  const isUp = changePct >= 0;

  // Render VCP status badge
  const renderVcpBadge = () => {
    switch (vcpStatus) {
      case 'breakout':
        return (
          <span 
            className="badge glow-active animate-pulse" 
            style={{ 
              background: 'rgba(34, 197, 94, 0.15)', 
              color: '#22c55e', 
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '700'
            }}
          >
            <Zap size={11} fill="#22c55e" />
            VCP 突破激活
          </span>
        );
      case 'setup':
        return (
          <span 
            className="badge" 
            style={{ 
              background: 'rgba(59, 130, 246, 0.12)', 
              color: '#3b82f6', 
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '600'
            }}
          >
            <Compass size={11} />
            筹码极度收敛
          </span>
        );
      case 'normal':
        return (
          <span 
            className="badge" 
            style={{ 
              background: 'rgba(100, 116, 139, 0.08)', 
              color: '#64748b', 
              border: '1px solid rgba(100, 116, 139, 0.15)',
              fontWeight: '500'
            }}
          >
            上升趋势整理
          </span>
        );
      default:
        return (
          <span 
            className="badge" 
            style={{ 
              background: 'rgba(239, 68, 68, 0.08)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.15)',
              fontWeight: '500'
            }}
          >
            趋势偏弱/震荡
          </span>
        );
    }
  };

  // Render Brooks Naked K status badge
  const renderBrooksBadge = () => {
    if (brooksStatus === 'High 2') {
      return (
        <span 
          className="badge" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(30, 94, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', 
            color: '#1e5eff', 
            border: '1px solid rgba(30, 94, 255, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '700'
          }}
        >
          <Target size={11} />
          做多 High 2 触发
        </span>
      );
    } else if (brooksStatus === 'High 1') {
      return (
        <span 
          className="badge" 
          style={{ 
            background: 'rgba(30, 94, 255, 0.08)', 
            color: '#1e5eff', 
            border: '1px solid rgba(30, 94, 255, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '600'
          }}
        >
          做多 High 1 触发
        </span>
      );
    } else if (brooksStatus === '支撑区反转') {
      return (
        <span 
          className="badge" 
          style={{ 
            background: 'rgba(139, 92, 246, 0.12)', 
            color: '#8b5cf6', 
            border: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '600'
          }}
        >
          <Target size={11} />
          支撑区看涨 Pinbar
        </span>
      );
    } else if (brooksStatus === 'Low 1') {
      return (
        <span 
          className="badge" 
          style={{ 
            background: 'rgba(239, 68, 68, 0.12)', 
            color: '#ef4444', 
            border: '1px solid rgba(239, 68, 68, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: '600'
          }}
        >
          <AlertCircle size={11} />
          🚨 空头 Low 1 破位
        </span>
      );
    } else {
      return (
        <span 
          className="badge" 
          style={{ 
            background: 'rgba(148, 163, 184, 0.08)', 
            color: '#64748b', 
            border: '1px solid rgba(148, 163, 184, 0.15)'
          }}
        >
          裸K无触发
        </span>
      );
    }
  };

  return (
    <div 
      className={`glass-panel ${isSelected ? 'selected-card' : ''}`}
      onClick={onClick}
      style={{
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isSelected ? '1px solid #1e5eff' : '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: isSelected ? '0 8px 30px rgba(30, 94, 255, 0.12)' : '0 4px 12px rgba(0, 0, 0, 0.01)',
        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
        background: isSelected ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(30, 94, 255, 0.02) 100%)' : '#ffffff'
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'rgba(30, 94, 255, 0.3)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.01)';
        }
      }}
    >
      {/* Card Header: Stock info & price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {name}
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500', fontFamily: 'monospace' }}>{symbol}</span>
          </h4>
          <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>{sector} 板块</span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
            {price.toFixed(2)}
          </span>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              marginTop: '3px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-end',
              color: isUp ? '#22c55e' : '#ef4444',
              fontFamily: 'monospace'
            }}
          >
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {isUp ? '+' : ''}{changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Double Strategy Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {renderVcpBadge()}
        {renderBrooksBadge()}
      </div>

      {/* VCP Contraction Path Visualization */}
      <div style={{ background: 'rgba(248, 250, 252, 0.6)', border: '1px solid rgba(226, 232, 240, 0.6)', borderRadius: '8px', padding: '10px 12px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
          VCP 波动率收缩路径 (Contraction Widths):
        </span>
        
        {vcpContractions.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {vcpContractions.map((c, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <div style={{ height: '2px', flexGrow: 1, background: '#e2e8f0', position: 'relative' }}>
                    <div 
                      style={{ 
                        position: 'absolute', 
                        right: '2px', 
                        top: '-3px', 
                        border: 'solid #94a3b8', 
                        borderWidth: '0 1.5px 1.5px 0', 
                        display: 'inline-block', 
                        padding: '1.5px', 
                        transform: 'rotate(-45deg)' 
                      }} 
                    />
                  </div>
                )}
                <div 
                  style={{ 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    color: idx === vcpContractions.length - 1 ? (c < 6.0 ? '#22c55e' : '#1e5eff') : '#64748b',
                    fontFamily: 'monospace',
                    background: idx === vcpContractions.length - 1 ? (c < 6.0 ? 'rgba(34,197,94,0.08)' : 'rgba(30,94,255,0.06)') : '#ffffff',
                    border: '1px solid',
                    borderColor: idx === vcpContractions.length - 1 ? (c < 6.0 ? 'rgba(34,197,94,0.18)' : 'rgba(30,94,255,0.15)') : '#e2e8f0',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {c.toFixed(1)}%
                </div>
              </React.Fragment>
            ))}
            
            {vcpContractions[vcpContractions.length - 1] < 6.0 && (
              <span 
                style={{ 
                  fontSize: '9px', 
                  color: '#22c55e', 
                  fontWeight: '800', 
                  background: 'rgba(34, 197, 94, 0.12)', 
                  padding: '2px 5px', 
                  borderRadius: '3px', 
                  marginLeft: 'auto',
                  border: '1px solid rgba(34, 197, 94, 0.2)'
                }}
              >
                已收紧 🎯
              </span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>趋势偏弱，无明显收敛整理</span>
        )}
      </div>

      {/* PA trigger reason tooltip summary */}
      <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.5', borderTop: '1px dashed rgba(226, 232, 240, 0.8)', paddingTop: '8px', marginTop: '2px' }}>
        <span style={{ fontWeight: '600', color: '#475569' }}>智能体结论：</span>
        {brooksReason || "目前没有触及高盈亏比的裸K价格行为触发点。建议持股或空仓观望。"}
      </div>
    </div>
  );
};
