import { useState, useEffect } from 'react';
import { workspaceMeetingsAPI, workspaceBoardsAPI, workspaceTasksAPI } from '../../services/api';
// import { scheduledMeetingsAPI } from '../../services/api'; // Recall.ai disabled
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import ScreenRecorder from './ScreenRecorder';

const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'Custom Range', value: 'custom' },
];

const MeetingsView = ({ boardId: propBoardId, boardName: propBoardName }) => {
  const { isSuperAdmin } = useWorkspaceAuth();
  const [boardId, setBoardId] = useState(propBoardId);
  const [boardName, setBoardName] = useState(propBoardName);
  const [allBoards, setAllBoards] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [processing, setProcessing] = useState({});
  const [copiedRecLink, setCopiedRecLink] = useState(false);

  // Filter state
  const [filterTaskId, setFilterTaskId] = useState('');
  const [boardTasks, setBoardTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Super admin tabs: 'with_board' | 'without_board'
  const [activeTab, setActiveTab] = useState('with_board');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Date range filter
  const [datePreset, setDatePreset] = useState('all');
  const [localDateFrom, setLocalDateFrom] = useState('');
  const [localDateTo, setLocalDateTo] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const hasUnappliedCustomDates = datePreset === 'custom' && (localDateFrom !== dateFrom || localDateTo !== dateTo);

  const fmtDate = (d) => d.toISOString().split('T')[0];

  const applyPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();
    if (preset === 'all') {
      setDateFrom(''); setDateTo('');
      setLocalDateFrom(''); setLocalDateTo('');
    } else if (preset === 'today') {
      const t = fmtDate(today);
      setDateFrom(t); setDateTo(t);
    } else if (preset === 'week') {
      const day = today.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday start
      const mon = new Date(today); mon.setDate(today.getDate() + diff);
      setDateFrom(fmtDate(mon)); setDateTo(fmtDate(today));
    } else if (preset === 'month') {
      setDateFrom(fmtDate(new Date(today.getFullYear(), today.getMonth(), 1)));
      setDateTo(fmtDate(today));
    } else if (preset === 'last30') {
      const s = new Date(today); s.setDate(today.getDate() - 30);
      setDateFrom(fmtDate(s)); setDateTo(fmtDate(today));
    }
    // 'custom' — wait for explicit Apply click
  };

  const applyCustomDates = () => {
    setDateFrom(localDateFrom);
    setDateTo(localDateTo);
  };

  const clearAllFilters = () => {
    setFilterTaskId('');
    setLocalDateFrom(''); setLocalDateTo('');
    setDateFrom(''); setDateTo('');
    setDatePreset('all');
    setSelectedMeeting(null);
  };

  // Inline title edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');

  // Convert to task modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertTaskTitle, setConvertTaskTitle] = useState('');
  const [convertBoardId, setConvertBoardId] = useState('');
  const [convertingTask, setConvertingTask] = useState(false);

  // Screen recording
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingUploading, setRecordingUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load all boards
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const res = await workspaceBoardsAPI.getAll();
        if (res.data.success && res.data.data.length > 0) {
          setAllBoards(res.data.data);
          if (!propBoardId) {
            setBoardId(res.data.data[0]._id);
            setBoardName(res.data.data[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load boards:', err);
      }
    };
    loadBoards();
  }, [propBoardId]);

  // Load tasks when board changes
  useEffect(() => {
    if (!boardId || propBoardId) return; // skip if board-specific view
    setFilterTaskId('');
    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await workspaceTasksAPI.getByBoard(boardId);
        if (res.data.success) {
          setBoardTasks(res.data.data.filter(t => t.type !== 'note'));
        }
      } catch (err) {
        setBoardTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    loadTasks();
  }, [boardId, propBoardId]);

  // Load meetings
  useEffect(() => {
    if (propBoardId) {
      loadMeetings();
    } else if (activeTab === 'without_board') {
      loadUnassignedMeetings();
    } else {
      if (!boardId) return;
      loadMeetings();
    }
  }, [boardId, activeTab, dateFrom, dateTo]);

  useEffect(() => {
    if (selectedMeeting && !selectedMeeting.summary) {
      // If summary is missing, try to fetch full details
      fetchMeetingDetails(selectedMeeting._id);
    }
  }, [selectedMeeting?._id]);

  // Auto-poll every 5s while any meeting is processing
  const isAnyProcessing = meetings.some(m => m.aiProcessingStatus === 'processing');

  useEffect(() => {
    if (!isAnyProcessing) return;
    const interval = setInterval(async () => {
      try {
        const params = activeTab === 'without_board'
          ? { unassigned: 'true' }
          : { board: propBoardId || boardId };
        if (dateFrom) params.startDate = dateFrom;
        if (dateTo) params.endDate = dateTo;
        const res = await workspaceMeetingsAPI.getAll(params);
        if (res.data.success) {
          setMeetings(res.data.data);
          setSelectedMeeting(prev => {
            if (!prev) return prev;
            return res.data.data.find(m => m._id === prev._id) || prev;
          });
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [isAnyProcessing, boardId, activeTab, dateFrom, dateTo]);

  const fetchMeetingDetails = async (meetingId) => {
    try {
      const res = await workspaceMeetingsAPI.getOne(meetingId);
      if (res.data.success) {
        // Update both the list and the selected meeting
        setMeetings(prev => prev.map(m => m._id === meetingId ? res.data.data : m));
        setSelectedMeeting(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch meeting details:', error);
    }
  };

  const loadMeetings = async () => {
    setLoading(true);
    try {
      // Recall.ai sync disabled — using screen recording now
      // try {
      //   await scheduledMeetingsAPI.syncAll(boardId);
      // } catch (syncError) {}

      // Load all meetings for this board (with or without task assignment)
      const params = { board: boardId };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const res = await workspaceMeetingsAPI.getAll(params);
      if (res.data.success) {
        setMeetings(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnassignedMeetings = async () => {
    setLoading(true);
    try {
      // Load meetings that have no task assignment (legacy/unassigned)
      const params = { unassigned: 'true' };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const res = await workspaceMeetingsAPI.getAll(params);
      if (res.data.success) {
        setMeetings(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleProcessRecording = async (meetingId) => {
    setProcessing({ ...processing, [meetingId]: true });
    try {
      const res = await workspaceMeetingsAPI.processRecording(meetingId);
      if (res.data.success && res.data.data) {
        setMeetings(meetings.map(m => m._id === meetingId ? res.data.data : m));
        if (selectedMeeting?._id === meetingId) {
          setSelectedMeeting(res.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      alert('Failed to process recording. Please try again.');
    } finally {
      setProcessing({ ...processing, [meetingId]: false });
    }
  };

  const handleToggleActionItem = async (meetingId, itemIndex) => {
    try {
      const res = await workspaceMeetingsAPI.toggleActionItem(meetingId, itemIndex);
      if (res.data.success) {
        setMeetings(meetings.map(m => m._id === meetingId ? res.data.data : m));
        if (selectedMeeting?._id === meetingId) {
          setSelectedMeeting(res.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to toggle action item:', error);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await workspaceMeetingsAPI.delete(meetingId);
      setMeetings(meetings.filter(m => m._id !== meetingId));
      if (selectedMeeting?._id === meetingId) {
        setSelectedMeeting(null);
      }
    } catch (error) {
      console.error('Failed to delete meeting:', error);
      alert('Failed to delete meeting');
    }
  };

  const saveTitle = async () => {
    setEditingTitle(false);
    if (!titleInput.trim() || titleInput.trim() === selectedMeeting.title) return;
    try {
      const res = await workspaceMeetingsAPI.update(selectedMeeting._id, { title: titleInput.trim() });
      if (res.data.success) {
        const updated = { ...selectedMeeting, title: titleInput.trim() };
        setMeetings(prev => prev.map(m => m._id === selectedMeeting._id ? updated : m));
        setSelectedMeeting(updated);
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const handleConvertToTask = async () => {
    if (!convertTaskTitle.trim() || !convertBoardId) return;
    setConvertingTask(true);
    try {
      const actionItemsText = selectedMeeting.actionItems?.length > 0
        ? '\n\nAction Items:\n' + selectedMeeting.actionItems.map(ai => `• ${ai.task}${ai.assignee ? ` (${ai.assignee})` : ''}`).join('\n')
        : '';
      const description = (selectedMeeting.summary || '') + actionItemsText;
      const res = await workspaceTasksAPI.create(convertBoardId, {
        title: convertTaskTitle.trim(),
        description,
        type: 'task',
      });
      if (res.data.success) {
        setShowConvertModal(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setConvertingTask(false);
    }
  };

  const handleExportPDF = async (meetingId) => {
    try {
      const res = await workspaceMeetingsAPI.exportPDF(meetingId);
      // Create blob URL and download
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meeting-${meetingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    }
  };

  // Handle screen recording complete — create meeting with optional board/task assignment
  const handleScreenRecordingComplete = async (blob, { title: recTitle, boardId: recBoardId, taskId } = {}) => {
    setRecordingUploading(true);
    setUploadProgress(0);
    try {
      // Step 1: Create a new meeting
      const formData = new FormData();
      const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      formData.append('title', recTitle || `Screen Recording - ${timestamp}`);
      formData.append('meetingDate', new Date().toISOString().split('T')[0]);

      // Only use board if user explicitly assigned one in the recorder
      if (recBoardId) formData.append('board', recBoardId);

      // If task is selected, assign for visibility control
      if (taskId) formData.append('assignedTask', taskId);

      // Step 2: Attach the recording blob as a file
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
      formData.append('recording', file);

      const res = await workspaceMeetingsAPI.create(formData, (percent) => setUploadProgress(percent));
      if (res.data.success) {
        const newMeeting = res.data.data;
        setMeetings(prev => [newMeeting, ...prev]);
        setShowRecorder(false);
        setSelectedMeeting(newMeeting);
      }
    } catch (error) {
      console.error('Failed to save recording:', error);
      alert('Failed to save recording: ' + (error.response?.data?.message || error.message));
    } finally {
      setRecordingUploading(false);
    }
  };

  // Filter meetings by task + search query
  const filteredMeetings = meetings
    .filter(m => !filterTaskId || m.assignedTask === filterTaskId || m.assignedTask?._id === filterTaskId)
    .filter(m => !searchQuery.trim() || m.title?.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#6b7280';
      case 'uploaded': return '#8b5cf6';
      case 'processing': return '#3b82f6';
      case 'completed': return '#22c55e';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (meeting) => {
    if (meeting.summary) return 'completed';
    if (meeting.aiProcessingStatus === 'processing') {
      return meeting.aiProcessingStep ? getProcessingLabel(meeting.aiProcessingStep) : 'Processing...';
    }
    // If recording exists, always show uploaded even if AI failed
    if (meeting.recording?.url || meeting.localRecordingPath) return 'uploaded';
    if (meeting.aiProcessingStatus === 'failed' || meeting.status === 'failed') return 'failed';
    return 'pending';
  };

  const getProcessingLabel = (step) => {
    switch (step) {
      case 'transcribing': return 'Transcribing voice...';
      case 'analyzing': return 'Analyzing points...';
      case 'finalizing': return 'Finalizing summary...';
      default: return 'AI is processing...';
    }
  };

  const getCardProcessingLabel = (step) => {
    switch (step) {
      case 'transcribing': return 'Transcribing...';
      case 'analyzing': return 'Analyzing...';
      case 'finalizing': return 'Finalizing...';
      default: return 'Processing...';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
        Loading meetings...
      </div>
    );
  }

  const filterSelectStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #333436',
    fontSize: '13px',
    fontWeight: '500',
    color: '#f1f1f1',
    backgroundColor: '#252628',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '130px',
  };

  const tabStyle = (active) => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: active ? '#f1f1f1' : '#a2a0a2',
    backgroundColor: active ? '#3a3b3d' : 'transparent',
    border: active ? '1px solid #4a4b4d' : '1px solid #333436',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ padding: '24px', display: 'flex', gap: '24px', height: 'calc(100vh - 48px)' }}>
      {/* Meetings List */}
      <div style={{ width: selectedMeeting ? '320px' : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#f1f1f1' }}>
              Meeting Notes
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              {filteredMeetings.length} meeting{filteredMeetings.length !== 1 ? 's' : ''}
              {activeTab === 'with_board' && boardName ? ` in ${boardName}` : ''}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              className="rec-meeting-btn"
              onClick={() => setShowRecorder(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: '#1e1f21',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="6"/>
              </svg>
              Record Meeting
            </button>
          )}
        </div>

        {/* Super Admin Tabs */}
        {!propBoardId && isSuperAdmin && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => { setActiveTab('with_board'); setSelectedMeeting(null); }}
              style={tabStyle(activeTab === 'with_board')}
            >
              With Boards
            </button>
            <button
              onClick={() => { setActiveTab('without_board'); setSelectedMeeting(null); setFilterTaskId(''); }}
              style={tabStyle(activeTab === 'without_board')}
            >
              Without Boards
            </button>
          </div>
        )}

        {/* Filters */}
        {!propBoardId && isSuperAdmin && (
          <div style={{ marginBottom: '16px' }}>
            {/* Board + Task — only on "With Boards" tab */}
            {activeTab === 'with_board' && allBoards.length > 0 && (
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Board</label>
                  <select
                    value={boardId || ''}
                    onChange={(e) => {
                      const selected = allBoards.find(b => b._id === e.target.value);
                      setBoardId(e.target.value);
                      setBoardName(selected?.name || '');
                      setSelectedMeeting(null);
                      setFilterTaskId('');
                    }}
                    style={filterSelectStyle}
                  >
                    {allBoards.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Task</label>
                  <select
                    value={filterTaskId}
                    onChange={(e) => { setFilterTaskId(e.target.value); setSelectedMeeting(null); }}
                    style={filterSelectStyle}
                    disabled={loadingTasks}
                  >
                    <option value="">All Tasks</option>
                    {boardTasks.map(t => (
                      <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Date preset pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {DATE_PRESETS.map(p => {
                const active = datePreset === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => applyPreset(p.value)}
                    style={{
                      padding: '5px 13px',
                      fontSize: '12px',
                      fontWeight: active ? '600' : '500',
                      borderRadius: '20px',
                      border: active ? '1px solid #6366f1' : '1px solid #333436',
                      backgroundColor: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                      color: active ? '#818cf8' : '#9ca3af',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}

              {/* Reset — only if any non-default filter active */}
              {(filterTaskId || datePreset !== 'all') && (
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: '5px 12px', fontSize: '12px', fontWeight: '500',
                    borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)',
                    backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171',
                    cursor: 'pointer',
                  }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Custom date inputs — only shown when "Custom Range" is selected */}
            {datePreset === 'custom' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>From</label>
                  <input
                    type="date"
                    value={localDateFrom}
                    onChange={(e) => setLocalDateFrom(e.target.value)}
                    style={{ ...filterSelectStyle, colorScheme: 'dark' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>To</label>
                  <input
                    type="date"
                    value={localDateTo}
                    onChange={(e) => setLocalDateTo(e.target.value)}
                    style={{ ...filterSelectStyle, colorScheme: 'dark' }}
                  />
                </div>
                {hasUnappliedCustomDates && (
                  <button
                    onClick={applyCustomDates}
                    style={{
                      padding: '7px 16px', fontSize: '12px', fontWeight: '600',
                      color: '#fff', backgroundColor: '#6366f1',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      boxShadow: '0 0 0 3px rgba(99,102,241,0.25)',
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#6b7280" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings..."
            style={{
              width: '100%', padding: '8px 32px 8px 30px',
              borderRadius: '8px', border: '1px solid #2e2f31',
              backgroundColor: '#1e1f21', color: '#e5e7eb',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#4b4c4f'}
            onBlur={e => e.target.style.borderColor = '#2e2f31'}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{
              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#6b7280',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>

        {/* Meetings List */}
        {filteredMeetings.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#252628',
            borderRadius: '12px',
            border: '1px dashed #333436',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#424244" style={{ marginBottom: '16px' }}>
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No meetings yet</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0' }}>
              Add a meeting recording to get started
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            {filteredMeetings.filter(m => m && m._id).map((meeting) => {
              const statusLabel = getStatusLabel(meeting);
              const statusColor = getStatusColor(statusLabel);
              const isSelected = selectedMeeting?._id === meeting._id;
              return (
                <div
                  key={meeting._id}
                  onClick={() => setSelectedMeeting(meeting)}
                  style={{
                    padding: '12px 14px 12px 16px',
                    backgroundColor: isSelected ? '#313234' : '#252628',
                    border: `1px solid ${isSelected ? '#4b4c4f' : '#2e2f31'}`,
                    borderLeft: `3px solid ${isSelected ? statusColor : statusColor + '80'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#2d2e30'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#252628'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        margin: 0, fontSize: '13px', fontWeight: '600', color: '#e5e7eb',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {meeting.title}
                      </h4>
                      <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#6b7280' }}>
                        {formatDate(meeting.meetingDate)}
                        {meeting.duration > 0 && <span> · {meeting.duration} min</span>}
                      </p>
                    </div>
                    {/* Status badge */}
                    {meeting.aiProcessingStatus === 'processing' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                        <div className="processing-dot" />
                        <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {getCardProcessingLabel(meeting.aiProcessingStep)}
                        </span>
                      </div>
                    ) : (
                      <span style={{
                        flexShrink: 0,
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        borderRadius: '20px',
                        backgroundColor: statusColor + '22',
                        color: statusColor,
                        border: `1px solid ${statusColor}55`,
                        letterSpacing: '0.2px',
                        textTransform: 'capitalize',
                      }}>
                        {statusLabel}
                      </span>
                    )}
                  </div>
                  {meeting.summary && (
                    <p style={{
                      margin: '6px 0 0',
                      fontSize: '11px',
                      color: '#9ca3af',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {meeting.summary}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Meeting Detail */}
      {selectedMeeting && (
        <div style={{
          flex: 1,
          backgroundColor: '#2a2b2d',
          borderRadius: '12px',
          border: '1px solid #333436',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Detail Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #333436',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  onBlur={saveTitle}
                  style={{
                    width: '100%', fontSize: '18px', fontWeight: '600', color: '#f1f1f1',
                    backgroundColor: '#1e1f21', border: '1px solid #6366f1',
                    borderRadius: '6px', padding: '4px 10px', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              ) : (
                <h3
                  onClick={() => { setTitleInput(selectedMeeting.title); setEditingTitle(true); }}
                  title="Click to rename"
                  style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f1f1f1', cursor: 'text', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {selectedMeeting.title}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#4b4c4f" style={{ flexShrink: 0 }}>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </h3>
              )}
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {formatDate(selectedMeeting.meetingDate)}
                {selectedMeeting.duration > 0 && <span> • {selectedMeeting.duration} min</span>}
                {selectedMeeting.recording?.fileName && (
                  <span> • {selectedMeeting.recording.fileName}</span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              {(() => {
                const rawPath = selectedMeeting.localRecordingPath || selectedMeeting.recording?.url || '';
                const recUrl = rawPath.startsWith('http') ? rawPath : `${window.location.origin}${rawPath}`;
                return rawPath ? (
                  <a
                    href={recUrl}
                    download={selectedMeeting.recording?.fileName || 'recording.webm'}
                    style={{
                      padding: '8px 14px', backgroundColor: '#2a2b2d', color: '#e5e7eb',
                      border: '1px solid #333436', borderRadius: '8px', fontSize: '13px',
                      fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Download
                  </a>
                ) : null;
              })()}
              {selectedMeeting.summary && (
                <button
                  onClick={() => {
                    setConvertTaskTitle(selectedMeeting.title);
                    setConvertBoardId(boardId || allBoards[0]?._id || '');
                    setShowConvertModal(true);
                  }}
                  style={{
                    padding: '8px 14px', backgroundColor: '#7c3aed', color: '#fff',
                    border: 'none', borderRadius: '8px', fontSize: '13px',
                    fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                  </svg>
                  Convert to Task
                </button>
              )}
              <button
                onClick={() => handleExportPDF(selectedMeeting._id)}
                disabled={!selectedMeeting.summary}
                style={{
                  padding: '8px 14px',
                  backgroundColor: selectedMeeting.summary ? '#059669' : '#333436',
                  color: selectedMeeting.summary ? '#fff' : '#9ca3af',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: selectedMeeting.summary ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                </svg>
                Export PDF
              </button>
              {(!selectedMeeting.summary && selectedMeeting.recording?.url && selectedMeeting.aiProcessingStatus !== 'processing') && (
                <button
                  onClick={() => handleProcessRecording(selectedMeeting._id)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#3b82f6',
                    color: '#1e1f21',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z"/>
                  </svg>
                  Process with AI
                </button>
              )}
              {selectedMeeting.aiProcessingStatus === 'processing' && selectedMeeting.status !== 'failed' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#3a3b3d',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                }}>
                  <div className="spinner" style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #bfdbfe',
                    borderTop: '2px solid #6f6e6f',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500' }}>
                    {getProcessingLabel(selectedMeeting.aiProcessingStep)}
                  </span>
                </div>
              )}
              {isSuperAdmin && (
                <button
                  onClick={() => handleDeleteMeeting(selectedMeeting._id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#2a2b2d',
                    color: '#dc2626',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setSelectedMeeting(null)}
                style={{
                  padding: '8px',
                  backgroundColor: '#2a2b2d',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#6b7280">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Detail Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', backgroundColor: '#252628' }}>
            {/* Meeting Recording */}
            {(selectedMeeting.localRecordingPath || selectedMeeting.recording?.url) && (() => {
              const rawPath = selectedMeeting.localRecordingPath || selectedMeeting.recording?.url || '';
              const recordingUrl = rawPath.startsWith('http') ? rawPath : `${window.location.origin}${rawPath}`;

              return (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#2a2b2d',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  border: '1px solid #333436',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Meeting Recording
                  </div>

                  {/* Recording Link — at top */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    backgroundColor: '#252628', border: '1px solid #333436',
                    borderRadius: '8px', padding: '10px 14px',
                    marginBottom: '12px',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#6f6e6f" style={{ flexShrink: 0 }}>
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                    <a
                      href={recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, fontSize: '12px', color: '#6f6e6f',
                        minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: 'none',
                      }}
                      title={recordingUrl}
                    >
                      {recordingUrl}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(recordingUrl);
                        setCopiedRecLink(true);
                        setTimeout(() => setCopiedRecLink(false), 2000);
                      }}
                      style={{
                        padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: copiedRecLink ? '#22c55e' : '#6f6e6f',
                        color: '#1e1f21', border: 'none',
                        borderRadius: '6px', cursor: 'pointer', flexShrink: 0,
                        transition: 'all 0.2s',
                      }}
                    >
                      {copiedRecLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  {/* Video Player — below link */}
                  <div style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#000',
                  }}>
                    <video
                      controls
                      preload="metadata"
                      style={{ width: '100%', maxHeight: '400px', display: 'block' }}
                      src={recordingUrl}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              );
            })()}

            {selectedMeeting.aiProcessingStatus === 'processing' && (
              <div style={{
                padding: '20px',
                backgroundColor: '#3a3b3d',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #bfdbfe',
              }}>
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #bfdbfe',
                  borderTop: '2px solid #6f6e6f',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
                  AI is processing the recording. This may take a few minutes...
                </span>
              </div>
            )}

            {selectedMeeting.aiProcessingStatus === 'failed' && !selectedMeeting.summary && (
              <div style={{
                padding: '14px 20px',
                backgroundColor: 'rgba(220,38,38,0.08)',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid rgba(220,38,38,0.2)',
              }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#f87171', fontWeight: '500' }}>
                  AI processing failed. Your recording is safe — click "Process with AI" to try again.
                </p>
              </div>
            )}

            {/* Document Preview Area */}
            {(selectedMeeting.summary || selectedMeeting.keyPoints?.length > 0) ? (
              <div style={{
                backgroundColor: '#2a2b2d',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '40px',
                maxWidth: '800px',
                margin: '0 auto',
                minHeight: '100%',
                border: '1px solid #333436',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                {/* PDF-like Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #2a2b2d', paddingBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#f1f1f1', letterSpacing: '-0.025em' }}>
                    MEETING SUMMARY
                  </h2>
                  <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                    <span>Date: {formatDate(selectedMeeting.meetingDate)}</span>
                    {selectedMeeting.duration > 0 && <span>• Duration: {selectedMeeting.duration} min</span>}
                  </div>
                </div>

                {/* Summary Section */}
                {selectedMeeting.summary && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#f1f1f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Executive Summary
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '15px',
                      color: '#e5e7eb',
                      lineHeight: '1.7',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {selectedMeeting.summary}
                    </p>
                  </div>
                )}

                {/* Key Points Section */}
                {selectedMeeting.keyPoints?.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#f1f1f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Key Takeaways
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '24px', listStyleType: 'disc' }}>
                      {selectedMeeting.keyPoints.map((point, idx) => (
                        <li key={idx} style={{ fontSize: '15px', color: '#e5e7eb', marginBottom: '10px', lineHeight: '1.5' }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items Section */}
                {selectedMeeting.actionItems?.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#f1f1f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="9" x2="15" y2="9" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="11" y2="17" />
                      </svg>
                      Action Items
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedMeeting.actionItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleToggleActionItem(selectedMeeting._id, idx)}
                          style={{
                            padding: '14px 16px',
                            backgroundColor: item.completed ? 'rgba(34,197,94,0.1)' : '#252628',
                            border: `1px solid ${item.completed ? 'rgba(34,197,94,0.3)' : '#333436'}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            border: `2px solid ${item.completed ? '#22c55e' : '#424244'}`,
                            backgroundColor: item.completed ? '#22c55e' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {item.completed && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '14.5px',
                              color: item.completed ? '#6b7280' : '#e5e7eb',
                              textDecoration: item.completed ? 'line-through' : 'none',
                              fontWeight: item.completed ? '400' : '500',
                            }}>
                              {item.task}
                            </p>
                            {item.assignee && (
                              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>
                                Assigned to: <span style={{ color: '#6b7280', fontWeight: '500' }}>{item.assignee}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Decisions Section */}
                {selectedMeeting.decisions?.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#f1f1f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Key Decisions
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedMeeting.decisions.map((decision, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '14px 18px',
                            backgroundColor: '#2e2a1a',
                            border: '1px solid #fef3c7',
                            borderRadius: '10px',
                            fontSize: '14.5px',
                            color: '#92400e',
                            fontWeight: '500',
                            lineHeight: '1.5',
                            borderLeft: '4px solid #f59e0b',
                          }}
                        >
                          {decision}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Participants Section */}
                {selectedMeeting.participants?.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#f1f1f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Participants
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {selectedMeeting.participants.map((participant, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#2a2b2d',
                            borderRadius: '20px',
                            fontSize: '13.5px',
                            color: '#e5e7eb',
                            fontWeight: '500',
                            border: '1px solid #333436',
                          }}
                        >
                          {participant.name || participant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcript Section */}
                {selectedMeeting.transcript && (
                  <div style={{ borderTop: '1px solid #2a2b2d', paddingTop: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#f1f1f1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Full Transcript
                    </h4>
                    <div style={{
                      padding: '24px',
                      backgroundColor: '#252628',
                      borderRadius: '12px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      border: '1px solid #2a2b2d',
                    }}>
                      <pre style={{
                        margin: 0,
                        fontSize: '13.5px',
                        color: '#a2a0a2',
                        whiteSpace: 'pre-wrap',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineHeight: '1.8',
                      }}>
                        {selectedMeeting.transcript}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: '#9ca3af',
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px', opacity: 0.5 }}>
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
                <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No summary content available</p>
                <p style={{ fontSize: '14px', margin: '4px 0 0' }}>
                  The AI analysis content will appear here once processed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen Recorder — always mounted so floating pill stays alive during recording */}
      <ScreenRecorder
        visible={showRecorder}
        onRecordingComplete={handleScreenRecordingComplete}
        onClose={() => setShowRecorder(false)}
      />

      {/* Uploading Overlay */}
      {recordingUploading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: '#2a2b2d', borderRadius: '16px', padding: '32px 40px',
            textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            width: '320px',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⬆️</div>
            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '600', color: '#f1f1f1' }}>
              Uploading Recording...
            </p>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
              {uploadProgress < 100 ? `${uploadProgress}% complete` : 'Saving to server...'}
            </p>
            {/* Progress bar track */}
            <div style={{
              width: '100%', height: '8px',
              backgroundColor: '#333436', borderRadius: '99px', overflow: 'hidden',
            }}>
              <div style={{
                width: `${uploadProgress}%`, height: '100%',
                backgroundColor: '#6366f1',
                borderRadius: '99px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#4b5563' }}>
              Do not close this window
            </p>
          </div>
        </div>
      )}

      {/* Convert to Task Modal */}
      {showConvertModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001,
        }}>
          <div style={{
            backgroundColor: '#242526', borderRadius: '14px', border: '1px solid #333436',
            padding: '28px 32px', width: '440px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: '700', color: '#f1f1f1' }}>
              Convert to Task
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#6b7280' }}>
              Creates a task with the meeting summary and action items as description.
            </p>

            <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Task Title
            </label>
            <input
              autoFocus
              value={convertTaskTitle}
              onChange={(e) => setConvertTaskTitle(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                border: '1px solid #3a3b3d', backgroundColor: '#1e1f21',
                color: '#f1f1f1', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', marginBottom: '16px',
              }}
            />

            <label style={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Board
            </label>
            <select
              value={convertBoardId}
              onChange={(e) => setConvertBoardId(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                border: '1px solid #3a3b3d', backgroundColor: '#1e1f21',
                color: '#f1f1f1', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box', marginBottom: '24px',
              }}
            >
              {allBoards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>

            {selectedMeeting?.actionItems?.length > 0 && (
              <div style={{
                padding: '10px 14px', backgroundColor: 'rgba(99,102,241,0.08)',
                borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)',
                marginBottom: '20px', fontSize: '12px', color: '#818cf8',
              }}>
                {selectedMeeting.actionItems.length} action item{selectedMeeting.actionItems.length !== 1 ? 's' : ''} will be included in the description.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConvertModal(false)}
                style={{
                  padding: '9px 18px', fontSize: '13px', fontWeight: '500',
                  color: '#9ca3af', backgroundColor: 'transparent',
                  border: '1px solid #3a3b3d', borderRadius: '8px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToTask}
                disabled={convertingTask || !convertTaskTitle.trim() || !convertBoardId}
                style={{
                  padding: '9px 20px', fontSize: '13px', fontWeight: '600',
                  color: '#fff', backgroundColor: convertingTask ? '#5b21b6' : '#7c3aed',
                  border: 'none', borderRadius: '8px', cursor: convertingTask ? 'not-allowed' : 'pointer',
                }}
              >
                {convertingTask ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .processing-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #3b82f6;
          flex-shrink: 0;
          animation: processingPulse 1.2s ease-in-out infinite;
        }
        @keyframes processingPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(59,130,246,0.6); }
          60% { opacity: 0.75; box-shadow: 0 0 0 5px rgba(59,130,246,0); }
        }
        .rec-meeting-btn:hover {
          opacity: 0.85;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(220,38,38,0.4);
        }
        .rec-meeting-btn:active {
          transform: translateY(1px) scale(0.97);
          box-shadow: 0 1px 4px rgba(220,38,38,0.2);
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
};

export default MeetingsView;
