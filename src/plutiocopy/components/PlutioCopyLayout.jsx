import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { usePlutioCopyAuth } from '../context/PlutioCopyAuthContext';

/* ─── Inline SVG icons ─── */
const Icon = ({ d, size = 18, color = 'currentColor', viewBox = '0 0 24 24' }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={color}>
    <path d={d} />
  </svg>
);

const ICONS = {
  home:        'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  tasks:       'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  inbox:       'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  contacts:    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  proposals:   'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8zm0-4h5v2H8z',
  financials:  'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
  contracts:   'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  calendar:    'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zm0-13H5V6h14v1z',
  schedulers:  'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
  timesheets:  'M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14z M8 13h8v2H8zm0-4h8v2H8z',
  forms:       'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
  files:       'M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z',
  automations: 'M7 2v11h3v9l7-12h-4l4-8z',
  bell:        'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  calIcon:     'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM7 11h5v5H7z',
  list:        'M4 6H2v2h2V6zm0 4H2v2h2v-2zm0-8H2v2h2V2zm4 8h14v-2H8v2zm0 4h14v-2H8v2zm0-12v2h14V2H8z',
  search:      'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  send:        'M2.01 21L23 12 2.01 3 2 10l15 2-15 2z',
  moon:        'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
  settings:    'M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z',
  help:        'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
  play:        'M8 5v14l11-7z',
  grid:        'M4 4h4v4H4zm0 6h4v4H4zm0 6h4v4H4zm6-12h4v4h-4zm0 6h4v4h-4zm0 6h4v4h-4zm6-12h4v4h-4zm0 6h4v4h-4zm0 6h4v4h-4z',
  plus:        'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  expand:      'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  collapse:    'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z',
};

/* ─── Left sidebar nav items ─── */
const NAV_ITEMS = [
  { id: 'home',        label: 'Home (Owner)',  icon: 'home',        path: '/plutiocopy/home' },
  { id: 'tasks',       label: 'Tasks',         icon: 'tasks',       path: '/plutiocopy/tasks' },
  { id: 'inbox',       label: 'Inbox',         icon: 'inbox',       path: '/plutiocopy/inbox' },
  'divider',
  { id: 'contacts',    label: 'Contacts',      icon: 'contacts',    path: '/plutiocopy/contacts' },
  { id: 'proposals',   label: 'Proposals',     icon: 'proposals',   path: '/plutiocopy/proposals' },
  { id: 'financials',  label: 'Financials',    icon: 'financials',  path: '/plutiocopy/financials' },
  { id: 'contracts',   label: 'Contracts',     icon: 'contracts',   path: '/plutiocopy/contracts' },
  'divider',
  { id: 'calendar',    label: 'Calendar',      icon: 'calendar',    path: '/plutiocopy/calendar' },
  { id: 'schedulers',  label: 'Schedulers',    icon: 'schedulers',  path: '/plutiocopy/schedulers' },
  { id: 'timesheets',  label: 'Timesheets',    icon: 'timesheets',  path: '/plutiocopy/timesheets' },
  'divider',
  { id: 'forms',       label: 'Forms',         icon: 'forms',       path: '/plutiocopy/forms' },
  { id: 'files',       label: 'Files',         icon: 'files',       path: '/plutiocopy/files' },
  { id: 'automations', label: 'Automations',   icon: 'automations', path: '/plutiocopy/automations' },
];

/* ─── Right icon bar buttons ─── */
const RIGHT_TOP = [
  { icon: 'plus',   bg: '#22c55e', color: '#fff', label: 'Create' },
  { icon: 'play',   bg: '#16a34a', color: '#fff', label: 'Start timer' },
  { icon: 'grid',   bg: '#6d28d9', color: '#fff', label: 'Apps' },
];
const RIGHT_MID = ['bell', 'calIcon', 'list', 'search', 'send'];
const RIGHT_BOT = ['moon', 'help', 'settings'];

const PlutioCopyLayout = ({ children, middlePanel }) => {
  const { user, logout } = usePlutioCopyAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/plutiocopy/login');
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: '#eeeef5',
    }}>

      {/* ── LEFT SIDEBAR ── */}
      <div style={{
        width: '185px',
        minWidth: '185px',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRight: '1px solid #e8e8ef',
        overflowY: 'auto',
        zIndex: 10,
      }}>
        {/* User profile */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '18px 14px 16px',
            cursor: 'pointer', position: 'relative',
          }}
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '13px', fontWeight: '700',
            flexShrink: 0,
          }}>
            {user?.initials || 'U'}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
            {user?.name || 'User'}
          </span>
          {showUserMenu && (
            <div style={{
              position: 'absolute', top: '100%', left: '14px',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '8px', padding: '4px 0', minWidth: '150px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100,
            }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '8px 14px', textAlign: 'left',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '13px', color: '#ef4444',
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '4px 8px' }}>
          {NAV_ITEMS.map((item, i) => {
            if (item === 'divider') {
              return (
                <div key={`div-${i}`} style={{
                  height: '1px', background: '#f0f0f7',
                  margin: '6px 0',
                }} />
              );
            }
            const active = item.id === 'tasks'
              ? isActive('/plutiocopy/tasks')
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setShowUserMenu(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '7px 8px', borderRadius: '6px',
                  textDecoration: 'none', marginBottom: '1px',
                  background: active ? '#ededf8' : 'transparent',
                  color: active ? '#6d28d9' : '#4b5563',
                  fontWeight: active ? '600' : '400',
                  fontSize: '13.5px',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f5f5fb'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon
                  d={ICONS[item.icon]}
                  size={16}
                  color={active ? '#6d28d9' : '#9ca3af'}
                />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom collapse buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '12px 14px', borderTop: '1px solid #f0f0f7',
        }}>
          <button style={{
            width: '28px', height: '28px', borderRadius: '6px',
            border: '1px solid #e5e7eb', background: '#f9fafb',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9ca3af',
          }}>
            <Icon d={ICONS.list} size={14} color="#9ca3af" />
          </button>
          <button style={{
            width: '28px', height: '28px', borderRadius: '6px',
            border: '1px solid #e5e7eb', background: '#f9fafb',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon d={ICONS.expand} size={14} color="#9ca3af" />
          </button>
        </div>
      </div>

      {/* ── CENTER AREA (middle panel + main content + banner) ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        height: '100vh', overflow: 'hidden', minWidth: 0,
      }}>
        {/* Middle panel + main content row */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* MIDDLE PANEL */}
          {middlePanel && (
            <div style={{
              width: '220px', minWidth: '220px',
              height: '100%', overflowY: 'auto',
              background: '#f7f7fb',
              borderRight: '1px solid #e8e8ef',
            }}>
              {middlePanel}
            </div>
          )}

          {/* MAIN CONTENT */}
          <div style={{
            flex: 1, height: '100%', overflowY: 'auto',
            background: '#eeeef5', minWidth: 0,
          }}>
            {children}
          </div>
        </div>
      </div>

      {/* ── RIGHT ICON BAR ── */}
      <div style={{
        width: '50px', minWidth: '50px',
        height: '100vh', overflowY: 'auto',
        background: '#ffffff',
        borderLeft: '1px solid #e8e8ef',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        padding: '10px 0',
        gap: '4px',
        zIndex: 10,
      }}>
        {/* Top action buttons */}
        {RIGHT_TOP.map((btn) => (
          <button
            key={btn.icon}
            title={btn.label}
            style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: btn.bg, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: '2px',
            }}
          >
            <Icon d={ICONS[btn.icon]} size={16} color={btn.color} />
          </button>
        ))}

        <div style={{ height: '12px' }} />

        {/* Mid utility icons */}
        {RIGHT_MID.map((ico) => (
          <button key={ico} style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9ca3af',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5fb'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon d={ICONS[ico]} size={17} color="#6b7280" />
          </button>
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom icons */}
        <button style={{
          width: '34px', height: '34px', borderRadius: '8px',
          background: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>
          <Icon d={ICONS.moon} size={17} color="#6b7280" />
        </button>

        {/* User avatar */}
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
          marginBottom: '2px',
        }}>
          {user?.initials || 'U'}
        </div>

        {RIGHT_BOT.slice(1).map((ico) => (
          <button key={ico} style={{
            width: '34px', height: '34px', borderRadius: '8px',
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#9ca3af',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5fb'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Icon d={ICONS[ico]} size={17} color="#6b7280" />
          </button>
        ))}

        <div style={{ height: '6px' }} />
      </div>
    </div>
  );
};

export default PlutioCopyLayout;
