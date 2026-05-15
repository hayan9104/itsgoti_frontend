import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Filter } from 'lucide-react';
import { baseFont, monoFont, serifFont } from '../theme';
import { Card } from './Primitives';

const SERIES = [
  { id: 'active', label: 'Active hours', color: '#2D5A3D' },
  { id: 'afk', label: 'AFK', color: '#A78BFA' },
  { id: 'overtime', label: 'Overtime (>8h active)', color: '#EA580C' },
  { id: 'late', label: 'Late start', color: '#DC2626' },
];

function FilterDropdown({ palette, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const isAll = value.length === SERIES.length;
  const label = isAll ? 'All series' : value.length === 1 ? SERIES.find((s) => s.id === value[0])?.label : `${value.length} series`;

  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 8,
          backgroundColor: palette.surfaceAlt,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          fontFamily: baseFont,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Filter size={12} strokeWidth={2} style={{ color: palette.textMute }} />
        {label}
        <ChevronDown size={12} style={{ color: palette.textMute }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 220,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              borderBottom: `1px solid ${palette.border}`,
              backgroundColor: palette.surfaceAlt,
            }}
          >
            <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', fontWeight: 500 }}>
              SHOW SERIES
            </span>
            <button
              type="button"
              onClick={() => onChange(isAll ? [] : SERIES.map((s) => s.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: baseFont, fontSize: 11.5, color: palette.accent, fontWeight: 500, padding: 0 }}
            >
              {isAll ? 'Hide all' : 'Show all'}
            </button>
          </div>
          {SERIES.map((s, i) => {
            const checked = value.includes(s.id);
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggle(s.id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `1.5px solid ${checked ? palette.accent : palette.border}`,
                    backgroundColor: checked ? palette.accent : palette.surface,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {checked && <Check size={11} strokeWidth={3} color={palette.accentText} />}
                </span>
                <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: s.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: baseFont, fontSize: 13, color: palette.text }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Stacked bar chart used by both the admin Reports overview and the per-employee Drilldown.
 * Each datum: { date, hours, afkHours, overtimeHours, late }.
 *
 * Cursor-following segment tooltip shows the exact value of whichever bar segment the user
 * is hovering. Filter dropdown toggles which series stack.
 */
export default function HoursByDayChart({ palette, series = [], title = 'Hours by day', accent = '#2D5A3D' }) {
  const [visible, setVisible] = useState(['active', 'afk', 'overtime', 'late']);
  const [hover, setHover] = useState(null); // { x, y, label, value, color }

  const showActive = visible.includes('active');
  const showAfk = visible.includes('afk');
  const showOvertime = visible.includes('overtime');
  const showLate = visible.includes('late');

  const maxH = Math.max(
    8,
    ...series.map(
      (s) => (showActive ? s.hours || 0 : 0) + (showAfk ? s.afkHours || 0 : 0) + (showOvertime ? s.overtimeHours || 0 : 0)
    )
  );

  const showSeg = (e, label, value, color, suffix = 'h') => {
    setHover({ x: e.clientX, y: e.clientY, label, value: `${(value || 0).toFixed(2)}${suffix}`, color });
  };
  const moveSeg = (e) => setHover((p) => (p ? { ...p, x: e.clientX, y: e.clientY } : null));
  const hideSeg = () => setHover(null);

  return (
    <Card palette={palette} padding={24} style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>{title}</h3>
        <FilterDropdown palette={palette} value={visible} onChange={setVisible} />
      </div>

      {series.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>No sessions yet.</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, height: 220 }}>
          {series.map((d) => {
            const active = showActive ? (d.hours || 0) : 0;
            const afk = showAfk ? (d.afkHours || 0) : 0;
            const ot = showOvertime ? (d.overtimeHours || 0) : 0;
            const total = active + afk + ot;
            const baseH = (active / maxH) * 180;
            const afkH = (afk / maxH) * 180;
            const otH = (ot / maxH) * 180;
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>{total.toFixed(1)}h</div>
                <div
                  style={{
                    width: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    borderRadius: '4px 4px 0 0',
                    overflow: 'hidden',
                    minHeight: 2,
                  }}
                >
                  {showActive && active > 0 && (
                    <div
                      style={{ height: `${baseH}px`, backgroundColor: accent, cursor: 'pointer' }}
                      onMouseEnter={(e) => showSeg(e, 'Active hours', active, accent)}
                      onMouseMove={moveSeg}
                      onMouseLeave={hideSeg}
                    />
                  )}
                  {showAfk && afk > 0 && (
                    <div
                      style={{ height: `${afkH}px`, backgroundColor: '#A78BFA', cursor: 'pointer' }}
                      onMouseEnter={(e) => showSeg(e, 'AFK', afk, '#A78BFA')}
                      onMouseMove={moveSeg}
                      onMouseLeave={hideSeg}
                    />
                  )}
                  {showOvertime && ot > 0 && (
                    <div
                      style={{ height: `${otH}px`, backgroundColor: '#EA580C', cursor: 'pointer' }}
                      onMouseEnter={(e) => showSeg(e, 'Overtime', ot, 'h (>8h active)')}
                      onMouseMove={moveSeg}
                      onMouseLeave={hideSeg}
                    />
                  )}
                  {showLate && (d.late || 0) > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 6,
                        backgroundColor: '#DC2626',
                        opacity: 0.85,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => setHover({ x: e.clientX, y: e.clientY, label: 'Late starts', value: `${d.late}`, color: '#DC2626' })}
                      onMouseMove={moveSeg}
                      onMouseLeave={hideSeg}
                    />
                  )}
                </div>
                <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textDim }}>
                  {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', paddingTop: 16, marginTop: 16, borderTop: `1px solid ${palette.border}` }}>
        {SERIES.filter((s) => visible.includes(s.id)).map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s.color }} />
            <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim }}>{s.label}</span>
          </div>
        ))}
      </div>

      {hover && <SegmentTooltip palette={palette} hover={hover} />}
    </Card>
  );
}

function SegmentTooltip({ palette, hover }) {
  const W = 180;
  const H = 50;
  let left = hover.x + 14;
  let top = hover.y + 14;
  if (typeof window !== 'undefined') {
    if (left + W + 8 > window.innerWidth) left = hover.x - W - 14;
    if (top + H + 8 > window.innerHeight) top = hover.y - H - 14;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
  }
  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 1000,
        padding: '10px 12px',
        borderRadius: 8,
        backgroundColor: palette.text,
        color: palette.bg,
        fontFamily: baseFont,
        fontSize: 12,
        boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
        pointerEvents: 'none',
        minWidth: 140,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.7, fontSize: 11, fontFamily: monoFont, letterSpacing: '0.06em', marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: hover.color }} />
        {hover.label.toUpperCase()}
      </div>
      <div style={{ fontFamily: monoFont, fontSize: 16, fontWeight: 500 }}>{hover.value}</div>
    </div>
  );
}
