import { useState, useEffect, useRef } from 'react';
import { workspaceTasksAPI } from '../../services/api';

const PAST_DAYS = 365;  // 1 year back
const FUTURE_DAYS = 60;
const COLUMN_WIDTH = 240;
const VISIBLE_COLUMNS = 5; // How many columns visible at once

const CalendarView = ({ boardId, boardName, boardColor }) => {
  const [tasks, setTasks] = useState([]);
  const [boardNotes, setBoardNotes] = useState([]);
  const [boardTasks, setBoardTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState([]);
  const [startIndex, setStartIndex] = useState(PAST_DAYS - 2); // Start 2 days before today
  const [hoveredCell, setHoveredCell] = useState(null);
  const [showPopup, setShowPopup] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [relatedTaskId, setRelatedTaskId] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
      const [tasksRes, notesRes] = await Promise.all([
        workspaceTasksAPI.getByBoard(boardId),
        workspaceTasksAPI.getBoardNotes(boardId)
      ]);

      if (tasksRes.data.success) {
        const regularTasks = tasksRes.data.data.filter(t => t.type !== 'note');
        setTasks(regularTasks);
        setBoardTasks(regularTasks);
      }

      if (notesRes.data.success) {
        setBoardNotes(notesRes.data.data);
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
    return tasks.filter(t => {
      const taskDueDate = t.dueDate ? new Date(t.dueDate).toDateString() : null;
      const taskScheduledDate = t.scheduledDate ? new Date(t.scheduledDate).toDateString() : null;
      return taskScheduledDate === dateStr || taskDueDate === dateStr;
    });
  };

  const getNotesForDate = (date) => {
    const dateStr = date.toDateString();
    return boardNotes.filter(n => {
      const noteDate = n.scheduledDate ? new Date(n.scheduledDate).toDateString() : null;
      return noteDate === dateStr;
    });
  };

  const handleAddClick = (date) => {
    setShowPopup({ date, dateStr: date.toDateString() });
    setNoteContent('');
    setRelatedTaskId('');
    setTaskSearchQuery('');
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
      overflow: 'hidden'
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {visibleDates.map((date, idx) => {
            const { dayNum, dayName } = formatDate(date);
            const dateTasks = getTasksForDate(date);
            const dateNotes = getNotesForDate(date);
            const today = isToday(date);
            const past = isPast(date);
            const isFirstOfMonth = date.getDate() === 1;

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
                  overflowY: 'auto'
                }}
              >
                {/* Column Content */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {/* Tasks */}
                  {dateTasks.map(task => (
                    <div
                      key={task._id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: past ? '#d1d5db' : (boardColor || '#2558BF'),
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {task.title}
                    </div>
                  ))}

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

                  {/* Empty State - Add Button */}
                  {dateTasks.length === 0 && dateNotes.length === 0 && hoveredCell === date.toDateString() && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '150px'
                    }}>
                      <button
                        onClick={() => handleAddClick(date)}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: '#fff',
                          border: '2px solid #e5e7eb',
                          color: '#6b7280',
                          cursor: 'pointer',
                          fontSize: '28px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        +
                      </button>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>
                        Add note
                      </div>
                    </div>
                  )}
                </div>

                {/* Add button when there are items */}
                {(dateTasks.length > 0 || dateNotes.length > 0) && hoveredCell === date.toDateString() && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #e5e7eb' }}>
                    <button
                      onClick={() => handleAddClick(date)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#f9fafb',
                        border: '1px dashed #d1d5db',
                        borderRadius: '8px',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      + Add note
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                Add Note - {formatDate(showPopup.date).dayNum} {formatDate(showPopup.date).dayName}
              </h3>
              <button
                onClick={() => setShowPopup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9ca3af' }}
              >
                ✕
              </button>
            </div>

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
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarView;
