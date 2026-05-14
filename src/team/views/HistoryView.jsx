import { useEffect, useState } from 'react';
import { Check, Clock, Coffee, Circle } from 'lucide-react';
import { teamReportsAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, fmtMinutes } from '../theme';
import { PageHeader, Card, StatTile } from '../components/Primitives';
import PeriodPicker from '../components/PeriodPicker';

function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function intervalsLine(intervals = []) {
  if (!intervals.length) return '';
  return intervals
    .map((i) => `${fmtTime(i.startedAt)}–${i.endedAt ? fmtTime(i.endedAt) : 'now'}`)
    .join(' · ');
}

export default function HistoryView({ palette, isDark, currentUserId }) {
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    teamReportsAPI.employee(currentUserId, period, date).then(({ data }) => {
      if (data?.success) setData(data);
      setLoading(false);
    });
  }, [currentUserId, period, date]);

  const kicker = date
    ? `YOUR ACTIVITY · ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`
    : `YOUR ACTIVITY · ${period.toUpperCase()}`;

  // Column widths — keep proportions in one place.
  // DATE | START | AFK | END | HOURS | DSM
  const cols = '1.3fr 90px 1.6fr 90px 80px 120px';

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

      <PeriodPicker
        period={period}
        date={date}
        onChange={({ period: p, date: d }) => {
          setPeriod(p);
          setDate(d);
        }}
        palette={palette}
      />

      {loading || !data ? (
        <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 1,
              marginBottom: 32,
              backgroundColor: palette.border,
              border: `1px solid ${palette.border}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            <StatTile palette={palette} label="Total active" value={`${data.summary.totalActiveHours}h`} />
            <StatTile palette={palette} label="Tasks completed" value={data.summary.completedCount} />
            <StatTile palette={palette} label="Total break" value={`${data.summary.totalBreakHours ?? 0}h`} />
            <StatTile palette={palette} label="Daily avg" value={`${data.summary.avgHoursPerDay}h`} />
          </div>

          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Daily breakdown</h3>
          <Card palette={palette} padding={0} style={{ marginBottom: 28 }}>
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
              {['DATE', 'START', 'AFK', 'END', 'HOURS', `DSM${data.dsmTime ? ' · ' + data.dsmTime : ''}`].map((h) => (
                <div key={h} style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', fontWeight: 500 }}>
                  {h}
                </div>
              ))}
            </div>
            {data.days.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
                No sessions in this period yet.
              </div>
            ) : (
              data.days.map((d, i) => (
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
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, marginTop: 2 }}>
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}
                    </div>
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>{fmtTime(d.startedAt)}</div>
                  <div>
                    <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>{fmtMinutes(Math.round(d.afkSec / 60))}</div>
                    {d.afkPeriods?.length ? (
                      <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, marginTop: 3, lineHeight: 1.4 }}>
                        {intervalsLine(d.afkPeriods)}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 13, color: d.endedAt ? palette.text : palette.textMute }}>{d.endedAt ? fmtTime(d.endedAt) : '—'}</div>
                  <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text, fontWeight: 500 }}>{(d.activeSec / 3600).toFixed(1)}h</div>
                  <div>{renderDsm(d.dsm)}</div>
                </div>
              ))
            )}
          </Card>

          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>
            Tasks you completed
          </h3>
          <Card palette={palette} padding={0}>
            {data.completedTasks.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>None yet.</div>
            ) : (
              data.completedTasks.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                  }}
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
                </div>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
}
