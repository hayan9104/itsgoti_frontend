import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { baseFont, monoFont, getPalette } from '../theme';
import { recFmtDur, recThumbStyle, thumbSeedFor, resolveBlobUrl } from './recHelpers';

// Custom video player used by the watch page + public share page.
// Falls back to a "thumbnail + play" demo state if blobUrl is missing — that path
// shouldn't fire in normal operation but keeps the UI safe if a file ever goes missing.
//
// Trim handling: the underlying file is never re-encoded. When the recording has a
// trim window we clamp:
//   - the visible duration on the timeline to `trimEnd - trimStart`
//   - playback start to `trimStart`
//   - playback end to `trimEnd` (pause + reset on reaching it)
//   - seeking is expressed in trim-relative seconds (0 → trimEnd - trimStart)
export default function RecVideoPlayer({ rec, palette: paletteOverride }) {
  const palette = paletteOverride || getPalette(false);
  const vidRef = useRef(null);

  // Trim bounds — fall back to [0, fileDuration] when the recording is untrimmed.
  const trimStart = Math.max(0, Number(rec?.trimStart) || 0);
  const trimEnd = Math.max(trimStart, Number(rec?.trimEnd) || 0); // 0 means "no trim"
  const isTrimmed = trimEnd > trimStart;
  const visibleDur = isTrimmed ? (trimEnd - trimStart) : (rec?.durationSec || 0);

  const [playing, setPlaying] = useState(false);
  // `cur` is always in trim-relative seconds — i.e. what the timeline shows.
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(visibleDur);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);

  const url = resolveBlobUrl(rec?.blobUrl);
  const hasReal = !!url;
  const seed = thumbSeedFor(rec?.shareId || rec?.id || rec?._id);

  // Convert between trim-relative and absolute file time.
  const toAbs = (rel) => rel + trimStart;
  const toRel = (abs) => Math.max(0, abs - trimStart);

  const toggle = () => {
    if (hasReal && vidRef.current) {
      const v = vidRef.current;
      if (v.paused) {
        // If we're sitting at the end of the trimmed range, start over.
        if (isTrimmed && (v.currentTime >= trimEnd - 0.05 || v.currentTime < trimStart)) {
          v.currentTime = trimStart;
        } else if (!isTrimmed && v.ended) {
          v.currentTime = 0;
        }
        v.play();
        setPlaying(true);
      } else {
        v.pause();
        setPlaying(false);
      }
    } else {
      setPlaying((p) => !p);
    }
  };
  const seek = (rel) => {
    const clamped = Math.max(0, Math.min(visibleDur || rel, rel));
    setCur(clamped);
    if (hasReal && vidRef.current) vidRef.current.currentTime = toAbs(clamped);
  };

  // Keep state in sync when the rec or its trim changes (e.g. after Save trim / Restore).
  useEffect(() => {
    setDur(visibleDur);
    setCur(0);
    if (hasReal && vidRef.current) {
      vidRef.current.currentTime = trimStart;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec?.id, trimStart, trimEnd, visibleDur]);

  // Auto-stop at trimEnd so the trimmed clip behaves like a self-contained recording.
  const onTimeUpdate = (e) => {
    const abs = e.target.currentTime || 0;
    if (isTrimmed && abs >= trimEnd) {
      e.target.pause();
      e.target.currentTime = trimEnd;
      setCur(visibleDur);
      setPlaying(false);
      return;
    }
    if (isTrimmed && abs < trimStart) {
      e.target.currentTime = trimStart;
    }
    setCur(toRel(abs));
  };

  const onLoadedMetadata = (e) => {
    // Use file's intrinsic duration only when there's no trim; otherwise the visible
    // duration is the trim window length.
    const intrinsic = e.target.duration || 0;
    setDur(isTrimmed ? (trimEnd - trimStart) : (intrinsic || rec?.durationSec || 0));
    if (isTrimmed) e.target.currentTime = trimStart;
  };

  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', backgroundColor: '#0F0E0C', border: `1px solid ${palette.border}` }}>
      <div style={{
        position: 'relative', aspectRatio: '16 / 9',
        background: recThumbStyle(seed),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasReal && (
          <video
            ref={vidRef}
            src={url}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={() => setPlaying(false)}
            muted={muted}
            playsInline
          />
        )}
        {!playing && (
          <button type="button" onClick={toggle} style={{
            position: 'relative', zIndex: 1, width: 64, height: 64, borderRadius: 999,
            backgroundColor: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer',
          }}>
            <Play size={26} color="#fff" style={{ marginLeft: 4 }} fill="#fff" />
          </button>
        )}
      </div>

      <div style={{ padding: '10px 12px', backgroundColor: palette.surface }}>
        <div
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * dur); }}
          style={{
            height: 5, borderRadius: 999, backgroundColor: palette.border,
            cursor: 'pointer', marginBottom: 8, position: 'relative',
          }}
        >
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: palette.accent, borderRadius: 999 }} />
          <div style={{
            position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%,-50%)',
            width: 11, height: 11, borderRadius: 999, backgroundColor: palette.accent,
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.text }}>
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button type="button" onClick={() => setMuted((m) => !m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textDim }}>
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <span style={{ fontFamily: monoFont, fontSize: 11.5, color: palette.textDim }}>
            {recFmtDur(cur)} / {recFmtDur(dur)}
          </span>
          {isTrimmed && (
            <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em' }}>
              TRIMMED
            </span>
          )}
          <div style={{ flex: 1 }} />
          <button type="button"
            onClick={() => {
              const opts = [0.5, 1, 1.5, 2];
              const next = opts[(opts.indexOf(speed) + 1) % opts.length];
              setSpeed(next);
              if (hasReal && vidRef.current) vidRef.current.playbackRate = next;
            }}
            style={{
              padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
              fontFamily: monoFont, fontSize: 11, color: palette.textDim,
              border: `1px solid ${palette.border}`, background: 'transparent',
            }}>{speed}×</button>
          <button type="button"
            onClick={() => { if (hasReal && vidRef.current?.requestFullscreen) vidRef.current.requestFullscreen(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textDim }}>
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
