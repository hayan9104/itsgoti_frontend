import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const API = '/api/goti-videos';
const MAX_UPLOADS = 20;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

export default function GotiVideosStandaloneDashboard() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [activeUploads, setActiveUploads] = useState({}); // { tempId: { name, progress } }
  const [search, setSearch] = useState('');
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const fileInputRef = useRef(null);
  const pollingRef = useRef({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/goti/admin/login'); return; }
    loadVideos();
    return () => Object.values(pollingRef.current).forEach(clearInterval);
  }, []);

  const loadVideos = async () => {
    try {
      const res = await fetch(API, { headers: authHeaders() });
      if (res.status === 401) { navigate('/goti/admin/login'); return; }
      const data = await res.json();
      if (data.success) {
        setVideos(data.data);
        data.data.filter(v => v.status === 'processing').forEach(startPolling);
      }
    } catch (err) {
      console.error('Failed to load videos', err);
    }
  };

  const startPolling = (video) => {
    if (pollingRef.current[video._id]) return;
    pollingRef.current[video._id] = setInterval(async () => {
      try {
        const res = await fetch(`${API}/${video._id}/status`, { headers: authHeaders() });
        const data = await res.json();
        if (data.success && data.data.status === 'ready') {
          clearInterval(pollingRef.current[video._id]);
          delete pollingRef.current[video._id];
          setVideos(v => v.map(x => x._id === video._id ? data.data : x));
        }
      } catch {}
    }, 3000);
  };

  const uploadFile = (file, tempId) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API}/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setActiveUploads(prev => ({ ...prev, [tempId]: { ...prev[tempId], progress: pct } }));
      }
    };

    xhr.onload = () => {
      // Remove placeholder
      setActiveUploads(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.success) {
          setVideos(v => [data.data, ...v]);
          startPolling(data.data);
        }
      } catch {}
    };

    xhr.onerror = () => {
      setActiveUploads(prev => {
        const next = { ...prev };
        delete next[tempId];
        return next;
      });
      alert(`Upload failed for: ${file.name}`);
    };

    xhr.send(formData);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, MAX_UPLOADS);
    e.target.value = '';
    if (!files.length) return;

    files.forEach(file => {
      const tempId = `${Date.now()}-${Math.random()}`;
      setActiveUploads(prev => ({ ...prev, [tempId]: { name: file.name.replace(/\.[^/.]+$/, ''), progress: 0 } }));
      uploadFile(file, tempId);
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this video?')) return;
    await fetch(`${API}/${id}`, { method: 'DELETE', headers: authHeaders() });
    clearInterval(pollingRef.current[id]);
    delete pollingRef.current[id];
    setVideos(v => v.filter(x => x._id !== id));
  };

  const handleCopyLink = (video) => {
    const url = video.compressedUrl || video.originalUrl;
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedId(video._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (video) => {
    const url = video.compressedUrl || video.originalUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = video.title + '.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const uploadingCount = Object.keys(activeUploads).length;

  const sorted = [...videos]
    .filter(v => v.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const hasContent = sorted.length > 0 || uploadingCount > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      onClick={() => setShowSortMenu(false)}>

      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 32px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', background: '#0dbaab', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎬</div>
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>Goti Videos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {uploadingCount > 0 && (
            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              {uploadingCount} uploading...
            </span>
          )}
          <button onClick={() => fileInputRef.current.click()} style={{
            background: '#0dbaab', border: 'none', borderRadius: '8px',
            padding: '9px 20px', color: '#fff', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            ⬆ Upload Video
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" multiple style={{ display: 'none' }} />
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search videos..."
              style={{
                width: '100%', padding: '10px 14px 10px 36px', fontSize: '14px',
                border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none',
                background: '#fff', color: '#1a1a1a', boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowSortMenu(v => !v); }}
              style={{
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
                padding: '10px 16px', fontSize: '13px', color: '#374151',
                cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap'
              }}>
              Sort: {sortBy === 'date' ? 'Newest' : sortBy === 'name' ? 'Name' : 'Size'} ▾
            </button>
            {showSortMenu && (
              <div onClick={e => e.stopPropagation()} style={{
                position: 'absolute', top: '44px', right: 0, background: '#fff',
                border: '1px solid #e5e7eb', borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '160px', overflow: 'hidden'
              }}>
                {[['date','Newest first'],['name','Name A–Z'],['size','Largest first']].map(([key, label], i) => (
                  <button key={key} onClick={() => { setSortBy(key); setShowSortMenu(false); }} style={{
                    width: '100%', padding: '10px 14px', background: sortBy === key ? '#f0faf9' : '#fff',
                    border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px',
                    color: sortBy === key ? '#0dbaab' : '#374151',
                    fontWeight: sortBy === key ? '600' : '400',
                    borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    {label}
                    {sortBy === key && <span style={{ color: '#0dbaab' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Total Videos', value: videos.length },
            { label: 'Ready', value: videos.filter(v => v.status === 'ready').length },
            { label: 'Processing', value: videos.filter(v => v.status === 'processing').length },
            ...(uploadingCount > 0 ? [{ label: 'Uploading', value: uploadingCount }] : []),
          ].map(stat => (
            <div key={stat.label} style={{
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px',
              padding: '14px 20px', minWidth: '120px'
            }}>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!hasContent && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎬</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>No videos yet</div>
            <div style={{ fontSize: '14px', marginBottom: '24px' }}>Upload a video to compress it and get a shareable link</div>
            <button onClick={() => fileInputRef.current.click()} style={{
              background: '#0dbaab', border: 'none', borderRadius: '8px',
              padding: '12px 28px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer'
            }}>⬆ Upload Video</button>
          </div>
        )}

        {/* Grid — upload placeholders + real videos */}
        {hasContent && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>

            {/* Upload placeholder cards */}
            {Object.entries(activeUploads).map(([tempId, { name, progress }]) => (
              <div key={tempId} style={{
                background: '#fff', borderRadius: '12px', overflow: 'hidden',
                border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                {/* Thumbnail placeholder */}
                <div style={{ height: '130px', background: '#f3f4f6', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '28px' }}>⬆</div>
                  <div style={{ width: '70%' }}>
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${progress}%`, height: '100%', background: '#0dbaab',
                        borderRadius: '2px', transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '5px', fontWeight: '600' }}>
                      {progress}%
                    </div>
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: '11px', color: '#0dbaab', marginTop: '3px', fontWeight: '500' }}>Uploading...</div>
                </div>
              </div>
            ))}

            {/* Real video cards */}
            {sorted.map(video => (
              <div key={video._id}
                onMouseEnter={() => setHoveredVideo(video._id)}
                onMouseLeave={() => setHoveredVideo(null)}
                style={{
                  background: '#fff', borderRadius: '12px', overflow: 'hidden',
                  border: '1px solid #e5e7eb', transition: 'box-shadow 0.2s',
                  boxShadow: hoveredVideo === video._id ? '0 6px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.06)'
                }}
              >
                {/* Thumbnail */}
                <div style={{ height: '130px', background: '#f3f4f6', position: 'relative', overflow: 'hidden' }}>
                  {video.thumbnailUrl
                    ? <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>🎬</div>
                  }

                  {/* Compressing overlay */}
                  {video.status === 'processing' && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                      <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ color: '#fff', fontSize: '11px', fontWeight: '600' }}>Compressing...</span>
                    </div>
                  )}

                  {/* Hover actions */}
                  {video.status === 'ready' && hoveredVideo === video._id && (
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                      <ActionBtn icon="▶" title="Play" onClick={() => window.open(video.compressedUrl || video.originalUrl, '_blank')} />
                      <ActionBtn icon={copiedId === video._id ? '✓' : '⧉'} title="Copy link" onClick={() => handleCopyLink(video)} green={copiedId === video._id} />
                      <ActionBtn icon="⬇" title="Download" onClick={() => handleDownload(video)} />
                      <ActionBtn icon="✕" title="Delete" onClick={() => handleDelete(video._id)} danger />
                    </div>
                  )}

                  {/* Size badge */}
                  {video.size && video.status === 'ready' && (
                    <div style={{
                      position: 'absolute', bottom: '6px', right: '6px',
                      background: 'rgba(0,0,0,0.6)', color: '#fff',
                      borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '600'
                    }}>{formatSize(video.size)}</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>
                    {video.status === 'processing'
                      ? <span style={{ color: '#0dbaab', fontWeight: '500' }}>Compressing...</span>
                      : new Date(video.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ActionBtn({ icon, title, onClick, danger, green }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '34px', height: '34px', borderRadius: '8px', border: 'none',
        background: green ? '#0dbaab' : danger ? (hovered ? '#d72c0d' : 'rgba(255,255,255,0.15)') : (hovered ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)'),
        color: '#fff', fontSize: '14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}
    >{icon}</button>
  );
}
