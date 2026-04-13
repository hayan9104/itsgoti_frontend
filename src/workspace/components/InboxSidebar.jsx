import { useState, useEffect } from 'react';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import { workspaceMessagesAPI, workspaceTasksAPI } from '../../services/api';

const InboxSidebar = ({
  onSelectConversation,
  selectedConversation,
  onSelectTask,
  selectedTask,
  onSelectSection,
  activeSection = 'chats'
}) => {
  const { user, isSuperAdmin } = useWorkspaceAuth();
  const [conversations, setConversations] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [readTasks, setReadTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Collapsible state for Tasks and Updates
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [updatesExpanded, setUpdatesExpanded] = useState(false);

  useEffect(() => {
    loadConversations();
    loadChatUsers();
    if (!isSuperAdmin) {
      loadTasks();
    }
    const storedReadTasks = localStorage.getItem('readTasks');
    if (storedReadTasks) {
      setReadTasks(new Set(JSON.parse(storedReadTasks)));
    }
  }, []);

  // Auto-create Super Admin conversation for Admin users
  useEffect(() => {
    if (!isSuperAdmin && chatUsers.length > 0 && !loading) {
      const superAdmin = chatUsers.find(u => u.role === 'super_admin');
      if (superAdmin) {
        // Check if conversation already exists
        const existingConv = conversations.find(c => {
          const participant = c.user || c.participant;
          return participant?._id === superAdmin._id;
        });

        if (!existingConv) {
          // Add Super Admin to conversations list
          const newConv = {
            _id: `new-${superAdmin._id}`,
            participant: superAdmin,
            user: superAdmin,
            lastMessage: null,
            unreadCount: 0,
          };
          setConversations(prev => [newConv, ...prev]);
        }
      }
    }
  }, [isSuperAdmin, chatUsers, loading]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation && activeSection === 'chats') {
      const firstConv = conversations[0];
      const convId = firstConv.conversationId || firstConv._id;
      const participant = firstConv.user || firstConv.participant;
      onSelectConversation?.({ ...firstConv, _id: convId, participant });
    }
  }, [conversations, selectedConversation, activeSection]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await workspaceMessagesAPI.getConversations();
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChatUsers = async () => {
    try {
      const response = await workspaceMessagesAPI.getChatUsers();
      if (response.data.success) {
        setChatUsers(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load chat users:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await workspaceTasksAPI.getMyTasks();
      if (response.data.success) {
        const pendingTasks = response.data.data.filter(t => t.status !== 'done');
        setTasks(pendingTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleChatClick = (conv) => {
    const convId = conv.conversationId || conv._id;
    const participant = conv.user || conv.participant;
    onSelectConversation?.({ ...conv, _id: convId, participant });
    onSelectSection?.('chats');
  };

  const handleNewChat = (chatUser) => {
    const existing = conversations.find(c => {
      const participant = c.user || c.participant;
      return participant?._id === chatUser._id;
    });

    if (existing) {
      handleChatClick(existing);
    } else {
      const newConv = {
        _id: `new-${chatUser._id}`,
        participant: chatUser,
        user: chatUser,
        lastMessage: null,
        unreadCount: 0,
      };
      setConversations([newConv, ...conversations]);
      onSelectConversation?.(newConv);
      onSelectSection?.('chats');
    }
  };

  const handleTaskClick = (task) => {
    const newReadTasks = new Set(readTasks);
    newReadTasks.add(task._id);
    setReadTasks(newReadTasks);
    localStorage.setItem('readTasks', JSON.stringify([...newReadTasks]));
    onSelectTask?.(task);
    onSelectSection?.('tasks');
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (days === 1) return 'Yesterday';
    if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => name?.substring(0, 2).toUpperCase() || '??';

  const unreadChatCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const isRealTask = (t) => t.type !== 'note' && !t.title.toLowerCase().includes('connect with me');
  const realTasks = tasks.filter(isRealTask);
  const unreadTaskCount = realTasks.filter(t => !readTasks.has(t._id)).length;

  // Get available chat users (for Super Admin to start new chats)
  const availableChatUsers = chatUsers.filter(u =>
    u._id !== user?._id &&
    u.role !== 'super_admin' &&
    !conversations.some(c => (c.user || c.participant)?._id === u._id)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#2a2b2d' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid #333436' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#f1f1f1', margin: 0 }}>Inbox</h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>

        {/* CHATS SECTION */}
        <div>
          {/* Chats Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #333436',
            backgroundColor: '#252628',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>Chats</span>
              {unreadChatCount > 0 && (
                <span style={{
                  minWidth: '18px', height: '18px', padding: '0 5px',
                  backgroundColor: '#e53935', borderRadius: '9px',
                  color: '#fff', fontSize: '11px', fontWeight: '600',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadChatCount}
                </span>
              )}
            </div>
          </div>

          {/* Chat List */}
          {loading ? (
            <div style={{ padding: '12px 16px', color: '#6f6e6f', fontSize: '13px' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '12px 16px', color: '#6f6e6f', fontSize: '13px' }}>No conversations</div>
          ) : (
            conversations.map(conv => {
              const participant = conv.user || conv.participant;
              const convId = conv.conversationId || conv._id;
              const isSelected = (selectedConversation?._id === convId || selectedConversation?.conversationId === convId) && activeSection === 'chats';
              const isUnread = conv.unreadCount > 0;

              return (
                <div
                  key={convId}
                  onClick={() => handleChatClick(conv)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#3a3b3d' : 'transparent',
                    borderLeft: isSelected ? '3px solid #6f6e6f' : '3px solid transparent',
                    borderBottom: '1px solid #2a2b2d',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: '#4a4b4d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#a2a0a2', fontSize: '12px', fontWeight: '600',
                    }}>
                      {getInitials(participant?.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: isUnread ? '600' : '500',
                          color: '#f1f1f1'
                        }}>
                          {participant?.name}
                        </span>
                        {conv.lastMessage && (
                          <span style={{ fontSize: '11px', color: '#6f6e6f' }}>
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p style={{
                        margin: '2px 0 0', fontSize: '12px',
                        color: '#6f6e6f',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {conv.lastMessage?.content || 'Tap to start conversation'}
                      </p>
                    </div>
                    {isUnread && (
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        backgroundColor: '#6f6e6f',
                      }} />
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Available Users to Chat (Super Admin only) */}
          {isSuperAdmin && availableChatUsers.length > 0 && (
            <>
              <div style={{ padding: '10px 16px 6px', backgroundColor: '#252628' }}>
                <span style={{ fontSize: '11px', color: '#6f6e6f', fontWeight: '500', textTransform: 'uppercase' }}>Start new chat</span>
              </div>
              {availableChatUsers.map(chatUser => (
                <div
                  key={chatUser._id}
                  onClick={() => handleNewChat(chatUser)}
                  style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    borderBottom: '1px solid #2a2b2d',
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: '#3a3b3d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6f6e6f', fontSize: '11px', fontWeight: '500',
                  }}>
                    {getInitials(chatUser.name)}
                  </div>
                  <span style={{ fontSize: '13px', color: '#a2a0a2' }}>{chatUser.name}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* TASKS SECTION - Admin Only */}
        {!isSuperAdmin && (
          <div>
            {/* Tasks Header - Clickable Dropdown */}
            <div
              onClick={() => setTasksExpanded(!tasksExpanded)}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                backgroundColor: '#252628',
                borderBottom: '1px solid #333436',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>Tasks</span>
                {unreadTaskCount > 0 && (
                  <span style={{
                    minWidth: '18px', height: '18px', padding: '0 5px',
                    backgroundColor: '#e53935', borderRadius: '9px',
                    color: '#fff', fontSize: '11px', fontWeight: '600',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {unreadTaskCount}
                  </span>
                )}
              </div>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="#888"
                style={{
                  transform: tasksExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </div>

            {/* Tasks List */}
            {tasksExpanded && (
              realTasks.length === 0 ? (
                <div style={{ padding: '12px 16px', color: '#6f6e6f', fontSize: '13px' }}>No pending tasks</div>
              ) : (
                realTasks.map(task => {
                  const isUnread = !readTasks.has(task._id);
                  const isSelected = selectedTask?._id === task._id && activeSection === 'tasks';
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

                  return (
                    <div
                      key={task._id}
                      onClick={() => handleTaskClick(task)}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#3a3b3d' : 'transparent',
                        borderLeft: isSelected ? '3px solid #6f6e6f' : '3px solid transparent',
                        borderBottom: '1px solid #2a2b2d',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        {isUnread && (
                          <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: '#e53935', marginTop: '6px', flexShrink: 0,
                          }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: isUnread ? '600' : '500',
                              color: '#f1f1f1'
                            }}>
                              {task.title}
                            </span>
                            {isOverdue && (
                              <span style={{ fontSize: '10px', color: '#e53935', fontWeight: '500' }}>
                                Overdue
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6f6e6f' }}>
                            {task.board?.name}
                            {task.dueDate && ` • Due ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}

        {/* UPDATES SECTION - Admin Only */}
        {!isSuperAdmin && (
          <div>
            {/* Updates Header - Clickable Dropdown */}
            <div
              onClick={() => setUpdatesExpanded(!updatesExpanded)}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                backgroundColor: '#252628',
                borderBottom: '1px solid #333436',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>Updates</span>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="#888"
                style={{
                  transform: updatesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
              </svg>
            </div>

            {/* Updates List */}
            {updatesExpanded && (
              <div style={{ padding: '12px 16px', color: '#6f6e6f', fontSize: '13px' }}>
                No updates yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxSidebar;
