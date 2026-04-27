import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import { workspaceMessagesAPI } from '../../services/api';

const WorkspaceLayout = ({ children, activeSection, secondarySidebar }) => {
  const { user, accounts, isSuperAdmin, canSwitchRole, viewMode, switchViewMode, switchAccount, removeAccount, login, linkNewAccount, switchingAccount } = useWorkspaceAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState(null);

  // Inline login states
  const [showInlineLogin, setShowInlineLogin] = useState(false);
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePassword, setInlinePassword] = useState('');
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineError, setInlineError] = useState(null);

  const accountPickerRef = useRef(null);

  const handleAddAccount = () => {
    setShowInlineLogin(true);
    setInlineError(null);
  };

  const handleInlineLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inlineEmail || !inlinePassword) {
      setInlineError('Email and password required');
      return;
    }

    setInlineLoading(true);
    setInlineError(null);

    const result = await linkNewAccount(inlineEmail, inlinePassword);
    setInlineLoading(false);

    if (result.success) {
      setShowInlineLogin(false);
      setInlineEmail('');
      setInlinePassword('');
    } else {
      setInlineError(result.message || 'Login failed');
    }
  };

  const handleRemoveAccount = () => {
    if (accountToRemove) {
      removeAccount(accountToRemove._id);
      setShowRemoveConfirm(false);
      setAccountToRemove(null);
      setShowAccountPicker(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountPickerRef.current && !accountPickerRef.current.contains(e.target)) {
        setShowAccountPicker(false);
      }
    };
    if (showAccountPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountPicker]);

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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Main navigation items (icon sidebar)
  const mainNavItems = isSuperAdmin
    ? [
        { id: 'boards', path: '/boards', icon: 'boards', label: 'Work' },
        { id: 'admins', path: '/admins', icon: 'users', label: 'Team' },
        { id: 'calendar', path: '/calendar', icon: 'calendar', label: 'Calendar' },
        { id: 'meetings', path: '/meetings', icon: 'meetings', label: 'Meetings' },
        { id: 'reminders', path: '/reminders', icon: 'reminders', label: 'Reminders' },
      ]
    : [
        { id: 'boards', path: '/boards', icon: 'boards', label: 'Work' },
        { id: 'calendar', path: '/calendar', icon: 'calendar', label: 'Calendar' },
        { id: 'meetings', path: '/meetings', icon: 'meetings', label: 'Meetings' },
        { id: 'reminders', path: '/reminders', icon: 'reminders', label: 'Reminders' },
      ];

  const icons = {
    home: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
    inbox: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
      </svg>
    ),
    users: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
    boards: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
    tasks: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
      </svg>
    ),
    calendar: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
      </svg>
    ),
    meetings: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
      </svg>
    ),
    reminders: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
    ),
    settings: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    ),
  };

  const isActiveSection = (sectionId) => {
    return activeSection === sectionId;
  };

  return (
    <div
      data-workspace="true"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f4f5f7',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      {/* Global Switching Overlay */}
      {switchingAccount && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)', transition: 'all 0.5s ease'
        }}>
          <div style={{
            width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6',
            borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px'
          }}></div>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff', letterSpacing: '0.5px' }}>
            Switching account...
          </div>
        </div>
      )}

      {/* ═══ LEFT: Icon Sidebar ═══ */}
      <div
        style={{
          width: '68px',
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
        {/* Account Switcher */}
        <div ref={accountPickerRef} style={{ margin: '16px 0 12px 0', position: 'relative' }}>
          {/* Trigger button */}
          <button
            onClick={() => setShowAccountPicker(p => !p)}
            style={{
              width: '36px', height: '36px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: viewMode === 'super_admin' ? 'rgba(232,101,90,0.12)' : 'rgba(59,130,246,0.12)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            title="Switch account"
          >
            <span style={{ fontSize: '10px', fontWeight: '800', color: viewMode === 'super_admin' ? '#e8655a' : '#3b82f6', lineHeight: 1 }}>
              {viewMode === 'super_admin' ? 'SA' : 'A'}
            </span>
          </button>

          {/* Dropdown */}
          {showAccountPicker && (
            <div style={{
              position: 'fixed', left: '76px', top: '16px',
              width: '240px', backgroundColor: '#ffffff',
              borderRadius: '12px', border: '1px solid #e5e7eb',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 99999, overflow: 'hidden',
            }}>
              {/* User info header */}
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#374151', flexShrink: 0 }}>
                    {user?.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{user?.name}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Accounts list */}
              <div style={{ padding: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px 6px 8px' }}>
                  Accounts
                </div>

                {accounts.map((acc) => {
                  const isCurrent = acc.isCurrent;
                  const accUser = acc.user;
                  const isSA = accUser.role === 'super_admin';

                  return (
                    <div key={accUser._id} style={{ display: 'flex', alignItems: 'center', borderRadius: '8px', overflow: 'hidden', marginBottom: '2px' }}
                      onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
                      onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <button
                        onClick={() => { if (!isCurrent) switchAccount(accUser._id); }}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 10px', border: 'none', cursor: isCurrent ? 'default' : 'pointer',
                          backgroundColor: isCurrent ? 'rgba(59,130,246,0.08)' : 'transparent', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '8px',
                          backgroundColor: isSA ? 'rgba(232,101,90,0.12)' : 'rgba(59,130,246,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', color: isSA ? '#e8655a' : '#3b82f6' }}>
                            {isSA ? 'SA' : 'A'}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                              {isSA ? 'Super Admin' : 'Admin'}
                            </span>
                            {isCurrent && (
                              <span style={{ fontSize: '9px', fontWeight: '600', color: isSA ? '#e8655a' : '#3b82f6', backgroundColor: isSA ? 'rgba(232,101,90,0.12)' : 'rgba(59,130,246,0.12)', padding: '1px 5px', borderRadius: '4px' }}>Active</span>
                            )}
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{accUser.email}</div>
                        </div>
                        {isCurrent && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={isSA ? "#e8655a" : "#3b82f6"} style={{ flexShrink: 0 }}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add account + divider */}
              <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px' }}>
                {!showInlineLogin ? (
                  <button
                    onClick={handleAddAccount}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      backgroundColor: 'transparent', textAlign: 'left', transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '30px', height: '30px', borderRadius: '8px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#6b7280"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Add account</span>
                  </button>
                ) : (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{ padding: '4px 8px' }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Add Account</div>

                    <input
                      type="email"
                      placeholder="Email"
                      value={inlineEmail}
                      onChange={(e) => setInlineEmail(e.target.value)}
                      style={{
                        width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px',
                        backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', fontSize: '12px'
                      }}
                    />

                    <input
                      type="password"
                      placeholder="Password"
                      value={inlinePassword}
                      onChange={(e) => setInlinePassword(e.target.value)}
                      style={{
                        width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px',
                        backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#111827', fontSize: '12px'
                      }}
                    />

                    {inlineError && (
                      <div style={{ color: '#ef4444', fontSize: '10px', marginBottom: '8px' }}>{inlineError}</div>
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowInlineLogin(false); }}
                        style={{
                          flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                          backgroundColor: '#f3f4f6', color: '#374151', fontSize: '11px', cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleInlineLogin}
                        disabled={inlineLoading}
                        style={{
                          flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                          backgroundColor: '#3b82f6', color: 'white', fontSize: '11px', cursor: 'pointer',
                          opacity: inlineLoading ? 0.7 : 1
                        }}
                      >
                        {inlineLoading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Remove Account Confirmation Modal */}
        {showRemoveConfirm && (
          <div
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 999999,
            }}
            onClick={() => setShowRemoveConfirm(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb',
                boxShadow: '0 16px 48px rgba(0,0,0,0.15)', padding: '24px', width: '300px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Remove Account</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{accountToRemove?.email}</div>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '12px 0 20px 0', lineHeight: '1.5' }}>
                Are you sure you want to remove <strong style={{ color: '#111827' }}>{accountToRemove?.name}</strong>? You will be signed out of this account.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowRemoveConfirm(false); setAccountToRemove(null); }}
                  style={{
                    padding: '7px 16px', fontSize: '13px', fontWeight: '500',
                    backgroundColor: '#f3f4f6', color: '#374151',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveAccount}
                  style={{
                    padding: '7px 16px', fontSize: '13px', fontWeight: '500',
                    backgroundColor: '#ef4444', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nav Icons */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px', width: '100%' }}>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={basePath + item.path}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px',
                color: isActiveSection(item.id) ? '#2563eb' : '#9ca3af',
                backgroundColor: isActiveSection(item.id) ? '#eff6ff' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              title={item.label}
            >
              {icons[item.icon]}
              <span style={{ fontSize: '9px', marginTop: '3px', fontWeight: '500', letterSpacing: '0.2px' }}>{item.label}</span>
              {/* Unread badge for Inbox */}
              {item.id === 'inbox' && unreadCount > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '2px',
                    minWidth: '16px',
                    height: '16px',
                    backgroundColor: '#ef4444',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: '700',
                    padding: '0 3px',
                    border: '2px solid #ffffff',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Settings at bottom */}
        <div style={{ paddingBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <NavLink
            to={basePath + '/settings'}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: isActiveSection('settings') ? '#2563eb' : '#9ca3af',
              backgroundColor: isActiveSection('settings') ? '#eff6ff' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
            title="Settings"
          >
            {icons.settings}
            <span style={{ fontSize: '9px', marginTop: '3px', fontWeight: '500' }}>Settings</span>
          </NavLink>
        </div>
      </div>

      {/* ═══ RIGHT SIDE ═══ */}
      <div
        style={{
          position: 'fixed',
          left: '68px',
          top: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          backgroundColor: '#f4f5f7',
        }}
      >
        {/* ── Top Bar (OUTSIDE the rounded container) ── */}
        <div
          style={{
            height: '48px',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            backgroundColor: '#f4f5f7',
          }}
        >
          <div />

          {/* Center: Search Bar */}
          <div style={{ flex: 1, maxWidth: '480px', margin: '0 24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 14px',
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e5e7eb',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#9ca3af">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span style={{ fontSize: '13px', color: '#9ca3af', userSelect: 'none' }}>Search</span>
            </div>
          </div>

          {/* Right: Brand */}
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#9ca3af', letterSpacing: '0.5px' }}>
            ItsGoti
          </span>
        </div>

        {/* ── Rounded Container (below top bar) ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            backgroundColor: '#ffffff',
            borderRadius: '20px 0 0 0',
            overflow: 'hidden',
            boxShadow: '-2px -2px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Sidebar — ALWAYS visible */}
          <div
            style={{
              width: '280px',
              height: '100%',
              backgroundColor: '#ffffff',
              borderRight: '1px solid #e5e7eb',
              overflow: 'auto',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Permanent: Home + Inbox */}
            <div style={{ padding: '12px 12px 0 12px' }}>
              <NavLink
                to={basePath}
                end
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  color: isActiveSection('home') ? '#2563eb' : '#4b5563',
                  backgroundColor: isActiveSection('home') ? '#eff6ff' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActiveSection('home') ? '500' : '400',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                Home
              </NavLink>
              <NavLink
                to={basePath + '/inbox'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  marginBottom: '2px',
                  color: isActiveSection('inbox') ? '#2563eb' : '#4b5563',
                  backgroundColor: isActiveSection('inbox') ? '#eff6ff' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: isActiveSection('inbox') ? '500' : '400',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
                </svg>
                Inbox
                {unreadCount > 0 && (
                  <span style={{
                    minWidth: '18px', height: '18px', padding: '0 5px',
                    backgroundColor: '#ef4444', borderRadius: '9px',
                    color: '#fff', fontSize: '10px', fontWeight: '700',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: 'auto',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </NavLink>
            </div>

            {/* Separator */}
            <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '8px 16px' }} />

            {/* Contextual sidebar content (boards, inbox chats, etc.) */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {secondarySidebar}
            </div>
          </div>

          {/* Main Content */}
          <main
            style={{
              flex: 1,
              overflow: 'auto',
              backgroundColor: '#f4f5f7',
              padding: '24px',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceLayout;
