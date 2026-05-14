import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Search, Filter, X as XIcon } from 'lucide-react';
import { teamTasksAPI, teamEmployeesAPI } from '../teamAPI';
import { baseFont, serifFont, monoFont, priorityMeta, taskStatusMeta, fmtMinutes, parseEstimateInput } from '../theme';
import { Avatar, PageHeader, Card, SolidButton, GhostButton, Modal, FieldLabel, TextInput, Select } from '../components/Primitives';

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

function ymd(d) {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Inline editable date cell. Empty value renders an "Add" button.
 * Always available to admin; available to the task owner for their own tasks.
 */
function DateCell({ palette, value, onChange, editable, placeholder = 'Set date' }) {
  if (!editable) {
    return <span style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.textDim }}>{value ? fmtDate(value) : '—'}</span>;
  }
  return (
    <input
      type="date"
      value={ymd(value)}
      onChange={(e) => onChange(e.target.value || null)}
      style={{
        padding: '5px 8px',
        borderRadius: 6,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        color: value ? palette.text : palette.textMute,
        fontFamily: monoFont,
        fontSize: 12,
        outline: 'none',
        width: 130,
        colorScheme: palette.bg === '#0F0E0C' ? 'dark' : 'light',
      }}
      title={value ? fmtDate(value) : placeholder}
    />
  );
}

/**
 * Inline editable "spent" minutes cell — accepts text like "3h 20m".
 * Saves on blur (or Enter), so accidental edits while typing don't fire requests.
 */
function SpentCell({ palette, value, onCommit, editable }) {
  const [draft, setDraft] = useState(value ? fmtMinutes(value) : '');
  useEffect(() => {
    setDraft(value ? fmtMinutes(value) : '');
  }, [value]);

  if (!editable) {
    return <span style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.text }}>{value ? fmtMinutes(value) : '—'}</span>;
  }

  const commit = () => {
    const minutes = parseEstimateInput(draft);
    if (minutes !== value) onCommit(minutes);
  };

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
      }}
      placeholder="0m"
      style={{
        padding: '5px 8px',
        borderRadius: 6,
        backgroundColor: palette.surface,
        border: `1px solid ${palette.border}`,
        color: palette.text,
        fontFamily: monoFont,
        fontSize: 12.5,
        outline: 'none',
        width: 80,
      }}
    />
  );
}

function StatusSelect({ palette, isDark, value, onChange, editable }) {
  const meta = taskStatusMeta(palette, isDark)[value];
  if (!editable) {
    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: 999,
          backgroundColor: meta.bg,
          color: meta.text,
          fontFamily: baseFont,
          fontSize: 11.5,
          fontWeight: 500,
        }}
      >
        {meta.label}
      </span>
    );
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '5px 10px',
        borderRadius: 6,
        backgroundColor: meta.bg,
        color: meta.text,
        border: `1px solid ${meta.text}33`,
        fontFamily: baseFont,
        fontSize: 12,
        fontWeight: 500,
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <option value="pending">Pending</option>
      <option value="in_progress">In progress</option>
      <option value="completed">Done</option>
    </select>
  );
}

export default function TasksView({ palette, isDark, isAdmin, currentUserId }) {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', ownerId: '', priority: 'medium', est: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchTasks = async () => {
    const { data } = await teamTasksAPI.list();
    if (data?.success) setTasks(data.tasks || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      teamEmployeesAPI.list().then(({ data }) => {
        if (data?.success) {
          setEmployees(data.employees || []);
          if (data.employees?.length && !form.ownerId) {
            setForm((f) => ({ ...f, ownerId: data.employees[0]._id }));
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Locally update a single task after a PATCH.
  const patchTask = async (taskId, payload) => {
    const optimistic = (prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...payload } : t));
    setTasks((prev) => optimistic(prev));
    const { data } = await teamTasksAPI.update(taskId, payload).catch((err) => ({ data: err.response?.data }));
    if (data?.success) {
      setTasks((prev) => prev.map((t) => (t._id === taskId ? data.task : t)));
    } else {
      // revert on error
      fetchTasks();
    }
  };

  const onDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    const { data } = await teamTasksAPI.remove(task._id);
    if (data?.success) setTasks((prev) => prev.filter((t) => t._id !== task._id));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Title required');
    if (!form.ownerId) return setError('Pick an owner');
    setSubmitting(true);
    const { data } = await teamTasksAPI.create({
      title: form.title.trim(),
      ownerId: form.ownerId,
      priority: form.priority,
      estMinutes: parseEstimateInput(form.est),
      description: form.description.trim(),
    });
    setSubmitting(false);
    if (data?.success) {
      setTasks((prev) => [data.task, ...prev]);
      setShowNew(false);
      setForm({ title: '', ownerId: employees[0]?._id || '', priority: 'medium', est: '', description: '' });
    } else {
      setError(data?.message || 'Could not create task');
    }
  };

  // Apply search + filters
  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (isAdmin && filterOwner !== 'all') {
        const ownerId = t.ownerId?._id || t.ownerId;
        if (ownerId?.toString?.() !== filterOwner) return false;
      }
      return true;
    });
  }, [tasks, search, filterOwner, filterStatus, isAdmin]);

  const filtersActive = search || filterOwner !== 'all' || filterStatus !== 'all';

  // Column widths — tweak in one place.
  // Task | Status | Owner | Priority | Assigned | Start | Finish | Est | Spent | (action)
  const cols = isAdmin
    ? '2.4fr 130px 1.2fr 90px 110px 150px 150px 80px 100px 36px'
    : '2.6fr 130px 1.4fr 90px 110px 150px 150px 80px 100px';

  return (
    <div>
      <PageHeader
        kicker={isAdmin ? `${tasks.length} TASKS · ALL TEAM` : 'YOUR ASSIGNMENTS'}
        title={isAdmin ? 'Tasks' : 'My tasks'}
        palette={palette}
        right={
          isAdmin ? (
            <SolidButton onClick={() => setShowNew(true)} icon={Plus} palette={palette}>
              New task
            </SolidButton>
          ) : null
        }
      />

      {/* Filters */}
      <Card palette={palette} padding={14} style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: 220 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: palette.textMute }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search task name…"
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                backgroundColor: palette.surfaceAlt,
                border: `1px solid ${palette.border}`,
                color: palette.text,
                fontFamily: baseFont,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={13} style={{ color: palette.textMute }} />
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  backgroundColor: palette.surfaceAlt,
                  border: `1px solid ${palette.border}`,
                  color: palette.text,
                  fontFamily: baseFont,
                  fontSize: 13,
                  outline: 'none',
                  minWidth: 160,
                }}
              >
                <option value="all">All members</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              backgroundColor: palette.surfaceAlt,
              border: `1px solid ${palette.border}`,
              color: palette.text,
              fontFamily: baseFont,
              fontSize: 13,
              outline: 'none',
              minWidth: 140,
            }}
          >
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Done</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterOwner('all');
                setFilterStatus('all');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'none',
                color: palette.textDim,
                border: `1px solid ${palette.border}`,
                fontFamily: baseFont,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              <XIcon size={12} /> Clear
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontFamily: monoFont, fontSize: 11, color: palette.textMute, letterSpacing: '0.06em' }}>
            {visibleTasks.length} OF {tasks.length}
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card palette={palette} padding={0}>
        {/* Header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: cols,
            gap: 10,
            padding: '12px 18px',
            borderBottom: `1px solid ${palette.border}`,
            backgroundColor: palette.surfaceAlt,
          }}
        >
          {['TASK', 'STATUS', 'ASSIGNED TO', 'PRIORITY', 'ASSIGNED', 'START', 'FINISH', 'EST', 'SPENT', isAdmin ? '' : null]
            .filter((h) => h !== null)
            .map((h, i) => (
              <div
                key={i}
                style={{
                  fontFamily: monoFont,
                  fontSize: 10.5,
                  color: palette.textMute,
                  letterSpacing: '0.08em',
                  fontWeight: 500,
                }}
              >
                {h}
              </div>
            ))}
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>Loading…</div>
        ) : visibleTasks.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
            {tasks.length === 0
              ? isAdmin
                ? 'No tasks yet. Click "New task" to create one.'
                : 'No tasks assigned to you yet.'
              : 'No tasks match your filters.'}
          </div>
        ) : (
          visibleTasks.map((t, i) => {
            const ownerId = t.ownerId?._id || t.ownerId;
            const isOwner = ownerId?.toString?.() === currentUserId;
            const canEditDates = isAdmin || isOwner;
            const canEditSpent = isAdmin || isOwner;
            const canEditStatus = isAdmin || isOwner;
            return (
              <div
                key={t._id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: cols,
                  gap: 10,
                  padding: '12px 18px',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                }}
              >
                {/* Task title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityMeta[t.priority].color, flexShrink: 0 }} />
                  <span
                    style={{
                      fontFamily: baseFont,
                      fontSize: 13.5,
                      color: palette.text,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={t.title}
                  >
                    {t.title}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <StatusSelect
                    palette={palette}
                    isDark={isDark}
                    value={t.status}
                    onChange={(s) => patchTask(t._id, { status: s })}
                    editable={canEditStatus}
                  />
                </div>

                {/* Assigned to */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar initials={t.owner?.avatar || '?'} size={24} palette={palette} />
                  <span
                    style={{
                      fontFamily: baseFont,
                      fontSize: 13,
                      color: palette.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={t.owner?.name || 'Unknown'}
                  >
                    {t.owner?.name || 'Unknown'}
                  </span>
                </div>

                {/* Priority */}
                <div style={{ fontFamily: baseFont, fontSize: 12, color: palette.textDim }}>
                  {priorityMeta[t.priority].label}
                </div>

                {/* Assigned (createdAt) */}
                <div style={{ fontFamily: monoFont, fontSize: 12, color: palette.textDim }}>{fmtDate(t.createdAt)}</div>

                {/* Start date */}
                <div>
                  <DateCell
                    palette={palette}
                    value={t.startDate}
                    onChange={(v) => patchTask(t._id, { startDate: v })}
                    editable={canEditDates}
                  />
                </div>

                {/* Finish date */}
                <div>
                  <DateCell
                    palette={palette}
                    value={t.finishDate}
                    onChange={(v) => patchTask(t._id, { finishDate: v })}
                    editable={canEditDates}
                  />
                </div>

                {/* Estimated (read-only after assignment) */}
                <div style={{ fontFamily: monoFont, fontSize: 12.5, color: palette.text }}>
                  {t.estMinutes ? fmtMinutes(t.estMinutes) : '—'}
                </div>

                {/* Spent */}
                <div>
                  <SpentCell
                    palette={palette}
                    value={t.spentMinutes || 0}
                    onCommit={(v) => patchTask(t._id, { spentMinutes: v })}
                    editable={canEditSpent}
                  />
                </div>

                {/* Admin: delete */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onDelete(t)}
                    title="Delete task"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </Card>

      {/* New Task Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New task" palette={palette} width={520}>
        <form onSubmit={onCreate}>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Task title</FieldLabel>
            <TextInput
              palette={palette}
              autoFocus
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Wireframe v2 — Oslet about page"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <FieldLabel palette={palette}>Assign to</FieldLabel>
              <Select palette={palette} value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">Pick someone…</option>
                {employees.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel palette={palette}>Estimate</FieldLabel>
              <TextInput
                palette={palette}
                value={form.est}
                onChange={(e) => setForm({ ...form, est: e.target.value })}
                placeholder="e.g. 3h, 45m, 1h 30m"
              />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Priority</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 8,
                    backgroundColor: form.priority === p ? palette.accentBg : palette.surfaceAlt,
                    color: form.priority === p ? palette.accent : palette.text,
                    border: `1px solid ${form.priority === p ? palette.accent : palette.border}`,
                    fontFamily: baseFont,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityMeta[p].color }} />
                  {priorityMeta[p].label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: palette.dangerBg,
                color: palette.danger,
                fontFamily: baseFont,
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <GhostButton onClick={() => setShowNew(false)} palette={palette}>
              Cancel
            </GhostButton>
            <SolidButton type="submit" palette={palette} disabled={submitting} icon={Plus}>
              {submitting ? 'Creating…' : 'Create task'}
            </SolidButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
