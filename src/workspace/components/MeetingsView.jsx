import { useState, useEffect } from 'react';
import { workspaceMeetingsAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const MeetingsView = ({ boardId, boardName }) => {
  const { isSuperAdmin } = useWorkspaceAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processing, setProcessing] = useState({});

  // Create meeting form
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    meetingDate: new Date().toISOString().split('T')[0],
    recording: null,
  });
  const [creating, setCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadMeetings();
  }, [boardId]);

  const loadMeetings = async () => {
    try {
      const res = await workspaceMeetingsAPI.getAll({ board: boardId });
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
      if (res.data.success) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'processing': return '#3b82f6';
      case 'uploaded': return '#8b5cf6'; // Purple for uploaded but not processed
      case 'completed': return '#22c55e';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
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

  return (
    <div style={{ padding: '24px', display: 'flex', gap: '24px', height: 'calc(100vh - 120px)' }}>
      {/* Meetings List */}
      <div style={{ width: selectedMeeting ? '320px' : '100%', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              Meeting Notes
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} in {boardName}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '8px 14px',
                backgroundColor: '#2558BF',
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
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Meeting
            </button>
          </div>
        </div>

        {/* Meetings List */}
        {meetings.length === 0 ? (
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
            {meetings.map((meeting) => (
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
                      backgroundColor: getStatusColor(meeting.status) + '20',
                      color: getStatusColor(meeting.status),
                    }}
                  >
                    {meeting.status}
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
              {selectedMeeting.status === 'pending' && selectedMeeting.recording?.url && (
                <button
                  onClick={() => handleProcessRecording(selectedMeeting._id)}
                  disabled={processing[selectedMeeting._id]}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#7c3aed',
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
                    <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7117 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0034 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92176 4.44061 8.37485 5.27072 7.03255C6.10083 5.69025 7.28825 4.60557 8.7 3.9C9.87812 3.30493 11.1801 2.99656 12.5 3H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z"/>
                  </svg>
                  {processing[selectedMeeting._id] ? 'Processing...' : 'Process with AI'}
                </button>
              )}
              {selectedMeeting.status === 'completed' && (
                <button
                  onClick={() => handleExportPDF(selectedMeeting._id)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#059669',
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
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                  Export PDF
                </button>
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {selectedMeeting.status === 'processing' && (
              <div style={{
                padding: '20px',
                backgroundColor: '#eff6ff',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div className="spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #bfdbfe',
                  borderTop: '2px solid #2558BF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                <span style={{ fontSize: '14px', color: '#1e40af' }}>
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
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#dc2626' }}>
                  Processing failed. Please try again or upload a different recording.
                </p>
              </div>
            )}

            {/* Summary */}
            {selectedMeeting.summary && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Summary
                </h4>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#4b5563',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selectedMeeting.summary}
                </p>
              </div>
            )}

            {/* Key Points */}
            {selectedMeeting.keyPoints?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Key Points
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {selectedMeeting.keyPoints.map((point, idx) => (
                    <li key={idx} style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {selectedMeeting.actionItems?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Action Items
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedMeeting.actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleActionItem(selectedMeeting._id, idx)}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: item.completed ? '#f0fdf4' : '#fff',
                        border: `1px solid ${item.completed ? '#bbf7d0' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${item.completed ? '#22c55e' : '#d1d5db'}`,
                        backgroundColor: item.completed ? '#22c55e' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {item.completed && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          margin: 0,
                          fontSize: '14px',
                          color: item.completed ? '#6b7280' : '#111827',
                          textDecoration: item.completed ? 'line-through' : 'none',
                        }}>
                          {item.task}
                        </p>
                        {item.assignee && (
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                            Assigned to: {item.assignee}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decisions */}
            {selectedMeeting.decisions?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Decisions Made
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedMeeting.decisions.map((decision, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fcd34d',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#92400e',
                      }}
                    >
                      {decision}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants */}
            {selectedMeeting.participants?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Participants
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedMeeting.participants.map((participant, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      {participant.name || participant}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transcript */}
            {selectedMeeting.transcript && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Transcript
                </h4>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}>
                  <pre style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#4b5563',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                  }}>
                    {selectedMeeting.transcript}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div
          onClick={() => setShowCreateModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Add Meeting
            </h3>
            <form onSubmit={handleCreateMeeting}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  required
                  placeholder="e.g., Client Discovery Call"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Meeting Date *
                </label>
                <input
                  type="date"
                  value={newMeeting.meetingDate}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Recording (Optional)
                </label>
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setNewMeeting({ ...newMeeting, recording: e.target.files[0] })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  Upload MP3, MP4, WAV, or WebM file
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: creating ? '#93c5fd' : '#2558BF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: creating ? 'not-allowed' : 'pointer',
                    opacity: creating ? 0.7 : 1,
                    minWidth: '140px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {creating && uploadProgress > 0 && uploadProgress < 100 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${uploadProgress}%`,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  )}
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {creating
                      ? uploadProgress > 0 && uploadProgress < 100
                        ? `Uploading ${uploadProgress}%`
                        : uploadProgress >= 100
                        ? 'Processing...'
                        : 'Starting...'
                      : 'Create Meeting'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MeetingsView;
