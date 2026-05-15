import { useEffect, useState } from 'react';
import { FileText, Eye, Download, Check, Users2, Calendar } from 'lucide-react';
import { teamEmployeesAPI } from '../teamAPI';
import { baseFont, monoFont } from '../theme';
import { Avatar, Card, Modal, GhostButton, SolidButton } from './Primitives';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'lastweek', label: 'Last week' },
  { id: 'month', label: 'This month' },
  { id: 'lastmonth', label: 'Last month' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'year', label: 'This year' },
  { id: 'all', label: 'All time' },
];

/**
 * Reusable modal that collects period(s) + (optional) person(s) and opens the
 * print view in a new tab. View vs Download just toggles the auto-print flag.
 */
export default function GenerateReportModal({
  open,
  onClose,
  palette,
  // When true, shows the people picker (admin main Reports). False = single person, drilldown.
  showPeoplePicker,
  // The fixed person(s) when showPeoplePicker is false.
  fixedEmployeeIds = [],
}) {
  const [periods, setPeriods] = useState(['week']);
  const [people, setPeople] = useState(fixedEmployeeIds);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!open) return;
    if (!showPeoplePicker) {
      setPeople(fixedEmployeeIds);
      return;
    }
    teamEmployeesAPI
      .list()
      .then(({ data }) => {
        if (data?.success) {
          const list = (data.employees || []).filter((e) => e.role === 'employee');
          setEmployees(list);
          if (people.length === 0) setPeople(list.map((e) => e._id));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, showPeoplePicker]);

  const toggle = (set, setSet, id) => {
    if (set.includes(id)) setSet(set.filter((v) => v !== id));
    else setSet([...set, id]);
  };

  const buildUrl = (mode) => {
    const params = new URLSearchParams();
    params.set('periods', periods.join(','));
    if (people.length > 0) params.set('persons', people.join(','));
    params.set('mode', mode);
    return `/team/print/report?${params.toString()}`;
  };

  const open_ = (mode) => {
    if (periods.length === 0) return;
    if (showPeoplePicker && people.length === 0) return;
    window.open(buildUrl(mode), '_blank', 'noopener,noreferrer');
    onClose && onClose();
  };

  const periodCount = periods.length;
  const peopleCount = people.length;

  return (
    <Modal open={open} onClose={onClose} title="Generate report" palette={palette} width={520}>
      <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginBottom: 18, lineHeight: 1.5 }}>
        Pick the period(s){showPeoplePicker ? ' and the people' : ''} you want included.
        Each selection shows up as its own section in the PDF{showPeoplePicker ? ', with one person per page' : ''}.
      </div>

      {/* Periods */}
      <div style={{ marginBottom: 18 }}>
        <Label palette={palette} icon={Calendar} text="Periods" count={periodCount} />
        <div
          style={{
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: palette.surface,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
          }}
        >
          {PERIOD_OPTIONS.map((p, i) => {
            const checked = periods.includes(p.id);
            const onLast = i >= PERIOD_OPTIONS.length - 2;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => toggle(periods, setPeriods, p.id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = palette.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: onLast ? 'none' : `1px solid ${palette.border}`,
                  borderLeft: i % 2 === 1 ? `1px solid ${palette.border}` : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <CheckBox palette={palette} checked={checked} />
                <span style={{ fontFamily: baseFont, fontSize: 13, color: palette.text }}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* People — admin main page only */}
      {showPeoplePicker && (
        <div style={{ marginBottom: 18 }}>
          <Label palette={palette} icon={Users2} text="People" count={peopleCount} />
          <div
            style={{
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: palette.surface,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {employees.length === 0 ? (
              <div style={{ padding: 16, fontFamily: baseFont, fontSize: 13, color: palette.textMute, textAlign: 'center' }}>
                No team members yet.
              </div>
            ) : (
              employees.map((emp, i) => {
                const checked = people.includes(emp._id);
                return (
                  <button
                    type="button"
                    key={emp._id}
                    onClick={() => toggle(people, setPeople, emp._id)}
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
                    <CheckBox palette={palette} checked={checked} />
                    <Avatar initials={emp.avatar} size={22} palette={palette} />
                    <span style={{ flex: 1, fontFamily: baseFont, fontSize: 13, color: palette.text }}>{emp.name}</span>
                    <span style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute }}>{emp.jobTitle}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
        <GhostButton onClick={onClose} palette={palette}>
          Cancel
        </GhostButton>
        <GhostButton onClick={() => open_('view')} palette={palette} icon={Eye}>
          View
        </GhostButton>
        <SolidButton onClick={() => open_('download')} palette={palette} icon={Download}>
          Download PDF
        </SolidButton>
      </div>
    </Modal>
  );
}

function Label({ palette, icon: Icon, text, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: baseFont, fontSize: 12.5, color: palette.textDim, fontWeight: 500 }}>
        <Icon size={13} style={{ color: palette.textMute }} />
        {text}
      </span>
      {count > 0 && (
        <span
          style={{
            padding: '1px 8px',
            borderRadius: 999,
            backgroundColor: palette.accent,
            color: palette.accentText,
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function CheckBox({ palette, checked }) {
  return (
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
  );
}
