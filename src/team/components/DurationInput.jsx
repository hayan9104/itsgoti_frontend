import { useEffect, useState } from 'react';
import { baseFont, monoFont } from '../theme';

/**
 * Side-by-side hours + minutes picker. Emits the combined total in minutes via onChange.
 *
 *   ┌─────────┐  ┌─────────┐
 *   │ 1   h   │  │ 30  m   │
 *   └─────────┘  └─────────┘
 *
 * `value` is total minutes (number).
 */
export default function DurationInput({ palette, value = 0, onChange, autoFocus }) {
  const [hStr, setHStr] = useState(String(Math.floor((value || 0) / 60)));
  const [mStr, setMStr] = useState(String((value || 0) % 60));

  useEffect(() => {
    setHStr(String(Math.floor((value || 0) / 60)));
    setMStr(String((value || 0) % 60));
  }, [value]);

  const emit = (h, m) => {
    const total = Math.max(0, h * 60 + m);
    onChange?.(total);
  };

  const handleH = (raw) => {
    const cleaned = raw.replace(/[^\d]/g, '').slice(0, 3);
    setHStr(cleaned);
    emit(cleaned === '' ? 0 : Math.min(999, parseInt(cleaned, 10) || 0), mStr === '' ? 0 : Math.min(59, parseInt(mStr, 10) || 0));
  };
  const handleM = (raw) => {
    const cleaned = raw.replace(/[^\d]/g, '').slice(0, 2);
    setMStr(cleaned);
    emit(hStr === '' ? 0 : Math.min(999, parseInt(hStr, 10) || 0), cleaned === '' ? 0 : Math.min(59, parseInt(cleaned, 10) || 0));
  };

  const baseField = {
    width: '100%',
    padding: '10px 28px 10px 12px',
    borderRadius: 8,
    backgroundColor: palette.surfaceAlt,
    border: `1px solid ${palette.border}`,
    color: palette.text,
    fontFamily: monoFont,
    fontSize: 14,
    outline: 'none',
  };
  const baseSuffix = {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    fontFamily: baseFont,
    fontSize: 12,
    color: palette.textMute,
    fontWeight: 500,
    pointerEvents: 'none',
  };

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={hStr}
          onChange={(e) => handleH(e.target.value)}
          onBlur={() => setHStr(hStr === '' ? '0' : hStr)}
          autoFocus={autoFocus}
          aria-label="Hours"
          style={baseField}
        />
        <span style={baseSuffix}>h</span>
      </div>
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={mStr}
          onChange={(e) => handleM(e.target.value)}
          onBlur={() => {
            // Auto-clamp on blur to be friendly: 75 → 60 → 75 stays since we already cap.
            const n = parseInt(mStr || '0', 10);
            if (n > 59) {
              setMStr('59');
              emit(parseInt(hStr || '0', 10), 59);
            } else if (mStr === '') {
              setMStr('0');
            }
          }}
          aria-label="Minutes"
          style={baseField}
        />
        <span style={baseSuffix}>m</span>
      </div>
    </div>
  );
}
