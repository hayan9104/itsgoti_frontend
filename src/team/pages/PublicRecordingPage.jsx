import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, Download, Lock, Users2 } from 'lucide-react';
import { publicRecordingAPI } from '../teamRecordingAPI';
import { Avatar } from '../components/Primitives';
import { baseFont, serifFont, monoFont, getPalette, ensureFontsLoaded } from '../theme';
import RecVideoPlayer from '../recording/RecVideoPlayer';
import { recRelTime, resolveBlobUrl } from '../recording/recHelpers';

// Public share page — /v/:shareId. No auth required.
// The backend gates: PRIVATE → 404; TEAM_ONLY → returns { gated: 'team' } so we render a sign-in CTA;
// ANYONE_WITH_LINK → full payload.

export default function PublicRecordingPage() {
  const { shareId } = useParams();
  const [isDark, setIsDark] = useState(false);
  const palette = useMemo(() => getPalette(isDark), [isDark]);
  const [state, setState] = useState({ loading: true, recording: null, gated: null, error: null });
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState({ name: '', body: '' });

  useEffect(() => { ensureFontsLoaded?.(); }, []);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, recording: null, gated: null, error: null });
    publicRecordingAPI.get(shareId).then(({ data }) => {
      if (cancelled) return;
      if (!data?.success) {
        setState({ loading: false, recording: null, gated: null, error: data?.message || 'Recording not available' });
        return;
      }
      if (data.gated === 'team') {
        setState({ loading: false, recording: data.recording, gated: 'team', error: null });
        return;
      }
      setState({ loading: false, recording: data.recording, gated: null, error: null });
      publicRecordingAPI.incrementView(shareId).catch(() => {});
      publicRecordingAPI.listComments(shareId).then((res) => {
        if (cancelled) return;
        if (res?.data?.success) setComments(res.data.comments || []);
      }).catch(() => {});
    }).catch(() => {
      if (cancelled) return;
      setState({ loading: false, recording: null, gated: null, error: 'Recording not available' });
    });
    return () => { cancelled = true; };
  }, [shareId]);

  const postComment = async () => {
    if (!draft.name.trim() || !draft.body.trim()) return;
    try {
      const { data } = await publicRecordingAPI.addComment(shareId, draft);
      if (data?.success) {
        setComments((prev) => [...prev, data.comment]);
        setDraft({ name: '', body: '' });
      }
    } catch (e) { /* swallow */ }
  };

  const Shell = ({ children }) => (
    <div style={{ minHeight: '100vh', backgroundColor: palette.bg, color: palette.text, fontFamily: baseFont, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', maxWidth: 760, margin: '0 auto' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <img src="/Goti%20Logo%20Black.png" alt="Goti" style={{ height: 22, width: 'auto', display: 'block', filter: isDark ? 'invert(1)' : 'none' }} />
        </a>
        <button type="button" onClick={() => window.close()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 6 }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 64px' }}>{children}</div>
    </div>
  );

  if (state.loading) {
    return <Shell><div style={{ paddingTop: 80, textAlign: 'center', fontFamily: baseFont, fontSize: 14, color: palette.textDim }}>Loading…</div></Shell>;
  }
  if (state.error) {
    return <Shell><div style={{ paddingTop: 80, textAlign: 'center', fontFamily: serifFont, fontSize: 22, color: palette.text }}>This recording isn’t available.</div></Shell>;
  }
  if (state.gated === 'team') {
    return (
      <Shell>
        <div style={{ paddingTop: 80, textAlign: 'center' }}>
          <Users2 size={28} color={palette.textMute} style={{ display: 'block', margin: '0 auto 14px' }} />
          <div style={{ fontFamily: serifFont, fontSize: 22, color: palette.text }}>Sign in to GOTI to watch this.</div>
          <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 8 }}>
            This recording is shared with the GOTI team only.
          </div>
          <a href="/team" style={{
            display: 'inline-block', marginTop: 16, padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
            backgroundColor: palette.accent, color: palette.accentText,
            fontFamily: baseFont, fontSize: 13, fontWeight: 500,
          }}>Open team portal</a>
        </div>
      </Shell>
    );
  }

  const rec = state.recording;
  const initials = rec.ownerAvatar || (rec.ownerName ? rec.ownerName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() : '?');
  const downloadUrl = rec.allowDownload ? resolveBlobUrl(rec.blobUrl) : null;

  return (
    <Shell>
      <RecVideoPlayer rec={rec} palette={palette} />
      <h1 style={{ fontFamily: serifFont, fontSize: 28, fontWeight: 400, color: palette.text, letterSpacing: '-0.01em', marginTop: 20 }}>
        {rec.title}
      </h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <Avatar initials={initials} size={28} palette={palette} />
        <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim }}>
          Recorded by <span style={{ color: palette.text, fontWeight: 500 }}>{rec.ownerName}</span>
        </span>
        <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>
          · {rec.ownerJobTitle ? `${rec.ownerJobTitle}, GOTI · ` : ''}{recRelTime(rec.createdAt)}
        </span>
      </div>

      {downloadUrl && (
        <a href={downloadUrl} download style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, padding: '8px 12px',
          borderRadius: 6, textDecoration: 'none',
          backgroundColor: palette.surface, color: palette.text,
          border: `1px solid ${palette.border}`,
          fontFamily: baseFont, fontSize: 12, fontWeight: 500,
        }}>
          <Download size={13} /> Download
        </a>
      )}

      {rec.allowComments && (
        <div style={{ marginTop: 32, borderTop: `1px solid ${palette.border}`, paddingTop: 24 }}>
          <h3 style={{ fontFamily: serifFont, fontSize: 17, fontWeight: 500, color: palette.text, marginBottom: 16, marginTop: 0 }}>Comments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            {comments.map((c) => {
              const ci = c.authorName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div key={c._id} style={{ display: 'flex', gap: 10 }}>
                  <Avatar initials={ci} size={28} palette={palette} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: baseFont, fontSize: 12.5, fontWeight: 500, color: palette.text }}>{c.authorName}</span>
                      <span style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute }}>{recRelTime(c.createdAt)}</span>
                    </div>
                    <div style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, marginTop: 2, lineHeight: 1.55 }}>{c.body}</div>
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textMute }}>Be the first to comment.</div>}
          </div>
          <div style={{ padding: '14px', borderRadius: 10, backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}>
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Your name"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, outline: 'none', marginBottom: 8,
                backgroundColor: palette.surfaceAlt, color: palette.text,
                fontFamily: baseFont, fontSize: 12.5, border: `1px solid ${palette.border}`,
              }} />
            <textarea rows={2} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Leave a comment — no account needed"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6, outline: 'none', marginBottom: 8, resize: 'none',
                backgroundColor: palette.surfaceAlt, color: palette.text,
                fontFamily: baseFont, fontSize: 12.5, border: `1px solid ${palette.border}`,
              }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={postComment}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  backgroundColor: palette.accent, color: palette.accentText,
                  fontFamily: baseFont, fontSize: 12, fontWeight: 500,
                }}>Post comment</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
