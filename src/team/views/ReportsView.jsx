import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { teamReportsAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, fmtMinutes } from '../theme';
import { Avatar, PageHeader, Card, StatTile } from '../components/Primitives';
import PeriodPicker from '../components/PeriodPicker';

function Drilldown({ palette, isDark, employeeId, onBack }) {
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    teamReportsAPI.employee(employeeId, period, date).then(({ data }) => {
      if (data?.success) setData(data);
      setLoading(false);
    });
  }, [employeeId, period, date]);

  if (loading || !data) {
    return <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          marginBottom: 20,
          fontFamily: baseFont,
          fontSize: 12.5,
          color: palette.textDim,
        }}
      >
        <ChevronLeft size={14} /> Back to reports
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16,
          paddingBottom: 24,
          borderBottom: `1px solid ${palette.border}`,
          marginBottom: 32,
        }}
      >
        <Avatar initials={data.employee.avatar} size={56} palette={palette} />
        <div>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>
            HISTORY · {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : period.toUpperCase()}
          </div>
          <h1 style={{ fontFamily: serifFont, fontSize: 32, fontWeight: 400, color: palette.text, letterSpacing: '-0.02em', margin: 0, marginTop: 6, lineHeight: 1.05 }}>
            {data.employee.name}
          </h1>
          <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 6 }}>
            {data.employee.jobTitle} · joined {new Date(data.employee.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>

      <PeriodPicker
        period={period}
        date={date}
        onChange={({ period: p, date: d }) => {
          setPeriod(p);
          setDate(d);
        }}
        palette={palette}
      />

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
        <StatTile palette={palette} label="Total hours" value={`${data.summary.totalActiveHours}h`} />
        <StatTile palette={palette} label="Tasks done" value={data.summary.completedCount} />
        <StatTile palette={palette} label="Late starts" value={data.summary.lateDays} />
        <StatTile palette={palette} label="Avg / day" value={`${data.summary.avgHoursPerDay}h`} />
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
          <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>No sessions in this period.</div>
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

      <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Past completed tasks</h3>
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
    </div>
  );
}

export default function ReportsView({ palette, isDark, drilldownEmployeeId, setDrilldownEmployeeId }) {
  const [period, setPeriod] = useState('week');
  const [date, setDate] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (p, d) => {
    setLoading(true);
    const { data } = await teamReportsAPI.overview(p, d);
    if (data?.success) setData(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!drilldownEmployeeId) fetchData(period, date);
  }, [period, date, drilldownEmployeeId]);

  if (drilldownEmployeeId) {
    return (
      <Drilldown
        palette={palette}
        isDark={isDark}
        employeeId={drilldownEmployeeId}
        onBack={() => setDrilldownEmployeeId(null)}
      />
    );
  }

  if (loading || !data) {
    return (
      <div>
        <PageHeader kicker="LIVE METRICS" title="Reports" palette={palette} />
        <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>
      </div>
    );
  }

  const maxH = Math.max(8, ...data.series.map((s) => s.hours));

  return (
    <div>
      <PageHeader
        kicker={
          date
            ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : `${data.range ? new Date(data.range.start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} – ${new Date(data.range.end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
        }
        title="Reports"
        palette={palette}
      />

      <PeriodPicker
        period={period}
        date={date}
        onChange={({ period: p, date: d }) => {
          setPeriod(p);
          setDate(d);
        }}
        palette={palette}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          marginBottom: 32,
          backgroundColor: palette.border,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <StatTile palette={palette} label="Avg daily hours" value={`${data.summary.avgDailyHours}h`} sub={`${data.summary.totalDays} sessions`} />
        <StatTile
          palette={palette}
          label="On-time rate"
          value={data.summary.onTimeRate != null ? `${data.summary.onTimeRate}%` : '—'}
          sub={`${data.summary.totalDays - data.summary.lateDays} of ${data.summary.totalDays}`}
        />
        <StatTile palette={palette} label="Tasks completed" value={data.summary.completedTasks} sub={data.summary.estAccuracy != null ? `${Math.round(data.summary.estAccuracy)}% of estimate` : ''} />
      </div>

      <Card palette={palette} padding={24} style={{ marginBottom: 28 }}>
        <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0, marginBottom: 20 }}>
          Hours by day
        </h3>
        {data.series.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>No sessions yet.</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 200 }}>
            {data.series.map((d) => (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>{d.hours}h</div>
                <div
                  style={{
                    width: '100%',
                    position: 'relative',
                    height: `${(d.hours / maxH) * 160}px`,
                    backgroundColor: palette.accent,
                    borderRadius: '4px 4px 0 0',
                    minHeight: 2,
                  }}
                >
                  {d.late > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: `${Math.min(40, d.late * 8)}%`,
                        backgroundColor: '#DC2626',
                        opacity: 0.45,
                        borderRadius: '4px 4px 0 0',
                      }}
                    />
                  )}
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${palette.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: palette.accent }} />
            <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim }}>Active hours</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#DC2626', opacity: 0.45 }} />
            <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim }}>Late starts</span>
          </div>
        </div>
      </Card>

      <Card palette={palette} padding={24}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>Per person</h3>
          <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute }}>Click any row for full history</span>
        </div>
        {data.perPerson.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>No team members yet.</div>
        ) : (
          data.perPerson.map((p, idx) => {
            const maxHours = Math.max(1, ...data.perPerson.map((x) => x.activeSec / 3600));
            const pct = Math.round((p.activeSec / 3600 / maxHours) * 100);
            return (
              <button
                type="button"
                key={p.employeeId}
                onClick={() => setDrilldownEmployeeId(p.employeeId)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 8px',
                  borderTop: idx === 0 ? 'none' : `1px solid ${palette.border}`,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Avatar initials={p.avatar} size={28} palette={palette} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 2 }}>
                    {p.days} {p.days === 1 ? 'day' : 'days'} · {p.lateDays} late
                  </div>
                </div>
                <div style={{ width: 200, height: 6, borderRadius: 3, backgroundColor: palette.surfaceAlt }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: palette.accent }} />
                </div>
                <div style={{ fontFamily: monoFont, fontSize: 12, color: palette.text, fontWeight: 500, width: 60, textAlign: 'right' }}>
                  {(p.activeSec / 3600).toFixed(1)}h
                </div>
                <ChevronRight size={14} style={{ color: palette.textMute }} />
              </button>
            );
          })
        )}
      </Card>
    </div>
  );
}
