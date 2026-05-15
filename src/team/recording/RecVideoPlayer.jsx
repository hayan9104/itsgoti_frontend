import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { baseFont, monoFont, getPalette } from '../theme';
import { recFmtDur, recThumbStyle, thumbSeedFor, resolveBlobUrl } from './recHelpers';

// Custom video player used by the watch page + public share page.
// Falls back to a "thumbnail + play" demo state if blobUrl is missing — that path
// shouldn't fire in normal operation but keeps the UI safe if a file ever goes missing.

export default function RecVideoPlayer({ rec, palette: paletteOverride }) {
  const palette = paletteOverride || getPalette(false);
  const vidRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(rec?.durationSec || 0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);

  const url = resolveBlobUrl(rec?.blobUrl);
  const hasReal = !!url;
  const seed = thumbSeedFor(rec?.shareId || rec?.id || rec?._id);

  const toggle = () => {
    if (hasReal && vidRef.current) {
      if (vidRef.current.paused) { vidRef.current.play(); setPlaying(true); }
      else { vidRef.current.pause(); setPlaying(false); }
    } else {
      setPlaying((p) => !p);
    }
  };
  const seek = (val) => {
    setCur(val);
    if (hasReal && vidRef.current) vidRef.current.currentTime = val;
  };

  // Keep durations in sync if the rec prop's durationSec changes after a trim.
  useEffect(() => { setDur(rec?.durationSec || 0); }, [rec?.durationSec]);

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
            onTimeUpdate={(e) => setCur(e.target.currentTime)}
            onLoadedMetadata={(e) => setDur(e.target.duration || rec?.durationSec || 0)}
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
