import React from 'react';
import { ClipboardList, Eye, PieChart, Target } from 'lucide-react';
import { Task } from '../types';

interface CardWorkflowProps {
  tasks: Task[];
  onNavigate: (tabId: string) => void;
}

export const CardWorkflow: React.FC<CardWorkflowProps> = ({ tasks, onNavigate }) => {
  // Find task statuses
  const getTaskStatus = (phase: string) => {
    const task = tasks.find(t => t.phase === phase);
    if (!task) return '未开始';
    return task.status === '已完成' ? '已完成' : (phase === 'Observe' ? '交易中' : '未开始');
  };

  const steps = [
    {
      id: 'plan',
      phase: 'Plan',
      num: '01',
      title: '盘前计划',
      enTitle: 'Plan',
      desc: '用“截至前一交易日”的稳定数据，把今天的操作变成可执行清单',
      icon: ClipboardList,
      color: '#1e5eff',
      bgLight: 'rgba(30, 94, 255, 0.03)',
      borderLight: 'rgba(30, 94, 255, 0.15)',
      btnText: '进入计划',
      badgeClass: 'badge-blue'
    },
    {
      id: 'observe',
      phase: 'Observe',
      num: '02',
      title: '盘中盯盘',
      enTitle: 'Observe',
      desc: '默认静默 | 只盯“持仓/观察池”，低频巡检 + 阈值触发',
      icon: Eye,
      color: '#10b981',
      bgLight: 'rgba(16, 185, 129, 0.03)',
      borderLight: 'rgba(16, 185, 129, 0.15)',
      btnText: '进入盯盘',
      badgeClass: 'badge-green'
    },
    {
      id: 'review',
      phase: 'Review',
      num: '03',
      title: '盘后复盘',
      enTitle: 'Review',
      desc: '用当日完整日线把距离说清楚，发生了什么 → 为什么 → 明天怎么做',
      icon: PieChart,
      color: '#8b5cf6',
      bgLight: 'rgba(139, 92, 246, 0.03)',
      borderLight: 'rgba(139, 92, 246, 0.15)',
      btnText: '进入复盘',
      badgeClass: 'badge-purple'
    },
    {
      id: 'discovery',
      phase: 'Discovery',
      num: '04',
      title: '选股与题材',
      enTitle: 'Discovery',
      desc: '把“全市噪声音”压缩成可研究的Top清单，并能一键深度分析',
      icon: Target,
      color: '#f59e0b',
      bgLight: 'rgba(245, 158, 11, 0.03)',
      borderLight: 'rgba(245, 158, 11, 0.15)',
      btnText: '进入发现',
      badgeClass: 'badge-yellow'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    }}>
      {steps.map((step) => {
        const Icon = step.icon;
        const status = getTaskStatus(step.phase);
        const isCompleted = status === '已完成';
        
        return (
          <div
            key={step.id}
            className="glass-panel"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px',
              border: `1px solid ${step.borderLight}`,
              background: `linear-gradient(135deg, #ffffff 0%, ${step.bgLight} 100%)`
            }}
          >
            {/* Header: Num, Title, Status */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: step.color, fontFamily: "'Outfit', sans-serif" }}>
                    {step.num}
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                    {step.title}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '400', color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                    {step.enTitle}
                  </span>
                </div>
                
                {/* Status Dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? '#10b981' : (step.phase === 'Observe' ? '#10b981' : '#94a3b8'),
                    display: 'inline-block'
                  }} />
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p style={{ 
                fontSize: '12px', 
                color: '#64748b', 
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                {step.desc}
              </p>
            </div>

            {/* Footer: Button & Icon */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
              <button
                onClick={() => onNavigate(step.id)}
                style={{
                  background: isCompleted ? 'rgba(0, 0, 0, 0.05)' : step.color,
                  color: isCompleted ? '#64748b' : '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isCompleted ? 'none' : `0 4px 12px ${step.color}25`
                }}
                onMouseEnter={(e) => {
                  if (!isCompleted) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 6px 16px ${step.color}40`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCompleted) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${step.color}25`;
                  }
                }}
              >
                {step.btnText}
              </button>
              
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: step.bgLight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step.color
              }}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
