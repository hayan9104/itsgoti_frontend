import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function GotiVideosDashboard() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');
  const navigate = useNavigate();
  const [shopData, setShopData] = useState(null);
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!shop) return;
    fetch(`/api/gotivideos/shop?shop=${shop}`)
      .then(r => r.json())
      .then(data => { if (data.success) setShopData(data.shop); });
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
    xhr.onload = () => {
      setUploading(false);
      setUploadProgress(0);
      loadVideos();
    };
    xhr.onerror = () => { setUploading(false); alert('Upload failed'); };
    xhr.send(formData);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this video?')) return;
    await fetch(`/api/gotivideos/videos/${id}?shop=${shop}`, { method: 'DELETE' });
    setVideos(v => v.filter(x => x._id !== id));
  };

  if (!shop) { window.location.href = '/gotivideos/install'; return null; }

  const stats = [
    { label: 'Total Videos', value: videos.length, icon: '🎬' },
    { label: 'Total Views', value: videos.reduce((s, v) => s + v.views, 0), icon: '👁' },
    { label: 'Conversions', value: videos.reduce((s, v) => s + v.conversions, 0), icon: '🛒' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f6f6f7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1a1a1a' }}>

      {/* Top Bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e1e3e5',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontWeight: '700', fontSize: '18px', color: '#1a1a1a' }}>Goti Videos</div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => navigate(`/gotivideos/analytics?shop=${shop}`)} style={{
            background: '#fff', border: '1px solid #c9cccf', borderRadius: '6px',
            padding: '7px 14px', color: '#444', fontSize: '13px', cursor: 'pointer',
            fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px'
          }}>📊 Analytics</button>
          <div style={{ color: '#8c9196', fontSize: '13px' }}>{shop}</div>
        </div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#1a1a1a' }}>
            {shopData?.name || shop}
          </h1>
          <p style={{ color: '#6d7175', marginTop: '4px', fontSize: '14px', margin: '4px 0 0' }}>
            Manage your shoppable videos
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: '#fff', border: '1px solid #e1e3e5', borderRadius: '10px', padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>{s.icon}</span>
                <span style={{ color: '#6d7175', fontSize: '13px', fontWeight: '500' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Videos Panel */}
        <div style={{ background: '#fff', border: '1px solid #e1e3e5', borderRadius: '10px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Your Videos</h2>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              style={{
                background: uploading ? '#f1f2f3' : '#5c6ac4',
                border: 'none', borderRadius: '7px',
                padding: '9px 18px', color: uploading ? '#6d7175' : '#fff', fontSize: '14px',
                fontWeight: '600', cursor: uploading ? 'not-allowed' : 'pointer',
                boxShadow: uploading ? 'none' : '0 1px 4px rgba(92,106,196,0.3)'
              }}
            >
              {uploading ? `Uploading ${uploadProgress}%` : '+ Upload Video'}
            </button>
            <input
              type="file" ref={fileInputRef} onChange={handleFileChange}
              accept="video/*" style={{ display: 'none' }}
            />
          </div>

          {/* Upload progress bar */}
          {uploading && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ background: '#f1f2f3', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${uploadProgress}%`, height: '100%',
                  background: '#5c6ac4', transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ color: '#6d7175', fontSize: '12px', marginTop: '6px' }}>
                Uploading... {uploadProgress}% — compression will start after upload
              </div>
            </div>
          )}

          {/* Video Grid */}
          {videos.length === 0 && !uploading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c9196' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎬</div>
              <div style={{ fontSize: '15px', color: '#6d7175', marginBottom: '6px', fontWeight: '500' }}>No videos yet</div>
              <div style={{ fontSize: '13px', color: '#8c9196' }}>Upload your first video to get started</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '16px' }}>
              {videos.map(video => (
                <div key={video._id} style={{
                  background: '#fff', border: '1px solid #e1e3e5', borderRadius: '10px',
                  overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
                >
                  {/* Thumbnail */}
                  <div style={{ height: '130px', background: '#f6f6f7', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: '32px' }}>🎬</div>
                    )}
                    {video.status !== 'ready' && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: video.status === 'processing' ? '#fff3cd' : '#f1f2f3',
                        color: video.status === 'processing' ? '#856404' : '#6d7175',
                        border: `1px solid ${video.status === 'processing' ? '#ffc107' : '#c9cccf'}`,
                        borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600'
                      }}>
                        {video.status === 'processing' ? 'Processing...' : video.status}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1a1a1a' }}>
                      {video.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8c9196', fontSize: '12px', marginBottom: '10px' }}>
                      <span>👁 {video.views}</span>
                      <span>🛒 {video.conversions}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/gotivideos/editor/${video._id}?shop=${shop}`)}
                      style={{
                        width: '100%', padding: '7px',
                        background: '#5c6ac4', border: 'none',
                        borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer',
                        fontWeight: '600', marginBottom: '6px'
                      }}
                    >
                      🏷 Tag Products
                    </button>
                    <button
                      onClick={() => handleDelete(video._id)}
                      style={{
                        width: '100%', padding: '7px',
                        background: '#fff', border: '1px solid #e1e3e5',
                        borderRadius: '6px', color: '#d72c0d', fontSize: '12px', cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
