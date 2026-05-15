import { useEffect, useRef, useState } from 'react';
import { Play, Copy, Check, Star, CheckSquare } from 'lucide-react';
import { Avatar } from '../components/Primitives';
import { baseFont, monoFont } from '../theme';
import { recFmtDur, recRelTime, recThumbStyle, thumbSeedFor, visMeta } from './recHelpers';

// Single recording tile used in the library grid. Owner-aware: shows author chip on the
// team-view tab, hides redundant chips on "my" tab.

export default function RecordingCard({ rec, palette, scope, currentUserId, onOpen, onCopyLink, onStar, onDelete, onRename, taskTitleById }) {
  const [hover, setHover] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const V = visMeta[rec.visibility] || visMeta.PRIVATE;
  const isOwner = String(rec.ownerId) === String(currentUserId);
  const seed = thumbSeedFor(rec.shareId || rec.id);
  const task = rec.taskId ? taskTitleById?.(rec.taskId) : null;

  // Close the ⋯ menu when the user clicks anywhere outside it (or presses Escape).
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleCopy = (e) => {
    e.stopPropagation();
    onCopyLink?.(rec.shareId);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 10, backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
        overflow: 'visible', position: 'relative',
      }}>
      <div onClick={() => onOpen?.(rec)} style={{ cursor: 'pointer' }}>
        <div style={{
          height: 132, borderRadius: '10px 10px 0 0',
          background: recThumbStyle(seed),
          position: 'relative', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
            <Play size={16} color="#fff" style={{ marginLeft: 2 }} fill="#fff" />
          </div>
          {rec.captureMode === 'SCREEN_CAM' && (
            <div style={{ position: 'absolute', bottom: 8, left: 8, width: 26, height: 26, borderRadius: 999, background: recThumbStyle(seed + 2), border: '2px solid rgba(255,255,255,0.7)' }} />
          )}
          <span style={{
            position: 'absolute', bottom: 7, right: 7,
            fontFamily: monoFont, fontSize: 10.5, color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.55)', padding: '1px 5px', borderRadius: 4,
          }}>{recFmtDur(rec.durationSec)}</span>
          {hover && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '10px 10px 0 0',
            }}>
              <button type="button" onClick={handleCopy}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  backgroundColor: palette.surface, color: palette.text,
                  fontFamily: baseFont, fontSize: 11.5, fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                {linkCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onOpen?.(rec); }}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  backgroundColor: palette.accent, color: palette.accentText,
                  fontFamily: baseFont, fontSize: 11.5, fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}>
                <Play size={12} /> Open
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onOpen?.(rec)}>
            <div style={{ fontFamily: baseFont, fontSize: 13.5, fontWeight: 500, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rec.title}
            </div>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: '0 2px', fontSize: 15, flexShrink: 0 }}>⋯</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>
          <span>{recRelTime(rec.createdAt)}</span>
          <span>·</span>
          <span>{rec.viewCount} {rec.viewCount === 1 ? 'view' : 'views'}</span>
          {rec.starred && <Star size={11} color={palette.accent} fill={palette.accent} />}
        </div>
        {(task || scope === 'team') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {scope === 'team' && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: baseFont, fontSize: 10.5, color: palette.textDim }}>
                <Avatar initials={rec.ownerAvatar || (rec.ownerName ? rec.ownerName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : '?')} size={16} palette={palette} />
                {rec.ownerName}
              </span>
            )}
            {task && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 6px', borderRadius: 4,
                backgroundColor: palette.accentBg, color: palette.accent,
                fontFamily: baseFont, fontSize: 10, fontWeight: 500,
              }}>
                <CheckSquare size={9} /> {task.length > 24 ? task.slice(0, 24) + '…' : task}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: baseFont, fontSize: 10, color: palette.textMute }}>
              <V.icon size={9} /> {V.short}
            </span>
          </div>
        )}
      </div>

      {menuOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', zIndex: 20, top: 148, right: 10, minWidth: 150,
            borderRadius: 8, padding: '4px 0',
            backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
            boxShadow: '0 6px 20px rgba(0,0,0,0.16)',
          }}
        >
          <MenuItem palette={palette} label="Open" onClick={() => { setMenuOpen(false); onOpen?.(rec); }} />
          {isOwner && <MenuItem palette={palette} label="Rename" onClick={() => { setMenuOpen(false); onRename?.(rec); }} />}
          <MenuItem palette={palette} label={rec.starred ? 'Unstar' : 'Star'} onClick={() => { setMenuOpen(false); onStar?.(rec); }} />
          <MenuItem palette={palette} label="Copy link" onClick={() => { setMenuOpen(false); onCopyLink?.(rec.shareId); }} />
          {isOwner && <MenuItem palette={palette} label="Delete" danger onClick={() => { setMenuOpen(false); onDelete?.(rec); }} />}
        </div>
      )}
    </div>
  );
}

function MenuItem({ palette, label, onClick, danger }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none',
        background: 'none', cursor: 'pointer',
        fontFamily: baseFont, fontSize: 12, color: danger ? '#DC2626' : palette.text,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >{label}</button>
  );
}
