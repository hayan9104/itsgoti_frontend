import { useEffect, useState } from 'react';
import { ChevronLeft, Heart, Wallet, Coins } from 'lucide-react';
import { teamLeavesAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont } from '../theme';
import { Avatar, Card, PageHeader, StatTile } from '../components/Primitives';

const CATEGORY_META = {
  sick: { label: 'Sick leave', color: '#7C3AED', bg: '#F5F3FF', icon: Heart, accentDeep: '#5B21B6' },
  paid: { label: 'Paid leave', color: '#0E7490', bg: '#ECFEFF', icon: Wallet, accentDeep: '#0E7490' },
  unpaid: { label: 'Unpaid leave', color: '#6B7280', bg: '#F3F4F6', icon: Coins, accentDeep: '#374151' },
};

function fmtNum(n) {
  if (n === 0 || n == null) return '0';
  // Show up to 2 decimals only when not a whole number.
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function fmtRange(l) {
  const s = new Date(l.startDate);
  const e = new Date(l.endDate);
  const sameDay = s.toDateString() === e.toDateString();
  const opt = { day: 'numeric', month: 'short' };
  if (sameDay) return s.toLocaleDateString('en-IN', opt);
  return `${s.toLocaleDateString('en-IN', opt)} – ${e.toLocaleDateString('en-IN', opt)}`;
}

function leaveTypeLabel(l) {
  if (l.type === 'half') return '½ day';
  if (l.type === 'hours') return `${l.durationHours || 0}h`;
  return null;
}

export default function LeaveCategoryDetailView({ palette, isDark, employeeId, category: initialCategory, onBack, openLeave }) {
  const [category, setCategory] = useState(initialCategory || 'sick');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (initialCategory) setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    setLoading(true);
    setError('');
    teamLeavesAPI
      .balanceDetail(employeeId, year)
      .then(({ data }) => {
        if (data?.success) setData(data);
        else setError(data?.message || 'Could not load');
      })
      .catch((err) => setError(err?.response?.data?.message || 'Could not load'))
      .finally(() => setLoading(false));
  }, [employeeId, year]);

  const meta = CATEGORY_META[category] || CATEGORY_META.paid;
  const Icon = meta.icon;

  if (loading) {
    return (
      <div>
        <BackBar onBack={onBack} palette={palette} />
        <div style={{ padding: 60, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>Loading…</div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div>
        <BackBar onBack={onBack} palette={palette} />
        <div style={{ padding: 60, textAlign: 'center', color: palette.danger, fontFamily: baseFont, fontSize: 13.5 }}>
          {error || 'Not available.'}
        </div>
      </div>
    );
  }

  const cat = data.detail[category];

  return (
    <div>
      <BackBar onBack={onBack} palette={palette} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${palette.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: meta.bg,
              color: meta.color,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} strokeWidth={2} />
          </span>
          <div>
            <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>
              {data.employee.name.toUpperCase()} · {year}
            </div>
            <h1 style={{ fontFamily: serifFont, fontSize: 30, fontWeight: 400, color: palette.text, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1, marginTop: 4 }}>
              {meta.label}
            </h1>
          </div>
        </div>
        <YearPicker palette={palette} year={year} onChange={setYear} />
      </div>

      {/* Category tabs — switch between sick / paid / unpaid in place */}
      <div
        style={{
          display: 'inline-flex',
          gap: 4,
          padding: 4,
          borderRadius: 10,
          backgroundColor: palette.surfaceAlt,
          border: `1px solid ${palette.border}`,
          marginBottom: 24,
        }}
      >
        {['sick', 'paid', 'unpaid'].map((id) => {
          const m = CATEGORY_META[id];
          const TabIcon = m.icon;
          const active = category === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 7,
                border: 'none',
                background: active ? palette.surface : 'transparent',
                color: active ? m.color : palette.textDim,
                fontFamily: baseFont,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <TabIcon size={13} strokeWidth={2.25} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Summary tiles */}
      <SummaryTiles palette={palette} category={category} cat={cat} />

      {/* Monthly table */}
      <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, marginBottom: 14 }}>
        Month-by-month
      </h3>
      <div className="team-scroll-wrap">
        <Card palette={palette} padding={0}>
          <MonthlyTable palette={palette} category={category} months={cat.monthly} openLeave={openLeave} />
        </Card>
      </div>
    </div>
  );
}

function BackBar({ palette, onBack }) {
  return (
    <button
      type="button"
      onClick={onBack}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        marginBottom: 20,
        fontFamily: baseFont,
        fontSize: 12.5,
        color: palette.textDim,
      }}
    >
      <ChevronLeft size={14} /> Back to leaves
    </button>
  );
}

function YearPicker({ palette, year, onChange }) {
  const current = new Date().getFullYear();
  const years = [current - 2, current - 1, current, current + 1].filter((y) => y >= 2024);
  return (
    <select
      value={year}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        backgroundColor: palette.surfaceAlt,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontFamily: baseFont,
        fontSize: 13,
        outline: 'none',
      }}
    >
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
  );
}

function SummaryTiles({ palette, category, cat }) {
  if (category === 'sick') {
    return (
      <div
        className="team-stack-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          marginBottom: 32,
          backgroundColor: palette.border,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <StatTile palette={palette} label="Year total" value={fmtNum(cat.yearTotal)} sub="annual quota" />
        <StatTile palette={palette} label="Used" value={fmtNum(cat.used)} sub="this year" />
        <StatTile palette={palette} label="Expired" value={fmtNum(cat.expired)} sub="unused months" />
        <StatTile palette={palette} label="This month" value={fmtNum(cat.available)} sub="available now" />
      </div>
    );
  }
  if (category === 'paid') {
    return (
      <div
        className="team-stack-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          marginBottom: 32,
          backgroundColor: palette.border,
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <StatTile palette={palette} label="Year total" value={fmtNum(cat.yearTotal)} sub="accrues monthly" />
        <StatTile palette={palette} label="Used" value={fmtNum(cat.used)} sub="this year" />
        <StatTile palette={palette} label="Available" value={fmtNum(cat.available)} sub="carry-forward balance" />
      </div>
    );
  }
  // unpaid
  return (
    <div
      className="team-stack-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 1,
        marginBottom: 32,
        backgroundColor: palette.border,
        border: `1px solid ${palette.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <StatTile palette={palette} label="Used this year" value={fmtNum(cat.used)} sub="days" />
      <StatTile palette={palette} label="Limit" value="—" sub="no limit on unpaid" />
    </div>
  );
}

function MonthlyTable({ palette, category, months, openLeave }) {
  // Skip months before the employee joined and any future months.
  const visible = months.filter((m) => !m.beforeJoin && !m.isFuture);

  if (category === 'sick') {
    return (
      <>
        <Header palette={palette} cols="1.4fr 1fr 1fr 1fr 1fr 2fr" labels={['MONTH', 'GRANTED', 'USED', 'EXPIRED', 'STATUS', 'LEAVES']} />
        {visible.map((m, i) => (
          <Row
            key={m.month}
            palette={palette}
            cols="1.4fr 1fr 1fr 1fr 1fr 2fr"
            isFirst={i === 0}
            cells={[
              <MonthCell palette={palette} m={m} />,
              <Mono palette={palette}>{fmtNum(m.granted)}</Mono>,
              <Mono palette={palette}>{fmtNum(m.used)}</Mono>,
              <Mono palette={palette} dim={!m.expired}>{fmtNum(m.expired)}</Mono>,
              <SickStatus palette={palette} m={m} />,
              <LeavesList palette={palette} leaves={m.leaves} openLeave={openLeave} />,
            ]}
          />
        ))}
      </>
    );
  }

  if (category === 'paid') {
    return (
      <>
        <Header palette={palette} cols="1.2fr 1fr 1fr 1fr 1fr 2fr" labels={['MONTH', 'CARRIED IN', 'GRANTED', 'USED', 'BALANCE', 'LEAVES']} />
        {visible.map((m, i) => (
          <Row
            key={m.month}
            palette={palette}
            cols="1.2fr 1fr 1fr 1fr 1fr 2fr"
            isFirst={i === 0}
            cells={[
              <MonthCell palette={palette} m={m} />,
              <Mono palette={palette} dim>{fmtNum(m.carriedIn)}</Mono>,
              <Mono palette={palette}>{fmtNum(m.granted)}</Mono>,
              <Mono palette={palette}>{fmtNum(m.used)}</Mono>,
              <Mono palette={palette} bold>{fmtNum(m.balance)}</Mono>,
              <LeavesList palette={palette} leaves={m.leaves} openLeave={openLeave} />,
            ]}
          />
        ))}
      </>
    );
  }

  // unpaid
  return (
    <>
      <Header palette={palette} cols="1.4fr 1fr 3fr" labels={['MONTH', 'USED', 'LEAVES']} />
      {visible.map((m, i) => (
        <Row
          key={m.month}
          palette={palette}
          cols="1.4fr 1fr 3fr"
          isFirst={i === 0}
          cells={[
            <MonthCell palette={palette} m={m} />,
            <Mono palette={palette}>{fmtNum(m.used)}</Mono>,
            <LeavesList palette={palette} leaves={m.leaves} openLeave={openLeave} />,
          ]}
        />
      ))}
    </>
  );
}

function Header({ palette, cols, labels }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        gap: 16,
        padding: '12px 20px',
        borderBottom: `1px solid ${palette.border}`,
        backgroundColor: palette.surfaceAlt,
      }}
    >
      {labels.map((h) => (
        <div key={h} style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.08em', fontWeight: 500 }}>
          {h}
        </div>
      ))}
    </div>
  );
}

function Row({ palette, cols, cells, isFirst }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols,
        gap: 16,
        padding: '14px 20px',
        alignItems: 'flex-start',
        borderTop: isFirst ? 'none' : `1px solid ${palette.border}`,
      }}
    >
      {cells.map((c, i) => (
        <div key={i}>{c}</div>
      ))}
    </div>
  );
}

function MonthCell({ palette, m }) {
  return (
    <div>
      <div style={{ fontFamily: baseFont, fontSize: 13.5, color: m.isFuture ? palette.textMute : palette.text, fontWeight: 500 }}>
        {m.monthName} {m.year}
      </div>
      {m.isCurrent && (
        <div style={{ fontFamily: monoFont, fontSize: 10, color: '#10B981', letterSpacing: '0.06em', fontWeight: 500, marginTop: 2 }}>
          THIS MONTH
        </div>
      )}
      {m.isFuture && (
        <div style={{ fontFamily: monoFont, fontSize: 10, color: palette.textMute, letterSpacing: '0.06em', marginTop: 2 }}>
          UPCOMING
        </div>
      )}
    </div>
  );
}

function Mono({ palette, children, dim, bold }) {
  return (
    <span
      style={{
        fontFamily: monoFont,
        fontSize: 13,
        color: dim ? palette.textMute : palette.text,
        fontWeight: bold ? 500 : 400,
      }}
    >
      {children}
    </span>
  );
}

function SickStatus({ palette, m }) {
  if (m.isFuture) return <Mono palette={palette} dim>—</Mono>;
  if (m.isCurrent) {
    if (m.used > 0) return <Pill bg="#ECFDF5" color="#065F46">USED</Pill>;
    return <Pill bg="#EEF3EF" color="#2D5A3D">AVAILABLE</Pill>;
  }
  if (m.used > 0 && m.expired === 0) return <Pill bg="#ECFDF5" color="#065F46">USED</Pill>;
  if (m.used > 0 && m.expired > 0) return <Pill bg="#FEF2F2" color="#991B1B">PARTIAL</Pill>;
  return <Pill bg="#FEF2F2" color="#991B1B">EXPIRED</Pill>;
}

function Pill({ bg, color, children }) {
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 999,
        backgroundColor: bg,
        color,
        fontFamily: monoFont,
        fontSize: 10.5,
        fontWeight: 500,
        letterSpacing: '0.06em',
      }}
    >
      {children}
    </span>
  );
}

function LeavesList({ palette, leaves, openLeave }) {
  if (!leaves || leaves.length === 0) {
    return <span style={{ fontFamily: baseFont, fontSize: 12.5, color: palette.textMute }}>—</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {leaves.map((l) => {
        const typeLabel = leaveTypeLabel(l);
        return (
          <button
            key={l._id}
            type="button"
            onClick={() => openLeave && openLeave(l._id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
              background: 'none',
              border: 'none',
              cursor: openLeave ? 'pointer' : 'default',
              fontFamily: baseFont,
              fontSize: 12.5,
              color: palette.text,
              textAlign: 'left',
            }}
          >
            <span style={{ fontFamily: monoFont, color: palette.textMute }}>{fmtRange(l)}</span>
            {typeLabel && (
              <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.06em' }}>
                · {typeLabel}
              </span>
            )}
            {l.reason && (
              <span style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                · {l.reason}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
