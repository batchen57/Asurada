import React from 'react';
import { Bot, Cpu, Send, ShieldCheck, Terminal } from 'lucide-react';

export const AgentCenter: React.FC = () => {
  const agents = [
    { name: '主调度 Agent', type: 'Orchestrator', status: '在线', desc: '串联 Plan/Observe/Review 工作流场景编排与一页纸合并。' },
    { name: '策略 Agent A (VCP)', type: 'Trend Analyst', status: '在线', desc: '深度跟踪个股多 contraction 波动收窄与前高突破点。' },
    { name: '策略 Agent B (Brooks)', type: 'Bar Price Action', status: '在线', desc: '盘中低频 Patrollings 支撑反转锤线与 H2 趋势柱警报。' }
  ];

  const payloadMock = `{
  "msg_type": "interactive",
  "card": {
    "header": {
      "template": "green",
      "title": { "tag": "plain_text", "content": "🤖 Asurada | VCP突破激活！" }
    },
    "elements": [
      {
        "tag": "div",
        "text": { "tag": "lark_md", "content": "**宁德时代 (300750.SZ)** 今日向上放量大涨 5.84% 突破 195 元阻力点！" }
      }
    ]
  }
}`;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Bot size={22} style={{ color: '#1e5eff' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>智能体配置 (Agent Configuration)</h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            管理 Asurada 分布式多智能体集群：包含统一调度引擎、策略分析智能体以及推送执行端。
          </p>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        
        {/* Left: Active Agents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={16} style={{ color: '#1e5eff' }} />
              当前活跃 Agent 节点
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {agents.map((a, idx) => (
                <div key={idx} style={{ padding: '16px', borderRadius: '10px', background: 'rgba(248,250,252,0.6)', border: '1px solid rgba(226,232,240,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', display: 'block' }}>{a.name}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px', fontFamily: "'Outfit', sans-serif" }}>类型: {a.type}</span>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', lineHeight: '1.4' }}>{a.desc}</p>
                  </div>
                  
                  <span className="badge badge-green" style={{ fontSize: '10px', fontWeight: '700' }}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Feishu payload logger */}
        <div className="glass-panel" style={{ padding: '24px', background: '#0f172a', color: '#38bdf8', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <Terminal size={14} style={{ color: '#38bdf8' }} />
            飞书群机器人推送 Payload 日志
          </h3>

          <pre style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: '1.5',
            overflowX: 'auto',
            background: 'rgba(0,0,0,0.2)',
            padding: '12px',
            borderRadius: '6px',
            flexGrow: 1,
            color: '#a5f3fc'
          }}>
            {payloadMock}
          </pre>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>安静推送原则: 仅关注与持仓提醒</span>
            <button style={{
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Send size={12} />
              测试推送
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
