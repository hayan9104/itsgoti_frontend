import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { teamReportsAPI, teamEmployeesAPI } from '../teamAPI';
import { useTeamAuth } from '../TeamAuthContext';
import { getPalette, baseFont, serifFont, monoFont, ensureFontsLoaded } from '../theme';
import { Avatar } from '../components/Primitives';
import HoursByDayChart from '../components/HoursByDayChart';

const PERIOD_LABELS = {
  today: 'Today',
  week: 'This week',
  lastweek: 'Last week',
  month: 'This month',
  lastmonth: 'Last month',
  quarter: 'This quarter',
  year: 'This year',
  all: 'All time',
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}
function num(n, suffix = '') {
  if (n == null) return '—';
  return Number.isInteger(n) ? `${n}${suffix}` : `${n.toFixed(2)}${suffix}`;
}

export default function TeamReportPrint() {
  const [params] = useSearchParams();
  const { user, loading: authLoading } = useTeamAuth();
  const [palette] = useState(() => getPalette(false)); // print = light theme always
  const [reports, setReports] = useState([]); // [{ employeeId, period, data }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const periodIds = (params.get('periods') || 'week').split(',').filter(Boolean);
  const personIds = (params.get('persons') || '').split(',').filter(Boolean);
  const mode = params.get('mode') || 'view';

  useEffect(() => {
    ensureFontsLoaded();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setError('Please sign in to /team first.');
      setLoading(false);
      return;
    }

    const ids = personIds.length > 0 ? personIds : [user.id];

    (async () => {
      try {
        // Resolve employees so we have name/jobTitle when only IDs were passed.
        let employeeMap = new Map();
        if (user.role === 'admin') {
          const { data } = await teamEmployeesAPI.list();
          if (data?.success) {
            for (const e of data.employees || []) employeeMap.set(e._id, e);
          }
        }

        // Fetch every (person × period) combination in parallel.
        const tasks = [];
        for (const empId of ids) {
          for (const period of periodIds) {
            tasks.push(
              teamReportsAPI
                .employee(empId, period)
                .then(({ data }) => ({ employeeId: empId, period, data: data?.data || data }))
                .catch((err) => ({ employeeId: empId, period, error: err?.response?.data?.message || 'Failed' }))
            );
          }
        }
        const results = await Promise.all(tasks);
        // Group by person → list of (period, report) pairs
        const byPerson = new Map();
        for (const r of results) {
          if (!byPerson.has(r.employeeId)) byPerson.set(r.employeeId, []);
          byPerson.get(r.employeeId).push(r);
        }
        setReports([...byPerson.entries()].map(([empId, list]) => ({ empId, list, employee: employeeMap.get(empId) || null })));
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load report');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Auto-trigger print when in download mode, after data + fonts are ready.
  useEffect(() => {
    if (mode !== 'download' || loading || error) return;
    const id = setTimeout(() => {
      try { window.print(); } catch {}
    }, 800);
    return () => clearTimeout(id);
  }, [mode, loading, error]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: baseFont, color: palette.textMute, backgroundColor: palette.bg }}>
        Building report…
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: baseFont, color: palette.danger, backgroundColor: palette.bg }}>
        {error}
      </div>
    );
  }

  const generatedAt = new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', color: palette.text, fontFamily: baseFont }}>
      {/* Print rules — A4-friendly, page break per person */}
      <style>{`
        @page { size: A4; margin: 18mm 14mm; }
        @media print {
          .print-toolbar { display: none !important; }
          .print-page-break { page-break-before: always; break-before: page; }
        }
        body { background: #fff !important; }
      `}</style>

      {/* Toolbar — visible on screen, hidden when printing */}
      <div
        className="print-toolbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '12px 24px',
          backgroundColor: palette.surfaceAlt,
          borderBottom: `1px solid ${palette.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: serifFont, fontSize: 18, fontWeight: 500 }}>
          <img
            src="/Goti%20Logo%20Black.png"
            alt="Goti"
            style={{ height: 22, width: 'auto', display: 'block' }}
          />
          <span>Team report</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: palette.accent,
              color: palette.accentText,
              border: 'none',
              cursor: 'pointer',
              fontFamily: baseFont,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 28px 60px' }}>
        {/* Cover */}
        <div style={{ borderBottom: `1px solid ${palette.border}`, paddingBottom: 24, marginBottom: 32 }}>
          <div style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.08em' }}>
            GENERATED {generatedAt.toUpperCase()}
          </div>
          <h1 style={{ fontFamily: serifFont, fontSize: 36, fontWeight: 400, color: palette.text, letterSpacing: '-0.02em', margin: 0, marginTop: 8 }}>
            Team activity report
          </h1>
          <div style={{ marginTop: 12, fontFamily: baseFont, fontSize: 13, color: palette.textDim }}>
            <strong>Periods:</strong> {periodIds.map((p) => PERIOD_LABELS[p] || p).join(' · ')}
            <br />
            <strong>People:</strong> {reports.length} {reports.length === 1 ? 'person' : 'people'}
          </div>
        </div>

        {reports.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont }}>
            No data available for the selected combination.
          </div>
        ) : (
          reports.map(({ empId, list, employee }, idx) => (
            <div key={empId} className={idx > 0 ? 'print-page-break' : ''} style={{ marginBottom: 40 }}>
              <PersonHeader palette={palette} employee={employee || list[0]?.data?.employee} />
              {list.map(({ period, data, error: rErr }) => (
                <PeriodSection key={period} palette={palette} period={period} data={data} error={rErr} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PersonHeader({ palette, employee }) {
  if (!employee) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${palette.border}` }}>
      <Avatar initials={employee.avatar} size={44} palette={palette} />
      <div>
        <div style={{ fontFamily: serifFont, fontSize: 24, fontWeight: 500, letterSpacing: '-0.01em' }}>{employee.name}</div>
        <div style={{ fontFamily: baseFont, fontSize: 13, color: palette.textDim, marginTop: 2 }}>
          {employee.jobTitle}
          {employee.email ? ` · ${employee.email}` : ''}
        </div>
      </div>
    </div>
  );
}

function PeriodSection({ palette, period, data, error }) {
  if (error) {
    return (
      <div style={{ padding: 16, marginBottom: 24, color: palette.danger, fontFamily: baseFont, fontSize: 13 }}>
        {PERIOD_LABELS[period] || period}: {error}
      </div>
    );
  }
  if (!data) return null;
  const { summary = {}, days = [], series = [], tasks = [], dsmTime, range } = data;
  const rangeLabel = range
    ? `${fmtDate(range.start)} – ${fmtDate(range.end)}`
    : '';

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontFamily: serifFont, fontSize: 20, fontWeight: 500, margin: 0 }}>
          {PERIOD_LABELS[period] || period}
        </h2>
        <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.06em' }}>
          {rangeLabel}
        </span>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1,
          backgroundColor: palette.border,
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 18,
        }}
      >
        <KpiTile palette={palette} label="Total hours" value={`${summary.totalActiveHours || 0}h`} />
        <KpiTile palette={palette} label="Tasks done" value={summary.completedCount || 0} />
        <KpiTile palette={palette} label="Total break" value={`${summary.totalBreakHours ?? 0}h`} />
        <KpiTile palette={palette} label="Avg / day" value={`${summary.avgHoursPerDay || 0}h`} />
      </div>

      {/* Chart */}
      {series.length > 0 && (
        <HoursByDayChart palette={palette} series={series} accent={palette.accent} title="Hours by day" />
      )}

      {/* Daily breakdown */}
      <h3 style={{ fontFamily: serifFont, fontSize: 16, fontWeight: 500, margin: '20px 0 10px' }}>Daily breakdown</h3>
      {days.length === 0 ? (
        <div style={{ padding: 12, fontFamily: baseFont, fontSize: 12.5, color: palette.textMute, border: `1px solid ${palette.border}`, borderRadius: 8 }}>
          No sessions in this period.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: baseFont, fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: palette.surfaceAlt }}>
              {['Date', 'Start', 'AFK', 'End', 'Hours', `DSM (${dsmTime || '09:00'})`].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10.5,
                    color: palette.textMute,
                    letterSpacing: '0.06em',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderBottom: `1px solid ${palette.border}`,
                  }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d, i) => (
              <tr key={d.date + i}>
                <td style={cellStyle(palette)}>
                  <div style={{ fontWeight: 500 }}>{fmtDate(d.date + 'T00:00:00')}</div>
                  <div style={{ fontSize: 10.5, color: palette.textMute }}>
                    {new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}
                  </div>
                </td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont }}>{fmtTime(d.startedAt)}</td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont }}>{Math.round((d.afkSec || 0) / 60)}m</td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont }}>{d.endedAt ? fmtTime(d.endedAt) : '—'}</td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont, fontWeight: 500 }}>{((d.activeSec || 0) / 3600).toFixed(1)}h</td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont, fontSize: 10.5 }}>
                  {!d.dsm ? '—' : d.dsm.status === 'on_time' ? 'ON TIME' : d.dsm.status === 'late' ? `LATE (${d.dsm.offsetMin}m)` : `EARLY (${d.dsm.offsetMin}m)`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Tasks */}
      <h3 style={{ fontFamily: serifFont, fontSize: 16, fontWeight: 500, margin: '20px 0 10px' }}>Tasks ({tasks.length})</h3>
      {tasks.length === 0 ? (
        <div style={{ padding: 12, fontFamily: baseFont, fontSize: 12.5, color: palette.textMute, border: `1px solid ${palette.border}`, borderRadius: 8 }}>
          No tasks for this period.
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: baseFont, fontSize: 12 }}>
          <thead>
            <tr style={{ backgroundColor: palette.surfaceAlt }}>
              {['Title', 'Status', 'Est', 'Spent', 'Date'].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: monoFont,
                    fontSize: 10.5,
                    color: palette.textMute,
                    letterSpacing: '0.06em',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderBottom: `1px solid ${palette.border}`,
                  }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t._id}>
                <td style={cellStyle(palette)}>{t.title}</td>
                <td style={cellStyle(palette)}>{(t.status || '').replace('_', ' ')}</td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont }}>{num((t.estMinutes || 0) / 60, 'h')}</td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont }}>{num((t.spentMinutes || 0) / 60, 'h')}</td>
                <td style={{ ...cellStyle(palette), fontFamily: monoFont, fontSize: 10.5 }}>
                  {t.completedAt ? `Done ${fmtDate(t.completedAt)}` : `Added ${fmtDate(t.createdAt)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function cellStyle(palette) {
  return {
    padding: '8px 10px',
    borderBottom: `1px solid ${palette.border}`,
    color: palette.text,
    verticalAlign: 'top',
  };
}

function KpiTile({ palette, label, value }) {
  return (
    <div style={{ padding: 14, backgroundColor: palette.surface }}>
      <div style={{ fontFamily: baseFont, fontSize: 11, color: palette.textDim, fontWeight: 500, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: serifFont, fontSize: 22, fontWeight: 400, color: palette.text }}>{value}</div>
    </div>
  );
}
