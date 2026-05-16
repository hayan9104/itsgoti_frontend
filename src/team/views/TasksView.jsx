import { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Trash2, GripVertical, Timer, Paperclip, X as XIcon, FileText, Image as ImageIcon, Archive, RotateCcw, AlertTriangle } from 'lucide-react';
import { teamTasksAPI, teamEmployeesAPI } from '../teamAPI';
import { getCached, setCached, invalidate } from '../teamCache';
import { useTeamAuth } from '../TeamAuthContext';
import { baseFont, serifFont, monoFont, fmtClock, priorityMeta, taskStatusMeta, fmtMinutes, parseEstimateInput } from '../theme';
import { Avatar, PageHeader, Card, SolidButton, GhostButton, Modal, FieldLabel, TextInput, Select, Textarea } from '../components/Primitives';
import TaskTooltip from '../components/TaskTooltip';
import MiniTooltip from '../components/MiniTooltip';
import DurationInput from '../components/DurationInput';
import StatusFilterDropdown from '../components/StatusFilterDropdown';
import MemberFilterDropdown from '../components/MemberFilterDropdown';
import DateFilterDropdown from '../components/DateFilterDropdown';

const STATUS_ORDER = ['pending', 'in_progress', 'review', 'blocked', 'completed'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

export default function TasksView({ palette, isDark, isAdmin, currentUserId, highlightTaskId, clearHighlight, openTask }) {
  const { user } = useTeamAuth();
  // Seed from cache so the list renders instantly on tab switch; a fresh fetch runs in parallel.
  const [tasks, setTasks] = useState(() => getCached('tasks:list')?.tasks || []);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'archive'
  const [employees, setEmployees] = useState(() => getCached('employees:list')?.employees || []);
  const [loading, setLoading] = useState(!getCached('tasks:list'));
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', ownerId: '', priority: 'medium', estMinutes: 0, description: '', plannedStartDate: '' });
  const [confirmPermanent, setConfirmPermanent] = useState(null); // task being permanently deleted

  // Filters
  const [statusFilter, setStatusFilter] = useState([]); // empty = all
  const [memberFilter, setMemberFilter] = useState([]); // empty = all
  const [dateFilter, setDateFilter] = useState({}); // { [field]: { from, to } }
  const [nameSearch, setNameSearch] = useState('');

  const DATE_OPTIONS = [
    { id: 'createdAt', label: 'Assigned date' },
    { id: 'plannedStartDate', label: 'Estimated start' },
    { id: 'startDate', label: 'Real start date' },
    { id: 'completedAt', label: 'Completion date' },
  ];

  const matchesFilters = (t) => {
    if (statusFilter.length > 0 && statusFilter.length < 5 && !statusFilter.includes(t.status)) return false;
    if (isAdmin && memberFilter.length > 0) {
      const ownerId = (t.ownerId?._id || t.ownerId)?.toString?.();
      if (!ownerId || !memberFilter.includes(ownerId)) return false;
    }
    for (const key of Object.keys(dateFilter)) {
      const range = dateFilter[key];
      const val = t[key] ? new Date(t[key]).getTime() : null;
      if (range.from) {
        const fromMs = new Date(range.from).setHours(0, 0, 0, 0);
        if (!val || val < fromMs) return false;
      }
      if (range.to) {
        const toMs = new Date(range.to).setHours(23, 59, 59, 999);
        if (!val || val > toMs) return false;
      }
    }
    if (nameSearch.trim()) {
      const q = nameSearch.trim().toLowerCase();
      if (!(t.title || '').toLowerCase().includes(q)) return false;
    }
    return true;
  };

  const filtersActive =
    statusFilter.length > 0 ||
    (isAdmin && memberFilter.length > 0) ||
    Object.keys(dateFilter).length > 0 ||
    nameSearch.trim().length > 0;

  const clearAllFilters = () => {
    setStatusFilter([]);
    setMemberFilter([]);
    setDateFilter({});
    setNameSearch('');
  };

  const statusCounts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const memberCounts = tasks.reduce((acc, t) => {
    const id = (t.ownerId?._id || t.ownerId)?.toString?.();
    if (id) acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});
  const [attachments, setAttachments] = useState([]); // [{filename, originalName, mimetype, size, url}]
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [tick, setTick] = useState(0);
  const [hover, setHover] = useState(null); // { task, anchor, mouse }
  const hoverTimer = useRef(null);
  const pendingMouseRef = useRef({ x: 0, y: 0 });
  const [miniHover, setMiniHover] = useState(null); // { task, anchor } — avatar mini tooltip
  const miniTimer = useRef(null);

  // showHover captures the latest cursor position so the tooltip anchors to it
  // (rather than the row's bounding box, which overflows when the row is wide).
  const showHover = (task, anchor, mouse) => {
    if (mouse) pendingMouseRef.current = mouse;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHover({ task, anchor, mouse: { ...pendingMouseRef.current } });
    }, 350);
  };
  const trackHover = (e) => {
    pendingMouseRef.current = { x: e.clientX, y: e.clientY };
    if (hover) {
      // While the tooltip is already open, follow the cursor so the user always sees it nearby.
      setHover((h) => (h ? { ...h, mouse: { x: e.clientX, y: e.clientY } } : h));
    }
  };
  const hideHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
    setHover(null);
  };

  const showMini = (task, anchor) => {
    if (miniTimer.current) clearTimeout(miniTimer.current);
    miniTimer.current = setTimeout(() => setMiniHover({ task, anchor }), 200);
  };
  const hideMini = () => {
    if (miniTimer.current) clearTimeout(miniTimer.current);
    miniTimer.current = null;
    setMiniHover(null);
  };

  // Tick once per second so live task timers update.
  const hasRunning = useMemo(() => tasks.some((t) => t.inProgressSince), [tasks]);
  useEffect(() => {
    if (!hasRunning) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [hasRunning]);

  // Poll every 30s so external pauses (break / AFK on the Dashboard) reflect here.
  useEffect(() => {
    const id = setInterval(() => {
      teamTasksAPI.list().then(({ data }) => {
        if (data?.success) setTasks(data.tasks || []);
      });
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Scroll to + flash a task when arriving from a notification.
  useEffect(() => {
    if (!highlightTaskId || tasks.length === 0) return;
    const el = document.getElementById(`team-task-${highlightTaskId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const original = el.style.transition;
      el.style.transition = 'background-color 800ms ease';
      el.style.backgroundColor = palette.accentBg;
      setTimeout(() => {
        el.style.backgroundColor = 'transparent';
        setTimeout(() => {
          el.style.transition = original;
          clearHighlight && clearHighlight();
        }, 900);
      }, 2200);
    } else {
      // Task not visible yet (still loading) — wait for next render
    }
  }, [highlightTaskId, tasks.length, palette.accentBg, clearHighlight]);

  const fetchTasks = async () => {
    const { data } = await teamTasksAPI.list();
    if (data?.success) {
      setTasks(data.tasks || []);
      setCached('tasks:list', data);
    }
    setLoading(false);
  };

  const fetchArchived = async () => {
    setArchiveLoading(true);
    try {
      const { data } = await teamTasksAPI.list({ archived: 'true' });
      if (data?.success) {
        setArchivedTasks(data.tasks || []);
        setCached('tasks:archived', data);
      }
    } finally {
      setArchiveLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'archive' && archivedTasks.length === 0 && !archiveLoading) {
      fetchArchived();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      teamEmployeesAPI.list().then(({ data }) => {
        if (data?.success) {
          setEmployees(data.employees || []);
          setCached('employees:list', data);
          if (data.employees?.length && !form.ownerId) {
            setForm((f) => ({ ...f, ownerId: data.employees[0]._id }));
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Bucket tasks by status — apply combined AND filters before grouping.
  const grouped = STATUS_ORDER.reduce((a, k) => ({ ...a, [k]: [] }), {});
  for (const t of tasks) {
    if (!matchesFilters(t)) continue;
    if (grouped[t.status]) grouped[t.status].push(t);
  }

  const onChangeStatus = async (task, status) => {
    if (task.status === status) return;
    // Optimistic update — server confirms.
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t)));
    const { data } = await teamTasksAPI.update(task._id, { status }).catch((err) => ({ data: err.response?.data }));
    if (data?.success) {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? data.task : t)));
      invalidate('tasks:list');
    } else {
      // Revert
      fetchTasks();
    }
  };

  // Drag handlers
  const handleDragStart = (e, task) => {
    hideHover();
    setDraggingId(task._id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', task._id); } catch {}
  };
  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStatus(null);
  };
  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) setDragOverStatus(status);
  };
  const handleDragLeave = (e, status) => {
    // Only clear if leaving the column container itself (not a child)
    if (e.currentTarget === e.target && dragOverStatus === status) setDragOverStatus(null);
  };
  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = draggingId || e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setDragOverStatus(null);
    if (!taskId) return;
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;
    if (task.status === status) return;
    onChangeStatus(task, status);
  };

  // Archive — admin OR task owner. Confirms once, then moves to the Archive tab.
  const onArchive = async (task) => {
    if (!window.confirm(`Move "${task.title}" to Archive?`)) return;
    const { data } = await teamTasksAPI.archive(task._id).catch((err) => ({ data: err.response?.data }));
    if (data?.success) {
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      // Drop the cached archive list so it refetches the next time the user opens that tab.
      setArchivedTasks([]);
      invalidate('tasks:*');
    }
  };

  const onRestore = async (task) => {
    const { data } = await teamTasksAPI.restore(task._id).catch((err) => ({ data: err.response?.data }));
    if (data?.success && data.task) {
      setArchivedTasks((prev) => prev.filter((t) => t._id !== task._id));
      // Invalidate the active tasks cache so it refetches with the restored row.
      setTasks((prev) => [data.task, ...prev]);
      invalidate('tasks:*');
    }
  };

  const onDeletePermanent = async () => {
    if (!confirmPermanent) return;
    const id = confirmPermanent._id;
    const { data } = await teamTasksAPI.removePermanent(id).catch((err) => ({ data: err.response?.data }));
    if (data?.success) {
      setArchivedTasks((prev) => prev.filter((t) => t._id !== id));
    }
    setConfirmPermanent(null);
  };

  const onPickFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const { data } = await teamTasksAPI.uploadFiles(Array.from(fileList));
      if (data?.success) {
        setAttachments((prev) => [...prev, ...(data.files || [])]);
      } else {
        setError(data?.message || 'Upload failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Title required');
    if (isAdmin && !form.ownerId) return setError('Pick an owner');
    if (!form.plannedStartDate) return setError('Pick an estimated start date');
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      priority: form.priority,
      estMinutes: form.estMinutes || 0,
      description: form.description.trim(),
      plannedStartDate: form.plannedStartDate || undefined,
      attachments,
    };
    if (isAdmin) payload.ownerId = form.ownerId;
    const { data } = await teamTasksAPI.create(payload).catch((err) => ({ data: err.response?.data }));
    setSubmitting(false);
    if (data?.success) {
      setTasks((prev) => [data.task, ...prev]);
      invalidate('tasks:list');
      setShowNew(false);
      setForm({ title: '', ownerId: employees[0]?._id || '', priority: 'medium', estMinutes: 0, description: '', plannedStartDate: '' });
      setAttachments([]);
    } else {
      setError(data?.message || 'Could not create task');
    }
  };

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Tasks' : 'My tasks'}
        kicker={isAdmin ? `${tasks.length} ACTIVE · ALL TEAM` : 'YOUR ASSIGNMENTS'}
        palette={palette}
        right={
          activeTab === 'tasks' ? (
            <SolidButton onClick={() => setShowNew(true)} icon={Plus} palette={palette}>
              New task
            </SolidButton>
          ) : null
        }
      />

      {/* Archive back bar — only when viewing the archive */}
      {activeTab === 'archive' && (
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: palette.textDim,
            fontFamily: baseFont,
            fontSize: 12.5,
            marginBottom: 20,
          }}
        >
          ‹ Back to tasks
        </button>
      )}

      {/* Filter bar — only when looking at the active Tasks tab */}
      {activeTab === 'tasks' && !loading && (
        <div
          className="team-mobile-tabbar"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
            marginBottom: 22,
          }}
        >
          <StatusFilterDropdown
            palette={palette}
            isDark={isDark}
            value={statusFilter}
            onChange={setStatusFilter}
            counts={statusCounts}
          />
          {isAdmin && (
            <MemberFilterDropdown
              palette={palette}
              members={employees}
              value={memberFilter}
              onChange={setMemberFilter}
              counts={memberCounts}
            />
          )}
          <DateFilterDropdown
            palette={palette}
            options={DATE_OPTIONS}
            value={dateFilter}
            onChange={setDateFilter}
          />
          {/* Title search — filters the task lists by name. */}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <XIcon
              size={0}
              style={{ display: 'none' }}
            />
            <input
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search task by name…"
              style={{
                padding: '7px 32px 7px 12px',
                borderRadius: 8,
                outline: 'none',
                backgroundColor: palette.surfaceAlt,
                color: palette.text,
                fontFamily: baseFont,
                fontSize: 12.5,
                border: `1px solid ${palette.border}`,
                width: 220,
              }}
            />
            {nameSearch && (
              <button
                type="button"
                onClick={() => setNameSearch('')}
                style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 2,
                }}
                title="Clear"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 8px',
                fontFamily: baseFont,
                fontSize: 12.5,
                color: palette.textDim,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {activeTab === 'archive' ? (
        archiveLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>Loading…</div>
        ) : (
          <Card palette={palette} padding={0}>
            {archivedTasks.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
                The archive is empty.
              </div>
            ) : (
              archivedTasks.map((t, i) => {
                const statusM = taskStatusMeta(palette, isDark)[t.previousStatus || t.status] || {};
                const priM = priorityMeta[t.priority] || {};
                return (
                  <div
                    key={t._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priM.color || palette.textMute, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>{t.title}</div>
                      <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 2 }}>
                        {t.owner?.name || 'Unassigned'} · Archived{' '}
                        {t.archivedAt && (
                          <span style={{ fontFamily: monoFont }}>
                            {new Date(t.archivedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {' · spent '}
                        <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.spentMinutes)}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        backgroundColor: statusM.bg,
                        color: statusM.text,
                        fontFamily: baseFont,
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    >
                      {statusM.label || t.previousStatus || t.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRestore(t)}
                      title="Restore"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: palette.surfaceAlt,
                        color: palette.text,
                        border: `1px solid ${palette.border}`,
                        fontFamily: baseFont,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={12} /> Restore
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setConfirmPermanent(t)}
                        title="Delete permanently"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.danger, padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        )
      ) : loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: palette.textMute, fontFamily: baseFont, fontSize: 13 }}>Loading…</div>
      ) : (
        STATUS_ORDER.map((status) => {
          const items = grouped[status];
          const meta = taskStatusMeta(palette, isDark)[status];
          const isOver = dragOverStatus === status;
          return (
            <div key={status} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: meta.text, opacity: 0.7 }} />
                <h3 style={{ fontFamily: serifFont, fontSize: 18, fontWeight: 500, color: palette.text, margin: 0 }}>{meta.label}</h3>
                <span style={{ fontFamily: monoFont, fontSize: 11, color: palette.textMute }}>{items.length}</span>
              </div>
              <div
                onDragOver={(e) => handleDragOver(e, status)}
                onDragLeave={(e) => handleDragLeave(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                style={{
                  borderRadius: 12,
                  border: `1px ${isOver ? 'dashed' : 'solid'} ${isOver ? palette.accent : palette.border}`,
                  backgroundColor: isOver ? palette.accentBg : palette.surface,
                  transition: 'background-color 120ms, border-color 120ms',
                  minHeight: items.length === 0 ? 64 : undefined,
                }}
              >
                {items.length === 0 ? (
                  <div style={{ padding: 18, textAlign: 'center', color: isOver ? palette.accent : palette.textMute, fontFamily: baseFont, fontSize: 13 }}>
                    {isOver ? 'Drop here to move' : 'None'}
                  </div>
                ) : (
                  items.map((t, i) => {
                    const ownerId = t.ownerId?._id || t.ownerId;
                    const canChangeStatus = isAdmin || ownerId?.toString?.() === currentUserId;
                    const canDrag = canChangeStatus;
                    const isDragging = draggingId === t._id;
                    // Live timer if task is actively ticking.
                    const isRunning = !!t.inProgressSince;
                    let liveExtraSec = 0;
                    if (isRunning) {
                      liveExtraSec = Math.max(0, Math.floor((Date.now() - new Date(t.inProgressSince).getTime()) / 1000));
                    }
                    const liveSpentSec = (t.spentMinutes || 0) * 60 + liveExtraSec;
                    return (
                      <div
                        key={t._id}
                        id={`team-task-${t._id}`}
                        data-task-row
                        className="team-stack-row"
                        draggable={canDrag}
                        onDragStart={(e) => canDrag && handleDragStart(e, t)}
                        onDragEnd={handleDragEnd}
                        onMouseLeave={() => {
                          hideHover();
                          hideMini();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          padding: '14px 18px',
                          borderTop: i === 0 ? 'none' : `1px solid ${palette.border}`,
                          opacity: isDragging ? 0.4 : 1,
                          cursor: canDrag ? 'grab' : 'default',
                          backgroundColor: isDragging ? palette.surfaceAlt : 'transparent',
                          transition: 'opacity 120ms, background-color 120ms',
                        }}
                      >
                        {canDrag && (
                          <GripVertical size={14} style={{ color: palette.textMute, flexShrink: 0, opacity: 0.65 }} />
                        )}
                        <span style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityMeta[t.priority].color, flexShrink: 0 }} />
                        <div
                          style={{ flex: 1, minWidth: 0, cursor: canDrag ? 'grab' : (openTask ? 'pointer' : 'default') }}
                          onMouseEnter={(e) => {
                            const row = e.currentTarget.closest('[data-task-row]');
                            showHover(t, row || e.currentTarget, { x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={trackHover}
                          onMouseLeave={hideHover}
                          onClick={() => openTask && openTask(t._id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: baseFont, fontSize: 14, color: palette.text, fontWeight: 500 }}>{t.title}</span>
                            {isRunning && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  backgroundColor: status === 'in_progress' ? (isDark ? '#10301F' : '#ECFDF5') : palette.surfaceAlt,
                                  color: isDark ? '#7BC09A' : '#065F46',
                                  fontFamily: monoFont,
                                  fontSize: 11,
                                  fontWeight: 500,
                                }}
                                title="Live — counting time spent on this task"
                              >
                                <Timer size={10} strokeWidth={2.5} />
                                {fmtClock(liveSpentSec)}
                              </span>
                            )}
                          </div>
                          <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 2 }}>
                            {t.owner?.name || 'Unassigned'} · {priorityMeta[t.priority].label} · est{' '}
                            <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.estMinutes)}</span> · spent{' '}
                            <span style={{ fontFamily: monoFont }}>{fmtMinutes(t.spentMinutes)}</span>
                          </div>
                        </div>
                        {/*
                          Wrapper uses display: contents on desktop so the children flow
                          as siblings of the title cluster (preserves the original row).
                          On mobile, team-mobile.css flips it to a flex row that drops
                          underneath via the .team-stack-row parent.
                        */}
                        <div className="team-row-actions" style={{ display: 'contents' }}>
                          {canChangeStatus && (
                            <select
                              value={t.status}
                              onChange={(e) => onChangeStatus(t, e.target.value)}
                              onMouseEnter={hideHover}
                              style={{
                                padding: '6px 10px',
                                borderRadius: 8,
                                backgroundColor: palette.surfaceAlt,
                                border: `1px solid ${palette.border}`,
                                color: palette.text,
                                fontFamily: baseFont,
                                fontSize: 12.5,
                                outline: 'none',
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In progress</option>
                              <option value="review">In review</option>
                              <option value="blocked">Blocked</option>
                              <option value="completed">Done</option>
                            </select>
                          )}
                          <span
                            onMouseEnter={(e) => {
                              hideHover();
                              showMini(t, e.currentTarget);
                            }}
                            onMouseLeave={hideMini}
                            style={{ display: 'inline-flex' }}
                          >
                            <Avatar initials={t.owner?.avatar || '?'} size={28} palette={palette} />
                          </span>
                          {(isAdmin || ownerId?.toString?.() === currentUserId) && (
                            <button
                              type="button"
                              onClick={() => onArchive(t)}
                              onMouseEnter={hideHover}
                              title="Move to Archive"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 4 }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Bottom-right link to the archive — only visible on the Tasks view */}
      {activeTab === 'tasks' && !loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: palette.textMute,
              fontFamily: baseFont,
              fontSize: 12.5,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = palette.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = palette.textMute)}
          >
            <Archive size={12} /> View archive
            {archivedTasks.length > 0 && (
              <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.05em' }}>
                {archivedTasks.length}
              </span>
            )}
          </button>
        </div>
      )}

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
              {isAdmin ? (
                <Select palette={palette} value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                  <option value="">Pick someone…</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </Select>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 8,
                    backgroundColor: palette.surfaceAlt,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <Avatar initials={user?.avatar || '?'} size={22} palette={palette} />
                  <span style={{ fontFamily: baseFont, fontSize: 13.5, color: palette.text, fontWeight: 500 }}>
                    {user?.name || 'You'}
                  </span>
                  <span style={{ fontFamily: monoFont, fontSize: 10.5, color: palette.textMute, letterSpacing: '0.06em', marginLeft: 'auto' }}>
                    LOCKED
                  </span>
                </div>
              )}
            </div>
            <div>
              <FieldLabel palette={palette}>Estimate</FieldLabel>
              <DurationInput
                palette={palette}
                value={form.estMinutes}
                onChange={(min) => setForm({ ...form, estMinutes: min })}
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

          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Description (optional)</FieldLabel>
            <Textarea
              palette={palette}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Context, links, acceptance criteria…"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Estimated start <span style={{ color: palette.danger }}>*</span></FieldLabel>
            <TextInput
              palette={palette}
              type="date"
              required
              value={form.plannedStartDate}
              onChange={(e) => setForm({ ...form, plannedStartDate: e.target.value })}
            />
            <div style={{ fontFamily: baseFont, fontSize: 11.5, color: palette.textMute, marginTop: 6 }}>
              When you expect work to start. The actual start date is captured automatically when the task moves to In&nbsp;progress.
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <FieldLabel palette={palette}>Attachments (optional)</FieldLabel>
            <label
              htmlFor="team-task-files"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                backgroundColor: palette.surfaceAlt,
                border: `1px dashed ${palette.border}`,
                color: palette.textDim,
                cursor: uploading ? 'wait' : 'pointer',
                fontFamily: baseFont,
                fontSize: 13,
              }}
            >
              <Paperclip size={13} />
              {uploading ? 'Uploading…' : 'Attach files'}
            </label>
            <input
              id="team-task-files"
              type="file"
              multiple
              hidden
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = '';
              }}
            />
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {attachments.map((a, idx) => {
                  const isImg = (a.mimetype || '').startsWith('image/');
                  return (
                    <span
                      key={a.url + idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 6px 4px 8px',
                        borderRadius: 8,
                        backgroundColor: palette.surfaceAlt,
                        border: `1px solid ${palette.border}`,
                        fontFamily: baseFont,
                        fontSize: 12,
                        color: palette.text,
                        maxWidth: 220,
                      }}
                    >
                      {isImg ? <ImageIcon size={12} style={{ color: palette.textMute }} /> : <FileText size={12} style={{ color: palette.textMute }} />}
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.originalName}>
                        {a.originalName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: palette.textMute, padding: 2, display: 'inline-flex' }}
                        title="Remove"
                      >
                        <XIcon size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
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
            <GhostButton
              onClick={() => {
                setShowNew(false);
                setAttachments([]);
              }}
              palette={palette}
            >
              Cancel
            </GhostButton>
            <SolidButton type="submit" palette={palette} disabled={submitting || uploading} icon={Plus}>
              {submitting ? 'Creating…' : 'Create task'}
            </SolidButton>
          </div>
        </form>
      </Modal>

      {hover && !draggingId && (
        <TaskTooltip task={hover.task} anchor={hover.anchor} mouse={hover.mouse} palette={palette} isDark={isDark} />
      )}
      {miniHover && !draggingId && (
        <MiniTooltip anchor={miniHover.anchor} palette={palette}>
          {miniHover.task.owner?.name || 'Unassigned'}
          {miniHover.task.owner?.jobTitle ? ` · ${miniHover.task.owner.jobTitle}` : ''}
        </MiniTooltip>
      )}

      {/* Permanent delete confirm */}
      <Modal open={!!confirmPermanent} onClose={() => setConfirmPermanent(null)} title="Delete permanently?" palette={palette} width={440}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 12,
            borderRadius: 8,
            backgroundColor: palette.dangerBg,
            color: palette.danger,
            fontFamily: baseFont,
            fontSize: 13,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              "{confirmPermanent?.title}"
            </div>
            This will erase the task and its history forever. This action cannot be undone.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <GhostButton onClick={() => setConfirmPermanent(null)} palette={palette}>
            Cancel
          </GhostButton>
          <button
            type="button"
            onClick={onDeletePermanent}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              backgroundColor: palette.danger,
              color: '#fff',
              border: 'none',
              fontFamily: baseFont,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} /> Delete permanently
          </button>
        </div>
      </Modal>
    </div>
  );
}
