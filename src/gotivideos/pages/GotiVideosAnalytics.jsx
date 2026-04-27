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
    <div style={{ minHeight: '100vh', background: '#f6f6f7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1a1a1a' }}>

      {/* Top Bar */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e1e3e5',
        padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '14px'
      }}>
        <button onClick={() => navigate(`/gotivideos?shop=${shop}`)} style={{
          background: '#fff', border: '1px solid #c9cccf', borderRadius: '6px',
          padding: '6px 12px', color: '#444', fontSize: '13px', cursor: 'pointer', fontWeight: '500'
        }}>← Back</button>
        <div style={{ fontWeight: '700', fontSize: '18px', color: '#1a1a1a' }}>Analytics</div>
      </div>

      <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>

        {/* Overall Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Views', value: totals.views, color: '#5c6ac4', bg: '#f4f5ff' },
            { label: 'Total Clicks', value: totals.clicks, color: '#b54708', bg: '#fff4e5' },
            { label: 'Conversions', value: totals.conversions, color: '#1a7f37', bg: '#eafbee' },
            { label: 'Click Rate', value: overallCTR + '%', color: '#6d28d9', bg: '#f5f0ff' },
            { label: 'Conv. Rate', value: overallConv + '%', color: '#c0392b', bg: '#fff0f0' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', border: '1px solid #e1e3e5', borderRadius: '10px', padding: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ color: '#6d7175', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: '600' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Per Video Table */}
        <div style={{ background: '#fff', border: '1px solid #e1e3e5', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #e1e3e5', fontWeight: '600', fontSize: '15px', color: '#1a1a1a' }}>
            Per Video Performance
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8c9196' }}>Loading...</div>
          ) : data.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8c9196' }}>No videos yet</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f6f6f7' }}>
                  {['Video', 'Views', 'Clicks', 'Conversions', 'CTR', 'Conv. Rate'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: h === 'Video' ? 'left' : 'right',
                      fontSize: '12px', color: '#6d7175', fontWeight: '600',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      borderBottom: '1px solid #e1e3e5'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((video, i) => (
                  <tr key={video.id} style={{ borderBottom: i < data.length - 1 ? '1px solid #f1f2f3' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt="" style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e1e3e5' }} />
                      ) : (
                        <div style={{ width: '48px', height: '32px', background: '#f6f6f7', borderRadius: '4px', border: '1px solid #e1e3e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🎬</div>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{video.title}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', color: '#1a1a1a' }}>{video.views.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', color: '#b54708', fontWeight: '600' }}>{video.clicks.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '14px', color: '#1a7f37', fontWeight: '600' }}>{video.conversions.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{
                        background: '#f5f0ff', color: '#6d28d9',
                        borderRadius: '4px', padding: '3px 8px', fontSize: '13px', fontWeight: '600'
                      }}>{video.ctr}%</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{
                        background: '#eafbee', color: '#1a7f37',
                        borderRadius: '4px', padding: '3px 8px', fontSize: '13px', fontWeight: '600'
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
