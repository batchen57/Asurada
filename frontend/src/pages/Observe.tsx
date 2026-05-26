import React, { useState, useEffect } from 'react';
import { 
  Eye, ShieldAlert, Sparkles, BellRing, Info, ShieldCheck, 
  Terminal, ArrowRight, Play, History, RotateCcw, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Task } from '../types';

interface ObserveProps {
  tasks: Task[];
  onTriggerOrchestrator: (phase: string, simParams?: any) => Promise<any>;
  onRefreshData: () => void;
}

export const Observe: React.FC<ObserveProps> = ({ tasks, onTriggerOrchestrator, onRefreshData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [patrolLogs, setPatrolLogs] = useState<string[]>([
    `[系统初始化] 盘中盯盘模块就绪。默认处于静默监控状态。`,
    `[降噪模块] 合并窗口: 15 分钟 | 单日提醒上限: 5 条。`,
    `[调度状态] A股开盘/尾盘高频巡检，日内 15 分钟低频巡检已激活。`
  ]);
  
  // Simulation params
  const [simTime, setSimTime] = useState('09:35');
  const [simSymbol, setSimSymbol] = useState('none');
  const [simPrice, setSimPrice] = useState<number>(195.80);
  
  // Results from backend
  const [lastPatrolResult, setLastPatrolResult] = useState<any>(null);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [activeSuppressed, setActiveSuppressed] = useState<any[]>([]);
  const [savedSnapshots, setSavedSnapshots] = useState<string[]>([]);
  const [quotaStatus, setQuotaStatus] = useState<any>({
    requests_made: 142,
    quota_limit: 2000,
    quota_remaining: 1858,
    rate_limit_per_min: 60,
    current_rate: 18,
    mcp_enabled: true
  });
  
  // Feishu Preview Outbox Data
  const [pushedCards, setPushedCards] = useState<any[]>([]);
  
  // Replay Mode
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayTime, setReplayTime] = useState<string>('');
  
  const observeTask = tasks.find(t => t.phase === 'Observe');
  const isCompleted = observeTask?.status === '已完成';

  // Fetch initial snapshots list or simulated state
  useEffect(() => {
    // Perform a silent/regular patrol on mount to fetch status and sync backend
    handleRunPatrol(true);
  }, []);

  const handleSimSymbolChange = (symbol: string) => {
    setSimSymbol(symbol);
    if (symbol === '300750.SZ') {
      setSimPrice(196.50); // Set breakout price above 195.0
    } else if (symbol === '000002.SZ') {
      setSimPrice(8.10);  // Set breakdown price below 8.20
    } else if (symbol === '300760.SZ') {
      setSimPrice(284.50); // Set support test price below 285.0
    } else {
      setSimPrice(195.80);
    }
  };

  const handleRunPatrol = async (silent: boolean = false, overrideTime?: string, overrideSymbol?: string, overridePrice?: number) => {
    if (!silent) setIsLoading(true);
    
    const timeToUse = overrideTime || (simTime !== 'realtime' ? simTime : undefined);
    const symToUse = overrideSymbol || (simSymbol !== 'none' ? simSymbol : undefined);
    const priceToUse = overridePrice !== undefined ? overridePrice : (simSymbol !== 'none' ? simPrice : undefined);

    const payload = {
      sim_time: timeToUse,
      sim_symbol: symToUse,
      sim_price: priceToUse
    };

    const targetTimeLog = timeToUse || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    if (!silent) {
      setPatrolLogs(prev => [
        `[${targetTimeLog}] ------------------------------------------`,
        `[${targetTimeLog}] 🚀 启动手动主动式盘中低频双核心巡检...`,
        `[${targetTimeLog}] [输入配置] 巡检标的: 账户持仓股 & 观察池`,
        `[${targetTimeLog}] [DATAHUB] 拉取新浪财经实时快照 MCP (globalStockQuoteRealtime)...`,
        ...prev
      ]);
    }

    try {
      const res = await onTriggerOrchestrator('Observe', payload);
      if (res && res.success) {
        const data = res.result;
        setLastPatrolResult(data);
        setActiveAlerts(data.alerts || []);
        setActiveSuppressed(data.suppressed || []);
        setSavedSnapshots(data.snapshots_list || []);
        if (data.quota) setQuotaStatus(data.quota);
        setIsReplaying(false);

        // Fetch logs formatting
        const newLogs: string[] = [];
        newLogs.push(`[${targetTimeLog}] [SCHEDULER] 巡检周期判定: ${data.patrol_reason}`);
        newLogs.push(`[${targetTimeLog}] [DATAHUB] 新浪报价 API 调用成功。当前配额余量: ${data.quota.quota_remaining}/${data.quota.quota_limit}`);
        
        // Strategy eval
        newLogs.push(`[${targetTimeLog}] [RULES] 双核心智能体(VCPAgent & BrooksAgent)形态研判完成。`);

        if (data.alerts.length > 0) {
          data.alerts.forEach((alert: string) => {
            newLogs.push(`[${targetTimeLog}] 🔔 [ALERT] 触发报警条件: ${alert.substring(6, 40)}...`);
            
            // Add to simulated pushed cards in frontend
            const parts = alert.split('\n');
            const trigTitle = parts[0] || '盘中实时警报';
            setPushedCards(prev => [
              {
                timestamp: targetTimeLog,
                title: trigTitle.replace('🚨 ', '').split('：')[0],
                symbol: symToUse || '000002.SZ',
                name: trigTitle.split('】：')[1]?.split(' (')[0] || '万科A',
                reason: parts[1]?.replace('  - **触发依据**: ', '') || '触发预警价格阈值',
                suggestion: parts[2]?.replace('  - **建议动作**: ', '') || '请遵循纪律防守。',
                price: priceToUse || 8.10
              },
              ...prev
            ]);
          });
          newLogs.push(`[${targetTimeLog}] [FEISHU] 已向飞书群机器人分发卡片简讯！`);
        }
        
        if (data.suppressed.length > 0) {
          data.suppressed.forEach((sup: any) => {
            newLogs.push(`[${targetTimeLog}] 🛡️ [降噪拦截] 标的 ${sup.name} (${sup.symbol}) 触发逻辑已拦截。拦截原因: ${sup.suppression_reason}`);
          });
        }

        if (data.alerts.length === 0 && data.suppressed.length === 0) {
          newLogs.push(`[${targetTimeLog}] [SILENT] 各项技术参数处于常规阈值内。系统维持「默认静默」，无消息推送。`);
        }

        if (!silent) {
          setPatrolLogs(prev => [...newLogs.reverse(), ...prev]);
        }
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
      if (!silent) {
        setPatrolLogs(prev => [
          `[${targetTimeLog}] ❌ [ERROR] 巡检流程执行失败。请检查后端连接状态。`,
          ...prev
        ]);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Run automated time-lapse demo sequence
  const handleAutoTimeLapseDemo = async () => {
    setIsLoading(true);
    setPatrolLogs(prev => [
      `[${new Date().toLocaleTimeString()}] 🕒 [DEMO] 开始自动化时序多场景联动模拟演练...`,
      ...prev
    ]);

    // Step 1: 09:35 AM Open segment (High frequency, Silent state)
    setSimTime('09:35');
    setSimSymbol('none');
    await handleRunPatrol(false, '09:35', 'none');
    
    // Timeout to simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 2: 10:32 AM Breakout segment (Trigger VCP breakout for CATL)
    setSimTime('10:32');
    setSimSymbol('300750.SZ');
    setSimPrice(196.80);
    await handleRunPatrol(false, '10:32', '300750.SZ', 196.80);

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 3: 10:45 AM Duplicate trigger segment (Suppressed by 15-minute merge window)
    setSimTime('10:45');
    setSimSymbol('300750.SZ');
    setSimPrice(197.20);
    await handleRunPatrol(false, '10:45', '300750.SZ', 197.20);

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Step 4: 13:15 PM Regular hour segment (Trigger Brooks breakdown for Vanke)
    setSimTime('13:15');
    setSimSymbol('000002.SZ');
    setSimPrice(8.10);
    await handleRunPatrol(false, '13:15', '000002.SZ', 8.10);

    setIsLoading(false);
  };

  // Playback/load local saved snapshot
  const handleReplaySnapshot = async (timeName: string) => {
    setIsReplaying(true);
    setReplayTime(timeName);
    
    // Parse timeName e.g. "0935" to "09:35"
    const displayTime = timeName.substring(0, 2) + ":" + timeName.substring(2, 4);

    setPatrolLogs(prev => [
      `[${new Date().toLocaleTimeString()}] 🔄 [REPLAY] 正在载入本地盘中数据快照: snapshot_${timeName}.json`,
      `[${new Date().toLocaleTimeString()}] [REPLAY] 快照时间戳: ${displayTime} | 系统成功回滚至该历史切片！`,
      ...prev
    ]);

    // Perform a simulation fetch mimicking the snapshot's state
    let sym = 'none';
    let pr = 195.80;
    if (timeName === '1032') {
      sym = '300750.SZ';
      pr = 196.80;
    } else if (timeName === '1315') {
      sym = '000002.SZ';
      pr = 8.10;
    } else if (timeName === '1045') {
      sym = '300750.SZ';
      pr = 197.20;
    }
    
    setSimTime(displayTime);
    setSimSymbol(sym);
    setSimPrice(pr);
    await handleRunPatrol(true, displayTime, sym, pr);
  };

  // Recharts 1-minute simulated K-line data for CATL
  const generateChartData = () => {
    const data = [];
    let price = 184.0;
    
    for (let i = 0; i <= 60; i++) {
      const time = new Date(2026, 4, 22, 9, 30 + i);
      const timeStr = time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      
      if (i > 35 && i < 45) {
        price += 1.25; // breakout!
      } else {
        price += (Math.random() - 0.47) * 0.4;
      }
      
      data.push({
        time: timeStr,
        price: parseFloat(price.toFixed(2)),
      });
    }
    return data;
  };

  const chartData = generateChartData();

  // Simulated live stock threshold ranges for visual gauges
  const vankePrice = lastPatrolResult?.quotes?.['000002.SZ']?.price || 8.12;
  const catlPrice = lastPatrolResult?.quotes?.['300750.SZ']?.price || 195.80;
  const mindrayPrice = lastPatrolResult?.quotes?.['300760.SZ']?.price || 286.66;
  const sseIndex = lastPatrolResult?.quotes?.['600519.SH']?.price || 1688.50; // Use Moutai as indicator

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Header Information Panel */}
      <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px' }}>
              <Eye size={22} style={{ color: '#10b981' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                盘中盯盘控制舱 <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#e2e8f0', color: '#475569' }}>Observe 02</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                系统贯彻<strong>「默认静默，低频巡检」</strong>原则。只监控持仓股与观察池，防止因盘中无谓波动导致的过度决策。
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <span className="badge badge-green" style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700', borderRadius: '8px', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)' }}>
            {isReplaying ? `⏱️ 正在回放快照: snapshot_${replayTime}.json` : (isCompleted ? '今日盘中盯盘完毕' : '🔄 自动巡检排班中')}
          </span>
        </div>
      </div>

      {/* Main Grid: Left Controls & Charts, Right Sidebar Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>
        
        {/* Left Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 2. Interactive Simulator Dashboard */}
          <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: '#1e5eff' }} />
              全时段多维场景沙盘模拟器 (Intraday Scenario Sandbox)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Select simulated time */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>📅 选择模拟时段 (Scheduler State)</label>
                <select
                  value={simTime}
                  onChange={(e) => setSimTime(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                >
                  <option value="realtime">⌚ 真实实时时间 (Real-time)</option>
                  <option value="09:35">🌅 09:35 AM (开盘加密 - 5分钟频次)</option>
                  <option value="10:32">☀️ 10:32 AM (盘中常规 - 15分钟频次)</option>
                  <option value="10:45">☀️ 10:45 AM (降噪频发 - 15分钟频次)</option>
                  <option value="13:15">🌇 13:15 PM (日内平稳 - 15分钟频次)</option>
                  <option value="14:50">🌃 14:50 PM (收盘加密 - 5分钟频次)</option>
                </select>
              </div>

              {/* Select simulated stock triggers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>🎯 设定盘中异动事件 (Rule Trigger)</label>
                <select
                  value={simSymbol}
                  onChange={(e) => handleSimSymbolChange(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                >
                  <option value="none">💤 默认静默无异动 (Default Silent)</option>
                  <option value="300750.SZ">🟢 宁德时代 (300750) 向上放量突破 195元</option>
                  <option value="000002.SZ">🚨 万科A (000002) 向下放量跌破 8.20元</option>
                  <option value="300760.SZ">🔵 迈瑞医疗 (300760) 回调测试支撑 285元</option>
                </select>
              </div>

              {/* simulated price override input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>💵 模拟现价微调 (Price Override)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={simPrice}
                    onChange={(e) => setSimPrice(parseFloat(e.target.value))}
                    disabled={simSymbol === 'none'}
                    style={{
                      flexGrow: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      outline: 'none',
                      background: simSymbol === 'none' ? '#f1f5f9' : '#ffffff'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Simulated Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleRunPatrol(false)}
                disabled={isLoading}
                style={{
                  flexGrow: 1,
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Play size={14} />
                {isLoading ? '正在对多维数据进行低频扫描...' : '执行单步盘中智能巡检'}
              </button>

              <button
                onClick={handleAutoTimeLapseDemo}
                disabled={isLoading}
                style={{
                  background: '#1e5eff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(30, 94, 255, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <RotateCcw size={14} />
                自动时序模拟演练 (Auto Demo)
              </button>
            </div>
          </div>

          {/* 3. Double-Core Rules Monitor Panel */}
          <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} style={{ color: '#10b981' }} />
              持仓股与观察池实时规则状态监视器 (Active Rules Monitor)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              {/* CATL Breakout Rule */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: 'rgba(248, 250, 252, 0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>宁德时代 (300750.SZ)</span>
                  <span className="badge badge-green" style={{ fontSize: '10px' }}>VCP 观察池</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                  前高阻力阈值: <span style={{ fontWeight: '700', color: '#0f172a' }}>195.00 元</span>
                </div>
                {/* Progress bar to visual proximity */}
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', position: 'relative', marginBottom: '10px' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    width: `${Math.min(100, (catlPrice / 195) * 100)}%`, 
                    background: catlPrice >= 195 ? '#10b981' : '#1e5eff',
                    borderRadius: '4px' 
                  }} />
                  <div style={{ position: 'absolute', left: '195px', top: '-2px', width: '2px', height: '12px', background: '#ef4444' }} title="阈值线" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                  <span>现价: <strong style={{ color: catlPrice >= 195 ? '#10b981' : '#0f172a' }}>{catlPrice.toFixed(2)}元</strong></span>
                  <span>{catlPrice >= 195 ? '⚡ 突破买入触发！' : '距离突破还差 ' + (195 - catlPrice > 0 ? (195 - catlPrice).toFixed(2) : 0) + '元'}</span>
                </div>
              </div>

              {/* Vanke Breakdown Rule */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', background: 'rgba(248, 250, 252, 0.5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155' }}>万科A (000002.SZ)</span>
                  <span className="badge badge-orange" style={{ fontSize: '10px' }}>账户重仓持仓股</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                  风控均线防守值: <span style={{ fontWeight: '700', color: '#0f172a' }}>8.20 元</span>
                </div>
                {/* Progress bar to visual proximity */}
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', position: 'relative', marginBottom: '10px' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: 0, 
                    top: 0, 
                    height: '100%', 
                    width: `${Math.max(10, Math.min(100, (vankePrice / 8.2) * 100))}%`, 
                    background: vankePrice < 8.2 ? '#ef4444' : '#10b981',
                    borderRadius: '4px' 
                  }} />
                  <div style={{ position: 'absolute', left: '195px', top: '-2px', width: '2px', height: '12px', background: '#ef4444' }} title="阈值线" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                  <span>现价: <strong style={{ color: vankePrice < 8.2 ? '#ef4444' : '#0f172a' }}>{vankePrice.toFixed(2)}元</strong></span>
                  <span>{vankePrice < 8.2 ? '🚨 跌破防守，执行止损！' : '均线支撑安全'}</span>
                </div>
              </div>

            </div>
          </div>

          {/* 4. Real-time Chart (Recharts) */}
          <div className="glass-panel" style={{ padding: '20px', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>宁德时代 (300750.SZ) 模拟分时K线形态</span>
                <span style={{ fontSize: '10px', color: '#10b981', marginLeft: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)' }}>突破买入阻力测试</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: catlPrice >= 195 ? '#ef4444' : '#10b981', fontFamily: "'JetBrains Mono', monospace" }}>{catlPrice.toFixed(2)} 元</span>
              </div>
            </div>

            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e5eff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#1e5eff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.5)" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="price" stroke="#1e5eff" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Side Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 5. Noise Reduction Status Dashboard */}
          <div className="glass-panel" style={{ padding: '20px', background: '#0b1329', color: '#cbd5e1' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} style={{ color: '#ef4444' }} />
              硬防守降噪管理控制台 (Noise Filter Status)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Daily alert Cap status */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>单日推送上限容量 (Daily Limit Cap)</span>
                  <strong style={{ color: '#ffffff' }}>{lastPatrolResult?.alert_count_today || 0} / {lastPatrolResult?.max_daily_alerts || 5} 条</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${((lastPatrolResult?.alert_count_today || 0) / (lastPatrolResult?.max_daily_alerts || 5)) * 100}%`, 
                    background: '#10b981', 
                    borderRadius: '3px' 
                  }} />
                </div>
              </div>

              {/* 15m merge window */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#ffffff', display: 'block' }}>15分钟警报合并窗口</span>
                  <span style={{ fontSize: '9px', color: '#8e9bb4' }}>合并高频微小震荡，避免情绪过度交易</span>
                </div>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                  合并过滤开启
                </span>
              </div>

              {/* Quota limit rate check */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>新浪财经 MCP API 配额余量</span>
                  <strong style={{ color: '#ffffff' }}>{quotaStatus.requests_made} / {quotaStatus.quota_limit} 频次</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${(quotaStatus.requests_made / quotaStatus.quota_limit) * 100}%`, 
                    background: '#1e5eff', 
                    borderRadius: '3px' 
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#8e9bb4', marginTop: '4px' }}>
                  <span>分钟速率限制: 60/分钟</span>
                  <span>当前速率: {quotaStatus.current_rate}/分钟</span>
                </div>
              </div>

            </div>
          </div>

          {/* 6. Glowing Terminal Logs Console */}
          <div className="glass-panel" style={{ padding: '16px', background: '#070b19', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: '230px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
              <Terminal size={14} style={{ color: '#10b981' }} />
              实时盯盘事件巡检日志 (Live Terminal Logs)
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              overflowY: 'auto',
              maxHeight: '190px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#8e9bb4',
              lineHeight: '1.4'
            }}>
              {patrolLogs.map((log, idx) => (
                <p key={idx} style={{ 
                  margin: 0, 
                  color: log.includes('[ALERT]') ? '#ef4444' : (log.includes('[REPLAY]') ? '#1e5eff' : (log.includes('[降噪拦截]') ? '#f59e0b' : (log.includes('🚀') ? '#ffffff' : '#8e9bb4')))
                }}>
                  {log}
                </p>
              ))}
            </div>
          </div>

          {/* 7. Feishu Rich Notification Outbox Preview Card */}
          {pushedCards.length > 0 && (
            <div className="glass-panel" style={{ padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BellRing size={13} style={{ color: '#f59e0b' }} />
                飞书推送简讯卡片预览 (Feishu Outbox Preview)
              </h3>
              
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                fontSize: '11px'
              }}>
                {/* Header card */}
                <div style={{ 
                  background: pushedCards[0].title.includes('跌破') ? '#ef4444' : '#10b981', 
                  color: 'white', 
                  padding: '8px 12px', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🤖 Asurada | {pushedCards[0].title}
                </div>
                {/* Body card */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>
                    标的：{pushedCards[0].name} ({pushedCards[0].symbol})
                  </div>
                  <div>
                    <strong>触发依据:</strong> {pushedCards[0].reason} (时间: {pushedCards[0].timestamp})
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.8)', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #1e5eff' }}>
                    <strong>建议动作:</strong> {pushedCards[0].suggestion}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                    🔔 遵循「默认静默，减少信息噪音」原则。此消息仅对持仓/观察池中低频提示。
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. Local Playback Snapshots Table */}
          <div className="glass-panel" style={{ padding: '16px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={13} style={{ color: '#1e5eff' }} />
              本地盘中历史快照库 (Playable Snapshots)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedSnapshots.length > 0 ? (
                savedSnapshots.map((snap, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px'
                  }}>
                    <div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: '700' }}>snapshot_{snap}.json</span>
                      <span style={{ color: '#64748b', marginLeft: '8px' }}>
                        {snap === '0935' ? '晨间巡检' : (snap === '1032' ? '宁德突破' : (snap === '1315' ? '万科破位' : '日内巡检'))}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleReplaySnapshot(snap)}
                      style={{
                        background: '#1e5eff',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Play size={8} />
                      快照回放
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                  暂无捕获的本地快照。请执行盘中巡检生成！
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
