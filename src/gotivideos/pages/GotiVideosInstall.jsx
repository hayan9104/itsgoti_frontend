import { useState } from 'react';

export default function GotiVideosInstall() {
  const [shop, setShop] = useState('');

  const handleInstall = (e) => {
    e.preventDefault();
    if (!shop) return;
    const domain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    window.location.href = `/api/gotivideos/auth?shop=${domain}`;
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#1a1a1a', borderRadius: '16px', padding: '48px',
        width: '100%', maxWidth: '420px', border: '1px solid #2a2a2a'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Goti Videos
          </div>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Shoppable video widgets for your Shopify store
          </p>
        </div>

        <form onSubmit={handleInstall}>
          <label style={{ color: '#aaa', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
            Your Shopify store name
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="yourstore"
              value={shop}
              onChange={e => setShop(e.target.value)}
              style={{
                flex: 1, background: '#111', border: '1px solid #333',
                borderRadius: '8px', padding: '12px 16px', color: '#fff',
                fontSize: '14px', outline: 'none'
              }}
            />
            <span style={{
              background: '#111', border: '1px solid #333', borderRadius: '8px',
              padding: '12px', color: '#555', fontSize: '13px', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center'
            }}>
              .myshopify.com
            </span>
          </div>

          <button type="submit" style={{
            width: '100%', marginTop: '20px', padding: '14px',
            background: '#5c6ac4', border: 'none', borderRadius: '8px',
            color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer'
          }}>
            Install App
          </button>
        </form>
      </div>
    </div>
  );
}
