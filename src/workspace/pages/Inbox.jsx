import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceMessagesAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const Inbox = ({
  selectedConversation: propSelectedConversation,
  onSelectConversation,
  selectedTask: propSelectedTask,
  onSelectTask,
  activeSection: propActiveSection = 'chats',
  onSelectSection,
}) => {
  const { user, isSuperAdmin } = useWorkspaceAuth();
  const navigate = useNavigate();

  // Use props if provided, otherwise use local state (for backward compatibility)
  const [localSelectedConversation, setLocalSelectedConversation] = useState(null);
  const [localSelectedTask, setLocalSelectedTask] = useState(null);
  const [localActiveSection, setLocalActiveSection] = useState('chats');

  // Determine which values to use (props or local state)
  const selectedConversation = propSelectedConversation !== undefined ? propSelectedConversation : localSelectedConversation;
  const selectedTask = propSelectedTask !== undefined ? propSelectedTask : localSelectedTask;
  const activeSection = propActiveSection !== undefined ? propActiveSection : localActiveSection;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👏', '🙏', '❤️', '🔥', '✨', '🎉', '💯', '✅', '📝'];

  useEffect(() => {
    if (selectedConversation && activeSection === 'chats') {
      loadMessages(selectedConversation._id);
    }
  }, [selectedConversation?._id, activeSection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (conversationId) => {
    if (!conversationId || conversationId.startsWith('new-')) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    try {
      const response = await workspaceMessagesAPI.getMessages(conversationId);
      if (response.data.success) {
        setMessages(response.data.data);
        await workspaceMessagesAPI.markConversationAsRead(conversationId);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const participant = selectedConversation.participant || selectedConversation.user;
    if (!participant?._id) {
      console.error('No participant ID found:', selectedConversation);
      return;
    }

    setSendingMessage(true);
    try {
      const response = await workspaceMessagesAPI.sendMessage({
        receiver: participant._id,
        content: newMessage.trim(),
      });

      if (response.data.success) {
        const newMsg = response.data.data;
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');

        // Update selected conversation with real ID if it was a new conversation
        if (selectedConversation._id?.startsWith('new-')) {
          onSelectConversation?.({
            ...selectedConversation,
            _id: newMsg.conversationId,
            conversationId: newMsg.conversationId,
            lastMessage: newMsg,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error.response?.data || error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileMessage = `📎 ${file.name}`;
    setNewMessage(fileMessage);
    setShowAttachMenu(false);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
  };

  const handleSelectConversation = (conv) => {
    if (onSelectConversation) {
      onSelectConversation(conv);
    } else {
      setLocalSelectedConversation(conv);
      setLocalSelectedTask(null);
      setLocalActiveSection('chats');
    }
  };

  const handleSelectTask = (task) => {
    if (onSelectTask) {
      onSelectTask(task);
    } else {
      setLocalSelectedTask(task);
      setLocalSelectedConversation(null);
      setLocalActiveSection('tasks');
    }
  };

  const handleSelectSection = (section) => {
    if (onSelectSection) {
      onSelectSection(section);
    } else {
      setLocalActiveSection(section);
    }
  };

  const handleGoToTask = () => {
    if (selectedTask) {
      const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';
      navigate(`${basePath}/boards/${selectedTask.board?._id || selectedTask.board}?view=list&task=${selectedTask._id}`);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getInitials = (name) => name?.substring(0, 2).toUpperCase() || '??';

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#6b7280';
      case 'todo': return '#3b82f6';
      case 'doing': return '#f59e0b';
      case 'done': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'todo': return 'To Do';
      case 'doing': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.createdAt).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div style={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
        {/* Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
        {/* CHAT VIEW */}
        {activeSection === 'chats' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (() => {
              const chatPartner = selectedConversation.participant || selectedConversation.user;
              return (
              <>
                {/* Chat Header */}
                <div
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#2558BF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: '45px', height: '45px', borderRadius: '50%',
                        backgroundColor: chatPartner?.role === 'super_admin' ? '#22c55e' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: chatPartner?.role === 'super_admin' ? '#fff' : '#2558BF',
                        fontSize: '14px', fontWeight: '600',
                      }}
                    >
                      {getInitials(chatPartner?.name)}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: '2px', right: '2px',
                      width: '12px', height: '12px',
                      backgroundColor: '#22c55e', borderRadius: '50%',
                      border: '2px solid #2558BF',
                    }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: '600', color: '#fff', fontSize: '16px' }}>
                      {chatPartner?.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Online</p>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  style={{
                    flex: 1, overflow: 'auto', padding: '16px',
                    backgroundColor: '#e5ddd5',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4ccc4' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  {loadingMessages ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                      <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        backgroundColor: 'rgba(37, 88, 191, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="#2558BF">
                          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                        </svg>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '15px', fontWeight: '500' }}>No messages yet</p>
                      <p style={{ color: '#9ca3af', fontSize: '13px' }}>Send a message to start the conversation</p>
                    </div>
                  ) : (
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                      <div key={date}>
                        <div style={{ textAlign: 'center', margin: '16px 0' }}>
                          <span style={{
                            backgroundColor: 'rgba(225, 218, 208, 0.9)',
                            padding: '5px 12px', borderRadius: '8px',
                            fontSize: '12px', color: '#54656f', fontWeight: '500',
                            boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                          }}>
                            {formatDate(date)}
                          </span>
                        </div>
                        {msgs.map((msg) => {
                          const senderId = msg.sender?._id || msg.sender;
                          const currentUserId = user?._id || user?.id;
                          const isOwnMessage = senderId?.toString() === currentUserId?.toString();

                          return (
                            <div key={msg._id} style={{ display: 'flex', justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                              <div style={{
                                maxWidth: '65%', padding: '8px 12px',
                                borderRadius: isOwnMessage ? '8px 8px 0 8px' : '8px 8px 8px 0',
                                backgroundColor: isOwnMessage ? '#dcf8c6' : '#fff',
                                boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                                position: 'relative',
                              }}>
                                <p style={{ margin: 0, fontSize: '14.5px', lineHeight: '1.4', color: '#111b21', wordBreak: 'break-word', paddingRight: '20px' }}>
                                  {msg.content}
                                </p>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'flex-end', 
                                  gap: '4px', 
                                  marginTop: '2px',
                                  marginLeft: 'auto',
                                  width: 'fit-content'
                                }}>
                                  <span style={{ fontSize: '11px', color: '#667781' }}>{formatTime(msg.createdAt)}</span>
                                  {isOwnMessage && (
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill={msg.read ? '#53bdeb' : '#667781'}>
                                      <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div style={{ padding: '8px 12px', backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Emoji */}
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#54656f">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div style={{
                        position: 'absolute', bottom: '50px', left: '0',
                        backgroundColor: '#fff', borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', padding: '8px',
                        display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px', zIndex: 100,
                      }}>
                        {emojis.map((emoji, i) => (
                          <button key={i} onClick={() => handleEmojiSelect(emoji)}
                            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Attach */}
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex',
                        transform: showAttachMenu ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s',
                      }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#54656f">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </button>
                    {showAttachMenu && (
                      <div style={{
                        position: 'absolute', bottom: '50px', left: '0',
                        backgroundColor: '#fff', borderRadius: '12px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', padding: '12px',
                        display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100, minWidth: '150px',
                      }}>
                        <button onClick={() => fileInputRef.current?.click()}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#7f66ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" /></svg>
                          </div>
                          <span style={{ fontSize: '14px', color: '#3b4a54' }}>Document</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0063cb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                          </div>
                          <span style={{ fontSize: '14px', color: '#3b4a54' }}>Photos & Videos</span>
                        </button>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,video/*,.pdf,.doc,.docx" />
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    <input
                      ref={inputRef} type="text" value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message"
                      style={{ flex: 1, padding: '10px 16px', fontSize: '15px', border: 'none', borderRadius: '8px', backgroundColor: '#fff', outline: 'none' }}
                      onClick={() => { setShowEmojiPicker(false); setShowAttachMenu(false); }}
                    />
                  </form>

                  {/* Send/Voice */}
                  {newMessage.trim() ? (
                    <button onClick={handleSendMessage} disabled={sendingMessage}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#00a884', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                    </button>
                  ) : (
                    <button onClick={handleVoiceRecord}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: isRecording ? '#ef4444' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill={isRecording ? '#fff' : '#54656f'}>
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                      </svg>
                    </button>
                  )}
                </div>
              </>
            )})() : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' }}>
                <div style={{ textAlign: 'center', color: '#667781' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(37, 88, 191, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="#2558BF"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" /></svg>
                  </div>
                  <h2 style={{ fontSize: '28px', fontWeight: '300', color: '#41525d', margin: '0 0 12px' }}>It's Goti Web</h2>
                  <p style={{ fontSize: '14px', color: '#667781', maxWidth: '400px', lineHeight: '1.5' }}>
                    Select a conversation from the sidebar to start chatting.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TASK DETAILS VIEW */}
        {activeSection === 'tasks' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
            {selectedTask ? (
              <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
                {/* Header with status and priority */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                    backgroundColor: getStatusColor(selectedTask.status) + '15',
                    color: getStatusColor(selectedTask.status),
                  }}>
                    {getStatusLabel(selectedTask.status)}
                  </span>
                  {selectedTask.priority && (
                    <span style={{
                      padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500',
                      backgroundColor: selectedTask.priority === 'urgent' || selectedTask.priority === 'high' ? '#fef2f2' : '#f3f4f6',
                      color: selectedTask.priority === 'urgent' || selectedTask.priority === 'high' ? '#dc2626' : '#6b7280',
                      textTransform: 'capitalize',
                    }}>
                      {selectedTask.priority}
                    </span>
                  )}
                </div>

                {/* Task Title */}
                <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.3' }}>
                  {selectedTask.title}
                </h1>
                <p style={{ fontSize: '13px', color: '#888', margin: '0 0 24px' }}>
                  in <span style={{ color: '#555' }}>{selectedTask.board?.name || 'Board'}</span>
                </p>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {/* Assignee */}
                  {selectedTask.assignee && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned to</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#e8e8e8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '600', color: '#666',
                        }}>
                          {(selectedTask.assignee.name || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '14px', color: '#333' }}>{selectedTask.assignee.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  {selectedTask.dueDate && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date</p>
                      <p style={{
                        fontSize: '14px', margin: 0, fontWeight: '500',
                        color: new Date(selectedTask.dueDate) < new Date() ? '#dc2626' : '#333',
                      }}>
                        {new Date(selectedTask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {new Date(selectedTask.dueDate) < new Date() && <span style={{ color: '#dc2626', marginLeft: '6px' }}>(Overdue)</span>}
                      </p>
                    </div>
                  )}

                  {/* Start Date */}
                  {selectedTask.startDate && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Start Date</p>
                      <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>
                        {new Date(selectedTask.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  )}

                  {/* Created By */}
                  {selectedTask.createdBy && (
                    <div>
                      <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created by</p>
                      <span style={{ fontSize: '14px', color: '#333' }}>{selectedTask.createdBy.name || 'Unknown'}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tags</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedTask.tags.map((tag, i) => (
                        <span key={i} style={{
                          padding: '4px 10px', borderRadius: '4px', fontSize: '12px',
                          backgroundColor: '#f3f4f6', color: '#555',
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedTask.description && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</p>
                    <div style={{ padding: '14px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                      <p style={{ fontSize: '14px', color: '#333', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {selectedTask.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Subtasks */}
                {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Subtasks ({selectedTask.subtasks.filter(s => s.completed).length}/{selectedTask.subtasks.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedTask.subtasks.map((subtask, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid #eee',
                        }}>
                          {isSuperAdmin && (
                            <div style={{
                              width: '18px', height: '18px', borderRadius: '4px',
                              border: subtask.completed ? 'none' : '2px solid #ccc',
                              backgroundColor: subtask.completed ? '#22c55e' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {subtask.completed && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              )}
                            </div>
                          )}
                          <span style={{
                            fontSize: '14px', color: subtask.completed ? '#888' : '#333',
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                          }}>
                            {subtask.title || subtask.text || subtask}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {isSuperAdmin && selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Attachments ({selectedTask.attachments.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedTask.attachments.map((file, i) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', backgroundColor: '#fafafa', borderRadius: '6px', border: '1px solid #eee',
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#888">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                          </svg>
                          <span style={{ fontSize: '14px', color: '#333', flex: 1 }}>{file.name || file.filename || file}</span>
                          {file.size && <span style={{ fontSize: '12px', color: '#999' }}>{Math.round(file.size / 1024)} KB</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleGoToTask}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2558BF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
                  </svg>
                  Open in Board
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#999' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="#ddd" style={{ marginBottom: '16px' }}>
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
                  </svg>
                  <p style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 4px', color: '#666' }}>No task selected</p>
                  <p style={{ fontSize: '13px', color: '#999' }}>Select a task from the sidebar</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* UPDATES VIEW */}
        {activeSection === 'updates' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
            <div style={{ textAlign: 'center', color: '#999' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#ddd" style={{ marginBottom: '16px' }}>
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <p style={{ fontSize: '15px', fontWeight: '500', margin: '0 0 4px', color: '#666' }}>No updates yet</p>
              <p style={{ fontSize: '13px', color: '#999' }}>Activity updates will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;
