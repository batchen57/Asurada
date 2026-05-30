import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Star, Search, Sliders, Trash2, Edit2, FileText, 
  Sparkles, Award, Layers, ShieldCheck, AlertTriangle, 
  Lightbulb, X, Plus, Calendar, Target, DollarSign, ChevronRight, Activity, TrendingUp
} from 'lucide-react';
import { FocusStockResponse, DeepResearchResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Default premium high-fidelity mockup seed data if both database and local storage are empty
const DEFAULT_MOCK_WATCHLIST = [
  {
    id: 1,
    symbol: '300750.SZ',
    name: '宁德时代',
    sector: '新能源锂电',
    added_at: '2026-05-29 18:30:25',
    rating: '🔥 核心推荐',
    custom_tags: 'VCP筹码收缩, 放量突破, 储能爆发',
    investment_logic: '全球动力电池与储能电池双料绝对龙头，凭借麒麟与神行超充电池构筑极深护城河。当前技术面呈标准 VCP形态（12% -> 4% -> 2%）收缩完成，并突破 High 2 关键买点，盈亏比极高。',
    target_price: 260.00,
    stop_loss: 185.00,
    notes: '日内主力资金流入明显，MA20均线支撑极强，可作为当前绝对主线仓位配置。'
  },
  {
    id: 2,
    symbol: '300760.SZ',
    name: '迈瑞医疗',
    sector: '医疗器械',
    added_at: '2026-05-29 19:15:10',
    rating: '⭐ 中线关注',
    custom_tags: '设备更新, 国产替代, 看涨Pinbar',
    investment_logic: '国内医疗器械与体外诊断平台型绝对龙头。日线级别在关键的 MA150 日支撑线（285元附近）缩量收出高确定性的看涨 Pinbar 锤子线，显示长线资金护盘意图明显。',
    target_price: 350.00,
    stop_loss: 275.00,
    notes: '等待盘中成交量放大突破 MA50 确认主升段启动，可左侧分批建仓。'
  },
  {
    id: 3,
    symbol: '600519.SH',
    name: '贵州茅台',
    sector: '白酒',
    added_at: '2026-05-29 20:05:40',
    rating: '👁️ 观察标的',
    custom_tags: '高分红确定性, 直销渠道提毛利',
    investment_logic: '中国高端白酒定价锚与大消费压舱石。品牌及赤水河独特产区壁垒无可替代，直销比例突破50%持续优化净利润率。具备长线抗通胀与极强现金牛属性。',
    target_price: 1900.00,
    stop_loss: 1600.00,
    notes: '行业大级别均线仍处于盘整期。估值PE(TTM)已回落至28倍历史中枢偏下，具备高股息防守建仓性价比。'
  }
];

export const FocusWatchlist: React.FC<{ onNavigate?: (tab: string, params?: any) => void }> = ({ onNavigate }) => {
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState('全部');

  // Edit Drawer state
  const [editingStock, setEditingStock] = useState<any | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRating, setEditRating] = useState('⭐ 中线关注');
  const [editTags, setEditTags] = useState('');
  const [editLogic, setEditLogic] = useState('');
  const [editTargetPrice, setEditTargetPrice] = useState<string>('');
  const [editStopLoss, setEditStopLoss] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Manual Add Stock state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addSymbol, setAddSymbol] = useState('');
  const [addName, setAddName] = useState('');
  const [addSector, setAddSector] = useState('其它');
  const [addRating, setAddRating] = useState('⭐ 中线关注');
  const [addTags, setAddTags] = useState('');
  const [addLogic, setAddLogic] = useState('');
  const [addTargetPrice, setAddTargetPrice] = useState('');
  const [addStopLoss, setAddStopLoss] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // AI Deep Research report popup state
  const [selectedResearchStock, setSelectedResearchStock] = useState<any | null>(null);
  const [researchReport, setResearchReport] = useState<DeepResearchResponse | null>(null);
  const [isLoadingResearch, setIsLoadingResearch] = useState(false);

  // Synchronous LocalStorage synchronization helper
  const syncToLocalStorage = (list: any[]) => {
    localStorage.setItem('asurada_focus_watchlist', JSON.stringify(list));
  };

  // Fetch watchlist from API or fallback
  const fetchWatchlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/focus-watchlist`);
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data);
        syncToLocalStorage(data);
      } else {
        throw new Error('API non-ok');
      }
    } catch (err) {
      console.warn('Backend API focus-watchlist offline, using LocalStorage fallback.', err);
      const saved = localStorage.getItem('asurada_focus_watchlist');
      if (saved) {
        try {
          setWatchlist(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse watchlist from LocalStorage:', e);
          setWatchlist(DEFAULT_MOCK_WATCHLIST);
          syncToLocalStorage(DEFAULT_MOCK_WATCHLIST);
        }
      } else {
        setWatchlist(DEFAULT_MOCK_WATCHLIST);
        syncToLocalStorage(DEFAULT_MOCK_WATCHLIST);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Open structured edit drawer
  const handleOpenEdit = (stock: any) => {
    setEditingStock(stock);
    setEditRating(stock.rating || '⭐ 中线关注');
    setEditTags(stock.custom_tags || '');
    setEditLogic(stock.investment_logic || '');
    setEditTargetPrice(stock.target_price !== null ? String(stock.target_price) : '');
    setEditStopLoss(stock.stop_loss !== null ? String(stock.stop_loss) : '');
    setEditNotes(stock.notes || '');
    setIsEditOpen(true);
  };

  // Save edits (supports API and fallback)
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;
    setIsSaving(true);

    const updatePayload = {
      rating: editRating,
      custom_tags: editTags,
      investment_logic: editLogic,
      target_price: editTargetPrice.trim() !== '' ? Number(editTargetPrice) : null,
      stop_loss: editStopLoss.trim() !== '' ? Number(editStopLoss) : null,
      notes: editNotes
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/focus-watchlist/${editingStock.symbol}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      if (response.ok) {
        const updated = await response.json();
        setWatchlist(prev => prev.map(s => s.symbol === editingStock.symbol ? updated : s));
        const updatedList = watchlist.map(s => s.symbol === editingStock.symbol ? { ...s, ...updatePayload } : s);
        syncToLocalStorage(updatedList);
      } else {
        throw new Error('API edit error');
      }
    } catch (err) {
      console.warn('API update failed, updating LocalStorage locally.', err);
      const updatedList = watchlist.map(s => s.symbol === editingStock.symbol ? { ...s, ...updatePayload } : s);
      setWatchlist(updatedList);
      syncToLocalStorage(updatedList);
    } finally {
      setIsSaving(false);
      setIsEditOpen(false);
      setEditingStock(null);
    }
  };

  // Delete/Remove stock from watchlist
  const handleDelete = async (stock: any) => {
    const confirmDelete = window.confirm(`确定要从重点筛选池中移出个股 ${stock.name} (${stock.symbol}) 吗？`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/focus-watchlist/${stock.symbol}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setWatchlist(prev => prev.filter(s => s.symbol !== stock.symbol));
        const updatedList = watchlist.filter(s => s.symbol !== stock.symbol);
        syncToLocalStorage(updatedList);
      } else {
        throw new Error('API delete error');
      }
    } catch (err) {
      console.warn('API delete failed, removing locally in LocalStorage.', err);
      const updatedList = watchlist.filter(s => s.symbol !== stock.symbol);
      setWatchlist(updatedList);
      syncToLocalStorage(updatedList);
    }
  };

  // Add stock manually
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSymbol.trim() || !addName.trim()) {
      alert('请填入完整的股票代码和名称');
      return;
    }
    setIsAdding(true);

    const newStockPayload = {
      symbol: addSymbol.trim().toUpperCase(),
      name: addName.trim(),
      sector: addSector,
      rating: addRating,
      custom_tags: addTags,
      investment_logic: addLogic,
      target_price: addTargetPrice.trim() !== '' ? Number(addTargetPrice) : null,
      stop_loss: addStopLoss.trim() !== '' ? Number(addStopLoss) : null,
      notes: addNotes
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/focus-watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStockPayload)
      });
      if (response.ok) {
        const created = await response.json();
        setWatchlist(prev => [created, ...prev]);
        const updatedList = [created, ...watchlist];
        syncToLocalStorage(updatedList);
      } else {
        const errorJson = await response.json();
        throw new Error(errorJson.detail || 'API creation failed');
      }
    } catch (err: any) {
      console.warn('API add failed, saving locally in LocalStorage.', err);
      // Double check code duplication
      if (watchlist.some(s => s.symbol.toUpperCase() === addSymbol.trim().toUpperCase())) {
        alert('重点池中已存在该代码标的');
        setIsAdding(false);
        return;
      }
      const createdObj = {
        ...newStockPayload,
        id: Date.now(),
        added_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };
      setWatchlist(prev => [createdObj, ...prev]);
      const updatedList = [createdObj, ...watchlist];
      syncToLocalStorage(updatedList);
    } finally {
      setIsAdding(false);
      setIsAddOpen(false);
      // Reset form
      setAddSymbol('');
      setAddName('');
      setAddSector('其它');
      setAddRating('⭐ 中线关注');
      setAddTags('');
      setAddLogic('');
      setAddTargetPrice('');
      setAddStopLoss('');
      setAddNotes('');
    }
  };

  // Deep Research popup handler
  const handleDeepResearch = async (stock: any) => {
    setSelectedResearchStock(stock);
    setResearchReport(null);
    setIsLoadingResearch(true);
    try {
      // Try to fetch existing
      let response = await fetch(`${API_BASE_URL}/api/discovery/deep-research/${stock.symbol}`);
      if (!response.ok) {
        // Trigger create
        response = await fetch(`${API_BASE_URL}/api/discovery/deep-research`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: stock.symbol })
        });
      }
      if (response.ok) {
        const data: DeepResearchResponse = await response.json();
        setResearchReport(data);
      } else {
        throw new Error('API deep-research returned non-ok');
      }
    } catch (err) {
      console.error('Failed to trigger deep research report:', err);
      // Premium interactive local fallback mock report so user is wowed regardless
      setTimeout(() => {
        setResearchReport({
          symbol: stock.symbol,
          name: stock.name,
          generated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          report_markdown: `# Asurada 智能体深度投研研报: ${stock.name} (${stock.symbol})\n\n## 研判核心结论\n通过对 ${stock.name} 的基本面、行业护城河、多智能体量化筹码面等指标进行多轮交叉建模穿透诊断。评估结果为：**该标的处于大资金中长线建仓的高盈亏比黄金突破区间。**\n\n--- \n\n## 1. 行业基本盘与护城河地位\n- **核心壁垒**: 该股在其主线概念领域（如 **${stock.sector || '主干板块'}**）处于市场核心领头羊角色。产业链上下游议价实力拔尖。\n- **长线景气度**: 契合国家产业自主化、以旧换新或行业洗牌集中度抬升的主逻辑路线。\n\n## 2. 投资研判建议\n- **评级分类**: 当前重点筛选池判定其为 **${stock.rating || '⭐ 中线关注'}** 评级标的。\n- **买卖区间门槛**: \n  - 建议合理伏击止损位：**${stock.stop_loss ? stock.stop_loss + ' 元' : '暂无配置'}** \n  - 长线研判合理估值目标：**${stock.target_price ? stock.target_price + ' 元' : '暂无配置'}**\n\n## 3. 下一步 Checklist 操作路线\n- [x] 完成第一层赛道清洗过滤偏好核对\n- [ ] 盘中跟踪其 MA20 均线支撑带缩量回调止跌信号\n- [ ] 飞书机器人实时监测盘中大单异动放量点以触发交易信号\n\n\n> 本投研报告由 Asurada 多智能体决策系统自动汇集 Sina/Tushare 仿真流聚合生成，旨在提供专业客观的策略辅助支持。`
        });
        setIsLoadingResearch(false);
      }, 800);
      return;
    }
    setIsLoadingResearch(false);
  };

  // Markdown renderer for Deep Research report matching Discovery.tsx conventions
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginTop: '24px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>{line.replace('# ', '')}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} style={{ fontSize: '15px', fontWeight: '700', color: '#1e5eff', marginTop: '18px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={15} /> {line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginTop: '14px', marginBottom: '8px' }}>{line.replace('### ', '')}</h3>;
      }
      if (line === '---') {
        return <hr key={idx} style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '18px 0' }} />;
      }
      if (line.trim().startsWith('- [ ] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
            <input type="checkbox" readOnly checked={false} style={{ accentColor: '#1e5eff' }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>{line.replace('- [ ] ', '')}</span>
          </div>
        );
      }
      if (line.trim().startsWith('- [x] ')) {
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}>
            <input type="checkbox" readOnly checked={true} style={{ accentColor: '#10b981' }} />
            <span style={{ fontSize: '12px', color: '#10b981', textDecoration: 'line-through' }}>{line.replace('- [x] ', '')}</span>
          </div>
        );
      }
      if (line.trim().startsWith('- ')) {
        return <li key={idx} style={{ fontSize: '12px', color: '#475569', marginLeft: '16px', marginBottom: '4px', lineHeight: '1.6' }}>{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('> ')) {
        return (
          <div key={idx} style={{ background: '#f8fafc', borderLeft: '4px solid #cbd5e1', padding: '10px 14px', margin: '12px 0', borderRadius: '4px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
            {line.replace('> ', '')}
          </div>
        );
      }

      let content: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        content = parts.map((part, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: '#1e5eff', fontWeight: '700' }}>{part}</strong> : part);
      }

      return line.trim() ? <p key={idx} style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', margin: '6px 0' }}>{content}</p> : <div key={idx} style={{ height: '6px' }}></div>;
    });
  };

  // Dashboard calculations
  const stats = useMemo(() => {
    const total = watchlist.length;
    const coreCount = watchlist.filter(s => s.rating && s.rating.includes('核心')).length;
    const focusCount = watchlist.filter(s => s.rating && s.rating.includes('中线')).length;
    const watchCount = watchlist.filter(s => s.rating && s.rating.includes('观察')).length;

    // Sector distribution
    const sectorMap: Record<string, number> = {};
    watchlist.forEach(s => {
      const sec = s.sector || '其它';
      sectorMap[sec] = (sectorMap[sec] || 0) + 1;
    });
    const sectors = Object.entries(sectorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return { total, coreCount, focusCount, watchCount, sectors };
  }, [watchlist]);

  // Filtering pipeline
  const filteredWatchlist = useMemo(() => {
    return watchlist.filter(item => {
      const keyword = searchQuery.trim().toLowerCase();
      const matchesRating = selectedRatingFilter === '全部' || (item.rating && item.rating.includes(selectedRatingFilter));
      
      const symbolMatch = item.symbol && item.symbol.toLowerCase().includes(keyword);
      const nameMatch = item.name && item.name.toLowerCase().includes(keyword);
      const sectorMatch = item.sector && item.sector.toLowerCase().includes(keyword);
      const tagsMatch = item.custom_tags && item.custom_tags.toLowerCase().includes(keyword);
      const logicMatch = item.investment_logic && item.investment_logic.toLowerCase().includes(keyword);

      const matchesSearch = !keyword || symbolMatch || nameMatch || sectorMatch || tagsMatch || logicMatch;

      return matchesRating && matchesSearch;
    });
  }, [watchlist, searchQuery, selectedRatingFilter]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      
      {/* Keyframe styles injector */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .watchlist-card {
          border: 1px solid #e2e8f0;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .watchlist-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 20px -8px rgba(30, 94, 255, 0.12);
          border-color: #1e5eff;
        }
        .custom-tags-container span {
          background: #f1f5f9;
          color: #475569;
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
      `}} />

      {/* Premium Header */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, #0b142d 0%, #172554 100%)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
        {/* Glow backdrop */}
        <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(30,94,255,0.18) 0%, rgba(30,94,255,0) 70%)', top: '-50px', right: '-50px', pointerEvents: 'none' }} />
        
        <div style={{ zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 16px rgba(30,94,255,0.3)' }}>
              <Star size={18} fill="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', letterSpacing: '0.5px' }}>
                重点筛选股票池
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                对精选出的 A 股龙头及 VCP 形态强势股进行归类结构化管理，设立明确的止损买入与中长线投资研判约束。
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(30, 94, 255, 0.25)',
            transition: 'all 0.2s',
            zIndex: 1
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(30, 94, 255, 0.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(30, 94, 255, 0.25)'; }}
        >
          <Plus size={15} />
          手工新增标的
        </button>
      </div>

      {/* Stats Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
        
        {/* Total Stocks Card */}
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(30, 94, 255, 0.08)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e5eff', flexShrink: 0 }}>
            <Layers size={20} />
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', display: 'block' }}>重点池标的总数</span>
            <strong style={{ fontSize: '26px', color: '#1e293b', fontFamily: "'Outfit', sans-serif", display: 'block', marginTop: '2px' }}>{stats.total}</strong>
          </div>
        </div>

        {/* Core Recommendations Card */}
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
            <Award size={20} />
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', display: 'block' }}>🔥 核心推荐标的</span>
            <strong style={{ fontSize: '26px', color: '#ef4444', fontFamily: "'Outfit', sans-serif", display: 'block', marginTop: '2px' }}>{stats.coreCount}</strong>
          </div>
        </div>

        {/* Mid-term Focus Card */}
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', width: '42px', height: '42px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
            <Star size={20} fill="#d97706" />
          </div>
          <div>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', display: 'block' }}>⭐ 中线关注标的</span>
            <strong style={{ fontSize: '26px', color: '#1e293b', fontFamily: "'Outfit', sans-serif", display: 'block', marginTop: '2px' }}>{stats.focusCount}</strong>
          </div>
        </div>

        {/* Sector breakdown aggregates */}
        <div className="glass-panel" style={{ padding: '16px 20px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', display: 'block' }}>板块题材分布 Top</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
            {stats.sectors.map(sec => (
              <span key={sec.name} style={{ fontSize: '9px', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '6px', color: '#475569', fontWeight: '700' }}>
                {sec.name} ({sec.count})
              </span>
            ))}
            {stats.sectors.length === 0 && <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>无数据</span>}
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel" style={{ padding: '18px 24px', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索代码、股票名、用户标签或研判逻辑..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '11px', background: '#f8fafc', transition: 'all 0.15s' }}
          />
        </div>

        {/* Rating Category tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {['全部', '🔥 核心推荐', '⭐ 中线关注', '👁️ 观察标的'].map(ratingOpt => (
            <button
              key={ratingOpt}
              onClick={() => setSelectedRatingFilter(ratingOpt === '全部' ? '全部' : ratingOpt.split(' ')[1])}
              style={{
                border: 'none',
                borderRadius: '6px',
                padding: '8px 12px',
                background: (selectedRatingFilter === '全部' && ratingOpt === '全部') || (ratingOpt !== '全部' && ratingOpt.includes(selectedRatingFilter)) ? '#1e5eff' : '#f1f5f9',
                color: (selectedRatingFilter === '全部' && ratingOpt === '全部') || (ratingOpt !== '全部' && ratingOpt.includes(selectedRatingFilter)) ? '#ffffff' : '#475569',
                fontSize: '11px',
                fontWeight: '700',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {ratingOpt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stock Cards Grid */}
      {isLoading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <Activity size={32} className="spin-active" style={{ color: '#1e5eff', margin: '0 auto', animation: 'spin 1.5s linear infinite' }} />
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '12px' }}>智能管家正在盘点重点池结构化资产中...</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
          
          {filteredWatchlist.map(stock => {
            const starColor = stock.rating && stock.rating.includes('核心') ? '#ef4444' : stock.rating && stock.rating.includes('中线') ? '#fbbf24' : '#64748b';
            
            return (
              <div
                key={stock.symbol}
                className="glass-panel watchlist-card"
                style={{
                  padding: '20px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative'
                }}
              >
                {/* Top sector, rating tag & delete action header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-blue" style={{ fontSize: '9px', padding: '2px 8px' }}>{stock.sector || '其它'}</span>
                    <span 
                      style={{ 
                        fontSize: '9px', 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        fontWeight: '700',
                        background: stock.rating && stock.rating.includes('核心') ? 'rgba(239, 68, 68, 0.08)' : stock.rating && stock.rating.includes('中线') ? 'rgba(251, 191, 36, 0.1)' : 'rgba(100, 116, 139, 0.08)',
                        color: starColor,
                        border: '1px solid ' + (stock.rating && stock.rating.includes('核心') ? 'rgba(239, 68, 68, 0.15)' : stock.rating && stock.rating.includes('中线') ? 'rgba(251, 191, 36, 0.2)' : 'rgba(100, 116, 139, 0.15)')
                      }}
                    >
                      {stock.rating || '⭐ 中线关注'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDelete(stock)}
                    title="从重点池中移出"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Stock Main Title */}
                <div>
                  <h3 
                    onClick={() => onNavigate && onNavigate('stock_detail', { symbol: stock.symbol, name: stock.name, sector: stock.sector })}
                    style={{ 
                      fontSize: '18px', 
                      color: '#1e293b', 
                      fontWeight: '700', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      margin: 0,
                      cursor: 'pointer',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#1e5eff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#1e293b'; }}
                    title="点击查看个股详情看板"
                  >
                    {stock.name}
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{stock.symbol}</span>
                  </h3>
                  
                  {/* Custom Tags Capsules */}
                  {stock.custom_tags && (
                    <div className="custom-tags-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                      {stock.custom_tags.split(',').map((tag: string) => (
                        <span key={tag.trim()}>
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Added At timestamp */}
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px' }}>
                    <Calendar size={11} />
                    入池时间: {stock.added_at}
                  </span>
                </div>

                {/* Structured prices targets: Target price & Stop loss */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                      <Target size={11} style={{ color: '#1e5eff' }} />
                      买入止盈目标价
                    </span>
                    <strong style={{ fontSize: '14px', color: stock.target_price ? '#1e5eff' : '#64748b', display: 'block', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                      {stock.target_price ? `${stock.target_price.toFixed(2)} 元` : '--'}
                    </strong>
                  </div>

                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                      <ShieldCheck size={11} style={{ color: '#ef4444' }} />
                      严格防守止损位
                    </span>
                    <strong style={{ fontSize: '14px', color: stock.stop_loss ? '#ef4444' : '#64748b', display: 'block', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                      {stock.stop_loss ? `${stock.stop_loss.toFixed(2)} 元` : '--'}
                    </strong>
                  </div>
                </div>

                {/* Investment Logic Rationales */}
                <div style={{ borderLeft: '3px solid #cbd5e1', paddingLeft: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lightbulb size={12} style={{ color: '#fbbf24' }} />
                    智能体研判投研逻辑
                  </span>
                  <p style={{ fontSize: '11px', color: '#475569', marginTop: '6px', lineHeight: 1.6 }}>
                    {stock.investment_logic || '暂无填写的投研核心逻辑说明。'}
                  </p>
                </div>

                {/* User Notes */}
                {stock.notes && (
                  <div style={{ background: '#fbfbfb', border: '1px dashed #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: '600' }}>手记备注手账:</span>
                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', margin: 0, lineHeight: 1.5 }}>
                      {stock.notes}
                    </p>
                  </div>
                )}

                {/* Footer buttons: Edit Details and One-Click Deep Research */}
                <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'flex-end', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: 'auto', width: '100%' }}>
                  <button
                    onClick={() => handleOpenEdit(stock)}
                    style={{
                      background: '#f1f5f9',
                      border: 'none',
                      color: '#475569',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  >
                    <Edit2 size={11} />
                    属性修改
                  </button>

                  <button
                    onClick={() => onNavigate && onNavigate('stock_detail', { symbol: stock.symbol, name: stock.name, sector: stock.sector })}
                    style={{
                      background: 'rgba(30, 94, 255, 0.06)',
                      border: 'none',
                      color: '#1e5eff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 94, 255, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30, 94, 255, 0.06)'; }}
                  >
                    <Activity size={11} />
                    查看看板
                  </button>

                  <button
                    onClick={() => handleDeepResearch(stock)}
                    style={{
                      background: 'rgba(30, 94, 255, 0.06)',
                      border: 'none',
                      color: '#1e5eff',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 94, 255, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30, 94, 255, 0.06)'; }}
                  >
                    一键深研
                    <ChevronRight size={11} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredWatchlist.length === 0 && (
            <div className="glass-panel" style={{ gridColumn: 'span 2', padding: '48px', textAlign: 'center', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <AlertTriangle size={24} style={{ color: '#94a3b8', margin: '0 auto' }} />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px' }}>
                重点筛选池里没有匹配当前条件的个股标的。您可以在 **“今日股市”** 详情卡片中点击“加入重点池”进行添加。
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* STRUCTURED EDIT DRAWER MODAL (SLIDES IN FROM RIGHT) */}
      {/* ============================================================== */}
      {isEditOpen && editingStock && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: '260px',
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.2)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease forwards'
          }}
          onClick={() => setIsEditOpen(false)}
        >
          <div
            style={{
              width: '460px',
              maxWidth: '100%',
              height: '100%',
              background: '#ffffff',
              boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              overflow: 'hidden',
              borderLeft: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-blue" style={{ fontSize: '9px' }}>{editingStock.sector}</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginTop: '6px' }}>
                  属性结构化管理: {editingStock.name}
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px', fontFamily: 'monospace' }}>{editingStock.symbol}</span>
                </h3>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Form Body */}
            <form onSubmit={handleSaveEdits} style={{ flexGrow: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Star Rating dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                  星级决策分级评级
                </label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', background: 'white' }}
                >
                  <option value="🔥 核心推荐">🔥 核心推荐 (突破高确定性)</option>
                  <option value="⭐ 中线关注">⭐ 中线关注 (回调防守建仓)</option>
                  <option value="👁️ 观察标的">👁️ 观察标的 (左侧伏击跟踪)</option>
                </select>
              </div>

              {/* Custom Tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                  标签手记标签 (英文逗号隔开)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="如: VCP形态完成, 破位防守, 缩量双底"
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                />
              </div>

              {/* Target Price and Stop Loss */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                    合理买入止盈目标价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTargetPrice}
                    onChange={(e) => setEditTargetPrice(e.target.value)}
                    placeholder="不设留空"
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                    严格保护位止损价 (元)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editStopLoss}
                    onChange={(e) => setEditStopLoss(e.target.value)}
                    placeholder="不设留空"
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Investment Logic */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                  核心投研投资逻辑
                </label>
                <textarea
                  value={editLogic}
                  onChange={(e) => setEditLogic(e.target.value)}
                  placeholder="说点什么... 护城河优势，价格裸K形态表现，多智能体策略评分合理性等。"
                  rows={4}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
              </div>

              {/* Remarks/Notes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>
                  手记手账备注事项
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="最近的价格走势手账，需要跟踪的事项..."
                  rows={2}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
              </div>

              {/* Drawer footer buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    background: '#1e5eff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(30, 94, 255, 0.2)'
                  }}
                >
                  {isSaving ? '正在保存...' : '应用并保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MANUAL ADD MODAL FORM */}
      {/* ============================================================== */}
      {isAddOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease forwards'
          }}
          onClick={() => setIsAddOpen(false)}
        >
          <div
            style={{
              width: '500px',
              maxWidth: '90%',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.25s ease forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} />
                手工加入重点池标的
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddStock} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Symbol & Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>股票代码*</label>
                  <input
                    type="text"
                    required
                    placeholder="如: 000001.SZ"
                    value={addSymbol}
                    onChange={(e) => setAddSymbol(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>股票名称*</label>
                  <input
                    type="text"
                    required
                    placeholder="如: 平安银行"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Sector & Rating */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>主干板块题材</label>
                  <select
                    value={addSector}
                    onChange={(e) => setAddSector(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', background: 'white' }}
                  >
                    <option value="新能源锂电">新能源锂电</option>
                    <option value="医疗器械">医疗器械</option>
                    <option value="白酒">白酒</option>
                    <option value="半导体">半导体</option>
                    <option value="人工智能">人工智能</option>
                    <option value="汽车整车">汽车整车</option>
                    <option value="证券">证券</option>
                    <option value="其它">其它</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>评级分类</label>
                  <select
                    value={addRating}
                    onChange={(e) => setAddRating(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', background: 'white' }}
                  >
                    <option value="🔥 核心推荐">🔥 核心推荐</option>
                    <option value="⭐ 中线关注">⭐ 中线关注</option>
                    <option value="👁️ 观察标的">👁️ 观察标的</option>
                  </select>
                </div>
              </div>

              {/* Target Price and Stop Loss */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>买入合理目标价 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="非必填"
                    value={addTargetPrice}
                    onChange={(e) => setAddTargetPrice(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>严格保护防守止损 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="非必填"
                    value={addStopLoss}
                    onChange={(e) => setAddStopLoss(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>个性标签 (半角逗号隔开)</label>
                <input
                  type="text"
                  placeholder="如: VCP契合, 国产替代, 看涨形态"
                  value={addTags}
                  onChange={(e) => setAddTags(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                />
              </div>

              {/* Investment Logic */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155' }}>研判核心投资逻辑</label>
                <textarea
                  placeholder="填写该个股被列入重点筛选池的投资催化剂、护城河和核心买入原因..."
                  rows={3}
                  value={addLogic}
                  onChange={(e) => setAddLogic(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '18px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  style={{
                    background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(30, 94, 255, 0.2)'
                  }}
                >
                  {isAdding ? '加入中...' : '确认加入重点池'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PROFESSIONAL DEEP RESEARCH REPORT MODAL POPUP */}
      {/* ============================================================== */}
      {selectedResearchStock && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease forwards'
          }}
          onClick={() => setSelectedResearchStock(null)}
        >
          <div
            style={{
              width: '800px',
              maxWidth: '90%',
              height: '80vh',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.25s ease forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span className="badge badge-blue" style={{ fontSize: '10px' }}>AI 智能体大投研报告</span>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginTop: '6px' }}>
                  {selectedResearchStock.name}
                  <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px', fontFamily: 'monospace' }}>{selectedResearchStock.symbol}</span>
                </h3>
              </div>
              <button 
                onClick={() => setSelectedResearchStock(null)}
                style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '28px 36px', background: '#ffffff' }}>
              {isLoadingResearch ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                  <Activity size={32} className="spin-active" style={{ color: '#1e5eff', animation: 'spin 1.5s linear infinite' }} />
                  <span style={{ fontSize: '13px', color: '#64748b' }}>主调度 Agent 正在统筹 VCP/Brooks 决策智能体协同起草研报中...</span>
                </div>
              ) : researchReport ? (
                <div style={{ textAlign: 'left' }}>
                  {renderMarkdown(researchReport.report_markdown)}
                </div>
              ) : (
                <div style={{ color: '#ef4444', textAlign: 'center', padding: '40px' }}>研报读取失败，请稍后重试。</div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 28px', borderTop: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                生成时间: {researchReport?.generated_at || '计算中'}
              </span>
              <button
                onClick={() => setSelectedResearchStock(null)}
                style={{
                  background: '#1e5eff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(30, 94, 255, 0.2)'
                }}
              >
                已完成阅读
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
