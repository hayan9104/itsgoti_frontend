import { useEffect, useState } from 'react';
import { Play, Coffee, Circle } from 'lucide-react';
import { teamSessionsAPI, teamTasksAPI, teamReportsAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, fmtClock, fmtMinutes, priorityMeta } from '../theme';
import { PageHeader, Card, StatusPill, SolidButton, GhostButton, Modal, StatTile } from '../components/Primitives';

const AFK_PRESETS = ['Lunch', 'Personal call', 'Outside work', 'Prayer'];

export default function EmployeeHomeView({ palette, isDark, user, setView }) {
  const [session, setSession] = useState(null);
  const [tick, setTick] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [afkOpen, setAfkOpen] = useState(false);
  const [afkReason, setAfkReason] = useState('');
  const [endOpen, setEndOpen] = useState(false);

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
  }, []);

  // Live ticking — only updates the displayed elapsed time
  useEffect(() => {
    if (!session) return;
    if (session.status === 'ended') return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  const callApi = async (fn) => {
    setBusy(true);
    try {
      const { data } = await fn();
      if (data?.success) setSession(data.session);
    } finally {
      setBusy(false);
    }
  };

  const baseSec = (() => {
    if (!session) return 0;
    if (session.status === 'ended') return session.totals.activeSec;
    const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
    return Math.max(0, elapsed - session.totals.breakSec - session.totals.afkSec);
  })();
  const liveActiveSec = session && session.status === 'working' ? baseSec + tick : baseSec;

  const liveBreakSec = (() => {
    if (!session) return 0;
    let extra = 0;
    if (session.status === 'break') {
      const open = session.breaks[session.breaks.length - 1];
      if (open && !open.endedAt) extra = Math.floor((Date.now() - new Date(open.startedAt).getTime()) / 1000);
    }
    return session.totals.breakSec + (session.status === 'break' ? extra : 0);
  })();

  const liveAfkSec = (() => {
    if (!session) return 0;
    let extra = 0;
    if (session.status === 'afk') {
      const open = session.afkPeriods[session.afkPeriods.length - 1];
      if (open && !open.endedAt) extra = Math.floor((Date.now() - new Date(open.startedAt).getTime()) / 1000);
    }
    return session.totals.afkSec + (session.status === 'afk' ? extra : 0);
  })();

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

      {/* Tracker */}
      <Card palette={palette} padding={32} style={{ marginBottom: 32 }}>
        {!session && !loading && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontFamily: serifFont, fontSize: 22, color: palette.textDim, marginBottom: 22 }}>
              Ready to start your day?
            </div>
            <SolidButton onClick={() => callApi(teamSessionsAPI.startDay)} icon={Play} palette={palette} disabled={busy}>
              Start day
            </SolidButton>
            <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textMute, marginTop: 14 }}>
              Daily stand-up at 10:00 AM IST.
            </div>
          </div>
        )}

        {session && session.status !== 'ended' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>
                  {session.status === 'working'
                    ? 'ACTIVE · STARTED ' + new Date(session.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : session.status === 'break'
                    ? 'ON BREAK'
                    : 'AFK'}
                </div>
                <div
                  style={{
                    fontFamily: monoFont,
                    fontSize: 64,
                    fontWeight: 400,
                    color: palette.text,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    marginTop: 8,
                  }}
                >
                  {fmtClock(liveActiveSec)}
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 8 }}>
                  Break <span style={{ fontFamily: monoFont, color: palette.text }}>{fmtClock(liveBreakSec)}</span>
                  <span style={{ marginInline: 10, color: palette.textMute }}>·</span>
                  AFK <span style={{ fontFamily: monoFont, color: palette.text }}>{fmtClock(liveAfkSec)}</span>
                </div>
              </div>
              <StatusPill status={session.status} palette={palette} isDark={isDark} />
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {session.status === 'break' ? (
                <GhostButton onClick={() => callApi(teamSessionsAPI.endBreak)} icon={Play} palette={palette} disabled={busy}>
                  Resume work
                </GhostButton>
              ) : session.status === 'afk' ? (
                <GhostButton onClick={() => callApi(teamSessionsAPI.endAfk)} icon={Play} palette={palette} disabled={busy}>
                  Back to work
                </GhostButton>
              ) : (
                <>
                  <GhostButton onClick={() => callApi(teamSessionsAPI.startBreak)} icon={Coffee} palette={palette} disabled={busy}>
                    Start break
                  </GhostButton>
                  <GhostButton onClick={() => setAfkOpen(true)} icon={Circle} palette={palette} disabled={busy}>
                    Mark AFK
                  </GhostButton>
                </>
              )}
              <button
                type="button"
                onClick={() => setEndOpen(true)}
                disabled={busy}
                style={{
                  marginLeft: 'auto',
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: `1px solid ${palette.border}`,
                  color: palette.textDim,
                  fontFamily: baseFont,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                End day
              </button>
            </div>
          </div>
        )}

        {session && session.status === 'ended' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontFamily: serifFont, fontSize: 22, color: palette.text, marginBottom: 6 }}>
              Day wrapped. <em style={{ fontStyle: 'italic' }}>Good work.</em>
            </div>
            <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.textDim }}>
              {fmtClock(session.totals.activeSec)} active · {fmtClock(session.totals.breakSec)} break
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
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
          label="On-time DSMs"
          value={(stats?.totalDays ?? 0) - (stats?.lateDays ?? 0)}
          sub={`of ${stats?.totalDays ?? 0}`}
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

      {/* End-day confirm */}
      <Modal open={endOpen} onClose={() => setEndOpen(false)} title="End your day?" palette={palette} width={420}>
        <div style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.textDim, marginBottom: 18 }}>
          Once you end the day, the timer stops and the session is closed. You can start a fresh session tomorrow.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <GhostButton onClick={() => setEndOpen(false)} palette={palette}>
            Cancel
          </GhostButton>
          <SolidButton
            palette={palette}
            disabled={busy}
            onClick={async () => {
              await callApi(teamSessionsAPI.endDay);
              setEndOpen(false);
            }}
          >
            End day
          </SolidButton>
        </div>
      </Modal>
    </div>
  );
}
