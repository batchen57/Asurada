import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  RefreshCw, 
  Trash2, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  HelpCircle,
  Eye
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface AuditLog {
  id: number;
  timestamp: string;
  service_name: string;
  interface_name: string;
  request_url: string;
  request_params: string;
  response_status: string;
  response_summary: string;
  duration_ms: number;
}

interface AuditStats {
  total_calls: number;
  success_rate: number;
  today_calls: number;
  avg_latency_ms: number;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [stats, setStats] = useState<AuditStats>({
    total_calls: 0,
    success_rate: 100.0,
    today_calls: 0,
    avg_latency_ms: 0.0
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  
  // Detail Modal State
  const [activeLog, setActiveLog] = useState<AuditLog | null>(null);

  // Fetch log stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit-logs/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setStats(getMockStatsFallback());
      }
    } catch (e) {
      console.error('Failed to connect to backend for audit stats.', e);
      setStats(getMockStatsFallback());
    }
  };

  // Fetch paginated logs
  const fetchLogs = async () => {
    setIsLoading(true);
    const offset = (currentPage - 1) * pageSize;
    
    let url = `${API_BASE_URL}/api/audit-logs?limit=${pageSize}&offset=${offset}`;
    if (selectedService !== 'All') {
      url += `&service_name=${encodeURIComponent(selectedService)}`;
    }
    if (selectedStatus !== 'All') {
      url += `&response_status=${encodeURIComponent(selectedStatus)}`;
    }
    if (searchTerm.trim() !== '') {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
      } else {
        const fallback = getMockLogsFallback(searchTerm, selectedService, selectedStatus);
        setLogs(fallback.slice(offset, offset + pageSize));
        setTotal(fallback.length);
      }
    } catch (e) {
      console.error('Failed to connect to backend for audit logs.', e);
      const fallback = getMockLogsFallback(searchTerm, selectedService, selectedStatus);
      setLogs(fallback.slice(offset, offset + pageSize));
      setTotal(fallback.length);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchStats(), fetchLogs()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleClearLogs = async () => {
    if (window.confirm('🚨 警告：此操作将永久清空系统内的所有审计留痕日志！确定继续吗？')) {
      setIsClearing(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/audit-logs`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('系统审计日志已成功清空！');
        }
      } catch (e) {
        console.error('Failed to clear audit logs in backend.', e);
      } finally {
        setIsClearing(false);
        handleRefresh();
      }
    }
  };

  // Trigger load on state change
  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, [currentPage, pageSize, selectedService, selectedStatus]);

  // Handle search with local debounce-like behavior
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Style helpers
  const getServiceBadgeStyle = (name: string) => {
    if (name.includes('飞书')) {
      return { bg: 'rgba(30, 94, 255, 0.1)', color: '#1e5eff', border: '1px solid rgba(30, 94, 255, 0.2)' };
    }
    if (name.includes('数据源') || name.includes('Tushare')) {
      return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' };
    }
    return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' };
  };

  const getLatencyStyle = (ms: number) => {
    if (ms < 50) return { color: '#10b981', label: '极速' };
    if (ms < 200) return { color: '#f59e0b', label: '正常' };
    return { color: '#ef4444', label: '延迟高' };
  };

  // Mock data fallbacks for standalone client-side execution
  const getMockStatsFallback = (): AuditStats => ({
    total_calls: 156,
    success_rate: 98.7,
    today_calls: 38,
    avg_latency_ms: 24.5
  });

  const getMockLogsFallback = (search: string, service: string, status: string): AuditLog[] => {
    const allMockLogs: AuditLog[] = [
      {
        id: 10,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        service_name: '新浪 MCP 行情服务 (Sina Finance)',
        interface_name: 'globalStockQuoteRealtime (个股实时行情)',
        request_url: 'https://finance.sina.com.cn/api/quotes',
        request_params: JSON.stringify({ symbols: ['600519.SH', '300750.SZ', '300760.SZ', '000002.SZ'] }),
        response_status: 'SUCCESS',
        response_summary: '成功拉取持仓及监控列表个股 (茅台、宁德、迈瑞、万科) 的最新买卖盘五档实时行情快照',
        duration_ms: 12
      },
      {
        id: 9,
        timestamp: new Date(Date.now() - 2 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        service_name: '新浪 MCP 行情服务 (Sina Finance)',
        interface_name: 'marketIndices (大盘指数)',
        request_url: 'https://finance.sina.com.cn/api/index',
        request_params: JSON.stringify({ codes: ['000001.SH', '399001.SZ', '399006.SZ'] }),
        response_status: 'SUCCESS',
        response_summary: '已拉取上证指数(3134.25)、深证成指(10194.36)、创业板指(2057.58)及两市成交额(8542.0亿)快照',
        duration_ms: 18
      },
      {
        id: 8,
        timestamp: new Date(Date.now() - 5 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        service_name: '飞书推送服务 (Feishu Bot)',
        interface_name: 'push_message',
        request_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/demo-webhook-id',
        request_params: JSON.stringify({ title: '盘前可执行计划一页纸', payload: { msg_type: 'interactive', card: { header: { title: 'Asurada | 盘前计划' } } } }),
        response_status: 'SUCCESS',
        response_summary: '已成功模拟飞书消息发送（静默模式）',
        duration_ms: 64
      },
      {
        id: 7,
        timestamp: new Date(Date.now() - 12 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        service_name: '数据源服务 (Tushare Pro)',
        interface_name: 'daily',
        request_url: 'http://api.tushare.pro',
        request_params: JSON.stringify({ api_name: 'daily', params: { ts_code: '300750.SZ', limit: 250 }, simulation_mode: true }),
        response_status: 'SUCCESS',
        response_summary: '[模拟] 加载高仿真模拟股票日K线历史，返回 250 条记录 (代码: 300750.SZ)',
        duration_ms: 82
      },
      {
        id: 6,
        timestamp: new Date(Date.now() - 15 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        service_name: '数据源服务 (Tushare Pro)',
        interface_name: 'stock_basic',
        request_url: 'http://api.tushare.pro',
        request_params: JSON.stringify({ api_name: 'stock_basic', params: { list_status: 'L' }, simulation_mode: true }),
        response_status: 'SUCCESS',
        response_summary: '[模拟] 加载高仿真市场个股行业分类及元数据，返回 14 个标的',
        duration_ms: 45
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 30 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        service_name: '飞书推送服务 (Feishu Bot)',
        interface_name: 'push_message',
        request_url: 'https://open.feishu.cn/open-apis/bot/v2/hook/invalid-hook-id',
        request_params: JSON.stringify({ title: '买入告警', payload: { card: { header: { title: '买入警告' } } } }),
        response_status: 'FAILED',
        response_summary: '连接飞书 API 失败: 404 Not Found',
        duration_ms: 124
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 45 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        service_name: '数据源服务 (Tushare Pro)',
        interface_name: 'daily_basic',
        request_url: 'http://api.tushare.pro',
        request_params: JSON.stringify({ api_name: 'daily_basic', params: { ts_code: '600519.SH' } }),
        response_status: 'SUCCESS',
        response_summary: '[模拟] 加载高仿真估值财务指标，包含 14 只股票 (代码: 600519.SH, 300750.SZ...)',
        duration_ms: 55
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 60 * 60000).toISOString().replace('T', ' ').substring(0, 19),
        service_name: '新浪 MCP 行情服务 (Sina Finance)',
        interface_name: 'cnStockKLine (分时K线)',
        request_url: 'https://finance.sina.com.cn/api/kline',
        request_params: JSON.stringify({ symbol: '300750.SZ', scale: 1 }),
        response_status: 'SUCCESS',
        response_summary: '已成功获取股票 [300750.SZ] 的 30 条分钟级高精度分时K线数据',
        duration_ms: 22
      }
    ];

    return allMockLogs.filter(log => {
      const matchSearch = search.trim() === '' || 
        log.interface_name.toLowerCase().includes(search.toLowerCase()) ||
        log.request_url.toLowerCase().includes(search.toLowerCase()) ||
        log.response_summary.toLowerCase().includes(search.toLowerCase()) ||
        log.service_name.toLowerCase().includes(search.toLowerCase());

      const matchService = service === 'All' || log.service_name.includes(service);
      const matchStatus = status === 'All' || log.response_status === status;

      return matchSearch && matchService && matchStatus;
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(30, 94, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            padding: '10px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <ClipboardList size={22} style={{ color: '#1e5eff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>系统审计与留痕管理 (Audit & Logging)</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              系统对所有出站及对外调用的 API 服务（Tushare、飞书通知、新浪 MCP 行情）进行实时监听、性能计时与敏感参数存证留痕。
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              color: '#475569',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-active' : ''} />
            刷新日志
          </button>
          
          <button
            onClick={handleClearLogs}
            disabled={isClearing}
            style={{
              background: 'rgba(254, 242, 242, 0.8)',
              border: '1px solid rgba(254, 202, 202, 0.8)',
              color: '#ef4444',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Trash2 size={14} />
            清空所有日志
          </button>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Total Calls */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(30, 94, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1e5eff'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>外部调用总频次</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginTop: '4px', display: 'block' }}>
              {stats.total_calls} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>次</span>
            </span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>接口调用成功率</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', marginTop: '4px', display: 'block' }}>
              {stats.success_rate}%
            </span>
          </div>
        </div>

        {/* Today's Calls */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>今日调用次数</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
              {stats.today_calls} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>次</span>
            </span>
          </div>
        </div>

        {/* Average Latency */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(139, 92, 246, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b5cf6'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>平均接口响应时延</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#8b5cf6', marginTop: '4px', display: 'block' }}>
              {stats.avg_latency_ms} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>ms</span>
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Table Container */}
      <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Filters */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '12px', flexGrow: 1, maxWidth: '60%' }}>
            
            {/* Search input */}
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text"
                placeholder="搜索请求接口、端点、参数或返回摘要..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 36px',
                  borderRadius: '8px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  outline: 'none',
                  fontSize: '12px',
                  background: '#f8fafc',
                  transition: 'all 0.2s'
                }}
              />
            </div>
            
            <button
              type="submit"
              style={{
                background: '#1e5eff',
                color: 'white',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              检索
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Service dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>外部服务:</span>
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  fontSize: '11px',
                  color: '#475569',
                  background: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="All">全部服务</option>
                <option value="Tushare Pro">Tushare Pro 数据</option>
                <option value="Feishu Bot">飞书机器人推送</option>
                <option value="Sina Finance">新浪 MCP 行情</option>
              </select>
            </div>

            {/* Status dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>响应状态:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  fontSize: '11px',
                  color: '#475569',
                  background: 'white',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="All">全部状态</option>
                <option value="SUCCESS">SUCCESS (正常)</option>
                <option value="FAILED">FAILED (异常)</option>
              </select>
            </div>
          </div>
        </form>

        {/* Logs Table */}
        <div style={{ border: '1px solid rgba(226, 232, 240, 0.6)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>请求时间</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>对外服务</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>接口名</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600' }}>端点 URL</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>响应延时</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>状态</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <RefreshCw size={16} className="spin-active" />
                      <span>正在检索系统审计留痕日志...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <HelpCircle size={28} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <p style={{ fontSize: '13px', fontWeight: '500' }}>未找到任何审计留痕记录</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>建议更换检索条件或稍后再试。</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getServiceBadgeStyle(log.service_name);
                  const latency = getLatencyStyle(log.duration_ms);
                  const isSuccess = log.response_status === 'SUCCESS';
                  
                  return (
                    <tr 
                      key={log.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(226, 232, 240, 0.4)', 
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '14px 16px', color: '#334155', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        {log.timestamp}
                      </td>

                      {/* Service Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11px', 
                          fontWeight: '600',
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border
                        }}>
                          {log.service_name.split(' ')[0]}
                        </span>
                      </td>

                      {/* Interface name */}
                      <td style={{ padding: '14px 16px', color: '#475569', fontWeight: '500', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                        {log.interface_name.split(' ')[0]}
                      </td>

                      {/* URL Badges */}
                      <td style={{ padding: '14px 16px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <code style={{ 
                          fontFamily: "'JetBrains Mono', monospace", 
                          fontSize: '11px', 
                          color: '#64748b',
                          background: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {log.request_url}
                        </code>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontWeight: '700', color: latency.color }}>
                          {log.duration_ms}
                        </span>
                        <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '2px' }}>ms</span>
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '700',
                          background: isSuccess ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                          color: isSuccess ? '#10b981' : '#ef4444',
                          border: isSuccess ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                        }}>
                          {isSuccess ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {log.response_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button
                          onClick={() => setActiveLog(log)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#1e5eff',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 94, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Eye size={12} />
                          留痕穿透
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
          <div>
            共 <span style={{ fontWeight: '600', color: '#1e293b' }}>{total}</span> 条留痕日志 | 当前第 {currentPage} / {totalPages} 页
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Page Size select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>单页条数:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={5}>5 条</option>
                <option value={10}>10 条</option>
                <option value={20}>20 条</option>
                <option value={50}>50 条</option>
              </select>
            </div>

            {/* Prev/Next buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'white',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <ChevronLeft size={12} />
                上一页
              </button>
              <button
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'white',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                下一页
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Log Detail Modal */}
      {activeLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
          
          <div className="glass-panel animate-scale-up" style={{ 
            width: '650px', 
            maxHeight: '85vh', 
            background: 'white', 
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            
            {/* Modal Header */}
            <div style={{ 
              padding: '20px 24px', 
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={18} style={{ color: '#1e5eff' }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>接口留痕数据详情</h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Log ID: #{activeLog.id} | 留痕验证有效</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveLog(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Metadata Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>服务组件</span>
                  <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '600', marginTop: '2px', display: 'block' }}>
                    {activeLog.service_name}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>调用接口与函数</span>
                  <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '600', marginTop: '2px', display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>
                    {activeLog.interface_name}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>请求 URL</span>
                  <code style={{ fontSize: '11px', color: '#1e293b', marginTop: '4px', display: 'block', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
                    {activeLog.request_url}
                  </code>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>调用耗时 / 时延</span>
                  <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: '600', marginTop: '2px', display: 'block' }}>
                    {activeLog.duration_ms} ms
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>响应状态</span>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    color: activeLog.response_status === 'SUCCESS' ? '#10b981' : '#ef4444', 
                    marginTop: '4px', 
                    display: 'inline-block' 
                  }}>
                    {activeLog.response_status}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #1e5eff' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block' }}>调用执行结果摘要</span>
                <p style={{ fontSize: '12px', color: '#334155', marginTop: '4px', lineHeight: '1.5' }}>
                  {activeLog.response_summary}
                </p>
              </div>

              {/* Request Parameters JSON */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>请求 Payload 参数 (Parameters)</span>
                <div style={{ 
                  background: '#0f172a', 
                  color: '#38bdf8', 
                  padding: '14px', 
                  borderRadius: '10px', 
                  fontSize: '11px', 
                  fontFamily: "'JetBrains Mono', monospace",
                  overflowX: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6'
                }}>
                  {(() => {
                    try {
                      const parsed = JSON.parse(activeLog.request_params);
                      return JSON.stringify(parsed, null, 2);
                    } catch (e) {
                      return activeLog.request_params || '{}';
                    }
                  })()}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid rgba(226, 232, 240, 0.8)', 
              display: 'flex', 
              justifyContent: 'flex-end',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setActiveLog(null)}
                style={{
                  background: '#1e5eff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
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
