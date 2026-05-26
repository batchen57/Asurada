import React, { useState } from 'react';
import { Sliders, HelpCircle, Save, Check } from 'lucide-react';

export const StrategyCenter: React.FC = () => {
  const [vcpMaShort, setVcpMaShort] = useState(50);
  const [vcpMaLong, setVcpMaLong] = useState(200);
  const [vcpVolumeFactor, setVcpVolumeFactor] = useState(1.5);
  
  const [brooksStopAtr, setBrooksStopAtr] = useState(1.5);
  const [brooksHighWindow, setBrooksHighWindow] = useState(5);
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Sliders size={22} style={{ color: '#1e5eff' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>策略中心 (Strategy Center)</h2>
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
              <HelpCircle size={14} style={{ color: '#94a3b8' }} />
            </label>
            <input 
              type="number" 
              value={vcpMaShort} 
              onChange={(e) => setVcpMaShort(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              均线过滤长周期 (SMA Long)
              <HelpCircle size={14} style={{ color: '#94a3b8' }} />
            </label>
            <input 
              type="number" 
              value={vcpMaLong} 
              onChange={(e) => setVcpMaLong(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              突破放量系数倍率 (Volume Factor)
              <HelpCircle size={14} style={{ color: '#94a3b8' }} />
            </label>
            <input 
              type="number" 
              step="0.1"
              value={vcpVolumeFactor} 
              onChange={(e) => setVcpVolumeFactor(parseFloat(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px', outline: 'none' }}
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
              <HelpCircle size={14} style={{ color: '#94a3b8' }} />
            </label>
            <input 
              type="number" 
              value={brooksHighWindow} 
              onChange={(e) => setBrooksHighWindow(parseInt(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              支撑区判定止损 ATR 倍率
              <HelpCircle size={14} style={{ color: '#94a3b8' }} />
            </label>
            <input 
              type="number" 
              step="0.1"
              value={brooksStopAtr} 
              onChange={(e) => setBrooksStopAtr(parseFloat(e.target.value))}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(226,232,240,0.8)', fontSize: '12px', outline: 'none' }}
            />
          </div>
        </div>

      </div>

      {/* Footer Save Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          style={{
            background: '#1e5eff',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(30, 94, 255, 0.15)'
          }}
        >
          {saveSuccess ? (
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
