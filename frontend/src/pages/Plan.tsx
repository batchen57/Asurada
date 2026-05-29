import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Save, 
  Send, 
  RefreshCw, 
  Sliders, 
  Play, 
  Edit3, 
  Eye, 
  Activity, 
  ArrowRight,
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Task } from '../types';
import { PlanStockCard } from '../components/PlanStockCard';

interface PlanProps {
  tasks: Task[];
  onTriggerOrchestrator: (phase: string) => Promise<any>;
  onRefreshData: () => void;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

const mockStocks = [
  {
    symbol: '600519.SH',
    name: '贵州茅台',
    sector: '白酒',
    price: 1688.50,
    changePct: 0.25,
    vcpStatus: 'normal' as const,
    vcpContractions: [18.5, 11.2],
    brooksStatus: '支撑区反转',
    brooksReason: 'MA150日线支撑位测试中，低点抬高并收出长下影 Pinbar，多头资金护盘意图明显。'
  },
  {
    symbol: '300750.SZ',
    name: '宁德时代',
    sector: '新能源锂电',
    price: 195.80,
    changePct: 5.84,
    vcpStatus: 'breakout' as const,
    vcpContractions: [12.0, 4.0, 1.8],
    brooksStatus: 'High 2',
    brooksReason: '日K放量突破底部箱体上限，成交量放大至MA50的1.85倍，强势触发 Brooks 做多 High 2 突破信号。'
  },
  {
    symbol: '300760.SZ',
    name: '迈瑞医疗',
    sector: '医疗器械',
    price: 286.66,
    changePct: 1.10,
    vcpStatus: 'setup' as const,
    vcpContractions: [9.5, 3.8],
    brooksStatus: 'High 1',
    brooksReason: '上升中继缩量回调测试MA20均线，今日收出阳十字星，成功触发做多 High 1 逢低建仓信号。'
  },
  {
    symbol: '000002.SZ',
    name: '万科A',
    sector: '房地产',
    price: 8.12,
    changePct: -4.30,
    vcpStatus: 'weak' as const,
    vcpContractions: [],
    brooksStatus: 'Low 1',
    brooksReason: '破位下行，MA20死叉，空头趋势增强并触发 Low 1 破位卖出信号。系统强制建议规避风险。'
  }
];

export const Plan: React.FC<PlanProps> = ({ tasks, onTriggerOrchestrator, onRefreshData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [onePager, setOnePager] = useState<string | null>(null);
  
  // Interactive UI States
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('600519.SH');
  const [vcpThreshold, setVcpThreshold] = useState<number>(6.0);
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(1.5);
  const [activeEditorTab, setActiveEditorTab] = useState<'preview' | 'edit'>('preview');
  
  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Agent connectivity mock states
  const [agentStatuses, setAgentStatuses] = useState({
    datahub: 'online',
    vcp: 'online',
    brooks: 'online'
  });

  const planTask = tasks.find(t => t.phase === 'Plan');
  const isCompleted = planTask?.status === '已完成';

  // Helper to trigger custom toast notifications
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync onePager plan content from backend whenever planTask changes
  useEffect(() => {
    if (planTask?.result_content) {
      setOnePager(planTask.result_content);
    } else {
      setOnePager(null);
    }
  }, [planTask?.result_content]);

  // Handle Orchestrator plan phase trigger
  const handleGeneratePlan = async () => {
    setIsLoading(true);
    try {
      showToast('正在激活 Agent 调度引擎，执行多策略全量扫描...', 'warning');
      const res = await onTriggerOrchestrator('Plan');
      if (res && res.success) {
        setOnePager(res.result.content);
        showToast('盘前操作一页纸成功生成并存入数据库！', 'success');
        onRefreshData();
      } else {
        showToast('Agent 扫描失败，请检查后端服务日志。', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('调用调度引擎时发生未知错误。', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Save manual modifications back to SQLite database
  const handleSaveEdits = async () => {
    if (!planTask) {
      showToast('找不到对应的盘前计划任务，无法保存。', 'error');
      return;
    }
    if (!onePager) {
      showToast('计划内容为空，无法保存空文本。', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${planTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: '已完成',
          result_content: onePager
        })
      });

      if (response.ok) {
        showToast('手动修改的内容已安全保存至 SQLite 数据库！', 'success');
        onRefreshData();
      } else {
        showToast('保存计划至数据库失败。', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('保存时发生网络通信错误。', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Push edited markdown content to Feishu Robot
  const handlePushFeishu = async () => {
    if (!onePager) {
      showToast('没有计划内容，请先一键生成。', 'error');
      return;
    }

    setIsPushing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orchestrator/push-feishu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: onePager
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          showToast('一页纸计划已成功推送到您的飞书客户端！📬', 'success');
        } else {
          showToast('飞书机器人推送失败，请检查 Webhook 配置是否开启。', 'warning');
        }
      } else {
        showToast('推送至飞书后端接口失败。', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('飞书推送网络异常，请稍后重试。', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  // Simulated refreshing of Agent status checkups
  const handleRefreshAgents = () => {
    setAgentStatuses({ datahub: 'checking', vcp: 'checking', brooks: 'checking' });
    setTimeout(() => {
      setAgentStatuses({ datahub: 'online', vcp: 'online', brooks: 'online' });
      showToast('策略智能体管道健康度自检完成，状态良好。', 'success');
    }, 800);
  };

  // Formatted inline HTML custom Markdown parser
  const renderMarkdown = (md: string) => {
    if (!md) return null;
    return md.split('\n').map((line, idx) => {
      // Heading 2
      if (line.startsWith('## ')) {
        const text = line.replace('## ', '').trim();
        return (
          <h3 
            key={idx} 
            style={{ 
              fontSize: '16px', 
              fontWeight: '700', 
              color: '#0f172a', 
              margin: '22px 0 10px 0',
              fontFamily: 'var(--font-title)',
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
              paddingBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {text}
          </h3>
        );
      }
      // Heading 3
      if (line.startsWith('### ')) {
        const text = line.replace('### ', '').trim();
        return (
          <h4 
            key={idx} 
            style={{ 
              fontSize: '13.5px', 
              fontWeight: '600', 
              color: '#1e5eff', 
              margin: '16px 0 8px 0',
              paddingLeft: '8px',
              borderLeft: '3px solid #1e5eff',
              fontFamily: 'var(--font-title)'
            }}
          >
            {text}
          </h4>
        );
      }
      // Divider
      if (line.startsWith('---')) {
        return (
          <hr 
            key={idx} 
            style={{ 
              border: 'none', 
              borderTop: '1px solid rgba(226, 232, 240, 0.8)', 
              margin: '18px 0' 
            }} 
          />
        );
      }
      // Bullet list items
      if (line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        
        // Parse bold tags **
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        const elements = [];
        let lastIndex = 0;
        
        while ((match = boldRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            elements.push(content.substring(lastIndex, match.index));
          }
          elements.push(<strong key={match.index} style={{ color: '#0f172a', fontWeight: '700' }}>{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < content.length) {
          elements.push(content.substring(lastIndex));
        }

        // Dynamically style bullet alerts
        let bulletColor = '#1e5eff';
        let background = 'transparent';
        let padding = '0';
        let borderRadius = '0';
        let border = 'none';

        if (content.includes('🟢') || content.includes('买入突破')) {
          bulletColor = '#10b981';
          background = 'rgba(16, 185, 129, 0.03)';
          padding = '6px 10px';
          borderRadius = '6px';
          border = '1px solid rgba(16, 185, 129, 0.1)';
        } else if (content.includes('🔵') || content.includes('做多进场')) {
          bulletColor = '#1e5eff';
          background = 'rgba(30, 94, 255, 0.03)';
          padding = '6px 10px';
          borderRadius = '6px';
          border = '1px solid rgba(30, 94, 255, 0.1)';
        } else if (content.includes('⚠️')) {
          bulletColor = '#f59e0b';
          background = 'rgba(245, 158, 11, 0.03)';
          padding = '6px 10px';
          borderRadius = '6px';
          border = '1px solid rgba(245, 158, 11, 0.1)';
        } else if (content.includes('🚨')) {
          bulletColor = '#ef4444';
          background = 'rgba(239, 68, 68, 0.04)';
          padding = '8px 12px';
          borderRadius = '6px';
          border = '1px dashed rgba(239, 68, 68, 0.2)';
        }

        return (
          <li 
            key={idx} 
            style={{ 
              marginLeft: '4px', 
              listStyleType: 'none', 
              margin: '6px 0', 
              fontSize: '12.5px',
              color: '#334155',
              lineHeight: '1.7',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              background,
              padding,
              borderRadius,
              border
            }}
          >
            <span style={{ color: bulletColor, fontSize: '8px', marginTop: '6px', flexShrink: 0 }}>●</span>
            <div style={{ flexGrow: 1 }}>{elements.length > 0 ? elements : content}</div>
          </li>
        );
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '6px' }} />;
      }

      // Standard text line with bold tags
      const boldRegex = /\*\*(.*?)\*\*/g;
      let match;
      const elements = [];
      let lastIndex = 0;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }
        elements.push(<strong key={match.index} style={{ color: '#0f172a', fontWeight: '700' }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      return (
        <p 
          key={idx} 
          style={{ 
            margin: '5px 0', 
            fontSize: '12.5px',
            color: '#334155',
            lineHeight: '1.7'
          }}
        >
          {elements.length > 0 ? elements : line}
        </p>
      );
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: toast.type === 'success' ? '#10b981' : (toast.type === 'error' ? '#ef4444' : '#f59e0b'),
            color: 'white',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: 'translateY(0)',
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title Card */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(30, 94, 255, 0.03) 100%)'
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-title)' }}>
            <CalendarRange size={22} style={{ color: '#1e5eff' }} />
            盘前计划 (Plan 02)
          </h2>
          <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', lineHeight: '1.5' }}>
            提取昨日收盘后的稳定交易数据，串联多重智能体扫描候选股票池，配比风险上限，最终形成具备高盈亏比的「可执行一页纸」。
          </p>
        </div>

        {/* State Badge */}
        <span 
          className={`badge ${isCompleted ? 'badge-green glow-active' : 'badge-blue'}`} 
          style={{ padding: '6px 14px', fontWeight: '700', border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(30,94,255,0.2)' }}
        >
          {isCompleted ? '已生成今日计划' : '今日计划待生成'}
        </span>
      </div>

      {/* Main split grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        
        {/* Left Side: Parameters & Candidate Watchlist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Agent Pipeline health column */}
          <div className="glass-panel" style={{ padding: '16px 20px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} style={{ color: '#1e5eff' }} />
                智能体协同状态
              </span>
              <button 
                onClick={handleRefreshAgents}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="手动重检"
              >
                <RefreshCw size={12} className={agentStatuses.datahub === 'checking' ? 'animate-spin' : ''} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* DataHub Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={11} /> DataHub 报价引擎
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: agentStatuses.datahub === 'online' ? '#10b981' : '#f59e0b',
                    boxShadow: agentStatuses.datahub === 'online' ? '0 0 8px #10b981' : 'none'
                  }} />
                  <span style={{ color: '#334155', fontWeight: '600' }}>
                    {agentStatuses.datahub === 'online' ? '就绪 (Tushare)' : (agentStatuses.datahub === 'checking' ? '检测中...' : '异常')}
                  </span>
                </div>
              </div>
              
              {/* VCP Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={11} /> VCP 波动率收缩智能体
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: agentStatuses.vcp === 'online' ? '#10b981' : '#f59e0b',
                    boxShadow: agentStatuses.vcp === 'online' ? '0 0 8px #10b981' : 'none'
                  }} />
                  <span style={{ color: '#334155', fontWeight: '600' }}>
                    {agentStatuses.vcp === 'online' ? '在线 (活跃中)' : (agentStatuses.vcp === 'checking' ? '检测中...' : '异常')}
                  </span>
                </div>
              </div>

              {/* Brooks PA Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={11} /> Brooks 裸K行为智能体
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    background: agentStatuses.brooks === 'online' ? '#10b981' : '#f59e0b',
                    boxShadow: agentStatuses.brooks === 'online' ? '0 0 8px #10b981' : 'none'
                  }} />
                  <span style={{ color: '#334155', fontWeight: '600' }}>
                    {agentStatuses.brooks === 'online' ? '在线 (就绪)' : (agentStatuses.brooks === 'checking' ? '检测中...' : '异常')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} style={{ color: '#1e5eff' }} />
              激活主编排引擎
            </h3>
            
            <p style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.6', marginBottom: '16px' }}>
              系统将扫描龙头标的日K，自动识别波动率收紧(VCP)与Brooks裸K支撑突破信号，完成配比运算。
            </p>
            
            <button
              onClick={handleGeneratePlan}
              disabled={isLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: '11px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(30, 94, 255, 0.25)',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.75 : 1
              }}
              onMouseEnter={(e) => { if(!isLoading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { if(!isLoading) e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Agent 深度研判扫描中...</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="white" />
                  一键生成今日计划一页纸
                </>
              )}
            </button>
          </div>

          {/* Advanced scan configuration sliders */}
          <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={14} style={{ color: '#1e5eff' }} />
              策略诊断配置面板
            </h3>
            
            {/* Slider 1 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>VCP 最终收缩幅度阈值</span>
                <span style={{ color: '#1e5eff', fontWeight: '700', fontFamily: 'monospace' }}>&lt; {vcpThreshold.toFixed(1)}%</span>
              </div>
              <input 
                type="range"
                min="2.0"
                max="12.0"
                step="0.1"
                value={vcpThreshold}
                onChange={(e) => setVcpThreshold(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#1e5eff',
                  cursor: 'pointer',
                  height: '4px',
                  borderRadius: '2px'
                }}
              />
            </div>

            {/* Slider 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>突破成交量放大倍率</span>
                <span style={{ color: '#8b5cf6', fontWeight: '700', fontFamily: 'monospace' }}>&gt; {volumeMultiplier.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={volumeMultiplier}
                onChange={(e) => setVolumeMultiplier(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#8b5cf6',
                  cursor: 'pointer',
                  height: '4px',
                  borderRadius: '2px'
                }}
              />
            </div>
          </div>

          {/* Guideline constraints */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid #1e5eff', background: 'rgba(255,255,255,0.95)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <AlertCircle size={15} style={{ color: '#1e5eff', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#334155' }}>硬性防守与静默原则</span>
                <p style={{ fontSize: '10.5px', color: '#64748b', lineHeight: '1.5', marginTop: '4px' }}>
                  未触碰极高盈亏比的 Brooks 裸K多头契机时，始终保持默认静默。单股仓位不可逾越30%红线，坚决对回撤进行严格的保护。
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Watchlist Grid & Workspace Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Candidate Stock Watchlist Grid */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} style={{ color: '#1e5eff' }} />
              标的跟踪精选与策略诊断
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {mockStocks.map((stock) => (
                <PlanStockCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  name={stock.name}
                  sector={stock.sector}
                  price={stock.price}
                  changePct={stock.changePct}
                  vcpStatus={stock.vcpStatus}
                  vcpContractions={stock.vcpContractions}
                  brooksStatus={stock.brooksStatus}
                  brooksReason={stock.brooksReason}
                  isSelected={selectedStockSymbol === stock.symbol}
                  onClick={() => setSelectedStockSymbol(stock.symbol)}
                />
              ))}
            </div>
          </div>

          {/* Interactive Workspace Editor */}
          <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
            
            {/* Workspace Header & Action tabs */}
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid rgba(226,232,240,0.8)', 
                paddingBottom: '12px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} style={{ color: '#64748b' }} />
                <h3 style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>可执行一页纸工作区</h3>
              </div>

              {/* Action Buttons & Tab Switchers */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                
                {/* Tab Switcher */}
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', marginRight: '6px' }}>
                  <button
                    onClick={() => setActiveEditorTab('preview')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: activeEditorTab === 'preview' ? '#ffffff' : 'transparent',
                      color: activeEditorTab === 'preview' ? '#1e5eff' : '#64748b',
                      boxShadow: activeEditorTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Eye size={11} />
                    格式预览
                  </button>
                  <button
                    onClick={() => setActiveEditorTab('edit')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: activeEditorTab === 'edit' ? '#ffffff' : 'transparent',
                      color: activeEditorTab === 'edit' ? '#1e5eff' : '#64748b',
                      boxShadow: activeEditorTab === 'edit' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Edit3 size={11} />
                    源码编辑
                  </button>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveEdits}
                  disabled={isSaving || !onePager}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(226,232,240,0.8)',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    opacity: (!onePager || isSaving) ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if(onePager && !isSaving) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { if(onePager && !isSaving) e.currentTarget.style.background = '#ffffff'; }}
                >
                  <Save size={12} />
                  {isSaving ? '保存中...' : '保存修改'}
                </button>

                {/* Push Feishu button */}
                <button
                  onClick={handlePushFeishu}
                  disabled={isPushing || !onePager}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #1e5eff 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(30,94,255,0.15)',
                    opacity: (!onePager || isPushing) ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { if(onePager && !isPushing) e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { if(onePager && !isPushing) e.currentTarget.style.opacity = '1'; }}
                >
                  <Send size={12} />
                  {isPushing ? '推送中...' : '推送至飞书'}
                </button>

              </div>
            </div>

            {/* Content Container */}
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {onePager ? (
                activeEditorTab === 'preview' ? (
                  /* Format Preview */
                  <div 
                    style={{ 
                      flexGrow: 1,
                      padding: '10px 6px',
                      background: 'transparent',
                      maxHeight: '420px',
                      overflowY: 'auto'
                    }}
                  >
                    {renderMarkdown(onePager)}
                  </div>
                ) : (
                  /* Code/Markdown Textarea Editor */
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <textarea
                      value={onePager}
                      onChange={(e) => setOnePager(e.target.value)}
                      placeholder="编辑您的盘前计划一页纸..."
                      style={{
                        width: '100%',
                        flexGrow: 1,
                        minHeight: '280px',
                        maxHeight: '420px',
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(226,232,240,1)',
                        background: '#f8fafc',
                        color: '#0f172a',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        lineHeight: '1.6',
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#1e5eff'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(226,232,240,1)'}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '10px', color: '#94a3b8' }}>
                      <span>支持完整原始 Markdown 格式，保存将直接更新 SQLite 数据库。</span>
                      <span>字符数: {onePager.length}</span>
                    </div>
                  </div>
                )
              ) : (
                /* Empty Placeholder State */
                <div style={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '280px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  background: 'rgba(248,250,252,0.5)',
                  borderRadius: '10px',
                  border: '1px dashed rgba(226,232,240,1)',
                  margin: '10px 0'
                }}>
                  <Sparkles size={36} style={{ color: '#cbd5e1', marginBottom: '14px' }} />
                  <span style={{ fontWeight: '500' }}>今日盘前操作计划一页纸尚未生成</span>
                  <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                    请点击左侧的【一键生成今日计划一页纸】激活智能体，自动生成一页纸计划。
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
