import { useState, useEffect } from 'react';
import { workspaceMeetingsAPI, workspaceBoardsAPI, workspaceTasksAPI } from '../../services/api';
// import { scheduledMeetingsAPI } from '../../services/api'; // Recall.ai disabled
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import ScreenRecorder from './ScreenRecorder';

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

  // Screen recording
  const [showRecorder, setShowRecorder] = useState(false);
  const [recordingUploading, setRecordingUploading] = useState(false);

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
  }, [boardId, activeTab]);

  useEffect(() => {
    if (selectedMeeting && !selectedMeeting.summary) {
      // If summary is missing, try to fetch full details
      fetchMeetingDetails(selectedMeeting._id);
    }
  }, [selectedMeeting?._id]);

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

      // Load meetings for this board
      const params = { board: boardId };
      // For global "With Boards" tab, only show task-assigned meetings
      if (!propBoardId) {
        params.assigned = 'true';
      }
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
      const res = await workspaceMeetingsAPI.getAll({ unassigned: 'true' });
      if (res.data.success) {
        setMeetings(res.data.data);
      }
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (creating) return;

    setCreating(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('title', newMeeting.title);
      formData.append('meetingDate', newMeeting.meetingDate);
      formData.append('board', boardId);
      if (newMeeting.recording) {
        formData.append('recording', newMeeting.recording);
      }

      const res = await workspaceMeetingsAPI.create(formData, (progress) => {
        setUploadProgress(progress);
      });
      if (res.data.success) {
        setMeetings([res.data.data, ...meetings]);
        setShowCreateModal(false);
        setNewMeeting({ title: '', meetingDate: new Date().toISOString().split('T')[0], recording: null });
      }
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('Failed to create meeting: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreating(false);
      setUploadProgress(0);
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
    try {
      // Step 1: Create a new meeting
      const formData = new FormData();
      const timestamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      formData.append('title', recTitle || `Screen Recording - ${timestamp}`);
      formData.append('meetingDate', new Date().toISOString().split('T')[0]);

      // Use selected board from recorder, or current board
      const targetBoardId = recBoardId || boardId;
      if (targetBoardId) formData.append('board', targetBoardId);

      // If task is selected, assign for visibility control
      if (taskId) formData.append('assignedTask', taskId);

      // Step 2: Attach the recording blob as a file
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
      formData.append('recording', file);

      const res = await workspaceMeetingsAPI.create(formData, () => {});
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

  // Filter meetings by task
  const filteredMeetings = filterTaskId
    ? meetings.filter(m => m.assignedTask === filterTaskId || m.assignedTask?._id === filterTaskId)
    : meetings;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'uploaded': return '#8b5cf6';
      case 'completed': return '#22c55e';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getProcessingLabel = (step) => {
    switch (step) {
      case 'transcribing': return 'Transcribing voice...';
      case 'analyzing': return 'Analyzing points...';
      case 'finalizing': return 'Finalizing summary...';
      default: return 'AI is processing...';
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
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    fontWeight: '500',
    color: '#111827',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '130px',
  };

  const tabStyle = (active) => ({
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: active ? '#2558BF' : '#6b7280',
    backgroundColor: active ? '#eff6ff' : '#fff',
    border: active ? '2px solid #2558BF' : '1px solid #e5e7eb',
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
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
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
                color: '#fff',
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

        {/* Filters (only for "with board" tab or admin view) */}
        {activeTab === 'with_board' && !propBoardId && allBoards.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Board Filter */}
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

            {/* Task Filter */}
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

            {/* Clear filters */}
            {filterTaskId && (
              <button
                onClick={() => { setFilterTaskId(''); setSelectedMeeting(null); }}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Meetings List */}
        {filteredMeetings.length === 0 ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px dashed #e5e7eb',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#d1d5db" style={{ marginBottom: '16px' }}>
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>No meetings yet</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0 0' }}>
              Add a meeting recording to get started
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
            {filteredMeetings.filter(m => m && m._id).map((meeting) => (
              <div
                key={meeting._id}
                onClick={() => setSelectedMeeting(meeting)}
                style={{
                  padding: '14px 16px',
                  backgroundColor: selectedMeeting?._id === meeting._id ? '#eff6ff' : '#fff',
                  border: selectedMeeting?._id === meeting._id ? '2px solid #2558BF' : '1px solid #e5e7eb',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                      {meeting.title}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                      {formatDate(meeting.meetingDate)}
                      {meeting.duration > 0 && <span> • {meeting.duration} min</span>}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: '500',
                      borderRadius: '6px',
                      backgroundColor: getStatusColor(meeting.aiProcessingStatus || meeting.status) + '20',
                      color: getStatusColor(meeting.aiProcessingStatus || meeting.status),
                    }}
                  >
                    {meeting.aiProcessingStatus === 'processing' 
                      ? (meeting.aiProcessingStep ? getProcessingLabel(meeting.aiProcessingStep) : 'Processing...') 
                      : (meeting.summary ? 'completed' : (meeting.aiProcessingStatus === 'failed' || meeting.status === 'failed' ? 'failed' : 'pending'))}
                  </span>
                </div>
                {meeting.summary && (
                  <p style={{
                    margin: '8px 0 0',
                    fontSize: '12px',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {meeting.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meeting Detail */}
      {selectedMeeting && (
        <div style={{
          flex: 1,
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Detail Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {selectedMeeting.title}
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
                {formatDate(selectedMeeting.meetingDate)}
                {selectedMeeting.duration > 0 && <span> • {selectedMeeting.duration} min</span>}
                {selectedMeeting.recording?.fileName && (
                  <span> • {selectedMeeting.recording.fileName}</span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {selectedMeeting.recording?.url && (
                <a 
                  href={selectedMeeting.recording.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                  View Recording
                </a>
              )}
              <button
                onClick={() => handleExportPDF(selectedMeeting._id)}
                disabled={!selectedMeeting.summary}
                style={{
                  padding: '8px 14px',
                  backgroundColor: selectedMeeting.summary ? '#059669' : '#e5e7eb',
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
              {(!selectedMeeting.summary && selectedMeeting.status !== 'processing' && selectedMeeting.recording?.url) && (
                <button
                  onClick={() => handleProcessRecording(selectedMeeting._id)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
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
              {selectedMeeting.aiProcessingStatus === 'processing' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  border: '1px solid #bfdbfe',
                }}>
                  <div className="spinner" style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #bfdbfe',
                    borderTop: '2px solid #2558BF',
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
                    backgroundColor: '#fff',
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
                  backgroundColor: '#f3f4f6',
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', backgroundColor: '#f9fafb' }}>
            {/* Meeting Recording */}
            {(selectedMeeting.localRecordingPath || selectedMeeting.recording?.url) && (() => {
              const rawPath = selectedMeeting.localRecordingPath || selectedMeeting.recording?.url || '';
              const recordingUrl = rawPath.startsWith('http') ? rawPath : `${window.location.origin}${rawPath}`;

              return (
                <div style={{
                  padding: '16px 20px',
                  backgroundColor: '#fff',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Meeting Recording
                  </div>

                  {/* Recording Link — at top */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: '8px', padding: '10px 14px',
                    marginBottom: '12px',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#2558BF" style={{ flexShrink: 0 }}>
                      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                    <a
                      href={recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, fontSize: '12px', color: '#2558BF',
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
                        backgroundColor: copiedRecLink ? '#22c55e' : '#2558BF',
                        color: '#fff', border: 'none',
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

            {selectedMeeting.status === 'processing' && (
              <div style={{
                padding: '20px',
                backgroundColor: '#eff6ff',
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
                  borderTop: '2px solid #2558BF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>
                  AI is processing the recording. This may take a few minutes...
                </span>
              </div>
            )}

            {selectedMeeting.status === 'failed' && (
              <div style={{
                padding: '20px',
                backgroundColor: '#fef2f2',
                borderRadius: '10px',
                marginBottom: '20px',
                border: '1px solid #fecaca',
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                  Processing failed. Please try again or upload a different recording.
                </p>
              </div>
            )}

            {/* Document Preview Area */}
            {(selectedMeeting.summary || selectedMeeting.keyPoints?.length > 0) ? (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '40px',
                maxWidth: '800px',
                margin: '0 auto',
                minHeight: '100%',
                border: '1px solid #e5e7eb',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                {/* PDF-like Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #f3f4f6', paddingBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#111827', letterSpacing: '-0.025em' }}>
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
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Executive Summary
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '15px',
                      color: '#374151',
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
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Key Takeaways
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '24px', listStyleType: 'disc' }}>
                      {selectedMeeting.keyPoints.map((point, idx) => (
                        <li key={idx} style={{ fontSize: '15px', color: '#374151', marginBottom: '10px', lineHeight: '1.5' }}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items Section */}
                {selectedMeeting.actionItems?.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            backgroundColor: item.completed ? '#f0fdf4' : '#fff',
                            border: `1px solid ${item.completed ? '#bbf7d0' : '#e5e7eb'}`,
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
                            border: `2px solid ${item.completed ? '#22c55e' : '#d1d5db'}`,
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
                              color: item.completed ? '#6b7280' : '#111827',
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
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            backgroundColor: '#fffbeb',
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
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            backgroundColor: '#f3f4f6',
                            borderRadius: '20px',
                            fontSize: '13.5px',
                            color: '#374151',
                            fontWeight: '500',
                            border: '1px solid #e5e7eb',
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
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '32px' }}>
                    <h4 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Full Transcript
                    </h4>
                    <div style={{
                      padding: '24px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '12px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      border: '1px solid #f3f4f6',
                    }}>
                      <pre style={{
                        margin: 0,
                        fontSize: '13.5px',
                        color: '#4b5563',
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

      {/* Screen Recorder Modal */}
      {showRecorder && (
        <ScreenRecorder
          onRecordingComplete={handleScreenRecordingComplete}
          onClose={() => setShowRecorder(false)}
        />
      )}

      {/* Uploading Overlay */}
      {recordingUploading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', padding: '32px 40px',
            textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          }}>
            <div style={{
              width: '40px', height: '40px', margin: '0 auto 16px',
              border: '4px solid #e5e7eb', borderTop: '4px solid #2558BF',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
            }} />
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Saving Recording...
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Uploading recording to server
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
