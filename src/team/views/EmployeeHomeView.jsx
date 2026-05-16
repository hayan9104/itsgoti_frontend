import { useEffect, useState } from 'react';
import { Play, Circle } from 'lucide-react';
import { teamSessionsAPI, teamTasksAPI, teamReportsAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, fmtMinutes, priorityMeta } from '../theme';
import { PageHeader, Card, StatusPill, SolidButton, GhostButton, Modal, StatTile } from '../components/Primitives';
import TimelineLog from '../components/TimelineLog';
import { broadcastSessionChange } from '../components/JoinEndButton';

const AFK_PRESETS = ['Lunch', 'Personal call', 'Outside work', 'Prayer'];

export default function EmployeeHomeView({ palette, isDark, user, setView, openTask }) {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [afkOpen, setAfkOpen] = useState(false);
  const [afkReason, setAfkReason] = useState('');

  const refresh = async () => {
    try {
      const [sRes, tRes, wRes] = await Promise.all([
        teamSessionsAPI.todayMe(),
        teamTasksAPI.list(),
        teamReportsAPI.myWeekly(),
      ]);
      if (sRes.data?.success) setSession(sRes.data.session);
      if (tRes.data?.success) setTasks(tRes.data.tasks || []);
      if (wRes.data?.success) setStats(wRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener('team-session-change', onChange);
    return () => window.removeEventListener('team-session-change', onChange);
  }, []);

  const callApi = async (fn) => {
    setBusy(true);
    try {
      const { data } = await fn();
      if (data?.success) {
        setSession(data.session);
        broadcastSessionChange();
      }
    } finally {
      setBusy(false);
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  })();

  const todayText = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const myTasks = tasks.filter((t) => t.status !== 'completed').slice(0, 4);

  return (
    <div>
      <PageHeader kicker={todayText.toUpperCase()} title={`Good ${greeting},`} accentWord={user?.name?.split(' ')[0] || ''} palette={palette} />

      {/* Tracker — compact: status + actions + today's log */}
      <Card palette={palette} padding={24} style={{ marginBottom: 32 }}>
        {!session && !loading && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontFamily: serifFont, fontSize: 22, color: palette.textDim, marginBottom: 8 }}>
              Ready to start your day?
            </div>
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute }}>
              Click <span style={{ fontWeight: 500, color: palette.text }}>Join day</span> in the top bar to clock in.
            </div>
          </div>
        )}

        {session && session.status !== 'ended' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <StatusPill status={session.status} palette={palette} isDark={isDark} />
                <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>
                  STARTED {new Date(session.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {session.status === 'afk' ? (
                  <GhostButton onClick={() => callApi(teamSessionsAPI.endAfk)} icon={Play} palette={palette} disabled={busy}>
                    Back to work
                  </GhostButton>
                ) : session.status === 'break' ? (
                  // Legacy: if someone is on a break from before the break action was removed,
                  // still let them come back to work.
                  <GhostButton onClick={() => callApi(teamSessionsAPI.endBreak)} icon={Play} palette={palette} disabled={busy}>
                    Resume work
                  </GhostButton>
                ) : (
                  <GhostButton onClick={() => setAfkOpen(true)} icon={Circle} palette={palette} disabled={busy}>
                    Mark AFK
                  </GhostButton>
                )}
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 12 }}>
                TODAY'S LOG
              </div>
              <TimelineLog palette={palette} session={session} emptyHint="No activity yet today." />
            </div>
          </div>
        )}

        {session && session.status === 'ended' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: serifFont, fontSize: 22, color: palette.text }}>
                  Day wrapped. <em style={{ fontStyle: 'italic' }}>Good work.</em>
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 4 }}>
                  {new Date(session.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' '}–{' '}
                  {new Date(session.endedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
              </div>
              <StatusPill status="ended" palette={palette} isDark={isDark} />
            </div>
            <div style={{ borderTop: `1px solid ${palette.border}`, paddingTop: 16, marginTop: 4 }}>
              <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 12 }}>
                TODAY'S LOG
              </div>
              <TimelineLog palette={palette} session={session} />
            </div>
          </div>
        )}
      </Card>

      {/* My tasks */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 500, color: palette.text, margin: 0 }}>Your tasks today</h2>
          <button
            type="button"
            onClick={() => setView('tasks')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 12.5, color: palette.accent, fontWeight: 500 }}
          >
            See all
          </button>
        </div>
        <Card palette={palette} padding={0}>
          {myTasks.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
              No active tasks. New ones will appear here.
            </div>
          ) : (
            myTasks.map((t, i) => (
              <div
                key={t._id}
                onClick={() => openTask && openTask(t._id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
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
                <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityMeta[t.priority].color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 2 }}>
                    Est <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.estMinutes)}</span> · spent{' '}
                    <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.spentMinutes)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Weekly tiles */}
      <div
        className="team-stack-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          backgroundColor: palette.border,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <StatTile palette={palette} label="This week" value={`${stats?.weekActiveHours ?? 0}h`} sub="active" />
        <StatTile
          palette={palette}
          label="Tasks done"
          value={stats?.completedTasks ?? 0}
          sub={`of ${stats?.totalAssigned ?? 0}`}
        />
        <StatTile
          palette={palette}
          label="Sessions"
          value={stats?.totalDays ?? 0}
          sub="this week"
        />
      </div>

      {/* AFK modal */}
      <Modal open={afkOpen} onClose={() => setAfkOpen(false)} title="Going AFK" palette={palette} width={420}>
        <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 14 }}>
          Quick reason — your team will see this on the dashboard.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
          {AFK_PRESETS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setAfkReason(r)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: afkReason === r ? palette.accentBg : palette.surfaceAlt,
                color: afkReason === r ? palette.accent : palette.text,
                border: `1px solid ${afkReason === r ? palette.accent : palette.border}`,
                fontFamily: baseFont,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          placeholder="Or type your own…"
          value={!AFK_PRESETS.includes(afkReason) ? afkReason : ''}
          onChange={(e) => setAfkReason(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: palette.surfaceAlt,
            border: `1px solid ${palette.border}`,
            color: palette.text,
            fontFamily: baseFont,
            fontSize: 13,
            outline: 'none',
            marginBottom: 18,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <GhostButton onClick={() => setAfkOpen(false)} palette={palette}>
            Cancel
          </GhostButton>
          <SolidButton
            palette={palette}
            disabled={busy}
            onClick={async () => {
              await callApi(() => teamSessionsAPI.startAfk(afkReason));
              setAfkOpen(false);
              setAfkReason('');
            }}
          >
            Mark AFK
          </SolidButton>
        </div>
      </Modal>

    </div>
  );
}
