import { useState, useRef, useEffect } from 'react';
import { workspaceTasksAPI, workspaceUsersAPI, workspaceBoardsAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const PRIORITY_COLORS = {
  low: { bg: '#1a2e1a', color: '#4ade80', label: 'Low' },
  medium: { bg: '#2e2a1a', color: '#fbbf24', label: 'Medium' },
  high: { bg: '#2e1a1a', color: '#f87171', label: 'High' },
  urgent: { bg: '#3a1a1a', color: '#ef4444', label: 'Urgent' },
};

const LABEL_COLORS = {
  bug: '#ef4444',
  feature: '#3b82f6',
  enhancement: '#8b5cf6',
  documentation: '#6b7280',
  design: '#ec4899',
  testing: '#14b8a6',
};

const TaskCard = ({ task, boardColor, onDragStart, onDragEnd, onClick, onUpdate, onDelete }) => {
  const { isSuperAdmin } = useWorkspaceAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(task.title);
  const [showMembers, setShowMembers] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [showBoards, setShowBoards] = useState(false);
  const [users, setUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  const menuRef = useRef(null);

  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowMembers(false);
        setShowDates(false);
        setShowBoards(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    try {
      const res = await workspaceUsersAPI.getAll();
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBoards = async () => {
    try {
      const res = await workspaceBoardsAPI.getAll();
      if (res.data.success) {
        setBoards(res.data.data.filter(b => b._id !== task.board));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    if (!showMenu) {
      if (isSuperAdmin) loadUsers();
      loadBoards();
    }
  };

  const handleRename = async () => {
    if (!tempName.trim() || tempName === task.title) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await workspaceTasksAPI.update(task._id, { title: tempName });
      if (res.data.success) {
        onUpdate?.(res.data.data);
        setIsEditingName(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (userId) => {
    try {
      const res = await workspaceTasksAPI.update(task._id, { assignee: userId });
      if (res.data.success) onUpdate?.(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDates = async (start, end) => {
    try {
      const res = await workspaceTasksAPI.update(task._id, { startDate: start, dueDate: end });
      if (res.data.success) onUpdate?.(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToBoard = async (boardId) => {
    try {
      const res = await workspaceTasksAPI.update(task._id, { board: boardId });
      if (res.data.success) window.location.reload(); // Refresh to reflect change
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async () => {
    try {
      const { _id, createdAt, updatedAt, ...rest } = task;
      const res = await workspaceTasksAPI.create(task.board, { ...rest, title: `${task.title} (Copy)` });
      if (res.data.success) window.location.reload(); // Refresh to show new task
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async () => {
    try {
      const res = await workspaceTasksAPI.update(task._id, { status: 'archived' });
      if (res.data.success) onUpdate?.(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await workspaceTasksAPI.delete(task._id);
      if (res.data.success) onDelete?.(task._id);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  const handleMembersClick = (e) => {
    e.stopPropagation();
    setShowMembers(!showMembers);
    setShowDates(false);
    setShowBoards(false);
  };

  const handleDatesClick = (e) => {
    e.stopPropagation();
    setShowDates(!showDates);
    setShowMembers(false);
    setShowBoards(false);
  };

  const handleBoardsClick = (e) => {
    e.stopPropagation();
    setShowBoards(!showBoards);
    setShowMembers(false);
    setShowDates(false);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        backgroundColor: '#2a2b2d',
        borderRadius: '8px',
        padding: '12px 14px',
        cursor: 'grab',
        transition: 'background-color 0.15s',
        border: '1px solid #353638',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#2a2b2d';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#2a2b2d';
      }}
    >
      {/* Menu Trigger */}
      <button
        onClick={handleMenuClick}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: '#6f6e6f',
          borderRadius: '4px',
          zIndex: 5
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#424244'; e.currentTarget.style.color = '#f1f1f1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '40px',
            right: '0',
            backgroundColor: '#353638',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: 100,
            minWidth: '220px',
            padding: '8px',
            border: '1px solid #4a4b4d',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div onClick={() => { setIsEditingName(true); setShowMenu(false); }} style={menuItemStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Rename
            </div>
            <div onClick={() => { onClick(); setShowMenu(false); }} style={menuItemStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open...
            </div>

            <div style={{ height: '1px', backgroundColor: '#4a4b4d', margin: '4px 0' }} />

            {isSuperAdmin && (
              <>
                <div onClick={handleMembersClick} style={menuItemStyle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  Members...
                </div>
                {showMembers && (
                  <div style={{ padding: '8px', backgroundColor: '#2a2b2d', borderRadius: '6px', margin: '4px 0', border: '1px solid #4a4b4d' }}>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', padding: '4px 8px', backgroundColor: '#353638', borderRadius: '4px', border: '1px solid #4a4b4d' }}>
                        <span style={{ fontWeight: '500', color: '#e5e7eb' }}>{task.assignee.name}</span>
                        <button onClick={() => handleAssign(null)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px' }}>Remove</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#6f6e6f', padding: '4px 8px', fontStyle: 'italic' }}>Unassigned</div>
                    )}
                    <div style={{ borderTop: '1px solid #4a4b4d', marginTop: '4px', paddingTop: '4px' }}>
                      <div style={{ fontSize: '10px', color: '#6f6e6f', marginBottom: '4px', paddingLeft: '8px' }}>ASSIGN TO</div>
                      {users.filter(u => u._id !== task.assignee?._id).map(u => (
                        <div key={u._id} onClick={() => handleAssign(u._id)} style={{ padding: '6px 8px', cursor: 'pointer', fontSize: '12px', borderRadius: '4px' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#4a4b4d'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>{u.name}</div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div onClick={handleDatesClick} style={menuItemStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Dates...
            </div>
            {showDates && (
              <div style={{ padding: '10px', backgroundColor: '#2a2b2d', borderRadius: '6px', margin: '4px 0', border: '1px solid #4a4b4d' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#a2a0a2', display: 'block', marginBottom: '4px' }}>Start Date</label>
                  <input 
                    type="date" 
                    value={task.startDate?.split('T')[0] || ''} 
                    onChange={(e) => handleUpdateDates(e.target.value, task.dueDate)} 
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #4a4b4d', borderRadius: '4px', backgroundColor: '#1e1f21', color: '#e5e7eb' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#a2a0a2', display: 'block', marginBottom: '4px' }}>End Date</label>
                  <input 
                    type="date" 
                    value={task.dueDate?.split('T')[0] || ''} 
                    onChange={(e) => handleUpdateDates(task.startDate, e.target.value)} 
                    style={{ width: '100%', padding: '4px 8px', fontSize: '12px', border: '1px solid #4a4b4d', borderRadius: '4px', backgroundColor: '#1e1f21', color: '#e5e7eb' }} 
                  />
                </div>
              </div>
            )}

            <div style={{ height: '1px', backgroundColor: '#4a4b4d', margin: '4px 0' }} />

            {isSuperAdmin && (
              <>
                <div onClick={handleDuplicate} style={menuItemStyle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Duplicate
                </div>
                <div onClick={handleBoardsClick} style={menuItemStyle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Move to Board...
                </div>
                {showBoards && (
                  <div style={{ padding: '6px', backgroundColor: '#2a2b2d', borderRadius: '6px', margin: '4px 0', border: '1px solid #4a4b4d', maxHeight: '150px', overflowY: 'auto' }}>
                    {boards.length > 0 ? (
                      boards.map(b => (
                        <div 
                          key={b._id} 
                          onClick={() => handleMoveToBoard(b._id)} 
                          style={{ padding: '6px 10px', cursor: 'pointer', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }} 
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333436'} 
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: b.color || '#6f6e6f' }} />
                          {b.name}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: '11px', color: '#6f6e6f', padding: '8px', textAlign: 'center' }}>No other boards available</div>
                    )}
                  </div>
                )}

                <div style={{ height: '1px', backgroundColor: '#4a4b4d', margin: '4px 0' }} />

                <div onClick={handleArchive} style={menuItemStyle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                  Archive
                </div>
                <div onClick={handleRemove} style={{ ...menuItemStyle, color: '#ef4444' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px' }}>
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  Remove
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Title with Circle Checkbox - Asana Style */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div
          onClick={(e) => { e.stopPropagation(); }}
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: `2px solid ${task.status === 'done' ? '#22c55e' : '#6f6e6f'}`,
            backgroundColor: task.status === 'done' ? '#22c55e' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '1px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {task.status === 'done' && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {isEditingName ? (
            <input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #a2a0a2',
                borderRadius: '4px',
                padding: '2px 4px',
                marginBottom: '4px',
                outline: 'none',
                backgroundColor: '#1e1f21',
                color: '#f1f1f1',
              }}
            />
          ) : (
            <h4
              style={{
                fontSize: '14px',
                fontWeight: '400',
                color: task.status === 'done' ? '#6f6e6f' : '#e5e7eb',
                margin: '0 0 6px 0',
                lineHeight: '1.4',
                paddingRight: '20px',
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </h4>
          )}
        </div>
      </div>

      {/* Description Preview */}
      {task.description && (
        <p
          style={{
            fontSize: '12px',
            color: '#a2a0a2',
            margin: '0 0 10px 0',
            paddingLeft: '28px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {task.description}
        </p>
      )}

      {/* Meta info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '6px',
          paddingLeft: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Priority */}
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: priority.bg,
              color: priority.color,
              fontWeight: '500',
            }}
          >
            {priority.label}
          </span>

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: '#a2a0a2',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z" />
              </svg>
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: isOverdue ? '#ef4444' : '#a2a0a2',
                fontWeight: isOverdue ? '500' : '400',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: boardColor || '#6f6e6f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '10px',
              fontWeight: '600',
            }}
            title={task.assignee.name}
          >
            {task.assignee.initials || task.assignee.name?.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Attachments indicator */}
      {task.attachments && task.attachments.length > 0 && (
        <div
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid #353638',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#a2a0a2',
            fontSize: '11px',
            paddingLeft: '28px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
          </svg>
          {task.attachments.length} attachment{task.attachments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

const menuItemStyle = {
  padding: '10px 12px',
  fontSize: '13px',
  color: '#e5e7eb',
  cursor: 'pointer',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.1s',
};

const menuIconStyle = {
  marginRight: '10px',
  fontSize: '14px',
};

export default TaskCard;
