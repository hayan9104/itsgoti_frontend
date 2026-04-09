import { useState, useRef, useCallback, useEffect } from 'react';
import { workspaceBoardsAPI, workspaceTasksAPI } from '../../services/api';

const ScreenRecorder = ({ onRecordingComplete, onClose }) => {
  // Recording states: 'idle' | 'recording' | 'paused' | 'preview'
  const [recState, setRecState] = useState('idle');
  const [timer, setTimer] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);
  const [includeCamera, setIncludeCamera] = useState(false);

  // Board & Task assignment
  const [assignToBoard, setAssignToBoard] = useState(false);
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Title
  const [recordingTitle, setRecordingTitle] = useState('');

  const mediaRecorderRef = useRef(null);
  const screenStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasStreamRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);


  // Load boards when "Assign to Board" is checked
  useEffect(() => {
    if (!assignToBoard) return;
    const loadBoards = async () => {
      setLoadingBoards(true);
      try {
        const res = await workspaceBoardsAPI.getAll();
        if (res.data.success) setBoards(res.data.data);
      } catch (err) {
        console.error('Failed to load boards:', err);
      } finally {
        setLoadingBoards(false);
      }
    };
    loadBoards();
  }, [assignToBoard]);

  // Load tasks when board is selected
  useEffect(() => {
    if (!selectedBoardId) { setTasks([]); setSelectedTaskId(''); return; }
    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const res = await workspaceTasksAPI.getByBoard(selectedBoardId);
        if (res.data.success) setTasks(res.data.data.filter(t => t.type !== 'note'));
      } catch (err) {
        setTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };
    loadTasks();
  }, [selectedBoardId]);

  const stopAllStreams = () => {
    [screenStreamRef, micStreamRef, cameraStreamRef, canvasStreamRef].forEach(ref => {
      if (ref.current) {
        ref.current.getTracks().forEach(track => track.stop());
        ref.current = null;
      }
    });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setError('');
    chunksRef.current = [];

    try {
      // Step 1: Get screen/tab stream (browser shows native picker)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true, // system audio from the tab
      });
      screenStreamRef.current = screenStream;

      // Listen for user stopping share via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        if (recState === 'recording' || recState === 'paused') {
          stopRecording();
        }
      };

      // Step 2: Get microphone stream (optional)
      let micStream = null;
      if (includeMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;
        } catch (micErr) {
          console.warn('Mic access denied, continuing without mic:', micErr);
        }
      }

      // Step 3: Combine audio streams
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Add system audio (from screen share)
      const screenAudioTracks = screenStream.getAudioTracks();
      if (screenAudioTracks.length > 0) {
        const screenAudioStream = new MediaStream(screenAudioTracks);
        const screenSource = audioContext.createMediaStreamSource(screenAudioStream);
        screenSource.connect(destination);
      }

      // Add microphone audio
      if (micStream) {
        const micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(destination);
      }

      // Step 4: Combine video + mixed audio into one stream
      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);

      // Step 5: Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps HD
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setRecState('preview');
        stopAllStreams();
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError('Recording failed. Please try again.');
        stopAllStreams();
        setRecState('idle');
      };

      // Step 6: Start recording
      recorder.start(1000); // collect data every second
      setRecState('recording');
      setTimer(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing was cancelled. Click "Start Recording" to try again.');
      } else {
        setError('Failed to start recording: ' + err.message);
      }
      stopAllStreams();
      setRecState('idle');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecState('paused');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecState('recording');
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl('');
    setTimer(0);
    setRecState('idle');
    chunksRef.current = [];
  };

  const handleSave = () => {
    if (recordedBlob && onRecordingComplete) {
      onRecordingComplete(recordedBlob, {
        title: recordingTitle.trim() || null,
        boardId: assignToBoard ? selectedBoardId : null,
        taskId: assignToBoard ? selectedTaskId : null,
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // Styles
  const overlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const modalStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '520px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const bodyStyle = {
    padding: '24px',
  };

  const btnPrimary = {
    padding: '10px 20px',
    backgroundColor: '#2558BF',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const btnDanger = {
    ...btnPrimary,
    backgroundColor: '#dc2626',
  };

  const btnSecondary = {
    ...btnPrimary,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #e5e7eb',
  };

  const btnSuccess = {
    ...btnPrimary,
    backgroundColor: '#059669',
  };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget && recState === 'idle') onClose(); }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            {recState === 'idle' && 'Record Meeting'}
            {(recState === 'recording' || recState === 'paused') && 'Recording in Progress'}
            {recState === 'preview' && 'Recording Preview'}
          </h3>
          {recState === 'idle' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>

        <div style={bodyStyle}>
          {/* Error */}
          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}

          {/* IDLE STATE — Settings + Start Button */}
          {recState === 'idle' && (
            <>
              {/* Title Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>
                  Recording Title
                </label>
                <input
                  type="text"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning Meeting"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #e5e7eb', fontSize: '14px', color: '#111827',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2558BF'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Tab audio note */}
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px', lineHeight: '1.5' }}>
                For system/tab audio, enable <strong>"Also share tab audio"</strong> when sharing.
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px', backgroundColor: '#f9fafb',
                  borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={includeMic}
                    onChange={(e) => setIncludeMic(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#2558BF' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Include Microphone</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Record your voice along with the meeting</div>
                  </div>
                </label>
              </div>

              <button className="rec-btn rec-btn-primary" onClick={startRecording} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: '14px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" fill="#ff4444"/>
                </svg>
                Start Recording
              </button>
            </>
          )}

          {/* RECORDING STATE */}
          {(recState === 'recording' || recState === 'paused') && (
            <div style={{ textAlign: 'center' }}>
              {/* Recording indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '24px',
              }}>
                <div style={{
                  width: '16px', height: '16px',
                  borderRadius: '50%',
                  backgroundColor: recState === 'recording' ? '#dc2626' : '#f59e0b',
                  animation: recState === 'recording' ? 'pulse 1.5s infinite' : 'none',
                }} />
                <span style={{ fontSize: '16px', fontWeight: '600', color: recState === 'recording' ? '#dc2626' : '#f59e0b' }}>
                  {recState === 'recording' ? 'Recording' : 'Paused'}
                </span>
              </div>

              {/* Timer */}
              <div style={{
                fontSize: '48px',
                fontWeight: '700',
                color: '#111827',
                fontFamily: 'monospace',
                marginBottom: '32px',
              }}>
                {formatTime(timer)}
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {recState === 'recording' ? (
                  <button className="rec-btn rec-btn-secondary" onClick={pauseRecording} style={btnSecondary}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                    Pause
                  </button>
                ) : (
                  <button className="rec-btn rec-btn-primary" onClick={resumeRecording} style={btnPrimary}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Resume
                  </button>
                )}
                <button className="rec-btn rec-btn-danger" onClick={stopRecording} style={btnDanger}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="1"/>
                  </svg>
                  Stop Recording
                </button>
              </div>

              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px' }}>
                You can also stop by clicking "Stop sharing" in the browser bar.
              </p>
            </div>
          )}

          {/* PREVIEW STATE */}
          {recState === 'preview' && recordedUrl && (
            <>
              {/* Video Preview */}
              <div style={{
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#000',
                marginBottom: '16px',
              }}>
                <video
                  ref={videoPreviewRef}
                  src={recordedUrl}
                  controls
                  style={{ width: '100%', maxHeight: '300px', display: 'block' }}
                />
              </div>

              {/* Recording Info */}
              <div style={{
                display: 'flex', gap: '16px',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px', color: '#6b7280',
              }}>
                <span>Duration: <strong style={{ color: '#111827' }}>{formatTime(timer)}</strong></span>
                <span>Size: <strong style={{ color: '#111827' }}>{recordedBlob ? formatFileSize(recordedBlob.size) : '-'}</strong></span>
                <span>Format: <strong style={{ color: '#111827' }}>WebM</strong></span>
              </div>

              {/* Assign to Board/Task */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb',
              }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={assignToBoard}
                    onChange={(e) => {
                      setAssignToBoard(e.target.checked);
                      if (!e.target.checked) { setSelectedBoardId(''); setSelectedTaskId(''); setTasks([]); }
                    }}
                    style={{ width: '18px', height: '18px', accentColor: '#2558BF' }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Save to a Board</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Assign to a task — only the assigned person will see this recording</div>
                  </div>
                </label>

                {assignToBoard && (
                  <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Board Dropdown */}
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                        Select Board
                      </label>
                      <select
                        value={selectedBoardId}
                        onChange={(e) => { setSelectedBoardId(e.target.value); setSelectedTaskId(''); }}
                        disabled={loadingBoards}
                        style={{
                          width: '100%', padding: '10px 12px', borderRadius: '8px',
                          border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827',
                          backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="">{loadingBoards ? 'Loading boards...' : '-- Select Board --'}</option>
                        {boards.map(b => (
                          <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Task Dropdown — shows after board is selected */}
                    {selectedBoardId && (
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                          Select Task
                        </label>
                        <select
                          value={selectedTaskId}
                          onChange={(e) => setSelectedTaskId(e.target.value)}
                          disabled={loadingTasks}
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: '8px',
                            border: '1px solid #e5e7eb', fontSize: '13px', color: '#111827',
                            backgroundColor: '#fff', cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="">{loadingTasks ? 'Loading tasks...' : '-- Select Task --'}</option>
                          {tasks.map(t => (
                            <option key={t._id} value={t._id}>
                              {t.title}{t.assignee?.name ? ` (${t.assignee.name})` : ''}
                            </option>
                          ))}
                        </select>

                        {/* Show selected task assignee */}
                        {selectedTaskId && (() => {
                          const task = tasks.find(t => t._id === selectedTaskId);
                          return task?.assignee?.name ? (
                            <div style={{
                              marginTop: '8px', padding: '8px 12px',
                              backgroundColor: '#eff6ff', borderRadius: '6px',
                              fontSize: '12px', color: '#1e40af',
                            }}>
                              Only <strong>{task.assignee.name}</strong> and you will see this recording
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="rec-btn rec-btn-secondary" onClick={discardRecording} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Discard
                </button>
                <button className="rec-btn rec-btn-success" onClick={handleSave} style={{ ...btnSuccess, flex: 2, justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Save Recording
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS Animations & Button Effects */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .rec-btn {
          transition: all 0.15s ease !important;
        }
        .rec-btn:hover {
          opacity: 0.85;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .rec-btn:active {
          transform: translateY(1px) scale(0.98);
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          opacity: 0.75;
        }
        .rec-btn-primary:hover {
          box-shadow: 0 4px 14px rgba(37,88,191,0.4);
        }
        .rec-btn-danger:hover {
          box-shadow: 0 4px 14px rgba(220,38,38,0.4);
        }
        .rec-btn-success:hover {
          box-shadow: 0 4px 14px rgba(5,150,105,0.4);
        }
        .rec-btn-secondary:hover {
          background-color: #e5e7eb !important;
        }
      `}</style>
    </div>
  );
};

export default ScreenRecorder;
