import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const FolderSVG = () => (
  <svg width="72" height="58" viewBox="0 0 72 58" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 8C0 3.58 3.58 0 8 0H26L33 9H64C68.42 9 72 12.58 72 17V50C72 54.42 68.42 58 64 58H8C3.58 58 0 54.42 0 50V8Z" fill="#888"/>
    <path d="M0 17H72V50C72 54.42 68.42 58 64 58H8C3.58 58 0 54.42 0 50V17Z" fill="#9e9e9e"/>
  </svg>
);

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" fill={active ? '#fff' : '#666'} />
  </svg>
);

const MediaIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="3" stroke={active ? '#fff' : '#666'} strokeWidth="2" />
    <path d="M9 8L17 12L9 16V8Z" fill={active ? '#fff' : '#666'} />
  </svg>
);

const ShoppableIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke={active ? '#fff' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6H21" stroke={active ? '#fff' : '#666'} strokeWidth="2"/>
    <path d="M16 10C16 12.21 14.21 14 12 14C9.79 14 8 12.21 8 10" stroke={active ? '#fff' : '#666'} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function GotiVideosDashboard() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('media');
  const [activeSubNav, setActiveSubNav] = useState('all');
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!shop) return;
    loadVideos();
  }, [shop]);

  const loadVideos = () => {
    fetch(`/api/gotivideos/videos?shop=${shop}`)
      .then(r => r.json())
      .then(data => { if (data.success) setVideos(data.data); });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));
    setUploading(true);
    setUploadProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/gotivideos/videos?shop=${shop}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => { setUploading(false); setUploadProgress(0); loadVideos(); };
    xhr.onerror = () => { setUploading(false); alert('Upload failed'); };
    xhr.send(formData);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this video?')) return;
    await fetch(`/api/gotivideos/videos/${id}?shop=${shop}`, { method: 'DELETE' });
    setVideos(v => v.filter(x => x._id !== id));
  };

  if (!shop) { window.location.href = '/gotivideos/install'; return null; }

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );

  const recentVideos = [...videos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

  const getDisplayVideos = () => {
    if (activeSubNav === 'recent') return recentVideos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));
    return filteredVideos;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const totalSizeMB = videos.reduce((s, v) => s + (v.size || 0), 0) / 1024 / 1024;
  const storageLimit = 1024;
  const storagePercent = Math.min((totalSizeMB / storageLimit) * 100, 100);

  const subNavItems = [
    { key: 'all', label: 'All Files', icon: '▦' },
    { key: 'recent', label: 'Recently Added', icon: '↑' },
    { key: 'uploads', label: 'My Uploads', icon: '⬆' },
    { key: 'unused', label: 'Unused Items', icon: '◻' },
    { key: 'deleted', label: 'Recently Deleted', icon: '🗑' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* Icon Sidebar */}
      <div style={{
        width: '64px', background: '#111', flexShrink: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: '16px', gap: '4px', borderRight: '1px solid #222'
      }}>
        {[
          { key: 'home', label: 'Home', Icon: HomeIcon },
          { key: 'media', label: 'Media', Icon: MediaIcon },
          { key: 'shoppable', label: 'Shoppable', Icon: ShoppableIcon },
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            width: '52px', padding: '10px 4px 8px',
            background: activeTab === key ? '#2a2a2a' : 'transparent',
            border: 'none', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
          }}>
            <Icon active={activeTab === key} />
            <span style={{ fontSize: '10px', color: activeTab === key ? '#fff' : '#666', fontWeight: '500' }}>{label}</span>
          </button>
        ))}

        {/* Bottom: Analytics */}
        <div style={{ marginTop: 'auto', marginBottom: '16px' }}>
          <button onClick={() => navigate(`/gotivideos/analytics?shop=${shop}`)} style={{
            width: '52px', padding: '10px 4px 8px',
            background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="12" width="4" height="9" rx="1" fill="#666"/>
              <rect x="10" y="7" width="4" height="14" rx="1" fill="#666"/>
              <rect x="17" y="3" width="4" height="18" rx="1" fill="#666"/>
            </svg>
            <span style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>Analytics</span>
          </button>
        </div>
      </div>

      {/* Sub Sidebar (shown for media tab) */}
      {activeTab === 'media' && (
        <div style={{
          width: '220px', background: '#1a1a1a', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid #252525'
        }}>
          <div style={{ padding: '20px 16px 12px', color: '#888', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Library
          </div>

          {subNavItems.map(item => (
            <button key={item.key} onClick={() => setActiveSubNav(item.key)} style={{
              width: '100%', padding: '9px 16px',
              background: activeSubNav === item.key ? '#2e2e2e' : 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px',
              color: activeSubNav === item.key ? '#fff' : '#aaa',
              fontSize: '13.5px', fontWeight: activeSubNav === item.key ? '600' : '400',
              textAlign: 'left', borderRadius: '6px', margin: '1px 8px', width: 'calc(100% - 16px)'
            }}>
              <span style={{ fontSize: '14px', opacity: 0.7 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          {/* Storage indicator */}
          <div style={{ marginTop: 'auto', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '2px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  width: `${Math.max(storagePercent * 0.24, 4)}px`,
                  height: `${Math.max(storagePercent * 0.24, 4)}px`,
                  borderRadius: '50%', background: '#0dbaab'
                }} />
              </div>
              <div>
                <div style={{ color: '#aaa', fontSize: '11px' }}>Storage available</div>
                <div style={{ color: '#666', fontSize: '11px' }}>{totalSizeMB.toFixed(2)}GB of {(storageLimit / 1024).toFixed(0)}GB</div>
              </div>
            </div>
            <div style={{ background: '#333', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${storagePercent}%`, height: '100%', background: '#0dbaab', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '60px 40px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>
              Get started with your shoppable videos
            </h1>
            <p style={{ color: '#6d7175', fontSize: '15px', marginBottom: '48px' }}>
              Upload videos, tag products, and embed on your Shopify store
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
              {[
                { title: '1. Upload Video', desc: 'Go to Media and upload your product video', icon: '⬆️', tab: 'media' },
                { title: '2. Tag Products', desc: 'Click on the video to tag Shopify products', icon: '🏷️', tab: 'media' },
                { title: '3. Embed Widget', desc: 'Add the widget code to your Shopify theme', icon: '🛒', tab: null },
              ].map((step, i) => (
                <div key={i} onClick={() => step.tab && setActiveTab(step.tab)} style={{
                  background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '14px',
                  padding: '28px 20px', cursor: step.tab ? 'pointer' : 'default',
                  transition: 'box-shadow 0.2s'
                }}
                  onMouseEnter={e => { if (step.tab) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>{step.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a', marginBottom: '8px' }}>{step.title}</div>
                  <div style={{ color: '#6d7175', fontSize: '13px', lineHeight: '1.5' }}>{step.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '48px' }}>
              <button onClick={() => setActiveTab('media')} style={{
                background: '#0dbaab', border: 'none', borderRadius: '8px',
                padding: '13px 32px', color: '#fff', fontSize: '15px',
                fontWeight: '700', cursor: 'pointer'
              }}>
                Go to Media →
              </button>
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <>
            {/* Media Header */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
                {subNavItems.find(s => s.key === activeSubNav)?.label || 'All Files'}
              </h2>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button style={{
                  background: '#fff', border: '1px solid #d1d5db', borderRadius: '7px',
                  padding: '8px 16px', fontSize: '13px', color: '#374151', cursor: 'pointer', fontWeight: '500',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  📁 New folder
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  style={{
                    background: uploading ? '#a3e4df' : '#0dbaab',
                    border: 'none', borderRadius: '7px',
                    padding: '8px 18px', color: '#fff', fontSize: '13px',
                    fontWeight: '700', cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  ⬆ {uploading ? `${uploadProgress}%` : 'Upload'}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" style={{ display: 'none' }} />
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div style={{ padding: '0 24px', background: '#fff', flexShrink: 0 }}>
                <div style={{ padding: '10px 0 0' }}>
                  <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#0dbaab', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ color: '#6d7175', fontSize: '12px', marginTop: '5px', paddingBottom: '8px' }}>
                    Uploading... {uploadProgress}% — compression starts after upload completes
                  </div>
                </div>
              </div>
            )}

            {/* Search + Filters */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search"
                style={{
                  width: '100%', padding: '9px 14px', fontSize: '14px',
                  border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none',
                  background: '#f9fafb', color: '#1a1a1a', boxSizing: 'border-box'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                {['Media Type', 'Usage rights'].map(f => (
                  <button key={f} style={{
                    padding: '5px 12px', background: '#fff', border: '1px solid #d1d5db',
                    borderRadius: '20px', fontSize: '12px', color: '#374151', cursor: 'pointer', fontWeight: '500'
                  }}>{f}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', color: '#6d7175', fontSize: '13px' }}>
                  Date created
                  <span style={{ fontSize: '11px' }}>↓</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {getDisplayVideos().length === 0 && !uploading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>No videos yet</div>
                  <div style={{ fontSize: '13px' }}>Upload your first video to get started</div>
                  <button onClick={() => fileInputRef.current.click()} style={{
                    marginTop: '20px', background: '#0dbaab', border: 'none', borderRadius: '8px',
                    padding: '11px 24px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                  }}>⬆ Upload Video</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {getDisplayVideos().map(video => (
                    <div
                      key={video._id}
                      style={{ cursor: 'pointer', position: 'relative' }}
                      onMouseEnter={() => setHoveredVideo(video._id)}
                      onMouseLeave={() => setHoveredVideo(null)}
                    >
                      {/* Thumbnail box */}
                      <div style={{
                        height: '120px', background: '#f3f4f6', borderRadius: '10px',
                        overflow: 'hidden', position: 'relative', border: '1px solid #e5e7eb',
                        boxShadow: hoveredVideo === video._id ? '0 4px 14px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
                        transition: 'box-shadow 0.2s'
                      }}>
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🎬</div>
                        )}

                        {/* Status badge */}
                        {video.status !== 'ready' && (
                          <div style={{
                            position: 'absolute', top: '6px', left: '6px',
                            background: 'rgba(0,0,0,0.65)', color: '#fbbf24',
                            borderRadius: '4px', padding: '2px 7px', fontSize: '10px', fontWeight: '600'
                          }}>
                            {video.status === 'processing' ? 'Processing...' : video.status}
                          </div>
                        )}

                        {/* Size badge */}
                        {video.size && (
                          <div style={{
                            position: 'absolute', bottom: '6px', right: '6px',
                            background: 'rgba(0,0,0,0.55)', color: '#fff',
                            borderRadius: '4px', padding: '2px 6px', fontSize: '10px', fontWeight: '600'
                          }}>
                            {formatSize(video.size)}
                          </div>
                        )}

                        {/* Hover overlay */}
                        {hoveredVideo === video._id && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                          }}>
                            <button
                              onClick={() => navigate(`/gotivideos/editor/${video._id}?shop=${shop}`)}
                              style={{
                                background: '#0dbaab', border: 'none', borderRadius: '6px',
                                padding: '6px 12px', color: '#fff', fontSize: '12px',
                                fontWeight: '600', cursor: 'pointer'
                              }}
                            >Tag</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(video._id); }}
                              style={{
                                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                                borderRadius: '6px', padding: '6px 10px', color: '#fff',
                                fontSize: '12px', cursor: 'pointer'
                              }}
                            >✕</button>
                          </div>
                        )}
                      </div>

                      {/* Title + meta */}
                      <div style={{ marginTop: '7px', paddingBottom: '4px' }}>
                        <div style={{
                          fontSize: '13px', fontWeight: '500', color: '#1a1a1a',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {video.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'flex', gap: '8px' }}>
                          <span>👁 {video.views}</span>
                          <span>🛒 {video.conversions}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* SHOPPABLE TAB */}
        {activeTab === 'shoppable' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '60px 40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '8px' }}>Shoppable Videos</h2>
            <p style={{ color: '#6d7175', fontSize: '15px' }}>Coming soon — you'll be able to create and manage shoppable video widgets here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
