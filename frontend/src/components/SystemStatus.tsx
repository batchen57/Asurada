import React from 'react';
import { Database, Cpu, Bot, ShieldAlert } from 'lucide-react';
import { SystemStatus } from '../types';

interface SystemStatusProps {
  statuses: SystemStatus[];
}

export const SystemStatusPanel: React.FC<SystemStatusProps> = ({ statuses }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case '数据服务': return Database;
      case '策略引擎': return Cpu;
      case '智能体服务': return Bot;
      case '信号与告警': return ShieldAlert;
      default: return Database;
    }
  };

  const getColor = (status: string) => {
    return status === '正常' ? '#10b981' : '#ef4444';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>系统状态</h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '16px'
      }}>
        {statuses.map((stat) => {
          const Icon = getIcon(stat.service_name);
          const color = getColor(stat.status);
          
          return (
            <div 
              key={stat.id}
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(248, 250, 252, 0.6)',
                border: '1px solid rgba(226, 232, 240, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Header: Label & Status Dot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{stat.service_name}</span>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: `0 0 8px ${color}`
                }} />
              </div>

              {/* Icon & Detail */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: stat.status === '正常' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color
                }}>
                  <Icon size={16} />
                </div>
                
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block' }}>
                    {stat.status}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '1px' }}>
                    {stat.detail}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
