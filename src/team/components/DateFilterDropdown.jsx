import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Calendar } from 'lucide-react';
import { baseFont, monoFont } from '../theme';

/**
 * Multi-select date filter. Each ticked option exposes its own From/To range below.
 * `value` shape:
 *   { [key]: { from: 'YYYY-MM-DD' | '', to: 'YYYY-MM-DD' | '' } }
 * Absent keys = filter disabled for that date type.
 *
 * `options` = [{ id, label }, ...]
 */
export default function DateFilterDropdown({ palette, options, value, onChange, compact }) {
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

  const activeKeys = Object.keys(value || {});
  const isAll = activeKeys.length === 0;
  const label = isAll
    ? 'All dates'
    : activeKeys.length === 1
    ? options.find((o) => o.id === activeKeys[0])?.label || '1 date'
    : `${activeKeys.length} dates`;

  const toggle = (id) => {
    if (value[id]) {
      const copy = { ...value };
      delete copy[id];
      onChange(copy);
    } else {
      onChange({ ...value, [id]: { from: '', to: '' } });
    }
  };

  const setRange = (id, field, val) => {
    onChange({ ...value, [id]: { ...(value[id] || { from: '', to: '' }), [field]: val } });
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
          padding: compact ? '6px 10px' : '8px 14px',
          borderRadius: 8,
          backgroundColor: palette.surfaceAlt,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          fontFamily: baseFont,
          fontSize: compact ? 12 : 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        <Calendar size={12} strokeWidth={2} style={{ color: palette.textMute }} />
        By date {label !== 'All dates' && `· ${label}`}
        {!isAll && (
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 999,
              backgroundColor: palette.accent,
              color: palette.accentText,
              fontFamily: monoFont,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}
          >
            {activeKeys.length}
          </span>
        )}
        <ChevronDown size={12} style={{ color: palette.textMute }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 320,
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
              FILTER BY DATE
            </span>
            {!isAll && (
              <button
                type="button"
                onClick={() => onChange({})}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: baseFont,
                  fontSize: 11.5,
                  color: palette.accent,
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {options.map((o, i) => {
            const checked = !!value[o.id];
            const range = value[o.id] || { from: '', to: '' };
            return (
              <div key={o.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${palette.border}` }}>
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
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
                  <span style={{ flex: 1, fontFamily: baseFont, fontSize: 13, color: palette.text }}>{o.label}</span>
                </button>

                {checked && (
                  <div style={{ padding: '4px 12px 12px 38px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.06em' }}>FROM</span>
                    <input
                      type="date"
                      value={range.from || ''}
                      onChange={(e) => setRange(o.id, 'from', e.target.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        backgroundColor: palette.surfaceAlt,
                        border: `1px solid ${palette.border}`,
                        color: palette.text,
                        fontFamily: monoFont,
                        fontSize: 12,
                        outline: 'none',
                        colorScheme: palette.bg === '#0F0E0C' ? 'dark' : 'light',
                      }}
                    />
                    <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.06em' }}>TO</span>
                    <input
                      type="date"
                      value={range.to || ''}
                      onChange={(e) => setRange(o.id, 'to', e.target.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        backgroundColor: palette.surfaceAlt,
                        border: `1px solid ${palette.border}`,
                        color: palette.text,
                        fontFamily: monoFont,
                        fontSize: 12,
                        outline: 'none',
                        colorScheme: palette.bg === '#0F0E0C' ? 'dark' : 'light',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
