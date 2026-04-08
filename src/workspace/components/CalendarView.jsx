import { useState, useEffect, useRef } from 'react';
import { workspaceTasksAPI, workspaceBoardsAPI, scheduledMeetingsAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const PAST_DAYS = 365;  // 1 year back
const FUTURE_DAYS = 60;
const COLUMN_WIDTH = 240;
const VISIBLE_COLUMNS = 5; // How many columns visible at once

const CalendarView = ({ boardId: propBoardId, boardName, boardColor }) => {
  const { isSuperAdmin } = useWorkspaceAuth();
  const [boardId, setBoardId] = useState(propBoardId);
  const [allBoards, setAllBoards] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [boardNotes, setBoardNotes] = useState([]);
  const [boardTasks, setBoardTasks] = useState([]);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState([]);
  const [startIndex, setStartIndex] = useState(PAST_DAYS - 2); // Start 2 days before today
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showPopup, setShowPopup] = useState(null);
  const [popupType, setPopupType] = useState('note'); // 'note' or 'meeting'
  const [noteContent, setNoteContent] = useState('');
  const [relatedTaskId, setRelatedTaskId] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Meeting form state
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    meetingUrl: '',
    scheduledTime: '10:00',
  });

  // Task assignment state for meeting form
  const [assignToTask, setAssignToTask] = useState(false);
  const [meetingBoardSearch, setMeetingBoardSearch] = useState('');
  const [meetingSelectedBoard, setMeetingSelectedBoard] = useState(null);
  const [meetingBoardTasks, setMeetingBoardTasks] = useState([]);
  const [meetingTaskSearch, setMeetingTaskSearch] = useState('');
  const [meetingSelectedTask, setMeetingSelectedTask] = useState(null);
  const [loadingMeetingTasks, setLoadingMeetingTasks] = useState(false);

  // Load all boards (needed for task assignment dropdown and for global view)
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const res = await workspaceBoardsAPI.getAll();
        if (res.data.success && res.data.data.length > 0) {
          setAllBoards(res.data.data);
          if (!propBoardId) {
            setBoardId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to load boards:', err);
      }
    };
    loadBoards();
  }, [propBoardId]);

  useEffect(() => {
    if (!boardId) return;
    generateDates();
    loadData();
  }, [boardId]);

  const generateDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allDates = [];

    // Past dates (30 days ago to yesterday)
    for (let i = PAST_DAYS; i > 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      allDates.push(d);
    }

    // Today (index = PAST_DAYS)
    allDates.push(new Date(today));

    // Future dates
    for (let i = 1; i <= FUTURE_DAYS; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      allDates.push(d);
    }

    setDates(allDates);
    // Start with today visible (2 days before today)
    setStartIndex(Math.max(0, PAST_DAYS - 2));
  };

  const loadData = async () => {
    try {
      // Load tasks
      try {
        const tasksRes = await workspaceTasksAPI.getByBoard(boardId);
        if (tasksRes.data.success) {
          const regularTasks = tasksRes.data.data.filter(t => t.type !== 'note');
          setTasks(regularTasks);
          setBoardTasks(regularTasks);
        }
      } catch (err) {
        console.error('Failed to load tasks:', err);
      }

      // Load notes
      try {
        const notesRes = await workspaceTasksAPI.getBoardNotes(boardId);
        if (notesRes.data.success) {
          setBoardNotes(notesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
      }

      // Load scheduled meetings
      try {
        const meetingsRes = await scheduledMeetingsAPI.getAll({ board: boardId });
        if (meetingsRes.data.success) {
          setScheduledMeetings(meetingsRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load scheduled meetings:', err);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const goLeft = () => setStartIndex(prev => Math.max(0, prev - VISIBLE_COLUMNS));
  const goRight = () => setStartIndex(prev => Math.min(dates.length - VISIBLE_COLUMNS, prev + VISIBLE_COLUMNS));
  const goToToday = () => setStartIndex(Math.max(0, PAST_DAYS - 2));

  // Get visible dates based on startIndex
  const visibleDates = dates.slice(startIndex, startIndex + VISIBLE_COLUMNS);

  const filteredBoardTasks = boardTasks.filter(t =>
    t.title.toLowerCase().includes(taskSearchQuery.toLowerCase())
  );

  const getTasksForDate = (date) => {
    const dateStr = date.toDateString();
    const result = [];
    tasks.forEach(t => {
      const taskDueDate = t.dueDate ? new Date(t.dueDate).toDateString() : null;
      const taskScheduledDate = t.scheduledDate ? new Date(t.scheduledDate).toDateString() : null;
      const isStart = taskScheduledDate === dateStr;
      const isDue = taskDueDate === dateStr;

      if (isStart && isDue) {
        result.push({ ...t, _dateType: 'start_due' });
      } else if (isStart) {
        result.push({ ...t, _dateType: 'start' });
      } else if (isDue) {
        result.push({ ...t, _dateType: 'due' });
      }
    });
    return result;
  };

  const getNotesForDate = (date) => {
    const dateStr = date.toDateString();
    return boardNotes.filter(n => {
      const noteDate = n.scheduledDate ? new Date(n.scheduledDate).toDateString() : null;
      return noteDate === dateStr;
    });
  };

  const getMeetingsForDate = (date) => {
    const dateStr = date.toDateString();
    return scheduledMeetings.filter(m => {
      const meetingDate = m.scheduledAt ? new Date(m.scheduledAt).toDateString() : null;
      return meetingDate === dateStr;
    });
  };

  const handleAddClick = (date, type = 'note') => {
    setShowPopup({ date, dateStr: date.toDateString() });
    setPopupType(type);
    setNoteContent('');
    setRelatedTaskId('');
    setTaskSearchQuery('');
    setMeetingForm({
      title: '',
      description: '',
      meetingUrl: '',
      scheduledTime: '10:00',
    });
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !showPopup || !relatedTaskId) {
      if (!relatedTaskId) alert('Please select a task.');
      return;
    }

    setSaving(true);
    try {
      const response = await workspaceTasksAPI.addNote(relatedTaskId, {
        content: noteContent.trim(),
        scheduledDate: showPopup.date,
      });

      if (response.data.success) {
        // Get the task info for the new note
        const selectedTask = boardTasks.find(t => t._id === relatedTaskId);

        // Add the new note to state immediately
        const newNote = {
          _id: response.data.data.notes[response.data.data.notes.length - 1]._id,
          content: noteContent.trim(),
          scheduledDate: showPopup.date,
          createdAt: new Date(),
          task: {
            _id: relatedTaskId,
            title: selectedTask?.title || 'Task',
          },
        };

        setBoardNotes(prev => [...prev, newNote]);
        setShowPopup(null);
        setNoteContent('');
        setRelatedTaskId('');
        setTaskSearchQuery('');
      } else {
        alert('Failed to save note.');
      }
    } catch (error) {
      console.error('Save note error:', error);
      alert('Failed to save note: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (taskId, noteId) => {
    if (!window.confirm('Delete this note?')) return;

    // Optimistic update - remove from UI immediately
    const previousNotes = [...boardNotes];
    setBoardNotes(boardNotes.filter(n => n._id !== noteId));

    try {
      const response = await workspaceTasksAPI.deleteNote(taskId, noteId);
      if (!response.data.success) {
        // Revert on failure
        setBoardNotes(previousNotes);
        alert('Failed to delete note');
      }
    } catch (error) {
      // Revert on error
      setBoardNotes(previousNotes);
      console.error('Delete note error:', error);
      alert('Failed to delete note: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleMeetingBoardSelect = async (board) => {
    setMeetingSelectedBoard(board);
    setMeetingSelectedTask(null);
    setMeetingTaskSearch('');
    setLoadingMeetingTasks(true);
    try {
      const res = await workspaceTasksAPI.getByBoard(board._id);
      if (res.data.success) {
        setMeetingBoardTasks(res.data.data.filter(t => t.type !== 'note'));
      }
    } catch (err) {
      console.error('Failed to load board tasks:', err);
      setMeetingBoardTasks([]);
    } finally {
      setLoadingMeetingTasks(false);
    }
  };

  const handleSaveMeeting = async () => {
    if (!meetingForm.title.trim() || !meetingForm.meetingUrl.trim() || !showPopup) {
      alert('Please fill in meeting title and meeting link.');
      return;
    }

    // Validate URL
    const validPlatforms = ['zoom.us', 'meet.google.com', 'teams.microsoft.com', 'teams.live.com', 'webex.com'];
    const isValidUrl = validPlatforms.some(p => meetingForm.meetingUrl.toLowerCase().includes(p));
    if (!isValidUrl) {
      alert('Please enter a valid meeting link (Zoom, Google Meet, Microsoft Teams, or Webex)');
      return;
    }

    setSaving(true);
    try {
      // Combine date and time
      const scheduledDate = new Date(showPopup.date);
      const [hours, minutes] = meetingForm.scheduledTime.split(':');
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const createData = {
        title: meetingForm.title.trim(),
        description: meetingForm.description.trim(),
        meetingUrl: meetingForm.meetingUrl.trim(),
        scheduledAt: scheduledDate.toISOString(),
        board: boardId,
      };

      if (assignToTask && meetingSelectedTask) {
        createData.assignedTask = meetingSelectedTask._id;
      }

      const response = await scheduledMeetingsAPI.create(createData);

      if (response.data.success) {
        setScheduledMeetings(prev => [...prev, response.data.data]);
        setShowPopup(null);
        setMeetingForm({ title: '', description: '', meetingUrl: '', scheduledTime: '10:00' });
        setAssignToTask(false);
        setMeetingSelectedBoard(null);
        setMeetingSelectedTask(null);
        setMeetingBoardTasks([]);
        alert('Meeting scheduled! Recall.ai bot will join automatically at the scheduled time.');
      } else {
        alert('Failed to schedule meeting.');
      }
    } catch (error) {
      console.error('Save meeting error:', error);
      alert('Failed to schedule meeting: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Cancel this scheduled meeting?')) return;

    const previousMeetings = [...scheduledMeetings];
    setScheduledMeetings(scheduledMeetings.filter(m => m._id !== meetingId));

    try {
      const response = await scheduledMeetingsAPI.delete(meetingId);
      if (!response.data.success) {
        setScheduledMeetings(previousMeetings);
        alert('Failed to cancel meeting');
      }
    } catch (error) {
      setScheduledMeetings(previousMeetings);
      console.error('Delete meeting error:', error);
      alert('Failed to cancel meeting: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSyncMeeting = async (meetingId) => {
    try {
      const response = await scheduledMeetingsAPI.sync(meetingId);
      if (response.data.success) {
        // Update the meeting in local state
        setScheduledMeetings(prev => prev.map(m =>
          m._id === meetingId ? response.data.data : m
        ));

        // ========== DEBUG LOG ==========
        const meeting = response.data.data;
        console.log('\n%c🔄 MEETING SYNCED FROM RECALL.AI', 'background: #10b981; color: white; font-size: 14px; padding: 4px 12px;');
        console.table({
          'Title': meeting.title,
          'Status': meeting.botStatus,
          'Duration (sec)': meeting.recordingDuration || 'N/A',
          'Duration (min)': meeting.recordingDuration ? Math.round(meeting.recordingDuration / 60) : 'N/A',
          'Video URL': meeting.videoUrl || 'No video',
          'Recording URL': meeting.recordingUrl || 'No recording',
          'Bot Joined': meeting.botJoinedAt ? new Date(meeting.botJoinedAt).toLocaleString() : 'N/A',
          'Bot Left': meeting.botLeftAt ? new Date(meeting.botLeftAt).toLocaleString() : 'N/A',
          'Has Transcript': meeting.formattedTranscript ? 'Yes' : 'No',
        });
        // ========== END DEBUG ==========

        alert('Meeting synced successfully!');
      }
    } catch (error) {
      console.error('Sync meeting error:', error);
      alert('Failed to sync meeting: ' + (error.response?.data?.message || error.message));
    }
  };

  const getMeetingStatusColor = (status) => {
    const colors = {
      scheduled: '#8b5cf6',
      joining: '#3b82f6',
      in_waiting_room: '#f59e0b',
      in_call: '#10b981',
      recording: '#ef4444',
      call_ended: '#6b7280',
      processing: '#f59e0b',
      completed: '#10b981',
      failed: '#ef4444',
      cancelled: '#9ca3af',
    };
    return colors[status] || '#6b7280';
  };

  const getMeetingStatusLabel = (status) => {
    const labels = {
      scheduled: 'Scheduled',
      joining: 'Joining...',
      in_waiting_room: 'In Waiting Room',
      in_call: 'In Call',
      recording: '🔴 Recording',
      call_ended: 'Call Ended',
      processing: 'Processing...',
      completed: '✓ Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dayNum: date.getDate(),
      dayName: days[date.getDay()],
      month: months[date.getMonth()],
      year: date.getFullYear(),
      monthYear: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Get current month being shown
  const getCurrentMonthYear = () => {
    if (visibleDates.length > 0) {
      const middleDate = visibleDates[Math.floor(visibleDates.length / 2)];
      return formatDate(middleDate).monthYear;
    }
    return '';
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading calendar...</div>;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '0 24px 24px 24px',
      overflow: 'hidden',
      height: 'calc(100vh - 48px)'
    }}>
      {/* Main Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>

        {/* Fixed Header with Navigation */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          {/* Left: Month & Today Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              {getCurrentMonthYear()}
            </h2>
            <button
              onClick={goToToday}
              style={{
                background: '#2558BF',
                border: 'none',
                color: '#fff',
                padding: '8px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Today
            </button>
            {!propBoardId && allBoards.length > 0 && (
              <select
                value={boardId || ''}
                onChange={(e) => {
                  setBoardId(e.target.value);
                  setLoading(true);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#111827',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {allBoards.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Right: Navigation Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={goLeft}
              disabled={startIndex === 0}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                backgroundColor: startIndex === 0 ? '#f3f4f6' : '#fff',
                color: startIndex === 0 ? '#d1d5db' : '#374151',
                cursor: startIndex === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              ←
            </button>
            <button
              onClick={goRight}
              disabled={startIndex >= dates.length - VISIBLE_COLUMNS}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                backgroundColor: startIndex >= dates.length - VISIBLE_COLUMNS ? '#f3f4f6' : '#fff',
                color: startIndex >= dates.length - VISIBLE_COLUMNS ? '#d1d5db' : '#374151',
                cursor: startIndex >= dates.length - VISIBLE_COLUMNS ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              →
            </button>
          </div>
        </div>

        {/* Date Headers Row */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          flexShrink: 0
        }}>
          {visibleDates.map((date, idx) => {
            const { dayNum, dayName, month } = formatDate(date);
            const today = isToday(date);
            const past = isPast(date);
            const isFirstOfMonth = date.getDate() === 1;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  padding: '14px 8px',
                  textAlign: 'center',
                  borderRight: idx < visibleDates.length - 1 ? '1px solid #e5e7eb' : 'none',
                  borderLeft: isFirstOfMonth ? '3px solid #2558BF' : 'none',
                  backgroundColor: today ? '#2558BF' : past ? '#f3f4f6' : '#fff',
                  color: today ? '#fff' : past ? '#9ca3af' : '#374151'
                }}
              >
                {isFirstOfMonth && (
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: today ? '#bfdbfe' : '#2558BF',
                    textTransform: 'uppercase',
                    marginBottom: '2px'
                  }}>
                    {month}
                  </div>
                )}
                <div style={{ fontSize: '16px', fontWeight: today ? '700' : '600' }}>
                  {dayNum} {dayName}
                </div>
                {today && (
                  <div style={{ fontSize: '10px', color: '#bfdbfe', fontWeight: '600', marginTop: '2px' }}>
                    TODAY
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Date Columns Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {visibleDates.map((date, idx) => {
            const { dayNum, dayName } = formatDate(date);
            const dateTasks = getTasksForDate(date);
            const dateNotes = getNotesForDate(date);
            const dateMeetings = getMeetingsForDate(date);
            const today = isToday(date);
            const past = isPast(date);
            const isFirstOfMonth = date.getDate() === 1;
            const hasContent = dateTasks.length > 0 || dateNotes.length > 0 || dateMeetings.length > 0;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredCell(date.toDateString())}
                onMouseLeave={() => setHoveredCell(null)}
                style={{
                  flex: 1,
                  borderRight: idx < visibleDates.length - 1 ? '1px solid #e5e7eb' : 'none',
                  borderLeft: isFirstOfMonth ? '3px solid #2558BF' : 'none',
                  backgroundColor: today ? '#eff6ff' : past ? '#fafafa' : '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflowY: 'auto',
                  minHeight: '100%'
                }}
              >
                {/* Column Content */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {/* Scheduled Meetings */}
                  {dateMeetings.map(meeting => (
                    <div
                      key={meeting._id}
                      onClick={() => setSelectedMeetingDetail(meeting)}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#166534',
                        border: '1px solid #86efac',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>🎥 {meeting.title}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {new Date(meeting.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {isSuperAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeeting(meeting._id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#dc2626',
                              padding: '2px',
                              fontSize: '14px',
                              lineHeight: 1
                            }}
                            title="Delete meeting"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '10px',
                          color: '#fff',
                          backgroundColor: getMeetingStatusColor(meeting.botStatus),
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: '500',
                        }}>
                          {getMeetingStatusLabel(meeting.botStatus)}
                        </span>
                        {/* Sync button - shows for meetings with a recallBotId */}
                        {meeting.recallBotId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSyncMeeting(meeting._id);
                            }}
                            style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              border: 'none',
                              backgroundColor: '#3b82f6',
                              color: '#fff',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                            title="Sync recording from Recall.ai"
                          >
                            🔄 Sync
                          </button>
                        )}
                        {/* Show recording indicator if available */}
                        {(meeting.videoUrl || meeting.recordingUrl) && (
                          <span style={{
                            fontSize: '10px',
                            color: '#059669',
                            fontWeight: '500',
                          }}>
                            📹 Has Recording
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Tasks */}
                  {dateTasks.map((task, tIdx) => {
                    const dateLabel = task._dateType === 'start' ? 'Start'
                      : task._dateType === 'due' ? 'Due'
                      : task._dateType === 'start_due' ? 'Start & Due'
                      : '';
                    const labelBg = task._dateType === 'due' ? '#fbbf24'
                      : task._dateType === 'start_due' ? '#c084fc'
                      : '#86efac';
                    // Past: muted blue-grey, Current/Future: board color
                    const taskBg = past ? '#94a3b8' : (boardColor || '#2558BF');
                    return (
                      <div
                        key={`${task._id}-${task._dateType}-${tIdx}`}
                        style={{
                          padding: '10px 14px',
                          backgroundColor: taskBg,
                          borderRadius: '10px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#fff',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          opacity: past ? 0.85 : 1,
                        }}
                      >
                        <div style={{ marginBottom: '4px', fontSize: '12px', opacity: 0.85 }}>Task:</div>
                        <div style={{ marginBottom: '6px' }}>{task.title}</div>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: labelBg,
                          color: '#111827',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}>
                          {dateLabel}
                        </span>
                      </div>
                    );
                  })}

                  {/* Notes */}
                  {dateNotes.map(note => (
                    <div
                      key={note._id}
                      style={{
                        padding: '12px',
                        backgroundColor: past ? '#e7e5e4' : '#fef3c7',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: past ? '#78716c' : '#92400e',
                        border: past ? '1px solid #d6d3d1' : '1px solid #fcd34d'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ flex: 1, lineHeight: '1.4' }}>{note.content}</span>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteNote(note.task._id, note._id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#d97706',
                              padding: '2px',
                              fontSize: '14px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        color: '#2558BF',
                        backgroundColor: '#dbeafe',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        📌 {note.task.title}
                      </div>
                    </div>
                  ))}

                  {/* Empty State - Add Buttons (Super Admin only) */}
                  {isSuperAdmin && !hasContent && hoveredCell === date.toDateString() && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '150px',
                      gap: '12px'
                    }}>
                      <button
                        onClick={() => handleAddClick(date, 'meeting')}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          backgroundColor: '#10b981',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        🎥 Add Meeting
                      </button>
                      <button
                        onClick={() => handleAddClick(date, 'note')}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          backgroundColor: '#f59e0b',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        📝 Add Note
                      </button>
                    </div>
                  )}
                </div>

                {/* Add buttons when there are items (Super Admin only) */}
                {isSuperAdmin && hasContent && hoveredCell === date.toDateString() && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAddClick(date, 'meeting')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#f0fdf4',
                        border: '1px dashed #86efac',
                        borderRadius: '8px',
                        color: '#166534',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      + Meeting
                    </button>
                    <button
                      onClick={() => handleAddClick(date, 'note')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#fffbeb',
                        border: '1px dashed #fcd34d',
                        borderRadius: '8px',
                        color: '#92400e',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      + Note
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Meeting Detail Popup */}
      {selectedMeetingDetail && (
        <>
          <div
            onClick={() => { setSelectedMeetingDetail(null); setCopiedLink(false); }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#fff', borderRadius: '16px',
            padding: '28px', width: '420px', maxWidth: '90vw',
            zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {selectedMeetingDetail.title}
              </h3>
              <button
                onClick={() => { setSelectedMeetingDetail(null); setCopiedLink(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Status</span>
                <span style={{
                  fontSize: '12px', fontWeight: '600', color: '#fff',
                  backgroundColor: getMeetingStatusColor(selectedMeetingDetail.botStatus),
                  padding: '4px 10px', borderRadius: '6px',
                }}>
                  {getMeetingStatusLabel(selectedMeetingDetail.botStatus)}
                </span>
              </div>

              {/* Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Time</span>
                <span style={{ fontSize: '14px', color: '#111827' }}>
                  {new Date(selectedMeetingDetail.scheduledAt).toLocaleString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Platform */}
              {selectedMeetingDetail.platform && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Platform</span>
                  <span style={{ fontSize: '14px', color: '#111827', textTransform: 'capitalize' }}>
                    {selectedMeetingDetail.platform?.replace('_', ' ')}
                  </span>
                </div>
              )}

              {/* Assigned To */}
              {selectedMeetingDetail.visibleTo && selectedMeetingDetail.visibleTo.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', width: '80px', flexShrink: 0 }}>Assigned</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedMeetingDetail.visibleTo.map((user, i) => (
                      <span key={i} style={{
                        fontSize: '12px', backgroundColor: '#eff6ff', color: '#1e40af',
                        padding: '4px 10px', borderRadius: '6px', fontWeight: '500',
                        border: '1px solid #bfdbfe',
                      }}>
                        {user.name || user.email || user}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Created By */}
              {selectedMeetingDetail.createdBy && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', width: '80px' }}>Created by</span>
                  <span style={{ fontSize: '14px', color: '#111827' }}>
                    {selectedMeetingDetail.createdBy.name || selectedMeetingDetail.createdBy.email || 'Unknown'}
                  </span>
                </div>
              )}

              {/* Description */}
              {selectedMeetingDetail.description && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', width: '80px', flexShrink: 0 }}>Note</span>
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                    {selectedMeetingDetail.description}
                  </span>
                </div>
              )}

              {/* Meeting Link */}
              {selectedMeetingDetail.meetingUrl && (
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '8px' }}>
                    Meeting Link
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                    borderRadius: '8px', padding: '10px 12px',
                  }}>
                    <span style={{
                      flex: 1, fontSize: '13px', color: '#2558BF',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {selectedMeetingDetail.meetingUrl}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMeetingDetail.meetingUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      style={{
                        padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                        backgroundColor: copiedLink ? '#22c55e' : '#2558BF',
                        color: '#fff', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
                      }}
                    >
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Recording indicator */}
              {(selectedMeetingDetail.videoUrl || selectedMeetingDetail.recordingUrl) && (
                <div style={{
                  backgroundColor: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: '8px', padding: '10px 12px',
                  fontSize: '13px', color: '#166534', fontWeight: '500',
                }}>
                  Recording available
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showPopup && (
        <>
          <div
            onClick={() => setShowPopup(null)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            maxWidth: '500px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '24px',
            zIndex: 1001,
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Type Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setPopupType('meeting')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: popupType === 'meeting' ? '2px solid #10b981' : '1px solid #e5e7eb',
                  backgroundColor: popupType === 'meeting' ? '#f0fdf4' : '#fff',
                  color: popupType === 'meeting' ? '#166534' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                🎥 Meeting
              </button>
              <button
                onClick={() => setPopupType('note')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: popupType === 'note' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                  backgroundColor: popupType === 'note' ? '#fffbeb' : '#fff',
                  color: popupType === 'note' ? '#92400e' : '#6b7280',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                📝 Note
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {popupType === 'meeting' ? '🎥 Schedule Meeting' : '📝 Add Note'} - {formatDate(showPopup.date).dayNum} {formatDate(showPopup.date).dayName}
              </h3>
              <button
                onClick={() => setShowPopup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

            {/* Meeting Form */}
            {popupType === 'meeting' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Weekly standup, Client call, etc."
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Meeting Time *
                  </label>
                  <input
                    type="time"
                    value={meetingForm.scheduledTime}
                    onChange={(e) => setMeetingForm({ ...meetingForm, scheduledTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Meeting Link *
                  </label>
                  <input
                    type="url"
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    value={meetingForm.meetingUrl}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Supports: Zoom, Google Meet, Microsoft Teams, Webex
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Meeting agenda, topics to discuss..."
                    value={meetingForm.description}
                    onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Assign to specific task */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={assignToTask}
                      onChange={(e) => {
                        setAssignToTask(e.target.checked);
                        if (!e.target.checked) {
                          setMeetingSelectedBoard(null);
                          setMeetingSelectedTask(null);
                          setMeetingBoardTasks([]);
                          setMeetingBoardSearch('');
                          setMeetingTaskSearch('');
                        }
                      }}
                      style={{ width: '18px', height: '18px', accentColor: '#2558BF', cursor: 'pointer' }}
                    />
                    Assign meeting to a specific task
                  </label>
                  <p style={{ margin: '4px 0 0 28px', fontSize: '12px', color: '#6b7280' }}>
                    Only the task assignee and you will see this meeting
                  </p>
                </div>

                {assignToTask && (
                  <>
                    {/* Board Selector */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                        Select Board *
                      </label>
                      <input
                        type="text"
                        placeholder="Search boards..."
                        value={meetingBoardSearch}
                        onChange={(e) => setMeetingBoardSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          marginBottom: '6px',
                          boxSizing: 'border-box',
                          fontSize: '13px',
                        }}
                      />
                      <div style={{
                        maxHeight: '120px',
                        overflowY: 'auto',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}>
                        {allBoards
                          .filter(b => b.name.toLowerCase().includes(meetingBoardSearch.toLowerCase()))
                          .map(b => (
                            <div
                              key={b._id}
                              onClick={() => handleMeetingBoardSelect(b)}
                              style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                backgroundColor: meetingSelectedBoard?._id === b._id ? '#eff6ff' : '#fff',
                                borderBottom: '1px solid #f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                              }}
                              onMouseEnter={(e) => { if (meetingSelectedBoard?._id !== b._id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                              onMouseLeave={(e) => { if (meetingSelectedBoard?._id !== b._id) e.currentTarget.style.backgroundColor = '#fff'; }}
                            >
                              <div style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '4px',
                                backgroundColor: b.color || '#2558BF',
                                flexShrink: 0,
                              }} />
                              {meetingSelectedBoard?._id === b._id ? '● ' : '○ '}{b.name}
                            </div>
                          ))
                        }
                        {allBoards.filter(b => b.name.toLowerCase().includes(meetingBoardSearch.toLowerCase())).length === 0 && (
                          <div style={{ padding: '12px', color: '#9ca3af', textAlign: 'center', fontSize: '13px' }}>
                            No boards found
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Task Selector (shows after board selected) */}
                    {meetingSelectedBoard && (
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                          Select Task *
                        </label>
                        <input
                          type="text"
                          placeholder="Search tasks..."
                          value={meetingTaskSearch}
                          onChange={(e) => setMeetingTaskSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            marginBottom: '6px',
                            boxSizing: 'border-box',
                            fontSize: '13px',
                          }}
                        />
                        <div style={{
                          maxHeight: '140px',
                          overflowY: 'auto',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}>
                          {loadingMeetingTasks ? (
                            <div style={{ padding: '12px', color: '#9ca3af', textAlign: 'center', fontSize: '13px' }}>
                              Loading tasks...
                            </div>
                          ) : meetingBoardTasks
                              .filter(t => t.title.toLowerCase().includes(meetingTaskSearch.toLowerCase()))
                              .map(t => (
                                <div
                                  key={t._id}
                                  onClick={() => setMeetingSelectedTask(t)}
                                  style={{
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: meetingSelectedTask?._id === t._id ? '#eff6ff' : '#fff',
                                    borderBottom: '1px solid #f3f4f6',
                                    fontSize: '13px',
                                  }}
                                  onMouseEnter={(e) => { if (meetingSelectedTask?._id !== t._id) e.currentTarget.style.backgroundColor = '#f9fafb'; }}
                                  onMouseLeave={(e) => { if (meetingSelectedTask?._id !== t._id) e.currentTarget.style.backgroundColor = '#fff'; }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {meetingSelectedTask?._id === t._id ? '● ' : '○ '}
                                    <span>{t.title}</span>
                                  </div>
                                  {t.assignee && (
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginLeft: '18px', marginTop: '2px' }}>
                                      Assigned to: {t.assignee.name || t.assignee.email || 'Unknown'}
                                    </div>
                                  )}
                                </div>
                              ))
                          }
                          {!loadingMeetingTasks && meetingBoardTasks.filter(t => t.title.toLowerCase().includes(meetingTaskSearch.toLowerCase())).length === 0 && (
                            <div style={{ padding: '12px', color: '#9ca3af', textAlign: 'center', fontSize: '13px' }}>
                              No tasks found in this board
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selected summary */}
                    {meetingSelectedTask && (
                      <div style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#1e40af',
                      }}>
                        <strong>📌 Linked to:</strong> {meetingSelectedTask.title}
                        {meetingSelectedTask.assignee && (
                          <span> → visible to <strong>{meetingSelectedTask.assignee.name || meetingSelectedTask.assignee.email}</strong></span>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  color: '#166534'
                }}>
                  <strong>🤖 Recall.ai Bot</strong> will automatically join the meeting at the scheduled time, record it, and generate a transcript + summary.
                </div>

                <button
                  onClick={handleSaveMeeting}
                  disabled={saving || !meetingForm.title.trim() || !meetingForm.meetingUrl.trim()}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: (!meetingForm.title.trim() || !meetingForm.meetingUrl.trim()) ? '#d1d5db' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (!meetingForm.title.trim() || !meetingForm.meetingUrl.trim()) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Scheduling...' : '🎥 Schedule Meeting'}
                </button>
              </>
            )}

            {/* Note Form */}
            {popupType === 'note' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Select Task *
                  </label>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    {filteredBoardTasks.map(t => (
                      <div
                        key={t._id}
                        onClick={() => setRelatedTaskId(t._id)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          backgroundColor: relatedTaskId === t._id ? '#fef3c7' : '#fff',
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        {relatedTaskId === t._id ? '● ' : '○ '}{t.title}
                      </div>
                    ))}
                    {filteredBoardTasks.length === 0 && (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af' }}>No tasks</div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                    Note *
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Things to keep in mind..."
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      border: '1px solid #fcd34d',
                      borderRadius: '8px',
                      backgroundColor: '#fffbeb',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  onClick={handleSaveNote}
                  disabled={saving || !noteContent.trim() || !relatedTaskId}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: (!noteContent.trim() || !relatedTaskId) ? '#d1d5db' : '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (!noteContent.trim() || !relatedTaskId) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : '📝 Add Note'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarView;
