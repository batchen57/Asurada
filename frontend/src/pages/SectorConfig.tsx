import React, { useState, useEffect } from 'react';
import { Sliders, Save, Plus, Trash2, Edit2, RotateCcw, AlertCircle, Check, Info, FolderPlus, HelpCircle, RefreshCw } from 'lucide-react';
import { HierarchicalSectorConfig, SectorStockConfig } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Known demo stocks to support one-click autofill for premium developer/user experience
const PRESET_DEMO_STOCKS: Record<string, Partial<SectorStockConfig>> = {
  "300750.SZ": { name: "宁德时代", theme: "储能、动力电池", role: "全球动力电池与储能电池双料绝对龙头", signal: "跟踪放量突破与回踩承接", risk: "短线波动受锂价与新能源车景气预期影响" },
  "600519.SH": { name: "贵州茅台", theme: "消费复苏、现金流资产", role: "中国高端白酒绝对定价锚与大消费压舱石", signal: "观察机构底仓稳定性与成交额变化", risk: "估值弹性弱，趋势确认前不宜追高" },
  "300760.SZ": { name: "迈瑞医疗", theme: "国产替代、设备更新", role: "国内医疗器械与体外诊断平台型绝对龙头", signal: "关注长均线附近承接强度", risk: "行业政策扰动仍会影响估值修复节奏" },
  "688981.SH": { name: "中芯国际", theme: "先进封装、国产算力", role: "晶圆代工核心龙头与半导体自主可控支柱", signal: "板块资金聚焦时通常先看成交额确认", risk: "高弹性行业，需防止题材拥挤后的快速回撤" },
  "002230.SZ": { name: "科大讯飞", theme: "星火大模型商业化、算力国产化", role: "中文 AI 语音与多模态大模型应用落地龙头", signal: "观察分歧震荡后的右侧突破", risk: "题材交易属性强，单日冲高回落概率较高" },
  "600030.SH": { name: "中信证券", theme: "活跃资本市场", role: "券商板块权重龙头与机构服务平台化龙头", signal: "指数成交量回暖时具备 Beta 修复弹性", risk: "高度依赖两市成交额连续性" },
  "002594.SZ": { name: "比亚迪", theme: "智能驾驶、出口链", role: "全球新能源汽车与产业链垂直一体化绝对龙头", signal: "观察低波动整理后的均线抬升", risk: "价格战会压制利润率预期" },
  "000002.SZ": { name: "万科A", theme: "政策修复、信用出清", role: "国内房地产开发行业标杆与转型运营服务商代表", signal: "只做风险观察，不做趋势确认前的主动加仓", risk: "若继续弱于均线系统，仍按回避名单处理" }
};

// Hardcoded default hierarchical layout
const DEFAULT_HIERARCHICAL_LEADERS: HierarchicalSectorConfig[] = [
  {
    sector: "新能源锂电",
    stocks: [
      { symbol: "300750.SZ", name: "宁德时代", theme: "储能、动力电池", role: "全球动力电池龙头", signal: "跟踪放量突破与回踩承接", risk: "短线波动受锂价与新能源车景气预期影响" },
      { symbol: "002594.SZ", name: "比亚迪", theme: "智能驾驶、出口链", role: "新能源整车与电池一体化龙头", signal: "观察低波动整理后的均线抬升", risk: "价格战会压制利润率预期" }
    ]
  },
  {
    sector: "白酒",
    stocks: [
      { symbol: "600519.SH", name: "贵州茅台", theme: "消费复苏、现金流资产", role: "高端白酒定价锚", signal: "观察机构底仓稳定性与成交额变化", risk: "估值弹性弱，趋势确认前不宜追高" }
    ]
  },
  {
    sector: "医疗器械",
    stocks: [
      { symbol: "300760.SZ", name: "迈瑞医疗", theme: "国产替代、设备更新", role: "医疗设备平台型龙头", signal: "关注长均线附近承接强度", risk: "行业政策扰动仍会影响估值修复节奏" }
    ]
  },
  {
    sector: "半导体",
    stocks: [
      { symbol: "688981.SH", name: "中芯国际", theme: "先进封装、国产算力", role: "晶圆代工核心龙头", signal: "板块资金聚焦时通常先看成交额确认", risk: "高弹性行业，需防止题材拥挤后的快速回撤" }
    ]
  },
  {
    sector: "人工智能",
    stocks: [
      { symbol: "002230.SZ", name: "科大讯飞", theme: "大模型、算力基础设施", role: "中文 AI 应用龙头", signal: "观察分歧震荡后的右侧突破", risk: "题材交易属性强，单日冲高回落概率较高" }
    ]
  },
  {
    sector: "证券",
    stocks: [
      { symbol: "600030.SH", name: "中信证券", theme: "活跃资本市场", role: "券商板块权重龙头", signal: "指数成交量回暖时具备 Beta 修复弹性", risk: "高度依赖两市成交额连续性" }
    ]
  },
  {
    sector: "房地产",
    stocks: [
      { symbol: "000002.SZ", name: "万科A", theme: "政策修复、信用出清", role: "房企信用样本龙头", signal: "只做风险观察，不做趋势确认前的主动加仓", risk: "若继续弱于均线系统，仍按回避名单处理" }
    ]
  }
];

export const SectorConfig: React.FC = () => {
  const [sectors, setSectors] = useState<HierarchicalSectorConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    if (sectors.length > 0) {
      const maxPage = Math.ceil(sectors.length / ITEMS_PER_PAGE);
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
      }
    } else {
      setCurrentPage(1);
    }
  }, [sectors.length, currentPage]);

  const totalPages = Math.max(1, Math.ceil(sectors.length / ITEMS_PER_PAGE));
  const activePage = currentPage > totalPages ? totalPages : currentPage;
  const pageStart = sectors.length === 0 ? 0 : (activePage - 1) * ITEMS_PER_PAGE + 1;
  const pageEnd = Math.min(activePage * ITEMS_PER_PAGE, sectors.length);
  const paginatedSectors = sectors.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  // 1. Sector Modal Drawer States (Only asks for Sector Name)
  const [isOpenSectorModal, setIsOpenSectorModal] = useState(false);
  const [sectorNameInput, setSectorNameInput] = useState('');
  const [sectorIndexToEdit, setSectorIndexToEdit] = useState<number | null>(null);
  const [sectorModalError, setSectorModalError] = useState('');

  // 2. Stock Modal Drawer States (Triggered inside a Sector)
  const [isOpenStockModal, setIsOpenStockModal] = useState(false);
  const [targetSectorIndex, setTargetSectorIndex] = useState<number | null>(null);
  const [targetStockIndex, setTargetStockIndex] = useState<number | null>(null);
  const [stockFormData, setStockFormData] = useState<SectorStockConfig>({
    symbol: '',
    name: '',
    theme: '',
    role: '',
    signal: '',
    risk: ''
  });
  const [stockModalError, setStockModalError] = useState('');
  const [isLookupLoading, setIsLookupLoading] = useState(false);

  const fetchConfig = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/today-market/config`);
      if (response.ok) {
        const json = await response.json();
        setSectors(json);
      } else {
        console.warn('Backend configuration center offline. Using mockup defaults.');
        setSectors(DEFAULT_HIERARCHICAL_LEADERS);
      }
    } catch (e) {
      console.error(e);
      setSectors(DEFAULT_HIERARCHICAL_LEADERS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchConfig();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Update symbol state synchronously when user types
  const handleStockSymbolChange = (symbolInput: string) => {
    const cleanSym = symbolInput.toUpperCase().trim();
    setStockFormData(prev => ({ ...prev, symbol: cleanSym }));
  };

  // Manually fetch stock details dynamically by clicking refresh button or pressing Enter
  const handleLookupStock = async () => {
    const cleanSym = stockFormData.symbol.toUpperCase().trim();
    if (!cleanSym) {
      setStockModalError('请输入股票代码再进行查询。');
      return;
    }

    const symbolRegex = /^\d{6}\.(SH|SZ)$/;
    if (!symbolRegex.test(cleanSym)) {
      setStockModalError('股票代码格式不正确。必须为 6 位数字加 .SH 或 .SZ (例如: 600519.SH / 300750.SZ)。');
      return;
    }

    setIsLookupLoading(true);
    setStockModalError('');

    try {
      // 1. Check local high-fidelity presets first
      const preset = PRESET_DEMO_STOCKS[cleanSym];
      if (preset) {
        setStockFormData(prev => ({
          ...prev,
          name: preset.name || '',
          theme: preset.theme || '',
          role: preset.role || '',
          signal: preset.signal || '',
          risk: preset.risk || ''
        }));
        setIsLookupLoading(false);
        return;
      }

      // 2. Query the database stocks table (which fetches from Sina hq API if not found)
      const response = await fetch(`${API_BASE_URL}/api/stocks/${cleanSym}`);
      if (response.ok) {
        const stock = await response.json();
        setStockFormData(prev => ({
          ...prev,
          name: stock.name || '',
          theme: stock.sector || '',
          role: `${stock.name}是${stock.sector || '相关'}板块行业龙头`,
          signal: '均线系统多头排列，关注整理收缩后的放量买入突破点',
          risk: '防守关键长短期均线，破位则按交易纪律清仓回避'
        }));
      } else {
        setStockModalError('未能获取到该股票的实时数据，请检查代码是否存在，或手动录入。');
      }
    } catch (err) {
      console.error('Failed to fetch stock symbol details from backend:', err);
      setStockModalError('连接服务器失败，请稍后重试或手动录入。');
    } finally {
      setIsLookupLoading(false);
    }
  };

  // ==============================================================
  // SECTOR OPERATION FUNCTIONS (板块级别的维护：仅维护板块名称)
  // ==============================================================
  const handleOpenSectorModal = (index: number | null) => {
    setSectorModalError('');
    if (index !== null) {
      setSectorIndexToEdit(index);
      setSectorNameInput(sectors[index].sector);
    } else {
      setSectorIndexToEdit(null);
      setSectorNameInput('');
    }
    setIsOpenSectorModal(true);
  };

  const handleSaveSector = () => {
    const cleanName = sectorNameInput.trim();
    if (!cleanName) {
      setSectorModalError('板块名称不能为空。');
      return;
    }

    const updatedSectors = [...sectors];
    if (sectorIndexToEdit !== null) {
      // Edit Sector Name
      updatedSectors[sectorIndexToEdit].sector = cleanName;
    } else {
      // Add New Sector ONLY (stocks is empty initial)
      // Check duplicate
      if (updatedSectors.some(s => s.sector === cleanName)) {
        setSectorModalError('已存在同名板块。');
        return;
      }
      updatedSectors.push({
        sector: cleanName,
        stocks: []
      });
      // Redirect to the last page for new sector
      const newTotalPages = Math.ceil(updatedSectors.length / ITEMS_PER_PAGE);
      setCurrentPage(newTotalPages);
    }

    setSectors(updatedSectors);
    setIsOpenSectorModal(false);
  };

  const handleDeleteSector = (index: number) => {
    if (window.confirm(`确认删除「${sectors[index].sector}」板块吗？这会同时移除该板块下挂载的全部股票配置。`)) {
      const updated = sectors.filter((_, i) => i !== index);
      setSectors(updated);
    }
  };

  // ==============================================================
  // STOCK OPERATION FUNCTIONS (股票维度的维护：仅在板块内录入股票参数)
  // ==============================================================
  const handleOpenStockModal = (sectorIdx: number, stockIdx: number | null) => {
    setStockModalError('');
    setTargetSectorIndex(sectorIdx);
    if (stockIdx !== null) {
      setTargetStockIndex(stockIdx);
      setStockFormData({ ...sectors[sectorIdx].stocks[stockIdx] });
    } else {
      setTargetStockIndex(null);
      setStockFormData({
        symbol: '',
        name: '',
        theme: '',
        role: '',
        signal: '',
        risk: ''
      });
    }
    setIsOpenStockModal(true);
  };

  const handleSaveStock = () => {
    const { symbol, name, theme, role, signal, risk } = stockFormData;
    if (targetSectorIndex === null) return;

    if (!symbol.trim() || !name.trim() || !theme.trim() || !role.trim() || !signal.trim() || !risk.trim()) {
      setStockModalError('所有配置参数均不能为空，请输入完整。');
      return;
    }

    const symbolRegex = /^\d{6}\.(SH|SZ)$/;
    if (!symbolRegex.test(symbol)) {
      setStockModalError('代码格式不正确。必须为 6 位数字加 .SH 或 .SZ (例如: 600519.SH / 300750.SZ)。');
      return;
    }

    const updatedSectors = [...sectors];
    const sectorStocks = [...updatedSectors[targetSectorIndex].stocks];

    if (targetStockIndex !== null) {
      // Edit existing stock inside this sector
      sectorStocks[targetStockIndex] = { ...stockFormData };
    } else {
      // Check duplicate symbol in same sector
      if (sectorStocks.some(s => s.symbol === symbol)) {
        setStockModalError('该板块中已录入该股票，请勿重复添加。');
        return;
      }
      // Add new stock
      sectorStocks.push({ ...stockFormData });
    }

    updatedSectors[targetSectorIndex].stocks = sectorStocks;
    setSectors(updatedSectors);
    setIsOpenStockModal(false);
  };

  const handleDeleteStock = (sectorIdx: number, stockIdx: number) => {
    const targetSector = sectors[sectorIdx];
    const targetStock = targetSector.stocks[stockIdx];
    if (window.confirm(`确认将股票「${targetStock.name} (${targetStock.symbol})」从「${targetSector.sector}」板块中移除吗？`)) {
      const updatedSectors = [...sectors];
      updatedSectors[sectorIdx].stocks = targetSector.stocks.filter((_, i) => i !== stockIdx);
      setSectors(updatedSectors);
    }
  };

  // ==============================================================
  // PERSISTENCE FUNCTIONS
  // ==============================================================
  const handleSaveToBackend = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/discovery/today-market/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectors)
      });
      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setErrorMessage('保存失败，后端配置接口返回非正常响应。');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('保存失败，未能连接到 SQLite 持久化数据库服务。已缓存至当前浏览器会话中。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('确认要重置为系统出厂预设的行业板块及龙头个股列表吗？此操作需要点击“保存配置”才会持久化。')) {
      setSectors(DEFAULT_HIERARCHICAL_LEADERS);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Sliders size={22} style={{ color: '#1e5eff' }} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>板块与股票配置 (Sector & Stock Settings)</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.6 }}>
              管理行业板块分类。**新增板块时只需录入板块名称；只有在具体板块内新增股票时，才会维护题材、地位及风控防守警告**，保证逻辑的高内聚。
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleResetToDefaults}
            style={{
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <RotateCcw size={14} />
            重置预设
          </button>

          <button
            onClick={() => handleOpenSectorModal(null)}
            style={{
              background: '#1e5eff',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(30, 94, 255, 0.16)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#164ecf'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1e5eff'}
          >
            <FolderPlus size={16} />
            新增板块
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="glass-panel" style={{ padding: '16px 18px', background: '#fff7ed', borderColor: '#fed7aa', color: '#9a3412', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          {errorMessage}
        </div>
      )}

      {/* Main Board Layout */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <Sliders size={32} className="spin-active" style={{ color: '#1e5eff', animation: 'spin 1.5s linear infinite' }} />
          <span style={{ fontSize: '13px', color: '#64748b' }}>正在拉取板块与个股的层级关系树...</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
            gap: '20px'
          }}>
          
          {paginatedSectors.map((sectorObj, index) => {
            const sectorIdx = (activePage - 1) * ITEMS_PER_PAGE + index;
            return (
              <div 
                key={sectorIdx}
                className="glass-panel"
                style={{
                  padding: '16px 20px',
                  background: '#ffffff',
                  borderLeft: '4px solid #1e5eff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Sector Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                      {sectorObj.sector}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #edf2f7' }}>
                      {sectorObj.stocks.length} 只股票
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenStockModal(sectorIdx, null)}
                      style={{
                        background: 'rgba(30, 94, 255, 0.06)',
                        color: '#1e5eff',
                        border: '1px solid rgba(30, 94, 255, 0.15)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 94, 255, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(30, 94, 255, 0.06)'}
                    >
                      <Plus size={12} />
                      添加股票
                    </button>

                    <button
                      onClick={() => handleOpenSectorModal(sectorIdx)}
                      style={{
                        background: '#f8fafc',
                        color: '#475569',
                        border: '1px solid #e2e8f0',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="重命名板块"
                    >
                      <Edit2 size={12} />
                    </button>

                    <button
                      onClick={() => handleDeleteSector(sectorIdx)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.04)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="删除整个板块"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Sector Stocks List */}
                {sectorObj.stocks.length === 0 ? (
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #edf2f7', textAlign: 'center' }}>
                    <HelpCircle size={18} style={{ color: '#94a3b8', margin: '0 auto 6px auto' }} />
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>暂无个股，请点击「添加股票」配置龙头。</span>
                  </div>
                ) : (
                  <div style={{ overflow: 'hidden', border: '1px solid #edf2f7', borderRadius: '6px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '110px' }}>股票</th>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '110px' }}>题材</th>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>关注与风控</th>
                          <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '60px', textAlign: 'right' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectorObj.stocks.map((stock, stockIdx) => (
                          <tr key={stockIdx} style={{ borderBottom: stockIdx === sectorObj.stocks.length - 1 ? 'none' : '1px solid #edf2f7' }}>
                            <td style={{ padding: '8px 12px', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <strong style={{ fontSize: '12px', color: '#1e293b' }}>{stock.name}</strong>
                                <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace", marginTop: '1px' }}>{stock.symbol}</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '11px', color: '#475569', verticalAlign: 'middle', fontWeight: '500' }}>
                              {stock.theme}
                            </td>
                            <td style={{ padding: '8px 12px', fontSize: '10px', lineHeight: 1.4, verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ color: '#1e5eff' }}>触发: {stock.signal}</span>
                                <span style={{ color: '#f59e0b' }}>防守: {stock.risk}</span>
                              </div>
                            </td>
                            <td style={{ padding: '8px 12px', verticalAlign: 'middle', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenStockModal(sectorIdx, stockIdx)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#1e5eff',
                                    padding: '4px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                  title="编辑股票"
                                >
                                  <Edit2 size={12} />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStock(sectorIdx, stockIdx)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#ef4444',
                                    padding: '4px',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                  title="移除股票"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(226,232,240,0.8)', marginTop: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                展示 {pageStart}-{pageEnd} 个板块 / 共 {sectors.length} 个
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={activePage <= 1}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    border: '1px solid rgba(203,213,225,0.9)',
                    borderRadius: '8px',
                    background: activePage <= 1 ? '#f8fafc' : '#ffffff',
                    color: activePage <= 1 ? '#cbd5e1' : '#334155',
                    cursor: activePage <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  上一页
                </button>

                <span style={{ minWidth: '64px', textAlign: 'center', fontSize: '12px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' }}>
                  {activePage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={activePage >= totalPages}
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    border: '1px solid rgba(203,213,225,0.9)',
                    borderRadius: '8px',
                    background: activePage >= totalPages ? '#f8fafc' : '#ffffff',
                    color: activePage >= totalPages ? '#cbd5e1' : '#334155',
                    cursor: activePage >= totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                >
                  下一页
                </button>
              </div>
            </div>
          )}

        {/* Bottom Save Persist Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px' }}>
              <Info size={14} style={{ color: '#1e5eff' }} />
              <span>当前配置了 {sectors.length} 个板块共计 {sectors.reduce((sum, s) => sum + s.stocks.length, 0)} 只个股，点击右侧保存生效。</span>
            </div>

            <button
              onClick={handleSaveToBackend}
              disabled={isSaving}
              style={{
                background: saveSuccess ? '#10b981' : '#1e5eff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(30, 94, 255, 0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              {saveSuccess ? (
                <>
                  <Check size={16} />
                  配置已持久化成功！
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isSaving ? '正在保存...' : '保存配置持久化'}
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* 1. SECTOR MODAL (Only asks for Sector Name) */}
      {/* ============================================================== */}
      {isOpenSectorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div style={{
            width: '420px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #edf2f7',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                {sectorIndexToEdit !== null ? '重命名板块' : '新增行业板块'}
              </h3>
              <button 
                onClick={() => setIsOpenSectorModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {sectorModalError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  {sectorModalError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>行业板块名称 (Sector Name)</label>
                <input
                  type="text"
                  value={sectorNameInput}
                  onChange={(e) => setSectorNameInput(e.target.value)}
                  placeholder="例如: 电气设备 / 软件服务"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', outline: 'none', fontSize: '13px', background: '#f8fafc' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSector()}
                />
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>板块作为个股分类的聚合容器，创建后可在其下录入核心龙头。</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsOpenSectorModal(false)}
                style={{
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveSector}
                style={{
                  background: '#1e5eff',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. STOCK MODAL (Only opened when user adds/edits a stock in a sector) */}
      {/* ============================================================== */}
      {isOpenStockModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div style={{
            width: '520px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #edf2f7',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                {targetStockIndex !== null ? '修改股票参数' : `录入股票 (所属板块: ${targetSectorIndex !== null ? sectors[targetSectorIndex].sector : ''})`}
              </h3>
              <button 
                onClick={() => setIsOpenStockModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '480px', overflowY: 'auto' }}>
              
              {stockModalError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} />
                  {stockModalError}
                </div>
              )}

              {/* Symbol & Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>股票代码 (Symbol)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={stockFormData.symbol}
                      onChange={(e) => handleStockSymbolChange(e.target.value)}
                      placeholder="例如: 300750.SZ"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', outline: 'none', fontSize: '13px', background: '#f8fafc', fontFamily: "'JetBrains Mono', monospace" }}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookupStock()}
                    />
                    <button
                      type="button"
                      onClick={handleLookupStock}
                      disabled={isLookupLoading}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      title="刷新/查询股票信息"
                      onMouseEnter={(e) => { if (!isLookupLoading) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e5eff'; } }}
                      onMouseLeave={(e) => { if (!isLookupLoading) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; } }}
                    >
                      <RefreshCw size={16} className={isLookupLoading ? 'spin-active' : ''} style={{ animation: isLookupLoading ? 'spin 1.5s linear infinite' : 'none' }} />
                    </button>
                  </div>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>支持输入代码后点击右侧刷新按钮或按回车查询</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>股票名称 (Name)</label>
                  <input
                    type="text"
                    value={stockFormData.name}
                    onChange={(e) => setStockFormData({ ...stockFormData, name: e.target.value })}
                    placeholder="例如: 宁德时代"
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', outline: 'none', fontSize: '13px', background: '#f8fafc' }}
                  />
                </div>
              </div>

              {/* Theme */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>题材概念 (Theme)</label>
                <input
                  type="text"
                  value={stockFormData.theme}
                  onChange={(e) => setStockFormData({ ...stockFormData, theme: e.target.value })}
                  placeholder="例如: 储能、动力电池、固态电池"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', background: '#f8fafc' }}
                />
              </div>

              {/* Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>行业地位与核心价值 (Role)</label>
                <textarea
                  value={stockFormData.role}
                  onChange={(e) => setStockFormData({ ...stockFormData, role: e.target.value })}
                  placeholder="全球动力电池与储能电池双料绝对龙头..."
                  rows={2}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', background: '#f8fafc', resize: 'vertical' }}
                />
              </div>

              {/* Signal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>买入信号/突破关注点 (Signal)</label>
                <input
                  type="text"
                  value={stockFormData.signal}
                  onChange={(e) => setStockFormData({ ...stockFormData, signal: e.target.value })}
                  placeholder="跟踪放量突破与回踩承接"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', background: '#f8fafc' }}
                />
              </div>

              {/* Risk */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>风控防守/风险警告 (Risk)</label>
                <input
                  type="text"
                  value={stockFormData.risk}
                  onChange={(e) => setStockFormData({ ...stockFormData, risk: e.target.value })}
                  placeholder="短线波动受锂价与车企景气预期影响"
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', background: '#f8fafc' }}
                />
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsOpenStockModal(false)}
                style={{
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveStock}
                style={{
                  background: '#1e5eff',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
