import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Share2, Copy, Check, ExternalLink, Trash2, Download, MessageSquare, CheckSquare, Scissors, RotateCcw } from 'lucide-react';
import { teamRecordingsAPI } from '../teamRecordingAPI';
import { teamTasksAPI } from '../teamAPI';
import { getCached, setCached, invalidate } from '../teamCache';
import { Avatar } from '../components/Primitives';
import { baseFont, serifFont, monoFont } from '../theme';
import RecVideoPlayer from '../recording/RecVideoPlayer';
import { recFmtDur, recRelTime, visMeta, resolveBlobUrl } from '../recording/recHelpers';

// Watch page — video, edit metadata (title / visibility / task link / allow comments / download),
// trim duration, comments. Owner-only edits; everyone with access can comment.

export default function RecordingWatchView({ palette, isDark, isAdmin, currentUserId, recordingId, onBack }) {
  const cacheKey = `recordings:detail:${recordingId}`;
  const [rec, setRec] = useState(() => getCached(cacheKey) || null);
  const [loading, setLoading] = useState(!rec);
  const [comments, setComments] = useState([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [trimRange, setTrimRange] = useState(null); // { start, end } when editor open
  const [taskOptions, setTaskOptions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    teamRecordingsAPI.get(recordingId).then(({ data }) => {
      if (cancelled || !data?.success) return;
      setRec(data.recording);
      setCached(cacheKey, data.recording);
      setLoading(false);
    }).catch(() => setLoading(false));
    teamRecordingsAPI.listComments(recordingId).then(({ data }) => {
      if (cancelled) return;
      if (data?.success) setComments(data.comments || []);
    }).catch(() => {});
    // Increment view count (fire-and-forget).
    teamRecordingsAPI.incrementView(recordingId).catch(() => {});
    return () => { cancelled = true; };
  }, [recordingId, cacheKey]);

  useEffect(() => {
    const cached = getCached('tasks:list');
    if (cached?.tasks) {
      setTaskOptions(cached.tasks);
      return;
    }
    teamTasksAPI.list().then(({ data }) => {
      if (data?.success) {
        setTaskOptions(data.tasks || []);
        setCached('tasks:list', data);
      }
    }).catch(() => {});
  }, []);

  const linkedTask = useMemo(() => {
    if (!rec?.taskId) return null;
    return taskOptions.find((t) => String(t._id) === String(rec.taskId));
  }, [rec, taskOptions]);

  if (loading && !rec) {
    return <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>;
  }
  if (!rec) {
    return <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Recording not found.</div>;
  }

  const isOwner = String(rec.ownerId) === String(currentUserId);
  const V = visMeta[rec.visibility];

  // Optimistic — the UI updates instantly and the API call runs in the background.
  // If the server rejects, we revert by re-fetching the canonical state.
  const patchRec = async (patch) => {
    const prev = rec;
    const next = { ...rec, ...patch };
    setRec(next);
    setCached(cacheKey, next);
    try {
      const { data } = await teamRecordingsAPI.update(rec.id, patch);
      if (data?.success) {
        setRec(data.recording);
        setCached(cacheKey, data.recording);
        invalidate('recordings:mine'); invalidate('recordings:team'); invalidate('recordings:shared');
      } else {
        setRec(prev);
        setCached(cacheKey, prev);
        alert('Could not save changes.');
      }
    } catch (e) {
      setRec(prev);
      setCached(cacheKey, prev);
      alert('Could not save changes.');
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/v/${rec.shareId}`;
    try { navigator.clipboard.writeText(link); } catch (e) {}
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this recording? This can’t be undone.')) return;
    try {
      await teamRecordingsAPI.remove(rec.id);
      invalidate('recordings:*');
      onBack?.();
    } catch (e) { alert('Could not delete.'); }
  };

  const addComment = async () => {
    const body = commentDraft.trim();
    if (!body) return;
    try {
      const { data } = await teamRecordingsAPI.addComment(rec.id, { body });
      if (data?.success) {
        setComments((prev) => [...prev, data.comment]);
        setCommentDraft('');
      }
    } catch (e) { /* swallow */ }
  };

  const saveTrim = async () => {
    if (!trimRange) return;
    try {
      const { data } = await teamRecordingsAPI.saveTrim(rec.id, trimRange.start, trimRange.end);
      if (data?.success && data.recording) setRec(data.recording);
      setTrimRange(null);
    } catch (e) {
      alert(e?.response?.data?.message || 'Could not save trim.');
    }
  };

  const restoreOriginal = async () => {
    if (!window.confirm('Restore the full original recording? Your current trim will be cleared.')) return;
    try {
      const { data } = await teamRecordingsAPI.restoreOriginal(rec.id);
      if (data?.success && data.recording) setRec(data.recording);
    } catch (e) {
      alert(e?.response?.data?.message || 'Could not restore original.');
    }
  };

  const downloadUrl = rec.allowDownload && rec.blobUrl ? resolveBlobUrl(rec.blobUrl) : null;

  return (
    <div>
      <button type="button" onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, fontWeight: 500, padding: 0,
        }}>
        <ArrowLeft size={14} /> Back to recordings
      </button>

      <div className="team-watch-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28 }}>
        <div>
          <RecVideoPlayer rec={rec} palette={palette} />

          {/* title + meta */}
          <div style={{ marginTop: 20 }}>
            {editingTitle && isOwner ? (
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => { if (titleDraft.trim()) patchRec({ title: titleDraft.trim() }); setEditingTitle(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditingTitle(false); }}
                style={{
                  width: '100%', outline: 'none', background: 'transparent',
                  fontFamily: serifFont, fontSize: 30, fontWeight: 400, color: palette.text,
                  letterSpacing: '-0.01em', borderBottom: `1px solid ${palette.accent}`,
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: 0,
                }}
              />
            ) : (
              <h1
                onClick={() => { if (isOwner) { setTitleDraft(rec.title); setEditingTitle(true); } }}
                style={{
                  fontFamily: serifFont, fontSize: 30, fontWeight: 400, color: palette.text,
                  letterSpacing: '-0.01em', cursor: isOwner ? 'text' : 'default', margin: 0,
                }}>{rec.title}</h1>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <Avatar initials={rec.ownerAvatar || (rec.ownerName ? rec.ownerName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : '?')} size={24} palette={palette} />
              <span style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim }}>{rec.ownerName}</span>
              <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>
                · {recRelTime(rec.createdAt)} · {recFmtDur(rec.durationSec)} · {rec.viewCount} views
              </span>
            </div>
          </div>

          {/* trim — owner only */}
          {isOwner && (
            <TrimEditor
              palette={palette}
              isDark={isDark}
              rec={rec}
              trimRange={trimRange}
              setTrimRange={setTrimRange}
              onSave={saveTrim}
              onRestore={restoreOriginal}
            />
          )}

          {/* comments */}
          {rec.allowComments && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <MessageSquare size={14} strokeWidth={1.75} color={palette.textDim} />
                <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, margin: 0 }}>Comments</h3>
                <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>{comments.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {comments.map((c) => {
                  const initials = c.authorName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <div key={c._id} style={{ display: 'flex', gap: 10 }}>
                      <Avatar initials={initials} size={28} palette={palette} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: baseFont, fontSize: 12.5, fontWeight: 500, color: palette.text }}>{c.authorName}</span>
                          {!c.authorId && <span style={{ fontFamily: baseFont, fontSize: 10, color: palette.textMute }}>· viewer</span>}
                          {c.pinnedAtSec != null && (
                            <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.accent, backgroundColor: palette.accentBg, padding: '0 4px', borderRadius: 3 }}>@{recFmtDur(c.pinnedAtSec)}</span>
                          )}
                          <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute }}>{recRelTime(c.createdAt)}</span>
                        </div>
                        <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginTop: 2, lineHeight: 1.55 }}>{c.body}</div>
                      </div>
                    </div>
                  );
                })}
                {comments.length === 0 && <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute }}>No comments yet.</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <input
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                  placeholder="Add a comment…"
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6, outline: 'none',
                    backgroundColor: palette.surfaceAlt, color: palette.text,
                    fontFamily: baseFont, fontSize: 12.5, border: `1px solid ${palette.border}`,
                  }}
                />
                <button type="button" onClick={addComment}
                  style={{
                    padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                    backgroundColor: palette.accent, color: palette.accentText,
                    fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                  }}>Post</button>
              </div>
            </div>
          )}
        </div>

        {/* right rail: share + task + actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 16, borderRadius: 10, backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Share2 size={13} strokeWidth={1.75} color={palette.textDim} />
              <span style={{ fontFamily: baseFont, fontSize: 12.5, fontWeight: 500, color: palette.text }}>Share</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                padding: '6px 8px', borderRadius: 6,
                backgroundColor: palette.surfaceAlt, border: `1px solid ${palette.border}`,
                fontFamily: monoFont, fontSize: 12, color: palette.text,
              }}>{window.location.origin}/v/{rec.shareId}</span>
              <button type="button" onClick={copyLink}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6,
                  backgroundColor: linkCopied ? palette.accentBg : palette.surfaceAlt,
                  color: linkCopied ? palette.accent : palette.text,
                  border: `1px solid ${linkCopied ? palette.accent : palette.border}`, cursor: 'pointer',
                  fontFamily: baseFont, fontSize: 11.5, fontWeight: 500,
                }}>
                {linkCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>

            {isOwner ? (
              <>
                <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em', marginBottom: 6, textTransform: 'uppercase' }}>WHO CAN WATCH</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {Object.entries(visMeta).map(([k, V]) => (
                    <button key={k} type="button" onClick={() => patchRec({ visibility: k })}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                        backgroundColor: rec.visibility === k ? palette.accentBg : palette.surfaceAlt,
                        border: `1px solid ${rec.visibility === k ? palette.accent : palette.border}`,
                        textAlign: 'left',
                      }}>
                      <V.icon size={13} color={rec.visibility === k ? palette.accent : palette.textDim} />
                      <span style={{ fontFamily: baseFont, fontSize: 12, color: rec.visibility === k ? palette.accent : palette.text, fontWeight: 500 }}>{V.label}</span>
                    </button>
                  ))}
                </div>
                <ToggleRow palette={palette} label="Allow comments" on={rec.allowComments} onChange={(v) => patchRec({ allowComments: v })} />
                <ToggleRow palette={palette} label="Allow download" on={rec.allowDownload} onChange={(v) => patchRec({ allowDownload: v })} />
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>
                <V.icon size={12} /> {V.label}
              </div>
            )}
            <a href={`/v/${rec.shareId}`} target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6,
                padding: '8px 0', borderRadius: 6, textDecoration: 'none',
                fontFamily: baseFont, fontSize: 11.5, color: palette.accent, fontWeight: 500,
                border: `1px solid ${palette.border}`,
              }}>
              Open public page <ExternalLink size={11} />
            </a>
          </div>

          {/* task link */}
          <div style={{ padding: 16, borderRadius: 10, backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em', marginBottom: 8, textTransform: 'uppercase' }}>LINKED TASK</div>
            {isOwner ? (
              <select
                value={rec.taskId || ''}
                onChange={(e) => patchRec({ taskId: e.target.value || null })}
                style={{
                  width: '100%', padding: '7px 9px', borderRadius: 6, outline: 'none',
                  backgroundColor: palette.surfaceAlt, color: palette.text,
                  fontFamily: baseFont, fontSize: 12.5, border: `1px solid ${palette.border}`,
                }}>
                <option value="">No task linked</option>
                {taskOptions.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            ) : (
              <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.text }}>{linkedTask?.title || 'No task linked'}</div>
            )}
            {linkedTask && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                padding: '6px 8px', borderRadius: 4, backgroundColor: palette.accentBg,
              }}>
                <CheckSquare size={11} color={palette.accent} />
                <span style={{ fontFamily: baseFont, fontSize: 11, color: palette.accent, fontWeight: 500 }}>
                  This recording shows on “{linkedTask.title.length > 28 ? linkedTask.title.slice(0, 28) + '…' : linkedTask.title}”
                </span>
              </div>
            )}
          </div>

          {/* actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            {downloadUrl && (
              <a href={downloadUrl} download
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', borderRadius: 6, textDecoration: 'none',
                  backgroundColor: palette.surfaceAlt, color: palette.text,
                  border: `1px solid ${palette.border}`,
                  fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                }}>
                <Download size={13} /> Download
              </a>
            )}
            {(isOwner || isAdmin) && (
              <button type="button" onClick={handleDelete}
                style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', borderRadius: 6, cursor: 'pointer',
                  backgroundColor: palette.surfaceAlt, color: '#DC2626',
                  border: `1px solid ${palette.border}`,
                  fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                }}>
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ palette, label, on, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.text }}>{label}</span>
      <button type="button" onClick={() => onChange(!on)}
        style={{
          width: 34, height: 20, borderRadius: 999, position: 'relative', cursor: 'pointer',
          backgroundColor: on ? palette.accent : palette.border, border: 'none', padding: 0,
        }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 16 : 2,
          width: 16, height: 16, borderRadius: 999, backgroundColor: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,.25)',
        }} />
      </button>
    </div>
  );
}

// Days during which the "Restore original" button stays visible after the trim was saved.
// The underlying file is never deleted, so restore technically works forever — this just
// hides the option for old, long-settled trims.
const RESTORE_WINDOW_DAYS = 5;

function TrimEditor({ palette, isDark, rec, trimRange, setTrimRange, onSave, onRestore }) {
  const originalDuration = rec.originalDuration || rec.durationSec;
  const isTrimmed = !!(rec.trimEnd && rec.trimEnd > (rec.trimStart || 0));
  const trimming = !!trimRange;

  // Range editor operates on the FULL original duration so the user can extend their trim
  // back outwards, not just narrow it further. Start with current trim (or full range).
  const tStart = trimRange ? trimRange.start : (rec.trimStart || 0);
  const tEnd = trimRange ? trimRange.end : (rec.trimEnd || originalDuration);
  const fullLen = originalDuration || 1;

  // Restore-window check: hide after N days from trimmedAt. Always shown to admins inside
  // the window. When `trimmedAt` is missing on legacy trims, we still show it.
  const trimmedAt = rec.trimmedAt ? new Date(rec.trimmedAt) : null;
  const restoreCutoff = trimmedAt ? new Date(trimmedAt.getTime() + RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000) : null;
  const restoreAvailable = isTrimmed && (!restoreCutoff || Date.now() <= restoreCutoff.getTime());
  const restoreDaysLeft = restoreCutoff ? Math.max(0, Math.ceil((restoreCutoff.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : null;

  return (
    <div style={{ marginTop: 24, padding: 16, borderRadius: 10, backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Scissors size={13} strokeWidth={1.75} color={palette.textDim} />
          <span style={{ fontFamily: baseFont, fontSize: 12.5, fontWeight: 500, color: palette.text }}>Trim</span>
          {isTrimmed ? (
            <span style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>
              · {recFmtDur(tStart)} – {recFmtDur(tEnd)} of {recFmtDur(originalDuration)} original
            </span>
          ) : (
            <span style={{ fontFamily: baseFont, fontSize: 11, color: palette.textMute }}>· cut dead air at the start or end</span>
          )}
        </div>
        {!trimming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {restoreAvailable && (
              <button
                type="button"
                onClick={onRestore}
                title={restoreDaysLeft != null ? `Available for ${restoreDaysLeft} more day${restoreDaysLeft === 1 ? '' : 's'}` : 'Restore the original recording'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: palette.surfaceAlt, border: `1px solid ${palette.border}`,
                  borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                  fontFamily: baseFont, fontSize: 11.5, color: palette.text, fontWeight: 500,
                }}
              >
                <RotateCcw size={11} /> Restore original
              </button>
            )}
            <button
              type="button"
              onClick={() => setTrimRange({ start: tStart, end: tEnd })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 11.5, color: palette.accent, fontWeight: 500 }}
            >
              {isTrimmed ? 'Edit trim' : 'Edit trim'}
            </button>
          </div>
        )}
      </div>

      {trimming ? (
        <>
          <div style={{ position: 'relative', height: 40, backgroundColor: palette.surfaceAlt, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${(tStart / fullLen) * 100}%`, backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(1 - tEnd / fullLen) * 100}%`, backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.06)' }} />
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${(tStart / fullLen) * 100}%`,
              right: `${(1 - tEnd / fullLen) * 100}%`,
              border: `2px solid ${palette.accent}`, borderRadius: 4, backgroundColor: palette.accentBg, opacity: 0.5,
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute }}>START</span>
              <input type="range" min={0} max={fullLen} value={tStart}
                onChange={(e) => setTrimRange((r) => ({ ...r, start: Math.min(Number(e.target.value), r.end - 1) }))}
                style={{ accentColor: palette.accent, width: 110 }} />
              <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.text }}>{recFmtDur(tStart)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute }}>END</span>
              <input type="range" min={0} max={fullLen} value={tEnd}
                onChange={(e) => setTrimRange((r) => ({ ...r, end: Math.max(Number(e.target.value), r.start + 1) }))}
                style={{ accentColor: palette.accent, width: 110 }} />
              <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.text }}>{recFmtDur(tEnd)}</span>
            </div>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={() => setTrimRange(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 11.5, color: palette.textDim, fontWeight: 500 }}>Cancel</button>
            <button type="button" onClick={onSave}
              style={{
                padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                backgroundColor: palette.accent, color: palette.accentText,
                fontFamily: baseFont, fontSize: 11.5, fontWeight: 500,
              }}>Save trim</button>
          </div>
          <div style={{ fontFamily: baseFont, fontSize: 10.5, color: palette.textMute, marginTop: 8 }}>
            Lossless — your file isn't re-encoded. You can Restore original within {RESTORE_WINDOW_DAYS} days.
          </div>
        </>
      ) : (
        <div style={{
          height: 40, backgroundColor: palette.surfaceAlt, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: baseFont, fontSize: 11.5, color: palette.textMute,
        }}>
          {isTrimmed ? (
            <>
              <span>Trimmed · plays {recFmtDur(tEnd - tStart)}</span>
              {restoreDaysLeft != null && restoreAvailable && (
                <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em' }}>
                  · RESTORE AVAILABLE FOR {restoreDaysLeft} MORE DAY{restoreDaysLeft === 1 ? '' : 'S'}
                </span>
              )}
            </>
          ) : (
            <span>Full recording · {recFmtDur(originalDuration)}</span>
          )}
        </div>
      )}
    </div>
  );
}

