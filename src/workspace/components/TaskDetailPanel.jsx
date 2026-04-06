import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { workspaceTasksAPI, workspaceUsersAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: '#6b7280' },
  { value: 'todo', label: 'To-Do', color: '#3b82f6' },
  { value: 'doing', label: 'Doing', color: '#f59e0b' },
  { value: 'done', label: 'Done', color: '#22c55e' },
];

const TaskDetailPanel = ({ task, boardColor, onClose, onUpdate, onDelete }) => {
  const { isSuperAdmin, user } = useWorkspaceAuth();

  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.split('T')[0] : '');
  const [startDate, setStartDate] = useState(task.scheduledDate ? task.scheduledDate.split('T')[0] : '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?._id || '');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) loadUsers();
    loadLogs();

    // Ensure state is synced with prop when task changes
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setStartDate(task.scheduledDate ? task.scheduledDate.split('T')[0] : '');
    setAssigneeId(task.assignee?._id || '');
    setSubtasks(task.subtasks || []);
  }, [task]);

  const loadUsers = async () => {
    try {
      const response = await workspaceUsersAPI.getAll();
      if (response.data.success) setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await workspaceTasksAPI.getLogs(task._id);
      if (response.data.success) setLogs(response.data.data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await workspaceTasksAPI.update(task._id, {
        title,
        description,
        status,
        priority,
        dueDate: dueDate || null,
        scheduledDate: startDate || null,
        assignee: assigneeId || null,
      });
      if (response.data.success) {
        onUpdate(response.data.data);
        loadLogs();
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    try {
      const response = await workspaceTasksAPI.addSubtask(task._id, { title: newSubtask });
      if (response.data.success) {
        setSubtasks([...subtasks, response.data.data]);
        setNewSubtask('');
        onUpdate({ ...task, subtasks: [...subtasks, response.data.data] });
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
    }
  };

  const toggleSubtask = async (subtaskId) => {
    try {
      const response = await workspaceTasksAPI.toggleSubtask(task._id, subtaskId);
      if (response.data.success) {
        const updated = subtasks.map((s) =>
          s._id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        setSubtasks(updated);
        onUpdate({ ...task, subtasks: updated });
      }
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
    }
  };

  const deleteSubtask = async (subtaskId) => {
    try {
      await workspaceTasksAPI.deleteSubtask(task._id, subtaskId);
      const updated = subtasks.filter((s) => s._id !== subtaskId);
      setSubtasks(updated);
      onUpdate({ ...task, subtasks: updated });
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await workspaceTasksAPI.delete(task._id);
      onDelete(task._id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };


  const hasChanges = 
    title !== task.title ||
    description !== (task.description || '') ||
    status !== task.status ||
    priority !== task.priority ||
    dueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '') ||
    startDate !== (task.scheduledDate ? task.scheduledDate.split('T')[0] : '') ||
    assigneeId !== (task.assignee?._id || '');

  const formatLogValue = (field, value) => {
    if (!value) return 'none';
    if (field === 'dueDate' || field === 'startDate' || field === 'scheduledDate') {
      try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  const getFieldName = (field) => {
    const names = {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      dueDate: 'due',
      startDate: 'scheduled',
      scheduledDate: 'scheduled',
      assignee: 'assignee',
    };
    return names[field] || field;
  };

  // Use createPortal to render modal at document body level
  if (!mounted) return null;

  return createPortal(
    <>
      <style>
        {`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .task-detail-scroll::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99998,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          backgroundColor: '#fff',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalFadeIn 0.3s ease-out',
          overflow: 'hidden',
          zIndex: 99999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <div
              style={{
                width: '4px',
                height: '24px',
                borderRadius: '2px',
                backgroundColor: boardColor || '#2558BF',
              }}
            />
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Task Details</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              style={{
                padding: '6px 12px',
                backgroundColor: hasChanges ? '#2558BF' : '#f3f4f6',
                color: hasChanges ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {isSuperAdmin && (
              <button
                onClick={handleDelete}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          className="task-detail-scroll"
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Title */}
          <input
            disabled={!isSuperAdmin}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              fontSize: '20px',
              fontWeight: '600',
              color: !isSuperAdmin ? '#6b7280' : '#111827',
              border: 'none',
              outline: 'none',
              marginBottom: '16px',
              padding: '0',
              backgroundColor: 'transparent',
              cursor: !isSuperAdmin ? 'not-allowed' : 'text',
            }}
          />

          {/* Meta Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {/* Status */}
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                Status
              </label>
              <select
                disabled
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                title="Change status via Board or List view"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: '#f9fafb',
                  cursor: 'not-allowed',
                  color: '#6b7280'
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                Priority
              </label>
              <select
                disabled={!isSuperAdmin}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: !isSuperAdmin ? '#f9fafb' : '#fff',
                  color: !isSuperAdmin ? '#6b7280' : 'inherit',
                  cursor: !isSuperAdmin ? 'not-allowed' : 'pointer',
                }}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                Start Date
              </label>
              <input
                disabled={!isSuperAdmin}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: !isSuperAdmin ? '#f9fafb' : '#fff',
                  color: !isSuperAdmin ? '#6b7280' : 'inherit',
                  cursor: !isSuperAdmin ? 'not-allowed' : 'text',
                }}
              />
            </div>

            {/* Due Date */}
            <div>
              <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                Due Date
              </label>
              <input
                disabled={!isSuperAdmin}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: !isSuperAdmin ? '#f9fafb' : '#fff',
                  color: !isSuperAdmin ? '#6b7280' : 'inherit',
                  cursor: !isSuperAdmin ? 'not-allowed' : 'text',
                }}
              />
            </div>

            {/* Assignee */}
            {isSuperAdmin && (
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  Assignee
                </label>
                <select
                  disabled
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  title="Assign members from the Members view"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: '#f9fafb',
                    cursor: 'not-allowed',
                    color: '#6b7280'
                  }}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              disabled={!isSuperAdmin}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isSuperAdmin ? "Add a description..." : "No description provided"}
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '13px',
                resize: 'vertical',
                fontFamily: 'inherit',
                backgroundColor: !isSuperAdmin ? '#f9fafb' : '#fff',
                color: !isSuperAdmin ? '#6b7280' : 'inherit',
                cursor: !isSuperAdmin ? 'not-allowed' : 'text',
              }}
            />
          </div>

          {/* Subtasks */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '10px' }}>
              Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subtasks.map((subtask) => (
                <div
                  key={subtask._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => toggleSubtask(subtask._id)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: '13px',
                      color: subtask.completed ? '#9ca3af' : '#374151',
                      textDecoration: subtask.completed ? 'line-through' : 'none',
                    }}
                  >
                    {subtask.title}
                  </span>
                  {isSuperAdmin && (
                    <button
                      onClick={() => deleteSubtask(subtask._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        padding: '2px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              {isSuperAdmin && (
                <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Add
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '10px' }}>
              Activity Log {logs.length > 0 && `(${logs.length})`}
            </label>
            {loadingLogs ? (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading...</p>
            ) : logs.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>No activity yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {logs.map((log) => (
                  <div key={log._id} style={{ display: 'flex', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>
                        <strong>{log.user?.name}</strong> {log.actionText || log.action.replace(/_/g, ' ')}
                        {!log.actionText && log.changes?.field && (
                          <> - {getFieldName(log.changes.field)}: {formatLogValue(log.changes.field, log.changes.oldValue)} → {formatLogValue(log.changes.field, log.changes.newValue)}</>
                        )}
                      </p>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>,
    document.body
  );
};

export default TaskDetailPanel;
