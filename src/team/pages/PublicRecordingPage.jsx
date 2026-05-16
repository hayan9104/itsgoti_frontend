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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', maxWidth: 760, margin: '0 auto' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <img src="/Goti%20Logo%20Black.png" alt="Goti" style={{ height: 22, width: 'auto', display: 'block', filter: isDark ? 'invert(1)' : 'none' }} />
        </a>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '8px 24px 64px' }}>{children}</div>
    </div>
  );

  if (state.loading) {
    return <Shell><div style={{ paddingTop: 80, textAlign: 'center', fontFamily: baseFont, fontSize: 14, color: palette.textDim }}>Loading…</div></Shell>;
  }
  if (state.error) {
    // Private or deleted — same response shape for both. Treat as "private/no-access"
    // since that's the common case worth explaining; if it's truly missing, the message still fits.
    const isPrivate = /private|access|not available/i.test(state.error || '');
    return (
      <Shell>
        <MessageCard
          palette={palette}
          emoji={isPrivate ? '🔒' : '🤷‍♂️'}
          title={isPrivate ? 'Private — no access' : 'Not found'}
          subtitle={isPrivate
            ? "The owner hasn't shared this recording with you. Ask them for access if you need to watch it."
            : "This link doesn't lead to a recording. Double-check it with the person who sent it."}
        />
      </Shell>
    );
  }
  if (state.gated === 'team') {
    return (
      <Shell>
        <MessageCard
          palette={palette}
          emoji="👥"
          title="GOTI team only"
          subtitle="This recording is shared with the GOTI team. Sign in to watch it."
          action={(
            <a href="/team" style={{
              display: 'inline-block', marginTop: 8, padding: '10px 20px', borderRadius: 8, textDecoration: 'none',
              backgroundColor: palette.accent, color: palette.accentText,
              fontFamily: baseFont, fontSize: 13, fontWeight: 500,
            }}>Open team portal</a>
          )}
        />
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

// Centered card empty state — used for private / team-only / not-found responses on the
// public share page. Big emoji + serif headline + muted subtitle + optional action.
function MessageCard({ palette, emoji, title, subtitle, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)', padding: '40px 24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        backgroundColor: palette.surface, border: `1px solid ${palette.border}`,
        borderRadius: 16, padding: '40px 32px 36px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          fontSize: 64, lineHeight: 1, marginBottom: 18,
          // Render emoji at full color even on dark backgrounds.
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))',
        }}>
          {emoji}
        </div>
        <h2 style={{
          fontFamily: serifFont, fontSize: 24, fontWeight: 500, color: palette.text,
          margin: 0, letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontFamily: baseFont, fontSize: 13.5, color: palette.textDim,
            lineHeight: 1.55, marginTop: 12, marginBottom: 0, maxWidth: 340, marginLeft: 'auto', marginRight: 'auto',
          }}>
            {subtitle}
          </p>
        )}
        {action && <div style={{ marginTop: 20 }}>{action}</div>}
      </div>
    </div>
  );
}
