import { useState } from 'react';
import PlutioCopyLayout from '../components/PlutioCopyLayout';
import { usePlutioCopyAuth } from '../context/PlutioCopyAuthContext';

/* ─── Mini donut chart via SVG ─── */
const DonutChart = () => {
  const segments = [
    { color: '#60a5fa', pct: 30, label: 'Sample 1: 4' },
    { color: '#f87171', pct: 25, label: 'Sample 2: 373' },
    { color: '#34d399', pct: 22, label: 'Sample 3: 214' },
    { color: '#a78bfa', pct: 23, label: 'Sample 4: 520' },
  ];
  const r = 60, cx = 80, cy = 80, stroke = 22;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.map((s, i) => {
          const dash = (s.pct / 100) * circumference;
          const gap = circumference - dash;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#6b7280">No data</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fill="#6b7280">yet</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#6b7280' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Timesheet heatmap grid ─── */
const TimesheetHeatmap = () => {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const cols = 7;
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {months.map((m) => (
          <div key={m} style={{ flex: 1, minWidth: '50px' }}>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px', textAlign: 'center' }}>{m}</div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '2px' }}>
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '1px',
                  background: Math.random() > 0.85 ? '#6d28d9' : '#e5e7eb',
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        textAlign: 'center', padding: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        color: '#9ca3af', fontSize: '12px',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#d1d5db">
          <path d="M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
        </svg>
        No data yet
      </div>
    </div>
  );
};

/* ─── Weekly calendar ─── */
const WeeklyCalendar = () => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const hours = ['4 pm','5 pm','6 pm','7 pm','8 pm'];

  return (
    <div style={{
      background: '#fff', borderRadius: '12px',
      border: '1px solid #e5e7eb', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>April</span>
          <span style={{ fontSize: '15px', color: '#6b7280' }}>2026</span>
        </div>
        <button style={{
          padding: '4px 12px', border: '1px solid #e5e7eb', borderRadius: '20px',
          background: 'none', fontSize: '12px', color: '#6b7280', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
          </svg>
          Today
        </button>
      </div>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
        <div />
        {days.map((d, i) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);
          const isToday = date.toDateString() === today.toDateString();
          return (
            <div key={d} style={{
              padding: '8px 4px', textAlign: 'center',
              borderLeft: '1px solid #e5e7eb',
            }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{d}</div>
              <div style={{
                fontSize: '14px', fontWeight: isToday ? '700' : '400',
                color: isToday ? '#6d28d9' : '#374151',
              }}>{date.getDate()}</div>
            </div>
          );
        })}
      </div>
      {/* All-day row */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb', minHeight: '28px' }}>
        <div style={{ fontSize: '10px', color: '#9ca3af', padding: '6px 4px', textAlign: 'right' }}>All-day</div>
        {days.map((d) => (
          <div key={d} style={{ borderLeft: '1px solid #e5e7eb' }} />
        ))}
      </div>
      {/* Time slots */}
      {hours.map((h) => (
        <div key={h} style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: '40px' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', padding: '4px 4px', textAlign: 'right', paddingTop: '6px' }}>{h}</div>
          {days.map((d, di) => (
            <div key={d} style={{
              borderLeft: '1px solid #e5e7eb',
              borderTop: '1px solid #f5f5f8',
              background: di >= 3 && di <= 4 ? '#1a1a2e' : 'transparent',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
};

/* ─── Card wrapper ─── */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: '#fff', borderRadius: '12px',
    border: '1px solid #e5e7eb', padding: '18px',
    ...style,
  }}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
    {children}
  </h3>
);

/* ─── Main component ─── */
const Home = () => {
  const { user } = usePlutioCopyAuth();
  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  return (
    <PlutioCopyLayout>
      <div style={{ padding: '24px', minHeight: '100%' }}>

        {/* ── ROW 1: Welcome + Calendar ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Welcome card */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 60%, #7c3aed 100%)',
            borderRadius: '14px', padding: '32px 24px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', minHeight: '200px',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>👋</div>
            <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: '#fff' }}>
              Hey {user?.name}.
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#c4b5fd' }}>
              Today is {dateStr}. Have a good one ✨
            </p>
          </div>

          {/* Weekly calendar */}
          <WeeklyCalendar />
        </div>

        {/* ── ROW 2: Notes + My Tasks + My Progress ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 280px', gap: '16px', marginBottom: '16px' }}>
          {/* Notes */}
          <Card>
            <textarea
              placeholder="Type your notes here..."
              style={{
                width: '100%', minHeight: '160px', border: 'none', outline: 'none',
                fontSize: '13px', color: '#374151', resize: 'vertical',
                fontFamily: 'inherit', background: 'transparent',
                boxSizing: 'border-box',
              }}
            />
          </Card>

          {/* My tasks */}
          <Card>
            <CardTitle>My tasks</CardTitle>
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              minHeight: '120px', color: '#9ca3af',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#d1d5db" style={{ marginBottom: '8px' }}>
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#6b7280' }}>No results found</span>
            </div>
          </Card>

          {/* My progress */}
          <Card>
            <CardTitle>My progress</CardTitle>
            <DonutChart />
          </Card>
        </div>

        {/* ── ROW 3: Timesheet + Billable + Completed ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
          {/* Timesheet */}
          <Card>
            <CardTitle>My Timesheet</CardTitle>
            <TimesheetHeatmap />
          </Card>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Billable time */}
            <Card>
              <CardTitle>Billable time (30 days)</CardTitle>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: '700', color: '#1f2937' }}>$0.00</span>
                <span style={{
                  fontSize: '11px', color: '#22c55e', fontWeight: '600',
                  background: '#dcfce7', borderRadius: '4px', padding: '1px 6px',
                }}>0.00%</span>
              </div>
            </Card>

            {/* Completed tasks */}
            <Card>
              <CardTitle>Completed tasks (30 days)</CardTitle>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: '700', color: '#1f2937' }}>0</span>
                <span style={{
                  fontSize: '11px', color: '#22c55e', fontWeight: '600',
                  background: '#dcfce7', borderRadius: '4px', padding: '1px 6px',
                }}>0.00%</span>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </PlutioCopyLayout>
  );
};

export default Home;
