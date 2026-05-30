import React, { useState, useEffect } from 'react';
import { Sliders, HelpCircle, Save, Check, Loader2 } from 'lucide-react';

interface StrategyCenterProps {
  configs: Array<{ key: string; value: string }>;
  onUpdateConfig: (key: string, value: string) => Promise<any>;
}

export const StrategyCenter: React.FC<StrategyCenterProps> = ({ configs, onUpdateConfig }) => {
  const [vcpMaShort, setVcpMaShort] = useState(50);
  const [vcpMaLong, setVcpMaLong] = useState(200);
  const [vcpVolumeFactor, setVcpVolumeFactor] = useState(1.5);
  
  const [brooksStopAtr, setBrooksStopAtr] = useState(1.5);
  const [brooksHighWindow, setBrooksHighWindow] = useState(5);
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize state when backend configs load/change
  useEffect(() => {
    if (configs && configs.length > 0) {
      const maShort = configs.find(c => c.key === 'vcp_ma_short');
      if (maShort) setVcpMaShort(parseInt(maShort.value) || 50);

      const maLong = configs.find(c => c.key === 'vcp_ma_long');
      if (maLong) setVcpMaLong(parseInt(maLong.value) || 200);

      const volFactor = configs.find(c => c.key === 'vcp_volume_factor');
      if (volFactor) setVcpVolumeFactor(parseFloat(volFactor.value) || 1.5);

      const highWin = configs.find(c => c.key === 'brooks_lookback_window');
      if (highWin) setBrooksHighWindow(parseInt(highWin.value) || 5);

      const stopAtr = configs.find(c => c.key === 'brooks_stop_atr');
      if (stopAtr) setBrooksStopAtr(parseFloat(stopAtr.value) || 1.5);
    }
  }, [configs]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Async sequential saves to avoid race conditions
      await onUpdateConfig('vcp_ma_short', vcpMaShort.toString());
      await onUpdateConfig('vcp_ma_long', vcpMaLong.toString());
      await onUpdateConfig('vcp_volume_factor', vcpVolumeFactor.toString());
      await onUpdateConfig('brooks_lookback_window', brooksHighWindow.toString());
      await onUpdateConfig('brooks_stop_atr', brooksStopAtr.toString());
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save strategy parameters', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Sliders size={22} style={{ color: '#1e5eff' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>策略参数配置 (Strategy Parameters)</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            在此调整策略核心计算因数：如趋势过滤的均线参数、突破所要求的成交量倍率以及止损的 ATR 倍数。
          </p>
        </div>
      </div>

      {/* Grid of parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* VCP Params */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', borderBottom: '1px solid rgba(226,232,240,0.6)', paddingBottom: '12px' }}>
            策略 A (VCP 波动率收缩) 参数配置
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              均线过滤短周期 (SMA Short)
              <span title="Mark Minervini 风格过滤的短期均线，通常设为50日均线"><HelpCircle size={14} style={{ color: '#94a3b8', cursor: 'help' }} /></span>
            </label>
            <input 
              type="number" 
              value={vcpMaShort} 
              onChange={(e) => setVcpMaShort(parseInt(e.target.value) || 0)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                fontSize: '13px',
                outline: 'none',
                background: 'rgba(248,250,252,0.5)',
                color: '#334155',
                transition: 'border 0.2s ease'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #1e5eff'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(226,232,240,0.9)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              均线过滤长周期 (SMA Long)
              <span title="长期上升趋势过滤均线，通常为200日均线"><HelpCircle size={14} style={{ color: '#94a3b8', cursor: 'help' }} /></span>
            </label>
            <input 
              type="number" 
              value={vcpMaLong} 
              onChange={(e) => setVcpMaLong(parseInt(e.target.value) || 0)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                fontSize: '13px',
                outline: 'none',
                background: 'rgba(248,250,252,0.5)',
                color: '#334155',
                transition: 'border 0.2s ease'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #1e5eff'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(226,232,240,0.9)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              突破放量系数倍率 (Volume Factor)
              <span title="突破阻力位时的成交量必须大于过去20个交易日均值的几倍"><HelpCircle size={14} style={{ color: '#94a3b8', cursor: 'help' }} /></span>
            </label>
            <input 
              type="number" 
              step="0.1"
              value={vcpVolumeFactor} 
              onChange={(e) => setVcpVolumeFactor(parseFloat(e.target.value) || 0)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                fontSize: '13px',
                outline: 'none',
                background: 'rgba(248,250,252,0.5)',
                color: '#334155',
                transition: 'border 0.2s ease'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #1e5eff'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(226,232,240,0.9)'}
            />
          </div>
        </div>

        {/* Brooks Params */}
        <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', borderBottom: '1px solid rgba(226,232,240,0.6)', paddingBottom: '12px' }}>
            策略 B (Al Brooks 裸K价格行为) 参数配置
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              回调高点突破窗口 (H1/H2 Lookback Window)
              <span title="回踩 pullback 过程中，扫描多少条K线以确认 H1 或 H2 突破结构"><HelpCircle size={14} style={{ color: '#94a3b8', cursor: 'help' }} /></span>
            </label>
            <input 
              type="number" 
              value={brooksHighWindow} 
              onChange={(e) => setBrooksHighWindow(parseInt(e.target.value) || 0)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                fontSize: '13px',
                outline: 'none',
                background: 'rgba(248,250,252,0.5)',
                color: '#334155',
                transition: 'border 0.2s ease'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #1e5eff'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(226,232,240,0.9)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              支撑区判定止损 ATR 倍率
              <span title="风控止损基于支撑线下方几个 ATR 单位的波幅宽容空间"><HelpCircle size={14} style={{ color: '#94a3b8', cursor: 'help' }} /></span>
            </label>
            <input 
              type="number" 
              step="0.1"
              value={brooksStopAtr} 
              onChange={(e) => setBrooksStopAtr(parseFloat(e.target.value) || 0)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(226,232,240,0.9)',
                fontSize: '13px',
                outline: 'none',
                background: 'rgba(248,250,252,0.5)',
                color: '#334155',
                transition: 'border 0.2s ease'
              }}
              onFocus={(e) => e.target.style.border = '1px solid #1e5eff'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(226,232,240,0.9)'}
            />
          </div>
        </div>

      </div>

      {/* Footer Save Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            background: saveSuccess ? '#10b981' : '#1e5eff',
            color: 'white',
            border: 'none',
            padding: '12px 28px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: saveSuccess ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(30, 94, 255, 0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              正在保存参数并同步数据库...
            </>
          ) : saveSuccess ? (
            <>
              <Check size={16} />
              策略参数已成功应用！
            </>
          ) : (
            <>
              <Save size={16} />
              应用并运行策略更新
            </>
          )}
        </button>
      </div>

    </div>
  );
};
