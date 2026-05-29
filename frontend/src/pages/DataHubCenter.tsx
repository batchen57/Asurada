import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  Download,
  RefreshCw,
  Server,
  ShieldCheck,
  Table
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface DataHubSourceStatus {
  name: string;
  status: string;
  detail: string;
  requests_made?: number;
  quota_limit?: number;
  quota_remaining?: number;
  rate_limit_per_min?: number;
  current_rate?: number;
}

interface DataHubTableSummary {
  name: string;
  label: string;
  count: number;
  cols: string[];
}

interface DataHubOverview {
  generated_at: string;
  database_url: string;
  sources: DataHubSourceStatus[];
  tables: DataHubTableSummary[];
}

interface DataHubTableResponse {
  table: DataHubTableSummary;
  rows: Array<Record<string, string | number | boolean | null>>;
  limit: number;
  offset: number;
  total: number;
}

const fallbackTables: DataHubTableSummary[] = [
  { name: 'stocks', label: '证券名录缓存表', count: 4, cols: ['id', 'symbol', 'name', 'sector', 'is_active'] },
  { name: 'daily_prices', label: '历史日K缓存表', count: 1000, cols: ['id', 'symbol', 'date', 'open', 'high', 'low', 'close', 'volume', 'ma50', 'ma200'] },
  { name: 'positions', label: '投资组合持仓表', count: 3, cols: ['id', 'symbol', 'name', 'volume', 'available_volume', 'cost_price', 'current_price'] },
  { name: 'signals', label: '策略信号触发日志表', count: 3, cols: ['id', 'timestamp', 'symbol', 'name', 'direction', 'strategy_type', 'status'] },
  { name: 'tasks', label: '今日流程待办表', count: 4, cols: ['id', 'phase', 'task_name', 'status'] },
  { name: 'configuration', label: '系统设置键值表', count: 14, cols: ['id', 'key', 'value'] },
  { name: 'audit_logs', label: '接口调用审计日志表', count: 0, cols: ['id', 'timestamp', 'service_name', 'interface_name', 'response_status', 'duration_ms'] }
];

const fallbackRows: Record<string, Array<Record<string, string | number | boolean | null>>> = {
  stocks: [
    { id: 1, symbol: '600519.SH', name: '贵州茅台', sector: '白酒', is_active: true },
    { id: 2, symbol: '300750.SZ', name: '宁德时代', sector: '新能源锂电', is_active: true },
    { id: 3, symbol: '300760.SZ', name: '迈瑞医疗', sector: '医疗器械', is_active: true },
    { id: 4, symbol: '000002.SZ', name: '万科A', sector: '房地产', is_active: true }
  ],
  positions: [
    { id: 1, symbol: '600519.SH', name: '贵州茅台', volume: 100, available_volume: 100, cost_price: 1620, current_price: 1688.5 },
    { id: 2, symbol: '300750.SZ', name: '宁德时代', volume: 200, available_volume: 200, cost_price: 185, current_price: 195.8 },
    { id: 3, symbol: '300760.SZ', name: '迈瑞医疗', volume: 100, available_volume: 100, cost_price: 275, current_price: 286.66 }
  ]
};

const getFallbackOverview = (): DataHubOverview => ({
  generated_at: new Date().toLocaleString('zh-CN'),
  database_url: 'sqlite:///backend/asurada.db',
  sources: [
    { name: 'Tushare Pro', status: '模拟模式', detail: '后端离线时展示内置高仿真缓存数据。' },
    { name: 'Sina Finance MCP', status: '离线演示', detail: '实时行情同步将在后端启动后写入审计日志。', requests_made: 142, quota_limit: 2000, quota_remaining: 1858 },
    { name: 'SQLite Cache', status: '只读演示', detail: '当前为前端 fallback 数据视图。' }
  ],
  tables: fallbackTables
});

export const DataHubCenter: React.FC = () => {
  const [overview, setOverview] = useState<DataHubOverview>(getFallbackOverview());
  const [selectedTable, setSelectedTable] = useState<string>('stocks');
  const [tableData, setTableData] = useState<DataHubTableResponse>({
    table: fallbackTables[0],
    rows: fallbackRows.stocks,
    limit: 10,
    offset: 0,
    total: fallbackTables[0].count
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState<string>('后端连接后将显示真实缓存库状态。');

  const activeTable = overview.tables.find((table) => table.name === selectedTable) || tableData.table;
  const totalRows = tableData.total ?? activeTable.count;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const pageStart = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, totalRows);

  const fetchOverview = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/datahub/overview`);
      if (!response.ok) throw new Error(`DataHub overview failed: ${response.status}`);
      const data = await response.json();
      setOverview(data);
      setNotice(`最近刷新：${data.generated_at}`);
    } catch (error) {
      console.error(error);
      setOverview(getFallbackOverview());
      setNotice('后端未连接，当前显示离线演示数据。');
    }
  };

  const fetchTable = async (tableName: string) => {
    setIsLoading(true);
    const offset = (currentPage - 1) * pageSize;
    try {
      const response = await fetch(`${API_BASE_URL}/api/datahub/tables/${tableName}?limit=${pageSize}&offset=${offset}`);
      if (!response.ok) throw new Error(`DataHub table failed: ${response.status}`);
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error(error);
      const table = fallbackTables.find((item) => item.name === tableName) || fallbackTables[0];
      const fallback = fallbackRows[tableName] || [{ id: 1, status: '后端离线', value: '启动 FastAPI 后可浏览真实表数据' }];
      setTableData({
        table,
        rows: fallback.slice(offset, offset + pageSize),
        limit: pageSize,
        offset,
        total: fallback.length
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchTable(selectedTable);
  }, [selectedTable, currentPage, pageSize]);

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/datahub/sync`, { method: 'POST' });
      if (!response.ok) throw new Error(`DataHub sync failed: ${response.status}`);
      const data = await response.json();
      setNotice(`${data.message} 更新持仓 ${data.updated_positions} 条，行情快照 ${data.quote_count} 条。`);
      await fetchOverview();
      await fetchTable(selectedTable);
    } catch (error) {
      console.error(error);
      setNotice('同步失败：请先启动后端服务。');
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const buildCsvFromRows = () => {
    const escapeCsvCell = (value: string | number | boolean | null | undefined) => {
      const cell = formatCellValue(value);
      return `"${cell.replace(/"/g, '""')}"`;
    };
    const header = activeTable.cols.join(',');
    const body = tableData.rows.map((row) => activeTable.cols.map((col) => escapeCsvCell(row[col])).join(','));
    return `\uFEFF${[header, ...body].join('\n')}`;
  };

  const handleExportTable = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/datahub/tables/${selectedTable}/export`);
      if (!response.ok) throw new Error(`DataHub export failed: ${response.status}`);
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `asurada_datahub_${selectedTable}.csv`;
      downloadBlob(blob, filename);
      setNotice(`已导出 ${activeTable.label}：${activeTable.count} 条记录。`);
    } catch (error) {
      console.error(error);
      const csvContent = buildCsvFromRows();
      downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }), `asurada_datahub_${selectedTable}_current_page.csv`);
      setNotice('后端未连接，已导出当前页离线数据。');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCellValue = (value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined || value === '') return 'NULL';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    return value;
  };

  const getStatusColor = (status: string) => {
    if (status.includes('正常') || status.includes('在线') || status.includes('已配置')) return '#10b981';
    if (status.includes('模拟') || status.includes('演示')) return '#f59e0b';
    return '#64748b';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} style={{ color: '#1e5eff' }} />
            数据中心 (DataHub)
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', maxWidth: '720px', lineHeight: 1.7 }}>
            统一浏览 Tushare、Sina 行情模拟源与本地 SQLite 缓存表，为策略智能体提供标准化的股票、日K、持仓、信号与审计数据视图。
          </p>
          <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
            {overview.database_url}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSyncData}
            disabled={isSyncing}
            style={{
              background: 'linear-gradient(135deg, #1e5eff 0%, #00a6a6 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(30, 94, 255, 0.2)',
              opacity: isSyncing ? 0.72 : 1
            }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? '同步中...' : '同步落库'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        {overview.sources.map((source) => (
          <div key={source.name} className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                <Server size={16} style={{ color: '#1e5eff' }} />
                {source.name}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: getStatusColor(source.status) }}>{source.status}</span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>{source.detail}</p>
            {source.quota_limit !== undefined && (
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                <span>已用 {source.requests_made}</span>
                <span>剩余 {source.quota_remaining}</span>
                <span>限额 {source.quota_limit}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) minmax(0, 1fr)', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', margin: 0 }}>DataHub 缓存表</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {overview.tables.map((table) => (
              <button
                key={table.name}
                onClick={() => {
                  setSelectedTable(table.name);
                  setCurrentPage(1);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedTable === table.name ? 'rgba(30, 94, 255, 0.08)' : 'transparent',
                  color: selectedTable === table.name ? '#1e5eff' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                <Table size={16} />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span>{table.label}</span>
                  <span style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px', fontFamily: "'Outfit', sans-serif" }}>{table.name} ({table.count} 条)</span>
                </span>
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(226,232,240,0.8)', paddingTop: '14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertCircle size={14} style={{ color: '#f59e0b', marginTop: '2px' }} />
            <span style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6 }}>{notice}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '16px' }}>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                表浏览器: sqlite_db://asurada.db/{activeTable.name}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                字段映射: {activeTable.cols.join(', ')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                {isLoading ? <Activity size={14} /> : <ShieldCheck size={14} />}
                {isLoading ? '读取中' : '读写隔离正常'}
              </span>

              <button
                onClick={handleExportTable}
                disabled={isExporting || isLoading}
                style={{
                  background: '#ffffff',
                  color: '#1e5eff',
                  border: '1px solid rgba(30, 94, 255, 0.22)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: isExporting || isLoading ? 'not-allowed' : 'pointer',
                  opacity: isExporting || isLoading ? 0.62 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                <Download size={15} />
                {isExporting ? '导出中...' : '导出当前表'}
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto', flexGrow: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  {activeTable.cols.map((col) => (
                    <th key={col} style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500', whiteSpace: 'nowrap' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, idx) => (
                  <tr key={`${activeTable.name}-${idx}`} style={{ borderBottom: '1px solid rgba(241, 245, 249, 0.8)' }}>
                    {activeTable.cols.map((col) => (
                      <td
                        key={col}
                        style={{
                          padding: '14px 8px',
                          fontSize: '12px',
                          color: '#334155',
                          fontFamily: typeof row[col] === 'number' ? "'JetBrains Mono', monospace" : 'inherit',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {formatCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {tableData.rows.length === 0 && (
              <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
                <CheckCircle size={16} />
                当前表暂无记录
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(226,232,240,0.8)', marginTop: '16px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
              {pageStart}-{pageEnd} / {totalRows}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  height: '32px',
                  border: '1px solid rgba(203,213,225,0.9)',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '12px',
                  padding: '0 8px'
                }}
              >
                <option value={10}>10 / 页</option>
                <option value={25}>25 / 页</option>
                <option value={50}>50 / 页</option>
              </select>

              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage <= 1 || isLoading}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  border: '1px solid rgba(203,213,225,0.9)',
                  borderRadius: '8px',
                  background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                  color: currentPage <= 1 ? '#cbd5e1' : '#334155',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                上一页
              </button>

              <span style={{ minWidth: '64px', textAlign: 'center', fontSize: '12px', color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages || isLoading}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  border: '1px solid rgba(203,213,225,0.9)',
                  borderRadius: '8px',
                  background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                  color: currentPage >= totalPages ? '#cbd5e1' : '#334155',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '12px'
                }}
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
