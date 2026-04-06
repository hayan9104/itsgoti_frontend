import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import { workspaceMessagesAPI } from '../../services/api';

const WorkspaceLayout = ({ children, activeSection, secondarySidebar }) => {
  const { user, isSuperAdmin } = useWorkspaceAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';

  // Fetch unread chat count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await workspaceMessagesAPI.getUnreadCount();
        if (response.data.success) {
          setUnreadCount(response.data.data.count);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Main navigation items (icon sidebar)
  const mainNavItems = isSuperAdmin
    ? [
        { id: 'home', path: '', icon: 'home', label: 'Home' },
        { id: 'inbox', path: '/inbox', icon: 'inbox', label: 'Inbox' },
        { id: 'admins', path: '/admins', icon: 'users', label: 'Team' },
        { id: 'tasks', path: '/all-tasks', icon: 'tasks', label: 'Tasks' },
      ]
    : [
        { id: 'home', path: '', icon: 'home', label: 'Home' },
        { id: 'inbox', path: '/inbox', icon: 'inbox', label: 'Inbox' },
        { id: 'tasks', path: '/my-tasks', icon: 'tasks', label: 'Tasks' },
      ];

  const icons = {
    home: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    inbox: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
      </svg>
    ),
    users: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
    tasks: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
      </svg>
    ),
    settings: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  };

  const isActiveSection = (sectionId) => {
    return activeSection === sectionId;
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f6f8',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      {/* Icon Sidebar */}
      <div
        style={{
          width: '80px',
          height: '100vh',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '16px 0',
            backgroundColor: '#2558BF',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          onClick={() => navigate(basePath)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        </div>

        {/* Main Nav Icons */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8px', width: '100%' }}>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={basePath + item.path}
              style={{
                width: '64px',
                height: '56px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '6px',
                color: isActiveSection(item.id) ? '#2558BF' : '#6b7280',
                backgroundColor: isActiveSection(item.id) ? '#eff6ff' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              title={item.label}
            >
              {icons[item.icon]}
              <span style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>{item.label}</span>
              {/* Unread badge for Inbox */}
              {item.id === 'inbox' && unreadCount > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    minWidth: '18px',
                    height: '18px',
                    backgroundColor: '#ef4444',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '0 4px',
                    border: '2px solid #fff',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Icons */}
        <div style={{ paddingBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Settings */}
          <NavLink
            to={basePath + '/settings'}
            style={{
              width: '64px',
              height: '56px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActiveSection('settings') ? '#2558BF' : '#6b7280',
              backgroundColor: isActiveSection('settings') ? '#eff6ff' : 'transparent',
              textDecoration: 'none',
            }}
            title="Settings"
          >
            {icons.settings}
            <span style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>Settings</span>
          </NavLink>
        </div>
      </div>

      {/* Secondary Sidebar */}
      {secondarySidebar && (
        <div
          style={{
            width: '300px',
            height: '100vh',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e5e7eb',
            position: 'fixed',
            left: '80px',
            top: 0,
            overflow: 'auto',
            zIndex: 90, // Ensure it's below the icon sidebar but above content
          }}
        >
          {secondarySidebar}
        </div>
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: secondarySidebar ? '380px' : '80px',
          padding: '24px',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1, // Keep main content at a low z-index
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default WorkspaceLayout;
