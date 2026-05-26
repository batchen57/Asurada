import React from 'react';
import { Task } from '../types';

interface TodoListProps {
  tasks: Task[];
  onToggleTask: (taskId: number, currentStatus: string) => void;
  onNavigate: (tabId: string) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ tasks, onToggleTask, onNavigate }) => {
  const phaseToTabMap: Record<string, string> = {
    'Plan': 'plan',
    'Observe': 'observe',
    'Review': 'review',
    'Iterate': 'discovery'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '已完成': return { text: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' };
      case '进行中': return { text: '#1e5eff', bg: 'rgba(30, 94, 255, 0.08)' };
      case '去完成': return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' };
      case '待开始': return { text: '#94a3b8', bg: 'rgba(148, 163, 184, 0.08)' };
      case '去执行': return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' };
      default: return { text: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>今日待办</h3>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
        {tasks.map((task) => {
          const isCompleted = task.status === '已完成';
          const { text: statusColor, bg: statusBg } = getStatusColor(task.status);
          
          return (
            <div 
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: isCompleted ? 'rgba(241, 245, 249, 0.3)' : 'rgba(255, 255, 255, 0.6)',
                border: isCompleted ? '1px solid rgba(226, 232, 240, 0.5)' : '1px solid rgba(226, 232, 240, 0.8)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Check Circle and Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => onToggleTask(task.id, task.status)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isCompleted ? '2px solid #10b981' : '2px solid #cbd5e1',
                    background: isCompleted ? '#10b981' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}>
                    {isCompleted && '✓'}
                  </div>
                </button>
                
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: isCompleted ? '400' : '500', 
                  color: isCompleted ? '#94a3b8' : '#334155',
                  textDecoration: isCompleted ? 'line-through' : 'none'
                }}>
                  {task.task_name}
                </span>
              </div>

              {/* Action Button / Badge */}
              <button
                onClick={() => {
                  const targetTab = phaseToTabMap[task.phase];
                  if (targetTab) onNavigate(targetTab);
                }}
                style={{
                  background: statusBg,
                  color: statusColor,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                }}
              >
                {task.status}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <button 
        onClick={() => onNavigate('plan')}
        style={{
          marginTop: '20px',
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
          paddingTop: '16px',
          width: '100%'
        }}
      >
        全部任务 ›
      </button>
    </div>
  );
};
