import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { workspaceBoardsAPI, workspaceTasksAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailPanel from '../components/TaskDetailPanel';
import TasksListView from '../components/TasksListView';
import MembersView from '../components/MembersView';
import CalendarView from '../components/CalendarView';
import DocumentsView from '../components/DocumentsView';
import BoardSettingsView from '../components/BoardSettingsView';
import MeetingsView from '../components/MeetingsView';

// Default columns if board has no custom statuses
const DEFAULT_COLUMNS = [
  { id: 'open', label: 'Open', color: '#6b7280' },
  { id: 'todo', label: 'To-Do', color: '#3b82f6' },
  { id: 'doing', label: 'Doing', color: '#f59e0b' },
  { id: 'done', label: 'Done', color: '#22c55e' },
];

const BoardDetail = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSuperAdmin } = useWorkspaceAuth();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInColumn, setCreateInColumn] = useState('open');
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  const viewMode = searchParams.get('view') || 'kanban';
  const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';

  const setViewMode = (mode) => {
    if (mode === 'kanban') {
      searchParams.delete('view');
    } else {
      searchParams.set('view', mode);
    }
    setSearchParams(searchParams);
  };

  const prevViewMode = useRef(viewMode);

  useEffect(() => {
    loadBoardAndTasks();
  }, [boardId]);

  // Reload board data when leaving settings view (to get updated settings)
  useEffect(() => {
    if (prevViewMode.current === 'settings' && viewMode !== 'settings') {
      loadBoardAndTasks();
    }
    prevViewMode.current = viewMode;
  }, [viewMode]);

  const loadBoardAndTasks = async () => {
    try {
      const [boardRes, tasksRes] = await Promise.all([
        workspaceBoardsAPI.getOne(boardId),
        workspaceTasksAPI.getByBoard(boardId),
      ]);

      if (boardRes.data.success) {
        setBoard(boardRes.data.data);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = (newTask) => {
    setTasks([...tasks, newTask]);
    setShowCreateModal(false);
  };

  const handleTaskUpdate = (updatedTask) => {
    setTasks(tasks.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    setSelectedTask(updatedTask);
  };

  const handleTaskDelete = (taskId) => {
    setTasks(tasks.filter((t) => t._id !== taskId));
    setSelectedTask(null);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) return;

    // Optimistic update
    const oldStatus = draggedTask.status;
    setTasks(tasks.map((t) => (t._id === draggedTask._id ? { ...t, status: newStatus } : t)));

    try {
      await workspaceTasksAPI.updateStatus(draggedTask._id, { status: newStatus });
    } catch (error) {
      // Revert on error
      setTasks(tasks.map((t) => (t._id === draggedTask._id ? { ...t, status: oldStatus } : t)));
      console.error('Failed to update task status:', error);
    }
  };

  const isRealTask = (t) => t.type !== 'note' && !t.parentTask && !t.title.toLowerCase().includes('connect with me');

  const getTasksByStatus = (status) => {
    return tasks.filter((t) => t.status === status && isRealTask(t)).sort((a, b) => a.order - b.order);
  };

  const openCreateModal = (columnId) => {
    setCreateInColumn(columnId);
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#a2a0a2', backgroundColor: '#1e1f21', minHeight: '100vh' }}>Loading board...</div>
    );
  }

  if (!board) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#1e1f21', minHeight: '100vh' }}>
        <h2 style={{ color: '#f1f1f1', marginBottom: '16px' }}>Board not found</h2>
        <button
          onClick={() => navigate(`${basePath}/boards`)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6f6e6f',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Back to Boards
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: 'calc(100vh - 48px)',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      overflow: 'hidden',
      backgroundColor: '#1e1f21'
    }}>
      {/* Board Header - Asana Style */}
      <div
        style={{
          padding: '20px 24px 0 24px',
          borderBottom: '1px solid #424244',
        }}
      >
        {/* Top Row: Board Name + Stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px 0 0 0',
                backgroundColor: board.color || '#6f6e6f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#f1f1f1', margin: 0 }}>
              {board.name}
            </h1>
            {board.description && (
              <span style={{ color: '#a2a0a2', fontSize: '13px', marginLeft: '4px' }}>
                {board.description}
              </span>
            )}
          </div>

          {/* Right side - Stats */}
          {viewMode !== 'settings' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: '#a2a0a2', fontSize: '13px' }}>
                {tasks.filter((t) => t.status === 'done' && t.type !== 'note').length}/{tasks.filter(t => t.type !== 'note').length} completed
              </span>
              {isSuperAdmin && (
                <button
                  onClick={() => setViewMode('settings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: 'transparent',
                    color: '#a2a0a2',
                    border: '1px solid #424244',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a3b3d';
                    e.currentTarget.style.color = '#f1f1f1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#a2a0a2';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                  </svg>
                  Settings
                </button>
              )}
            </div>
          )}
        </div>

        {/* View Tabs - Asana Style */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
          {[
            { id: 'summary', label: 'Summary' },
            { id: 'list', label: 'List' },
            { id: 'kanban', label: 'Board' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'documents', label: 'Documents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '500',
                color: viewMode === tab.id ? '#f1f1f1' : '#a2a0a2',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: viewMode === tab.id ? '2px solid #f1f1f1' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => { if (viewMode !== tab.id) e.currentTarget.style.color = '#f1f1f1'; }}
              onMouseLeave={(e) => { if (viewMode !== tab.id) e.currentTarget.style.color = '#a2a0a2'; }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar - Asana Style (only for kanban/list) */}
      {(viewMode === 'kanban' || viewMode === 'list') && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #2a2b2d',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSuperAdmin && (
              <button
                onClick={() => openCreateModal('open')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#3a3b3d',
                  color: '#f1f1f1',
                  border: '1px solid #4a4b4d',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add task
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {['Filter', 'Sort', 'Group'].map((btn) => (
              <button
                key={btn}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  color: '#a2a0a2',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a2a0a2'; }}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Dashboard */}
      {viewMode === 'summary' && (() => {
        const realTasks = tasks.filter(isRealTask);
        const statusCounts = {
          open: realTasks.filter(t => t.status === 'open').length,
          todo: realTasks.filter(t => t.status === 'todo').length,
          doing: realTasks.filter(t => t.status === 'doing').length,
          done: realTasks.filter(t => t.status === 'done').length,
        };
        const priorityCounts = {
          urgent: realTasks.filter(t => t.priority === 'urgent').length,
          high: realTasks.filter(t => t.priority === 'high').length,
          medium: realTasks.filter(t => t.priority === 'medium').length,
          low: realTasks.filter(t => t.priority === 'low').length,
        };
        const maxPriority = Math.max(...Object.values(priorityCounts), 1);
        const assigneeCounts = {};
        realTasks.forEach(t => {
          const name = t.assignee?.name || 'Unassigned';
          assigneeCounts[name] = (assigneeCounts[name] || 0) + 1;
        });
        const totalTasks = realTasks.length || 1;
        const cardStyle = { backgroundColor: '#2a2b2d', borderRadius: '12px', padding: '24px', flex: 1, minWidth: 0 };
        const headingStyle = { fontSize: '15px', fontWeight: '600', color: '#f1f1f1', margin: '0 0 4px 0' };
        const subStyle = { fontSize: '12px', color: '#6f6e6f', margin: '0 0 20px 0' };

        return (
          <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
            {/* Top stats */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Total', value: realTasks.length, color: '#a2a0a2' },
                { label: 'To-Do', value: statusCounts.todo, color: '#3b82f6' },
                { label: 'Doing', value: statusCounts.doing, color: '#f59e0b' },
                { label: 'Done', value: statusCounts.done, color: '#22c55e' },
              ].map(s => (
                <div key={s.label} style={{ flex: 1, backgroundColor: '#2a2b2d', borderRadius: '10px', padding: '16px 20px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6f6e6f' }}>{s.label}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: '700', color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* 4 boxes grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Status Overview */}
              <div style={cardStyle}>
                <h3 style={headingStyle}>Status overview</h3>
                <p style={subStyle}>Snapshot of task status distribution</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  {/* Donut */}
                  <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      {(() => {
                        const total = realTasks.length || 1;
                        const segments = [
                          { pct: (statusCounts.done / total) * 100, color: '#22c55e' },
                          { pct: (statusCounts.doing / total) * 100, color: '#f59e0b' },
                          { pct: (statusCounts.todo / total) * 100, color: '#3b82f6' },
                          { pct: (statusCounts.open / total) * 100, color: '#6b7280' },
                        ];
                        let offset = 0;
                        return segments.map((seg, i) => {
                          const el = <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={seg.color} strokeWidth="4" strokeDasharray={`${seg.pct * 0.88} ${88 - seg.pct * 0.88}`} strokeDashoffset={-offset * 0.88} />;
                          offset += seg.pct;
                          return el;
                        });
                      })()}
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: '#f1f1f1' }}>{realTasks.length}</span>
                      <span style={{ fontSize: '10px', color: '#6f6e6f' }}>Total</span>
                    </div>
                  </div>
                  {/* Legend */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Done', count: statusCounts.done, color: '#22c55e' },
                      { label: 'Doing', count: statusCounts.doing, color: '#f59e0b' },
                      { label: 'To-Do', count: statusCounts.todo, color: '#3b82f6' },
                      { label: 'Open', count: statusCounts.open, color: '#6b7280' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: s.color }} />
                        <span style={{ fontSize: '13px', color: '#a2a0a2' }}>{s.label}: {s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={cardStyle}>
                <h3 style={headingStyle}>Recent activity</h3>
                <p style={subStyle}>Latest updates in this project</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {realTasks.slice(0, 4).map(t => (
                    <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>
                        {t.assignee?.name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>{t.assignee?.name || 'Unassigned'}</strong> — {t.title}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6f6e6f' }}>
                          Status: {t.status} {t.updatedAt ? `· ${new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {realTasks.length === 0 && <p style={{ color: '#6f6e6f', fontSize: '13px' }}>No tasks yet</p>}
                </div>
              </div>

              {/* Priority Breakdown */}
              <div style={cardStyle}>
                <h3 style={headingStyle}>Priority breakdown</h3>
                <p style={subStyle}>Distribution of task priorities</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Urgent', count: priorityCounts.urgent, color: '#ef4444' },
                    { label: 'High', count: priorityCounts.high, color: '#f97316' },
                    { label: 'Medium', count: priorityCounts.medium, color: '#f59e0b' },
                    { label: 'Low', count: priorityCounts.low, color: '#22c55e' },
                  ].map(p => (
                    <div key={p.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#a2a0a2' }}>{p.label}</span>
                        <span style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: '600' }}>{p.count}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#1e1f21', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(p.count / maxPriority) * 100}%`, backgroundColor: p.color, borderRadius: '4px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Workload */}
              <div style={cardStyle}>
                <h3 style={headingStyle}>Team workload</h3>
                <p style={subStyle}>Task distribution across team members</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(assigneeCounts).map(([name, count]) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>
                        {name.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: '13px', color: '#a2a0a2', width: '80px', flexShrink: 0 }}>{name}</span>
                      <div style={{ flex: 1, height: '8px', backgroundColor: '#1e1f21', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / totalTasks) * 100}%`, backgroundColor: '#3b82f6', borderRadius: '4px', minWidth: '20px' }} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#e5e7eb', fontWeight: '600', width: '35px', textAlign: 'right' }}>{Math.round((count / totalTasks) * 100)}%</span>
                    </div>
                  ))}
                  {Object.keys(assigneeCounts).length === 0 && <p style={{ color: '#6f6e6f', fontSize: '13px' }}>No tasks assigned</p>}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* List View */}
      {viewMode === 'list' && (
        <TasksListView
          boardId={boardId}
          boardName={board.name}
          boardColor={board.color}
        />
      )}

      {/* Members View */}
      {viewMode === 'members' && (
        <MembersView
          boardId={boardId}
          boardName={board.name}
        />
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarView
          boardId={boardId}
          boardName={board.name}
          boardColor={board.color}
        />
      )}

      {/* Documents View */}
      {viewMode === 'documents' && (
        <DocumentsView
          boardId={boardId}
          boardName={board.name}
          boardColor={board.color}
        />
      )}

      {/* Meetings View */}
      {viewMode === 'meetings' && (
        <MeetingsView
          boardId={boardId}
          boardName={board.name}
        />
      )}

      {/* Settings View */}
      {viewMode === 'settings' && (
        <BoardSettingsView
          boardId={boardId}
          boardName={board.name}
        />
      )}

      {/* Kanban Board */}
      {viewMode === 'kanban' && (() => {
        // Use dynamic columns from board settings, or fall back to defaults
        const columns = board?.settings?.statuses?.length > 0
          ? board.settings.statuses
          : DEFAULT_COLUMNS;

        return (
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))`,
          gap: '0px',
          overflow: 'auto',
          padding: '0',
        }}
      >
        {columns.map((column, colIndex) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              style={{
                backgroundColor: 'transparent',
                borderRight: colIndex < columns.length - 1 ? '1px solid #2a2b2d' : 'none',
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header - Asana Style */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                  padding: '0 4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: '600', color: '#f1f1f1', fontSize: '15px' }}>
                    {column.label}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#6f6e6f',
                      fontWeight: '400',
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => openCreateModal(column.id)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6f6e6f',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Tasks */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '2px',
                }}
              >
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    boardColor={board.color}
                    isSuperAdmin={isSuperAdmin}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedTask(task)}
                    onUpdate={handleTaskUpdate}
                    onDelete={handleTaskDelete}
                  />
                ))}

                {columnTasks.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed #424244',
                      borderRadius: '8px',
                      color: '#6f6e6f',
                      fontSize: '13px',
                      minHeight: '60px',
                    }}
                  >
                    Drop tasks here
                  </div>
                )}
              </div>

              {/* Add Task Button - Asana Style */}
              {isSuperAdmin && (
                <button
                  onClick={() => openCreateModal(column.id)}
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#6f6e6f',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#f1f1f1';
                    e.currentTarget.style.backgroundColor = '#353638';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6f6e6f';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Add task
                </button>
              )}
            </div>
          );
        })}
      </div>
        );
      })()}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          boardId={boardId}
          boardName={board?.name}
          boardSettings={board?.settings}
          initialStatus={createInColumn}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateTask}
        />
      )}

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          boardColor={board.color}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
};

export default BoardDetail;
