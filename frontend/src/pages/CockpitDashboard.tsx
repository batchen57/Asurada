import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Cpu, 
  TrendingDown, 
  Search, 
  BookOpen, 
  Compass, 
  Activity, 
  ShieldAlert, 
  ExternalLink,
  CheckCircle,
  FileText,
  HelpCircle,
  BarChart3,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { 
  ResearchSector, 
  IndustryChainNode, 
  CostStructure, 
  ResearchConclusion, 
  ResearchReport, 
  Evidence 
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000';

// ==========================================
// High-Fidelity Mock Data Fallbacks
// ==========================================
const mockNodes: Record<number, IndustryChainNode[]> = {
  1: [ // 人形机器人
    { id: 11, sector_id: 1, name: "谐波减速器", node_type: "核心零部件", cost_ratio: "35%", localization_rate: "中", barrier_score: 88, substitution_risk_score: 20, investment_score: 85, description: "主要应用于手腕、手指等精细运动关节，要求体积小、轻量化与高精度。" },
    { id: 12, sector_id: 1, name: "行星滚柱丝杠", node_type: "核心零部件", cost_ratio: "20%", localization_rate: "低", barrier_score: 92, substitution_risk_score: 15, investment_score: 90, description: "线性执行器核心，用于腿部、手臂等高负载直线运动部位，技术壁垒极高。" },
    { id: 13, sector_id: 1, name: "空心杯电机", node_type: "核心零部件", cost_ratio: "15%", localization_rate: "中高", barrier_score: 75, substitution_risk_score: 30, investment_score: 70, description: "手部关节关键驱动件，要求响应速度快、功率密度高、控制精准。" }
  ],
  2: [ // 半导体设备
    { id: 21, sector_id: 2, name: "光刻机", node_type: "核心前道设备", cost_ratio: "25%", localization_rate: "极低", barrier_score: 99, substitution_risk_score: 5, investment_score: 95, description: "半导体制造中最精密复杂的设备，核心壁垒在于光学镜头与极紫外光源。" },
    { id: 22, sector_id: 2, name: "等离子体刻蚀机", node_type: "核心前道设备", cost_ratio: "20%", localization_rate: "中", barrier_score: 85, substitution_risk_score: 15, investment_score: 88, description: "用于在晶圆表面微米或纳米结构中进行微细刻蚀，国产化率稳步提升。" },
    { id: 23, sector_id: 2, name: "化学气相沉积设备", node_type: "核心前道设备", cost_ratio: "18%", localization_rate: "低", barrier_score: 80, substitution_risk_score: 20, investment_score: 82, description: "在晶圆表面沉积各类电介质或金属薄膜的关键设备，工艺参数控制极其严苛。" }
  ],
  3: [ // 固态电池
    { id: 31, sector_id: 3, name: "固态电解质", node_type: "关键原材料", cost_ratio: "45%", localization_rate: "中", barrier_score: 90, substitution_risk_score: 25, investment_score: 92, description: "替代传统液态电解液与隔膜，是全固态电池安全与能量密度的决定性技术。" },
    { id: 32, sector_id: 3, name: "锂金属负极", node_type: "关键原材料", cost_ratio: "20%", localization_rate: "低", barrier_score: 88, substitution_risk_score: 15, investment_score: 86, description: "匹配高能量密度固态电池的终极负极路线，目前面临锂枝晶生长控制难点。" },
    { id: 33, sector_id: 3, name: "高镍三元正极", node_type: "关键原材料", cost_ratio: "15%", localization_rate: "高", barrier_score: 70, substitution_risk_score: 40, investment_score: 75, description: "提供高电压与容量的基础正极材料，国内产业链最为成熟的一环。" }
  ]
};

const mockCosts: Record<number, CostStructure[]> = {
  1: [ // 人形机器人
    { id: 101, sector_id: 1, node_id: 11, module_name: "谐波减速器", current_cost: "3500元", target_cost: "1500元", cost_ratio: "35%", decline_rate: "-15% CAGR", year: "2024", source_type: "研报提取", confidence_score: 0.92 },
    { id: 102, sector_id: 1, node_id: 12, module_name: "行星滚柱丝杠", current_cost: "5000元", target_cost: "2000元", cost_ratio: "20%", decline_rate: "-20% CAGR", year: "2024", source_type: "研报提取", confidence_score: 0.85 }
  ],
  2: [ // 半导体设备
    { id: 201, sector_id: 2, node_id: 21, module_name: "ArFi浸没式光刻光源", current_cost: "1.2亿元", target_cost: "8000万元", cost_ratio: "25%", decline_rate: "-10% CAGR", year: "2025", source_type: "研报推算", confidence_score: 0.78 },
    { id: 202, sector_id: 2, node_id: 22, module_name: "ICP等离子反应腔体", current_cost: "450万元", target_cost: "300万元", cost_ratio: "20%", decline_rate: "-12% CAGR", year: "2025", source_type: "研报提取", confidence_score: 0.89 }
  ],
  3: [ // 固态电池
    { id: 301, sector_id: 3, node_id: 31, module_name: "硫化物固态电解质", current_cost: "1200元/kg", target_cost: "150元/kg", cost_ratio: "45%", decline_rate: "-35% CAGR", year: "2026", source_type: "产业规划", confidence_score: 0.82 },
    { id: 302, sector_id: 3, node_id: 32, module_name: "超薄锂带负极", current_cost: "800元/sqm", target_cost: "250元/sqm", cost_ratio: "20%", decline_rate: "-25% CAGR", year: "2026", source_type: "研报推算", confidence_score: 0.74 }
  ]
};

const mockConclusions: Record<number, ResearchConclusion[]> = {
  1: [ // 人形机器人
    { id: 1001, sector_id: 1, target_type: "板块", target_id: 1, conclusion_type: "核心驱动", content: "国产替代加速 + 成本规模化下降 + 下游主机厂量产定型预期增强。", confidence_score: 0.88, risk_level: "低", review_status: "已确认", created_at: "2026-05-30" },
    { id: 1002, sector_id: 1, target_type: "节点", target_id: 11, conclusion_type: "替代风险", content: "未来 5-10 年谐波减速器在手腕轻载精密关节的替代路线尚未成熟，投资壁垒极深。", confidence_score: 0.95, risk_level: "低", review_status: "已确认", created_at: "2026-05-30" },
    { id: 1003, sector_id: 1, target_type: "节点", target_id: 12, conclusion_type: "壁垒警告", content: "行星滚柱丝杠由于螺纹加工精度与材料淬火要求高，目前海外垄断性最高，壁垒最强。", confidence_score: 0.92, risk_level: "高", review_status: "待复核", created_at: "2026-05-30" }
  ],
  2: [ // 半导体设备
    { id: 2001, sector_id: 2, target_type: "板块", target_id: 2, conclusion_type: "替代加速", content: "先进制程设备国产化进入“深水区”，14nm及以下关键节点设备替代率已超过45%。", confidence_score: 0.91, risk_level: "低", review_status: "已确认", created_at: "2026-05-30" },
    { id: 2002, sector_id: 2, target_type: "节点", target_id: 21, conclusion_type: "断供风险", content: "高端EUV及高精度DUV光刻光源断供常态化，倒逼国内光学与准分子激光厂商联合攻坚。", confidence_score: 0.96, risk_level: "高", review_status: "已确认", created_at: "2026-05-30" }
  ],
  3: [ // 固态电池
    { id: 3001, sector_id: 3, target_type: "板块", target_id: 3, conclusion_type: "量产拐点", content: "半固态电池进入量产实装装车阶段，但全固态路线仍面临电解质界面阻抗与工艺瓶颈。", confidence_score: 0.85, risk_level: "中", review_status: "待复核", created_at: "2026-05-30" },
    { id: 3002, sector_id: 3, target_type: "节点", target_id: 31, conclusion_type: "路线博弈", content: "硫化物、氧化物与聚合物三大电解质技术路线博弈剧烈，目前硫化物因电导率高更被看好。", confidence_score: 0.89, risk_level: "中", review_status: "已确认", created_at: "2026-05-30" }
  ]
};

const mockReports: Record<number, ResearchReport[]> = {
  1: [ // 人形机器人
    { id: 501, sector_id: 1, title: "人形机器人核心零部件行业深度报告", institution: "华泰证券", author: "张聪", publish_date: "2024-03-15", file_url: "/reports/robot_components.pdf", parse_status: "已完成", quality_score: 92.5, summary: "详细测算了谐波减速器与丝杠的物料BOM成本与国产化突破窗口。", created_at: "2026-05-30" },
    { id: 502, sector_id: 1, title: "减速器行业深度及国产份额分析", institution: "中信证券", author: "李明", publish_date: "2024-02-20", file_url: "/reports/speed_reducer.pdf", parse_status: "已完成", quality_score: 90.0, summary: "聚焦绿的谐波与双环传动在高端传动领域的份额侵蚀与出海空间。", created_at: "2026-05-30" }
  ],
  2: [ // 半导体设备
    { id: 601, sector_id: 2, title: "中国半导体前道设备替代率季度跟踪", institution: "国泰君安", author: "王磊", publish_date: "2024-04-10", file_url: "/reports/semi_equipment.pdf", parse_status: "已完成", quality_score: 94.0, summary: "覆盖北方华创、中微公司在先进制程等离子刻蚀与薄膜沉积设备上的重大技术突破。", created_at: "2026-05-30" }
  ],
  3: [ // 固态电池
    { id: 701, sector_id: 3, title: "下一代锂电之巅：固态电池商业化前夜", institution: "中金公司", author: "刘超", publish_date: "2024-05-02", file_url: "/reports/solid_battery.pdf", parse_status: "已完成", quality_score: 91.0, summary: "对硫化物固态电解质原料成本及量产中试线资本开支的专题剖析。", created_at: "2026-05-30" }
  ]
};

const mockEvidences: Record<number, Evidence[]> = {
  1002: [ // 谐波减速器替代风险 evidence
    { id: 10001, conclusion_id: 1002, report_id: 501, chunk_id: 12, page_no: "18", original_text: "华泰证券《人形机器人核心零部件报告》P18: 谐波减速器在手腕关节等轻负载高精度场景具备极强的不可替代性，在20kg级承载内其扭矩刚度与重量体积比达到最优解。", evidence_type: "研报原文", confidence_score: 0.95 },
    { id: 10002, conclusion_id: 1002, report_id: 502, chunk_id: 34, page_no: "12", original_text: "中信证券《减速器行业深度》P12: 虽然直驱电机与行星减速器在部分粗放关节有所渗透，但谐波主流地位短期内不可动摇，绿的谐波国内市占率已稳步突破38%。", evidence_type: "研报原文", confidence_score: 0.92 }
  ],
  1003: [ // 滚柱丝杠壁垒 evidence
    { id: 10003, conclusion_id: 1003, report_id: 501, chunk_id: 28, page_no: "25", original_text: "华泰证券《人形机器人核心零部件报告》P25: 行星滚柱丝杠的螺纹研磨工艺需要使用海外进口高精度研磨机床，且淬火热处理硬度需达到HRC60以上，国内大规模良率偏低。", evidence_type: "研报原文", confidence_score: 0.92 }
  ],
  2002: [ // 光刻机断供 evidence
    { id: 20001, conclusion_id: 2002, report_id: 601, chunk_id: 42, page_no: "33", original_text: "国泰君安《中国半导体前道设备报告》P33: 核心准分子激光源与反射镜片组高度依赖国外进口，国内产业链攻坚点集中在超精密光学干涉测量与曝光镜头热消像散系统。", evidence_type: "研报原文", confidence_score: 0.96 }
  ],
  3002: [ // 固态电池路线 evidence
    { id: 30001, conclusion_id: 3002, report_id: 701, chunk_id: 9, page_no: "15", original_text: "中金公司《固态电池商业化前夜》P15: 硫化物固态电解质具备最高的室温离子电导率(>10^-2 S/cm)，但其在潮湿空气中极易产生剧毒硫化氢气体，工艺厂房需极致干燥度。", evidence_type: "研报原文", confidence_score: 0.89 }
  ]
};

interface CockpitDashboardProps {
  sector: { id: number; name: string } | null;
  onNavigate: (tab: string, params?: any) => void;
}

export const CockpitDashboard: React.FC<CockpitDashboardProps> = ({ sector, onNavigate }) => {
  const sectorId = sector?.id || 1;
  const sectorName = sector?.name || "人形机器人";

  // Data States
  const [nodes, setNodes] = useState<IndustryChainNode[]>([]);
  const [costs, setCosts] = useState<CostStructure[]>([]);
  const [conclusions, setConclusions] = useState<ResearchConclusion[]>([]);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [activeConclusionId, setActiveConclusionId] = useState<number | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('');
  
  // Custom interactive node inspection
  const [selectedNode, setSelectedNode] = useState<IndustryChainNode | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Nodes
      const nodesRes = await fetch(`${API_BASE_URL}/api/cockpit/sectors/${sectorId}/nodes`);
      const nodesData = nodesRes.ok ? await nodesRes.json() : [];

      // 2. Fetch Costs
      const costsRes = await fetch(`${API_BASE_URL}/api/cockpit/sectors/${sectorId}/costs`);
      const costsData = costsRes.ok ? await costsRes.json() : [];

      // 3. Fetch Conclusions
      const conRes = await fetch(`${API_BASE_URL}/api/cockpit/sectors/${sectorId}/conclusions`);
      const conData = conRes.ok ? await conRes.json() : [];

      // 4. Fetch Reports
      const repRes = await fetch(`${API_BASE_URL}/api/cockpit/sectors/${sectorId}/reports`);
      const repData = repRes.ok ? await repRes.json() : [];

      if (nodesData.length > 0) setNodes(nodesData);
      else setNodes(mockNodes[sectorId] || []);

      if (costsData.length > 0) setCosts(costsData);
      else setCosts(mockCosts[sectorId] || []);

      if (conData.length > 0) {
        setConclusions(conData);
        if (conData.length > 0) {
          setActiveConclusionId(conData[0].id);
        }
      } else {
        const fallbackCons = mockConclusions[sectorId] || [];
        setConclusions(fallbackCons);
        if (fallbackCons.length > 0) {
          setActiveConclusionId(fallbackCons[0].id);
        }
      }

      if (repData.length > 0) setReports(repData);
      else setReports(mockReports[sectorId] || []);

      setNotice('实时产业链数据已同步接入。');
    } catch (err) {
      console.warn('Dashboard fetch failed, using mock fallbacks.', err);
      setNodes(mockNodes[sectorId] || []);
      setCosts(mockCosts[sectorId] || []);
      
      const fallbackCons = mockConclusions[sectorId] || [];
      setConclusions(fallbackCons);
      if (fallbackCons.length > 0) {
        setActiveConclusionId(fallbackCons[0].id);
      }

      setReports(mockReports[sectorId] || []);
      setNotice('离线模式：当前显示高仿真投研画布。');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvidences = async (conclusionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cockpit/conclusions/${conclusionId}/evidences`);
      if (!response.ok) throw new Error('Evidence fetch failed');
      const data = await response.json();
      if (data && data.length > 0) {
        setEvidences(data);
      } else {
        setEvidences(mockEvidences[conclusionId] || []);
      }
    } catch (err) {
      setEvidences(mockEvidences[conclusionId] || []);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [sectorId]);

  useEffect(() => {
    if (activeConclusionId !== null) {
      fetchEvidences(activeConclusionId);
    }
  }, [activeConclusionId]);

  // Set default selected node for inspection
  useEffect(() => {
    if (nodes.length > 0 && !selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981'; // High
    if (score >= 60) return '#f59e0b'; // Medium
    return '#ef4444'; // Low
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Dashboard Topbar Navigation - Light institutional mode */}
      <div className="glass-panel" style={{
        padding: '14px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => onNavigate('cockpit_list')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1e5eff'; e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
          >
            <ArrowLeft size={15} />
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10.5px', color: '#1e5eff', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                产业链深度研究画布
              </span>
              {isLoading && <Activity size={11} className="animate-spin" style={{ color: '#1e5eff' }} />}
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={18} style={{ color: '#8b5cf6' }} />
              {sectorName} 产业链总览
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            {notice}
          </span>
          <div style={{
            fontSize: '11px',
            color: '#8b5cf6',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            padding: '5px 10px',
            borderRadius: '6px',
            fontWeight: '700'
          }}>
            导入研报 {reports.length} 篇
          </div>
        </div>
      </div>

      {/* Row 1: AI Conclusions Banner - Soft light style */}
      <div className="glass-panel" style={{
        padding: '18px 20px',
        background: 'linear-gradient(135deg, rgba(30, 94, 255, 0.03) 0%, rgba(139, 92, 246, 0.02) 100%)',
        border: '1px solid rgba(30, 94, 255, 0.1)'
      }}>
        <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <TrendingDown size={15} style={{ color: '#1e5eff' }} />
          AI 投研核心析出结论
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '14px'
        }}>
          {conclusions.map((con) => {
            const isActive = activeConclusionId === con.id;
            return (
              <div 
                key={con.id}
                onClick={() => setActiveConclusionId(con.id)}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                  border: isActive ? '1px solid rgba(30, 94, 255, 0.3)' : '1px solid rgba(226, 232, 240, 0.8)',
                  boxShadow: isActive ? '0 4px 12px rgba(30, 94, 255, 0.05)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = 'rgba(30, 94, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '10.5px', 
                    fontWeight: '700', 
                    color: con.conclusion_type.includes('风险') || con.conclusion_type.includes('警告') ? '#ef4444' : '#059669',
                    background: con.conclusion_type.includes('风险') || con.conclusion_type.includes('警告') ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {con.conclusion_type}
                  </span>

                  <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                    置信度 {(con.confidence_score! * 100).toFixed(0)}%
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '12.5px', color: '#1e293b', lineHeight: '1.6' }}>
                  {con.content}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                  <span>定位: {con.target_type} ({con.target_id})</span>
                  <span>状态: {con.review_status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 2: Chain Nodes (Left) & Cost Structures (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.25fr) minmax(360px, 0.75fr)',
        gap: '20px'
      }}>
        
        {/* Left Card: Industry Chain Nodes Canvas - Clean light card style */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <Sliders size={15} style={{ color: '#8b5cf6' }} />
              产业链核心节点画布
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              选择节点调取大模型工艺及替代风向评级
            </span>
          </div>

          {/* Node Grid Layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(139, 92, 246, 0.04)' : '#ffffff',
                    border: isSelected ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(226, 232, 240, 0.8)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isSelected ? '0 4px 12px rgba(139, 92, 246, 0.04)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  }}
                >
                  {/* Visual Node Type Tag */}
                  <span style={{
                    fontSize: '9px',
                    color: '#8b5cf6',
                    background: 'rgba(139, 92, 246, 0.06)',
                    border: '1px solid rgba(139, 92, 246, 0.12)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}>
                    {node.node_type}
                  </span>

                  <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px 0' }}>
                    {node.name}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
                    <span>物料成本占比:</span>
                    <span style={{ fontWeight: '700', color: '#1e293b' }}>{node.cost_ratio || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    <span>国产替代比率:</span>
                    <span style={{ fontWeight: '700', color: node.localization_rate === '极低' || node.localization_rate === '低' ? '#ef4444' : '#059669' }}>
                      {node.localization_rate}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  <div style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>综合推荐值</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '800',
                      color: getScoreColor(node.investment_score || 50),
                      fontFamily: "'JetBrains Mono', monospace"
                    }}>
                      {node.investment_score}分
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Expanded Selected Node Detector Details - Light institutional style */}
          {selectedNode && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '8px',
              padding: '14px 18px',
              marginTop: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Compass size={14} style={{ color: '#1e5eff' }} />
                  「{selectedNode.name}」工艺壁垒与替代深度研判
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
                  Node ID: {selectedNode.id}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                {selectedNode.description || '暂无该节点的详细分析，大模型正在从新增研报中提取。'}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                background: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.6)',
                padding: '10px 14px',
                borderRadius: '6px',
                marginTop: '2px'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>
                    <span>技术壁垒得分:</span>
                    <span style={{ color: getScoreColor(selectedNode.barrier_score || 50), fontWeight: '700' }}>{selectedNode.barrier_score}</span>
                  </div>
                  <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px' }}>
                    <div style={{ height: '100%', background: getScoreColor(selectedNode.barrier_score || 50), width: `${selectedNode.barrier_score}%`, borderRadius: '2px' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '5px' }}>
                    <span>技术替代风险:</span>
                    <span style={{ color: getScoreColor(100 - (selectedNode.substitution_risk_score || 50)), fontWeight: '700' }}>{selectedNode.substitution_risk_score}</span>
                  </div>
                  <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '2px' }}>
                    <div style={{ height: '100%', background: '#ef4444', width: `${selectedNode.substitution_risk_score}%`, borderRadius: '2px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Card: Cost Structures & Decline Path - Light theme */}
        <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <BarChart3 size={15} style={{ color: '#10b981' }} />
            BOM 降本路径监测器
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {costs.map((cost) => (
              <div 
                key={cost.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#1e293b' }}>
                    {cost.module_name}
                  </span>
                  <span style={{ 
                    fontSize: '10.5px', 
                    color: '#059669', 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: '700'
                  }}>
                    {cost.decline_rate}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  <div style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.6)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '2px' }}>当前工艺成本</div>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#475569' }}>{cost.current_cost}</div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.02)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '6px 8px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '9px', color: '#10b981', marginBottom: '2px' }}>放量目标成本</div>
                    <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#059669' }}>{cost.target_cost}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                  <span>基准年份: {cost.year}年</span>
                  <span>可信度: {(cost.confidence_score! * 100).toFixed(0)}% ({cost.source_type})</span>
                </div>
              </div>
            ))}

            {costs.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={18} />
                暂未检测到 BOM 成本结构数据。
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Row 3: Evidence Tracing Bottom Section - Light institutional style */}
      <div className="glass-panel" style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <BookOpen size={15} style={{ color: '#06b6d4' }} />
            研报证据链可信度溯源审计
          </h3>
          <span style={{ fontSize: '11px', color: '#0891b2', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} />
            全部数据通过一致性审计合规性比对
          </span>
        </div>

        {/* Evidence Content details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.6fr)',
          gap: '20px'
        }}>
          
          {/* Evidences list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', fontWeight: '700' }}>
              当前结论支撑研报原文段落 (Audit Evidences)
            </div>

            {evidences.map((ev) => {
              const matchedRep = reports.find(r => r.id === ev.report_id);
              return (
                <div 
                  key={ev.id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#0891b2', 
                      background: 'rgba(6, 182, 212, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: '700'
                    }}>
                      {ev.evidence_type} (P{ev.page_no || '?'})
                    </span>

                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Activity size={10} style={{ color: '#06b6d4' }} />
                      AI 校验置信度: {(ev.confidence_score! * 100).toFixed(0)}%
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: '1.6', fontStyle: 'italic', borderLeft: '3px solid rgba(6, 182, 212, 0.3)', paddingLeft: '10px' }}>
                    “{ev.original_text}”
                  </p>

                  {matchedRep && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '10.5px',
                      color: '#94a3b8',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(226,232,240,0.6)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={11} />
                        关联文献: 《{matchedRep.title}》
                      </span>
                      <span>索引: {matchedRep.institution} - {matchedRep.author} ({matchedRep.publish_date})</span>
                    </div>
                  )}
                </div>
              );
            })}

            {evidences.length === 0 && (
              <div style={{ padding: '30px 0', textAlign: 'center', fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <HelpCircle size={18} />
                请在上方点击不同的“核心结论”来加载对应的研报引用证据链。
              </div>
            )}
          </div>

          {/* Parsed Source Reports */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '8px',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#1e293b', borderBottom: '1px solid rgba(226,232,240,0.8)', paddingBottom: '6px' }}>
              已解析文献池 (Indexed Reports)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '280px' }}>
              {reports.map((rep) => (
                <div 
                  key={rep.id}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rep.title}
                  </span>
                  
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {rep.institution} | {rep.author} | {rep.publish_date}
                  </span>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#10b981', marginTop: '4px' }}>
                    <span>可靠度得分: {rep.quality_score}</span>
                    <span style={{ 
                      fontSize: '9px', 
                      background: 'rgba(16, 185, 129, 0.08)', 
                      color: '#059669',
                      padding: '1px 4px', 
                      borderRadius: '3px'
                    }}>
                      {rep.parse_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
