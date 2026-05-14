import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { teamReportsAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, fmtMinutes } from '../theme';
import { PageHeader, Card, StatTile } from '../components/Primitives';
import PeriodPicker from '../components/PeriodPicker';

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
            <StatTile palette={palette} label="Late starts" value={data.summary.lateDays} />
            <StatTile palette={palette} label="Daily avg" value={`${data.summary.avgHoursPerDay}h`} />
          </div>

          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Daily breakdown</h3>
          <Card palette={palette} padding={0} style={{ marginBottom: 28 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
                gap: 16,
                padding: '12px 20px',
                borderBottom: `1px solid ${palette.border}`,
                backgroundColor: palette.surfaceAlt,
              }}
            >
              {['DATE', 'HOURS', 'BREAK', 'AFK', 'DSM'].map((h) => (
                <div key={h} style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', fontWeight: 500 }}>
                  {h}
                </div>
              ))}
            </div>
            {data.days.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
                No sessions in this period yet.
              </div>
            ) : (
              data.days.map((d, i) => (
                <div
                  key={d.date + i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr',
                    gap: 16,
                    padding: '12px 20px',
                    borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute, marginTop: 2 }}>
                      {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                    </div>
                  </div>
                  <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>{(d.activeSec / 3600).toFixed(1)}h</div>
                  <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.textDim }}>{Math.round(d.breakSec / 60)}m</div>
                  <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.textDim }}>{Math.round(d.afkSec / 60)}m</div>
                  <div>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        fontWeight: 500,
                        color: d.wasLate ? palette.danger : '#10B981',
                      }}
                    >
                      {d.wasLate ? 'LATE' : 'ON TIME'}
                    </span>
                  </div>
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
