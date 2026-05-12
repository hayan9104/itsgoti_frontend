import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceScreenshotsAPI } from '../../services/api';

const BASE = '/workspace/super-admin';

const ScreenshotViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const [copied, setCopied] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await workspaceScreenshotsAPI.getOne(id);
        if (res.data.success) {
          setScreenshot(res.data.data);
          setTitleVal(res.data.data.title);
        } else {
          setError('Screenshot not found');
        }
      } catch {
        setError('Failed to load screenshot');
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
    if (titleVal.trim() && titleVal.trim() !== screenshot.title) {
      await workspaceScreenshotsAPI.update(id, { title: titleVal.trim() });
      setScreenshot(s => ({ ...s, title: titleVal.trim() }));
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
    if (!window.confirm('Delete this screenshot permanently? This cannot be undone.')) return;
    await workspaceScreenshotsAPI.delete(id);
    navigate(`${BASE}/media/screenshots`);
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!imgUrl || downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = screenshot.fileName || screenshot.title || 'screenshot.png';
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

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      Loading...
    </div>
  );

  if (error) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <p style={{ fontSize: '16px' }}>{error}</p>
      <button onClick={() => navigate(`${BASE}/media/screenshots`)} style={{ marginTop: '12px', padding: '8px 16px', background: '#2a2b2d', border: 'none', borderRadius: '8px', color: '#e5e7eb', cursor: 'pointer', fontSize: '13px' }}>
        ← Back to Media
      </button>
    </div>
  );

  const imgUrl = screenshot.url
    ? (screenshot.url.startsWith('http') ? screenshot.url : `http://localhost:5000${screenshot.url}`)
    : null;

  const actionBtn = {
    padding: '7px 14px', borderRadius: '8px', border: '1px solid #3a3b3d',
    background: '#2a2b2d', color: '#e5e7eb', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
    textDecoration: 'none', whiteSpace: 'nowrap',
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: '#e5e7eb',
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      overflow: 'hidden',
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
          onClick={() => navigate(`${BASE}/media/screenshots`)}
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
        <span style={{ fontSize: '13px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>{screenshot.title}</span>
      </div>

      {/* ── Main body ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        padding: '16px 28px',
      }}>

        {/* Image — fills available space */}
        <div style={{ flex: 1, minHeight: 0, borderRadius: '12px', overflow: 'hidden', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={screenshot.title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div style={{ color: '#4b5563', fontSize: '14px' }}>Image not available</div>
          )}
        </div>

        {/* ── Info row — always visible below image ─────────────── */}
        <div style={{
          flexShrink: 0,
          paddingTop: '14px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          {/* Left: title + date */}
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
                  {screenshot.title}
                </h1>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            )}
            <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>{fmtDate(screenshot.createdAt)}</span>
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

            {imgUrl && (
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

export default ScreenshotViewerPage;
