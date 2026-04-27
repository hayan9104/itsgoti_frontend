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
    { label: 'Total Videos', value: videos.length },
    { label: 'Total Views', value: videos.reduce((s, v) => s + v.views, 0) },
    { label: 'Conversions', value: videos.reduce((s, v) => s + v.conversions, 0) },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Top Bar */}
      <div style={{
        background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ fontWeight: '700', fontSize: '20px' }}>Goti Videos</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => navigate(`/gotivideos/analytics?shop=${shop}`)} style={{
            background: 'transparent', border: '1px solid #333', borderRadius: '6px',
            padding: '7px 14px', color: '#aaa', fontSize: '13px', cursor: 'pointer'
          }}>📊 Analytics</button>
          <div style={{ color: '#555', fontSize: '13px' }}>{shop}</div>
        </div>
      </div>

      <div style={{ padding: '40px 32px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0 }}>
            {shopData?.name || shop}
          </h1>
          <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>
            Manage your shoppable videos
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '24px'
            }}>
              <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
              <div style={{ fontSize: '30px', fontWeight: '700' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Videos Panel */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '600' }}>Your Videos</h2>
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
              style={{
                background: uploading ? '#3a3a5c' : '#5c6ac4', border: 'none', borderRadius: '8px',
                padding: '10px 20px', color: '#fff', fontSize: '14px',
                fontWeight: '600', cursor: uploading ? 'not-allowed' : 'pointer'
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
              <div style={{ background: '#2a2a2a', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${uploadProgress}%`, height: '100%',
                  background: '#5c6ac4', transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>
                Uploading... {uploadProgress}% — compression will start after upload
              </div>
            </div>
          )}

          {/* Video Grid */}
          {videos.length === 0 && !uploading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🎬</div>
              <div style={{ fontSize: '15px', color: '#888', marginBottom: '6px' }}>No videos yet</div>
              <div style={{ fontSize: '13px' }}>Upload your first video to get started</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: '16px' }}>
              {videos.map(video => (
                <div key={video._id} style={{
                  background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden'
                }}>
                  {/* Thumbnail */}
                  <div style={{ height: '130px', background: '#1e1e1e', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: '32px' }}>🎬</div>
                    )}
                    {/* Status badge */}
                    {video.status !== 'ready' && (
                      <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: video.status === 'processing' ? '#f59e0b' : '#6b7280',
                        borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600'
                      }}>
                        {video.status === 'processing' ? 'Processing...' : video.status}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {video.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '12px' }}>
                      <span>👁 {video.views}</span>
                      <span>🛒 {video.conversions}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/gotivideos/editor/${video._id}?shop=${shop}`)}
                      style={{
                        width: '100%', marginTop: '10px', padding: '6px',
                        background: '#5c6ac4', border: 'none',
                        borderRadius: '6px', color: '#fff', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
                      }}
                    >
                      🏷 Tag Products
                    </button>
                    <button
                      onClick={() => handleDelete(video._id)}
                      style={{
                        width: '100%', marginTop: '6px', padding: '6px',
                        background: 'transparent', border: '1px solid #3a3a3a',
                        borderRadius: '6px', color: '#f87171', fontSize: '12px', cursor: 'pointer'
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
