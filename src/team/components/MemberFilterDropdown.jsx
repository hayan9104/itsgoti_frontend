import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Users2 } from 'lucide-react';
import { baseFont, monoFont } from '../theme';
import { Avatar } from './Primitives';

export default function MemberFilterDropdown({ palette, members = [], value, onChange, counts = {}, compact }) {
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

  const isAll = value.length === 0 || value.length === members.length;
  const label = isAll
    ? 'All members'
    : value.length === 1
    ? members.find((m) => m._id === value[0])?.name || '1 member'
    : `${value.length} members`;

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
        <Users2 size={12} strokeWidth={2} style={{ color: palette.textMute }} />
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
            minWidth: 240,
            maxHeight: 360,
            overflowY: 'auto',
            backgroundColor: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
            zIndex: 50,
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
              position: 'sticky',
              top: 0,
            }}
          >
            <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', fontWeight: 500 }}>
              FILTER BY MEMBER
            </span>
            <button
              type="button"
              onClick={() => onChange(isAll ? members.map((m) => m._id) : [])}
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
          {members.length === 0 ? (
            <div style={{ padding: 16, fontFamily: baseFont, fontSize: 13, color: palette.textMute, textAlign: 'center' }}>
              No team members yet.
            </div>
          ) : (
            members.map((m) => {
              const checked = isAll || value.includes(m._id);
              const n = counts[m._id] || 0;
              return (
                <button
                  type="button"
                  key={m._id}
                  onClick={() => toggle(m._id)}
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
                  <Avatar initials={m.avatar} size={22} palette={palette} />
                  <span style={{ flex: 1, fontFamily: baseFont, fontSize: 13, color: palette.text }}>{m.name}</span>
                  <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute }}>{n}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
