import { useEffect, useState } from 'react';
import { ChevronLeft, Paperclip, FileText, ExternalLink, Timer, Calendar, User, MonitorPlay, Play } from 'lucide-react';
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

export default function TaskDetailView({ palette, isDark, taskId, onBack, openRecording }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setTick] = useState(0); // forces live timer

  // Recordings linked to this task — seeded from cache so the section paints instantly.
  const recCacheKey = `recordings:byTask:${taskId}`;
  const [recordings, setRecordings] = useState(() => getCached(recCacheKey)?.recordings || []);

  useEffect(() => {
    let cancelled = false;
    teamRecordingsAPI.listByTask(taskId).then(({ data }) => {
      if (cancelled || !data?.success) return;
      setRecordings(data.recordings || []);
      setCached(recCacheKey, data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [taskId, recCacheKey]);

  const fetchTask = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await teamTasksAPI.get(taskId);
      if (data?.success) setTask(data.task);
      else setError(data?.message || 'Task not found');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load task');
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
      <BackBar onBack={onBack} palette={palette} />

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
    </div>
  );
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
