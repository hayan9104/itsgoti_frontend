import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceMeetingsAPI } from '../../services/api';

const BASE = '/workspace/super-admin';

const VideoPlayerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [copied, setCopied] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await workspaceMeetingsAPI.getOne(id);
        if (res.data.success) {
          setMeeting(res.data.data);
          setTitleVal(res.data.data.title);
        } else {
          setError('Video not found');
        }
      } catch {
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (editing && titleRef.current) titleRef.current.focus();
  }, [editing]);

  const saveTitle = async () => {
    if (titleVal.trim() && titleVal.trim() !== meeting.title) {
      await workspaceMeetingsAPI.update(id, { title: titleVal.trim() });
      setMeeting(m => ({ ...m, title: titleVal.trim() }));
    }
    setEditing(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this video permanently? This cannot be undone.')) return;
    await workspaceMeetingsAPI.delete(id);
    navigate(`${BASE}/media/videos`);
  };

  const handleArchive = async () => {
    await workspaceMeetingsAPI.archive(id);
    navigate(`${BASE}/media/videos`);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!videoUrl || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = videoUrl.split('.').pop().split('?')[0] || 'mp4';
      a.download = `${meeting.title || 'recording'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

  const fmtDuration = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      Loading...
    </div>
  );

  if (error) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <p style={{ fontSize: '16px' }}>{error}</p>
      <button onClick={() => navigate(`${BASE}/media/videos`)} style={{ marginTop: '12px', padding: '8px 16px', background: '#2a2b2d', border: 'none', borderRadius: '8px', color: '#e5e7eb', cursor: 'pointer', fontSize: '13px' }}>
        ← Back to Media
      </button>
    </div>
  );

  const videoUrl = meeting.recording?.url
    ? (meeting.recording.url.startsWith('http') ? meeting.recording.url : `http://localhost:5000${meeting.recording.url}`)
    : null;

  const actionBtn = {
    padding: '7px 14px', borderRadius: '8px', border: '1px solid #3a3b3d',
    background: '#2a2b2d', color: '#e5e7eb', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
    textDecoration: 'none', whiteSpace: 'nowrap',
  };

  return (
    // height: 100% fills <main>'s content box (100vh minus padding)
    // overflow: hidden prevents this page from causing <main> to scroll
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: '#e5e7eb',
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      overflow: 'hidden',
      // Cancel the 24px padding from <main> so we span full height
      margin: '-24px',
    }}>

      {/* ── Breadcrumb bar ─────────────────────────────────────── */}
      <div style={{
        padding: '12px 28px',
        borderBottom: '1px solid #2a2b2d',
        display: 'flex', alignItems: 'center', gap: '10px',
        flexShrink: 0,
        background: '#1e1f21',
      }}>
        <button
          onClick={() => navigate(`${BASE}/media/videos`)}
          style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', padding: 0, fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Media
        </button>
        <span style={{ color: '#3a3b3d', fontSize: '13px' }}>/</span>
        <span style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{meeting.title}</span>
      </div>

      {/* ── Main body — fills remaining height ─────────────────── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 28px 16px',
      }}>

        {/* Video — grows to fill available space */}
        <div style={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', background: '#000', display: 'flex' }}>
          {videoUrl ? (
            <video
              controls
              src={videoUrl}
              style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '14px' }}>
              No video file available
            </div>
          )}
        </div>

        {/* ── Info row — always visible below video ─────────────── */}
        <div style={{
          flexShrink: 0,
          paddingTop: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          {/* Left: title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <input
                ref={titleRef}
                value={titleVal}
                onChange={e => setTitleVal(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false); }}
                style={{ width: '100%', background: '#1e1f20', border: '1px solid #6366f1', borderRadius: '6px', color: '#fff', fontSize: '18px', fontWeight: 700, padding: '5px 10px', outline: 'none', fontFamily: 'inherit' }}
              />
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'text', minWidth: 0 }}
                onClick={() => setEditing(true)}
                title="Click to rename"
              >
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {meeting.title}
                </h1>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            )}

            <div style={{ marginTop: '5px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{fmtDate(meeting.meetingDate || meeting.createdAt)}</span>
              {fmtDuration(meeting.duration) && (
                <span style={{ fontSize: '11px', color: '#9ca3af', background: '#2a2b2d', padding: '2px 8px', borderRadius: '4px' }}>
                  {fmtDuration(meeting.duration)}
                </span>
              )}
              {meeting.source && (
                <span style={{ fontSize: '11px', color: '#9ca3af', background: '#2a2b2d', padding: '2px 8px', borderRadius: '4px' }}>
                  {meeting.source === 'chrome_extension' ? 'Extension' : 'Website'}
                </span>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
            <button
              onClick={handleShare}
              style={actionBtn}
              onMouseEnter={e => e.currentTarget.style.background = '#353638'}
              onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {copied ? 'Copied!' : 'Share'}
            </button>

            {videoUrl && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{ ...actionBtn, opacity: downloading ? 0.7 : 1, cursor: downloading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = '#353638'; }}
                onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {downloading ? 'Downloading…' : 'Download'}
              </button>
            )}

            <button
              onClick={handleArchive}
              style={actionBtn}
              onMouseEnter={e => e.currentTarget.style.background = '#353638'}
              onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              Archive
            </button>

            <button
              onClick={handleDelete}
              style={{ ...actionBtn, border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
