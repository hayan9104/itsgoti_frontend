import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { workspaceBoardsAPI, workspaceTasksAPI } from '../../services/api';
import fixWebmDuration from 'fix-webm-duration';

const ScreenRecorder = ({ onRecordingComplete, onClose, visible = false }) => {
  // Recording states: 'idle' | 'recording' | 'paused' | 'preview'
  const [recState, setRecState] = useState('idle');
  const [timer, setTimer] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Floating pill drag position — default: left sidebar, below Reminders icon
  const [pillPos, setPillPos] = useState({ x: 8, y: 340 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
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

  // Quality

  // Countdown
  const [countdown, setCountdown] = useState(0);
  const [countdownFading, setCountdownFading] = useState(false);
  const fadeTimeoutRef = useRef(null);

  // Mic level bars
  const [micLevels, setMicLevels] = useState([0, 0, 0, 0, 0]);
  const micAnalyserRef = useRef(null);
  const micLevelStreamRef = useRef(null);
  const micLevelAnimRef = useRef(null);
  const micAudioCtxRef = useRef(null);

  const countdownIntervalRef = useRef(null);
  const countdownResolveRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const screenStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const timerRef = useRef(0);
  const recStateRef = useRef('idle');
  const videoPreviewRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasStreamRef = useRef(null);
  const screenVideoElRef = useRef(null);
  const cameraVideoElRef = useRef(null);
  const animFrameRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreams();
      stopMicMonitor();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, []);

  const stopMicMonitor = () => {
    if (micLevelAnimRef.current) { cancelAnimationFrame(micLevelAnimRef.current); micLevelAnimRef.current = null; }
    if (micLevelStreamRef.current) { micLevelStreamRef.current.getTracks().forEach(t => t.stop()); micLevelStreamRef.current = null; }
    if (micAudioCtxRef.current) { micAudioCtxRef.current.close(); micAudioCtxRef.current = null; }
    micAnalyserRef.current = null;
    setMicLevels([0, 0, 0, 0, 0]);
  };

  const startMicMonitor = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micLevelStreamRef.current = stream;
      const ctx = new AudioContext();
      micAudioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      micAnalyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const BAR_COUNT = 5;
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const step = Math.floor(data.length / BAR_COUNT);
        const levels = Array.from({ length: BAR_COUNT }, (_, i) => {
          const slice = data.slice(i * step, (i + 1) * step);
          const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
          return Math.min(100, (avg / 255) * 100 * 2.5);
        });
        setMicLevels(levels);
        micLevelAnimRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // mic denied — bars stay at 0
    }
  };

  // Start/stop mic monitor when includeMic changes in idle state
  useEffect(() => {
    if (recState !== 'idle') return;
    if (includeMic) { startMicMonitor(); }
    else { stopMicMonitor(); }
    return () => stopMicMonitor();
  }, [includeMic, recState]);

  // Floating pill drag — global mouse move/up listeners
  useEffect(() => {
    const onMove = (e) => {
      if (!isDraggingRef.current) return;
      setPillPos({
        x: Math.max(0, Math.min(window.innerWidth - 280, e.clientX - dragOffsetRef.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 64, e.clientY - dragOffsetRef.current.y)),
      });
    };
    const onUp = () => { isDraggingRef.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const onPillDragStart = (e) => {
    if (e.target.closest('button')) return; // don't drag when clicking buttons
    isDraggingRef.current = true;
    dragOffsetRef.current = { x: e.clientX - pillPos.x, y: e.clientY - pillPos.y };
  };


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
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (screenVideoElRef.current) {
      screenVideoElRef.current.pause();
      screenVideoElRef.current.srcObject = null;
      screenVideoElRef.current = null;
    }
    if (cameraVideoElRef.current) {
      cameraVideoElRef.current.pause();
      cameraVideoElRef.current.srcObject = null;
      cameraVideoElRef.current = null;
    }
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

  const triggerFadeAndResolve = (result) => {
    setCountdownFading(true);
    fadeTimeoutRef.current = setTimeout(() => {
      setCountdown(0);
      setCountdownFading(false);
      fadeTimeoutRef.current = null;
      if (countdownResolveRef.current) {
        countdownResolveRef.current(result);
        countdownResolveRef.current = null;
      }
    }, 500);
  };

  const runCountdown = () => new Promise((resolve) => {
    countdownResolveRef.current = resolve;
    let count = 3;
    setCountdown(count);
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count === 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        // "1" has shown for its full second — now smooth fade then start
        triggerFadeAndResolve('done');
      } else {
        setCountdown(count);
      }
    }, 1000);
  });

  const skipCountdown = () => {
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    triggerFadeAndResolve('skip');
  };

  const cancelCountdown = () => {
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    if (fadeTimeoutRef.current) { clearTimeout(fadeTimeoutRef.current); fadeTimeoutRef.current = null; }
    setCountdown(0);
    setCountdownFading(false);
    if (countdownResolveRef.current) { countdownResolveRef.current('cancel'); countdownResolveRef.current = null; }
  };

  const startRecording = async () => {
    setError('');
    chunksRef.current = [];
    stopMicMonitor(); // stop idle monitor, recording's audio ctx takes over

    try {
      // Step 1: Get screen/tab stream (browser shows native picker)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: true, // system audio from the tab
      });
      screenStreamRef.current = screenStream;

      // Listen for user stopping share via browser UI — use ref to avoid stale closure
      screenStream.getVideoTracks()[0].onended = () => {
        if (recStateRef.current === 'recording' || recStateRef.current === 'paused') {
          stopRecording();
        }
      };

      // 3-2-1 countdown before recording begins
      const countdownResult = await runCountdown();
      if (countdownResult === 'cancel') {
        stopAllStreams();
        startMicMonitor();
        recStateRef.current = 'idle';
        setRecState('idle');
        return;
      }

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

      // Step 3.5: Get camera stream if requested (for PIP overlay)
      let cameraStream = null;
      if (includeCamera) {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
            audio: false,
          });
          cameraStreamRef.current = cameraStream;
        } catch (camErr) {
          console.warn('Camera access denied, continuing without camera:', camErr);
        }
      }

      // Step 4: Build video track — with canvas PIP if camera enabled, otherwise raw screen
      let videoTracks;
      if (cameraStream) {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        canvasRef.current = canvas;
        const ctx = canvas.getContext('2d');

        const screenVideo = document.createElement('video');
        screenVideo.srcObject = new MediaStream(screenStream.getVideoTracks());
        screenVideo.muted = true;
        screenVideoElRef.current = screenVideo;
        await screenVideo.play();

        const cameraVideo = document.createElement('video');
        cameraVideo.srcObject = cameraStream;
        cameraVideo.muted = true;
        cameraVideoElRef.current = cameraVideo;
        await cameraVideo.play();

        const drawFrame = () => {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          const pipSize = 200;
          const margin = 16;
          const px = canvas.width - pipSize - margin;
          const py = canvas.height - pipSize - margin;
          ctx.save();
          ctx.beginPath();
          ctx.arc(px + pipSize / 2, py + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(cameraVideo, px, py, pipSize, pipSize);
          ctx.restore();
          ctx.beginPath();
          ctx.arc(px + pipSize / 2, py + pipSize / 2, pipSize / 2, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)';
          ctx.lineWidth = 3;
          ctx.stroke();
          animFrameRef.current = requestAnimationFrame(drawFrame);
        };
        drawFrame();

        const canvasStream = canvas.captureStream(30);
        canvasStreamRef.current = canvasStream;
        videoTracks = canvasStream.getVideoTracks();
      } else {
        videoTracks = screenStream.getVideoTracks();
      }

      // Step 4b: Combine video + mixed audio into one stream
      const combinedStream = new MediaStream([
        ...videoTracks,
        ...destination.stream.getAudioTracks(),
      ]);

      // Step 5: Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorderOptions = { mimeType };
      const recorder = new MediaRecorder(combinedStream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const rawBlob = new Blob(chunksRef.current, { type: mimeType });
        stopAllStreams();
        if (micLevelAnimRef.current) { cancelAnimationFrame(micLevelAnimRef.current); micLevelAnimRef.current = null; }
        setMicLevels([0, 0, 0, 0, 0]);
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        // Fix webm duration metadata so the video player shows correct time and is seekable
        fixWebmDuration(rawBlob, timerRef.current * 1000, (fixedBlob) => {
          const url = URL.createObjectURL(fixedBlob);
          setRecordedBlob(fixedBlob);
          setRecordedUrl(url);
          recStateRef.current = 'preview';
          setRecState('preview');
        });
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError('Recording failed. Please try again.');
        stopAllStreams();
        recStateRef.current = 'idle';
        setRecState('idle');
      };

      // Step 6: Start recording
      recorder.start(1000); // collect data every second
      recStateRef.current = 'recording';
      setRecState('recording');
      setTimer(0);
      timerRef.current = 0;

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        timerRef.current += 1;
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
      recStateRef.current = 'idle';
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
      recStateRef.current = 'paused';
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
      recStateRef.current = 'recording';
      setRecState('recording');
      timerIntervalRef.current = setInterval(() => {
        timerRef.current += 1;
        setTimer(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const discardRecording = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl('');
    setTimer(0);
    recStateRef.current = 'idle';
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
    backgroundColor: '#242526',
    borderRadius: '18px',
    width: '560px',
    maxWidth: '96vw',
    boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
    border: '1px solid #333436',
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid #333436',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const bodyStyle = {
    padding: '20px 24px',
  };

  const btnPrimary = {
    padding: '10px 20px',
    backgroundColor: '#6f6e6f',
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
    backgroundColor: '#2a2b2d',
    color: '#e5e7eb',
    border: '1px solid #333436',
  };

  const btnSuccess = {
    ...btnPrimary,
    backgroundColor: '#059669',
  };

  // Hidden and idle — render nothing (stays mounted so recording state is preserved)
  if (!visible && recState === 'idle') return null;

  // ── Floating pill — shown instead of modal while recording or paused ──
  if (recState === 'recording' || recState === 'paused') {
    const isRec = recState === 'recording';
    return createPortal(
      <>
        <div
          onMouseDown={onPillDragStart}
          style={{
            position: 'fixed',
            left: pillPos.x,
            top: pillPos.y,
            zIndex: 99999,
            backgroundColor: '#18191b',
            border: `1px solid ${isRec ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}`,
            borderRadius: '16px',
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
            cursor: 'grab',
            userSelect: 'none',
            width: '62px',
          }}
        >
          {/* Drag handle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', opacity: 0.25 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: '22px', height: '2px', backgroundColor: '#fff', borderRadius: '99px' }} />
            ))}
          </div>

          {/* Pulsing status dot */}
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: isRec ? '#ef4444' : '#f59e0b',
            animation: isRec ? 'pillPulse 1.2s ease-in-out infinite' : 'none',
          }} />

          {/* Timer — horizontal, bigger */}
          <span style={{
            fontSize: '14px', fontWeight: '700', color: '#ffffff',
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            letterSpacing: '1px',
          }}>
            {formatTime(timer)}
          </span>

          {/* Divider */}
          <div style={{ width: '36px', height: '1px', backgroundColor: '#2e2f31' }} />

          {/* Pause / Resume */}
          <button
            onClick={isRec ? pauseRecording : resumeRecording}
            title={isRec ? 'Pause' : 'Resume'}
            style={{
              width: '38px', height: '38px', borderRadius: '10px',
              border: '1px solid #3a3b3d', backgroundColor: '#252628',
              color: '#e5e7eb', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#333436'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#252628'}
          >
            {isRec ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* Stop */}
          <button
            onClick={stopRecording}
            title="Stop Recording"
            style={{
              width: '38px', height: '38px', borderRadius: '10px',
              border: 'none', backgroundColor: '#dc2626', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          </button>
        </div>

        <style>{`
          @keyframes pillPulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
            60% { opacity: 0.7; box-shadow: 0 0 0 5px rgba(239,68,68,0); }
          }
        `}</style>
      </>,
      document.body
    );
  }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget && recState === 'idle') onClose(); }}>
      <div style={modalStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f1f1f1' }}>
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
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', display: 'block' }}>
                  Recording Title
                </label>
                <input
                  type="text"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning Meeting"
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1px solid #3f4042', fontSize: '14px', color: '#f1f1f1',
                    backgroundColor: '#1e1f21',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                  onBlur={(e) => e.target.style.borderColor = '#3f4042'}
                />
              </div>

              {/* Tab audio note */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', marginBottom: '12px',
                backgroundColor: 'rgba(99,102,241,0.07)', borderRadius: '7px',
                border: '1px solid rgba(99,102,241,0.18)',
              }}>
                <span style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0 }}>💡</span>
                <p style={{ fontSize: '11px', color: '#a5b4fc', margin: 0, lineHeight: '1.4' }}>
                  Enable <strong style={{ color: '#c7d2fe' }}>"Also share tab audio"</strong> when sharing for system audio.
                </p>
              </div>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {/* Microphone */}
                <div style={{
                  padding: '12px 16px', backgroundColor: includeMic ? 'rgba(34,197,94,0.06)' : '#1e1f21',
                  borderRadius: '8px', border: `1px solid ${includeMic ? 'rgba(34,197,94,0.25)' : '#3f4042'}`,
                  transition: 'all 0.15s',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeMic}
                      onChange={(e) => setIncludeMic(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#22c55e' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#e5e7eb' }}>Include Microphone</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>Record your voice along with the meeting</div>
                    </div>
                  </label>
                  {includeMic && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      marginTop: '8px', paddingTop: '8px',
                      borderTop: '1px solid rgba(34,197,94,0.15)',
                    }}>
                      <span style={{ fontSize: '10px', color: '#6b7280', whiteSpace: 'nowrap' }}>Mic</span>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px', flex: 1 }}>
                        {micLevels.map((level, i) => (
                          <div key={i} style={{
                            flex: 1, borderRadius: '2px',
                            backgroundColor: level > 60 ? '#22c55e' : level > 25 ? '#6366f1' : '#2d2e30',
                            height: `${Math.max(15, level)}%`,
                            transition: 'height 0.08s ease, background-color 0.1s ease',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '10px', color: micLevels.some(l => l > 10) ? '#22c55e' : '#4b5563', whiteSpace: 'nowrap' }}>
                        {micLevels.some(l => l > 10) ? 'Active' : 'Silent'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Camera */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: includeCamera ? 'rgba(99,102,241,0.06)' : '#1e1f21',
                  borderRadius: '8px', border: `1px solid ${includeCamera ? 'rgba(99,102,241,0.25)' : '#3f4042'}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={includeCamera}
                    onChange={(e) => setIncludeCamera(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                  />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#e5e7eb' }}>Include Camera (PIP)</div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>Show your face in a circle overlay on the recording</div>
                  </div>
                </label>

                {/* Board & Task */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: assignToBoard ? 'rgba(99,102,241,0.06)' : '#1e1f21',
                  borderRadius: '8px',
                  border: `1px solid ${assignToBoard ? 'rgba(99,102,241,0.25)' : '#3f4042'}`,
                  transition: 'all 0.15s',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={assignToBoard}
                      onChange={(e) => {
                        setAssignToBoard(e.target.checked);
                        if (!e.target.checked) { setSelectedBoardId(''); setSelectedTaskId(''); setTasks([]); }
                      }}
                      style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#e5e7eb' }}>Assign to a Board & Task</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>Only the assigned person will get access to this recording</div>
                    </div>
                  </label>

                  {assignToBoard && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px', display: 'block' }}>
                          Select Board
                        </label>
                        <select
                          value={selectedBoardId}
                          onChange={(e) => { setSelectedBoardId(e.target.value); setSelectedTaskId(''); }}
                          disabled={loadingBoards}
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: '7px',
                            border: '1px solid #3f4042', fontSize: '13px', color: '#e5e7eb',
                            backgroundColor: '#252628', cursor: 'pointer', outline: 'none',
                          }}
                        >
                          <option value="">{loadingBoards ? 'Loading boards...' : '-- Select Board --'}</option>
                          {boards.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      {selectedBoardId && (
                        <div>
                          <label style={{ fontSize: '10px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px', display: 'block' }}>
                            Select Task
                          </label>
                          <select
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                            disabled={loadingTasks}
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: '7px',
                              border: '1px solid #3f4042', fontSize: '13px', color: '#e5e7eb',
                              backgroundColor: '#252628', cursor: 'pointer', outline: 'none',
                            }}
                          >
                            <option value="">{loadingTasks ? 'Loading tasks...' : '-- Select Task --'}</option>
                            {tasks.map(t => (
                              <option key={t._id} value={t._id}>
                                {t.title}{t.assignee?.name ? ` (${t.assignee.name})` : ''}
                              </option>
                            ))}
                          </select>

                          {selectedTaskId && (() => {
                            const task = tasks.find(t => t._id === selectedTaskId);
                            return task?.assignee?.name ? (
                              <div style={{
                                marginTop: '6px', padding: '7px 10px',
                                backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: '6px',
                                fontSize: '11px', color: '#a5b4fc',
                                border: '1px solid rgba(99,102,241,0.2)',
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
              </div>


              {/* Start Recording CTA */}
              <button onClick={startRecording} style={{
                width: '100%', padding: '13px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: '15px', fontWeight: '700', letterSpacing: '0.3px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(220,38,38,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(220,38,38,0.35)'}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#fff', animation: 'pulse 1.5s infinite' }} />
                Start Recording
              </button>
            </>
          )}

          {/* RECORDING STATE */}
          {(recState === 'recording' || recState === 'paused') && (
            <div style={{ textAlign: 'center', animation: 'recFadeIn 0.35s ease' }}>

              {/* Live / Paused pill */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 16px', borderRadius: '99px', marginBottom: '28px',
                backgroundColor: recState === 'recording' ? 'rgba(220,38,38,0.12)' : 'rgba(245,158,11,0.12)',
                border: `1px solid ${recState === 'recording' ? 'rgba(220,38,38,0.35)' : 'rgba(245,158,11,0.35)'}`,
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: recState === 'recording' ? '#ef4444' : '#f59e0b',
                  animation: recState === 'recording' ? 'pulse 1.2s infinite' : 'none',
                }} />
                <span style={{
                  fontSize: '13px', fontWeight: '700', letterSpacing: '1.5px',
                  color: recState === 'recording' ? '#ef4444' : '#f59e0b',
                  textTransform: 'uppercase',
                }}>
                  {recState === 'recording' ? 'Live' : 'Paused'}
                </span>
              </div>

              {/* Timer — big with glow */}
              <div style={{
                fontSize: '64px', fontWeight: '800', color: '#fff',
                fontFamily: 'monospace', lineHeight: 1, marginBottom: '32px',
                textShadow: recState === 'recording' ? '0 0 40px rgba(239,68,68,0.25)' : 'none',
                letterSpacing: '-2px',
              }}>
                {formatTime(timer)}
              </div>

              {/* Controls — icon buttons side by side */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
                {recState === 'recording' ? (
                  <button onClick={pauseRecording} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '11px 22px', borderRadius: '10px', border: '1px solid #3f4042',
                    backgroundColor: '#313234', color: '#e5e7eb',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3a3b3d'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#313234'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                    Pause
                  </button>
                ) : (
                  <button onClick={resumeRecording} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '11px 22px', borderRadius: '10px', border: '1px solid #3f4042',
                    backgroundColor: '#313234', color: '#e5e7eb',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3a3b3d'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#313234'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Resume
                  </button>
                )}
                <button onClick={stopRecording} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '11px 22px', borderRadius: '10px', border: '1px solid rgba(220,38,38,0.4)',
                  backgroundColor: '#dc2626', color: '#fff',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: '0 4px 14px rgba(220,38,38,0.3)',
                }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#b91c1c'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                  </svg>
                  Stop Recording
                </button>
              </div>

              <p style={{ fontSize: '11px', color: '#4b5563', margin: 0 }}>
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
                backgroundColor: '#252628',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px', color: '#6b7280',
              }}>
                <span>Duration: <strong style={{ color: '#f1f1f1' }}>{formatTime(timer)}</strong></span>
                <span>Size: <strong style={{ color: '#f1f1f1' }}>{recordedBlob ? formatFileSize(recordedBlob.size) : '-'}</strong></span>
                <span>Format: <strong style={{ color: '#f1f1f1' }}>WebM</strong></span>
              </div>

              {/* Show assignment summary in preview if set */}
              {assignToBoard && selectedBoardId && (
                <div style={{
                  padding: '10px 14px', marginBottom: '16px',
                  backgroundColor: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '8px', fontSize: '12px', color: '#a5b4fc',
                }}>
                  Assigned to: <strong>{boards.find(b => b._id === selectedBoardId)?.name}</strong>
                  {selectedTaskId && tasks.find(t => t._id === selectedTaskId) && (
                    <span> → <strong>{tasks.find(t => t._id === selectedTaskId)?.title}</strong></span>
                  )}
                </div>
              )}

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

      {/* 3-2-1 Countdown Overlay */}
      {(countdown > 0 || countdownFading) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.80)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 99999,
          animation: countdownFading ? 'overlayFadeOut 0.5s ease forwards' : 'none',
        }}>
          {/* Three-button row: Cancel — Number — Skip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {/* Cancel */}
            <button onClick={cancelCountdown} style={{
              width: '72px', height: '72px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>

            {/* Countdown number */}
            <div key={countdown} style={{
              width: '140px', height: '140px', borderRadius: '50%',
              backgroundColor: 'rgba(99,102,241,0.3)',
              border: '4px solid rgba(99,102,241,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '72px', fontWeight: '800', color: '#fff',
              animation: 'countPop 0.9s ease-out forwards',
            }}>
              {countdown}
            </div>

            {/* Skip */}
            <button onClick={skipCountdown} style={{
              width: '72px', height: '72px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
              </svg>
            </button>
          </div>

          <p style={{ color: '#9ca3af', fontSize: '16px', marginTop: '24px', fontWeight: '500' }}>
            Get ready — recording starts soon
          </p>
          <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '6px' }}>
            ✕ Cancel &nbsp;&nbsp;|&nbsp;&nbsp; Skip to start immediately →
          </p>
        </div>
      )}

      {/* CSS Animations & Button Effects */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes countPop {
          0%   { transform: scale(1.35); opacity: 0; }
          12%  { transform: scale(1);    opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes recFadeIn {
          0%   { opacity: 0; transform: scale(0.96) translateY(8px); }
          100% { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes overlayFadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
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
          background-color: #333436 !important;
        }
      `}</style>
    </div>
  );
};

export default ScreenRecorder;
