import { Calendar, X } from 'lucide-react';
import { baseFont, monoFont } from '../theme';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'lastmonth', label: 'Last month' },
  { id: 'quarter', label: 'Quarter' },
];

// Returns YYYY-MM-DD for a Date in local time (no timezone shift).
export function toLocalYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Combined period selector + custom-day date input.
 * - When `date` is set, the report is for that single day (period === 'day').
 * - Picking a tab clears `date` and switches `period` to the tab id.
 */
export default function PeriodPicker({ period, date, onChange, palette, periods = PERIODS }) {
  const onTab = (id) => onChange({ period: id, date: null });
  const onDate = (val) => {
    if (!val) onChange({ period: 'today', date: null });
    else onChange({ period: 'day', date: val });
  };

  return (
    <div className="team-mobile-tabbar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 28 }}>
      <div
        style={{
          display: 'inline-flex',
          borderRadius: 10,
          border: `1px solid ${palette.border}`,
          backgroundColor: palette.surface,
          padding: 3,
        }}
      >
        {periods.map((p) => {
          const active = !date && period === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onTab(p.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 7,
                border: 'none',
                backgroundColor: active ? palette.accentBg : 'transparent',
                color: active ? palette.accent : palette.textDim,
                fontFamily: baseFont,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 10,
          border: `1px solid ${date ? palette.accent : palette.border}`,
          backgroundColor: date ? palette.accentBg : palette.surface,
        }}
      >
        <Calendar size={13} style={{ color: date ? palette.accent : palette.textMute, flexShrink: 0 }} />
        <span
          style={{
            fontFamily: monoFont,
            fontSize: 11,
            color: date ? palette.accent : palette.textMute,
            letterSpacing: '0.06em',
          }}
        >
          PICK DAY
        </span>
        <input
          type="date"
          value={date || ''}
          max={toLocalYmd()}
          onChange={(e) => onDate(e.target.value)}
          style={{
            padding: '4px 6px',
            borderRadius: 6,
            backgroundColor: 'transparent',
            border: 'none',
            color: date ? palette.accent : palette.text,
            fontFamily: baseFont,
            fontSize: 12.5,
            fontWeight: 500,
            outline: 'none',
            colorScheme: palette.bg === '#0F0E0C' ? 'dark' : 'light',
          }}
        />
        {date && (
          <button
            type="button"
            onClick={() => onDate('')}
            title="Clear day"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: palette.accent,
              padding: 2,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
