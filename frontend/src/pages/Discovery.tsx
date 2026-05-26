import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, Layers, Sparkles, ShieldCheck, 
  Settings, RefreshCw, Send, CheckCircle, FileText, 
  AlertTriangle, CheckSquare, ArrowRight, HelpCircle, 
  Search, Sliders, Play, X, ChevronRight, BarChart2 
} from 'lucide-react';
import { DiscoveryConfig, DiscoveryScanResponse, DiscoveryStockDetail, DeepResearchResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

export const Discovery: React.FC = () => {
  // Navigation & UI state
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'config'>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Data state
  const [config, setConfig] = useState<DiscoveryConfig | null>(null);
  const [scanResult, setScanResult] = useState<DiscoveryScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  
  // Progress & Estimations state
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [estimatedSeconds, setEstimatedSeconds] = useState<string>('4.0');
  const [scanStepText, setScanStepText] = useState<string>('');
  
  // Interactive research report modal
  const [selectedStock, setSelectedStock] = useState<DiscoveryStockDetail | null>(null);
  const [researchReport, setResearchReport] = useState<DeepResearchResponse | null>(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState<boolean>(false);
  
  // Feishu state
  const [isFeishuPushing, setIsFeishuPushing] = useState<boolean>(false);
  const [feishuStatus, setFeishuStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Configuration form state
  const [sectorsInput, setSectorsInput] = useState('');
  const [avoidSectorsInput, setAvoidSectorsInput] = useState('');
  const [minMarketCap, setMinMarketCap] = useState(100);
  const [minTurnover, setMinTurnover] = useState(50);
  const [tradingStyle, setTradingStyle] = useState('中长线(VCP)为主');
  const [historyWindow, setHistoryWindow] = useState(250);

  // Fetch configuration and run initial scan
  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/config`);
      if (response.ok) {
        const data: DiscoveryConfig = await response.json();
        setConfig(data);
        // Sync form state
        setSectorsInput(data.sectors);
        setAvoidSectorsInput(data.avoid_sectors);
        setMinMarketCap(data.min_market_cap);
        setMinTurnover(data.min_daily_turnover);
        setTradingStyle(data.trading_style);
        setHistoryWindow(data.history_window_days);
      }
    } catch (err) {
      console.error('Failed to fetch discovery config:', err);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    setIsLoading(true);
    setScanProgress(0);
    setEstimatedSeconds('4.0');
    setScanStepText('准备扫描任务中...');

    // Smooth progress simulation timer
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      
      let progress = 0;
      let stepText = '准备扫描任务中...';
      
      if (elapsed < 1200) {
        stepText = '第一层过滤：可交易与可研究标的清洗中 (剔除ST/停牌/财务异常)...';
        progress = Math.min(35, Math.round(35 * (elapsed / 1200)));
      } else if (elapsed < 2400) {
        stepText = '第二层评估：VCP形态、均线排列与多维度量化指标打分中...';
        progress = Math.min(75, Math.round(35 + 40 * ((elapsed - 1200) / 1200)));
      } else if (elapsed < 3500) {
        stepText = '第三层处理：Top-N 投资逻辑与盘口 Checklist 生成中...';
        progress = Math.min(92, Math.round(75 + 17 * ((elapsed - 2400) / 1100)));
      } else {
        stepText = '数据快照落盘并完成差分对比中...';
        progress = Math.min(98, Math.round(92 + 6 * (1 - Math.exp(-(elapsed - 3500) / 1000))));
      }

      setScanProgress(progress);
      setScanStepText(stepText);
      
      const rem = Math.max(0.1, (4000 - elapsed) / 1000).toFixed(1);
      setEstimatedSeconds(rem);
    }, 100);

    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/scan`, {
        method: 'POST'
      });
      clearInterval(interval);

      if (response.ok) {
        const data: DiscoveryScanResponse = await response.json();
        setScanProgress(100);
        setEstimatedSeconds('0.0');
        setScanStepText('扫描全线成功！已生成高价值 TopN 研报提纲。');
        
        // Let user see 100% success state
        await new Promise((resolve) => setTimeout(resolve, 600));
        setScanResult(data);
      } else {
        setScanStepText('扫描失败，服务器响应异常。');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (err) {
      clearInterval(interval);
      console.error('Failed to run discovery scan:', err);
      setScanStepText('连接失败，请检查后端 API 服务运行状态。');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsScanning(false);
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectors: sectorsInput,
          avoid_sectors: avoidSectorsInput,
          min_market_cap: minMarketCap,
          min_daily_turnover: minTurnover,
          trading_style: tradingStyle,
          history_window_days: historyWindow
        })
      });
      if (response.ok) {
        const data: DiscoveryConfig = await response.json();
        setConfig(data);
        setActiveSubTab('dashboard');
        // Trigger a fresh scan with new configs
        handleScan();
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleFeishuPush = async () => {
    setIsFeishuPushing(true);
    setFeishuStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/push-feishu`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setFeishuStatus({ success: true, msg: data.message || '飞书卡片推送成功！' });
      } else {
        setFeishuStatus({ success: false, msg: data.message || '推送失败，请检查配置。' });
      }
    } catch (err) {
      setFeishuStatus({ success: false, msg: '连接 API 失败，请检查后端运行状态。' });
    } finally {
      setIsFeishuPushing(false);
      setTimeout(() => setFeishuStatus(null), 5000);
    }
  };

  const handleDeepResearch = async (stock: DiscoveryStockDetail) => {
    setSelectedStock(stock);
    setResearchReport(null);
    setIsLoadingResearch(true);
    try {
      // Try to get existing report first
      let response = await fetch(`${API_BASE_URL}/api/discovery/deep-research/${stock.symbol}`);
      if (!response.ok) {
        // Generate new report
        response = await fetch(`${API_BASE_URL}/api/discovery/deep-research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: stock.symbol })
        });
      }
      
      if (response.ok) {
        const data: DeepResearchResponse = await response.json();
        setResearchReport(data);
      }
    } catch (err) {
      console.error('Failed to retrieve deep research:', err);
    } finally {
      setIsLoadingResearch(false);
    }
  };

  const fetchLatestSnapshot = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/scan`);
      if (response.ok) {
        const data: DiscoveryScanResponse = await response.json();
        setScanResult(data);
      }
    } catch (err) {
      console.error('Failed to fetch discovery snapshot:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchLatestSnapshot();
  }, []);

  // Compute stats on rejected stocks in Layer 1
  const allStocksMock = [
    { symbol: '600519.SH', name: '贵州茅台', sector: '白酒' },
    { symbol: '300750.SZ', name: '宁德时代', sector: '新能源锂电' },
    { symbol: '300760.SZ', name: '迈瑞医疗', sector: '医疗器械' },
    { symbol: '000002.SZ', name: '万科A', sector: '房地产' }
  ];

  const getRejectedStocks = () => {
    if (!scanResult) return [];
    const passedSymbols = scanResult.candidates.map(c => c.symbol);
    return allStocksMock.filter(s => !passedSymbols.includes(s.symbol)).map(s => {
      let reason = '不满足筛选偏好';
      if (config?.avoid_sectors.split(',').some(av => s.sector.includes(av.trim()) || s.name.includes(av.trim()))) {
        reason = `不碰行业: 触发【${s.sector}】回避偏好`;
      } else if (s.symbol === '000002.SZ' && minMarketCap > 1000) {
        reason = `市值未达标: 市值约 968亿 < ${minMarketCap}亿`;
      }
      return { ...s, reason };
    });
  };

  // Helper to parse markdown headers, bold, bullet points, checklists, and tables
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n');
    return lines.map((line, idx) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={idx} style={{ fontSize: '22px', fontWeight: '800', color: '#f8fafc', marginTop: '24px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8', marginTop: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={16} /> {line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', marginTop: '16px', marginBottom: '8px' }}>{line.replace('### ', '')}</h3>;
      }
      // Horizontal Rule
      if (line === '---') {
        return <hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0' }} />;
      }
      // Checkbox list
      if (line.trim().startsWith('- [ ] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0', paddingLeft: '12px' }}>
            <input type="checkbox" readOnly checked={false} style={{ accentColor: '#1e5eff' }} />
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{line.replace('- [ ] ', '')}</span>
          </div>
        );
      }
      if (line.trim().startsWith('- [x] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0', paddingLeft: '12px' }}>
            <input type="checkbox" readOnly checked={true} style={{ accentColor: '#10b981' }} />
            <span style={{ fontSize: '13px', color: '#10b981', textDecoration: 'line-through' }}>{line.replace('- [x] ', '')}</span>
          </div>
        );
      }
      // Bullet list
      if (line.trim().startsWith('- ')) {
        return <li key={idx} style={{ fontSize: '13px', color: '#cbd5e1', marginLeft: '20px', marginBottom: '6px', lineHeight: '1.6' }}>{line.replace('- ', '')}</li>;
      }
      // Table rows parsing
      if (line.startsWith('|') && idx > 0 && lines[idx - 1].startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (line.includes('---')) return null; // Skip header divider
        
        const isHeader = idx === 0 || (lines[idx + 1] && lines[idx + 1].includes('---'));
        
        return (
          <div key={idx} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px', background: isHeader ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
            {cells.map((cell, cIdx) => (
              <div key={cIdx} style={{ flex: 1, fontSize: '12px', color: isHeader ? '#94a3b8' : '#cbd5e1', fontWeight: isHeader ? '700' : 'normal' }}>
                {cell}
              </div>
            ))}
          </div>
        );
      }
      // Bold text mapping
      let content: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: '#fbbf24' }}>{part}</strong> : part);
      }

      return line.trim() ? <p key={idx} style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.7', margin: '8px 0' }}>{content}</p> : <div key={idx} style={{ height: '8px' }}></div>;
    });
  };

  const filteredCandidates = scanResult?.candidates.filter(stock => 
    stock.name.includes(searchQuery) || stock.symbol.includes(searchQuery) || stock.sector.includes(searchQuery)
  ) || [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Header Card */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <TrendingUp size={22} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
                选股与题材挖掘 <span style={{ fontSize: '11px', fontWeight: '500', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>Discovery 04</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                提炼全市场数千只个股及题材炒作噪音，压缩出具备极高盈亏比的 Top 清单，一键调用专家级买方深研分析。
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Sub tab toggler */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={() => setActiveSubTab('dashboard')}
              style={{
                background: activeSubTab === 'dashboard' ? '#1e5eff' : 'transparent',
                color: activeSubTab === 'dashboard' ? '#ffffff' : '#94a3b8',
                border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <BarChart2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              智能选股工作台
            </button>
            <button
              onClick={() => setActiveSubTab('config')}
              style={{
                background: activeSubTab === 'config' ? '#1e5eff' : 'transparent',
                color: activeSubTab === 'config' ? '#ffffff' : '#94a3b8',
                border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <Settings size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              策略约束偏好
            </button>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="btn btn-secondary"
            style={{
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', height: '36px'
            }}
          >
            <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
            {isScanning ? '扫描中...' : '重新扫描'}
          </button>
        </div>
      </div>

      {activeSubTab === 'config' ? (
        /* ==================== CONFIGURATION VIEW ==================== */
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.8)', paddingBottom: '16px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} style={{ color: '#1e5eff' }} />
              定制您的投资偏好与策略约束
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              修改参数后，主调度系统将实时应用于第一层流动性门槛过滤及第二层多维度策略评估。
            </p>
          </div>

          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              
              {/* Whitelist sectors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>赛道主线白名单 (逗号隔开)</label>
                <input 
                  type="text" 
                  value={sectorsInput}
                  onChange={(e) => setSectorsInput(e.target.value)}
                  placeholder="如: 新能源锂电, 医疗器械, 半导体"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>只扫描匹配上述题材赛道的标的。</span>
              </div>

              {/* Avoided sectors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>坚决不碰的股票/行业 (黑名单)</label>
                <input 
                  type="text" 
                  value={avoidSectorsInput}
                  onChange={(e) => setAvoidSectorsInput(e.target.value)}
                  placeholder="如: 房地产, ST个股"
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>自动剔除触碰该名单的所有个股（如ST股、房地产等）。</span>
              </div>

              {/* Min Cap Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>最低市值门槛 (亿人民币)</label>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e5eff' }}>{minMarketCap} 亿</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="1000" 
                  step="10"
                  value={minMarketCap}
                  onChange={(e) => setMinMarketCap(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#1e5eff' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>过滤掉低于此市值的小盘股，防范流动性差或庄股操纵风险。</span>
              </div>

              {/* Min Turnover Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>最低日均成交额门槛 (万人民币)</label>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e5eff' }}>{minTurnover} 万</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="10"
                  value={minTurnover}
                  onChange={(e) => setMinTurnover(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#1e5eff' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>过滤掉成交清淡的死股，保证买入后随时能安全卖出。</span>
              </div>

              {/* Trading Style */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>交易风格取向</label>
                <select 
                  value={tradingStyle}
                  onChange={(e) => setTradingStyle(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white' }}
                >
                  <option value="中长线(VCP)为主">中长线(VCP)为主 - 稳健突破，重合力</option>
                  <option value="短线情绪龙头">短线情绪龙头 - 打板低吸，吃超额情绪</option>
                  <option value="高股息价值防守">高股息价值防守 - 弱势市防守保本</option>
                </select>
              </div>

              {/* History Window */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>趋势与形态过滤历史窗口 (交易日)</label>
                <input 
                  type="number" 
                  value={historyWindow}
                  onChange={(e) => setHistoryWindow(Number(e.target.value))}
                  style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>用于计算 52周最高价、MA150/MA200 排列及波动收缩轮次的周期。</span>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '20px' }}>
              <button 
                type="button" 
                onClick={() => setActiveSubTab('dashboard')} 
                className="btn btn-secondary"
                style={{ fontSize: '12px' }}
              >
                取消
              </button>
              <button 
                type="submit" 
                disabled={isSavingConfig}
                className="btn btn-primary"
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isSavingConfig ? '保存中...' : '应用偏好并重新扫描'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ==================== WORKBENCH / DASHBOARD VIEW ==================== */
        <>
          {/* Custom Progress Bar Overlay when scanning */}
          {isScanning && (
            <div className="glass-panel" style={{
              padding: '24px 32px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 8px 32px 0 rgba(245, 158, 11, 0.15)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginBottom: '24px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Header inside progress panel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 4s linear infinite' }}>
                    <RefreshCw size={20} style={{ color: '#f59e0b' }} />
                  </div>
                  <style>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', margin: 0 }}>
                      系统正在进行全市场量化清洗与策略评估...
                    </h4>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                      当前执行阶段：<strong style={{ color: '#fbbf24' }}>{scanStepText}</strong>
                    </p>
                  </div>
                </div>

                {/* Estimated remaining seconds */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>预计完成时间还剩</span>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24', fontFamily: "'JetBrains Mono', monospace" }}>
                    {estimatedSeconds} 秒
                  </div>
                </div>
              </div>

              {/* Progress bar line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  flexGrow: 1,
                  height: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${scanProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                    borderRadius: '6px',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                    transition: 'width 0.15s ease-out',
                    position: 'relative'
                  }}>
                    {/* Animated light highlight */}
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                      animation: 'progress-shine 1.5s infinite',
                      backgroundSize: '200% 100%'
                    }} />
                    <style>{`
                      @keyframes progress-shine {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                      }
                    `}</style>
                  </div>
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: '800', color: '#10b981', minWidth: '45px', textAlign: 'right',
                  fontFamily: "'JetBrains Mono', monospace"
                }}>
                  {scanProgress}%
                </span>
              </div>
            </div>
          )}

          {/* Stepper progress & stats block */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            
            {/* Stepper display */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} style={{ color: '#fbbf24' }} />
                智能选股 3-Layer 过滤流水线可视化
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', position: 'relative' }}>
                {/* Connector line */}
                <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.06)', zIndex: 0 }}></div>
                
                {/* Step 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, flex: 1 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                    border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px'
                  }}>1</div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>第一层: 可交易偏好过滤</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>剔除ST/停牌/低市值噪音</span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                    {scanResult ? `${scanResult.total_passed_layer1} / ${scanResult.total_scanned} 只入围` : '计算中...'}
                  </span>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, flex: 1 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
                    border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px'
                  }}>2</div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>第二层: 多维度策略打分</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>技术VCP + 基本面 + 风险评估</span>
                  <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '700', marginTop: '4px' }}>
                    {scanResult ? `共计 ${scanResult.candidates.length} 只策略候选股` : '计算中...'}
                  </span>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, flex: 1 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #78350f 0%, #7c2d12 100%)',
                    border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '13px'
                  }}>3</div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#e2e8f0' }}>第三层: 生成研究提纲</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Top-N 投资逻辑一键深研</span>
                  <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '700', marginTop: '4px' }}>
                    {scanResult ? `精选 Top ${scanResult.top_n.length} 核心标的` : '计算中...'}
                  </span>
                </div>

              </div>
            </div>

            {/* Snapshot Comparison Panel */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={15} style={{ color: '#10b981' }} />
                候选池今日动态 (对比昨日)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>🟢 今日新加入 TopN 候选:</span>
                  {scanResult && scanResult.additions.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {scanResult.additions.map(sym => (
                        <span key={sym} style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          {sym === '300750.SZ' ? '宁德时代' : sym}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>无新入池个股，保持静默</span>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>🔴 今日剔除出 TopN 候选:</span>
                  {scanResult && scanResult.removals.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {scanResult.removals.map(sym => (
                        <span key={sym} style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '4px', textDecoration: 'line-through' }}>
                          {sym === '000002.SZ' ? '万科A' : sym}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>无剔除个股，持续观察</span>
                  )}
                </div>
              </div>

              {/* Feishu Notification Trigger */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>飞书机器人通知推送:</span>
                <button
                  onClick={handleFeishuPush}
                  disabled={isFeishuPushing || !scanResult}
                  className="btn btn-primary"
                  style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Send size={12} />
                  {isFeishuPushing ? '推送中...' : '推送到飞书'}
                </button>
              </div>

              {feishuStatus && (
                <div style={{
                  padding: '6px 10px', borderRadius: '6px', fontSize: '11px',
                  background: feishuStatus.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: feishuStatus.success ? '#10b981' : '#ef4444',
                  textAlign: 'center', transition: 'all 0.2s'
                }}>
                  {feishuStatus.msg}
                </div>
              )}

            </div>
          </div>

          {/* Stepper detail panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
            
            {/* Left Column: Layer 1 Rejected list & configuration brief */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Configuration brief */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  当前偏好快照
                </h4>
                {config ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>主线赛道白名单:</span>
                      <span style={{ color: '#38bdf8', fontWeight: '600' }}>{config.sectors || '全赛道扫描'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>坚决不碰行业:</span>
                      <span style={{ color: '#ef4444', fontWeight: '600' }}>{config.avoid_sectors}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>最低市值门槛:</span>
                      <span style={{ color: '#f8fafc', fontWeight: '600' }}>{config.min_market_cap} 亿</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>最低日均成交额:</span>
                      <span style={{ color: '#f8fafc', fontWeight: '600' }}>{config.min_daily_turnover} 万</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>核心风格取向:</span>
                      <span style={{ color: '#fbbf24', fontWeight: '600' }}>{config.trading_style}</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>加载偏好中...</span>
                )}
              </div>

              {/* Layer 1 Rejections list */}
              <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>第一层已拦截噪音股 ({getRejectedStocks().length}只)</span>
                  <span style={{ fontSize: '10px', fontWeight: '500', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '8px' }}>无视杂音</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {getRejectedStocks().map(stock => (
                    <div key={stock.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>{stock.name}</span>
                        <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{stock.symbol} | {stock.sector}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500', textAlign: 'right' }}>
                        {stock.reason}
                      </span>
                    </div>
                  ))}
                  {getRejectedStocks().length === 0 && (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '10px' }}>第一层没有拦截到个股</span>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Layer 2 Leaderboard Grid */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} style={{ color: '#fbbf24' }} />
                  第二层: 多维度策略打分排位表
                </h4>

                {/* Search query */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px 10px', width: '180px' }}>
                  <Search size={12} style={{ color: '#94a3b8', marginRight: '6px' }} />
                  <input
                    type="text"
                    placeholder="搜索候选池标的..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '11px', width: '100%', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <th style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>股票名称/代码</th>
                      <th style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>板块</th>
                      <th style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500', textAlign: 'right' }}>当前价</th>
                      <th style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>技术打分</th>
                      <th style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>基本面</th>
                      <th style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>安全防御</th>
                      <th style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500', textAlign: 'right' }}>综合得分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((stock) => (
                      <tr key={stock.symbol} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)', verticalAlign: 'middle' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#cbd5e1', display: 'block' }}>{stock.name}</span>
                          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>{stock.symbol}</span>
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '12px', color: '#94a3b8' }}>
                          {stock.sector}
                        </td>
                        <td style={{ padding: '12px 8px', fontSize: '12px', color: '#f8fafc', fontWeight: '600', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
                          {stock.price.toFixed(2)}
                        </td>
                        
                        {/* Technical score */}
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>{stock.trend_score}</span>
                            <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${stock.trend_score}%`, height: '100%', background: '#3b82f6' }}></div>
                            </div>
                          </div>
                        </td>

                        {/* Fundamental score */}
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>{stock.fundamental_score}</span>
                            <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${stock.fundamental_score}%`, height: '100%', background: '#10b981' }}></div>
                            </div>
                          </div>
                        </td>

                        {/* Safety score (100 - risk) */}
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: "'JetBrains Mono', monospace" }}>{100 - stock.risk_score}</span>
                            <div style={{ width: '50px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${100 - stock.risk_score}%`, height: '100%', background: '#f59e0b' }}></div>
                            </div>
                          </div>
                        </td>

                        {/* Total score badge */}
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <span style={{
                            fontSize: '12px', fontWeight: '800', fontFamily: "'JetBrains Mono', monospace",
                            color: stock.total_score >= 90 ? '#fbbf24' : (stock.total_score >= 80 ? '#38bdf8' : '#94a3b8'),
                            background: stock.total_score >= 90 ? 'rgba(251,191,36,0.08)' : (stock.total_score >= 80 ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)'),
                            padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)'
                          }}>
                            {stock.total_score}分
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredCandidates.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '20px', color: '#64748b', fontSize: '12px', textAlign: 'center', fontStyle: 'italic' }}>
                          未搜索到匹配标的
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Layer 3: Invest outlines cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#fbbf24' }} />
                第三层: 生成 "研究任务" & 题材/主线硬逻辑分析 (精选 TopN)
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} style={{ color: '#10b981' }} />
                主调度引擎多维评估正常
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {scanResult?.top_n.map((stock, idx) => (
                <div 
                  key={stock.symbol}
                  className="glass-panel" 
                  style={{
                    padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#0b1329',
                    border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: idx === 0 ? '0 0 20px rgba(245, 158, 11, 0.08)' : 'none', position: 'relative', overflow: 'hidden'
                  }}
                >
                  {/* Rank tag */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0, background: idx === 0 ? '#f59e0b' : (idx === 1 ? '#38bdf8' : '#475569'),
                    color: '#070a13', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderBottomLeftRadius: '8px'
                  }}>
                    TOP {idx + 1}
                  </div>

                  {/* Stock Header */}
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      {stock.sector}
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', marginTop: '8px' }}>
                      {stock.name} <span style={{ fontSize: '11px', fontWeight: '500', color: '#94a3b8', fontFamily: "'Outfit', sans-serif" }}>{stock.symbol}</span>
                    </h4>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                      <span>现价: <strong style={{ color: '#cbd5e1' }}>{stock.price} 元</strong></span>
                      <span>市值: <strong style={{ color: '#cbd5e1' }}>{stock.market_cap} 亿</strong></span>
                      <span>形态收敛度: <strong style={{ color: '#1e5eff' }}>{stock.contractions}</strong></span>
                    </div>
                  </div>

                  {/* Reasons for inclusion */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', display: 'block' }}>入围三大硬逻辑:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(stock.reasons || []).map((r, rIdx) => (
                        <div key={rIdx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <CheckCircle size={12} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key trigger pricing */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>关键突破点 / 防守均线:</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', fontFamily: "'Outfit', sans-serif", marginTop: '2px', display: 'block' }}>
                      {stock.key_threshold}
                    </span>
                  </div>

                  {/* Risk & validation warning callouts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.04)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.08)' }}>
                      <span style={{ fontSize: '9px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <AlertTriangle size={8} /> 潜在风险点:
                      </span>
                      <ul style={{ paddingLeft: '8px', margin: '4px 0 0 0', fontSize: '9px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {(stock.risk_points || []).map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'rgba(30, 58, 138, 0.1)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                      <span style={{ fontSize: '9px', fontWeight: '700', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <CheckSquare size={8} /> 下步验证清单:
                      </span>
                      <ul style={{ paddingLeft: '8px', margin: '4px 0 0 0', fontSize: '9px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {(stock.next_steps || []).map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Deep research action btn */}
                  <button
                    onClick={() => handleDeepResearch(stock)}
                    className="btn btn-primary"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      fontSize: '12px', fontWeight: '700', padding: '10px', marginTop: 'auto',
                      background: idx === 0 ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' : '#1e5eff',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    <FileText size={14} />
                    一键深研剖析硬逻辑
                  </button>

                </div>
              ))}
              {(!scanResult || scanResult.top_n.length === 0) && (
                <div style={{ gridColumn: 'span 3', padding: '40px', color: '#94a3b8', fontSize: '13px', textAlign: 'center', fontStyle: 'italic' }}>
                  未扫描到符合多重严格策略过滤的 Top 候选股
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==================== BUYER-GRADE DEEP RESEARCH MODAL DRAWER ==================== */}
      {selectedStock && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 10, 19, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'flex-end', zIndex: 1100,
          animation: 'fadeIn 0.2s ease'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideLeft {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>

          <div style={{
            width: '800px', height: '100%', background: '#070c1e',
            borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
            animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.5)'
          }}>
            
            {/* Header */}
            <div style={{
              padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b1229'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    {selectedStock.sector}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    买方深度报告
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc', marginTop: '6px' }}>
                  {selectedStock.name} ({selectedStock.symbol}) 题材挖掘与硬逻辑深度剖析
                </h3>
              </div>

              <button 
                onClick={() => { setSelectedStock(null); setResearchReport(null); }}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8',
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content body */}
            <div style={{
              flexGrow: 1, overflowY: 'auto', padding: '32px',
              display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              {isLoadingResearch ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', height: '300px' }}>
                  <RefreshCw size={36} className="animate-spin" style={{ color: '#fbbf24' }} />
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#e2e8f0', display: 'block' }}>智能研报 Agent 深度穿透中...</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>正在加载技术多周期指标及基本面护城河报告</span>
                  </div>
                </div>
              ) : researchReport ? (
                <div className="markdown-body" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                  {renderMarkdown(researchReport.report_markdown)}
                </div>
              ) : (
                <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center', fontSize: '13px' }}>
                  未获取到深度报告，请重试。
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.08)',
              background: '#0b1229', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                *免责声明：本报告由 Asurada 决策系统自动输出，属于智能体模拟买方穿透硬逻辑，不构成直接投资建议。
              </span>
              <button
                onClick={() => { setSelectedStock(null); setResearchReport(null); }}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '8px 20px' }}
              >
                关闭阅读
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
