import { useEffect, useState } from 'react';
import { baseFont, monoFont, serifFont } from '../theme';
import { Avatar, StatusPill } from './Primitives';
import TimelineLog from './TimelineLog';

const WIDTH = 360;
const OFFSET = 16;

export default function EmployeeDayTooltip({ snapshot, anchor, palette, isDark }) {
  const [pos, setPos] = useState(() => compute(anchor));

  useEffect(() => {
    setPos(compute(anchor));
    const onResize = () => setPos(compute(anchor));
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [anchor]);

  if (!snapshot) return null;

  // Build a session-shaped object for TimelineLog.
  const session = {
    startedAt: snapshot.startedAt,
    endedAt: snapshot.endedAt,
    breaks: snapshot.breaks || [],
    afkPeriods: snapshot.afkPeriods || [],
    status: snapshot.status,
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: WIDTH,
        zIndex: 1000,
        padding: 18,
        borderRadius: 12,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Avatar initials={snapshot.employee.avatar} size={32} palette={palette} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: serifFont, fontSize: 16, fontWeight: 500, color: palette.text }}>{snapshot.employee.name}</div>
          <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>{snapshot.employee.jobTitle}</div>
        </div>
        <StatusPill status={snapshot.status} palette={palette} isDark={isDark} />
      </div>

      <div style={{ display: 'flex', gap: 14, padding: '8px 0', marginBottom: 4, borderTop: `1px solid ${palette.border}`, borderBottom: `1px solid ${palette.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em' }}>ACTIVE</div>
          <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>
            {(snapshot.totals.activeSec / 3600).toFixed(1)}h
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em' }}>BREAK</div>
          <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>
            {Math.round((snapshot.totals.breakSec || 0) / 60)}m
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em' }}>AFK</div>
          <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>
            {Math.round((snapshot.totals.afkSec || 0) / 60)}m
          </div>
        </div>
      </div>

      <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em', marginTop: 12, marginBottom: 8 }}>
        TODAY'S LOG
      </div>
      {snapshot.status === 'offline' ? (
        <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute, padding: '8px 0' }}>
          Not joined yet today.
        </div>
      ) : (
        <TimelineLog palette={palette} session={session} />
      )}
    </div>
  );
}

function compute(anchor) {
  if (!anchor) return { top: 0, left: 0 };
  const rect = anchor.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const estimatedHeight = 380;
  const RIGHT_MARGIN = 40; // breathing room from the viewport's right edge

  // Prefer left side of the row.
  let left = rect.left - OFFSET - WIDTH;
  if (left < 8) {
    // Doesn't fit on the left → align the tooltip's right edge to the row's right edge
    // (with a small inset), so it overlays the right end of the row instead of
    // being clamped flush to the viewport border.
    left = rect.right - WIDTH - 8;
    // Make sure it still leaves a margin from the viewport edge.
    if (left + WIDTH + RIGHT_MARGIN > viewportW) {
      left = Math.max(8, viewportW - WIDTH - RIGHT_MARGIN);
    }
    if (left < 8) left = 8;
  }

  let top = rect.top;
  if (top + estimatedHeight > viewportH - 8) top = Math.max(8, viewportH - estimatedHeight - 8);
  return { top, left };
}
