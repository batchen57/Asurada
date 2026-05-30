import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Cpu, Globe, GripVertical, Info, Settings, FileText, Zap, Key, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_BASE = 'http://localhost:8000/api';

interface SortableModelItemProps {
  m: any;
  editingId: string | null;
  editForm: any;
  setEditForm: (val: any) => void;
  setEditingId: (val: string | null) => void;
  handleSave: () => void;
  handleDelete: (id: string) => void;
  handleTest: (id: string) => void;
  testingId: string | null;
  className?: string;
}

function SortableModelItem({ m, setEditingId, handleDelete, handleTest, testingId }: SortableModelItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: m.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const isDefault = m.is_default === 'true';

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '20px',
        background: isDefault 
          ? 'linear-gradient(135deg, rgba(240, 244, 255, 0.85) 0%, rgba(245, 240, 255, 0.85) 100%)' 
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: isDefault ? '4px solid #1e5eff' : '1px solid rgba(230, 235, 245, 0.8)',
        borderRight: isDefault ? '1px solid rgba(30, 94, 255, 0.15)' : '1px solid rgba(230, 235, 245, 0.8)',
        borderBottom: isDefault ? '1px solid rgba(30, 94, 255, 0.15)' : '1px solid rgba(230, 235, 245, 0.8)',
        borderLeft: isDefault ? '1px solid rgba(30, 94, 255, 0.15)' : '1px solid rgba(230, 235, 245, 0.8)',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        boxShadow: isDefault ? '0 8px 30px rgba(30, 94, 255, 0.06)' : '0 8px 32px 0 rgba(31, 38, 135, 0.03)',
        transition: 'all 0.25s ease'
      }}
      className="glass-panel"
    >
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: isDefault ? 'rgba(30, 94, 255, 0.12)' : 'rgba(30, 94, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isDefault ? '1px solid rgba(30, 94, 255, 0.25)' : '1px solid rgba(30, 94, 255, 0.12)'
          }}>
            <Cpu size={16} style={{ color: '#1e5eff' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', lineHeight: 1.2 }}>{m.name}</h4>
              {isDefault && (
                <span className="badge badge-blue" style={{ fontSize: '9px', padding: '1px 6px', fontWeight: '700', borderRadius: '4px', letterSpacing: '0.3px', background: 'rgba(30, 94, 255, 0.12)', color: '#1e5eff' }}>
                  默认决策
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-gray" style={{ fontSize: '10px', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Globe size={10} />
                {m.provider}
              </span>
              {m.status === 'success' && (
                <span className="badge badge-green" style={{ fontSize: '10px', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} title={`测试时间: ${m.tested_at || '无'}`}>
                  <CheckCircle2 size={10} />
                  连通成功
                  {m.latency_ms > 0 && <span style={{ opacity: 0.8, fontSize: '9px' }}>({m.latency_ms}ms)</span>}
                </span>
              )}
              {m.status === 'failed' && (
                <span className="badge badge-red" style={{ fontSize: '10px', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }} title={m.error_message || '连接错误'}>
                  <XCircle size={10} />
                  连通失败
                </span>
              )}
              {(!m.status || m.status === 'unknown') && (
                <span className="badge badge-gray" style={{ fontSize: '10px', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#94a3b8' }} />
                  未测试
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button 
            onClick={() => handleTest(m.id)} 
            disabled={testingId === m.id}
            title="测试连通性"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
          >
            <RefreshCw size={13} className={cn(testingId === m.id && "animate-spin")} />
          </button>
          
          <div 
            {...attributes} 
            {...listeners} 
            title="拖拽排序"
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: '#94a3b8',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
          >
            <GripVertical size={13} />
          </div>

          <button 
            onClick={() => setEditingId(m.id)}
            title="编辑模型"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1e5eff'; e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Edit2 size={13} />
          </button>

          <button 
            onClick={() => handleDelete(m.id)}
            title="删除配置"
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* API Config block */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #edf2f7',
        borderRadius: '8px',
        padding: '10px 12px',
        fontSize: '11px',
        fontFamily: "var(--font-mono)",
        color: '#475569',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#94a3b8' }}>ID:</span> <span style={{ color: '#1e293b', fontWeight: '500' }}>{m.identifier}</span>
        </div>
        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#94a3b8' }}>URL:</span> <span style={{ color: '#1e293b', fontWeight: '500' }}>{m.base_url || '—'}</span>
        </div>
        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span style={{ color: '#94a3b8' }}>Key:</span> <span style={{ color: '#1e293b', fontWeight: '500' }}>{m.api_key ? '••••' + m.api_key.slice(-4) : '未配置'}</span>
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: '12px',
        color: '#64748b',
        lineHeight: 1.5,
        height: '36px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      }}>
        {m.description || '无模型描述信息。'}
      </p>

      {/* Capabilities Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto', paddingTop: '4px' }}>
        {(m.capabilities || []).map((cap: string) => (
          <span key={cap} className={
            cap === 'text' ? 'badge badge-blue' :
            cap === 'image' ? 'badge badge-purple' :
            'badge badge-yellow'
          } style={{ fontSize: '10px', padding: '2px 8px' }}>
            {cap === 'text' && '文本分析'}
            {cap === 'image' && '图片识别'}
            {cap === 'video' && '视频理解'}
          </span>
        ))}
        {(!m.capabilities || m.capabilities.length === 0) && (
          <span className="badge badge-gray" style={{ fontSize: '10px', padding: '2px 8px', fontStyle: 'italic', opacity: 0.6 }}>
            未标注能力
          </span>
        )}
      </div>
    </div>
  );
}

export function ModelConfig() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    identifier: '', 
    provider: '', 
    description: '', 
    api_key: '', 
    base_url: '', 
    is_default: 'false', 
    capabilities: [] as string[] 
  });

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingUnsaved, setTestingUnsaved] = useState(false);
  const [unsavedTestResult, setUnsavedTestResult] = useState<any | null>(null);

  const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
  const [isModalDragging, setIsModalDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('svg') || target.closest('input') || target.closest('select') || target.closest('textarea')) return;

    setIsModalDragging(true);
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const startX = e.clientX - modalPos.x;
    const startY = e.clientY - modalPos.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const nextX = moveEvent.clientX - startX;
      const nextY = moveEvent.clientY - startY;

      // Boundary constraints: Keep at least 150px of the modal visible horizontally, and keep the header visible vertically
      const minX = -window.innerWidth / 2 + 150;
      const maxX = window.innerWidth / 2 - 150;
      const minY = -window.innerHeight / 2 + 100;
      const maxY = window.innerHeight / 2 - 100;

      setModalPos({
        x: Math.max(minX, Math.min(maxX, nextX)),
        y: Math.max(minY, Math.min(maxY, nextY))
      });
    };

    const handleMouseUp = () => {
      setIsModalDragging(false);
      document.body.style.userSelect = originalUserSelect;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE}/models`);
      if (res.ok) {
        const data = await res.json();
        setModels(data);
      }
    } catch (e) {
      console.error("Error fetching models:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`${API_BASE}/models/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        setModels(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      }
    } catch (e) {
      console.error("Error testing model connection:", e);
    } finally {
      setTestingId(null);
    }
  };

  const handleTestUnsaved = async () => {
    setTestingUnsaved(true);
    setUnsavedTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/models/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          identifier: editForm.identifier,
          provider: editForm.provider,
          api_key: editForm.api_key,
          base_url: editForm.base_url
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUnsavedTestResult(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setUnsavedTestResult({
          status: 'failed',
          error_message: errData.detail || '测试失败：请求返回了错误状态码'
        });
      }
    } catch (e: any) {
      setUnsavedTestResult({
        status: 'failed',
        error_message: e.message || '网络连接异常'
      });
    } finally {
      setTestingUnsaved(false);
    }
  };

  const closeEditModal = () => {
    setEditingId(null);
    setUnsavedTestResult(null);
    setModalPos({ x: 0, y: 0 });
  };

  useEffect(() => { fetchModels(); }, []);

  const presets = [
    { name: 'Gemini 2.0 Pro', provider: 'Google', identifier: 'gemini-2.0-pro-exp-02-05', base_url: '', description: 'Google 顶尖多模态模型，支持原生视频理解。', capabilities: ['text', 'image', 'video'] },
    { name: 'Qwen-VL-Max', provider: 'Alibaba', identifier: 'qwen-vl-max', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', description: '通义千问视觉大模型，视频理解能力强。', capabilities: ['text', 'image', 'video'] },
    { name: 'DeepSeek Chat', provider: 'DeepSeek', identifier: 'deepseek-chat', base_url: 'https://api.deepseek.com', description: '深度求索高性能模型，环境分析极具性价比。', capabilities: ['text'] },
    { name: 'GPT-4o', provider: 'OpenAI', identifier: 'gpt-4o', base_url: 'https://api.openai.com/v1', description: 'OpenAI 旗舰全能模型，推理能力卓越。', capabilities: ['text', 'image', 'video'] },
    { name: 'MiniMax-M2.7', provider: 'MiniMax', identifier: 'MiniMax-M2.7', base_url: 'https://api.minimax.chat/v1', description: '国产大模型新锐，文本与视觉理解均衡。', capabilities: ['text', 'image'] },
  ];

  const handleApplyPreset = (presetName: string) => {
    const p = presets.find(x => x.name === presetName);
    if (p) {
      setEditForm({
        ...editForm,
        name: p.name,
        provider: p.provider,
        identifier: p.identifier,
        base_url: p.base_url,
        description: p.description,
        capabilities: p.capabilities || []
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = models.findIndex((i) => i.id === active.id);
      const newIndex = models.findIndex((i) => i.id === over?.id);
      const newItems = arrayMove(models, oldIndex, newIndex);
      setModels(newItems);
      
      // Update order in background
      for (let i = 0; i < newItems.length; i++) {
        fetch(`${API_BASE}/models/${newItems[i].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...newItems[i], sort_order: (i + 1) * 10 })
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      const url = editingId === 'new' ? `${API_BASE}/models` : `${API_BASE}/models/${editingId}`;
      const method = editingId === 'new' ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...editForm, 
          sort_order: editingId === 'new' ? models.length * 10 : 0 
        })
      });

      if (response.ok) {
        closeEditModal();
        fetchModels();
      }
    } catch (e) {
      console.error("Error saving model:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确认删除该模型？')) return;
    try {
      await fetch(`${API_BASE}/models/${id}`, { method: "DELETE" });
      fetchModels();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Cpu size={22} style={{ color: '#1e5eff' }} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>AI 智能体模型配置 (AI Model Settings)</h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: 1.6 }}>
              配置多智能体量化分析系统的底层大语言模型，支持一键加载预设、接口连通性验证与调用权重的设定。
            </p>
          </div>
        </div>

        <button
          onClick={() => { 
            setEditingId('new'); 
            setEditForm({ name: '', identifier: '', provider: '', api_key: '', base_url: '', description: '', is_default: 'false', capabilities: [] }); 
            setUnsavedTestResult(null);
          }}
          style={{
            background: '#1e5eff',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(30, 94, 255, 0.16)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#164ecf'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1e5eff'}
        >
          <Plus size={16} />
          新增模型
        </button>
      </div>

      {/* Grid List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <RefreshCw size={32} className="spin-active animate-spin" style={{ color: '#1e5eff' }} />
          <span style={{ fontSize: '13px', color: '#64748b' }}>正在拉取底层大语言模型配置...</span>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '20px'
        }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={models.map(m => m.id)} strategy={verticalListSortingStrategy}>
              {models.map(m => (
                <SortableModelItem
                  key={m.id} 
                  m={m}
                  editingId={null}
                  editForm={editForm} 
                  setEditForm={setEditForm}
                  setEditingId={(id) => {
                    if (id) {
                      const model = models.find(x => x.id === id);
                      if (model) {
                        setEditingId(id);
                        setUnsavedTestResult(null);
                        setEditForm({
                          name: model.name,
                          identifier: model.identifier,
                          provider: model.provider,
                          api_key: model.api_key || '',
                          base_url: model.base_url || '',
                          description: model.description || '',
                          is_default: model.is_default,
                          capabilities: model.capabilities || []
                        });
                      }
                    } else {
                      setEditingId(null);
                      setUnsavedTestResult(null);
                    }
                  }}
                  handleSave={handleSave}
                  handleDelete={handleDelete}
                  handleTest={handleTest}
                  testingId={testingId}
                />
              ))}
            </SortableContext>
          </DndContext>
          {models.length === 0 && !loading && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', border: '1px dashed #e2e8f0', borderRadius: '16px', color: '#94a3b8' }}>
              <Cpu size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '13px' }}>暂无配置的模型。请点击右上角「新增模型」进行配置。</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Drawer Modal */}
      {editingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes scaleUp {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
            .animate-scale-up {
              animation: scaleUp 0.2s ease-out;
            }
          `}</style>
          
          <div style={{
            transform: `translate(${modalPos.x}px, ${modalPos.y}px)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'auto'
          }}>
            <div className="glass-panel animate-scale-up" style={{
              width: '680px',
              maxHeight: '85vh',
              background: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div 
                onMouseDown={handleMouseDown}
                style={{ 
                  padding: '20px 24px', 
                  background: '#f8fafc', 
                  borderBottom: '1px solid rgba(226, 232, 240, 0.8)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: isModalDragging ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={18} style={{ color: '#1e5eff' }} />
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>
                    {editingId === 'new' ? '新增 AI 模型' : '编辑模型配置'}
                  </h3>
                  <span style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '600' }}>Model Configuration Detail</span>
                </div>
              </div>
              <button 
                onClick={closeEditModal}
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

            {/* Form Body - scrollable */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Presets load */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#1e5eff', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} />
                  一键快速填充模板预设
                </label>
                <select
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    outline: 'none',
                    fontSize: '12px',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                  onChange={(e) => handleApplyPreset(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>选择官方推荐的云端 LLM 预设结构...</option>
                  {presets.map(p => <option key={p.name} value={p.name}>{p.name} ({p.provider})</option>)}
                </select>
              </div>

              <div style={{ height: '1px', background: '#edf2f7' }} />

              {/* Form split layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>模型显示名称</label>
                  <input 
                    value={editForm.name} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                    placeholder="例如: DeepSeek-V3" 
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', background: '#f8fafc' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>技术供应商</label>
                  <input 
                    value={editForm.provider} 
                    onChange={e => setEditForm({ ...editForm, provider: e.target.value })} 
                    placeholder="例如: DeepSeek" 
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', background: '#f8fafc' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>模型调用标识符 (Identifier)</label>
                <input 
                  value={editForm.identifier} 
                  onChange={e => setEditForm({ ...editForm, identifier: e.target.value })} 
                  placeholder="例如: deepseek-chat" 
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', fontFamily: 'var(--font-mono)', background: '#f8fafc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>功能定位与描述</label>
                <textarea 
                  value={editForm.description} 
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })} 
                  placeholder="请输入对该模型的主要投研分析定位、使用建议与分工场景..." 
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #edf2f7', outline: 'none', fontSize: '12px', background: '#f8fafc', height: '60px', resize: 'none', lineHeight: 1.5 }}
                />
              </div>

              <div style={{ height: '1px', background: '#edf2f7' }} />

              {/* Endpoint URLs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} style={{ color: '#1e5eff' }} />
                  接口与鉴权密钥设定
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>API Key (接口密钥)</label>
                  <input 
                    value={editForm.api_key} 
                    onChange={e => setEditForm({ ...editForm, api_key: e.target.value })} 
                    type="password" 
                    placeholder="在此输入您的 API Key 密钥" 
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', background: '#ffffff' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b' }}>Endpoint Base URL (地址路径)</label>
                  <input 
                    value={editForm.base_url} 
                    onChange={e => setEditForm({ ...editForm, base_url: e.target.value })} 
                    placeholder="例如: https://api.deepseek.com/v1" 
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '12px', fontFamily: 'var(--font-mono)', background: '#ffffff' }}
                  />
                </div>

                {/* Instant verification */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      disabled={testingUnsaved || !editForm.identifier || !editForm.provider}
                      onClick={handleTestUnsaved}
                      style={{
                        background: 'rgba(30, 94, 255, 0.06)',
                        color: '#1e5eff',
                        border: '1px solid rgba(30, 94, 255, 0.15)',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: (testingUnsaved || !editForm.identifier || !editForm.provider) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => { if (!testingUnsaved) e.currentTarget.style.background = 'rgba(30, 94, 255, 0.12)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30, 94, 255, 0.06)'; }}
                    >
                      <RefreshCw size={12} className={cn(testingUnsaved && "animate-spin")} />
                      {testingUnsaved ? '正在验证接口...' : '测试当前配置连通性'}
                    </button>

                    {unsavedTestResult && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        {unsavedTestResult.status === 'success' ? (
                          <span style={{ color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={12} />
                            测试通过 ({unsavedTestResult.latency_ms || 0}ms)
                          </span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <XCircle size={12} />
                            连接失败
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {unsavedTestResult?.status === 'failed' && unsavedTestResult.error_message && (
                    <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: '#ef4444', fontSize: '11px', fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>
                      <strong>异常原因:</strong> {unsavedTestResult.error_message}
                    </div>
                  )}
                </div>
              </div>

              {/* Capabilities checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>模型支持的核心能力</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {[
                    { id: 'text', label: '文本分析' },
                    { id: 'image', label: '图片识别' },
                    { id: 'video', label: '视频理解' }
                  ].map(cap => {
                    const isSelected = editForm.capabilities.includes(cap.id);
                    return (
                      <div 
                        key={cap.id}
                        onClick={() => {
                          const newCaps = isSelected
                            ? editForm.capabilities.filter(x => x !== cap.id)
                            : [...editForm.capabilities, cap.id];
                          setEditForm({ ...editForm, capabilities: newCaps });
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #1e5eff' : '1px solid #e2e8f0',
                          background: isSelected ? 'rgba(30, 94, 255, 0.04)' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          userSelect: 'none',
                          transition: 'all 0.15s'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? '#1e5eff' : '#475569' }}>{cap.label}</span>
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '4px',
                          border: isSelected ? '1px solid #1e5eff' : '1px solid #cbd5e1',
                          background: isSelected ? '#1e5eff' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Default switch */}
              <div 
                onClick={() => setEditForm({ ...editForm, is_default: editForm.is_default === 'true' ? 'false' : 'true' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: editForm.is_default === 'true' ? '1px solid #f59e0b' : '1px solid #e2e8f0',
                  background: editForm.is_default === 'true' ? 'rgba(245, 158, 11, 0.03)' : '#ffffff',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={16} style={{ color: editForm.is_default === 'true' ? '#f59e0b' : '#94a3b8' }} />
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: editForm.is_default === 'true' ? '#d97706' : '#334155', display: 'block' }}>设置为系统默认决策模型</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>新运行的分析与选股待办任务将默认调度此模型进行深度推理。</span>
                  </div>
                </div>
                
                <input 
                  type="checkbox"
                  checked={editForm.is_default === 'true'}
                  onChange={() => {}}
                  style={{
                    width: '32px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={closeEditModal}
                style={{
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
              >
                取消
              </button>
              
              <button
                onClick={handleSave}
                style={{
                  background: '#1e5eff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(30, 94, 255, 0.16)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#164ecf'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1e5eff'; }}
              >
                <Save size={14} />
                保存配置信息
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}