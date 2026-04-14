import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { workspaceTasksAPI, workspaceUsersAPI, uploadAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

// Default options (used when board has no custom settings)
const DEFAULT_TYPES = [
  { id: 'operational', label: 'Operational', color: '#22c55e' },
  { id: 'strategic', label: 'Strategic', color: '#3b82f6' },
  { id: 'tactical', label: 'Tactical', color: '#f59e0b' },
  { id: 'administrative', label: 'Administrative', color: '#8b5cf6' },
];

const DEFAULT_STATUSES = [
  { id: 'open', label: 'Open', color: '#6b7280' },
  { id: 'todo', label: 'To-Do', color: '#3b82f6' },
  { id: 'doing', label: 'Doing', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#22c55e' },
];

const DEFAULT_PRIORITIES = [
  { id: 'none', label: 'None', color: '#9ca3af' },
  { id: 'low', label: 'Low', color: '#3b82f6' },
  { id: 'medium', label: 'Medium', color: '#eab308' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'critical', label: 'Critical', color: '#ef4444' },
];

const DEFAULT_TAGS = [
  { id: 'design', name: 'Design', color: '#ec4899' },
  { id: 'development', name: 'Development', color: '#3b82f6' },
  { id: 'bug', name: 'Bug', color: '#ef4444' },
  { id: 'feature', name: 'Feature', color: '#22c55e' },
  { id: 'urgent', name: 'Urgent', color: '#f97316' },
  { id: 'review', name: 'Review', color: '#8b5cf6' },
];

const TIME_OPTIONS = [
  { value: '0', label: '0h' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1:30 hours' },
  { value: '120', label: '2 hours' },
  { value: '180', label: '3 hours' },
  { value: '240', label: '4 hours' },
  { value: '480', label: '8 hours' },
];

const CreateTaskModal = ({ boardId, boardName, boardSettings, initialStatus = 'open', sidebarList, onClose, onCreated }) => {
  const { user } = useWorkspaceAuth();
  const fileInputRef = useRef(null);
  const subtaskInputRef = useRef(null);

  // Use board settings or fall back to defaults
  const TYPES = useMemo(() => {
    return boardSettings?.types?.length > 0 ? boardSettings.types : DEFAULT_TYPES;
  }, [boardSettings]);

  const STATUSES = useMemo(() => {
    return boardSettings?.statuses?.length > 0 ? boardSettings.statuses : DEFAULT_STATUSES;
  }, [boardSettings]);

  const PRIORITIES = useMemo(() => {
    return boardSettings?.priorities?.length > 0 ? boardSettings.priorities : DEFAULT_PRIORITIES;
  }, [boardSettings]);

  const AVAILABLE_TAGS = useMemo(() => {
    return boardSettings?.tags?.length > 0 ? boardSettings.tags : DEFAULT_TAGS;
  }, [boardSettings]);

  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('operational');
  const [status, setStatus] = useState(initialStatus);
  const [dueDate, setDueDate] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('0');
  const [priority, setPriority] = useState('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    workspaceUsersAPI.getAll().then(res => {
      if (res.data.success) setAssigneeUsers(res.data.data);
    }).catch(() => {});
    return () => setMounted(false);
  }, []);

  // Subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  // Tags
  const [tags, setTags] = useState([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState([]);

  // Dropdowns
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showCalendar, setShowCalendar] = useState(null);

  // Assignee search
  const [assignee, setAssignee] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeUsers, setAssigneeUsers] = useState([]);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState('');

  // Transform tags to match expected format (name instead of label)
  const predefinedTags = useMemo(() => {
    return AVAILABLE_TAGS.map(tag => ({
      name: tag.name || tag.label,
      color: tag.color
    }));
  }, [AVAILABLE_TAGS]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload attachments first if any
      const uploadedAttachments = [];
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.file) {
            const formData = new FormData();
            formData.append('file', attachment.file);
            const res = await uploadAPI.uploadFile(formData);
            if (res.data.success) {
              let normalizedType = 'file';
              if (attachment.type.startsWith('image/')) normalizedType = 'image';
              else if (attachment.type.includes('pdf')) normalizedType = 'pdf';
              else if (attachment.type.includes('word') || attachment.type.includes('document')) normalizedType = 'word';
              else if (attachment.type.includes('video')) normalizedType = 'video';
              else if (attachment.type.includes('audio')) normalizedType = 'audio';

              uploadedAttachments.push({
                name: attachment.name,
                url: res.data.url,
                type: normalizedType,
                size: attachment.size,
                uploadedBy: user?._id,
                uploadedAt: new Date()
              });
            }
          }
        }
      }

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        status,
        priority: priority === 'none' ? 'medium' : priority,
        labels: [
          { name: TYPES.find(t => t.id === type)?.label || type, color: TYPES.find(t => t.id === type)?.color || '#6b7280' },
          ...tags.map(t => ({ name: t.name, color: t.color }))
        ],
        dueDate: dueDate || undefined,
        scheduledDate: scheduleDate || undefined,
        subtasks: subtasks.map(s => ({ title: s.title, completed: false })),
        attachments: uploadedAttachments,
        ...(sidebarList ? { sidebarList } : {}),
        ...(assignee ? { assignee } : {}),
      };

      const response = await workspaceTasksAPI.create(boardId, taskData);

      if (response.data.success) {
        onCreated(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Subtask handlers
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, { id: Date.now(), title: newSubtask.trim(), assignee: null }]);
      setNewSubtask('');
      // Keep input focused for adding more subtasks
      setTimeout(() => {
        subtaskInputRef.current?.focus();
      }, 0);
    }
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  // Tag handlers
  const handleAddTag = (tag) => {
    if (!tags.find(t => t.name === tag.name)) {
      setTags([...tags, tag]);
    }
    setShowTagPicker(false);
    setTagSearch('');
  };

  const handleCreateTag = () => {
    if (tagSearch.trim() && !tags.find(t => t.name.toLowerCase() === tagSearch.toLowerCase())) {
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setTags([...tags, { name: tagSearch.trim(), color: randomColor }]);
      setTagSearch('');
      setShowTagPicker(false);
    }
  };

  const handleRemoveTag = (name) => {
    setTags(tags.filter(t => t.name !== name));
  };

  // File handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return { bg: '#dbeafe', color: '#3b82f6', text: 'IMG' };
    if (type?.includes('pdf')) return { bg: '#fee2e2', color: '#ef4444', text: 'PDF' };
    if (type?.includes('word') || type?.includes('document')) return { bg: '#dbeafe', color: '#3b82f6', text: 'DOC' };
    if (type?.includes('sheet') || type?.includes('excel')) return { bg: '#dcfce7', color: '#22c55e', text: 'XLS' };
    return { bg: '#2a2b2d', color: '#6b7280', text: 'FILE' };
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredTags = predefinedTags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !tags.find(existing => existing.name === t.name)
  );

  // Custom time handler
  const handleCustomTimeSubmit = () => {
    if (customTimeInput.trim()) {
      // Parse hh:mm format
      const parts = customTimeInput.split(':');
      if (parts.length === 2) {
        const hours = parseInt(parts[0]) || 0;
        const mins = parseInt(parts[1]) || 0;
        const totalMins = (hours * 60) + mins;
        setEstimatedTime(totalMins.toString());
      }
      setShowCustomTime(false);
      setOpenDropdown(null);
    }
  };

  const formatEstimatedTime = (val) => {
    const mins = parseInt(val) || 0;
    if (mins === 0) return '0h';
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins} min`;
    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}m`;
  };

  // Close dropdowns when clicking outside
  const handleModalClick = (e) => {
    // Close dropdowns if clicking outside
    if (openDropdown) setOpenDropdown(null);
    if (showCalendar) setShowCalendar(null);
    if (showCustomTime) setShowCustomTime(false);
    if (showTagPicker) setShowTagPicker(false);
  };

  // Calendar Component
  const CalendarPicker = ({ value, onChange, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days = [];

      // Start from Monday (1) instead of Sunday (0)
      let startDay = firstDay.getDay();
      startDay = startDay === 0 ? 6 : startDay - 1; // Convert to Monday start

      for (let i = 0; i < startDay; i++) {
        days.push(null);
      }

      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }

      return days;
    };

    const days = getDaysInMonth(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get next month days
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const nextMonthDays = getDaysInMonth(nextMonth).slice(0, 21); // First 3 weeks

    return (
      <div
        style={{
          position: 'fixed',
          top: '80px',
          right: '320px',
          backgroundColor: '#2a2b2d',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          padding: '12px',
          zIndex: 9999,
          width: '220px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
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

        {/* Day Headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '11px', color: i >= 5 ? '#9ca3af' : '#6b7280', fontWeight: '500', padding: '4px 0' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Current Month Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontWeight: '600', color: '#f1f1f1', fontSize: '13px' }}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#6b7280' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#6b7280' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Current Month Days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '12px' }}>
          {days.map((day, i) => {
            if (!day) return <div key={i} style={{ width: '28px', height: '28px' }} />;

            const isToday = day.toDateString() === today.toDateString();
            const isSelected = value && new Date(value).toDateString() === day.toDateString();
            // Use local date format to avoid timezone issues
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, '0');
            const dayNum = String(day.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${dayNum}`;
            // Check if date is in the past (before today)
            const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <button
                key={i}
                type="button"
                disabled={isPast}
                onClick={() => {
                  if (!isPast) {
                    onChange(dateStr);
                    onClose();
                  }
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isSelected ? '#6f6e6f' : 'transparent',
                  color: isSelected ? '#fff' : isPast ? '#424244' : '#374151',
                  cursor: isPast ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: isToday || isSelected ? '600' : '400',
                  margin: '0 auto',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isPast && !isSelected) {
                    e.currentTarget.style.backgroundColor = '#333436';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Next Month Header */}
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontWeight: '600', color: '#f1f1f1', fontSize: '13px' }}>
            {nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Next Month Days (first 2-3 weeks) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '12px' }}>
          {nextMonthDays.slice(0, 17).map((day, i) => {
            if (!day) return <div key={i} style={{ width: '28px', height: '28px' }} />;

            const isSelected = value && new Date(value).toDateString() === day.toDateString();
            // Use local date format to avoid timezone issues
            const year = day.getFullYear();
            const month = String(day.getMonth() + 1).padStart(2, '0');
            const dayNum = String(day.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${dayNum}`;

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onChange(dateStr);
                  onClose();
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isSelected ? '#6f6e6f' : 'transparent',
                  color: isSelected ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: isSelected ? '600' : '400',
                  margin: '0 auto',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#333436';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div style={{ borderTop: '1px solid #333436', paddingTop: '10px' }}>
          <button
            type="button"
            onClick={() => {
              onChange(new Date().toISOString().split('T')[0]);
              onClose();
            }}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#2a2b2d',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#e5e7eb',
              cursor: 'pointer',
              marginBottom: '6px',
              fontWeight: '500',
            }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClose();
            }}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #333436',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#6b7280',
              cursor: 'pointer',
            }}
          >
            Clear date
          </button>
        </div>
      </div>
    );
  };

  // Dropdown Select Component
  const DropdownSelect = ({ id, value, options, onChange, renderOption, renderSelected, openUpward = false }) => {
    const isOpen = openDropdown === id;

    return (
      <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <div
          onClick={() => setOpenDropdown(isOpen ? null : id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: '#2a2b2d',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          {renderSelected(value)}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#9ca3af" style={{ marginLeft: 'auto' }}>
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </div>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              ...(openUpward
                ? { bottom: '100%', marginBottom: '4px' }
                : { top: '100%', marginTop: '4px' }
              ),
              left: 0,
              right: 0,
              backgroundColor: '#2a2b2d',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            {options.map((option) => (
              <div
                key={option.id || option.value}
                onClick={() => {
                  onChange(option.id || option.value);
                  setOpenDropdown(null);
                }}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  backgroundColor: (option.id || option.value) === value ? '#2a2b2d' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = (option.id || option.value) === value ? '#2a2b2d' : 'transparent'}
              >
                {renderOption(option)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Use createPortal to render modal at document body level
  // This ensures the modal is not affected by parent transforms or z-index stacking contexts
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Hide scrollbar for Chrome, Safari, Opera */}
      <style>{`
        .modal-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 99998,
        }}
        onClick={onClose}
      />
      {/* Modal */}
      <div
        className="workspace-dark"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#2a2b2d',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '900px',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          zIndex: 99999,
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleModalClick(e);
        }}
      >
        {/* Left Side - Scrollable Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333436' }}>
          {/* Header - Fixed */}
          <div
            style={{
              padding: '24px 28px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #2a2b2d',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#f1f1f1' }}>
              Create task
            </h2>
            <button
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
              </svg>
              Set repeats
            </button>
          </div>

          {/* Scrollable Form Content */}
          <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
                className="modal-scroll"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 28px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
              {error && (
                <div
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px',
                    color: '#dc2626',
                    fontSize: '14px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Task Name */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task name"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #6f6e6f',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '16px',
                  backgroundColor: '#2a2b2d',
                }}
              />

              {/* Task Description - Taller */}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Task description"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '14px',
                  border: '1px solid #333436',
                  borderRadius: '8px',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  minHeight: '180px',
                  backgroundColor: '#2a2b2d',
                  color: '#e5e7eb',
                }}
              />

              {/* Tags Display */}
              {tags.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {tags.map((tag) => (
                    <div
                      key={tag.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: tag.color + '20',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0', display: 'flex' }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons Row - Always show remaining options */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', position: 'relative' }}>
                {/* Attach File Button - Show if no attachments */}
                {attachments.length === 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#2a2b2d',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#a2a0a2',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                    </svg>
                    Attach file
                  </button>
                )}

                {/* Add Tag Button - Show if no tags and picker not open */}
                {tags.length === 0 && !showTagPicker && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTagPicker(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#2a2b2d',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#a2a0a2',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                    </svg>
                    Add tag
                  </button>
                )}

                {/* Add Tag Button with dropdown - Show if tags exist or picker open */}
                {(tags.length > 0 || showTagPicker) && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTagPicker(!showTagPicker);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        backgroundColor: showTagPicker ? '#e0e7ff' : '#2a2b2d',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: showTagPicker ? '#6f6e6f' : '#4b5563',
                        cursor: 'pointer',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
                      </svg>
                      Add tag
                    </button>

                    {showTagPicker && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: attachments.length === 0 ? '120px' : 0,
                          width: '280px',
                          backgroundColor: '#2a2b2d',
                          borderRadius: '8px',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                          padding: '12px',
                          marginTop: '8px',
                          zIndex: 50,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#9ca3af">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                          </svg>
                          <input
                            type="text"
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                            placeholder="Search or type new tag"
                            autoFocus
                            style={{
                              flex: 1,
                              border: 'none',
                              outline: 'none',
                              fontSize: '14px',
                              color: '#e5e7eb',
                            }}
                          />
                        </div>

                        {filteredTags.length > 0 ? (
                          <div>
                            {filteredTags.map((tag) => (
                              <div
                                key={tag.name}
                                onClick={() => handleAddTag(tag)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderRadius: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: tag.color }} />
                                <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{tag.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : tagSearch ? (
                          <div
                            onClick={handleCreateTag}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              fontSize: '14px',
                              color: '#6f6e6f',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            + Create "{tagSearch}"
                          </div>
                        ) : (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                            No tags yet
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Add Subtask Button - Show if no subtasks and input not open */}
                {subtasks.length === 0 && !showSubtaskInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubtaskInput(true);
                      setTimeout(() => {
                        subtaskInputRef.current?.focus();
                      }, 0);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      backgroundColor: '#2a2b2d',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#a2a0a2',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
                    </svg>
                    Add subtask
                  </button>
                )}
              </div>

              {/* Subtasks Section - Show when subtasks exist or input is open */}
              {(subtasks.length > 0 || showSubtaskInput) && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#6b7280">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>Subtasks</span>
                    {subtasks.length > 0 && (
                      <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: '#2a2b2d', padding: '2px 8px', borderRadius: '10px' }}>
                        {subtasks.length}
                      </span>
                    )}
                  </div>

                  {/* Subtask List */}
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        backgroundColor: '#1e1f21',
                        borderRadius: '6px',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ flex: 1, fontSize: '14px', color: '#e5e7eb' }}>{subtask.title}</span>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#6f6e6f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: '600',
                        }}
                      >
                        {user?.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(subtask.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px', display: 'flex' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Subtask Input */}
                  {showSubtaskInput && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <input
                        ref={subtaskInputRef}
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtask();
                          }
                        }}
                        placeholder="Subtask name"
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          fontSize: '14px',
                          border: '2px solid #6f6e6f',
                          borderRadius: '6px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.trim()}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: newSubtask.trim() ? '#22c55e' : '#333436',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: newSubtask.trim() ? '#fff' : '#9ca3af',
                          cursor: newSubtask.trim() ? 'pointer' : 'not-allowed',
                          transition: 'all 0.2s',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSubtaskInput(false); setNewSubtask(''); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px', display: 'flex' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* + Add subtask link */}
                  <button
                    type="button"
                    onClick={() => {
                      if (newSubtask.trim()) {
                        handleAddSubtask();
                      } else {
                        // Just focus the input if it's empty
                        setShowSubtaskInput(true);
                        setTimeout(() => {
                          subtaskInputRef.current?.focus();
                        }, 0);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Add subtask
                  </button>
                </div>
              )}

              {/* Attachments Section - Show when attachments exist */}
              {attachments.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#6b7280">
                      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                    </svg>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>Attachments</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {attachments.map((file) => {
                      const icon = getFileIcon(file.type);
                      return (
                        <div
                          key={file.id}
                          style={{
                            width: '100px',
                            padding: '12px',
                            backgroundColor: '#1e1f21',
                            borderRadius: '8px',
                            border: '1px solid #333436',
                            position: 'relative',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.id)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: '#2a2b2d',
                              border: '1px solid #333436',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="#6b7280">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                          </button>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '6px',
                              backgroundColor: icon.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: icon.color,
                            }}
                          >
                            {icon.text}
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '11px',
                              color: '#e5e7eb',
                              textAlign: 'center',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {file.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* + Attach file link when attachments exist */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '4px 0',
                      marginTop: '12px',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Attach file
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* Footer - Fixed */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                padding: '16px 28px',
                borderTop: '1px solid #333436',
                backgroundColor: '#2a2b2d',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#a2a0a2',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: loading || !title.trim() ? '#424244' : '#6f6e6f',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Creating...' : 'Create task'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side - Fields */}
        <div
          className="modal-scroll"
          style={{
            width: '280px',
            backgroundColor: '#1e1f21',
            padding: '24px',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Create in */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Create in
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#1e1f21', borderRadius: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#6f6e6f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#f1f1f1' }}>
                {boardName || 'Current Board'}
              </span>
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Type
            </label>
            <DropdownSelect
              id="type"
              value={type}
              options={TYPES}
              onChange={setType}
              renderSelected={(val) => {
                const t = TYPES.find(x => x.id === val) || TYPES[0];
                return (
                  <>
                    <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: t.color }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#f1f1f1' }}>{t.label}</span>
                  </>
                );
              }}
              renderOption={(opt) => (
                <>
                  <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: opt.color }} />
                  <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{opt.label}</span>
                </>
              )}
            />
          </div>

          {/* Status - Read only display */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Status
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: '#1e1f21',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: STATUSES.find(s => s.id === status)?.color || '#6b7280',
                }}
              />
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {STATUSES.find(s => s.id === status)?.label || 'Open'}
              </span>
            </div>
          </div>

          {/* Assignee - Searchable */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Assignee
            </label>
            <div
              onClick={() => setShowAssigneeSearch(!showAssigneeSearch)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: '#1e1f21',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid #333436',
              }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: selectedAssignee ? '#4a4b4d' : '#333436',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '10px', fontWeight: '600',
              }}>
                {selectedAssignee ? selectedAssignee.name?.substring(0, 2).toUpperCase() : '?'}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '500', color: selectedAssignee ? '#e5e7eb' : '#9ca3af', flex: 1 }}>
                {selectedAssignee ? selectedAssignee.name : 'Unassigned'}
              </span>
              {selectedAssignee && (
                <div onClick={(e) => { e.stopPropagation(); setSelectedAssignee(null); setAssignee(''); }}
                  style={{ cursor: 'pointer', color: '#6f6e6f', display: 'flex' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#6f6e6f'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                </div>
              )}
            </div>
            {showAssigneeSearch && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                backgroundColor: '#2a2b2d', borderRadius: '8px', border: '1px solid #3a3b3d',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 100, overflow: 'hidden',
              }}>
                <div style={{ padding: '8px', borderBottom: '1px solid #333436' }}>
                  <input
                    autoFocus
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    placeholder="Search by name..."
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid #4a4b4d', borderRadius: '6px', backgroundColor: '#1e1f21', color: '#e5e7eb', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto' }} className="hide-scrollbar">
                  {assigneeUsers.filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase())).map(u => (
                    <div key={u._id} onClick={() => { setSelectedAssignee(u); setAssignee(u._id); setShowAssigneeSearch(false); setAssigneeSearch(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#e5e7eb' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600' }}>
                        {u.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: '#6f6e6f' }}>{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div style={{ marginBottom: '20px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Schedule this task for
            </label>
            <div
              onClick={() => setShowCalendar(showCalendar === 'schedule' ? null : 'schedule')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: '#2a2b2d',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '500', color: scheduleDate ? '#111827' : '#9ca3af' }}>
                {formatDisplayDate(scheduleDate) || 'Not scheduled'}
              </span>
            </div>
            {showCalendar === 'schedule' && (
              <CalendarPicker
                value={scheduleDate}
                onChange={setScheduleDate}
                onClose={() => setShowCalendar(null)}
              />
            )}
          </div>

          {/* Estimated Time */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Estimated time
            </label>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === 'time' ? null : 'time');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: '#2a2b2d',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#f1f1f1' }}>
                {formatEstimatedTime(estimatedTime)}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#9ca3af" style={{ marginLeft: 'auto' }}>
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>

            {openDropdown === 'time' && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#2a2b2d',
                  borderRadius: '8px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  marginTop: '4px',
                  maxHeight: '250px',
                  overflow: 'auto',
                }}
              >
                {TIME_OPTIONS.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setEstimatedTime(option.value);
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      backgroundColor: option.value === estimatedTime ? '#2a2b2d' : 'transparent',
                      fontSize: '14px',
                      color: '#e5e7eb',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = option.value === estimatedTime ? '#2a2b2d' : 'transparent'}
                  >
                    {option.label}
                  </div>
                ))}

                {/* Custom Time Option */}
                <div style={{ borderTop: '1px solid #333436', padding: '8px' }}>
                  {!showCustomTime ? (
                    <div
                      onClick={() => setShowCustomTime(true)}
                      style={{
                        padding: '8px 6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#6f6e6f',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                      Custom time
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        value={customTimeInput}
                        onChange={(e) => setCustomTimeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCustomTimeSubmit()}
                        placeholder="hh:mm"
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          fontSize: '14px',
                          border: '1px solid #424244',
                          borderRadius: '6px',
                          outline: 'none',
                          width: '80px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCustomTimeSubmit}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#6f6e6f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div style={{ marginBottom: '20px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Due date
            </label>
            <div
              onClick={() => setShowCalendar(showCalendar === 'due' ? null : 'due')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                backgroundColor: '#2a2b2d',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
              </svg>
              <span style={{ fontSize: '14px', fontWeight: '500', color: dueDate ? '#111827' : '#9ca3af' }}>
                {formatDisplayDate(dueDate) || 'No due date'}
              </span>
            </div>
            {showCalendar === 'due' && (
              <CalendarPicker
                value={dueDate}
                onChange={setDueDate}
                onClose={() => setShowCalendar(null)}
              />
            )}
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Priority
            </label>
            <DropdownSelect
              id="priority"
              value={priority}
              options={PRIORITIES}
              onChange={setPriority}
              openUpward={true}
              renderSelected={(val) => {
                const p = PRIORITIES.find(x => x.id === val) || PRIORITIES[0];
                return (
                  <>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: p.color,
                      }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#f1f1f1' }}>{p.label}</span>
                  </>
                );
              }}
              renderOption={(opt) => (
                <>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: opt.color,
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#e5e7eb' }}>{opt.label}</span>
                </>
              )}
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default CreateTaskModal;
