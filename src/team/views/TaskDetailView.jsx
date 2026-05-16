import { useEffect, useState } from 'react';
import { ChevronLeft, Paperclip, FileText, ExternalLink, Timer, Calendar, User, MonitorPlay, Play, Activity, X, ArrowRight, Plus, ArrowDown, ArrowUp, ArchiveRestore, Archive } from 'lucide-react';
import { teamTasksAPI } from '../teamAPI';
import { teamRecordingsAPI } from '../teamRecordingAPI';
import { getCached, setCached } from '../teamCache';
import { baseFont, serifFont, monoFont, priorityMeta, taskStatusMeta, fmtMinutes, fmtClock } from '../theme';
import { Avatar, Card } from '../components/Primitives';
import { recFmtDur, recRelTime, recThumbStyle, thumbSeedFor } from '../recording/recHelpers';

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function fmtBytes(n) {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// Look up a task we already have in cache so the detail view can paint instantly.
// Two sources, in order: a dedicated detail cache, then the prefetched list.
function seedTaskFromCache(taskId) {
  const direct = getCached(`tasks:detail:${taskId}`);
  if (direct) return direct;
  const list = getCached('tasks:list');
  const found = (list?.tasks || []).find((t) => String(t._id) === String(taskId));
  return found || null;
}

export default function TaskDetailView({ palette, isDark, taskId, onBack, openRecording }) {
  // Seed from cache — the list is already prefetched on dashboard mount, so the task body
  // renders instantly. Background refetch still runs to keep timers / spent / status fresh.
  const cached = seedTaskFromCache(taskId);
  const [task, setTask] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');
  const [, setTick] = useState(0); // forces live timer
  const [logOpen, setLogOpen] = useState(false);

  // Recordings linked to this task — seeded from cache so the section paints instantly.
  const recCacheKey = `recordings:byTask:${taskId}`;
  const [recordings, setRecordings] = useState(() => getCached(recCacheKey)?.recordings || []);

  // Activity log — fetched alongside the task and cached so the modal opens instantly.
  // Re-fetches whenever the task body changes (status / spent / inProgress) since those
  // changes are exactly what generate new log entries.
  const logsCacheKey = `tasks:logs:${taskId}`;
  const [logs, setLogs] = useState(() => getCached(logsCacheKey) || null);

  const fetchLogs = async () => {
    try {
      const { data } = await teamTasksAPI.logs(taskId);
      if (data?.success) {
        setLogs(data.logs || []);
        setCached(logsCacheKey, data.logs || []);
      }
    } catch (e) { /* swallow — modal will render last known logs */ }
  };

  useEffect(() => {
    let cancelled = false;
    teamRecordingsAPI.listByTask(taskId).then(({ data }) => {
      if (cancelled || !data?.success) return;
      setRecordings(data.recordings || []);
      setCached(recCacheKey, data);
    }).catch(() => {});
    fetchLogs();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, recCacheKey]);

  // Refresh logs the moment a status/spent/timer change suggests a new entry was generated.
  useEffect(() => {
    if (!task) return;
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.status, task?.spentMinutes, task?.inProgressSince]);

  const fetchTask = async () => {
    // Don't show the global spinner if we already have a cached body on screen.
    setError('');
    try {
      const { data } = await teamTasksAPI.get(taskId);
      if (data?.success) {
        setTask(data.task);
        setCached(`tasks:detail:${taskId}`, data.task);
      } else {
        setError(data?.message || 'Task not found');
      }
    } catch (err) {
      // Soft-fail when we have cached data — keep showing it, log the error to console only.
      if (!task) setError(err?.response?.data?.message || 'Could not load task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (!task?.inProgressSince) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [task?.inProgressSince]);

  if (loading) {
    return (
      <div>
        <BackBar onBack={onBack} palette={palette} />
        <div style={{ padding: 60, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div>
        <BackBar onBack={onBack} palette={palette} />
        <div style={{ padding: 60, textAlign: 'center', color: palette.danger, fontFamily: baseFont, fontSize: 13.5 }}>
          {error || 'Task not available.'}
        </div>
      </div>
    );
  }

  const statusM = taskStatusMeta(palette, isDark)[task.status] || {};
  const priM = priorityMeta[task.priority] || {};
  let liveSpentSec = (task.spentMinutes || 0) * 60;
  if (task.inProgressSince) {
    liveSpentSec += Math.max(0, Math.floor((Date.now() - new Date(task.inProgressSince).getTime()) / 1000));
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BackBar onBack={onBack} palette={palette} />
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          title="View activity log"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
            backgroundColor: palette.surface, color: palette.text,
            border: `1px solid ${palette.border}`,
            fontFamily: baseFont, fontSize: 12.5, fontWeight: 500,
          }}
        >
          <Activity size={12} /> Log
        </button>
      </div>

      {/* Header */}
      <div style={{ paddingBottom: 24, borderBottom: `1px solid ${palette.border}`, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 999,
              backgroundColor: statusM.bg,
              color: statusM.text,
              fontFamily: baseFont,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {statusM.label || task.status}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priM.color || palette.textMute }} />
            {priM.label || task.priority} priority
          </span>
          {task.inProgressSince && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: monoFont, fontSize: 11, color: '#10B981', letterSpacing: '0.06em' }}>
              <Timer size={11} /> TIMER RUNNING
            </span>
          )}
        </div>
        <h1 style={{ fontFamily: serifFont, fontSize: 36, fontWeight: 400, color: palette.text, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
          {task.title}
        </h1>
      </div>

      {/* Description */}
      {task.description && (
        <Card palette={palette} padding={20} style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 8 }}>
            DESCRIPTION
          </div>
          <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {task.description}
          </div>
        </Card>
      )}

      {/* Meta grid */}
      <div
        className="team-stack-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card palette={palette} padding={20}>
          <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 12 }}>
            ASSIGNEE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={task.owner?.avatar || '?'} size={40} palette={palette} />
            <div>
              <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>
                {task.owner?.name || 'Unassigned'}
              </div>
              {task.owner?.jobTitle && (
                <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 2 }}>
                  {task.owner.jobTitle}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card palette={palette} padding={20}>
          <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', marginBottom: 12 }}>
            TIME
          </div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>Estimated</div>
              <div style={{ fontFamily: monoFont, fontSize: 18, color: palette.text, fontWeight: 500, marginTop: 4 }}>
                {fmtMinutes(task.estMinutes) || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>Spent</div>
              <div style={{ fontFamily: monoFont, fontSize: 18, color: palette.text, fontWeight: 500, marginTop: 4 }}>
                {task.inProgressSince ? fmtClock(liveSpentSec) : fmtMinutes(task.spentMinutes || 0) || '0m'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Dates */}
      <Card palette={palette} padding={0} style={{ marginBottom: 24 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${palette.border}`, fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', backgroundColor: palette.surfaceAlt }}>
          DATES
        </div>
        <DateRow palette={palette} label="Assigned on" value={fmtDateTime(task.createdAt)} />
        <DateRow palette={palette} label="Estimated start" value={fmtDate(task.plannedStartDate)} />
        <DateRow palette={palette} label="Start date" value={fmtDateTime(task.startDate)} />
        {task.dueDate && <DateRow palette={palette} label="Due date" value={fmtDate(task.dueDate)} />}
        {task.completedAt && <DateRow palette={palette} label="Completed at" value={fmtDateTime(task.completedAt)} />}
      </Card>

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <Card palette={palette} padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Paperclip size={14} style={{ color: palette.textMute }} />
              <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>
                ATTACHMENTS · {task.attachments.length}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {task.attachments.map((a, idx) => {
              const isImg = (a.mimetype || '').startsWith('image/');
              return (
                <a
                  key={a.url + idx}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    borderRadius: 10,
                    border: `1px solid ${palette.border}`,
                    backgroundColor: palette.surface,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: palette.text,
                    transition: 'border-color 120ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = palette.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = palette.border)}
                >
                  {isImg ? (
                    <img
                      src={a.url}
                      alt={a.originalName}
                      style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 110,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: palette.surfaceAlt,
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <FileText size={28} style={{ color: palette.textMute }} />
                        <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, marginTop: 6, letterSpacing: '0.06em' }}>
                          {(a.originalName?.split('.').pop() || 'FILE').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '8px 10px' }}>
                    <div
                      style={{
                        fontFamily: baseFont,
                        fontSize: 12.5,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={a.originalName}
                    >
                      {a.originalName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute }}>{fmtBytes(a.size)}</span>
                      <ExternalLink size={11} style={{ color: palette.textMute }} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recordings linked to this task */}
      {recordings.length > 0 && (
        <Card palette={palette} padding={20} style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <MonitorPlay size={14} color={palette.textDim} />
              <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em' }}>
                RECORDINGS · {recordings.length}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {recordings.map((rec) => {
              const seed = thumbSeedFor(rec.shareId || rec.id);
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => openRecording?.(rec.id)}
                  style={{
                    textAlign: 'left', cursor: 'pointer', padding: 0,
                    border: `1px solid ${palette.border}`, borderRadius: 10,
                    backgroundColor: palette.surface, overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = palette.accent)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = palette.border)}
                >
                  <div style={{
                    height: 96, position: 'relative',
                    background: recThumbStyle(seed),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
                      <Play size={13} color="#fff" style={{ marginLeft: 2 }} fill="#fff" />
                    </div>
                    <span style={{ position: 'absolute', bottom: 6, right: 6, fontFamily: monoFont, fontSize: 10, color: '#fff', backgroundColor: 'rgba(0,0,0,0.55)', padding: '1px 5px', borderRadius: 4 }}>
                      {recFmtDur(rec.durationSec)}
                    </span>
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontFamily: baseFont, fontSize: 13, fontWeight: 500, color: palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rec.title}
                    </div>
                    <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, marginTop: 2 }}>
                      {rec.ownerName} · {recRelTime(rec.createdAt)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {logOpen && (
        <TaskLogModal taskId={taskId} logs={logs} palette={palette} isDark={isDark} onClose={() => setLogOpen(false)} />
      )}
    </div>
  );
}

// ---- Activity log modal ----
// Logs come in via prop (already fetched + cached by the parent) so the modal opens with
// data on screen. A silent background refresh keeps it current — never showing a spinner
// once we have any logs cached.
function TaskLogModal({ taskId, logs: logsFromProp, palette, isDark, onClose }) {
  const [logs, setLogs] = useState(logsFromProp || getCached(`tasks:logs:${taskId}`) || null);
  const [error, setError] = useState('');

  // Keep in sync when the parent's prop changes (e.g. status flipped while modal open).
  useEffect(() => {
    if (logsFromProp) setLogs(logsFromProp);
  }, [logsFromProp]);

  useEffect(() => {
    let cancelled = false;
    teamTasksAPI.logs(taskId)
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.success) {
          setLogs(data.logs || []);
          setCached(`tasks:logs:${taskId}`, data.logs || []);
        } else if (!logs) {
          setError(data?.message || 'Activity log endpoint did not respond as expected. Restart the backend so the new route is registered.');
          setLogs([]);
        }
      })
      .catch((err) => {
        if (cancelled || logs) return;
        const status = err?.response?.status;
        const msg = err?.response?.data?.message
          || (status === 404 ? 'Activity log route not found — restart the backend.' : 'Could not load activity');
        setError(msg);
        setLogs([]);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 60, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
          borderRadius: 14, width: '100%', maxWidth: 540, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${palette.border}` }}>
          <div>
            <h3 style={{ fontFamily: serifFont, fontSize: 19, fontWeight: 500, color: palette.text, margin: 0 }}>
              Activity log
            </h3>
            <div style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.06em', marginTop: 4, textTransform: 'uppercase' }}>
              EVERY STATUS CHANGE · MOST RECENT FIRST
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ color: palette.textMute, border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '14px 22px' }}>
          {error && (
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.danger, padding: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}
          {!error && logs === null && (
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute, padding: 16, textAlign: 'center' }}>
              Loading…
            </div>
          )}
          {!error && logs && logs.length === 0 && (
            <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textMute, padding: 24, textAlign: 'center' }}>
              No activity yet.
            </div>
          )}
          {!error && logs && logs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {logs.map((l, i) => (
                <LogRow key={l._id} log={l} palette={palette} isDark={isDark} isLast={i === logs.length - 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogRow({ log, palette, isDark, isLast }) {
  const meta = logMeta(log, palette, isDark);
  const when = new Date(log.createdAt);
  const whenStr = when.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: isLast ? 0 : 14, position: 'relative' }}>
      {/* timeline rail */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 999,
          backgroundColor: meta.bg, color: meta.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <meta.Icon size={12} strokeWidth={2} />
        </div>
        {!isLast && <div style={{ flex: 1, width: 1, backgroundColor: palette.border, marginTop: 4 }} />}
      </div>
      <div style={{ flex: 1, paddingTop: 1 }}>
        <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.text, fontWeight: 500 }}>
          {meta.label}
        </div>
        {meta.detail && (
          <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, marginTop: 2 }}>
            {meta.detail}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          {log.actor && (
            <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>
              by <span style={{ color: palette.textDim, fontWeight: 500 }}>{log.actor.name}</span>
            </span>
          )}
          <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.04em' }}>
            · {whenStr}
          </span>
        </div>
      </div>
    </div>
  );
}

function logMeta(log, palette, isDark) {
  const statusLabel = (s) => taskStatusMeta(palette, isDark)[s]?.label || s;
  const priorityLabel = (p) => priorityMeta[p]?.label || p;
  switch (log.action) {
    case 'created':
      return { Icon: Plus, label: 'Task created', detail: log.toValue || '', color: '#2D5A3D', bg: '#EEF3EF' };
    case 'status_change': {
      const from = statusLabel(log.fromValue);
      const to = statusLabel(log.toValue);
      return {
        Icon: ArrowRight,
        label: `Status changed to ${to}`,
        detail: log.fromValue ? `from ${from}` : '',
        color: '#0E7490', bg: '#ECFEFF',
      };
    }
    case 'priority_change':
      return {
        Icon: log.toValue === 'urgent' || log.toValue === 'high' ? ArrowUp : ArrowDown,
        label: `Priority set to ${priorityLabel(log.toValue)}`,
        detail: log.fromValue ? `from ${priorityLabel(log.fromValue)}` : '',
        color: '#92400E', bg: '#FFFBEB',
      };
    case 'owner_change':
      return { Icon: User, label: 'Reassigned', detail: log.note || '', color: '#5B21B6', bg: '#F5F3FF' };
    case 'archived':
      return { Icon: Archive, label: 'Archived', detail: log.fromValue ? `was ${statusLabel(log.fromValue)}` : '', color: '#991B1B', bg: '#FEF2F2' };
    case 'restored':
      return { Icon: ArchiveRestore, label: 'Restored', detail: log.toValue ? `back to ${statusLabel(log.toValue)}` : '', color: '#065F46', bg: '#ECFDF5' };
    case 'attachment_added':
      return { Icon: Paperclip, label: 'Attachment added', detail: log.note || '', color: '#1E40AF', bg: '#EFF6FF' };
    default:
      return { Icon: Activity, label: log.action, detail: log.note || '', color: palette.textDim, bg: palette.surfaceAlt };
  }
}

function BackBar({ onBack, palette }) {
  return (
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
      <ChevronLeft size={14} /> Back
    </button>
  );
}

function DateRow({ palette, label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 16,
        padding: '12px 20px',
        borderTop: `1px solid ${palette.border}`,
      }}
    >
      <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Calendar size={12} style={{ color: palette.textMute }} />
        {label}
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 13, color: palette.text }}>{value}</div>
    </div>
  );
}
