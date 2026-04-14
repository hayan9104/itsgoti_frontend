import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { workspaceTasksAPI, workspaceUsersAPI, workspaceUploadAPI } from '../../services/api';
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
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearchText, setAssigneeSearchText] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [activeLogTab, setActiveLogTab] = useState('activity');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachmentFileRef = useRef(null);

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isSuperAdmin) loadUsers();
    loadLogs();
    loadComments();

    // Ensure state is synced with prop when task changes
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setStartDate(task.scheduledDate ? task.scheduledDate.split('T')[0] : '');
    setAssigneeId(task.assignee?._id || '');
    setSubtasks(task.subtasks || []);
    setAttachments(task.attachments || []);
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

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const response = await workspaceTasksAPI.getComments(task._id);
      if (response.data.success) setComments(response.data.data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      const response = await workspaceTasksAPI.addComment(task._id, {
        content: newComment.trim(),
        attachments: [],
      });
      if (response.data.success) {
        setComments([response.data.data, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSendingComment(false);
    }
  };

  const handleAttachmentFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    e.target.value = '';
    setUploadingAttachment(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await workspaceUploadAPI.uploadFile(formData);
        if (uploadRes.data.success) {
          const ext = file.name.split('.').pop().toLowerCase();
          const typeMap = { jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', mp4: 'video', webm: 'video', mov: 'video', mp3: 'audio', wav: 'audio', ogg: 'audio', pdf: 'pdf', doc: 'word', docx: 'word', xls: 'excel', xlsx: 'excel', ppt: 'ppt', pptx: 'ppt' };
          const response = await workspaceTasksAPI.addDocument(task._id, {
            name: file.name,
            url: uploadRes.data.url,
            type: typeMap[ext] || 'file',
            size: file.size,
          });
          if (response.data.success) {
            const newAtt = {
              ...response.data.data,
              uploadedBy: response.data.data.uploadedBy || { _id: user?._id, name: user?.name },
            };
            setAttachments(prev => [...prev, newAtt]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to upload attachment:', error);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attId) => {
    if (!window.confirm('Remove this attachment?')) return;
    try {
      const response = await workspaceTasksAPI.deleteDocument(task._id, attId);
      if (response.data.success) {
        setAttachments(prev => prev.filter(a => a._id !== attId));
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const getFileIcon = (name) => {
    const ext = name?.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return '🖼';
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return '🎬';
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) return '🎵';
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
    if (['ppt', 'pptx'].includes(ext)) return '📋';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜';
    if (['txt', 'md', 'log'].includes(ext)) return '📃';
    return '📎';
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
        className="workspace-dark"
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          backgroundColor: '#2a2b2d',
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
            borderBottom: '1px solid #333436',
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
                backgroundColor: boardColor || '#6f6e6f',
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
                backgroundColor: hasChanges ? '#6f6e6f' : '#2a2b2d',
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
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #333436',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: '#1e1f21',
                  cursor: 'pointer',
                  color: '#e5e7eb'
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
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #333436',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: '#1e1f21',
                  color: '#e5e7eb',
                  cursor: 'pointer',
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
                  border: '1px solid #333436',
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
                  border: '1px solid #333436',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: !isSuperAdmin ? '#f9fafb' : '#fff',
                  color: !isSuperAdmin ? '#6b7280' : 'inherit',
                  cursor: !isSuperAdmin ? 'not-allowed' : 'text',
                }}
              />
            </div>

            {/* Assignee */}
            {(
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  Assignee
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                    style={{
                      width: '100%', padding: '8px 12px',
                      border: '1px solid #333436', borderRadius: '6px',
                      fontSize: '13px', backgroundColor: '#1e1f21',
                      cursor: 'pointer', color: '#e5e7eb',
                      display: 'flex', alignItems: 'center', gap: '8px', boxSizing: 'border-box',
                    }}
                  >
                    {assigneeId ? (
                      <>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '8px', fontWeight: '600' }}>
                          {users.find(u => u._id === assigneeId)?.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ flex: 1 }}>{users.find(u => u._id === assigneeId)?.name}</span>
                        <div onClick={(e) => { e.stopPropagation(); setAssigneeId(''); }} style={{ cursor: 'pointer', color: '#6f6e6f' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'} onMouseLeave={(e) => e.currentTarget.style.color = '#6f6e6f'}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                        </div>
                      </>
                    ) : (
                      <span style={{ color: '#6f6e6f' }}>Unassigned</span>
                    )}
                  </div>
                  {showAssigneeDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                      backgroundColor: '#2a2b2d', borderRadius: '8px', border: '1px solid #3a3b3d',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid #333436' }}>
                        <input
                          autoFocus
                          value={assigneeSearchText}
                          onChange={(e) => setAssigneeSearchText(e.target.value)}
                          placeholder="Search by name..."
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '100%', padding: '7px 10px', fontSize: '13px', border: '1px solid #4a4b4d', borderRadius: '6px', backgroundColor: '#1e1f21', color: '#e5e7eb', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }} className="hide-scrollbar">
                        {users.filter(u => u.name.toLowerCase().includes(assigneeSearchText.toLowerCase())).map(u => (
                          <div key={u._id} onClick={() => { setAssigneeId(u._id); setShowAssigneeDropdown(false); setAssigneeSearchText(''); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#e5e7eb' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '9px', fontWeight: '600' }}>
                              {u.name?.substring(0, 2).toUpperCase()}
                            </div>
                            {u.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                border: '1px solid #333436',
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
                    backgroundColor: '#1e1f21',
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
                      border: '1px solid #333436',
                      borderRadius: '6px',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#2a2b2d',
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

          {/* Activity / Comments Tabs */}
          <div style={{ marginBottom: '16px' }}>
            {/* Tab buttons */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '12px', borderBottom: '1px solid #333436' }}>
              {[
                { id: 'activity', label: 'Activity', count: logs.length },
                { id: 'comments', label: 'Comments', count: comments.length },
                { id: 'attachments', label: 'Attachments', count: attachments.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveLogTab(tab.id)}
                  style={{
                    padding: '8px 16px', fontSize: '13px', fontWeight: '500',
                    color: activeLogTab === tab.id ? '#f1f1f1' : '#6f6e6f',
                    backgroundColor: 'transparent', border: 'none',
                    borderBottom: activeLogTab === tab.id ? '2px solid #f1f1f1' : '2px solid transparent',
                    cursor: 'pointer', marginBottom: '-1px',
                  }}
                >
                  {tab.label} {tab.count > 0 && <span style={{ color: '#6f6e6f', fontSize: '11px' }}>({tab.count})</span>}
                </button>
              ))}
            </div>

            {/* Activity Tab */}
            {activeLogTab === 'activity' && (
              <>
                {loadingLogs ? (
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>Loading...</p>
                ) : logs.length === 0 ? (
                  <p style={{ color: '#6f6e6f', fontSize: '13px' }}>No activity yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }} className="hide-scrollbar">
                    {logs.map((log) => (
                      <div key={log._id} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2a2b2d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', color: '#e5e7eb', margin: 0 }}>
                            <strong>{log.user?.name}</strong> {log.actionText || log.action.replace(/_/g, ' ')}
                            {!log.actionText && log.changes?.field && (
                              <> - {getFieldName(log.changes.field)}: {formatLogValue(log.changes.field, log.changes.oldValue)} → {formatLogValue(log.changes.field, log.changes.newValue)}</>
                            )}
                          </p>
                          <span style={{ fontSize: '11px', color: '#6f6e6f' }}>{formatTime(log.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Comments Tab */}
            {activeLogTab === 'comments' && (
              <>
                {/* Add comment input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>
                    {user?.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      style={{
                        width: '100%', padding: '10px 12px', fontSize: '13px',
                        border: '1px solid #333436', borderRadius: '8px',
                        backgroundColor: '#1e1f21', color: '#e5e7eb',
                        outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || sendingComment}
                        style={{
                          padding: '6px 14px', fontSize: '12px', fontWeight: '500',
                          backgroundColor: newComment.trim() ? '#3b82f6' : '#333436',
                          color: newComment.trim() ? '#fff' : '#6f6e6f',
                          border: 'none', borderRadius: '6px', cursor: newComment.trim() ? 'pointer' : 'default',
                        }}
                      >
                        {sendingComment ? 'Sending...' : 'Comment'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments list */}
                {loadingComments ? (
                  <p style={{ color: '#6f6e6f', fontSize: '13px' }}>Loading...</p>
                ) : comments.length === 0 ? (
                  <p style={{ color: '#6f6e6f', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No comments yet. Be the first to comment!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '250px', overflowY: 'auto' }} className="hide-scrollbar">
                    {comments.map((comment) => (
                      <div key={comment._id} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>
                          {comment.user?.name?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#e5e7eb' }}>{comment.user?.name || 'Unknown'}</span>
                            <span style={{ fontSize: '11px', color: '#6f6e6f' }}>{formatTime(comment.createdAt)}</span>
                          </div>
                          {comment.content && comment.content !== '📎 Attachment' && (
                            <p style={{ margin: 0, fontSize: '13px', color: '#a2a0a2', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                              {comment.content}
                            </p>
                          )}
                          {/* Attachments */}
                          {comment.attachments && comment.attachments.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                              {comment.attachments.map((att, ai) => {
                                const isImage = att.type === 'image';
                                return (
                                  <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer"
                                    style={{ textDecoration: 'none' }}>
                                    {isImage ? (
                                      <img src={att.url} alt={att.name}
                                        style={{ maxWidth: '200px', maxHeight: '140px', borderRadius: '8px', border: '1px solid #333436', objectFit: 'cover', cursor: 'pointer' }}
                                      />
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#1e1f21', borderRadius: '8px', border: '1px solid #333436', cursor: 'pointer' }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#4a4b4d'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333436'}
                                      >
                                        <span style={{ fontSize: '16px' }}>{getFileIcon(att.name)}</span>
                                        <div>
                                          <div style={{ fontSize: '12px', color: '#e5e7eb', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</div>
                                          <div style={{ fontSize: '10px', color: '#6f6e6f' }}>{att.size ? (att.size / 1024).toFixed(1) + ' KB' : att.type}</div>
                                        </div>
                                      </div>
                                    )}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Attachments Tab */}
            {activeLogTab === 'attachments' && (
              <>
                <input
                  ref={attachmentFileRef}
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleAttachmentFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z,.csv,.md"
                />
                {/* Upload button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button
                    onClick={() => attachmentFileRef.current?.click()}
                    disabled={uploadingAttachment}
                    style={{
                      padding: '6px 14px', fontSize: '12px', fontWeight: '500',
                      backgroundColor: '#333436',
                      color: uploadingAttachment ? '#6f6e6f' : '#e5e7eb',
                      border: 'none', borderRadius: '6px',
                      cursor: uploadingAttachment ? 'default' : 'pointer',
                    }}
                  >
                    {uploadingAttachment ? 'Uploading...' : 'Add Attachment'}
                  </button>
                </div>

                {/* Attachments list */}
                {attachments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#6f6e6f' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
                    <p style={{ margin: 0, fontSize: '13px' }}>No attachments yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }} className="hide-scrollbar">
                    {attachments.map((att) => {
                      const isImage = att.type === 'image';
                      const canDelete = true;
                      return (
                        <div key={att._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: '#1e1f21', borderRadius: '8px', border: '1px solid #333436' }}>
                          {/* Thumbnail or icon */}
                          {isImage ? (
                            <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                              <img src={att.url} alt={att.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #333436' }} />
                            </a>
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#2a2b2d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                              {getFileIcon(att.name)}
                            </div>
                          )}

                          {/* File info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                              <div style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#e5e7eb'}
                              >
                                {att.name}
                              </div>
                            </a>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                              {att.size > 0 && (
                                <span style={{ fontSize: '11px', color: '#6f6e6f' }}>
                                  {att.size >= 1024 * 1024 ? (att.size / (1024 * 1024)).toFixed(1) + ' MB' : (att.size / 1024).toFixed(1) + ' KB'}
                                </span>
                              )}
                              {att.uploadedBy?.name && (
                                <>
                                  <span style={{ fontSize: '11px', color: '#4a4b4d' }}>•</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#fff', fontWeight: '600', flexShrink: 0 }}>
                                      {att.uploadedBy.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#6f6e6f' }}>{att.uploadedBy.name}</span>
                                  </div>
                                </>
                              )}
                              {att.uploadedAt && (
                                <>
                                  <span style={{ fontSize: '11px', color: '#4a4b4d' }}>•</span>
                                  <span style={{ fontSize: '11px', color: '#6f6e6f' }}>{formatTime(att.uploadedAt)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Delete button */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteAttachment(att._id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6f6e6f', padding: '4px', borderRadius: '4px', flexShrink: 0 }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = '#6f6e6f'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                              title="Remove attachment"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
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
