import { useEffect, useState } from 'react';
import { baseFont, monoFont, serifFont, priorityMeta, taskStatusMeta, fmtMinutes, fmtClock } from '../theme';

const TOOLTIP_WIDTH = 320;
const TOOLTIP_OFFSET = 16;

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Row({ label, value, palette }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '6px 0', borderBottom: `1px solid ${palette.border}` }}>
      <div
        style={{
          width: 92,
          flexShrink: 0,
          fontFamily: monoFont,
          fontSize: 10,
          color: palette.textMute,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ flex: 1, fontFamily: baseFont, fontSize: 12.5, color: palette.text, wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

export default function TaskTooltip({ task, anchor, mouse, palette, isDark }) {
  // mouse = { x, y } in viewport coords — preferred anchor (sits next to the cursor).
  // anchor = a DOMElement — legacy fallback when mouse isn't passed (e.g. drilldown view).
  const [pos, setPos] = useState(() => computePosition(mouse, anchor));
  const [tick, setTick] = useState(0); // forces live timer re-render

  useEffect(() => {
    setPos(computePosition(mouse, anchor));
    const onResize = () => setPos(computePosition(mouse, anchor));
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [mouse?.x, mouse?.y, anchor]);

  // Live tick once a second when the task is actively timing.
  useEffect(() => {
    if (!task?.inProgressSince) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [task?.inProgressSince]);

  if (!task) return null;

  const statusMeta = taskStatusMeta(palette, isDark)[task.status] || {};
  const priMeta = priorityMeta[task.priority] || {};
  let liveSpent = (task.spentMinutes || 0) * 60;
  if (task.inProgressSince) {
    liveSpent += Math.max(0, Math.floor((Date.now() - new Date(task.inProgressSince).getTime()) / 1000));
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: TOOLTIP_WIDTH,
        zIndex: 1000,
        padding: 18,
        borderRadius: 12,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: priMeta.color || palette.textMute,
            flexShrink: 0,
            marginTop: 6,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: serifFont, fontSize: 16, fontWeight: 500, color: palette.text, lineHeight: 1.25 }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 999,
                backgroundColor: statusMeta.bg,
                color: statusMeta.text,
                fontFamily: baseFont,
                fontSize: 10.5,
                fontWeight: 500,
              }}
            >
              {statusMeta.label || task.status}
            </span>
            <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em' }}>
              {(priMeta.label || task.priority || '').toUpperCase()}
            </span>
            {task.inProgressSince && (
              <span style={{ fontFamily: monoFont, fontSize: 10, color: '#10B981', letterSpacing: '0.06em' }}>
                · TIMER RUNNING
              </span>
            )}
          </div>
        </div>
      </div>

      {task.description && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            backgroundColor: palette.surfaceAlt,
            border: `1px solid ${palette.border}`,
            fontFamily: baseFont,
            fontSize: 12.5,
            color: palette.textDim,
            marginBottom: 10,
            lineHeight: 1.45,
          }}
        >
          {task.description}
        </div>
      )}

      <div>
        <Row palette={palette} label="Assignee" value={task.owner?.name || 'Unassigned'} />
        <Row palette={palette} label="Estimate" value={fmtMinutes(task.estMinutes)} />
        <Row
          palette={palette}
          label="Spent"
          value={
            <span>
              <span style={{ fontFamily: monoFont }}>{fmtMinutes(task.spentMinutes || 0)}</span>
              {task.inProgressSince && (
                <span style={{ marginLeft: 8, fontFamily: monoFont, fontSize: 11.5, color: '#10B981' }}>
                  live {fmtClock(liveSpent)}
                </span>
              )}
            </span>
          }
        />
        <Row palette={palette} label="Assigned" value={fmtDate(task.createdAt)} />
        <Row palette={palette} label="Estimated start" value={fmtDate(task.plannedStartDate)} />
        <Row palette={palette} label="Start date" value={fmtDate(task.startDate)} />
        <Row palette={palette} label="Finish date" value={fmtDate(task.finishDate)} />
        {task.dueDate && <Row palette={palette} label="Due date" value={fmtDate(task.dueDate)} />}
      </div>

      {task.attachments && task.attachments.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 8 }}>
            ATTACHMENTS · {task.attachments.length}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {task.attachments.map((a, idx) => {
              const isImg = (a.mimetype || '').startsWith('image/');
              if (isImg) {
                return (
                  <img
                    key={a.url + idx}
                    src={a.url}
                    alt={a.originalName}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: 'cover',
                      borderRadius: 6,
                      border: `1px solid ${palette.border}`,
                    }}
                  />
                );
              }
              return (
                <span
                  key={a.url + idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 8px',
                    borderRadius: 6,
                    backgroundColor: palette.surfaceAlt,
                    border: `1px solid ${palette.border}`,
                    fontFamily: baseFont,
                    fontSize: 11.5,
                    color: palette.text,
                    maxWidth: 200,
                  }}
                  title={a.originalName}
                >
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 9.5,
                      letterSpacing: '0.05em',
                      color: palette.textMute,
                    }}
                  >
                    {(a.originalName?.split('.').pop() || 'FILE').slice(0, 4).toUpperCase()}
                  </span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.originalName}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Position relative to the cursor when we have mouse coords, falling back to the row rect
// when the caller only passed a DOM anchor. The cursor variant prefers right-of-cursor and
// flips to left when there's no room — never letting the tooltip slide off-screen.
function computePosition(mouse, anchor) {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const estimatedHeight = 360;

  if (mouse && Number.isFinite(mouse.x) && Number.isFinite(mouse.y)) {
    // Horizontal: prefer right of cursor; flip to left if it would overflow.
    let left = mouse.x + TOOLTIP_OFFSET;
    if (left + TOOLTIP_WIDTH + 8 > viewportW) {
      left = mouse.x - TOOLTIP_OFFSET - TOOLTIP_WIDTH;
      if (left < 8) {
        // Neither side has room — clamp to whichever edge has more space.
        left = Math.max(8, viewportW - TOOLTIP_WIDTH - 8);
      }
    }

    // Vertical: anchor a bit above the cursor; if it would overflow the bottom, slide up.
    let top = mouse.y - 20;
    if (top + estimatedHeight + 8 > viewportH) top = Math.max(8, viewportH - estimatedHeight - 8);
    if (top < 8) top = 8;
    return { top, left };
  }

  // Legacy element-anchor fallback (used by surfaces that don't capture the mouse position).
  if (!anchor) return { top: 0, left: 0 };
  const rect = anchor.getBoundingClientRect();
  let left = rect.left - TOOLTIP_OFFSET - TOOLTIP_WIDTH;
  if (left < 8) {
    left = rect.right + TOOLTIP_OFFSET;
    if (left + TOOLTIP_WIDTH + 8 > viewportW) {
      left = Math.max(8, viewportW - TOOLTIP_WIDTH - 8);
    }
  }
  let top = rect.top;
  if (top + estimatedHeight > viewportH - 8) top = Math.max(8, viewportH - estimatedHeight - 8);
  return { top, left };
}
