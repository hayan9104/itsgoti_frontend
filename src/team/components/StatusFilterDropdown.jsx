import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Filter } from 'lucide-react';
import { baseFont, monoFont, taskStatusMeta } from '../theme';

const STATUSES = [
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'review', label: 'In review' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'completed', label: 'Done' },
];

export default function StatusFilterDropdown({ palette, isDark, value, onChange, counts = {}, compact }) {
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

  const isAll = value.length === 0 || value.length === STATUSES.length;
  const label = isAll
    ? 'All status'
    : value.length === 1
    ? STATUSES.find((s) => s.id === value[0])?.label || '1 status'
    : `${value.length} statuses`;

  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };
  const selectAll = () => onChange([]);
  const clearAll = () => onChange(STATUSES.map((s) => s.id).filter((id) => !value.includes(id)).length ? [] : value);

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
        <Filter size={12} strokeWidth={2} style={{ color: palette.textMute }} />
        {label}
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
            {value.length}
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
              FILTER BY STATUS
            </span>
            <button
              type="button"
              onClick={isAll ? () => onChange(STATUSES.map((s) => s.id)) : selectAll}
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
              {isAll ? 'Select none' : 'Select all'}
            </button>
          </div>
          {STATUSES.map((s) => {
            const checked = isAll || value.includes(s.id);
            const meta = taskStatusMeta(palette, isDark)[s.id] || {};
            const n = counts[s.id] || 0;
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
                  borderTop: `1px solid ${palette.border}`,
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
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: meta.text || palette.textMute,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, fontFamily: baseFont, fontSize: 13, color: palette.text }}>{s.label}</span>
                <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute }}>{n}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
