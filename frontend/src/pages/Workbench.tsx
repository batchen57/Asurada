import React from 'react';
import { CardWorkflow } from '../components/CardWorkflow';
import { TodayOverview } from '../components/TodayOverview';
import { Positions } from '../components/Positions';
import { TodoList } from '../components/TodoList';
import { SystemStatusPanel } from '../components/SystemStatus';
import { RecentSignals } from '../components/RecentSignals';
import { WorkbenchData } from '../types';

interface WorkbenchProps {
  data: WorkbenchData | null;
  onRefresh: () => void;
  onNavigate: (tabId: string) => void;
  onToggleTask: (taskId: number, currentStatus: string) => void;
  isLoading: boolean;
}

export const Workbench: React.FC<WorkbenchProps> = ({ 
  data, 
  onRefresh, 
  onNavigate, 
  onToggleTask,
  isLoading 
}) => {
  if (!data) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: '#64748b',
        fontSize: '14px',
        fontWeight: '500'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="glow-active" style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid #1e5eff',
            borderTopColor: 'transparent',
            margin: '0 auto 16px auto',
            animation: 'spin 1s linear infinite'
          }} />
          正在载入 Asurada 数据层...
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Hero Card */}
      <div 
        className="glass-panel"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(30, 94, 255, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)',
          border: '1px solid rgba(30, 94, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
            Asurada 个人交易辅助系统 (A股为主)
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', lineHeight: '1.6' }}>
            <strong>定位</strong>：中低频个人投资者 | 盘前计划 + 盘中低频提示 + 盘后复盘 + 周度迭代 | 稳定优先
          </p>
        </div>
        
        {/* Glowing Logo Graphic */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #1e5eff 0%, #00c6ff 100%)',
          boxShadow: '0 8px 24px rgba(30, 94, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '28px',
          fontWeight: '900',
          fontFamily: "'Outfit', sans-serif"
        }}>
          A
        </div>
      </div>

      {/* Row 1: Workflow Steps */}
      <CardWorkflow tasks={data.tasks} onNavigate={onNavigate} />

      {/* Row 2: Grid of Overview, Positions, Todo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr 340px',
        gap: '24px',
      }}>
        {/* Left Column: Today's Overview */}
        <div>
          <TodayOverview overview={data.overview} onRefresh={onRefresh} isLoading={isLoading} />
        </div>
        
        {/* Middle Column: My Positions */}
        <div>
          <Positions positions={data.positions} onViewAll={() => onNavigate('observe')} />
        </div>

        {/* Right Column: Todo Checklist */}
        <div>
          <TodoList tasks={data.tasks} onToggleTask={onToggleTask} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Row 3: Grid of System Status & Recent Signals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <div>
          <SystemStatusPanel statuses={data.system_status} />
        </div>
        
        <div>
          <RecentSignals signals={data.signals} onViewAll={() => onNavigate('signals')} />
        </div>
      </div>
      
    </div>
  );
};
