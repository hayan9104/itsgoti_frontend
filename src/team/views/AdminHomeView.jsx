import { useEffect, useState } from 'react';
import { teamSessionsAPI, teamTasksAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, statusMeta, priorityMeta, taskStatusMeta, fmtMinutes } from '../theme';
import { Avatar, StatusPill, PageHeader, Card } from '../components/Primitives';

const STATUSES = ['working', 'break', 'afk', 'offline'];

export default function AdminHomeView({ palette, isDark, setView, setDrilldownEmployeeId }) {
  const [snapshot, setSnapshot] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');

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
  const lateToday = snapshot.filter((s) => s.wasLate);
  const movingTasks = tasks.filter((t) => t.status !== 'completed').slice(0, 5);

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
                onClick={() => {
                  setDrilldownEmployeeId(s.employee.id);
                  setView('reports');
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                    {s.wasLate && (
                      <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.danger, letterSpacing: '0.06em', fontWeight: 500 }}>
                        LATE{s.lateReason ? ' · ' + s.lateReason : ''}
                      </span>
                    )}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        <Card palette={palette}>
          <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0, marginBottom: 4 }}>
            Late today
          </h3>
          <p style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginBottom: 16 }}>
            Daily stand-up is at 10:00 AM IST.
          </p>
          {lateToday.length === 0 ? (
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>Everyone on time.</div>
          ) : (
            lateToday.map((s) => (
              <div key={s.employee.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingTop: 12, borderTop: `1px solid ${palette.border}`, marginTop: 12 }}>
                <Avatar initials={s.employee.avatar} size={28} palette={palette} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.text, fontWeight: 500 }}>{s.employee.name}</div>
                  <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 2 }}>
                    {s.lateReason || 'No reason given'}
                  </div>
                </div>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>
                  {s.startedAt ? new Date(s.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            ))
          )}
        </Card>

        <Card palette={palette}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>Tasks moving</h3>
            <button
              type="button"
              onClick={() => setView('tasks')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.accent, fontWeight: 500 }}
            >
              All tasks
            </button>
          </div>
          {movingTasks.length === 0 ? (
            <div style={{ padding: '12px 0', fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>No active tasks yet.</div>
          ) : (
            movingTasks.map((t, idx) => (
              <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: idx === 0 ? 'none' : `1px solid ${palette.border}` }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityMeta[t.priority].color }} />
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
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
