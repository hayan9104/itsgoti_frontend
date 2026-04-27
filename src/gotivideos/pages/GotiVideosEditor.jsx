import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';

export default function GotiVideosEditor() {
  const { videoId } = useParams();
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const [tags, setTags] = useState([]);
  const [pendingDot, setPendingDot] = useState(null); // { x, y } in %
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');

  useEffect(() => {
    if (!shop || !videoId) return;
    // Load video info
    fetch(`/api/gotivideos/videos?shop=${shop}`)
      .then(r => r.json())
      .then(data => {
        const video = data.data?.find(v => v._id === videoId);
        if (video) {
          setVideoUrl(video.compressedUrl || video.originalUrl);
          setVideoTitle(video.title);
        }
      });
    // Load existing tags
    fetch(`/api/gotivideos/videos/${videoId}/tags?shop=${shop}`)
      .then(r => r.json())
      .then(data => { if (data.success) setTags(data.data); });
  }, [shop, videoId]);

  // Search products
  useEffect(() => {
    if (!showProductSearch) return;
    const timer = setTimeout(() => {
      fetch(`/api/gotivideos/products?shop=${shop}&search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => { if (data.success) setProducts(data.data); });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, showProductSearch]);

  const handleVideoClick = (e) => {
    if (showProductSearch) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingDot({ x, y });
    setShowProductSearch(true);
    setSearchQuery('');
    setProducts([]);
    // Fetch all products immediately
    fetch(`/api/gotivideos/products?shop=${shop}&search=`)
      .then(r => r.json())
      .then(data => { if (data.success) setProducts(data.data); });
  };

  const handleSelectProduct = async (product) => {
    if (!pendingDot) return;
    const res = await fetch(`/api/gotivideos/videos/${videoId}/tags?shop=${shop}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: String(product.id),
        productTitle: product.title,
        productImage: product.image,
        productPrice: product.price,
        productUrl: `https://${shop}/products/${product.handle}`,
        positionX: pendingDot.x,
        positionY: pendingDot.y,
      }),
    });
    const data = await res.json();
    if (data.success) {
      setTags(t => [...t, data.data]);
    }
    setShowProductSearch(false);
    setPendingDot(null);
  };

  const handleDeleteTag = async (tagId) => {
    await fetch(`/api/gotivideos/videos/${videoId}/tags/${tagId}?shop=${shop}`, { method: 'DELETE' });
    setTags(t => t.filter(x => x._id !== tagId));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Top Bar */}
      <div style={{
        background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <button onClick={() => navigate(`/gotivideos?shop=${shop}`)} style={{
          background: 'transparent', border: '1px solid #333', borderRadius: '6px',
          padding: '6px 12px', color: '#aaa', fontSize: '13px', cursor: 'pointer'
        }}>← Back</button>
        <div style={{ fontWeight: '600', fontSize: '16px' }}>{videoTitle || 'Video Editor'}</div>
        <div style={{ marginLeft: 'auto', color: '#666', fontSize: '13px' }}>
          Click on the video to tag a product
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 57px)' }}>

        {/* Video Area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
          <div style={{ position: 'relative', cursor: 'crosshair', maxWidth: '800px', width: '100%' }}>
            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                style={{ width: '100%', borderRadius: '12px', display: 'block' }}
              />
            ) : (
              <div style={{ background: '#1a1a1a', borderRadius: '12px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                Loading video...
              </div>
            )}

            {/* Clickable overlay for tagging */}
            <div
              onClick={handleVideoClick}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                bottom: '40px', // leave controls area
                cursor: 'crosshair',
              }}
            />

            {/* Render product dots */}
            {tags.map(tag => (
              <div key={tag._id} style={{
                position: 'absolute',
                left: `${tag.positionX}%`,
                top: `${tag.positionY}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#5c6ac4', border: '3px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                }}>
                  🛍
                </div>
                {/* Tooltip on hover */}
                <div style={{
                  position: 'absolute', bottom: '36px', left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px',
                  padding: '8px 12px', whiteSpace: 'nowrap', fontSize: '12px',
                  pointerEvents: 'none',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  {tag.productImage && (
                    <img src={tag.productImage} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '2px' }}>{tag.productTitle}</div>
                    <div style={{ color: '#5c6ac4' }}>${tag.productPrice}</div>
                  </div>
                  <button onClick={() => handleDeleteTag(tag._id)} style={{
                    background: 'transparent', border: 'none', color: '#f87171',
                    cursor: 'pointer', fontSize: '14px', marginLeft: '4px'
                  }}>✕</button>
                </div>
              </div>
            ))}

            {/* Pending dot */}
            {pendingDot && (
              <div style={{
                position: 'absolute',
                left: `${pendingDot.x}%`, top: `${pendingDot.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#f59e0b', border: '3px solid #fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                animation: 'pulse 1s infinite',
                zIndex: 10,
              }} />
            )}
          </div>
        </div>

        {/* Right Panel — Tagged Products */}
        <div style={{
          width: '280px', background: '#1a1a1a', borderLeft: '1px solid #2a2a2a',
          padding: '20px', overflowY: 'auto'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '16px', fontSize: '14px' }}>
            Tagged Products ({tags.length})
          </div>
          {tags.length === 0 ? (
            <div style={{ color: '#555', fontSize: '13px' }}>
              Click on the video to tag products
            </div>
          ) : (
            tags.map(tag => (
              <div key={tag._id} style={{
                background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px',
                padding: '10px', marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center'
              }}>
                {tag.productImage && (
                  <img src={tag.productImage} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tag.productTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: '#5c6ac4' }}>${tag.productPrice}</div>
                </div>
                <button onClick={() => handleDeleteTag(tag._id)} style={{
                  background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '16px'
                }}>✕</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Search Modal */}
      {showProductSearch && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a', borderRadius: '16px', padding: '24px',
            width: '480px', maxHeight: '70vh', display: 'flex', flexDirection: 'column',
            border: '1px solid #2a2a2a'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Tag a Product</div>
              <button onClick={() => { setShowProductSearch(false); setPendingDot(null); }} style={{
                background: 'transparent', border: 'none', color: '#aaa', fontSize: '20px', cursor: 'pointer'
              }}>✕</button>
            </div>

            <input
              autoFocus
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: '#111', border: '1px solid #333', borderRadius: '8px',
                padding: '10px 14px', color: '#fff', fontSize: '14px',
                outline: 'none', marginBottom: '16px'
              }}
            />

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {products.length === 0 ? (
                <div style={{ color: '#555', textAlign: 'center', padding: '24px', fontSize: '14px' }}>
                  No products found
                </div>
              ) : products.map(product => (
                <div key={product.id} onClick={() => handleSelectProduct(product)} style={{
                  display: 'flex', gap: '12px', alignItems: 'center',
                  padding: '10px', borderRadius: '8px', cursor: 'pointer',
                  marginBottom: '6px', transition: 'background 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#252525'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {product.image ? (
                    <img src={product.image} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', background: '#222', borderRadius: '6px', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{product.title}</div>
                    <div style={{ fontSize: '13px', color: '#5c6ac4' }}>${product.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
