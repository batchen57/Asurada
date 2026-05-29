import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import { Configuration } from '../types';

interface SettingsProps {
  configs: Configuration[];
  onUpdateConfig: (key: string, value: string) => Promise<any>;
  onResetTasks: () => Promise<any>;
}

export const SettingsPage: React.FC<SettingsProps> = ({ configs, onUpdateConfig, onResetTasks }) => {
  const [tushareToken, setTushareToken] = useState('demo_token_xyz_123456');
  const [feishuWebhook, setFeishuWebhook] = useState('https://open.feishu.cn/open-apis/bot/v2/hook/demo-webhook-id');
  const [feishuEnabled, setFeishuEnabled] = useState(false);
  const [isTradingSimulation, setIsTradingSimulation] = useState(true);
  const [observeMaxDailyAlerts, setObserveMaxDailyAlerts] = useState('5');
  const [observeMergeWindowMinutes, setObserveMergeWindowMinutes] = useState('15');
  const [observeEnableKline, setObserveEnableKline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Sync state with props
  useEffect(() => {
    if (configs && configs.length > 0) {
      const tsToken = configs.find(c => c.key === 'tushare_token')?.value;
      const fsWebhook = configs.find(c => c.key === 'feishu_webhook')?.value;
      const fsEnabled = configs.find(c => c.key === 'feishu_enabled')?.value === 'true';
      const isSim = configs.find(c => c.key === 'is_trading_simulation')?.value === 'true';
      const obsMaxAlerts = configs.find(c => c.key === 'observe_max_daily_alerts')?.value;
      const obsMergeWin = configs.find(c => c.key === 'observe_merge_window_minutes')?.value;
      const obsEnableKline = configs.find(c => c.key === 'observe_enable_kline')?.value === 'true';
      
      if (tsToken) setTushareToken(tsToken);
      if (fsWebhook) setFeishuWebhook(fsWebhook);
      setFeishuEnabled(fsEnabled);
      setIsTradingSimulation(isSim);
      if (obsMaxAlerts) setObserveMaxDailyAlerts(obsMaxAlerts);
      if (obsMergeWin) setObserveMergeWindowMinutes(obsMergeWin);
      setObserveEnableKline(obsEnableKline);
    }
  }, [configs]);

  const handleSaveConfigs = async () => {
    setIsSaving(true);
    try {
      await onUpdateConfig('tushare_token', tushareToken);
      await onUpdateConfig('feishu_webhook', feishuWebhook);
      await onUpdateConfig('feishu_enabled', feishuEnabled ? 'true' : 'false');
      await onUpdateConfig('is_trading_simulation', isTradingSimulation ? 'true' : 'false');
      await onUpdateConfig('observe_max_daily_alerts', observeMaxDailyAlerts);
      await onUpdateConfig('observe_merge_window_minutes', observeMergeWindowMinutes);
      await onUpdateConfig('observe_enable_kline', observeEnableKline ? 'true' : 'false');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetWorkflow = async () => {
    if (window.confirm('确认要重置今日流程待办吗？这会将所有待办事项恢复为未开始状态。')) {
      setIsResetting(true);
      try {
        await onResetTasks();
        alert('系统流程已重置！');
      } catch (e) {
        console.error(e);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Settings size={22} style={{ color: '#1e5eff' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>系统设置 (System Settings)</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            管理数据源 Tushare Pro 鉴权秘钥、飞书集成机器人 Webhook 以及交易模拟器的参数设定。
          </p>
        </div>
      </div>

      {/* Settings Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        
        {/* Left Column: Config forms */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', borderBottom: '1px solid rgba(226,232,240,0.6)', paddingBottom: '12px' }}>
            数据源与外部接口配置
          </h3>

          {/* Tushare Token */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>Tushare Pro Token 授权秘钥</label>
            <input 
              type="password" 
              value={tushareToken}
              onChange={(e) => setTushareToken(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                outline: 'none',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>若使用真实数据源，请在此粘贴您的 Tushare 官方 Token，否则系统将采用离线高仿真模拟器。</span>
          </div>

          {/* Feishu Webhook */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>飞书群机器人 Webhook 地址</label>
            <input 
              type="text" 
              value={feishuWebhook}
              onChange={(e) => setFeishuWebhook(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                outline: 'none',
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>支持配置群助手 Webhook，将策略买卖点和盘后复盘推送至手机。</span>
          </div>

          {/* Simulation toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(241, 245, 249, 0.4)', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block' }}>启用交易沙盘模拟模式 (Sandbox Simulator)</span>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>开启后，系统在行情与数据分析中采用本地高仿真模拟器（极速且免接口额度消耗）；关闭后，直接获取真实行情。</span>
            </div>
            
            <input 
              type="checkbox"
              checked={isTradingSimulation}
              onChange={(e) => setIsTradingSimulation(e.target.checked)}
              style={{
                width: '36px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Webhook toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(241, 245, 249, 0.4)', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block' }}>启用飞书真实推送</span>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>开启后，系统在触发买入或复盘时会真正请求 Webhook 端点。</span>
            </div>
            
            <input 
              type="checkbox"
              checked={feishuEnabled}
              onChange={(e) => setFeishuEnabled(e.target.checked)}
              style={{
                width: '36px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Observe Configuration Section */}
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', borderBottom: '1px solid rgba(226,232,240,0.6)', paddingBottom: '10px', marginTop: '14px' }}>
            盘中盯盘 (Observe) 降噪与调度参数
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Max Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>单日推送提醒上限 (条)</label>
              <input 
                type="number" 
                value={observeMaxDailyAlerts}
                onChange={(e) => setObserveMaxDailyAlerts(e.target.value)}
                min="1"
                max="50"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  outline: 'none',
                  fontSize: '12px',
                }}
              />
            </div>

            {/* Merge Window */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>合并警报时间窗口 (分钟)</label>
              <input 
                type="number" 
                value={observeMergeWindowMinutes}
                onChange={(e) => setObserveMergeWindowMinutes(e.target.value)}
                min="1"
                max="120"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  outline: 'none',
                  fontSize: '12px',
                }}
              />
            </div>
          </div>

          {/* cnStockKLine toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(241, 245, 249, 0.4)', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155', display: 'block' }}>启用 cnStockKLine 分钟K线获取</span>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>按需拉取高精度分时分钟K线数据，进行实时波动率突变计算。</span>
            </div>
            
            <input 
              type="checkbox"
              checked={observeEnableKline}
              onChange={(e) => setObserveEnableKline(e.target.checked)}
              style={{
                width: '36px',
                height: '18px',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveConfigs}
            disabled={isSaving}
            style={{
              alignSelf: 'flex-start',
              background: '#1e5eff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              marginTop: '10px'
            }}
          >
            {saveSuccess ? (
              <>
                <Check size={16} />
                设置已成功保存！
              </>
            ) : (
              <>
                <Save size={16} />
                {isSaving ? '正在保存...' : '保存配置项'}
              </>
            )}
          </button>
        </div>

        {/* Right Column: Database reset CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              危险性与重置控制
            </h3>
            
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
              重置命令会将数据库的待办任务、系统健康度重置至最初演示形态，方便重新展示工作流效果。
            </p>

            <button
              onClick={handleResetWorkflow}
              disabled={isResetting}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <RefreshCw size={14} className={isResetting ? 'glow-active' : ''} />
              {isResetting ? '正在重置待办...' : '重置今日任务为 [未开始]'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
