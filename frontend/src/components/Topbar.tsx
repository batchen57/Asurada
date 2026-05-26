import React from 'react';
import { Search, Bell, Mail, Sparkles } from 'lucide-react';

interface TopbarProps {
  onOpenAiAssistant?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenAiAssistant }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 40px',
      background: 'transparent',
      borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
      width: '100%'
    }}>
      {/* Greetings & Subtitle */}
      <div>
        <h1 style={{ 
          fontSize: '22px', 
          fontWeight: '700', 
          color: '#1e293b',
          fontFamily: "'Outfit', sans-serif"
        }}>
          上午好，Asurada
        </h1>
        <p style={{ 
          fontSize: '13px', 
          color: '#64748b', 
          marginTop: '4px',
          fontWeight: '400'
        }}>
          用数据与策略，持续提升交易胜率
        </p>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {/* Search Bar */}
        <div style={{ 
          position: 'relative',
          width: '320px'
        }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#94a3b8' 
            }} 
          />
          <input 
            type="text" 
            placeholder="搜索股票/策略/信号" 
            style={{
              width: '100%',
              padding: '10px 16px 10px 44px',
              borderRadius: '24px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#1e5eff';
              e.target.style.boxShadow = '0 4px 12px rgba(30, 94, 255, 0.05)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.01)';
            }}
          />
        </div>

        {/* Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Notification Icon */}
          <button style={{
            position: 'relative',
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)'}
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              fontWeight: '700',
              borderRadius: '10px',
              padding: '2px 5px',
              border: '2px solid #f3f6fc'
            }}>
              12
            </span>
          </button>

          {/* Email Icon */}
          <button style={{
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.6)'}
          >
            <Mail size={18} />
          </button>

          {/* AI Assistant Button */}
          <button 
            onClick={onOpenAiAssistant}
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 94, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 94, 255, 0.2)';
            }}
          >
            <Sparkles size={16} />
            AI 助手
          </button>
        </div>
      </div>
    </div>
  );
};
