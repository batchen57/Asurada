import React, { useState } from 'react';
import { Database, Table, ShieldCheck, CheckCircle, RefreshCw } from 'lucide-react';

export const DataHubCenter: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('stocks');
  const [isSyncing, setIsSyncing] = useState(false);

  const tables = [
    { name: 'stocks', label: '证券名录缓存表', count: 4, cols: ['id', 'symbol', 'name', 'sector', 'is_active'] },
    { name: 'daily_prices', label: '历史日K缓存表', count: 1000, cols: ['id', 'symbol', 'date', 'open', 'high', 'low', 'close', 'volume', 'ma50', 'ma200'] },
    { name: 'positions', label: '投资组合持仓表', count: 3, cols: ['id', 'symbol', 'name', 'volume', 'cost_price', 'current_price'] },
    { name: 'signals', label: '策略信号触发日志表', count: 3, cols: ['id', 'timestamp', 'symbol', 'name', 'direction', 'strategy_type', 'status'] },
    { name: 'tasks', label: '今日流程待办表', count: 4, cols: ['id', 'phase', 'task_name', 'status'] },
    { name: 'configuration', label: '系统设置密钥表', count: 4, cols: ['id', 'key', 'value'] }
  ];

  const handleSyncData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  const getTableRows = (tableName: string) => {
    switch (tableName) {
      case 'stocks':
        return [
          { id: 1, symbol: '600519.SH', name: '贵州茅台', sector: '白酒', is_active: 'true' },
          { id: 2, symbol: '300750.SZ', name: '宁德时代', sector: '新能源锂电', is_active: 'true' },
          { id: 3, symbol: '300760.SZ', name: '迈瑞医疗', sector: '医疗器械', is_active: 'true' },
          { id: 4, symbol: '000002.SZ', name: '万科A', sector: '房地产', is_active: 'true' }
        ];
      case 'positions':
        return [
          { id: 1, symbol: '600519.SH', name: '贵州茅台', volume: 100.0, cost_price: 1620.0, current_price: 1688.50 },
          { id: 2, symbol: '300750.SZ', name: '宁德时代', volume: 200.0, cost_price: 185.0, current_price: 195.80 },
          { id: 3, symbol: '300760.SZ', name: '迈瑞医疗', volume: 100.0, cost_price: 275.0, current_price: 286.66 }
        ];
      default:
        return [
          { id: 1, symbol: '300750.SZ', name: '宁德时代', value: 'VCP突破买入', status: '已生效' }
        ];
    }
  };

  const rows = getTableRows(selectedTable);
  const activeTable = tables.find(t => t.name === selectedTable);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={22} style={{ color: '#1e5eff' }} />
            数据中心 (DataHub)
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
            系统统一数据仓库，提供 Tushare 与新浪行情的多源缓存与去重校验，为智能体服务提供标准化数据表视图。
          </p>
        </div>

        <button
          onClick={handleSyncData}
          disabled={isSyncing}
          style={{
            background: 'linear-gradient(135deg, #1e5eff 0%, #00d2ff 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 94, 255, 0.2)',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={16} className={isSyncing ? 'glow-active' : ''} style={{ transform: isSyncing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s ease' }} />
          {isSyncing ? '增量更新中...' : '同步落库 (增量更新)'}
        </button>
      </div>

      {/* Database splitting layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>
        
        {/* Left Side: Tables List */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>DataHub 缓存表单</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tables.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedTable === t.name ? 'rgba(30, 94, 255, 0.08)' : 'transparent',
                  color: selectedTable === t.name ? '#1e5eff' : '#64748b',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <Table size={16} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{t.label}</span>
                  <span style={{ fontSize: '9px', opacity: 0.7, marginTop: '2px', fontFamily: "'Outfit', sans-serif" }}>{t.name} ({t.count} 条)</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Table Column/Row Browser */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                表浏览器: sqlite_db://asurada.db/{activeTable?.name}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                字段映射: {activeTable?.cols.join(', ')}
              </span>
            </div>
            
            <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={14} />
              DuckDB/SQLite 读写隔离正常
            </span>
          </div>

          {/* Row Rendering */}
          <div style={{ overflowX: 'auto', flexGrow: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  {activeTable?.cols.map((col) => (
                    <th key={col} style={{ padding: '10px 8px', fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(241, 245, 249, 0.8)' }}>
                    {activeTable?.cols.map((col) => (
                      <td 
                        key={col} 
                        style={{ 
                          padding: '14px 8px', 
                          fontSize: '12px', 
                          color: '#334155',
                          fontFamily: typeof row[col] === 'number' ? "'JetBrains Mono', monospace" : 'inherit'
                        }}
                      >
                        {row[col]?.toString() || 'NULL'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
