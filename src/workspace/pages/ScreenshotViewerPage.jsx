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
  const [downloading, setDownloading] = useState(false);
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
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid #3a3b3d', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Loading…
      </div>
    </div>
  );

  if (error) return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", gap: '12px' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ margin: 0, fontSize: '15px' }}>{error}</p>
      <button onClick={() => navigate(`${BASE}/media/screenshots`)} style={{ padding: '8px 18px', background: '#2a2b2d', border: '1px solid #3a3b3d', borderRadius: '8px', color: '#e5e7eb', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
        ← Back to Media
      </button>
    </div>
  );

  const imgUrl = screenshot.url
    ? (screenshot.url.startsWith('http') ? screenshot.url : `http://localhost:5000${screenshot.url}`)
    : null;

  const chip = {
    fontSize: '11px', color: '#9ca3af', background: 'rgba(255,255,255,0.06)',
    padding: '3px 9px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
    lineHeight: '1.4',
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
      background: '#131416',
    }}>

      {/* ── Top nav bar ─────────────────────────────────────────── */}
      <div style={{
        height: '52px',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
        background: '#18191b',
      }}>
        <button
          onClick={() => navigate(`${BASE}/media/screenshots`)}
          style={{
            background: 'transparent', border: 'none', color: '#9ca3af',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '5px', fontSize: '13px', padding: '5px 8px',
            borderRadius: '6px', fontFamily: 'inherit', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e5e7eb'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Media
        </button>
        <svg width="4" height="4" viewBox="0 0 4 4" style={{ flexShrink: 0 }}>
          <circle cx="2" cy="2" r="2" fill="#3a3b3d"/>
        </svg>
        <span style={{ fontSize: '13px', color: '#c4c6cc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
          {screenshot.title}
        </span>
      </div>

      {/* ── Main body ─────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '1100px',
        width: '100%',
        margin: '0 auto',
        padding: '20px 24px 20px',
        gap: '16px',
      }}>

        {/* Image — fills available space */}
        <div style={{
          flex: 1, minHeight: 0,
          borderRadius: '14px', overflow: 'hidden',
          background: '#0d0d0f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 12px 48px rgba(0,0,0,0.6)',
          position: 'relative',
        }}>
          {/* Subtle checkerboard to indicate transparency if any */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(99,102,241,0.04) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.04) 0%, transparent 60%)' }} />
          {imgUrl ? (
            <img
              src={imgUrl}
              alt={screenshot.title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', position: 'relative' }}
            />
          ) : (
            <div style={{ color: '#374151', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.4 }}>
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              Image not available
            </div>
          )}
        </div>

        {/* ── Info row ─────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
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
                style={{
                  width: '100%', background: '#1e1f21', border: '1px solid #6366f1',
                  borderRadius: '8px', color: '#fff', fontSize: '20px', fontWeight: 700,
                  padding: '5px 10px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
                }}
              />
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'text', minWidth: 0 }}
                onClick={() => setEditing(true)}
                title="Click to rename"
              >
                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f9fafb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  {screenshot.title}
                </h1>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
            )}
            <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>{fmtDate(screenshot.createdAt)}</span>
              {screenshot.source && (
                <span style={chip}>
                  {screenshot.source === 'chrome_extension' ? 'Extension' : 'Website'}
                </span>
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', flexShrink: 0, alignItems: 'center' }}>
            <ActionBtn onClick={handleShare} icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            }>{copied ? 'Copied!' : 'Share'}</ActionBtn>

            {imgUrl && (
              <ActionBtn onClick={handleDownload} disabled={downloading} primary icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              }>{downloading ? 'Downloading…' : 'Download'}</ActionBtn>
            )}

            <ActionBtn onClick={handleDelete} danger icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
              </svg>
            }>Delete</ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

function ActionBtn({ children, onClick, icon, danger, primary, disabled }) {
  const [hovered, setHovered] = useState(false);

  const base = {
    padding: '7px 14px', borderRadius: '8px', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', whiteSpace: 'nowrap',
    transition: 'background 0.15s, border-color 0.15s, opacity 0.15s', opacity: disabled ? 0.6 : 1,
    border: 'none',
  };

  let style;
  if (danger) {
    style = { ...base, border: '1px solid rgba(239,68,68,0.3)', background: hovered ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.04)', color: '#f87171' };
  } else if (primary) {
    style = { ...base, border: '1px solid rgba(99,102,241,0.5)', background: hovered ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)', color: '#a5b4fc' };
  } else {
    style = { ...base, border: '1px solid rgba(255,255,255,0.1)', background: hovered ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', color: '#d1d5db' };
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
      {children}
    </button>
  );
}

export default ScreenshotViewerPage;
