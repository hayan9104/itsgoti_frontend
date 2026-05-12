import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { workspaceMeetingsAPI, workspaceScreenshotsAPI } from '../../services/api';

const BASE = '/workspace/super-admin';

// Inject CSS once for instant hover (no React re-render needed)
const CARD_CSS = `
.mc-card .mc-overlay { opacity: 0; pointer-events: none; }
.mc-card:hover .mc-overlay { opacity: 1; pointer-events: auto; }
.mc-card .mc-chk-ghost { opacity: 0; pointer-events: none; }
.mc-card:hover .mc-chk-ghost { opacity: 1; pointer-events: auto; }
`;

if (!document.getElementById('mc-styles')) {
  const s = document.createElement('style');
  s.id = 'mc-styles';
  s.textContent = CARD_CSS;
  document.head.appendChild(s);
}

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const fmtDuration = (mins) => {
  if (!mins) return null;
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const IconLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const IconPin = ({ filled }) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? '#f59e0b' : '#fff'}>
    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
  </svg>
);

const Checkbox = ({ checked, faint }) => (
  <div style={{
    width: '20px', height: '20px', borderRadius: '5px',
    border: `2px solid ${checked ? '#6366f1' : faint ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.7)'}`,
    background: checked ? '#6366f1' : 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, backdropFilter: 'blur(2px)',
  }}>
    {checked && (
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
);

function VideoThumbnail({ src, style }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) return;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.src = src;
    video.muted = true;
    video.currentTime = 1;
    video.addEventListener('seeked', () => {
      try {
        const c = canvasRef.current;
        if (!c) return;
        c.width = video.videoWidth || 320;
        c.height = video.videoHeight || 180;
        c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
        setReady(true);
      } catch {}
    });
    video.load();
  }, [src]);

  return (
    <>
      <canvas ref={canvasRef} style={{ ...style, display: ready ? 'block' : 'none', objectFit: 'cover' }} />
      {!ready && (
        <div style={{ ...style, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.2)">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}
    </>
  );
}

function MediaCard({
  item, type, isArchive = false, showTypeBadge = false,
  onPin, onArchive, onDelete, onRename, onDuplicate, onClick,
  selectionMode, selected, onSelect, onSelectStart,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(item.title);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const renameRef = useRef(null);

  const videoUrl = type === 'video' ? item.recording?.url : null;
  const imgUrl = type === 'screenshot' ? item.url : null;
  const fullVideoUrl = videoUrl ? (videoUrl.startsWith('http') ? videoUrl : `http://localhost:5000${videoUrl}`) : null;
  const fullImgUrl = imgUrl ? (imgUrl.startsWith('http') ? imgUrl : `http://localhost:5000${imgUrl}`) : null;

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming && renameRef.current) renameRef.current.focus();
  }, [renaming]);

  const submitRename = () => {
    if (renameVal.trim() && renameVal.trim() !== item.title) onRename(item._id, renameVal.trim());
    setRenaming(false);
  };

  const handleCopyLink = (e) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}${BASE}/media/${type === 'video' ? 'videos' : 'screenshots'}/${item._id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    setMenuOpen(false);
  };

  const handleCardClick = (e) => {
    if (selectionMode) { onSelect(); return; }
    if (!menuOpen && !renaming) onClick();
  };

  const menuItems = [
    {
      label: copied ? 'Copied!' : 'Copy link',
      icon: <IconLink />,
      action: handleCopyLink,
    },
    {
      label: 'Rename',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      ),
      action: () => { setRenaming(true); setMenuOpen(false); },
    },
    {
      label: 'Duplicate',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      ),
      action: () => { onDuplicate(item._id); setMenuOpen(false); },
    },
    {
      label: isArchive ? 'Unarchive' : 'Archive',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
          <line x1="10" y1="12" x2="14" y2="12"/>
        </svg>
      ),
      action: () => { onArchive(item._id, item.archived); setMenuOpen(false); },
    },
    {
      label: 'Delete',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      ),
      danger: true,
      action: () => { if (window.confirm('Delete permanently? This cannot be undone.')) { onDelete(item._id); } setMenuOpen(false); },
    },
  ];

  return (
    <div
      className="mc-card"
      style={{ cursor: 'pointer', position: 'relative' }}
      onClick={handleCardClick}
    >
      {/* ── Thumbnail area ─────────────────────────────────────── */}
      <div style={{ position: 'relative', borderRadius: '10px', aspectRatio: '16/9', outline: selected ? '2.5px solid #6366f1' : 'none', outlineOffset: '0px' }}>

        {/* Media (overflow:hidden only on this inner shell for border-radius) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', overflow: 'hidden', background: '#111' }}>
          {type === 'video' && fullVideoUrl && (
            <VideoThumbnail src={fullVideoUrl} style={{ width: '100%', height: '100%' }} />
          )}
          {type === 'screenshot' && fullImgUrl && (
            <img src={fullImgUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
          {((type === 'screenshot' && !fullImgUrl) || (type === 'video' && !fullVideoUrl)) && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(255,255,255,0.15)">
                {type === 'video'
                  ? <path d="M8 5v14l11-7z"/>
                  : <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                }
              </svg>
            </div>
          )}
          {/* Selection tint */}
          {selectionMode && selected && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.2)', pointerEvents: 'none' }} />
          )}
        </div>

        {/* Duration badge */}
        {type === 'video' && item.duration > 0 && (
          <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', zIndex: 2 }}>
            {fmtDuration(item.duration)}
          </div>
        )}

        {/* Type badge for Archive tab */}
        {showTypeBadge && (
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: type === 'video' ? 'rgba(99,102,241,0.85)' : 'rgba(16,185,129,0.85)', color: '#fff', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', zIndex: 2 }}>
            {type === 'video' ? 'Video' : 'Screenshot'}
          </div>
        )}

        {/* Pinned badge */}
        {item.pinned && !isArchive && !selectionMode && (
          <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.65)', borderRadius: '4px', padding: '3px 5px', display: 'flex', alignItems: 'center', zIndex: 2 }}>
            <IconPin filled />
          </div>
        )}

        {/* ── CHECKBOX top-left ────────────────────────────── */}
        {selectionMode ? (
          // In selection mode: always visible, click = toggle
          <div
            style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <Checkbox checked={selected} />
          </div>
        ) : (
          // Not in selection mode: ghost, appears on CSS hover, click = enter select + pick this item
          <div
            className="mc-chk-ghost"
            style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}
            onClick={(e) => { e.stopPropagation(); onSelectStart(); }}
          >
            <Checkbox checked={false} faint />
          </div>
        )}

        {/* ── ACTION OVERLAY top-right (CSS hover, not in selection mode) ── */}
        {!selectionMode && (
          <div
            className="mc-overlay"
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.42)', borderRadius: '10px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
              padding: '8px', gap: '6px',
            }}
          >
            {!isArchive && (
              <button
                onClick={(e) => { e.stopPropagation(); onPin(item._id, item.pinned); }}
                title={item.pinned ? 'Unpin' : 'Pin to top'}
                style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: item.pinned ? '#f59e0b' : 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <IconPin filled={item.pinned} />
              </button>
            )}

            <button
              onClick={handleCopyLink}
              title={copied ? 'Copied!' : 'Copy link'}
              style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: copied ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <IconLink />
            </button>

            {/* Three-dot — dropdown rendered OUTSIDE overflow:hidden so it doesn't clip */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
                title="More options"
                style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: menuOpen ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <svg width="3" height="13" viewBox="0 0 3 13" fill="#fff">
                  <circle cx="1.5" cy="1.5" r="1.5"/><circle cx="1.5" cy="6.5" r="1.5"/><circle cx="1.5" cy="11.5" r="1.5"/>
                </svg>
              </button>

              {/* Dropdown: rendered relative to this div, opens UPWARD, NOT clipped by thumbnail */}
              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    background: '#26272a', border: '1px solid #3a3b3d', borderRadius: '8px',
                    minWidth: '148px', zIndex: 9999, overflow: 'hidden',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.55)',
                    padding: '3px',
                  }}
                  ref={(el) => {
                    if (!el || !menuRef.current) return;
                    const btn = menuRef.current.getBoundingClientRect();
                    el.style.right = `${window.innerWidth - btn.right}px`;
                    el.style.top = `${btn.top - el.offsetHeight - 6}px`;
                  }}
                >
                  {menuItems.map((opt, i) => (
                    <button
                      key={opt.label}
                      onClick={(e) => { e.stopPropagation(); opt.action(e); }}
                      style={{
                        width: '100%', padding: '7px 10px', border: 'none',
                        background: 'transparent',
                        color: opt.danger ? '#ef4444' : '#e5e7eb',
                        fontSize: '12.5px', textAlign: 'left', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontFamily: 'inherit', borderRadius: '5px',
                        marginTop: i > 0 && opt.danger ? '3px' : '0',
                        borderTop: 'none',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = opt.danger ? 'rgba(239,68,68,0.1)' : '#333436'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: opt.danger ? '#ef4444' : '#9ca3af', display: 'flex' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Title ─────────────────────────────────────────────── */}
      <div style={{ marginTop: '8px', padding: '0 2px' }} onClick={(e) => { if (!selectionMode) e.stopPropagation(); }}>
        {renaming ? (
          <input
            ref={renameRef}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => { if (e.key === 'Enter') submitRename(); if (e.key === 'Escape') setRenaming(false); }}
            style={{ width: '100%', background: '#1e1f20', border: '1px solid #6366f1', borderRadius: '4px', color: '#fff', fontSize: '13px', padding: '3px 6px', outline: 'none', fontFamily: 'inherit' }}
          />
        ) : (
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: selected ? '#a5b4fc' : '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </p>
        )}
        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6b7280' }}>{timeAgo(item.createdAt)}</p>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'videos', label: 'Videos', path: 'videos' },
  { key: 'screenshots', label: 'Screenshots', path: 'screenshots' },
  { key: 'archive', label: 'Archive', path: 'archive' },
];

const MediaLibrary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [videos, setVideos] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [archivedVideos, setArchivedVideos] = useState([]);
  const [archivedScreenshots, setArchivedScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set());

  const activeTab = location.pathname.includes('/archive')
    ? 'archive'
    : location.pathname.includes('/screenshots')
      ? 'screenshots'
      : 'videos';

  useEffect(() => {
    setSelectedKeys(new Set());
    setSelectionMode(false);
  }, [activeTab]);

  const sortItems = (arr) => {
    const sorted = [...arr];
    sorted.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return sort === 'oldest'
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt);
    });
    return sorted;
  };

  const loadAll = useCallback(async () => {
    try {
      const [vidRes, ssActiveRes, ssArchiveRes] = await Promise.all([
        workspaceMeetingsAPI.getAll({ mediaView: true }),
        workspaceScreenshotsAPI.getAll(),
        workspaceScreenshotsAPI.getAll({ archived: 'true' }),
      ]);
      if (vidRes.data.success) {
        const all = vidRes.data.data.filter(m => m.recording?.url);
        setVideos(sortItems(all.filter(m => !m.archived)));
        setArchivedVideos(all.filter(m => m.archived));
      }
      if (ssActiveRes.data.success) setScreenshots(sortItems(ssActiveRes.data.data));
      if (ssArchiveRes.data.success) setArchivedScreenshots(ssArchiveRes.data.data);
    } catch {}
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  const handlePinVideo = async (id) => { await workspaceMeetingsAPI.pin(id); loadAll(); };
  const handleArchiveVideo = async (id) => { await workspaceMeetingsAPI.archive(id); loadAll(); };
  const handleDeleteVideo = async (id) => { await workspaceMeetingsAPI.delete(id); loadAll(); };
  const handleRenameVideo = async (id, title) => { await workspaceMeetingsAPI.update(id, { title }); loadAll(); };
  const handleDuplicateVideo = async (id) => { await workspaceMeetingsAPI.duplicate(id); loadAll(); };

  const handlePinSS = async (id, pinned) => { await workspaceScreenshotsAPI.update(id, { pinned: !pinned }); loadAll(); };
  const handleArchiveSS = async (id) => { await workspaceScreenshotsAPI.update(id, { archived: true }); loadAll(); };
  const handleUnarchiveSS = async (id) => { await workspaceScreenshotsAPI.update(id, { archived: false }); loadAll(); };
  const handleDeleteSS = async (id) => { await workspaceScreenshotsAPI.delete(id); loadAll(); };
  const handleRenameSS = async (id, title) => { await workspaceScreenshotsAPI.update(id, { title }); loadAll(); };
  const handleDuplicateSS = async (id) => { await workspaceScreenshotsAPI.duplicate(id); loadAll(); };

  const archiveItems = [
    ...archivedVideos.map(v => ({ ...v, _type: 'video' })),
    ...archivedScreenshots.map(s => ({ ...s, _type: 'screenshot' })),
  ].sort((a, b) => sort === 'oldest'
    ? new Date(a.createdAt) - new Date(b.createdAt)
    : new Date(b.createdAt) - new Date(a.createdAt));

  const currentItems = activeTab === 'videos' ? videos : activeTab === 'screenshots' ? screenshots : archiveItems;
  const archiveCount = archivedVideos.length + archivedScreenshots.length;

  const getItemKey = (item, type) => `${type}-${item._id}`;

  const toggleSelect = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Clicking the ghost checkbox enters select mode + selects this item
  const handleSelectStart = (key) => {
    setSelectionMode(true);
    setSelectedKeys(new Set([key]));
  };

  const allSelected = currentItems.length > 0 && currentItems.every(item => {
    const type = activeTab === 'archive' ? item._type : (activeTab === 'videos' ? 'video' : 'screenshot');
    return selectedKeys.has(getItemKey(item, type));
  });

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
    } else {
      const next = new Set();
      currentItems.forEach(item => {
        const type = activeTab === 'archive' ? item._type : (activeTab === 'videos' ? 'video' : 'screenshot');
        next.add(getItemKey(item, type));
      });
      setSelectedKeys(next);
    }
  };

  const exitSelection = () => { setSelectionMode(false); setSelectedKeys(new Set()); };

  const [bulkLoading, setBulkLoading] = useState(false);

  const handleBulkArchive = async () => {
    setBulkLoading(true);
    try {
      const promises = [];
      for (const key of selectedKeys) {
        const dashIdx = key.indexOf('-');
        const type = key.slice(0, dashIdx);
        const id = key.slice(dashIdx + 1);
        if (type === 'video') {
          promises.push(workspaceMeetingsAPI.archive(id));
        } else {
          const isCurrentlyArchived = activeTab === 'archive';
          promises.push(workspaceScreenshotsAPI.update(id, { archived: !isCurrentlyArchived }));
        }
      }
      await Promise.all(promises);
    } finally {
      setBulkLoading(false);
      exitSelection();
      loadAll();
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedKeys.size} item${selectedKeys.size !== 1 ? 's' : ''} permanently? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const promises = [];
      for (const key of selectedKeys) {
        const dashIdx = key.indexOf('-');
        const type = key.slice(0, dashIdx);
        const id = key.slice(dashIdx + 1);
        if (type === 'video') promises.push(workspaceMeetingsAPI.delete(id));
        else promises.push(workspaceScreenshotsAPI.delete(id));
      }
      await Promise.all(promises);
    } finally {
      setBulkLoading(false);
      exitSelection();
      loadAll();
    }
  };

  const toolbarBtn = {
    padding: '7px 14px', borderRadius: '8px', border: '1px solid #3a3b3d',
    background: '#2a2b2d', color: '#e5e7eb', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ minHeight: '100%', color: '#e5e7eb', fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", padding: '8px 4px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#f9fafb' }}>Media</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2b2d', marginBottom: '24px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { exitSelection(); navigate(`${BASE}/media/${t.path}`); }}
            style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: '14px', fontWeight: activeTab === t.key ? 600 : 400,
              color: activeTab === t.key ? '#fff' : '#6b7280',
              borderBottom: activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
              marginBottom: '-1px', fontFamily: 'inherit', transition: 'color 0.15s',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>

        {/* Left side */}
        {selectionMode ? (
          <div
            onClick={toggleSelectAll}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
          >
            <Checkbox checked={allSelected} />
            <span style={{ fontSize: '13px', color: '#e5e7eb' }}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
            {selectedKeys.size > 0 && (
              <span style={{ fontSize: '13px', color: '#6b7280' }}>· {selectedKeys.size} selected</span>
            )}
          </div>
        ) : (
          <span style={{ fontSize: '13px', color: '#6b7280', flexShrink: 0 }}>
            {currentItems.length} item{currentItems.length !== 1 ? 's' : ''}
          </span>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectionMode ? (
            <>
              {/* Bulk actions inline — always visible */}
              {selectedKeys.size > 0 && (
                <>
                  <button
                    onClick={handleBulkArchive}
                    disabled={bulkLoading}
                    style={{ ...toolbarBtn, opacity: bulkLoading ? 0.6 : 1, cursor: bulkLoading ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={e => { if (!bulkLoading) e.currentTarget.style.background = '#353638'; }}
                    onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                      <line x1="10" y1="12" x2="14" y2="12"/>
                    </svg>
                    {activeTab === 'archive' ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkLoading}
                    style={{ ...toolbarBtn, border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', opacity: bulkLoading ? 0.6 : 1, cursor: bulkLoading ? 'not-allowed' : 'pointer' }}
                    onMouseEnter={e => { if (!bulkLoading) e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                    Delete
                  </button>
                  <div style={{ width: '1px', height: '20px', background: '#3a3b3d' }} />
                </>
              )}
              <button
                onClick={exitSelection}
                style={{ ...toolbarBtn, background: 'transparent', border: '1px solid #3a3b3d', color: '#9ca3af' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2a2b2d'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {currentItems.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  style={toolbarBtn}
                  onMouseEnter={e => e.currentTarget.style.background = '#353638'}
                  onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Select
                </button>
              )}
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{ background: '#2a2b2d', color: '#e5e7eb', border: '1px solid #3a3b3d', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#6b7280', paddingTop: '80px', fontSize: '14px' }}>Loading...</div>
      ) : currentItems.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#6b7280', paddingTop: '80px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.25, display: 'block', margin: '0 auto 12px' }}>
            {activeTab === 'archive'
              ? <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.83 1H5.42l.82-1zM5 19V8h14v11H5zm8.45-9h-2.9v3H8l4 4 4-4h-2.55z"/>
              : activeTab === 'videos'
                ? <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
                : <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            }
          </svg>
          <p style={{ margin: 0, fontSize: '15px' }}>
            {activeTab === 'archive' ? 'No archived items' : `No ${activeTab} yet`}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#4b5563' }}>
            {activeTab === 'archive'
              ? 'Archived videos and screenshots will appear here.'
              : activeTab === 'videos'
                ? 'Record a meeting to see it here.'
                : 'Take a screenshot from the extension.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {currentItems.map(item => {
            const isArchiveTab = activeTab === 'archive';
            const itemType = isArchiveTab ? item._type : (activeTab === 'videos' ? 'video' : 'screenshot');
            const itemId = item._id;
            const itemKey = getItemKey(item, itemType);

            const pinFn = itemType === 'video' ? handlePinVideo : (id, pinned) => handlePinSS(id, pinned);
            const archiveFn = isArchiveTab
              ? (itemType === 'video' ? handleArchiveVideo : handleUnarchiveSS)
              : (itemType === 'video' ? handleArchiveVideo : handleArchiveSS);
            const deleteFn = itemType === 'video' ? handleDeleteVideo : handleDeleteSS;
            const renameFn = itemType === 'video' ? handleRenameVideo : handleRenameSS;
            const duplicateFn = itemType === 'video' ? handleDuplicateVideo : handleDuplicateSS;

            return (
              <MediaCard
                key={`${itemType}-${itemId}`}
                item={item}
                type={itemType}
                isArchive={isArchiveTab}
                showTypeBadge={isArchiveTab}
                onPin={pinFn}
                onArchive={archiveFn}
                onDelete={deleteFn}
                onRename={renameFn}
                onDuplicate={duplicateFn}
                onClick={() => navigate(`${BASE}/media/${itemType === 'video' ? 'videos' : 'screenshots'}/${itemId}`)}
                selectionMode={selectionMode}
                selected={selectedKeys.has(itemKey)}
                onSelect={() => toggleSelect(itemKey)}
                onSelectStart={() => handleSelectStart(itemKey)}
              />
            );
          })}
        </div>
      )}

    </div>
  );
};

export default MediaLibrary;
