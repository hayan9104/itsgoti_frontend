import React, { useEffect, useState } from 'react';
import {
  X, Monitor, Camera, CameraOff, Mic, MicOff, Play, Pause, RotateCcw, Trash2, Square,
  Move, EyeOff, Video,
} from 'lucide-react';
import { useTeamAuth } from '../TeamAuthContext';
import { getPalette, baseFont, serifFont, monoFont } from '../theme';
import { teamTasksAPI } from '../teamAPI';
import { useRecorder, BUBBLE_SIZES } from './RecorderContext';
import { captureModeMeta, recFmtDur, recThumbStyle } from './recHelpers';

// All four recording overlays in one file — the setup panel, countdown, camera bubble,
// control dock, and processing screen. They share a lot of styling and only one of them
// is on screen at a time, so keeping them together keeps the surface small and discoverable.

const isDark = () => localStorage.getItem('team_theme') === 'dark';

function useLivePalette() {
  const [dark, setDark] = useState(isDark());
  useEffect(() => {
    const onStorage = () => setDark(isDark());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return getPalette(dark);
}

// ---------------------------------------------------------------------------
// Setup panel
// ---------------------------------------------------------------------------
function RecSetupPanel() {
  const r = useRecorder();
  const palette = useLivePalette();
  const mode = r.setup.mode;
  const showScreen = mode === 'SCREEN_CAM' || mode === 'SCREEN_ONLY';
  const showCam = mode === 'SCREEN_CAM' || mode === 'CAM_ONLY';

  const selectStyle = {
    backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: baseFont,
    fontSize: 12.5, border: `1px solid ${palette.border}`, borderRadius: 6,
    padding: '7px 9px', outline: 'none', width: '100%',
  };

  return (
    <div
      onClick={r.closeSetup}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100, display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center', paddingTop: 76,
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.surface, width: 380, borderRadius: 12,
          border: `1px solid ${palette.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
          fontFamily: baseFont, color: palette.text,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 19, fontWeight: 500, color: palette.text, margin: 0 }}>New recording</h3>
          <button type="button" onClick={r.closeSetup} style={{ background: 'none', border: 'none', color: palette.textMute, cursor: 'pointer', padding: 0 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '0 20px 20px', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {r.permError && (
            <div style={{
              borderRadius: 8, padding: '10px 12px',
              backgroundColor: palette.warnBg, border: `1px solid ${palette.warn}`,
              color: palette.warn, fontSize: 11.5, lineHeight: 1.5,
            }}>{r.permError}</div>
          )}

          <SectionLabel palette={palette} label="CAPTURE MODE" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {['SCREEN_CAM', 'SCREEN_ONLY', 'CAM_ONLY'].map((m) => {
              const M = captureModeMeta[m];
              const Ic = M.icon;
              const on = mode === m;
              return (
                <button key={m} type="button" onClick={() => r.setMode(m)}
                  style={{
                    borderRadius: 8, padding: '10px 6px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    backgroundColor: on ? palette.accentBg : palette.surfaceAlt,
                    border: `1px solid ${on ? palette.accent : palette.border}`,
                    cursor: 'pointer',
                  }}>
                  <Ic size={17} strokeWidth={1.75} color={on ? palette.accent : palette.textDim} />
                  <span style={{ fontFamily: baseFont, fontSize: 10, fontWeight: 500, color: on ? palette.accent : palette.textDim, textAlign: 'center', lineHeight: 1.2 }}>
                    {M.label}
                  </span>
                </button>
              );
            })}
          </div>

          {showScreen && (
            <div>
              <SectionLabel palette={palette} label="SCREEN SOURCE" />
              {r.screenChosen ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}` }}>
                  <div style={{ width: 38, height: 26, borderRadius: 4, background: recThumbStyle(4), flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: palette.text }}>{r.screenChosen.name}</span>
                  <button type="button" onClick={r.chooseScreen} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, color: palette.accent, fontWeight: 500 }}>Change</button>
                </div>
              ) : (
                <button type="button" onClick={r.chooseScreen} style={{
                  width: '100%', padding: 11, borderRadius: 8, cursor: 'pointer',
                  backgroundColor: palette.surfaceAlt, border: `1px dashed ${palette.border}`,
                  fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Monitor size={14} /> Choose what to share
                </button>
              )}
            </div>
          )}

          {showCam && (
            <div>
              <SectionLabel palette={palette} label="CAMERA" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 999, overflow: 'hidden', flexShrink: 0,
                  backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {r.livePreview && r.setup.cameraId !== 'off'
                    ? <video ref={r.camPreviewRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    : <Camera size={18} color={palette.textMute} />}
                </div>
                <select value={r.setup.cameraId} onChange={(e) => r.setCamera(e.target.value)} style={selectStyle}>
                  {r.devices.cameras.length === 0 && <option value="">Default camera</option>}
                  {r.devices.cameras.map((c, i) => <option key={c.deviceId || i} value={c.deviceId}>{c.label || `Camera ${i + 1}`}</option>)}
                  <option value="off">Off</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <SectionLabel palette={palette} label="MICROPHONE" />
            <select value={r.setup.micId} onChange={(e) => r.setMic(e.target.value)} style={selectStyle}>
              {r.devices.mics.length === 0 && <option value="">Default microphone</option>}
              {r.devices.mics.map((m, i) => <option key={m.deviceId || i} value={m.deviceId}>{m.label || `Microphone ${i + 1}`}</option>)}
              <option value="muted">Muted</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, height: 6 }}>
              {Array.from({ length: 16 }).map((_, i) => {
                const active = r.setup.micId !== 'muted' && r.livePreview && i < 7;
                return <div key={i} style={{ flex: 1, height: '100%', borderRadius: 2, backgroundColor: active ? palette.accent : palette.border, opacity: active ? 0.4 + (i / 16) * 0.6 : 1 }} />;
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.text, fontWeight: 500 }}>3-second countdown</div>
              <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>A calm beat before recording starts</div>
            </div>
            <Toggle on={r.setup.countdown} onChange={r.setCountdownEnabled} palette={palette} />
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: `1px solid ${palette.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={r.begin}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
              backgroundColor: palette.accent, color: palette.accentText, border: 'none',
              fontFamily: baseFont, fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <Video size={14} /> Start recording
          </button>
          <button type="button" onClick={r.closeSetup}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', color: palette.textDim, fontFamily: baseFont, fontSize: 12.5, fontWeight: 500 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ palette, label }) {
  return <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>;
}

function Toggle({ on, onChange, palette }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 34, height: 20, borderRadius: 999, position: 'relative',
        backgroundColor: on ? palette.accent : palette.border, border: 'none',
        cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color .15s',
      }}>
      <span style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 16, height: 16, borderRadius: 999, backgroundColor: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,.25)', transition: 'left .15s',
      }} />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Countdown overlay
// ---------------------------------------------------------------------------
function RecCountdown() {
  const r = useRecorder();
  const palette = useLivePalette();
  const isDarkMode = palette.bg === '#0F0E0C';
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      backgroundColor: isDarkMode ? 'rgba(15,14,12,0.82)' : 'rgba(250,249,246,0.82)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: serifFont, fontSize: 160, fontWeight: 300,
        color: palette.accent, lineHeight: 1, fontStyle: 'italic',
      }}>
        {r.countdownN}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating camera bubble
// ---------------------------------------------------------------------------
function RecCameraBubble() {
  const r = useRecorder();
  const palette = useLivePalette();
  if (r.setup.mode !== 'SCREEN_CAM' || r.cameraBubble.hidden) return null;
  const size = BUBBLE_SIZES[r.cameraBubble.size];
  const radius = r.cameraBubble.shape === 'circle' ? 999 : 18;

  const onDragStart = (e) => {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const p0 = r.cameraBubble;
    const onMove = (ev) => {
      let nx = p0.x + (ev.clientX - sx);
      let ny = p0.y + (ev.clientY - sy);
      nx = Math.max(8, Math.min(window.innerWidth - size - 8, nx));
      ny = Math.max(8, Math.min(window.innerHeight - size - 8, ny));
      r.setCameraBubble((prev) => ({ ...prev, x: nx, y: ny }));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div className="rec-cam-bubble" style={{ position: 'fixed', zIndex: 1100, left: r.cameraBubble.x, top: r.cameraBubble.y, width: size, height: size }}>
      <div
        onMouseDown={onDragStart}
        style={{
          width: '100%', height: '100%', borderRadius: radius, overflow: 'hidden',
          cursor: 'grab', backgroundColor: '#1A1916',
          border: `2px solid ${palette.surface}`, boxShadow: '0 8px 28px rgba(0,0,0,0.32)',
        }}>
        {r.livePreview
          ? <video ref={r.bubbleVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          : <div style={{ width: '100%', height: '100%', background: recThumbStyle(2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={22} color="rgba(255,255,255,0.5)" /></div>}
      </div>
      <div className="rec-cam-bubble-controls"
        style={{
          position: 'absolute', top: -34, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 6px', borderRadius: 999,
          backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          opacity: 0, transition: 'opacity .15s', pointerEvents: 'none',
        }}
      >
        {['S', 'M', 'L'].map((s) => (
          <button key={s} type="button" onClick={() => r.setCameraBubble((b) => ({ ...b, size: s }))}
            style={{
              width: 20, height: 20, borderRadius: 5, border: 'none', cursor: 'pointer',
              fontFamily: monoFont, fontSize: 10, fontWeight: 500,
              backgroundColor: r.cameraBubble.size === s ? palette.accentBg : 'transparent',
              color: r.cameraBubble.size === s ? palette.accent : palette.textDim,
            }}>{s}</button>
        ))}
        <span style={{ width: 1, height: 14, backgroundColor: palette.border }} />
        <button type="button" onClick={() => r.setCameraBubble((b) => ({ ...b, shape: b.shape === 'circle' ? 'square' : 'circle' }))}
          title="Shape"
          style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textDim }}>
          <div style={{ width: 11, height: 11, border: '1.75px solid currentColor', borderRadius: r.cameraBubble.shape === 'circle' ? 3 : 999 }} />
        </button>
        <button type="button" onClick={() => r.setCameraBubble((b) => ({ ...b, hidden: true }))}
          title="Hide bubble"
          style={{ width: 20, height: 20, borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.textDim }}>
          <EyeOff size={12} strokeWidth={1.75} />
        </button>
      </div>
      <style>{`
        .rec-cam-bubble:hover .rec-cam-bubble-controls { opacity: 1; pointer-events: auto; }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Floating control dock (timer + transport)
// ---------------------------------------------------------------------------
function RecControlDock() {
  const r = useRecorder();
  const palette = useLivePalette();
  const isDarkMode = palette.bg === '#0F0E0C';
  const recording = r.state === 'recording';
  const dockW = 348;

  const onDragStart = (e) => {
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const p0 = r.dockPos;
    const onMove = (ev) => {
      let nx = p0.x + (ev.clientX - sx);
      let ny = p0.y + (ev.clientY - sy);
      nx = Math.max(8, Math.min(window.innerWidth - dockW - 8, nx));
      ny = Math.max(8, Math.min(window.innerHeight - 60, ny));
      r.setDockPos({ x: nx, y: ny });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const DockBtn = ({ icon: Ic, onClick, title, active, danger }) => (
    <button type="button" onClick={onClick} title={title}
      style={{
        width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer',
        backgroundColor: active ? palette.accentBg : 'transparent',
        color: active ? palette.accent : (danger ? '#DC2626' : palette.textDim),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <Ic size={15} strokeWidth={1.75} />
    </button>
  );

  return (
    <div style={{ position: 'fixed', zIndex: 1100, left: r.dockPos.x, top: r.dockPos.y }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        borderRadius: 14, backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
        boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
      }}>
        <div onMouseDown={onDragStart} style={{ cursor: 'grab', color: palette.textMute, padding: '0 4px', display: 'flex', alignItems: 'center' }}>
          <Move size={13} strokeWidth={1.75} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 8, borderRight: `1px solid ${palette.border}` }}>
          <span style={{
            width: 8, height: 8, borderRadius: 999, backgroundColor: '#DC2626',
            animation: recording ? 'recpulse 1.4s ease-in-out infinite' : 'none',
            opacity: recording ? 1 : 0.4,
          }} />
          <span style={{ fontFamily: monoFont, fontSize: 13, fontWeight: 500, color: palette.text, minWidth: 38 }}>{recFmtDur(r.elapsed)}</span>
        </div>
        <DockBtn icon={recording ? Pause : Play} onClick={recording ? r.pause : r.resume} title={recording ? 'Pause (Space)' : 'Resume (Space)'} />
        <DockBtn icon={RotateCcw} onClick={r.restart} title="Restart" />
        <DockBtn icon={r.micMuted ? MicOff : Mic} onClick={r.toggleMic} title={r.micMuted ? 'Unmute mic' : 'Mute mic'} danger={r.micMuted} />
        {r.setup.mode === 'SCREEN_CAM' && (
          <DockBtn
            icon={r.cameraBubble.hidden ? CameraOff : Camera}
            onClick={() => r.setCameraBubble((b) => ({ ...b, hidden: !b.hidden }))}
            title={r.cameraBubble.hidden ? 'Show camera' : 'Hide camera'}
            active={!r.cameraBubble.hidden}
          />
        )}
        <DockBtn icon={Trash2} onClick={r.discard} title="Discard (D)" danger />
        <button type="button" onClick={r.stop}
          style={{
            height: 30, padding: '0 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
            backgroundColor: '#DC2626', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: baseFont, fontSize: 12, fontWeight: 500,
            marginLeft: 2,
          }}>
          <Square size={11} fill="#fff" /> Stop
        </button>
      </div>
      {r.maxWarned && (
        <div style={{
          marginTop: 6, padding: '6px 12px', borderRadius: 8, textAlign: 'center',
          backgroundColor: palette.warnBg, border: `1px solid ${palette.warn}`,
        }}>
          <span style={{ fontFamily: baseFont, fontSize: 11, color: palette.warn }}>2 minutes left on this recording.</span>
        </div>
      )}
      <style>{`@keyframes recpulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.82); } }`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Processing screen
// ---------------------------------------------------------------------------
function RecProcessing() {
  const r = useRecorder();
  const palette = useLivePalette();
  const isDarkMode = palette.bg === '#0F0E0C';
  const stages = ['Uploading', 'Processing', 'Ready'];

  const [taskOptions, setTaskOptions] = useState([]);
  useEffect(() => {
    teamTasksAPI.list().then(({ data }) => {
      if (data?.success) setTaskOptions(data.tasks || []);
    }).catch(() => {});
  }, []);

  const selectStyle = {
    backgroundColor: palette.surfaceAlt, color: palette.text, fontFamily: baseFont,
    fontSize: 12.5, border: `1px solid ${palette.border}`, borderRadius: 6,
    padding: '7px 9px', outline: 'none', width: '100%',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1100,
      backgroundColor: isDarkMode ? 'rgba(15,14,12,0.9)' : 'rgba(250,249,246,0.92)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: palette.surface, width: 420, padding: '24px 28px',
        borderRadius: 12, border: `1px solid ${palette.border}`,
        boxShadow: '0 16px 50px rgba(0,0,0,0.2)',
      }}>
        <h3 style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 400, color: palette.text, letterSpacing: '-0.01em', margin: 0 }}>
          Wrapping up your <em style={{ fontStyle: 'italic', fontWeight: 300 }}>recording…</em>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 12 }}>
          {stages.map((st, i) => {
            const reached = stages.indexOf(r.processStage) >= i;
            return (
              <React.Fragment key={st}>
                <span style={{
                  fontFamily: monoFont, fontSize: 10.5, letterSpacing: '0.06em',
                  color: reached ? palette.accent : palette.textMute,
                  fontWeight: reached ? 500 : 400,
                }}>{st.toUpperCase()}</span>
                {i < 2 && <span style={{ flex: 1, height: 1, backgroundColor: stages.indexOf(r.processStage) > i ? palette.accent : palette.border }} />}
              </React.Fragment>
            );
          })}
        </div>
        {/* Percent number is rendered alongside the bar so the user always sees an exact value, even
            during the soft-easing motion. The bar itself has no CSS transition — the rAF tween in
            RecorderContext already produces a smooth 60fps motion toward the target.
            On error: bar turns red and the user gets Retry / Cancel actions. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 8, borderRadius: 999, backgroundColor: palette.surfaceAlt, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${r.processPct}%`,
              backgroundColor: r.uploadError ? '#DC2626' : palette.accent,
              borderRadius: 999,
            }} />
          </div>
          <span style={{ fontFamily: monoFont, fontSize: 13, color: r.uploadError ? '#DC2626' : palette.text, fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'right' }}>
            {Math.round(r.processPct)}%
          </span>
        </div>

        {r.uploadError && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: palette.dangerBg, border: `1px solid #DC2626` }}>
            <div style={{ fontFamily: baseFont, fontSize: 12, color: '#DC2626', fontWeight: 500, marginBottom: 4 }}>
              Upload failed
            </div>
            <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim, lineHeight: 1.5 }}>
              {r.uploadError}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={r.retryUpload}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  backgroundColor: palette.accent, color: palette.accentText,
                  fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                }}>Try again</button>
              <button type="button" onClick={r.cancelUpload}
                style={{
                  padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                  backgroundColor: 'transparent', color: palette.textDim,
                  border: `1px solid ${palette.border}`,
                  fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                }}>Discard recording</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>
            Add a title and link a task while it finishes — no need to wait.
          </div>
          <input
            autoFocus
            placeholder="Recording title…"
            value={r.draft.title}
            onChange={(e) => r.setDraft({ ...r.draft, title: e.target.value })}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6, outline: 'none',
              backgroundColor: palette.surfaceAlt, color: palette.text,
              fontFamily: baseFont, fontSize: 13, border: `1px solid ${palette.border}`,
            }}
          />
          <select
            value={r.draft.taskId || ''}
            onChange={(e) => r.setDraft({ ...r.draft, taskId: e.target.value || null })}
            style={selectStyle}
          >
            <option value="">Link a task (optional)</option>
            {taskOptions.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer — picks the right overlay based on recorder state.
// ---------------------------------------------------------------------------
export default function RecordingOverlays() {
  const r = useRecorder();
  return (
    <>
      {r.state === 'setup' && <RecSetupPanel />}
      {r.state === 'countdown' && <RecCountdown />}
      {(r.state === 'recording' || r.state === 'paused') && <RecCameraBubble />}
      {(r.state === 'recording' || r.state === 'paused') && <RecControlDock />}
      {r.state === 'processing' && <RecProcessing />}
    </>
  );
}
