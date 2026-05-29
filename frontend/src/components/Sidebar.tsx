import React from 'react';
import { 
  LayoutDashboard, 
  CalendarRange, 
  Eye, 
  TrendingUp, 
  Landmark,
  BookOpen, 
  Database, 
  Sliders, 
  Bot, 
  BellRing, 
  Settings, 
  User,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: any;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  const menuItems = [
    { id: 'workbench', label: '工作台', subLabel: 'Workbench', icon: LayoutDashboard },
    {
      id: 'discovery_group',
      label: '选股与题材',
      subLabel: 'Discovery',
      icon: TrendingUp,
      children: [
        { id: 'today_market', label: '今日股市', subLabel: 'Market Today', icon: Landmark },
        { id: 'discovery', label: '智能选股', subLabel: 'Discovery 01', icon: TrendingUp },
      ]
    },
    {
      id: 'plan_manage',
      label: '计划与管理',
      subLabel: 'Plan & Management',
      icon: CalendarRange,
      children: [
        { id: 'plan', label: '盘前计划', subLabel: 'Plan 02', icon: ClipboardList },
        { id: 'observe', label: '盘中盯盘', subLabel: 'Observe 03', icon: Eye },
        { id: 'review', label: '盘后复盘', subLabel: 'Review 04', icon: BookOpen },
      ]
    },
    { id: 'datahub', label: '数据中心', subLabel: 'DataHub', icon: Database },
    {
      id: 'strategy_group',
      label: '策略中心',
      subLabel: 'Strategy Center',
      icon: Sliders,
      children: [
        { id: 'strategy', label: '参数配置', subLabel: 'Parameters', icon: Sliders },
        { id: 'signals', label: '信号与告警', subLabel: 'Signals', icon: BellRing },
        { id: 'agents', label: '智能体配置', subLabel: 'Agent Config', icon: Bot },
      ]
    },
    {
      id: 'audit_group',
      label: '审计管理',
      subLabel: 'Audit & Users',
      icon: ClipboardList,
      children: [
        { id: 'audit_logs', label: '接口审计管理', subLabel: 'Audit Logs', icon: ClipboardList },
        { id: 'user_manage', label: '管理员用户管理', subLabel: 'User Management', icon: User },
      ]
    },
    {
      id: 'config_center_group',
      label: '配置中心',
      subLabel: 'Config Center',
      icon: Settings,
      children: [
        { id: 'sector_config', label: '板块配置', subLabel: 'Sector Config', icon: Sliders },
        { id: 'settings', label: '系统设置', subLabel: 'Settings', icon: Settings },
      ]
    },
  ];

  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

  return (
    <div className="sidebar-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'space-between', padding: '24px 0' }}>
      <div>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 24px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e5eff 0%, #8b5cf6 100%)',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px',
            fontFamily: "'Outfit', sans-serif"
          }}>
            A
          </div>
          <span style={{ 
            color: 'white', 
            fontSize: '22px', 
            fontWeight: '700', 
            fontFamily: "'Outfit', sans-serif",
            letterSpacing: '0.5px'
          }}>
            Asurada
          </span>
        </div>

        {/* Navigation Menu */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 12px' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;

            // If item has children, render as collapsible accordion
            if ('children' in item && item.children) {
              const hasActiveChild = item.children.some(child => child.id === activeTab);
              const isGroupOpen = hasActiveChild || openGroups[item.id] || false;
              
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Parent Button */}
                  <button
                    onClick={() => setOpenGroups(prev => ({ ...prev, [item.id]: !isGroupOpen }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 16px',
                      width: '100%',
                      border: 'none',
                      borderRadius: '12px',
                      background: 'transparent',
                      color: hasActiveChild ? '#ffffff' : '#8e9bb4',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = hasActiveChild ? '#ffffff' : '#8e9bb4';
                    }}
                  >
                    <Icon size={20} style={{ flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                      <span style={{ fontSize: '10px', opacity: 0.6, marginTop: '1px' }}>{item.subLabel}</span>
                    </div>
                    {isGroupOpen ? (
                      <ChevronUp size={16} style={{ color: '#8e9bb4', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: '#8e9bb4', flexShrink: 0 }} />
                    )}
                  </button>

                  {/* Children Container */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingLeft: '20px',
                    maxHeight: isGroupOpen ? '220px' : '0px',
                    opacity: isGroupOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const isChildActive = activeTab === child.id;
                      
                      return (
                        <button
                          key={child.id}
                          onClick={() => setActiveTab(child.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            width: '100%',
                            border: 'none',
                            borderRadius: '10px',
                            background: isChildActive ? '#1e5eff' : 'transparent',
                            color: isChildActive ? '#ffffff' : '#8e9bb4',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isChildActive) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.color = '#ffffff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isChildActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#8e9bb4';
                            }
                          }}
                        >
                          <ChildIcon size={16} style={{ flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{child.label}</span>
                            <span style={{ fontSize: '9px', opacity: 0.6, marginTop: '1px' }}>{child.subLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  width: '100%',
                  border: 'none',
                  borderRadius: '12px',
                  background: isActive ? '#1e5eff' : 'transparent',
                  color: isActive ? '#ffffff' : '#8e9bb4',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#8e9bb4';
                  }
                }}
              >
                <Icon size={20} style={{ flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
                  <span style={{ fontSize: '10px', opacity: 0.6, marginTop: '1px' }}>{item.subLabel}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div style={{ 
        padding: '0 16px', 
        borderTop: '1px solid rgba(255,255,255,0.06)', 
        paddingTop: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '8px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(30, 94, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <User size={18} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>
                {currentUser ? currentUser.username : '游客用户'}
              </span>
              <span style={{ color: '#8e9bb4', fontSize: '10px', marginTop: '1px' }}>
                {currentUser && currentUser.role === 'admin' ? '系统管理员' : '普通管理员'}
              </span>
            </div>
          </div>
          {onLogout && (
            <button 
              onClick={onLogout}
              title="退出登录"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8e9bb4',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8e9bb4'; e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
