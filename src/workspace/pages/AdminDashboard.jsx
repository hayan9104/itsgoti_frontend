import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import HomeSidebar from '../components/HomeSidebar';
import InboxSidebar from '../components/InboxSidebar';
import BoardsList from './BoardsList';
import BoardDetail from './BoardDetail';
import Inbox from './Inbox';
import CalendarView from '../components/CalendarView';
import MeetingsView from '../components/MeetingsView';
import { workspaceTasksAPI, workspaceBoardsAPI, workspaceMessagesAPI } from '../../services/api';
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
    { icon: 'board', label: 'View Boards', desc: 'See your boards', action: () => navigate('/workspace/admin/boards') },
    { icon: 'conversation', label: 'Inbox', desc: 'Check messages', action: () => navigate('/workspace/admin/inbox') },
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
          My Boards
        </h3>

        {loading ? (
          <p style={{ color: '#9ca3af' }}>Loading...</p>
        ) : recentItems.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#2a2b2d', borderRadius: '12px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#4a4b4d" style={{ margin: '0 auto 12px' }}>
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            <p style={{ color: '#9ca3af', margin: 0 }}>No boards assigned yet</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333436' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Kind</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Tasks</th>
                <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentItems.map((item) => (
                <tr
                  key={item._id}
                  style={{ borderBottom: '1px solid #2a2b2d', cursor: 'pointer' }}
                  onClick={() => navigate(`/workspace/admin/boards/${item._id}`)}
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
                        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{item.description || 'No description'}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: '#a2a0a2' }}>{item.type}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: '#a2a0a2' }}>{item.taskCount || 0}</td>
                  <td style={{ padding: '16px 0', fontSize: '14px', color: '#a2a0a2' }}>{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: '500', color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase' }}>
          Quick Actions
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
      const response = await workspaceTasksAPI.getMyTasks();
      if (response.data.success) {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return '#22c55e';
      case 'doing': return '#f59e0b';
      case 'todo': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'done': return '#dcfce7';
      case 'doing': return '#fef3c7';
      case 'todo': return '#dbeafe';
      default: return '#2a2b2d';
    }
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    doing: tasks.filter((t) => t.status === 'doing').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const completedTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#f1f1f1', marginBottom: '24px' }}>My Tasks</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Tasks', value: stats.total, color: '#6b7280' },
          { label: 'To-Do', value: stats.todo, color: '#3b82f6' },
          { label: 'In Progress', value: stats.doing, color: '#f59e0b' },
          { label: 'Completed', value: stats.done, color: '#22c55e' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#2a2b2d',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>{stat.label}</p>
            <p style={{ color: stat.color, fontSize: '28px', fontWeight: '700', margin: 0 }}>
              {loading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Pending Tasks */}
      <div
        style={{
          backgroundColor: '#2a2b2d',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>
          Pending Tasks ({pendingTasks.length})
        </h2>

        {loading ? (
          <p style={{ color: '#6b7280' }}>Loading...</p>
        ) : pendingTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#424244" style={{ marginBottom: '12px' }}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            <p style={{ fontSize: '15px' }}>All caught up! No pending tasks.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingTasks.map((task) => (
              <div
                key={task._id}
                onClick={() => navigate(`/workspace/admin/boards/${task.board?._id || task.board}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: '#252628',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${task.board?.color || '#6f6e6f'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(task.status),
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontWeight: '500', color: '#f1f1f1', fontSize: '14px' }}>{task.title}</p>
                    <p style={{ margin: '2px 0 0', color: '#6b7280', fontSize: '12px' }}>{task.board?.name || 'Unknown Board'}</p>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: getStatusBg(task.status),
                    color: getStatusColor(task.status),
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

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div
          style={{
            backgroundColor: '#2a2b2d',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>
            Recently Completed ({completedTasks.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {completedTasks.slice(0, 5).map((task) => (
              <div
                key={task._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '6px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#22c55e">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                <span style={{ flex: 1, fontSize: '13px', color: '#166534' }}>{task.title}</span>
                <span style={{ fontSize: '11px', color: '#22c55e' }}>{task.board?.name}</span>
              </div>
            ))}
          </div>
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
                  backgroundColor: selectedConversation.participant?.role === 'super_admin' ? '#22c55e' : '#6f6e6f',
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

// Settings Page
const Settings = () => {
  const { user, logout } = useWorkspaceAuth();

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#f1f1f1', marginBottom: '24px' }}>Settings</h1>

      <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>Profile</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#6f6e6f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '20px',
              fontWeight: '600',
            }}
          >
            {user?.initials || user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f1f1f1' }}>{user?.name}</p>
            <p style={{ margin: '4px 0', fontSize: '14px', color: '#6b7280' }}>{user?.email}</p>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontSize: '12px',
                fontWeight: '500',
                borderRadius: '6px',
                textTransform: 'capitalize',
              }}
            >
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f1f1', marginBottom: '16px' }}>Account</h2>
        <button
          onClick={logout}
          style={{
            padding: '12px 24px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

// Main Dashboard with Layout
const AdminDashboard = () => {
  const location = useLocation();

  // Inbox state - lifted up for sharing between sidebar and content
  const [inboxConversation, setInboxConversation] = useState(null);
  const [inboxTask, setInboxTask] = useState(null);
  const [inboxActiveSection, setInboxActiveSection] = useState('chats');

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
    if (location.pathname.includes('/boards')) return 'boards';
    if (location.pathname.includes('/my-tasks')) return 'tasks';
    if (location.pathname.includes('/calendar')) return 'calendar';
    if (location.pathname.includes('/meetings')) return 'meetings';
    if (location.pathname.includes('/settings')) return 'settings';
    return 'home';
  };

  // Determine which secondary sidebar to show
  const getSecondarySidebar = () => {
    const section = getActiveSection();
    if (section === 'boards') return <HomeSidebar />;
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
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/workspace/admin" replace />} />
      </Routes>
    </WorkspaceLayout>
  );
};

export default AdminDashboard;
