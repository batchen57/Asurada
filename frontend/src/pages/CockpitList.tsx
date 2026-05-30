import React, { useEffect, useState } from 'react';
import { 
  Network, 
  Cpu, 
  TrendingUp, 
  Layers, 
  FileText, 
  AlertTriangle, 
  Plus, 
  Clock, 
  CheckCircle,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ResearchSector } from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

const fallbackSectors: ResearchSector[] = [
  { 
    id: 1, 
    name: "人形机器人", 
    category: "制造", 
    description: "具身智能与先进制造的交叉领域，涵盖减速器、丝杠、空心杯电机等核心零部件，国产化替代空间巨大。", 
    status: "已分析", 
    report_count: 170, 
    analysis_status: "已生成", 
    opportunity_level: "A", 
    risk_level: "中", 
    last_updated_at: "2026-05-30" 
  },
  { 
    id: 2, 
    name: "半导体设备", 
    category: "TMT", 
    description: "卡脖子环节突破与国产替代核心路线。涵盖光刻、刻蚀、薄膜沉积等核心制造设备，自主可控核心领域。", 
    status: "分析中", 
    report_count: 98, 
    analysis_status: "进行中", 
    opportunity_level: "A", 
    risk_level: "中", 
    last_updated_at: "2026-05-30" 
  },
  { 
    id: 3, 
    name: "固态电池", 
    category: "新能源", 
    description: "下一代电池技术路线，高能量密度与高安全性的颠覆性创新，处于产业化量产前夜的关键节点。", 
    status: "待复核", 
    report_count: 76, 
    analysis_status: "待人工确认", 
    opportunity_level: "B", 
    risk_level: "高", 
    last_updated_at: "2026-05-30" 
  }
];

interface CockpitListProps {
  onNavigate: (tab: string, params?: any) => void;
}

export const CockpitList: React.FC<CockpitListProps> = ({ onNavigate }) => {
  const [sectors, setSectors] = useState<ResearchSector[]>(fallbackSectors);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('后端连接后将展示实时研报提取状态。');

  // Form states for creating a new sector
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('制造');
  const [newDesc, setNewDesc] = useState('');
  const [newOpp, setNewOpp] = useState('B');
  const [newRisk, setNewRisk] = useState('中');

  const fetchSectors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cockpit/sectors`);
      if (!response.ok) throw new Error(`Sectors fetch failed: ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setSectors(data);
      }
      setNotice('已连接后端，实时投研板块同步中。');
    } catch (err) {
      console.warn('Backend offline, using high-fidelity mock fallback.', err);
      setSectors(fallbackSectors);
      setNotice('后端离线，当前显示本地缓存投研板块。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSectors();
  }, []);

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newSector = {
      name: newName,
      category: newCategory,
      description: newDesc,
      status: "未开始",
      report_count: 0,
      analysis_status: "未生成",
      opportunity_level: newOpp,
      risk_level: newRisk,
      last_updated_at: new Date().toISOString().split('T')[0],
      created_by: "user"
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/cockpit/sectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSector)
      });
      if (!response.ok) throw new Error(`Failed to create sector: ${response.status}`);
      await fetchSectors();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.warn('Offline creation fallback.', err);
      // Offline fallback
      const mockCreated = {
        ...newSector,
        id: sectors.length + 1
      };
      setSectors([...sectors, mockCreated]);
      setShowAddModal(false);
      resetForm();
      setNotice('离线保存成功（仅保存在前端会话）。');
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewCategory('制造');
    setNewDesc('');
    setNewOpp('B');
    setNewRisk('中');
  };

  const getOppColor = (level: string) => {
    if (level === 'A') return '#10b981'; // Green
    if (level === 'B') return '#1e5eff'; // Blue
    return '#64748b'; // Slate
  };

  const getRiskColor = (level: string) => {
    if (level === '高') return '#ef4444'; // Red
    if (level === '中') return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case '制造': return { bg: 'rgba(139, 92, 246, 0.08)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.15)' };
      case 'TMT': return { bg: 'rgba(6, 182, 212, 0.08)', text: '#0891b2', border: 'rgba(6, 182, 212, 0.15)' };
      case '新能源': return { bg: 'rgba(16, 185, 129, 0.08)', text: '#059669', border: 'rgba(16, 185, 129, 0.15)' };
      default: return { bg: 'rgba(100, 116, 139, 0.08)', text: '#475569', border: 'rgba(100, 116, 139, 0.15)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* Title Panel - Institutional clean gradient */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(30, 94, 255, 0.08)', padding: '10px', borderRadius: '12px' }}>
            <Network size={24} style={{ color: '#1e5eff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              AI 投研产业链驾驶舱 <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', background: '#e2e8f0', color: '#475569' }}>Cockpit 05</span>
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', maxWidth: '800px', lineHeight: '1.6' }}>
              基于深度研报解构的产业链透视与检测系统。整合多智能体在板块核心零部件、技术路线降本、模块竞争力与原文证据链上的审计追踪，赋能高可信确定性估值分析。
            </p>
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '6px', fontFamily: "'JetBrains Mono', monospace" }}>
              {notice}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #1e5eff 0%, #00c6ff 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 94, 255, 0.18)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          新建投研板块
        </button>
      </div>

      {/* Quick Overview Widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(30, 94, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={20} style={{ color: '#1e5eff' }} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{sectors.length}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>总监测投研板块</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {sectors.filter(s => s.status === '已分析').length}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>已完成产业链析出</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} style={{ color: '#0891b2' }} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {sectors.reduce((acc, curr) => acc + (curr.report_count || 0), 0)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>累计检索与导入研报</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {sectors.filter(s => s.status !== '已分析' && s.status !== '未开始').length}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>AI 智能体活跃处理中</div>
          </div>
        </div>
      </div>

      {/* Grid of Sector Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '20px',
        marginTop: '4px'
      }}>
        {sectors.map((sector) => {
          const catStyle = getCategoryColor(sector.category);
          return (
            <div 
              key={sector.id} 
              className="glass-panel" 
              style={{ 
                padding: '20px 24px', 
                background: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(30, 94, 255, 0.3)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 94, 255, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.01)';
              }}
            >
              
              {/* Card Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: '700',
                    background: catStyle.bg,
                    color: catStyle.text,
                    border: `1px solid ${catStyle.border}`
                  }}>
                    {sector.category}
                  </span>
                  
                  <span style={{ 
                    fontSize: '11px', 
                    color: sector.status === '已分析' ? '#10b981' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '600'
                  }}>
                    <span style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: sector.status === '已分析' ? '#10b981' : '#f59e0b',
                      display: 'inline-block'
                    }} />
                    {sector.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                  {sector.name}
                </h3>
                
                <p style={{ 
                  margin: '8px 0 0 0', 
                  fontSize: '12px', 
                  color: '#64748b', 
                  lineHeight: '1.6',
                  height: '58px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {sector.description}
                </p>
              </div>

              {/* Card Metrics & Action */}
              <div style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>机会等级</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: getOppColor(sector.opportunity_level || 'B') }}>
                      {sector.opportunity_level} 级
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>估值风险</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: getRiskColor(sector.risk_level || '中') }}>
                      {sector.risk_level}风险
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>研报池</span>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e293b', fontFamily: "'JetBrains Mono', monospace" }}>
                      {sector.report_count} 篇
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('cockpit_dashboard', { id: sector.id, name: sector.name })}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    color: '#1e5eff',
                    border: '1px solid rgba(30, 94, 255, 0.15)',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1e5eff';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#1e5eff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#1e5eff';
                    e.currentTarget.style.borderColor = 'rgba(30, 94, 255, 0.15)';
                  }}
                >
                  进入产业链画布
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add New Sector Modal - Clean institutional style */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#1e5eff' }} />
              新建产业链投研板块
            </h3>

            <form onSubmit={handleCreateSector} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>板块名称 <span style={{ color: '#ef4444' }}>*</span></label>
                <input 
                  type="text" 
                  required
                  placeholder="例如: 固态电池、钙钛矿光伏..." 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#1e5eff'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>所属分类</label>
                  <select 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#0f172a',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="制造">制造</option>
                    <option value="TMT">TMT</option>
                    <option value="新能源">新能源</option>
                    <option value="消费">消费</option>
                    <option value="医药">医药</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>机会等级</label>
                  <select 
                    value={newOpp} 
                    onChange={(e) => setNewOpp(e.target.value)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      color: '#0f172a',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="A">A 级 (极高价值)</option>
                    <option value="B">B 级 (中高价值)</option>
                    <option value="C">C 级 (常规价值)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>估值风险评级</label>
                <select 
                  value={newRisk} 
                  onChange={(e) => setNewRisk(e.target.value)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#0f172a',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="低">低风险</option>
                  <option value="中">中等风险</option>
                  <option value="高">高风险</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', color: '#475569', fontWeight: '600' }}>简短描述</label>
                <textarea 
                  rows={3}
                  placeholder="提供一些投研逻辑、核心要点或产业链背景..." 
                  value={newDesc} 
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    color: '#0f172a',
                    fontSize: '13px',
                    resize: 'none',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#1e5eff'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  取消
                </button>
                <button 
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #1e5eff 0%, #00c6ff 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 18px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(30, 94, 255, 0.15)'
                  }}
                >
                  创建板块
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.15s ease-out;
        }
      `}</style>

    </div>
  );
};
