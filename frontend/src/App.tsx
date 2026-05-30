import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';

// Subpages
import { Workbench } from './pages/Workbench';
import { Plan } from './pages/Plan';
import { Observe } from './pages/Observe';
import { Review } from './pages/Review';
import { Discovery } from './pages/Discovery';
import { TodayMarket } from './pages/TodayMarket';
import { FocusWatchlist } from './pages/FocusWatchlist';
import { StockDetail } from './pages/StockDetail';
import { DataHubCenter } from './pages/DataHubCenter';
import { StrategyCenter } from './pages/StrategyCenter';
import { AgentCenter } from './pages/AgentCenter';
import { Signals } from './pages/Signals';
import { SettingsPage } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';
import { SectorConfig } from './pages/SectorConfig';
import { CockpitList } from './pages/CockpitList';
import { CockpitDashboard } from './pages/CockpitDashboard';
import { ModelConfig } from './components/ModelConfig';


import { WorkbenchData, Configuration } from './types';
import { Bot, X, Sparkles, Send } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('asurada_token'));
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('asurada_token'));
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('asurada_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to parse asurada_user from localStorage:', e);
      return null;
    }
  });

  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoginLoading, setIsLoginLoading] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });

      if (response.ok) {
        const json = await response.json();
        localStorage.setItem('asurada_token', json.access_token);
        localStorage.setItem('asurada_user', JSON.stringify(json.user));
        setToken(json.access_token);
        setCurrentUser(json.user);
        setIsAuthenticated(true);
      } else {
        const errJson = await response.json();
        setLoginError(errJson.detail || '登录失败，请检查用户名或密码。');
      }
    } catch (err) {
      console.warn('Backend offline or error, using fallback mock login.', err);
      // High-fidelity fallback login matching Mock rules in AGENTS.md
      if (loginUsername === 'admin' && loginPassword === 'admin123') {
        const mockUser = { id: 1, username: 'admin', role: 'admin', is_active: true, created_at: '2026-05-28 12:00:00' };
        localStorage.setItem('asurada_token', 'mock_token_jwt');
        localStorage.setItem('asurada_user', JSON.stringify(mockUser));
        setToken('mock_token_jwt');
        setCurrentUser(mockUser);
        setIsAuthenticated(true);
      } else {
        setLoginError('用户名或密码错误。离线演示账号/密码为 admin / admin123');
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('asurada_token');
    localStorage.removeItem('asurada_user');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const [activeTab, setActiveTab] = useState<string>('workbench');
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string; sector?: string } | null>(null);
  const [selectedCockpitSector, setSelectedCockpitSector] = useState<{ id: number; name: string } | null>(null);

  const handleNavigate = (tab: string, params?: any) => {
    if (tab === 'stock_detail' && params) {
      setSelectedStock(params);
    }
    if (tab === 'cockpit_dashboard' && params) {
      setSelectedCockpitSector(params);
    }
    setActiveTab(tab);
  };
  const [data, setData] = useState<WorkbenchData | null>(null);
  const [configs, setConfigs] = useState<Configuration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: '你好！我是 Asurada 主调度 Agent 助手。我可以为您执行盘前计划扫描、提供盯盘总结以及进行盘后归因复盘。您想对哪个模块进行分析？' }
  ]);
  const [aiInput, setAiInput] = useState('');

  // Fetch all dashboard data from backend
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/workbench`);
      if (response.ok) {
        const json = await response.json();
        setData(json);
      } else {
        console.error('Backend returned non-ok response. Using mock data.', response.status);
        setData(getMockDataFallback());
      }
    } catch (err) {
      console.error('Failed to connect to backend server. Using mock data.', err);
      // Mock data fallback if backend is offline to guarantee out-of-the-box operation
      setData(getMockDataFallback());
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch configs
  const fetchConfigs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config`);
      if (response.ok) {
        const json = await response.json();
        setConfigs(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchConfigs();
  }, []);

  const handleRefresh = () => {
    fetchData();
  };

  // Toggle checklist tasks
  const handleToggleTask = async (taskId: number, currentStatus: string) => {
    const newStatus = currentStatus === '已完成' ? '去完成' : '已完成';
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      // Local fallback edit
      if (data) {
        const updatedTasks = data.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setData({ ...data, tasks: updatedTasks });
      }
    }
  };

  // Trigger Backend Orchestrator phases
  const handleTriggerOrchestrator = async (phase: string, simParams?: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orchestrator/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, ...simParams })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: err };
    }
  };

  // Update Config
  const handleUpdateConfig = async (key: string, value: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      if (response.ok) {
        fetchConfigs();
        return await response.json();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset tasks
  const handleResetTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/reset`, { method: 'POST' });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send AI assistant message
  const handleSendAiMessage = (customText?: string) => {
    const query = customText || aiInput;
    if (!query.trim()) return;

    setAiMessages(prev => [...prev, { sender: 'user', text: query }]);
    if (!customText) setAiInput('');

    // Simulated LLM Orchestrator Agent responses
    setTimeout(() => {
      let reply = '收到，我正在调用后台 DataHub 以及策略模型对您的提问进行研判...';
      
      if (query.includes('盘前') || query.includes('扫描') || query.includes('计划')) {
        reply = `🤖 **主调度 Agent 指示**：根据最新 Tushare 缓存，**宁德时代 (300750.SZ)** 的 VCP 筹码收缩完成 (12% -> 4% -> 2%)。今日已触发 **High 2 放量买入突破点**，这是极高盈亏比的操作推荐，已自动加入您的待办清单中。`;
      } else if (query.includes('持仓') || query.includes('万科') || query.includes('风险')) {
        reply = `🚨 **风控 Agent 警告**：持仓股 **万科A (000002.SZ)** 今日跌破关键 MA20 均线，破位格局显现。基于「默认静默，严格防守」纪律，建议您明日盘中反抽时，清仓此标的以避免深幅回撤。`;
      } else if (query.includes('支撑') || query.includes('迈瑞')) {
        reply = `🎯 **Brooks 裸K Agent 分析**：**迈瑞医疗 (300760.SZ)** 在关键 MA150 日线支撑位 (285元附近) 收出标准的看涨 Pinbar (长下影锤子线)。这表明多头在此具有很强的护盘意愿，可作为底仓持股观察。`;
      } else {
        reply = `📊 **Asurada 诊断**：大盘全天窄幅震荡成交 8,542 亿，处于弱势盘整期。当前系统健康度正常，飞书机器人保持静默状态。建议严格遵循「一页纸操作路线」，控制总仓位在 50% 以下。`;
      }

      setAiMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 1000);
  };

  // Render correct content page
  const renderContent = () => {
    switch (activeTab) {
      case 'workbench':
        return (
          <Workbench 
            data={data} 
            onRefresh={handleRefresh} 
            onNavigate={handleNavigate}
            onToggleTask={handleToggleTask}
            isLoading={isLoading}
          />
        );
      case 'plan':
        return (
          <Plan 
            tasks={data?.tasks || []} 
            onTriggerOrchestrator={handleTriggerOrchestrator} 
            onRefreshData={fetchData}
          />
        );
      case 'observe':
        return (
          <Observe 
            tasks={data?.tasks || []} 
            onTriggerOrchestrator={handleTriggerOrchestrator} 
            onRefreshData={fetchData}
          />
        );
      case 'review':
        return (
          <Review 
            tasks={data?.tasks || []} 
            onTriggerOrchestrator={handleTriggerOrchestrator} 
            onRefreshData={fetchData}
          />
        );
      case 'discovery':
        return <Discovery />;
      case 'today_market':
        return <TodayMarket onNavigate={handleNavigate} />;
      case 'focus_watchlist':
        return <FocusWatchlist onNavigate={handleNavigate} />;
      case 'stock_detail':
        return <StockDetail stock={selectedStock} onNavigate={handleNavigate} />;
      case 'datahub':
        return <DataHubCenter />;
      case 'strategy':
        return (
          <StrategyCenter 
            configs={configs} 
            onUpdateConfig={handleUpdateConfig} 
          />
        );
      case 'agents':
        return <AgentCenter />;
      case 'signals':
        return <Signals signals={data?.signals || []} />;
      case 'audit_logs':
        return <AuditLogs defaultTab="logs" />;
      case 'model_logs':
        return <AuditLogs defaultTab="model_logs" />;
      case 'user_manage':
        return <AuditLogs defaultTab="users" />;
      case 'settings':
        return (
          <SettingsPage 
            configs={configs} 
            onUpdateConfig={handleUpdateConfig} 
            onResetTasks={handleResetTasks}
          />
        );
      case 'sector_config':
        return <SectorConfig />;
      case 'model_config':
        return <ModelConfig />;
      case 'cockpit_list':
        return <CockpitList onNavigate={handleNavigate} />;
      case 'cockpit_dashboard':
        return <CockpitDashboard sector={selectedCockpitSector} onNavigate={handleNavigate} />;
      default:
        return <div style={{ padding: '40px', color: '#64748b' }}>模块正在规划开发中...</div>;
    }
  };

  // Fallback mock data if server not online
  const getMockDataFallback = (): WorkbenchData => {
    const now = new Date();
    const timeStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const baseSse = data?.overview?.indices?.[0]?.price || 4068.57;
    const baseSzse = data?.overview?.indices?.[1]?.price || 15575.13;
    const baseGem = data?.overview?.indices?.[2]?.price || 4037.95;
    const baseTurnover = data?.overview?.turnover_billion || 33190.32;

    const noise = (Math.random() - 0.5) * 0.001; // max 0.05% fluctuation
    
    const ssePrice = baseSse * (1 + noise);
    const szsePrice = baseSzse * (1 + noise * 1.2);
    const gemPrice = baseGem * (1 + noise * 1.5);
    const turnover = baseTurnover * (1 + (Math.random() - 0.5) * 0.01);

    return {
      overview: {
        indices: [
          { name: '上证指数', code: '000001.SH', price: Number(ssePrice.toFixed(2)), change_pct: -0.73 + Number((noise * 100).toFixed(2)) },
          { name: '深证成指', code: '399001.SZ', price: Number(szsePrice.toFixed(2)), change_pct: -1.81 + Number((noise * 120).toFixed(2)) },
          { name: '创业板指', code: '399006.SZ', price: Number(gemPrice.toFixed(2)), change_pct: -2.11 + Number((noise * 150).toFixed(2)) }
        ],
        turnover_billion: Number(turnover.toFixed(1)),
        turnover_change_pct: 6.32,
        data_cutoff: timeStr
      },
      positions: data?.positions || [
        { id: 1, symbol: '600519.SH', name: '贵州茅台', volume: 100, available_volume: 100, cost_price: 1620.00, current_price: 1688.50 },
        { id: 2, symbol: '300750.SZ', name: '宁德时代', volume: 200, available_volume: 200, cost_price: 185.00, current_price: 195.80 },
        { id: 3, symbol: '300760.SZ', name: '迈瑞医疗', volume: 100, available_volume: 100, cost_price: 275.00, current_price: 286.66 }
      ],
      tasks: data?.tasks || [
        { id: 1, phase: 'Plan', task_name: '盘前计划：生成今日计划清单', status: '去完成' },
        { id: 2, phase: 'Observe', task_name: '盘中盯盘：低频巡检与阈值监控', status: '进行中' },
        { id: 3, phase: 'Review', task_name: '盘后复盘：生成复盘报告', status: '待开始' },
        { id: 4, phase: 'Iterate', task_name: '候选池：更新与初筛', status: '去执行' }
      ],
      signals: data?.signals || [
        { id: 1, timestamp: '05-20 10:32', symbol: '300750.SZ', name: '宁德时代', direction: '买入', strategy_type: 'VCP', trigger_reason: '突破前高，量能放大', status: '已触发' },
        { id: 2, timestamp: '05-20 09:55', symbol: '300760.SZ', name: '迈瑞医疗', direction: '关注', strategy_type: 'Brooks', trigger_reason: '价格接近支撑位', status: '观察中' },
        { id: 3, timestamp: '05-19 14:21', symbol: '000002.SZ', name: '万科A', direction: '卖出', strategy_type: 'Brooks', trigger_reason: '跌破关键均线', status: '已完成' }
      ],
      system_status: data?.system_status || [
        { id: 1, service_name: '数据服务', status: '正常', detail: '延迟 2.3s' },
        { id: 2, service_name: '策略引擎', status: '正常', detail: '运行中' },
        { id: 3, service_name: '智能体服务', status: '正常', detail: '3/3 在线' },
        { id: 4, service_name: '信号与告警', status: '正常', detail: '未触发' }
      ]
    };
  };

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(circle at center, #0f1a3a 0%, #070d1e 100%)',
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
        color: '#cbd5e1',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(30, 94, 255, 0.15) 0%, rgba(30, 94, 255, 0) 70%)',
          top: '10%',
          left: '15%',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0) 70%)',
          bottom: '10%',
          right: '15%',
          pointerEvents: 'none'
        }} />

        <div style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
          position: 'relative'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '22px',
              boxShadow: '0 0 20px rgba(30, 94, 255, 0.4)'
            }}>
              A
            </div>
            <span style={{ 
              color: 'white', 
              fontSize: '26px', 
              fontWeight: '800', 
              letterSpacing: '1px'
            }}>
              Asurada
            </span>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', textAlign: 'center', marginBottom: '8px' }}>
            量化交易辅助系统登入
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', marginBottom: '28px' }}>
            专注 A 股多智能体低频稳健决策体系
          </p>

          {loginError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              marginBottom: '20px',
              lineHeight: '1.5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>
                管理员用户名 (USERNAME)
              </label>
              <input
                type="text"
                placeholder="请输入用户名"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #1e5eff';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.boxShadow = '0 0 10px rgba(30, 94, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.5px' }}>
                访问凭证密码 (PASSWORD)
              </label>
              <input
                type="password"
                placeholder="请输入密码"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'white',
                  outline: 'none',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid #1e5eff';
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.boxShadow = '0 0 10px rgba(30, 94, 255, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoginLoading}
              style={{
                background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(30, 94, 255, 0.3)',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 94, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(30, 94, 255, 0.3)';
              }}
            >
              {isLoginLoading ? '正在验证凭证...' : '安全登入'}
            </button>
          </form>

          {/* Hint Footer */}
          <div style={{
            marginTop: '32px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center',
            fontSize: '11px',
            color: '#64748b'
          }}>
            <span>首次访问使用系统预置管理员账号登入</span>
            <div style={{ marginTop: '6px', color: '#1e5eff', fontFamily: 'monospace' }}>
              admin / admin123
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      
      {/* Sidebar - fixed left */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
      
      {/* Main Content Area - padded left by 260px */}
      <div style={{ 
        marginLeft: '260px', 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1, 
        minHeight: '100vh',
        width: 'calc(100vw - 260px)'
      }}>
        
        {/* Topbar */}
        <Topbar onOpenAiAssistant={() => setIsAiOpen(true)} />
        
        {/* Central Sub-view container */}
        <main style={{ 
          padding: '24px 40px', 
          flexGrow: 1, 
          overflowY: 'auto' 
        }}>
          {renderContent()}
        </main>
      </div>

      {/* AI Assistant Drawer Sidebar Modal */}
      {isAiOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '380px',
          background: '#0b142d',
          color: 'white',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease forwards'
        }}>
          <style>{`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} style={{ color: '#1e5eff' }} />
              <span style={{ fontSize: '15px', fontWeight: '700' }}>主调度 Agent 助理</span>
            </div>
            
            <button onClick={() => setIsAiOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8e9bb4', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {aiMessages.map((m, idx) => (
              <div 
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? '#1e5eff' : 'rgba(255,255,255,0.05)',
                  color: m.sender === 'user' ? 'white' : '#cbd5e1',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  maxWidth: '85%',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Quick-Prompt clicks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 20px 10px 20px' }}>
            <span style={{ fontSize: '10px', color: '#8e9bb4', fontWeight: '500' }}>快速提问智能体：</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button onClick={() => handleSendAiMessage('扫描并分析今日盘前计划一页纸')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer' }}>
                🔍 盘前扫描
              </button>
              <button onClick={() => handleSendAiMessage('诊断持仓个股风险情况')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer' }}>
                🚨 风险评估
              </button>
              <button onClick={() => handleSendAiMessage('分析迈瑞医疗支撑强度')} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', color: '#cbd5e1', cursor: 'pointer' }}>
                🎯 迈瑞医疗支撑
              </button>
            </div>
          </div>

          {/* Input box */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              placeholder="向主调度 Agent 提问..."
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
              style={{
                flexGrow: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
                color: 'white',
                outline: 'none',
                fontSize: '12px'
              }}
            />
            
            <button 
              onClick={() => handleSendAiMessage()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#1e5eff',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Send size={16} />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default App;
