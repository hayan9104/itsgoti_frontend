import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { teamRecordingsAPI } from '../teamRecordingAPI';
import { invalidate } from '../teamCache';

// ---------------------------------------------------------------------------
// Recorder state machine + capture engine.
//
// State machine:
//   idle         → no recording in progress
//   setup        → setup panel open, device previews running
//   countdown    → 3..2..1 overlay before capture starts
//   recording    → MediaRecorder is active
//   paused       → MediaRecorder is paused
//   processing   → blob assembled, uploading + waiting for save
//
// The capture engine wraps getDisplayMedia + getUserMedia + MediaRecorder. We keep
// streams in refs (not state) to avoid re-rendering on every track event. The
// public surface is a context: open the setup panel from anywhere, and the
// <RecordingOverlays /> component renders the right overlay based on state.
//
// IMPORTANT: This file caches nothing — recording bytes must never be cached.
// The teamCache module's `invalidate('recordings:*')` call below clears list
// caches after a successful upload so the library reflects the new row instantly.
// ---------------------------------------------------------------------------

const MAX_REC_SEC = 30 * 60;
const BUBBLE_SIZES = { S: 88, M: 120, L: 168 };

const defaultCtx = {
  state: 'idle',
  setup: { mode: 'SCREEN_CAM', cameraId: '', micId: '', countdown: true },
  devices: { cameras: [], mics: [] },
  screenChosen: null,
  permError: null,
  livePreview: false,
  countdownN: 3,
  elapsed: 0,
  micMuted: false,
  cameraBubble: { x: 28, y: 28, size: 'M', shape: 'circle', hidden: false },
  dockPos: { x: 0, y: 0 },
  processPct: 0,
  processStage: 'Uploading',
  draft: { title: '', taskId: null, visibility: 'ANYONE_WITH_LINK' },
  maxWarned: false,
  // Action stubs — replaced by the provider.
  openSetup: () => {},
  closeSetup: () => {},
  setMode: () => {},
  setCamera: () => {},
  setMic: () => {},
  setCountdownEnabled: () => {},
  chooseScreen: () => {},
  begin: () => {},
  pause: () => {},
  resume: () => {},
  restart: () => {},
  discard: () => {},
  stop: () => {},
  toggleMic: () => {},
  setCameraBubble: () => {},
  setDockPos: () => {},
  setDraft: () => {},
  camPreviewRef: { current: null },
  bubbleVideoRef: { current: null },
};

const RecorderCtx = createContext(defaultCtx);

export function useRecorder() {
  return useContext(RecorderCtx);
}

export function RecorderProvider({ children }) {
  const [state, setState] = useState('idle');
  const [setup, setSetupState] = useState({ mode: 'SCREEN_CAM', cameraId: '', micId: '', countdown: true });
  const [devices, setDevices] = useState({ cameras: [], mics: [] });
  const [screenChosen, setScreenChosen] = useState(null);
  const [permError, setPermError] = useState(null);
  const [livePreview, setLivePreview] = useState(false);
  const [countdownN, setCountdownN] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraBubble, setCameraBubble] = useState({ x: 28, y: 28, size: 'M', shape: 'circle', hidden: false });
  const [dockPos, setDockPos] = useState({ x: 0, y: 0 });
  const [processPct, setProcessPct] = useState(0);
  // processPctTarget is what we want the bar to reach; processPct is what's actually displayed.
  // A rAF loop eases the displayed value toward the target so the bar always moves smoothly
  // even when XHR progress events arrive in bursts (or only once, for small same-origin uploads).
  const [processPctTarget, setProcessPctTarget] = useState(0);
  const [processStage, setProcessStage] = useState('Uploading');
  const [uploadError, setUploadError] = useState(null);
  const [draft, setDraft] = useState({ title: '', taskId: null, visibility: 'ANYONE_WITH_LINK' });
  const [maxWarned, setMaxWarned] = useState(false);

  // Refs — anything we need to read inside event handlers / cross-state callbacks lives here.
  const screenStreamRef = useRef(null);
  const camStreamRef = useRef(null);
  const micStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const camPreviewRef = useRef(null);
  const bubbleVideoRef = useRef(null);
  const stateRef = useRef('idle');
  const elapsedRef = useRef(0);
  const finalDurationRef = useRef(0);
  const pendingBlobRef = useRef(null);
  const onCompleteRef = useRef(null); // notify the library to refresh

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // ---------- stream lifecycle ----------
  const stopTracks = (ref) => {
    if (ref.current) {
      try { ref.current.getTracks().forEach((t) => t.stop()); } catch (e) {}
      ref.current = null;
    }
  };
  const stopAll = useCallback(() => {
    stopTracks(screenStreamRef);
    stopTracks(camStreamRef);
    stopTracks(micStreamRef);
    if (camPreviewRef.current) camPreviewRef.current.srcObject = null;
    if (bubbleVideoRef.current) bubbleVideoRef.current.srcObject = null;
    setLivePreview(false);
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cameras = devs.filter((d) => d.kind === 'videoinput');
      const mics = devs.filter((d) => d.kind === 'audioinput');
      setDevices({ cameras, mics });
      setSetupState((s) => ({
        ...s,
        cameraId: s.cameraId || cameras[0]?.deviceId || '',
        micId: s.micId || mics[0]?.deviceId || '',
      }));
    } catch (e) { /* enumeration unavailable; selects fall back to generic labels */ }
  }, []);

  const startPreview = useCallback(async (mode, camId, micId) => {
    setPermError(null);
    stopTracks(camStreamRef);
    stopTracks(micStreamRef);
    const wantsCam = (mode === 'SCREEN_CAM' || mode === 'CAM_ONLY') && camId !== 'off';
    const wantsMic = micId !== 'muted';
    try {
      if (wantsCam) {
        const cs = await navigator.mediaDevices.getUserMedia({
          video: camId ? { deviceId: { exact: camId } } : true,
        });
        camStreamRef.current = cs;
        if (camPreviewRef.current) camPreviewRef.current.srcObject = cs;
        setLivePreview(true);
      } else {
        setLivePreview(false);
      }
      if (wantsMic) {
        const ms = await navigator.mediaDevices.getUserMedia({
          audio: micId ? { deviceId: { exact: micId } } : true,
        });
        micStreamRef.current = ms;
        if (micMuted) ms.getAudioTracks().forEach((t) => { t.enabled = false; });
      }
      loadDevices();
    } catch (e) {
      setPermError('GOTI needs camera & mic access. Allow it in your browser settings, then try again.');
      setLivePreview(false);
    }
  }, [micMuted, loadDevices]);

  const chooseScreen = useCallback(async () => {
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = ss;
      const track = ss.getVideoTracks()[0];
      setScreenChosen({ name: track?.label || 'Selected screen' });
      setPermError(null);
      if (track) {
        // If the user hits the browser's native "Stop sharing" bar, finalize the recording.
        track.onended = () => {
          if (stateRef.current === 'recording' || stateRef.current === 'paused') stop();
        };
      }
    } catch (e) {
      setPermError('Screen sharing was cancelled. Click "Choose what to share" to try again.');
    }
  }, []);

  // ---------- setup actions ----------
  const openSetup = useCallback((opts = {}) => {
    setScreenChosen(null);
    setPermError(null);
    setMaxWarned(false);
    setElapsed(0);
    setDraft({ title: '', taskId: opts.taskId || null, visibility: 'ANYONE_WITH_LINK' });
    setState('setup');
    loadDevices();
    startPreview(setup.mode, setup.cameraId, setup.micId);
  }, [setup, loadDevices, startPreview]);

  const closeSetup = useCallback(() => {
    stopAll();
    setState('idle');
  }, [stopAll]);

  const setMode = useCallback((mode) => {
    setSetupState((s) => ({ ...s, mode }));
    startPreview(mode, setup.cameraId, setup.micId);
  }, [setup, startPreview]);

  const setCamera = useCallback((id) => {
    setSetupState((s) => ({ ...s, cameraId: id }));
    startPreview(setup.mode, id, setup.micId);
  }, [setup, startPreview]);

  const setMic = useCallback((id) => {
    setSetupState((s) => ({ ...s, micId: id }));
    startPreview(setup.mode, setup.cameraId, id);
  }, [setup, startPreview]);

  const setCountdownEnabled = useCallback((v) => {
    setSetupState((s) => ({ ...s, countdown: v }));
  }, []);

  // ---------- recording lifecycle ----------
  const actuallyStart = useCallback(() => {
    setState('recording');
    setElapsed(0);
    chunksRef.current = [];
    try {
      let captureStream = null;
      const mode = setup.mode;
      if ((mode === 'SCREEN_CAM' || mode === 'SCREEN_ONLY') && screenStreamRef.current) {
        const tracks = [...screenStreamRef.current.getVideoTracks()];
        if (micStreamRef.current && !micMuted) tracks.push(...micStreamRef.current.getAudioTracks());
        captureStream = new MediaStream(tracks);
      } else if (mode === 'CAM_ONLY' && camStreamRef.current) {
        const tracks = [...camStreamRef.current.getVideoTracks()];
        if (micStreamRef.current && !micMuted) tracks.push(...micStreamRef.current.getAudioTracks());
        captureStream = new MediaStream(tracks);
      }
      if (captureStream && typeof MediaRecorder !== 'undefined') {
        // Pick a sensible mime type. webm/vp9 + opus is the broadest stable option in Chromium.
        let mimeType = 'video/webm';
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) mimeType = 'video/webm;codecs=vp9,opus';
        else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) mimeType = 'video/webm;codecs=vp8,opus';
        const mr = new MediaRecorder(captureStream, { mimeType });
        mr.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunksRef.current.push(ev.data); };
        // Chunked dataavailable every 4s — resilient to a tab crash mid-recording.
        mr.start(4000);
        mediaRecorderRef.current = mr;
      }
    } catch (e) {
      console.error('[Recorder] start failed:', e.message);
    }
  }, [setup.mode, micMuted]);

  const begin = useCallback(() => {
    const mode = setup.mode;
    if ((mode === 'SCREEN_CAM' || mode === 'SCREEN_ONLY') && !screenStreamRef.current) {
      // Don't proceed silently — user needs to pick a screen first.
      setPermError('Please choose what to share before starting.');
      return;
    }
    setMaxWarned(false);
    setElapsed(0);
    const bs = BUBBLE_SIZES[cameraBubble.size];
    setCameraBubble((b) => ({ ...b, x: 28, y: Math.max(28, window.innerHeight - bs - 28), hidden: false }));
    setDockPos({ x: Math.round(window.innerWidth / 2 - 174), y: window.innerHeight - 96 });
    if (setup.countdown) {
      setCountdownN(3);
      setState('countdown');
    } else {
      actuallyStart();
    }
  }, [setup, cameraBubble.size, actuallyStart]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try { mediaRecorderRef.current.pause(); } catch (e) {}
    }
    setState('paused');
  }, []);
  const resume = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      try { mediaRecorderRef.current.resume(); } catch (e) {}
    }
    setState('recording');
  }, []);
  const restart = useCallback(() => {
    if (!window.confirm('Restart this recording? The current take will be discarded.')) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setElapsed(0);
    setMaxWarned(false);
    if (setup.countdown) { setCountdownN(3); setState('countdown'); }
    else actuallyStart();
  }, [setup.countdown, actuallyStart]);
  const discard = useCallback(() => {
    if (!window.confirm('Discard this recording? It won’t be saved.')) return;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) {}
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    stopAll();
    setElapsed(0);
    setState('idle');
  }, [stopAll]);
  const toggleMic = useCallback(() => {
    setMicMuted((cur) => {
      const next = !cur;
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach((t) => { t.enabled = !next; });
      }
      return next;
    });
  }, []);

  // Upload helper — called once chunks are assembled into a Blob in stop().
  // Progress targets:
  //   0   →  2   pre-warm so the bar isn't flat for the first instant
  //   2   →  76  REAL XHR progress + GHOST creep that ensures the bar always moves
  //   76  →  92  synthetic "Processing" phase (~700ms)
  //   92  → 100  synthetic "Ready" tick (~350ms)
  //
  // Ghost creep: every 200ms we asymptotically nudge the target upward toward ~75%, so even if
  // XHR is completely silent (which it is for small same-origin uploads — the event fires once
  // at the very end) the bar never sits frozen. Real XHR progress trumps ghost when it's higher.
  //
  // Failure handling: NO silent auto-retry. We show the actual error message + a Retry button so
  // the user understands what happened instead of watching the bar mysteriously reset.
  const uploadAndFinalize = useCallback(async (blob) => {
    setProcessPct(0);
    setProcessPctTarget(2);
    setProcessStage('Uploading');
    setUploadError(null);

    let ghostTarget = 2;
    const ghostId = setInterval(() => {
      ghostTarget = Math.min(ghostTarget + (76 - ghostTarget) * 0.05, 75);
      setProcessPctTarget((cur) => Math.max(cur, ghostTarget));
    }, 200);

    try {
      const meta = {
        title: draft.title || '',
        captureMode: setup.mode,
        durationSec: Math.max(1, finalDurationRef.current),
        visibility: draft.visibility,
        allowComments: true,
        allowDownload: true,
        taskId: draft.taskId || '',
        bubbleSize: cameraBubble.size,
        bubbleShape: cameraBubble.shape,
      };
      const res = await teamRecordingsAPI.create(blob, meta, (ev) => {
        if (!ev.total) return;
        const real = ev.loaded / ev.total;
        const pct = 2 + Math.round(real * 74);
        // Whichever is higher wins — real progress should never let the bar regress.
        setProcessPctTarget((cur) => Math.max(cur, Math.min(76, pct)));
      });

      clearInterval(ghostId);
      setProcessStage('Processing');
      setProcessPctTarget(92);
      await new Promise((r) => setTimeout(r, 700));
      setProcessStage('Ready');
      setProcessPctTarget(100);
      await new Promise((r) => setTimeout(r, 350));

      invalidate('recordings:*');
      if (typeof onCompleteRef.current === 'function') {
        onCompleteRef.current(res?.data?.recording || null);
      }
      setTimeout(() => {
        setState('idle');
        setElapsed(0);
        setProcessPct(0);
        setProcessPctTarget(0);
        pendingBlobRef.current = null;
      }, 450);
    } catch (err) {
      clearInterval(ghostId);
      const message =
        err?.response?.data?.message ||
        (err?.response?.status ? `Server returned ${err.response.status}` : null) ||
        err?.message ||
        'Upload failed — check your connection and try again.';
      console.error('[Recorder] upload failed:', message);
      setUploadError(message);
      // Stay on the processing screen so the user can hit Retry. pendingBlobRef holds the blob.
    }
  }, [draft, setup.mode, cameraBubble.size, cameraBubble.shape]);

  // Retry the upload using the blob we still hold in pendingBlobRef. No-op if there's nothing to retry.
  const retryUpload = useCallback(() => {
    const blob = pendingBlobRef.current;
    if (!blob) return;
    uploadAndFinalize(blob);
  }, [uploadAndFinalize]);

  // User explicitly cancels a failed upload — drop the pending blob and close the screen.
  const cancelUpload = useCallback(() => {
    pendingBlobRef.current = null;
    setUploadError(null);
    setProcessPct(0);
    setProcessPctTarget(0);
    setState('idle');
  }, []);

  // Smooth easing — every animation frame, nudge the displayed percentage toward the target.
  // The 0.12 ease factor + 0.4 snap threshold gives a soft-but-snappy feel that matches the rest of the team UI.
  useEffect(() => {
    if (state !== 'processing') return;
    let raf;
    const tick = () => {
      setProcessPct((cur) => {
        const diff = processPctTarget - cur;
        if (Math.abs(diff) < 0.4) return processPctTarget;
        return Math.min(100, Math.max(0, cur + diff * 0.12));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, processPctTarget]);

  const stop = useCallback(() => {
    const elapsedNow = stateRef.current === 'idle' ? 0 : elapsedRef.current;
    const finish = (blob) => {
      stopAll();
      if (elapsedNow < 1 || !blob) {
        // Accidental instant-stop or zero-byte capture — discard silently.
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setState('idle');
        return;
      }
      finalDurationRef.current = elapsedNow;
      pendingBlobRef.current = blob;
      setProcessPct(0);
      setProcessStage('Uploading');
      setState('processing');
      uploadAndFinalize(blob);
    };
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const mr = mediaRecorderRef.current;
      mr.onstop = () => {
        let blob = null;
        try {
          if (chunksRef.current.length) {
            const type = chunksRef.current[0].type || 'video/webm';
            blob = new Blob(chunksRef.current, { type });
          }
        } catch (e) {}
        mediaRecorderRef.current = null;
        finish(blob);
      };
      try { mr.stop(); } catch (e) { finish(null); }
    } else {
      finish(null);
    }
  }, [stopAll, uploadAndFinalize]);

  // ---------- side effects ----------

  // Countdown tick
  useEffect(() => {
    if (state !== 'countdown') return;
    let n = 3;
    setCountdownN(3);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(id); actuallyStart(); }
      else setCountdownN(n);
    }, 1000);
    return () => clearInterval(id);
  }, [state, actuallyStart]);

  // Elapsed tick + max-duration enforcement
  useEffect(() => {
    if (state !== 'recording') return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);
  useEffect(() => {
    if (state !== 'recording') return;
    if (elapsed >= MAX_REC_SEC) { stop(); return; }
    if (elapsed >= MAX_REC_SEC - 120 && !maxWarned) setMaxWarned(true);
  }, [elapsed, state, maxWarned, stop]);

  // Wire the camera preview / bubble video to the live stream when present.
  useEffect(() => {
    if (state === 'setup' && camPreviewRef.current && camStreamRef.current) {
      camPreviewRef.current.srcObject = camStreamRef.current;
    }
  }, [state, livePreview, setup.cameraId, setup.mode]);
  useEffect(() => {
    if ((state === 'recording' || state === 'paused' || state === 'countdown') &&
        bubbleVideoRef.current && camStreamRef.current && !cameraBubble.hidden) {
      bubbleVideoRef.current.srcObject = camStreamRef.current;
    }
  }, [state, cameraBubble.hidden, cameraBubble.size, cameraBubble.shape]);

  // Keyboard shortcuts during capture
  useEffect(() => {
    if (state !== 'recording' && state !== 'paused') return;
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (e.code === 'Space') { e.preventDefault(); state === 'recording' ? pause() : resume(); }
      else if (e.key === 'Escape') { e.preventDefault(); stop(); }
      else if (e.key === 'd' || e.key === 'D') { e.preventDefault(); discard(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, pause, resume, stop, discard]);

  // Cleanup on unmount — drop all streams.
  useEffect(() => () => { stopAll(); }, [stopAll]);

  // Public callback registration — view components call this to listen for "new recording saved".
  const onComplete = useCallback((fn) => {
    onCompleteRef.current = fn;
    return () => { if (onCompleteRef.current === fn) onCompleteRef.current = null; };
  }, []);

  const value = {
    state, setup, devices, screenChosen, permError, livePreview,
    countdownN, elapsed, micMuted, cameraBubble, dockPos,
    processPct, processStage, uploadError, draft, maxWarned,
    openSetup, closeSetup, setMode, setCamera, setMic, setCountdownEnabled,
    chooseScreen, begin, pause, resume, restart, discard, stop, toggleMic,
    retryUpload, cancelUpload,
    setCameraBubble, setDockPos, setDraft,
    camPreviewRef, bubbleVideoRef,
    onComplete,
    MAX_REC_SEC, BUBBLE_SIZES,
  };

  return <RecorderCtx.Provider value={value}>{children}</RecorderCtx.Provider>;
}

export { MAX_REC_SEC, BUBBLE_SIZES };
