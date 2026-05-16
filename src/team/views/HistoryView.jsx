import { useEffect, useMemo, useState } from 'react';
import { Check, Calendar as CalendarIcon, X as XIcon } from 'lucide-react';
import { teamReportsAPI } from '../teamAPI';
import { getCached, setCached } from '../teamCache';
import { baseFont, serifFont, monoFont, fmtMinutes } from '../theme';
import { PageHeader, Card, StatTile } from '../components/Primitives';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'lastmonth', label: 'Last month' },
];

// Today as YYYY-MM-DD, used to default the custom range pickers.
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysAgoKey(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HistoryView({ palette, currentUserId, openTask }) {
  const [period, setPeriod] = useState('month');
  // Custom range state — `active` toggles between preset and custom modes.
  const [custom, setCustom] = useState({ active: false, from: daysAgoKey(13), to: todayKey() });
  // Build a stable cache key for whichever mode is active so warmTeamCache + the view agree.
  const cacheKey = custom.active
    ? `reports:history:${currentUserId}:range:${custom.from}_${custom.to}`
    : `reports:history:${currentUserId}:${period}:`;
  // Seed from cache so the tab paints instantly on first open after login.
  const [data, setData] = useState(() => getCached(cacheKey));
  const [loading, setLoading] = useState(!getCached(cacheKey));

  useEffect(() => {
    const key = custom.active
      ? `reports:history:${currentUserId}:range:${custom.from}_${custom.to}`
      : `reports:history:${currentUserId}:${period}:`;
    const cached = getCached(key);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const params = custom.active
      ? [currentUserId, 'range', null, { from: custom.from, to: custom.to }]
      : [currentUserId, period, null];
    teamReportsAPI.employee(...params).then(({ data: res }) => {
      if (res?.success) {
        setData(res);
        setCached(key, res);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [currentUserId, period, custom.active, custom.from, custom.to]);

  const kicker = custom.active
    ? `YOUR ACTIVITY · ${new Date(custom.from + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }).toUpperCase()} – ${new Date(custom.to + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`
    : `YOUR ACTIVITY · ${
        period === 'today' ? 'TODAY'
          : period === 'week' ? 'THIS WEEK'
          : period === 'month' ? 'THIS MONTH'
          : 'LAST MONTH'
      }`;

  const completedTasks = useMemo(
    () => (data?.tasks || []).filter((t) => t.status === 'completed' && t.completedAt),
    [data]
  );

  const tasksPerDay = useMemo(() => {
    const map = {};
    completedTasks.forEach((t) => {
      const k = new Date(t.completedAt).toLocaleDateString('en-CA');
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [completedTasks]);

  // Total minutes the user was late across the period — formatted by fmtMinutes ("23m", "1h 12m").
  const lateMinutes = useMemo(
    () => (data?.days || [])
      .filter((d) => d.dsm?.status === 'late')
      .reduce((acc, d) => acc + (Number(d.dsm?.offsetMin) || 0), 0),
    [data]
  );

  const cols = '1.4fr 100px 1.6fr 90px 130px';

  const renderDsm = (dsm) => {
    if (!dsm) return <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>—</span>;
    if (dsm.status === 'on_time')
      return <span style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981', letterSpacing: '0.06em', fontWeight: 500 }}>ON TIME</span>;
    if (dsm.status === 'late')
      return (
        <span style={{ fontFamily: monoFont, fontSize: 11, color: '#DC2626', letterSpacing: '0.06em', fontWeight: 500 }}>
          LATE <span style={{ color: palette.textMute }}>({dsm.offsetMin}min)</span>
        </span>
      );
    return (
      <span style={{ fontFamily: monoFont, fontSize: 11, color: '#0E7490', letterSpacing: '0.06em', fontWeight: 500 }}>
        EARLY <span style={{ color: palette.textMute }}>({dsm.offsetMin}min)</span>
      </span>
    );
  };

  return (
    <div>
      <PageHeader kicker={kicker} title="My" accentWord="history" palette={palette} />

      <div className="team-mobile-tabbar" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-flex',
            border: `1px solid ${palette.border}`,
            backgroundColor: palette.surface,
            padding: 3,
            borderRadius: 8,
          }}
        >
          {PERIODS.map((p) => {
            const on = !custom.active && period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { setPeriod(p.id); setCustom((c) => ({ ...c, active: false })); }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  backgroundColor: on ? palette.accentBg : 'transparent',
                  color: on ? palette.accent : palette.textDim,
                  fontFamily: baseFont,
                  fontSize: 12.5,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCustom((c) => ({ ...c, active: true }))}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              backgroundColor: custom.active ? palette.accentBg : 'transparent',
              color: custom.active ? palette.accent : palette.textDim,
              fontFamily: baseFont,
              fontSize: 12.5,
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <CalendarIcon size={12} strokeWidth={1.75} />
            Custom
          </button>
        </div>

        {custom.active && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 10px', borderRadius: 8,
            backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
          }}>
            <input
              type="date"
              value={custom.from}
              max={custom.to}
              onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              style={{
                padding: '4px 6px', borderRadius: 6, outline: 'none',
                backgroundColor: palette.surfaceAlt, color: palette.text,
                fontFamily: monoFont, fontSize: 12, border: `1px solid ${palette.border}`,
              }}
            />
            <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>→</span>
            <input
              type="date"
              value={custom.to}
              min={custom.from}
              max={todayKey()}
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              style={{
                padding: '4px 6px', borderRadius: 6, outline: 'none',
                backgroundColor: palette.surfaceAlt, color: palette.text,
                fontFamily: monoFont, fontSize: 12, border: `1px solid ${palette.border}`,
              }}
            />
            <button
              type="button"
              onClick={() => setCustom({ active: false, from: daysAgoKey(13), to: todayKey() })}
              title="Exit custom range"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 2 }}
            >
              <XIcon size={13} />
            </button>
          </div>
        )}
      </div>

      {loading || !data ? (
        <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>
      ) : (
        <>
          <div
            className="team-stack-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              marginBottom: 40,
              backgroundColor: palette.border,
              border: `1px solid ${palette.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <StatTile palette={palette} label="Total active" value={`${data.summary.totalActiveHours}h`} />
            <StatTile palette={palette} label="Tasks completed" value={data.summary.completedCount} />
            <StatTile palette={palette} label="Late starts" value={lateMinutes > 0 ? fmtMinutes(lateMinutes) : '0m'} />
            <StatTile palette={palette} label="Daily avg" value={`${data.summary.avgHoursPerDay}h`} />
          </div>

          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>
            Daily breakdown
          </h3>
          <div className="team-scroll-wrap" style={{ marginBottom: 40 }}>
          <Card palette={palette} padding={0}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: cols,
                gap: 14,
                padding: '12px 20px',
                borderBottom: `1px solid ${palette.border}`,
                backgroundColor: palette.surfaceAlt,
              }}
            >
              {['DATE', 'HOURS', 'AFK', 'TASKS', `DSM${data.dsmTime ? ' · ' + data.dsmTime : ''}`].map((h) => (
                <div
                  key={h}
                  style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', fontWeight: 500 }}
                >
                  {h}
                </div>
              ))}
            </div>
            {data.days.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
                No sessions in this period yet.
              </div>
            ) : (
              data.days.map((d, i) => {
                const afkMin = Math.round((d.afkSec || 0) / 60);
                const taskCount = tasksPerDay[d.date] || 0;
                return (
                  <div
                    key={d.date + i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: cols,
                      gap: 14,
                      padding: '14px 20px',
                      alignItems: 'center',
                      borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, marginTop: 2 }}>
                        {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}
                      </div>
                    </div>
                    <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text, fontWeight: 500 }}>
                      {(d.activeSec / 3600).toFixed(1)}h
                    </div>
                    <div style={{ fontFamily: monoFont, fontSize: 13, color: afkMin ? palette.text : palette.textMute }}>
                      {afkMin ? fmtMinutes(afkMin) : '—'}
                    </div>
                    <div style={{ fontFamily: monoFont, fontSize: 13, color: taskCount ? palette.text : palette.textMute }}>
                      {taskCount}
                    </div>
                    <div>{renderDsm(d.dsm)}</div>
                  </div>
                );
              })
            )}
          </Card>
          </div>

          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>
            Tasks you completed
          </h3>
          <Card palette={palette} padding={0}>
            {completedTasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
                None yet.
              </div>
            ) : (
              completedTasks.map((t, i) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => openTask?.(t._id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    background: 'transparent',
                    cursor: openTask ? 'pointer' : 'default',
                    textAlign: 'left',
                    transition: 'background-color 120ms',
                  }}
                  onMouseEnter={(e) => { if (openTask) e.currentTarget.style.backgroundColor = palette.surfaceAlt; }}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Check size={14} style={{ color: palette.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 2 }}>
                      {new Date(t.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · est{' '}
                      <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.estMinutes)}</span> · spent{' '}
                      <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.spentMinutes)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
}
