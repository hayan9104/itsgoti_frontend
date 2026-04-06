import { NavLink, useLocation } from 'react-router-dom';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const WorkspaceSidebar = () => {
  const { user, isSuperAdmin, logout } = useWorkspaceAuth();
  const location = useLocation();

  const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';

  const navItems = isSuperAdmin
    ? [
        { path: '', label: 'Dashboard', icon: 'home' },
        { path: '/boards', label: 'All Boards', icon: 'boards' },
        { path: '/tasks', label: 'All Tasks', icon: 'tasks' },
        { path: '/admins', label: 'Manage Admins', icon: 'users' },
        { path: '/inbox', label: 'Inbox', icon: 'inbox' },
        { path: '/settings', label: 'Settings', icon: 'settings' },
      ]
    : [
        { path: '', label: 'My Tasks', icon: 'tasks' },
        { path: '/boards', label: 'My Boards', icon: 'boards' },
        { path: '/inbox', label: 'Inbox', icon: 'inbox' },
      ];

  const icons = {
    home: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    boards: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
    tasks: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
      </svg>
    ),
    users: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
    inbox: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
      </svg>
    ),
    settings: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  };

  const isActive = (path) => {
    const fullPath = basePath + path;
    if (path === '') {
      return location.pathname === basePath || location.pathname === basePath + '/';
    }
    return location.pathname.startsWith(fullPath);
  };

  return (
    <div
      style={{
        width: '240px',
        height: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        borderRight: '1px solid #e5e7eb',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              color: '#2558BF',
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
            }}
          >
            It's Goti
          </span>
        </div>
        <div style={{ marginTop: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              color: isSuperAdmin ? '#166534' : '#1e40af',
              fontWeight: '500',
              padding: '4px 10px',
              backgroundColor: isSuperAdmin ? '#dcfce7' : '#dbeafe',
              borderRadius: '6px',
            }}
          >
            {isSuperAdmin ? 'Super Admin' : 'Admin'} • Workspace
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={basePath + item.path}
            end={item.path === ''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '4px',
              color: isActive(item.path) ? '#fff' : '#4b5563',
              backgroundColor: isActive(item.path) ? '#2558BF' : 'transparent',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#4b5563';
              }
            }}
          >
            {icons[item.icon]}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#fafafa',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#2558BF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            {user?.initials || user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: '#111827',
                fontSize: '14px',
                fontWeight: '500',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name}
            </p>
            <p
              style={{
                color: '#6b7280',
                fontSize: '12px',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#fff',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#fff';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSidebar;
