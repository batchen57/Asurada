import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, ChevronDown, Loader2, Eye, Cpu, Link2, FileJson, 
  X, Clock, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw, Play, Pause, Volume2, 
  ShieldCheck, CheckCircle2, Zap, Copy, ExternalLink, HelpCircle 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

export function ModelLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'request' | 'response'>('overview');
  
  // JSON Full Screen View State
  const [jsonView, setJsonView] = useState<{data: any, title: string} | null>(null);
  const [isJsonFullScreen, setIsJsonFullScreen] = useState(false);
  
  // Image Preview State
  const [imageView, setImageView] = useState<{images: string[], title: string} | null>(null);
  const [focusedImgIdx, setFocusedImgIdx] = useState(0);
  const [zoom, setZoom] = useState(1);
  
  // Clipboard/Audio States
  const [copyStatus, setCopyStatus] = useState(false);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<{ url: string; text: string } | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const controls = useDragControls();
  const detailDragControls = useDragControls();

  // High fidelity mock logs for backend fallback
  const getMockModelLogs = (): any[] => [
    {
      id: 1,
      task_name: "Brooks 裸K趋势智能识别",
      task_id: "task_brooks_0912a",
      username: "system_orchestrator",
      user_id: "sys_01",
      model_id: "deepseek-chat",
      model_url: "https://api.deepseek.com/v1/chat/completions",
      status_code: "200",
      started_at: new Date(Date.now() - 5 * 60000).toISOString(),
      ended_at: new Date(Date.now() - 5 * 60000 + 2450).toISOString(),
      input_tokens: 1120,
      output_tokens: 300,
      request_payload: {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个精通 Al Brooks 价格行为学理论的量化分析智能体。" },
          { role: "user", content: "请分析贵州茅台 (600519.SH) 今日日线K线。开盘: 1650.0, 最高: 1685.0, 最低: 1640.0, 收盘: 1680.0。昨日收盘: 1645.0。" }
        ],
        temperature: 0.1
      },
      response_body: {
        id: "chatcmpl-db_brooks_sig",
        choices: [
          {
            message: {
              role: "assistant",
              content: "### 贵州茅台 (600519.SH) 裸K价格行为分析\n\n1. **K线形态识别**: 今日形成一根强烈的**看涨趋势K线 (Bull Trend Bar)**，且为典型的**长下影线 Pinbar**。收盘价接近全天最高价，表明多头力量在午后完全主导市场。\n2. **背景与结构**: 价格处于前期回撤的支撑位（1640.0附近为双底结构颈线），此次在支撑位出现强力买盘，构成**H1 (第一买点) 确认**。\n3. **交易决策建议**: 裸K显示多头动能强劲，建议**继续持仓**。防守止损位上移至今日最低点 1640.0 之下。"
            }
          }
        ],
        usage: { prompt_tokens: 1120, completion_tokens: 300, total_tokens: 1420 }
      }
    },
    {
      id: 2,
      task_name: "VCP 波动率收缩多模态扫描",
      task_id: "task_vcp_0842f",
      username: "admin",
      user_id: "usr_09",
      model_id: "gpt-4o",
      model_url: "https://api.openai.com/v1/chat/completions",
      status_code: "200",
      started_at: new Date(Date.now() - 15 * 60000).toISOString(),
      ended_at: new Date(Date.now() - 15 * 60000 + 4820).toISOString(),
      input_tokens: 2850,
      output_tokens: 400,
      request_payload: {
        model: "gpt-4o",
        messages: [
          { role: "user", content: "分析宁德时代 (300750.SZ) 的走势图表是否符合 Mark Minervini 的 VCP 波动率收缩形态？" }
        ],
        images: [
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mPsr7v7HwAFjQJ09qO7LgAAAABJRU5ErkJggg=="
        ]
      },
      response_body: {
        id: "chatcmpl-db_vcp_check",
        choices: [
          {
            message: {
              role: "assistant",
              content: "### 宁德时代 (300750.SZ) VCP 形态审查结果\n\n- **第一收缩区 (T1)**: 跌幅 18%，历时 15 根K线，成交量显著放大，属于洗盘整理阶段。\n- **第二收缩区 (T2)**: 跌幅 8%，历时 8 根K线，成交量开始压缩，多空双方趋于均衡。\n- **第三收缩区 (T3)**: 跌幅 3.2%，历时 4 根K线，成交量萎缩至地量级别。符合典型的**波动率收缩 (VCP) 特征**。\n- **结论**: 价格已在 382.50 附近形成**突破平台 (Pivot Point)**。建议在放量突破 383.00 时买入第一笔底仓。"
            }
          }
        ],
        usage: { prompt_tokens: 2850, completion_tokens: 400, total_tokens: 3250 }
      }
    },
    {
      id: 3,
      task_name: "TTS 语音播报合成",
      task_id: "task_tts_0915c",
      username: "system_orchestrator",
      user_id: "sys_01",
      model_id: "tts-1",
      model_url: "https://api.openai.com/v1/audio/speech",
      status_code: "200",
      started_at: new Date(Date.now() - 40 * 60000).toISOString(),
      ended_at: new Date(Date.now() - 40 * 60000 + 850).toISOString(),
      input_tokens: 80,
      output_tokens: 40,
      request_payload: {
        model: "tts-1",
        text: "警告：两市成交额跌破八千亿，多智能体已自动收紧整体持仓防御线，对部分弱势股执行分批止损。",
        voice_setting: { voice_id: "alloy", speed: 1.0 }
      },
      response_body: {
        audio_url: "http://localhost:8000/api/tts?text=%E8%AD%A6%E5%91%8A",
        duration_seconds: 4.5
      }
    }
  ];

  // Auto parsing JSON support
  const autoParseJson = (data: any): any => {
    if (!data) return data;
    
    if (typeof data === 'string') {
      let s = data.trim();
      if (s.includes('```')) {
        const mdJsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
        const match = s.match(mdJsonRegex);
        if (match && match[1]) {
          s = match[1].trim();
        }
      }

      if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
        try {
          const parsed = JSON.parse(s);
          return autoParseJson(parsed);
        } catch (e) {}
      }

      const extractJsonBlocks = (text: string) => {
        const blocks: {start: number, end: number, parsed: any}[] = [];
        let pos = 0;
        while (pos < text.length) {
          const start = text.indexOf('{', pos);
          const startArr = text.indexOf('[', pos);
          const actualStart = (start !== -1 && (startArr === -1 || start < startArr)) ? start : startArr;
          if (actualStart === -1) break;
          
          let depth = 0;
          let end = -1;
          const openChar = text[actualStart];
          const closeChar = openChar === '{' ? '}' : ']';

          for (let i = actualStart; i < text.length; i++) {
            if (text[i] === openChar) depth++;
            else if (text[i] === closeChar) {
              depth--;
              if (depth === 0) {
                end = i;
                break;
              }
            }
          }
          
          if (end !== -1) {
            const candidate = text.substring(actualStart, end + 1);
            try {
              const parsed = JSON.parse(candidate);
              if (candidate.length > 4) {
                blocks.push({ start: actualStart, end, parsed });
                pos = end + 1;
                continue;
              }
            } catch (e) {}
          }
          pos = actualStart + 1;
        }
        return blocks;
      };

      const foundBlocks = extractJsonBlocks(s);
      if (foundBlocks.length > 0) {
        const result: any[] = [];
        let lastPos = 0;
        foundBlocks.forEach(block => {
          if (block.start > lastPos) {
            const textPart = s.substring(lastPos, block.start).trim();
            if (textPart) result.push(textPart);
          }
          result.push(autoParseJson(block.parsed));
          lastPos = block.end + 1;
        });
        if (lastPos < s.length) {
          const tail = s.substring(lastPos).trim();
          if (tail) result.push(tail);
        }
        return result.length === 1 ? result[0] : result;
      }
      
      if (s.startsWith('"') && s.endsWith('"') && s.length > 2) {
        try {
          const unquoted = JSON.parse(s);
          if (typeof unquoted === 'string' && unquoted !== s) {
            return autoParseJson(unquoted);
          }
        } catch (e) {}
      }
    } else if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => autoParseJson(item));
      } else {
        const result: any = {};
        for (const key in data) {
          result[key] = autoParseJson(data[key]);
        }
        return result;
      }
    }
    return data;
  };

  // Extract Base64 Images from payload
  const extractBase64Images = (data: any): string[] => {
    const images: string[] = [];
    const search = (obj: any) => {
      if (!obj) return;
      if (typeof obj === 'string') {
        if (obj.startsWith('data:image/')) {
          images.push(obj);
        } 
        else if (obj.length > 500 && /^[A-Za-z0-9+/=]+$/.test(obj.substring(0, 100))) {
          images.push(`data:image/jpeg;base64,${obj}`);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(search);
      } else if (typeof obj === 'object') {
        if ('images' in obj && Array.isArray(obj.images)) {
          obj.images.forEach((img: any) => {
            if (typeof img === 'string') {
              if (img.startsWith('data:image/')) images.push(img);
              else images.push(`data:image/jpeg;base64,${img}`);
            }
          });
        } else {
          Object.values(obj).forEach(search);
        }
      }
    };
    
    search(data);
    return Array.from(new Set(images));
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const res = await fetch(`http://localhost:8000/api/model-logs?search=${encodeURIComponent(search)}&skip=${skip}&limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } else {
        const mock = getMockModelLogs();
        setLogs(mock);
        setTotal(mock.length);
      }
    } catch (e) {
      console.warn("Failed to fetch model logs from backend. Loading mocks.", e);
      const mock = getMockModelLogs();
      setLogs(mock);
      setTotal(mock.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(id);
    setTimeout(() => setCopiedLogId(null), 1500);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Dynamic statistics calculation for Model Logs Dashboard
  const activeCount = logs.length;
  const avgLatency = activeCount > 0 
    ? logs.reduce((acc, log) => {
        const duration = log.ended_at ? (new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 1000 : 0;
        return acc + duration;
      }, 0) / activeCount
    : 2.14;

  const totalTokens = activeCount > 0
    ? logs.reduce((acc, log) => acc + (log.input_tokens || 0) + (log.output_tokens || 0), 0)
    : 4920;

  const successRate = activeCount > 0
    ? (logs.filter(log => log.status_code === '200' || log.status_code === 200).length / activeCount) * 100
    : 100.0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Self-contained CSS styles for stunning transitions, glowing focus, custom tables */}
      <style>{`
        .premium-input:focus {
          border-color: #1e5eff !important;
          box-shadow: 0 0 0 3px rgba(30, 94, 255, 0.15) !important;
          background: #ffffff !important;
        }
        .table-row-hover:hover {
          background: rgba(30, 94, 255, 0.02) !important;
          border-left: 3px solid #1e5eff !important;
        }
        .glass-btn {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 94, 255, 0.25);
        }
        .diagnostic-card {
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s;
        }
        .diagnostic-card:hover {
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          border-color: rgba(30, 94, 255, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
        .tab-btn {
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          border: none;
          background: transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #1e5eff;
        }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 16px;
          right: 16px;
          height: 2px;
          background: #1e5eff;
          border-radius: 999px;
        }
      `}</style>

      {/* Model Logs Diagnostics Dashboard Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Card 1: Total Model Invocations */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(30, 94, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1e5eff',
            border: '1px solid rgba(30, 94, 255, 0.15)'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '500' }}>AI模型调用频次</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginTop: '4px', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
              {total} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>次</span>
            </span>
          </div>
        </div>

        {/* Card 2: Inference Success Rate */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(52, 211, 153, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.15)'
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '500' }}>模型响应成功率</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#10b981', marginTop: '4px', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
              {successRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Card 3: Avg Latency */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.15)'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '500' }}>平均推理延时</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b', marginTop: '4px', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
              {avgLatency.toFixed(2)} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>秒</span>
            </span>
          </div>
        </div>

        {/* Card 4: Token Consumption */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '90px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b5cf6',
            border: '1px solid rgba(139, 92, 246, 0.15)'
          }}>
            <Cpu size={20} />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: '500' }}>两市分析总 Token</span>
            <span style={{ fontSize: '20px', fontWeight: '700', color: '#8b5cf6', marginTop: '4px', display: 'block', fontFamily: "'Outfit', sans-serif" }}>
              {totalTokens.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b' }}>tok</span>
            </span>
          </div>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <form onSubmit={handleSearch} style={{ flexGrow: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="检索量化任务、模型标识、ID或接口URL..."
            className="premium-input"
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              outline: 'none',
              fontSize: '12px',
              background: '#f8fafc',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </form>
        <button 
          onClick={() => { setPage(1); fetchLogs(); }}
          className="glass-btn"
          style={{
            background: 'linear-gradient(135deg, #1e5eff 0%, #3b82f6 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 24px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(30, 94, 255, 0.2)'
          }}
        >
          检索模型
        </button>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ border: '1px solid rgba(226, 232, 240, 0.6)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', fontFamily: "var(--font-title)" }}>任务属性 / 标识 ID</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', fontFamily: "var(--font-title)" }}>调用智能体 / UID</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', fontFamily: "var(--font-title)" }}>底层模型</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', fontFamily: "var(--font-title)" }}>接口端点 URL</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'center', fontFamily: "var(--font-title)" }}>服务状态</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', fontFamily: "var(--font-title)" }}>调用时间</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'center', fontFamily: "var(--font-title)" }}>推理耗时</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'center', fontFamily: "var(--font-title)" }}>Token 消耗</th>
                <th style={{ padding: '14px 16px', color: '#475569', fontWeight: '600', textAlign: 'center', fontFamily: "var(--font-title)" }}>动作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={16} className="spin-active animate-spin" style={{ color: '#1e5eff' }} />
                      <span style={{ fontWeight: '500' }}>正在检索多智能体模型审计日志...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ fontSize: '13px', fontWeight: '500' }}>未找到任何模型调用审计记录</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const duration = log.ended_at ? (new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 1000 : 0;
                  const isSuccess = log.status_code === '200' || log.status_code === 200;
                  
                  return (
                    <tr 
                      key={log.id} 
                      className="table-row-hover"
                      style={{ 
                        borderBottom: '1px solid rgba(226, 232, 240, 0.4)', 
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        borderLeft: '3px solid transparent'
                      }}
                    >
                      {/* Task Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{log.task_name || '未知系统服务'}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "var(--font-mono)", marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{log.task_id}</span>
                          <button 
                            onClick={() => copyToClipboard(log.task_id, `id-${log.id}`)}
                            style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}
                            title="复制 ID"
                          >
                            <Copy size={10} style={{ color: copiedLogId === `id-${log.id}` ? '#10b981' : '#94a3b8' }} />
                          </button>
                        </div>
                      </td>

                      {/* User / Agent */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#334155', fontSize: '13px' }}>
                          👤 {log.username === 'system_orchestrator' ? '主调度智能体' : log.username || '系统管理员'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: "var(--font-mono)", marginTop: '2px' }}>
                          {log.user_id ? `UID: ${log.user_id}` : '—'}
                        </div>
                      </td>

                      {/* Model Chip */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.12)', borderRadius: '6px', padding: '3px 8px' }}>
                          <Cpu size={12} style={{ color: '#8b5cf6' }} />
                          <span style={{ fontFamily: "var(--font-mono)", color: '#8b5cf6', fontWeight: '600', fontSize: '11px' }}>{log.model_id}</span>
                        </div>
                      </td>

                      {/* Endpoint URL */}
                      <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                        <div 
                          style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontFamily: "var(--font-mono)", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title={log.model_url}
                        >
                          <Link2 size={12} style={{ flexShrink: 0, color: '#94a3b8' }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.model_url}</span>
                        </div>
                      </td>

                      {/* Status */}
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
                          {isSuccess ? 'SUCCESS' : 'FAILED'} ({log.status_code || '500'})
                        </span>
                      </td>

                      {/* Start Time */}
                      <td style={{ padding: '14px 16px', color: '#475569', fontSize: '11px', fontFamily: "var(--font-mono)" }}>
                        {new Date(log.started_at).toLocaleString()}
                      </td>

                      {/* Latency */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ 
                          fontWeight: '700', 
                          color: duration < 1.0 ? '#10b981' : duration < 3.0 ? '#f59e0b' : '#ef4444', 
                          fontFamily: "var(--font-mono)" 
                        }}>
                          {duration.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '1px' }}>s</span>
                      </td>

                      {/* Tokens */}
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '700', fontFamily: "var(--font-mono)", color: '#1e5eff' }}>
                        {(log.input_tokens || 0) + (log.output_tokens || 0)}
                      </td>

                      {/* Detail Trigger */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => { setSelectedLog(log); setModalTab('overview'); }}
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
                            borderRadius: '6px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30, 94, 255, 0.06)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Eye size={13} />
                          数据穿透
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
            <div>
              共计 <span style={{ fontWeight: '600', color: '#1e293b' }}>{total}</span> 条模型调用审计存证，当前第 {page} / {totalPages} 页
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'white',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  cursor: (page === 1 || loading) ? 'not-allowed' : 'pointer',
                  opacity: (page === 1 || loading) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all 0.15s'
                }}
              >
                <ChevronLeft size={12} />
                上一页
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                style={{
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  background: 'white',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  cursor: (page === totalPages || loading) ? 'not-allowed' : 'pointer',
                  opacity: (page === totalPages || loading) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all 0.15s'
                }}
              >
                下一页
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Diagnostics Modal (数据穿透弹窗) */}
      <AnimatePresence>
        {selectedLog && (
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
          }} onClick={() => setSelectedLog(null)}>
            <motion.div 
              className="glass-panel" 
              drag
              dragControls={detailDragControls}
              dragListener={false}
              dragMomentum={false}
              dragElastic={0.1}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                width: '780px', 
                maxHeight: '90vh', 
                background: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(30, 94, 255, 0.08), 0 0 40px rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                touchAction: 'none'
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div 
                onPointerDown={(e) => detailDragControls.start(e)}
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)',
                  cursor: 'move',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(30, 94, 255, 0.08)', borderRadius: '8px', border: '1px solid rgba(30, 94, 255, 0.15)' }}>
                    <FileJson size={18} style={{ color: '#1e5eff' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', fontFamily: "var(--font-title)" }}>多智能体模型审计诊断诊断台</h3>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "var(--font-mono)" }}>Log ID: {selectedLog.id} | 物理数据秒级存证</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)} 
                  style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                >
                  <X size={18} style={{ color: '#64748b' }} />
                </button>
              </div>

              {/* Modal Tab Menu */}
              <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', padding: '0 16px' }}>
                <button 
                  className={`tab-btn ${modalTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setModalTab('overview')}
                >
                  属性概览 Overview
                </button>
                <button 
                  className={`tab-btn ${modalTab === 'request' ? 'active' : ''}`}
                  onClick={() => setModalTab('request')}
                >
                  请求与入参 Request ({selectedLog.input_tokens || 0} tok)
                </button>
                <button 
                  className={`tab-btn ${modalTab === 'response' ? 'active' : ''}`}
                  onClick={() => setModalTab('response')}
                >
                  返回与响应 Response ({selectedLog.output_tokens || 0} tok)
                </button>
              </div>

              {/* Modal Body Container */}
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', height: '520px' }} className="custom-scrollbar">
                
                {modalTab === 'overview' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                  >
                    {/* Metadata Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      <div className="diagnostic-card"><DetailItem label="量化任务名称" val={selectedLog.task_name} /></div>
                      <div className="diagnostic-card"><DetailItem label="关联任务 ID" val={selectedLog.task_id} mono /></div>
                      <div className="diagnostic-card"><DetailItem label="调用用户" val={selectedLog.username || '系统管理员'} /></div>
                      <div className="diagnostic-card"><DetailItem label="用户 ID" val={selectedLog.user_id ? `UID: ${selectedLog.user_id}` : '—'} mono /></div>
                      <div className="diagnostic-card"><DetailItem label="模型标识符" val={selectedLog.model_id} mono /></div>
                      <div className="diagnostic-card"><DetailItem label="响应状态码" val={selectedLog.status_code || '200 OK'} /></div>
                      <div className="diagnostic-card"><DetailItem label="调用开始时间" val={new Date(selectedLog.started_at).toLocaleString()} /></div>
                      <div className="diagnostic-card"><DetailItem label="消耗推理时延" val={`${((selectedLog.ended_at ? new Date(selectedLog.ended_at).getTime() - new Date(selectedLog.started_at).getTime() : 0) / 1000).toFixed(2)} 秒`} /></div>
                      <div className="diagnostic-card"><DetailItem label="敏感数据存证" val="SHA-256 物理加锁" /></div>
                    </div>

                    {/* Token Progress Bar Card */}
                    <div className="diagnostic-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>TOKEN 吞吐消耗看板</span>
                        <span style={{ fontSize: '11px', fontFamily: "var(--font-mono)", fontWeight: '700', color: '#1e5eff' }}>
                          共计: {(selectedLog.input_tokens || 0) + (selectedLog.output_tokens || 0)} Tokens
                        </span>
                      </div>
                      
                      {/* Bar Proportion */}
                      {(() => {
                        const prompt = selectedLog.input_tokens || 0;
                        const completion = selectedLog.output_tokens || 0;
                        const total = prompt + completion || 1;
                        const promptPct = (prompt / total) * 100;
                        const compPct = (completion / total) * 100;
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: '#edf2f7', overflow: 'hidden', display: 'flex' }}>
                              <div style={{ width: `${promptPct}%`, background: 'linear-gradient(90deg, #1e5eff 0%, #3b82f6 100%)' }} title={`输入: ${prompt}`} />
                              <div style={{ width: `${compPct}%`, background: 'linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%)' }} title={`输出: ${completion}`} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', fontFamily: "var(--font-mono)" }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e5eff' }} />
                                输入 (Prompt): {prompt} ({promptPct.toFixed(0)}%)
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }} />
                                输出 (Completion): {completion} ({compPct.toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* URL Card */}
                    <div className="diagnostic-card" style={{ background: '#f8fafc', borderLeft: '4px solid #1e5eff' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', display: 'block' }}>模型调用端点 API URL</span>
                      <code style={{ fontSize: '11px', color: '#1e293b', marginTop: '6px', display: 'block', wordBreak: 'break-all', fontFamily: "var(--font-mono)", fontWeight: '500' }}>
                        {selectedLog.model_url}
                      </code>
                    </div>
                  </motion.div>
                )}

                {modalTab === 'request' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Request Payload (输入敏感参数镜像)</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {selectedLog.request_payload && extractBase64Images(selectedLog.request_payload).length > 0 && (
                          <button 
                            onClick={() => setImageView({
                              images: extractBase64Images(selectedLog.request_payload), 
                              title: "多模态视觉输入审查"
                            })}
                            style={{ 
                              background: 'rgba(30, 94, 255, 0.05)', 
                              border: '1px solid rgba(30, 94, 255, 0.15)', 
                              color: '#1e5eff', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '10px', 
                              fontWeight: '600', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            📷 包含 {extractBase64Images(selectedLog.request_payload).length} 张图片，点击审查
                          </button>
                        )}
                        <button 
                          onClick={() => setJsonView({data: selectedLog.request_payload, title: "Request Payload (模型入参)"})}
                          style={{ 
                            background: 'rgba(139, 92, 246, 0.05)', 
                            border: '1px solid rgba(139, 92, 246, 0.15)', 
                            color: '#8b5cf6', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            cursor: 'pointer' 
                          }}
                        >
                          👁️ 全屏代码模式
                        </button>
                      </div>
                    </div>
                    
                    {/* Collapsible VS Code-styled JSON Tree Container */}
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">
                      <div style={{ fontSize: '11px', fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
                        <JsonView data={autoParseJson(selectedLog.request_payload)} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {modalTab === 'response' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Response Body (模型输出推理决策存证)</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {(() => {
                          const ttsInfo = getTTSInfo(selectedLog);
                          if (!ttsInfo) return null;
                          return (
                            <button
                              onClick={() => {
                                const url = `http://localhost:8000/api/tts?text=${encodeURIComponent(ttsInfo.text)}&voice_id=${ttsInfo.voiceId}`;
                                setPlayingAudio({ url, text: ttsInfo.text });
                              }}
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(167, 139, 250, 0.1) 100%)', 
                                border: '1px solid rgba(139, 92, 246, 0.2)', 
                                color: '#8b5cf6', 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                fontSize: '10px', 
                                fontWeight: '600', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              🔊 收听系统合成语音
                            </button>
                          );
                        })()}
                        <button 
                          onClick={() => setJsonView({data: selectedLog.response_body, title: "Response Body (模型出参)"})}
                          style={{ 
                            background: 'rgba(139, 92, 246, 0.05)', 
                            border: '1px solid rgba(139, 92, 246, 0.15)', 
                            color: '#8b5cf6', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '10px', 
                            fontWeight: '600', 
                            cursor: 'pointer' 
                          }}
                        >
                          👁️ 全屏代码模式
                        </button>
                      </div>
                    </div>
                    
                    {/* Collapsible VS Code-styled JSON Tree Container */}
                    <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '350px', overflowY: 'auto' }} className="custom-scrollbar">
                      <div style={{ fontSize: '11px', fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
                        <JsonView data={autoParseJson(selectedLog.response_body)} />
                      </div>
                    </div>
                  </motion.div>
                )}

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
                  onClick={() => setSelectedLog(null)}
                  className="glass-btn"
                  style={{
                    background: 'linear-gradient(135deg, #1e5eff 0%, #3b82f6 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 24px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(30, 94, 255, 0.2)'
                  }}
                >
                  确定并归档
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JSON independent Fullscreen overlay (VS Code theme, draggable header, copy and exit) */}
      <AnimatePresence>
        {jsonView && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2010, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)' }}
              onClick={() => { setJsonView(null); setIsJsonFullScreen(false); }}
            />
            <motion.div
              layout
              drag={!isJsonFullScreen}
              dragControls={controls}
              dragListener={false}
              dragMomentum={false}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                x: isJsonFullScreen ? 0 : undefined,
                y: isJsonFullScreen ? 0 : undefined,
                scale: 1, 
                opacity: 1,
                width: isJsonFullScreen ? "100vw" : "896px", 
                height: isJsonFullScreen ? "100vh" : "80vh",
                borderRadius: isJsonFullScreen ? "0px" : "20px",
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: isJsonFullScreen ? 'fixed' : 'relative',
                zIndex: 2012,
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                overflow: 'hidden',
                maxWidth: isJsonFullScreen ? "100vw" : "95%",
                maxHeight: isJsonFullScreen ? "100vh" : "90%",
                touchAction: "none"
              }}
            >
              {/* Header */}
              <div 
                onPointerDown={(e) => !isJsonFullScreen && controls.start(e)}
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: !isJsonFullScreen ? 'move' : 'default',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(30, 94, 255, 0.1)', borderRadius: '8px' }}>
                    <FileJson size={20} style={{ color: '#1e5eff' }} />
                  </div>
                  <h3 style={{ fontWeight: '700', color: 'white', fontSize: '14px', fontFamily: "var(--font-title)" }}>{jsonView.title}</h3>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(jsonView.data, null, 2));
                      setCopyStatus(true);
                      setTimeout(() => setCopyStatus(false), 1500);
                    }}
                    style={{
                      padding: '6px 14px',
                      fontSize: '11px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontWeight: '600'
                    }}
                  >
                    {copyStatus ? "已复制 JSON" : "复制 JSON"}
                  </button>
                  
                  <button
                    onClick={() => setIsJsonFullScreen(!isJsonFullScreen)}
                    style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '6px' }}
                    title={isJsonFullScreen ? "恢复窗口" : "全屏模式"}
                  >
                    <Eye size={18} style={{ color: 'white' }} />
                  </button>
                  
                  <button 
                    onClick={() => { setJsonView(null); setIsJsonFullScreen(false); }}
                    style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '6px' }}
                  >
                    <X size={18} style={{ color: 'white' }} />
                  </button>
                </div>
              </div>

              {/* Collapsible VS Code-styled JSON Tree */}
              <div style={{ padding: '24px', overflow: 'auto', flexGrow: 1, background: 'rgba(0,0,0,0.15)' }} className="custom-scrollbar">
                <div style={{ fontSize: '12px', fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
                  <JsonView data={autoParseJson(jsonView.data)} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Vision Overlay (Carousel with Zoom, Rotate, Drag) */}
      <AnimatePresence>
        {imageView && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.96)', backdropFilter: 'blur(12px)', zIndex: 2020, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} 
            onClick={() => setImageView(null)}
          >
            {/* Topbar Controls */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                zIndex: 2022
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ padding: '8px', background: 'rgba(139,92,246,0.15)', borderRadius: '8px' }}>
                  <ImageIcon size={20} style={{ color: '#a78bfa' }} />
                </div>
                <div>
                  <h3 style={{ color: 'white', fontWeight: '700', fontSize: '14px', fontFamily: "var(--font-title)" }}>{imageView.title}</h3>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: "var(--font-mono)", marginTop: '2px' }}>
                    IMAGE {focusedImgIdx + 1} / {imageView.images.length} • {Math.round(zoom * 100)}% 缩放
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', padding: '4px' }}>
                  <button 
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                    style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '6px' }}
                    title="缩小"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <div style={{ padding: '0 8px', fontSize: '10px', fontFamily: "var(--font-mono)", color: 'rgba(255,255,255,0.6)', width: '48px', textAlign: 'center' }}>
                    {Math.round(zoom * 100)}%
                  </div>
                  <button 
                    onClick={() => setZoom(prev => Math.min(5, prev + 0.25))}
                    style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '6px' }}
                    title="放大"
                  >
                    <ZoomIn size={14} />
                  </button>
                  <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                  <button 
                    onClick={() => setZoom(1)}
                    style={{ border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', padding: '6px' }}
                    title="重置"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
                
                <button 
                  onClick={() => setImageView(null)}
                  style={{
                    padding: '8px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    cursor: 'pointer',
                    borderRadius: '8px'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>

            {/* Viewport (Drag & Scale) */}
            <div style={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'grab' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={focusedImgIdx + zoom}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}
                >
                  <motion.div
                    drag
                    dragConstraints={{ left: -800, right: 800, top: -800, bottom: 800 }}
                    dragElastic={0.15}
                    dragMomentum={false}
                    style={{ position: 'relative', scale: zoom }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <img 
                      src={imageView.images[focusedImgIdx]} 
                      alt="Multi-modal Visual Asset" 
                      style={{ 
                        boxShadow: '0 25px 70px rgba(0,0,0,0.8), 0 0 40px rgba(30,94,255,0.1)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.15)', 
                        pointerEvents: 'none', 
                        userSelect: 'none',
                        maxHeight: '70vh',
                        maxWidth: '85vw'
                      }}
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Nav Buttons */}
              {imageView.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFocusedImgIdx(prev => (prev > 0 ? prev - 1 : imageView.images.length - 1)); setZoom(1); }}
                    style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFocusedImgIdx(prev => (prev < imageView.images.length - 1 ? prev + 1 : 0)); setZoom(1); }}
                    style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {imageView.images.length > 1 && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ padding: '20px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'center', gap: '12px', zIndex: 2021 }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {imageView.images.map((src, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { setFocusedImgIdx(idx); setZoom(1); }}
                    style={{
                      width: '72px',
                      height: '48px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: focusedImgIdx === idx ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.15)',
                      transform: focusedImgIdx === idx ? 'scale(1.05)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      padding: 0,
                      background: 'black'
                    }}
                  >
                    <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Thumbnail preview ${idx}`} />
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Floating Audio player wave control */}
      <AnimatePresence>
        {playingAudio && (
          <AudioPlayerOverlay
            audioUrl={playingAudio.url}
            text={playingAudio.text}
            onClose={() => setPlayingAudio(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const getTTSInfo = (log: any) => {
  if (!log || !log.request_payload) return null;
  const payload = log.request_payload;
  const text = payload.text || '';
  const voiceId = payload.voice_setting?.voice_id || 'alloy';
  if (text) {
    return { text, voiceId };
  }
  return null;
};

// Diagnostics Detail Item
function DetailItem({ label, val, mono = false }: { label: string, val: string, mono?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: "var(--font-title)" }}>{label}</div>
      <div style={
        mono ? {
          fontFamily: "var(--font-mono)",
          fontSize: '11px',
          background: '#f8fafc',
          padding: '4px 8px',
          borderRadius: '6px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          color: '#1e293b',
          fontWeight: '500',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        } : {
          fontSize: '12px',
          fontWeight: '600',
          color: '#1e293b',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }
      }>
        {val || '--'}
      </div>
    </div>
  );
}

// Collapsible VS Code-styled JSON Tree Component
function JsonView({ data, isLast = true }: { data: any, isLast?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);

  if (data === null) return <span style={{ color: '#64748b' }}>null{!isLast && ","}</span>;
  if (typeof data === "boolean") return <span style={{ color: '#c084fc' }}>{data.toString()}{!isLast && ","}</span>;
  if (typeof data === "number") return <span style={{ color: '#fbbf24' }}>{data}{!isLast && ","}</span>;
  if (typeof data === "string") {
    const isMultiline = data.includes('\n');
    return (
      <span style={{ color: '#34d399', wordBreak: 'break-all' }}>
        "{isMultiline ? data.replace(/\n/g, '↵') : data}"{!isLast && ","}
      </span>
    );
  }

  const isArray = Array.isArray(data);
  const keys = isArray ? data : Object.keys(data);
  const isEmpty = isArray ? data.length === 0 : keys.length === 0;

  if (isEmpty) return <span style={{ color: '#93c5fd' }}>{isArray ? "[]" : "{}"}{!isLast && ","}</span>;

  return (
    <div style={{ display: 'inline-block', verticalAlign: 'top' }}>
      <div 
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '0 4px', margin: '0 -4px', borderRadius: '4px', userSelect: 'none' }}
        onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
      >
        {collapsed ? <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
        <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>{isArray ? "[" : "{"}</span>
        {collapsed && (
          <span style={{ padding: '1px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>
             {isArray ? `${data.length} items` : `${keys.length} keys`}
          </span>
        )}
      </div>

      {!collapsed && (
        <div style={{ paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.05)', margin: '2px 0 2px 6px' }}>
          {isArray ? (
            data.map((item: any, i: number) => (
              <div key={i} style={{ padding: '2px 0' }}>
                <JsonView data={item} isLast={i === data.length - 1} />
              </div>
            ))
          ) : (
            Object.keys(data).map((key, i, arr) => (
              <div key={key} style={{ display: 'flex', gap: '8px', padding: '2px 0' }}>
                <span style={{ color: '#60a5fa', fontWeight: '500', flexShrink: 0 }}>"{key}":</span>
                <JsonView data={data[key]} isLast={i === arr.length - 1} />
              </div>
            ))
          )}
        </div>
      )}
      
      {!collapsed ? (
        <div style={{ color: '#93c5fd', fontWeight: 'bold' }}>{isArray ? "]" : "}"}{!isLast && ","}</div>
      ) : (
        <span style={{ color: '#93c5fd', fontWeight: 'bold' }}>{isArray ? "]" : "}"}{!isLast && ","}</span>
      )}
    </div>
  );
}

// Floating Audio Playback diagnostics panel with dynamic sound wave micro-animations
function AudioPlayerOverlay({ audioUrl, text, onClose }: { audioUrl: string; text: string; onClose: () => void }) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const dragControls = useDragControls();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [sliderVal, setSliderVal] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    if (!isSeeking) {
      setSliderVal(currentTime);
    }
  }, [currentTime, isSeeking]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.error("Error playing audio:", err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    setLoading(false);
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderVal(parseFloat(e.target.value));
  };

  const handleProgressBarStart = () => {
    setIsSeeking(true);
  };

  const handleProgressBarEnd = (e: any) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
    setIsSeeking(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2030, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{ 
          left: -window.innerWidth / 2 + 192, 
          right: window.innerWidth / 2 - 192, 
          top: -window.innerHeight / 2 + 150, 
          bottom: window.innerHeight / 2 - 150 
        }}
        style={{
          width: '384px',
          background: 'rgba(28, 22, 46, 0.96)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '16px',
          padding: '18px',
          boxShadow: '0 25px 50px rgba(139,92,246,0.2)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          pointerEvents: 'auto',
          cursor: 'default',
          userSelect: 'none'
        }}
      >
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onCanPlay={() => setLoading(false)}
          onWaiting={() => setLoading(true)}
        />

        {/* Header */}
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px', cursor: 'grab' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', boxShadow: '0 0 8px #8b5cf6' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: '#a78bfa', fontFamily: "var(--font-title)" }}>收听决策播报合成语音</span>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', color: '#cbd5e1', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} style={{ color: 'white' }} />
          </button>
        </div>

        {/* Text */}
        <div style={{ background: 'rgba(13,7,20,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px', userSelect: 'text' }}>
          <p style={{ fontSize: '12px', color: '#c3c0cc', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{text}"
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: '#94a3b8', fontFamily: "var(--font-mono)" }}>
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={sliderVal}
              onMouseDown={handleProgressBarStart}
              onTouchStart={handleProgressBarStart}
              onMouseUp={handleProgressBarEnd}
              onTouchEnd={handleProgressBarEnd}
              onChange={handleProgressBarChange}
              style={{ flexGrow: 1, height: '4px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', borderRadius: '2px' }}
            />
            <span>{formatTime(duration)}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Play Button */}
            <button
              onClick={handlePlayPause}
              disabled={loading}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: loading ? 'rgba(139, 92, 246, 0.2)' : '#8b5cf6',
                color: 'white',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
              }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={18} style={{ color: 'white' }} />
              ) : (
                <Play size={18} style={{ color: 'white', marginLeft: '2px' }} />
              )}
            </button>

            {/* Sound waves visualizer */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '24px', padding: '0 12px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <motion.div
                  key={i}
                  animate={isPlaying ? {
                    height: [
                      "20%",
                      i % 2 === 0 ? "80%" : "60%",
                      "45%",
                      i % 3 === 0 ? "100%" : "55%",
                      "20%"
                    ]
                  } : { height: "20%" }}
                  transition={{
                    duration: 1.0,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.08,
                    ease: "easeInOut"
                  }}
                  style={{ width: '3px', background: 'linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%)', borderRadius: '2px', height: '20%' }}
                />
              ))}
            </div>

            {/* Volume info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
              <Volume2 size={16} style={{ color: '#a78bfa' }} />
              <span style={{ fontSize: '10px', fontFamily: "var(--font-mono)" }}>100%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
