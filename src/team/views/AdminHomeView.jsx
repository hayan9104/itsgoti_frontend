import { useEffect, useMemo, useRef, useState } from 'react';
import { teamSessionsAPI, teamTasksAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, statusMeta, priorityMeta, taskStatusMeta, fmtMinutes } from '../theme';
import { Avatar, StatusPill, PageHeader, Card } from '../components/Primitives';
import EmployeeDayTooltip from '../components/EmployeeDayTooltip';
import StatusFilterDropdown from '../components/StatusFilterDropdown';

const STATUSES = ['working', 'break', 'afk', 'offline'];

export default function AdminHomeView({ palette, isDark, setView, goToDrilldown, openTask }) {
  const [snapshot, setSnapshot] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [hover, setHover] = useState(null); // { snap, anchor }
  const hoverTimer = useRef(null);

  const showHover = (snap, anchor) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHover({ snap, anchor }), 350);
  };
  const hideHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHover(null);
  };

  const fetchAll = async () => {
    try {
      const [snapRes, tasksRes] = await Promise.all([teamSessionsAPI.todayAll(), teamTasksAPI.list()]);
      if (snapRes.data?.success) {
        setSnapshot(snapRes.data.snapshot || []);
        setDate(snapRes.data.date);
      }
      if (tasksRes.data?.success) setTasks(tasksRes.data.tasks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, []);

  const counts = snapshot.reduce(
    (a, s) => ({ ...a, [s.status]: (a[s.status] || 0) + 1 }),
    {}
  );
  // Status filter — default to non-completed.
  const [statusFilter, setStatusFilter] = useState(['pending', 'in_progress', 'review', 'blocked']);

  const filteredMovingTasks = useMemo(() => {
    const allowed = statusFilter.length === 0 || statusFilter.length === 5 ? null : new Set(statusFilter);
    return tasks
      .filter((t) => !allowed || allowed.has(t.status))
      .slice(0, 8);
  }, [tasks, statusFilter]);

  const taskCounts = useMemo(() => {
    return tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
  }, [tasks]);

  const todayText = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <PageHeader
        kicker={todayText.toUpperCase()}
        title="The team,"
        accentWord="today"
        palette={palette}
        right={
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>LIVE SNAPSHOT</div>
            <div style={{ fontFamily: serifFont, fontSize: 15, color: palette.textDim, marginTop: 4 }}>
              {snapshot.length} team {snapshot.length === 1 ? 'member' : 'members'}
            </div>
          </div>
        }
      />

      <div
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
        {STATUSES.map((s) => {
          const meta = statusMeta(palette, isDark)[s];
          return (
            <div key={s} style={{ padding: 22, backgroundColor: palette.surface }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: meta.dot }} />
                <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, fontWeight: 500 }}>{meta.label}</span>
              </div>
              <div style={{ fontFamily: serifFont, fontSize: 38, fontWeight: 300, color: palette.text, lineHeight: 1 }}>
                {counts[s] || 0}
                <span style={{ fontSize: 18, color: palette.textMute }}> / {snapshot.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 500, color: palette.text, margin: 0 }}>Currently</h2>
          <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.06em' }}>
            UPDATES EVERY 30s
          </span>
        </div>
        <Card palette={palette} padding={0}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>Loading…</div>
          ) : snapshot.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
              No team members yet. Add employees from the Team tab.
            </div>
          ) : (
            snapshot.map((s, i) => (
              <button
                type="button"
                key={s.employee.id}
                onClick={() => goToDrilldown(s.employee.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = palette.surfaceAlt;
                  showHover(s, e.currentTarget);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  hideHover();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 20px',
                  borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Avatar initials={s.employee.avatar} palette={palette} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
                    <span style={{ fontFamily: baseFont, fontSize: 14.5, fontWeight: 500, color: palette.text }}>{s.employee.name}</span>
                    <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute }}>· {s.employee.jobTitle}</span>
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim }}>
                    {s.status === 'offline' ? 'Not joined yet' : s.activeTask || 'No task set'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: monoFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>
                    {(s.totals.activeSec / 3600).toFixed(1)}h
                  </div>
                  <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>
                    {s.startedAt ? new Date(s.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
                <StatusPill status={s.status} palette={palette} isDark={isDark} />
              </button>
            ))
          )}
        </Card>
        <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute, marginTop: 10, textAlign: 'right' }}>
          Click any person to see their full history.
        </div>
      </div>

      <div>
        <Card palette={palette}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>Tasks moving</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusFilterDropdown
                palette={palette}
                isDark={isDark}
                value={statusFilter}
                onChange={setStatusFilter}
                counts={taskCounts}
                compact
              />
              <button
                type="button"
                onClick={() => setView('tasks')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.accent, fontWeight: 500 }}
              >
                All tasks
              </button>
            </div>
          </div>
          {filteredMovingTasks.length === 0 ? (
            <div style={{ padding: '12px 0', fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
              {tasks.length === 0 ? 'No active tasks yet.' : 'No tasks match this filter.'}
            </div>
          ) : (
            filteredMovingTasks.map((t, idx) => (
              <button
                type="button"
                key={t._id}
                onClick={() => openTask && openTask(t._id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 8px',
                  margin: '0 -8px',
                  borderTop: idx === 0 ? 'none' : `1px solid ${palette.border}`,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 120ms',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityMeta[t.priority].color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 2 }}>
                    {t.owner?.name || 'Unassigned'} · est <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.estMinutes)}</span> · spent{' '}
                    <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.spentMinutes)}</span>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    backgroundColor: taskStatusMeta(palette, isDark)[t.status].bg,
                    color: taskStatusMeta(palette, isDark)[t.status].text,
                    fontFamily: baseFont,
                    fontSize: 11,
                    fontWeight: 500,
                  }}
                >
                  {taskStatusMeta(palette, isDark)[t.status].label}
                </span>
              </button>
            ))
          )}
        </Card>
      </div>

      {hover && (
        <EmployeeDayTooltip snapshot={hover.snap} anchor={hover.anchor} palette={palette} isDark={isDark} />
      )}
    </div>
  );
}
