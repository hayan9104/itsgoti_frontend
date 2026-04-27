import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function GotiVideosAnalytics() {
  const [searchParams] = useSearchParams();
  const shop = searchParams.get('shop');
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({ views: 0, clicks: 0, conversions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;
    fetch(`/api/gotivideos/analytics?shop=${shop}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) { setData(res.data); setTotals(res.totals); }
        setLoading(false);
      });
  }, [shop]);

  const overallCTR = totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(1) : '0.0';
  const overallConv = totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* Top Bar */}
      <div style={{
        background: '#1a1a1a', borderBottom: '1px solid #2a2a2a',
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <button onClick={() => navigate(`/gotivideos?shop=${shop}`)} style={{
          background: 'transparent', border: '1px solid #333', borderRadius: '6px',
          padding: '6px 12px', color: '#aaa', fontSize: '13px', cursor: 'pointer'
        }}>← Back</button>
        <div style={{ fontWeight: '700', fontSize: '18px' }}>Analytics</div>
      </div>

      <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Overall Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Total Views', value: totals.views, color: '#5c6ac4' },
            { label: 'Total Clicks', value: totals.clicks, color: '#f59e0b' },
            { label: 'Conversions', value: totals.conversions, color: '#16a34a' },
            { label: 'Click Rate', value: overallCTR + '%', color: '#e879f9' },
            { label: 'Conv. Rate', value: overallConv + '%', color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '20px'
            }}>
              <div style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Per Video Table */}
        <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2a2a', fontWeight: '600', fontSize: '15px' }}>
            Per Video Performance
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>Loading...</div>
          ) : data.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>No videos yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111' }}>
                  {['Video', 'Views', 'Clicks', 'Conversions', 'CTR', 'Conv. Rate'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: h === 'Video' ? 'left' : 'right',
                      fontSize: '12px', color: '#666', fontWeight: '600',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      borderBottom: '1px solid #2a2a2a'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((video, i) => (
                  <tr key={video.id} style={{ borderBottom: i < data.length - 1 ? '1px solid #1e1e1e' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt="" style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '48px', height: '32px', background: '#222', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎬</div>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{video.title}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px' }}>{video.views.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', color: '#f59e0b' }}>{video.clicks.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', color: '#16a34a' }}>{video.conversions.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{
                        background: '#1e1a3a', color: '#e879f9',
                        borderRadius: '4px', padding: '2px 8px', fontSize: '13px', fontWeight: '600'
                      }}>{video.ctr}%</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{
                        background: '#0d2818', color: '#16a34a',
                        borderRadius: '4px', padding: '2px 8px', fontSize: '13px', fontWeight: '600'
                      }}>{video.convRate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
