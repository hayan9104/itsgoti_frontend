import { Play, Coffee, Circle, Square } from 'lucide-react';
import { baseFont, monoFont } from '../theme';

function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Build a chronological list of events from a work session.
 * Accepts either:
 *   - a "session" object from /sessions/today/me (has startedAt, endedAt, breaks, afkPeriods, status)
 *   - a "day" object from /reports/employee (same shape, no live `status`)
 */
export function buildEvents(session) {
  if (!session) return [];
  const events = [];

  if (session.startedAt) {
    events.push({ time: session.startedAt, kind: 'start', label: 'Started work day' });
  }

  for (const b of session.breaks || []) {
    if (b.startedAt) events.push({ time: b.startedAt, kind: 'break_start', label: 'Started break' });
    if (b.endedAt) events.push({ time: b.endedAt, kind: 'break_end', label: 'Resumed work after break' });
  }

  for (const a of session.afkPeriods || []) {
    if (a.startedAt) {
      const reason = (a.reason || '').trim();
      events.push({
        time: a.startedAt,
        kind: 'afk_start',
        label: reason ? `Went AFK — ${reason}` : 'Went AFK',
      });
    }
    if (a.endedAt) events.push({ time: a.endedAt, kind: 'afk_end', label: 'Resumed work after AFK' });
  }

  if (session.endedAt) {
    events.push({ time: session.endedAt, kind: 'end', label: 'Ended work day' });
  }

  events.sort((x, y) => new Date(x.time) - new Date(y.time));
  return events;
}

const KIND_META = {
  start: { color: '#10B981', icon: Play },
  break_start: { color: '#F59E0B', icon: Coffee },
  break_end: { color: '#10B981', icon: Play },
  afk_start: { color: '#A78BFA', icon: Circle },
  afk_end: { color: '#10B981', icon: Play },
  end: { color: '#6B7280', icon: Square },
};

export default function TimelineLog({ palette, session, emptyHint = 'No activity yet today.' }) {
  const events = buildEvents(session);
  if (!events.length) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: 'center',
          fontFamily: baseFont,
          fontSize: 13,
          color: palette.textMute,
        }}
      >
        {emptyHint}
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', paddingLeft: 18 }}>
      {/* Vertical guide line */}
      <div
        style={{
          position: 'absolute',
          left: 7,
          top: 12,
          bottom: 12,
          width: 1,
          backgroundColor: palette.border,
        }}
      />
      {events.map((e, i) => {
        const meta = KIND_META[e.kind] || KIND_META.start;
        const Icon = meta.icon;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '8px 0',
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: -18,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: palette.surface,
                border: `2px solid ${meta.color}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={8} strokeWidth={3} color={meta.color} />
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 13,
                color: palette.text,
                fontWeight: 500,
                minWidth: 56,
              }}
            >
              {fmtTime(e.time)}
            </span>
            <span style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text }}>
              {e.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
