import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { teamReportsAPI } from '../teamAPI';
import { getCached, setCached, prefetch } from '../teamCache';
import { baseFont, serifFont, monoFont, fmtMinutes, priorityMeta, taskStatusMeta } from '../theme';
import { Avatar, PageHeader, Card, StatTile, SolidButton } from '../components/Primitives';
import PeriodPicker from '../components/PeriodPicker';
import TimelineLog from '../components/TimelineLog';
import TaskTooltip from '../components/TaskTooltip';
import StatusFilterDropdown from '../components/StatusFilterDropdown';
import HoursByDayChart from '../components/HoursByDayChart';
import GenerateReportModal from '../components/GenerateReportModal';

function Drilldown({ palette, isDark, employeeId, onBack, openTask }) {
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);
  const hoverTimer = useRef(null);
  const [statusFilter, setStatusFilter] = useState([]); // empty = all
  const [reportOpen, setReportOpen] = useState(false);

  const showHover = (task, anchor) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHover({ task, anchor }), 350);
  };
  const hideHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHover(null);
  };

  useEffect(() => {
    const key = `reports:employee:${employeeId}:${period}:${date || ''}`;
    const cached = getCached(key);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    teamReportsAPI.employee(employeeId, period, date).then(({ data }) => {
      if (data?.success) {
        setData(data);
        setCached(key, data);
      }
      setLoading(false);
    });
    // Prefetch other common periods in the background so toggling is instant.
    if (!date) {
      ['week', 'month', 'lastmonth', 'year'].forEach((p) => {
        if (p === period) return;
        const k = `reports:employee:${employeeId}:${p}:`;
        prefetch(k, () => teamReportsAPI.employee(employeeId, p));
      });
    }
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
        <div style={{ flex: 1, minWidth: 0 }}>
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
        <SolidButton onClick={() => setReportOpen(true)} palette={palette} icon={FileText}>
          Generate report
        </SolidButton>
      </div>

      <GenerateReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        palette={palette}
        showPeoplePicker={false}
        fixedEmployeeIds={[employeeId]}
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
        className="team-stack-grid"
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
        <StatTile palette={palette} label="Total break" value={`${data.summary.totalBreakHours ?? 0}h`} />
        <StatTile palette={palette} label="Avg / day" value={`${data.summary.avgHoursPerDay}h`} />
      </div>

      {/* Per-employee Hours by day chart — same component as the admin overview */}
      {(data.series || []).length > 0 && (
        <HoursByDayChart palette={palette} series={data.series} accent={palette.accent} title={`Hours by day · ${data.employee.name}`} />
      )}

      {/* Day timeline — only when viewing a single day */}
      {(period === 'today' || period === 'day') && data.days.length > 0 && (
        <>
          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>
            Day timeline
            <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, fontWeight: 400, letterSpacing: '0.06em', marginLeft: 10 }}>
              {new Date(data.days[0].date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
          </h3>
          <Card palette={palette} padding={20} style={{ marginBottom: 28 }}>
            <TimelineLog palette={palette} session={data.days[0]} emptyHint="No activity recorded for this day." />
          </Card>
        </>
      )}

      <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>Daily breakdown</h3>
      <div className="team-scroll-wrap" style={{ marginBottom: 28 }}>
      <Card palette={palette} padding={0}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.3fr 90px 1.6fr 90px 80px 120px',
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
          <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>No sessions in this period.</div>
        ) : (
          data.days.map((d, i) => (
            <div
              key={d.date + i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 90px 1.6fr 90px 80px 120px',
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
              <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>
                {d.startedAt ? new Date(d.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
              </div>
              <div>
                <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>{Math.round(d.afkSec / 60)}m</div>
                {d.afkPeriods?.length ? (
                  <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, marginTop: 3, lineHeight: 1.4 }}>
                    {d.afkPeriods
                      .map((a) => `${new Date(a.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}–${a.endedAt ? new Date(a.endedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'now'}`)
                      .join(' · ')}
                  </div>
                ) : null}
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 13, color: d.endedAt ? palette.text : palette.textMute }}>
                {d.endedAt ? new Date(d.endedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'}
              </div>
              <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text, fontWeight: 500 }}>{(d.activeSec / 3600).toFixed(1)}h</div>
              <div>
                {!d.dsm ? (
                  <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>—</span>
                ) : d.dsm.status === 'on_time' ? (
                  <span style={{ fontFamily: monoFont, fontSize: 11, color: '#10B981', letterSpacing: '0.06em', fontWeight: 500 }}>ON TIME</span>
                ) : d.dsm.status === 'late' ? (
                  <span style={{ fontFamily: monoFont, fontSize: 11, color: '#DC2626', letterSpacing: '0.06em', fontWeight: 500 }}>
                    LATE <span style={{ color: palette.textMute }}>({d.dsm.offsetMin}min)</span>
                  </span>
                ) : (
                  <span style={{ fontFamily: monoFont, fontSize: 11, color: '#0E7490', letterSpacing: '0.06em', fontWeight: 500 }}>
                    EARLY <span style={{ color: palette.textMute }}>({d.dsm.offsetMin}min)</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>
          Tasks in this period <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, fontWeight: 400, letterSpacing: '0.06em', marginLeft: 6 }}>{(data.tasks || []).length}</span>
        </h3>
        {(data.tasks || []).length > 0 && (
          <StatusFilterDropdown
            palette={palette}
            isDark={isDark}
            value={statusFilter}
            onChange={setStatusFilter}
            counts={(data.tasks || []).reduce((acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + 1;
              return acc;
            }, {})}
          />
        )}
      </div>

      <Card palette={palette} padding={0}>
        {(() => {
          const allowed = statusFilter.length === 0 || statusFilter.length === 5 ? null : new Set(statusFilter);
          const filtered = (data.tasks || []).filter((t) => !allowed || allowed.has(t.status));
          if (filtered.length === 0) {
            return (
              <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
                {(data.tasks || []).length === 0 ? 'No tasks for this period.' : 'No tasks match this filter.'}
              </div>
            );
          }
          return filtered.map((t, i) => {
            const statusM = taskStatusMeta(palette, isDark)[t.status] || {};
            const priM = priorityMeta[t.priority] || {};
            const dateLabel =
              t.status === 'completed' && t.completedAt
                ? `Done ${new Date(t.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                : `Added ${new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
            return (
              <div
                key={t._id}
                onClick={() => openTask && openTask(t._id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  hideHover();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                  cursor: openTask ? 'pointer' : 'default',
                  transition: 'background-color 120ms',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priM.color || palette.textMute, flexShrink: 0 }} />
                <div
                  style={{ flex: 1, minWidth: 0 }}
                  onMouseEnter={(e) => showHover(t, e.currentTarget.parentElement)}
                  onMouseLeave={hideHover}
                >
                  <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 2 }}>
                    {dateLabel} · est <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.estMinutes)}</span> · spent{' '}
                    <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.spentMinutes)}</span>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    backgroundColor: statusM.bg,
                    color: statusM.text,
                    fontFamily: baseFont,
                    fontSize: 11,
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {statusM.label || t.status}
                </span>
              </div>
            );
          });
        })()}
      </Card>

      {hover && (
        <TaskTooltip task={hover.task} anchor={hover.anchor} palette={palette} isDark={isDark} />
      )}
    </div>
  );
}

export default function ReportsView({ palette, isDark, drilldownEmployeeId, setDrilldownEmployeeId, openTask }) {
  const [period, setPeriod] = useState('week');
  const [date, setDate] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const fetchData = async (p, d) => {
    const key = `reports:overview:${p}:${d || ''}`;
    const cached = getCached(key);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const { data: res } = await teamReportsAPI.overview(p, d);
    if (res?.success) {
      setData(res);
      setCached(key, res);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!drilldownEmployeeId) {
      fetchData(period, date);
      // Prefetch other common period overviews so toggling between week/month/year is instant.
      if (!date) {
        ['week', 'month', 'lastmonth', 'year', 'today'].forEach((p) => {
          if (p === period) return;
          const k = `reports:overview:${p}:`;
          prefetch(k, () => teamReportsAPI.overview(p));
        });
      }
    }
  }, [period, date, drilldownEmployeeId]);

  if (drilldownEmployeeId) {
    return (
      <Drilldown
        palette={palette}
        isDark={isDark}
        employeeId={drilldownEmployeeId}
        onBack={() => setDrilldownEmployeeId(null)}
        openTask={openTask}
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
        right={
          <SolidButton onClick={() => setReportOpen(true)} palette={palette} icon={FileText}>
            Generate report
          </SolidButton>
        }
      />

      <GenerateReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        palette={palette}
        showPeoplePicker={true}
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
        className="team-stack-grid"
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
          label="Total break"
          value={`${data.summary.totalBreakHours ?? 0}h`}
          sub="across the period"
        />
        <StatTile palette={palette} label="Tasks completed" value={data.summary.completedTasks} sub={data.summary.estAccuracy != null ? `${Math.round(data.summary.estAccuracy)}% of estimate` : ''} />
      </div>

      <HoursByDayChart palette={palette} series={data.series} accent={palette.accent} />

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
                className="team-per-person-row"
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
                {/*
                  Children (in order — referenced by .team-per-person-row CSS via nth-child):
                    1) Avatar
                    2) Name span (contains nested sessions for desktop)
                    3) Bar
                    4) Hours
                    5) Chevron
                    6) Mobile-only sessions span (hidden on desktop)
                */}
                <Avatar initials={p.avatar} size={28} palette={palette} />
                <span style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500, minWidth: 0 }}>
                  {p.name}
                  <span className="team-per-person-desktop-sessions" style={{ display: 'block', fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, fontWeight: 400, marginTop: 2 }}>
                    {p.days} {p.days === 1 ? 'session' : 'sessions'}
                  </span>
                </span>
                <div style={{ width: 200, height: 6, borderRadius: 3, backgroundColor: palette.surfaceAlt }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: palette.accent }} />
                </div>
                <div style={{ fontFamily: monoFont, fontSize: 12, color: palette.text, fontWeight: 500, width: 60, textAlign: 'right' }}>
                  {(p.activeSec / 3600).toFixed(1)}h
                </div>
                <ChevronRight size={14} style={{ color: palette.textMute }} />
                <span className="team-per-person-mobile-sessions" style={{ display: 'none', fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>
                  {p.days} {p.days === 1 ? 'session' : 'sessions'}
                </span>
              </button>
            );
          })
        )}
      </Card>
    </div>
  );
}
