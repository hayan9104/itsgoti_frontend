import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import HomeSidebar from '../components/HomeSidebar';
import InboxSidebar from '../components/InboxSidebar';
import BoardsList from './BoardsList';
import BoardDetail from './BoardDetail';
import AdminsManager from './AdminsManager';
import AllTasks from './AllTasks';
import Inbox from './Inbox';
import CalendarView from '../components/CalendarView';
import MeetingsView from '../components/MeetingsView';
import { workspaceBoardsAPI, workspaceTasksAPI, workspaceUsersAPI, workspaceMessagesAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

// Home Dashboard Component (like Kitchen.co)
const HomeDashboard = () => {
  const { user } = useWorkspaceAuth();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentItems();
  }, []);

  const loadRecentItems = async () => {
    try {
      const boardsRes = await workspaceBoardsAPI.getAll();
      if (boardsRes.data.success) {
        const boards = boardsRes.data.data.map(b => ({
          ...b,
          type: 'Board',
          taskCount: b.taskCount || 0,
        }));
        setRecentItems(boards.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const createOptions = [
    { icon: 'team', label: 'Team', desc: 'Manage admins', action: () => navigate('/workspace/super-admin/admins') },
    { icon: 'board', label: 'Board', desc: 'Track projects', action: () => navigate('/workspace/super-admin/boards') },
    { icon: 'conversation', label: 'Conversation', desc: 'Discuss anything', action: () => navigate('/workspace/super-admin/inbox') },
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#f1f1f1', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>👋</span>
          Welcome, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
      </div>

      {/* Recent Items Table */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase' }}>
          Recent Items
        </h3>

        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : recentItems.length === 0 ? (
          <p style={{ color: '#9ca3af' }}>No recent items</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333436' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Kind</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Visibility</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentItems.map((item) => (
                <tr
                  key={item._id}
                  style={{ borderBottom: '1px solid #2a2b2d', cursor: 'pointer' }}
                  onClick={() => navigate(`/workspace/super-admin/boards/${item._id}`)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: item.color || '#6f6e6f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                        </svg>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{item.taskCount || 0} tasks</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: '#a2a0a2' }}>{item.type}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: '#a2a0a2', textTransform: 'capitalize' }}>{item.visibility || 'Private'}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: '#a2a0a2' }}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Section */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase' }}>
          Create
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {createOptions.map((option) => (
            <button
              key={option.label}
              onClick={option.action}
              style={{
                padding: '20px 16px',
                backgroundColor: '#2a2b2d',
                border: '1px solid #333436',
                borderRadius: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4a4b4d';
                e.currentTarget.style.backgroundColor = '#2a2b2d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333436';
                e.currentTarget.style.backgroundColor = '#2a2b2d';
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#6b7280" style={{ marginBottom: '12px' }}>
                {option.icon === 'team' && <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />}
                {option.icon === 'board' && <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />}
                {option.icon === 'conversation' && <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />}
              </svg>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>{option.label}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{option.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// My Tasks Page
const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      // Use getMyTasks to only get tasks assigned to current user
      const response = await workspaceTasksAPI.getMyTasks();
      if (response.data.success) {
        setTasks(response.data.data.filter(t => t.status !== 'done'));
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'doing': return '#f59e0b';
      case 'todo': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#f1f1f1', marginBottom: '24px' }}>My Tasks</h1>

      {loading ? (
        <p style={{ color: '#9ca3af' }}>Loading...</p>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#4a4b4d" style={{ margin: '0 auto 16px' }}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
          </svg>
          <h3 style={{ fontSize: '18px', color: '#f1f1f1', marginBottom: '8px' }}>All caught up!</h3>
          <p style={{ color: '#9ca3af' }}>No pending tasks assigned to you.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map((task) => (
            <div
              key={task._id}
              onClick={() => navigate(`/workspace/super-admin/boards/${task.board?._id || task.board}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                backgroundColor: '#2a2b2d',
                borderRadius: '8px',
                border: '1px solid #333436',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: getStatusColor(task.status),
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#f1f1f1' }}>{task.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>{task.board?.name}</p>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: task.status === 'doing' ? '#fef3c7' : '#dbeafe',
                  color: task.status === 'doing' ? '#92400e' : '#1e40af',
                  textTransform: 'capitalize',
                }}
              >
                {task.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Inbox Chat View
const InboxChat = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { user } = useWorkspaceAuth();

  const loadMessages = async (conversationId) => {
    try {
      const response = await workspaceMessagesAPI.getMessages(conversationId);
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    if (conv._id && !conv._id.startsWith('new-')) {
      loadMessages(conv._id);
    } else {
      setMessages([]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await workspaceMessagesAPI.sendMessage({
        receiver: selectedConversation.participant._id,
        content: newMessage.trim(),
      });
      if (response.data.success) {
        setMessages([...messages, response.data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)' }}>
      {/* Sidebar with tabs handled by InboxSidebar - passed via layout */}

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#2a2b2d', borderRadius: '12px' }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #333436', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#6f6e6f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {selectedConversation.participant?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#f1f1f1' }}>{selectedConversation.participant?.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{selectedConversation.participant?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px', backgroundColor: '#252628' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender._id === user?._id;
                  return (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '10px 14px',
                          borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                          backgroundColor: isOwn ? '#6f6e6f' : '#fff',
                          color: isOwn ? '#fff' : '#111827',
                          boxShadow: isOwn ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '14px' }}>{msg.content}</p>
                        <p style={{ margin: '6px 0 0', fontSize: '11px', color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af', textAlign: 'right' }}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid #333436', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '14px',
                  border: '1px solid #333436',
                  borderRadius: '10px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: newMessage.trim() ? '#6f6e6f' : '#333436',
                  color: newMessage.trim() ? '#fff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#252628' }}>
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#4a4b4d" style={{ margin: '0 auto 16px' }}>
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Select a conversation</p>
              <p style={{ fontSize: '14px' }}>Choose from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Sidebar
const SettingsSidebar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'account', label: 'Account', icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { id: 'workspace', label: 'Workspace', icon: 'M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' },
  ];

  return (
    <div style={{ padding: '16px 12px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', padding: '4px 12px', marginBottom: '8px' }}>Settings</h3>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
            color: activeTab === tab.id ? '#ffffff' : '#a2a0a2',
            backgroundColor: activeTab === tab.id ? '#3a3b3d' : 'transparent',
            cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab.id ? '500' : '400',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = '#2e2f31'; }}
          onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={tab.icon} /></svg>
          {tab.label}
        </div>
      ))}
    </div>
  );
};

// Settings Page
const Settings = ({ activeTab = 'account' }) => {
  const { user, logout } = useWorkspaceAuth();

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#f1f1f1', marginBottom: '24px' }}>
        {activeTab === 'account' ? 'Account' : 'Workspace'}
      </h1>

      {activeTab === 'account' && (
        <>
          <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                backgroundColor: '#4a4b4d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '20px', fontWeight: '600',
              }}>
                {user?.initials || user?.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f1f1f1' }}>{user?.name}</p>
                <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>{user?.email}</p>
                <span style={{
                  display: 'inline-block', padding: '4px 10px',
                  backgroundColor: '#1a2e1a', color: '#4ade80',
                  fontSize: '12px', fontWeight: '500', borderRadius: '6px', textTransform: 'capitalize',
                }}>
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>Actions</h2>
            <button
              onClick={logout}
              style={{
                padding: '12px 24px', backgroundColor: '#3a1a1a',
                border: '1px solid #5c2020', borderRadius: '8px',
                color: '#ef4444', fontSize: '14px', fontWeight: '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              Logout
            </button>
          </div>
        </>
      )}

      {activeTab === 'workspace' && (
        <>
          <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>General</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#a2a0a2', display: 'block', marginBottom: '6px' }}>Workspace Name</label>
                <input
                  type="text"
                  defaultValue="ItsGoti"
                  style={{
                    width: '100%', maxWidth: '400px', padding: '10px 14px', fontSize: '14px',
                    backgroundColor: '#1e1f21', border: '1px solid #333436', borderRadius: '8px',
                    color: '#e5e7eb', outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#a2a0a2', display: 'block', marginBottom: '6px' }}>Workspace URL</label>
                <input
                  type="text"
                  defaultValue="itsgoti.in"
                  disabled
                  style={{
                    width: '100%', maxWidth: '400px', padding: '10px 14px', fontSize: '14px',
                    backgroundColor: '#1e1f21', border: '1px solid #333436', borderRadius: '8px',
                    color: '#6f6e6f', outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>Integrations</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Google Calendar', desc: 'Sync meetings and events', connected: true },
                { name: 'Recall.ai', desc: 'Auto-record meetings', connected: false },
                { name: 'SendGrid', desc: 'Email notifications', connected: true },
                { name: 'WhatsApp (MSG91)', desc: 'WhatsApp reminders', connected: true },
              ].map((item) => (
                <div key={item.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', backgroundColor: '#1e1f21', borderRadius: '8px',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>{item.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6f6e6f' }}>{item.desc}</p>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500',
                    backgroundColor: item.connected ? '#1a2e1a' : '#2e2a1a',
                    color: item.connected ? '#4ade80' : '#fbbf24',
                  }}>
                    {item.connected ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>Notifications</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Email notifications', desc: 'Receive email for task updates' },
                { label: 'WhatsApp reminders', desc: 'Get meeting reminders via WhatsApp' },
                { label: 'Task assignment alerts', desc: 'Notify when tasks are assigned' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#e5e7eb' }}>{item.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6f6e6f' }}>{item.desc}</p>
                  </div>
                  <div style={{
                    width: '40px', height: '22px', borderRadius: '11px',
                    backgroundColor: '#4ade80', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', padding: '2px',
                  }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%',
                      backgroundColor: '#fff', marginLeft: 'auto',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main Dashboard with Layout
const SuperAdminDashboard = () => {
  const location = useLocation();

  // Inbox state
  const [inboxConversation, setInboxConversation] = useState(null);
  const [inboxTask, setInboxTask] = useState(null);
  const [inboxActiveSection, setInboxActiveSection] = useState('chats');

  // Settings tab state
  const [settingsTab, setSettingsTab] = useState('account');

  // Handlers for InboxSidebar
  const handleSelectConversation = (conv) => {
    setInboxConversation(conv);
    setInboxTask(null);
    setInboxActiveSection('chats');
  };

  const handleSelectTask = (task) => {
    setInboxTask(task);
    setInboxConversation(null);
    setInboxActiveSection('tasks');
  };

  const handleSelectSection = (section) => {
    setInboxActiveSection(section);
  };

  // Determine active section based on path
  const getActiveSection = () => {
    if (location.pathname.includes('/inbox')) return 'inbox';
    if (location.pathname.includes('/admins')) return 'admins';
    if (location.pathname.includes('/boards')) return 'boards';
    if (location.pathname.includes('/all-tasks')) return 'tasks';
    if (location.pathname.includes('/calendar')) return 'calendar';
    if (location.pathname.includes('/meetings')) return 'meetings';
    if (location.pathname.includes('/settings')) return 'settings';
    return 'home';
  };

  // Determine which secondary sidebar to show
  const getSecondarySidebar = () => {
    const section = getActiveSection();
    if (section === 'boards') return <HomeSidebar />;
    if (section === 'settings') return (
      <SettingsSidebar
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
      />
    );
    if (section === 'inbox') return (
      <InboxSidebar
        onSelectConversation={handleSelectConversation}
        selectedConversation={inboxConversation}
        onSelectTask={handleSelectTask}
        selectedTask={inboxTask}
        onSelectSection={handleSelectSection}
        activeSection={inboxActiveSection}
      />
    );
    return null;
  };

  return (
    <WorkspaceLayout activeSection={getActiveSection()} secondarySidebar={getSecondarySidebar()}>
      <Routes>
        <Route path="/" element={<HomeDashboard />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/boards" element={<BoardsList />} />
        <Route path="/boards/:boardId" element={<BoardDetail />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/meetings" element={<MeetingsView />} />
        <Route path="/all-tasks" element={<AllTasks />} />
        <Route path="/admins" element={<AdminsManager />} />
        <Route path="/inbox" element={
          <Inbox
            selectedConversation={inboxConversation}
            onSelectConversation={handleSelectConversation}
            selectedTask={inboxTask}
            onSelectTask={handleSelectTask}
            activeSection={inboxActiveSection}
            onSelectSection={handleSelectSection}
          />
        } />
        <Route path="/settings" element={<Settings activeTab={settingsTab} />} />
        <Route path="*" element={<Navigate to="/workspace/super-admin" replace />} />
      </Routes>
    </WorkspaceLayout>
  );
};

export default SuperAdminDashboard;
