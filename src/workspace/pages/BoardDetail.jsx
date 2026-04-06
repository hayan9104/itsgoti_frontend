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
      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading board...</div>
    );
  }

  if (!board) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <h2 style={{ color: '#374151', marginBottom: '16px' }}>Board not found</h2>
        <button
          onClick={() => navigate(`${basePath}/boards`)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2558BF',
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
      backgroundColor: '#f9fafb' // Ensure the grey background is here
    }}>
      {/* Board Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 0 24px', // Added padding here instead of in children
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '4px',
                  backgroundColor: board.color || '#2558BF',
                }}
              />
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
                {board.name}
              </h1>
            </div>
            {board.description && (
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                {board.description}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Stats and Settings (hide when in settings view) */}
        {viewMode !== 'settings' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>
              {tasks.filter((t) => t.status === 'done' && t.type !== 'note').length}/{tasks.filter(t => t.type !== 'note').length} completed
            </span>
            {isSuperAdmin && (
              <button
                onClick={() => setViewMode('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                Settings
              </button>
            )}
          </div>
        )}
      </div>

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
          gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
          gap: '16px',
          overflow: 'hidden',
          padding: '0 24px 24px 24px',
        }}
      >
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div
              key={column.id}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: column.color,
                    }}
                  />
                  <span style={{ fontWeight: '600', color: '#374151', fontSize: '14px' }}>
                    {column.label}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#e5e7eb',
                      borderRadius: '10px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      color: '#6b7280',
                    }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => openCreateModal(column.id)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6b7280',
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e5e7eb')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
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
                  gap: '12px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '4px',
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
                      border: '2px dashed #e5e7eb',
                      borderRadius: '8px',
                      color: '#9ca3af',
                      fontSize: '13px',
                      minHeight: '80px',
                    }}
                  >
                    Drop tasks here
                  </div>
                )}
              </div>

              {/* Add Task Button */}
              {isSuperAdmin && (
                <button
                  onClick={() => openCreateModal(column.id)}
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    backgroundColor: 'transparent',
                    border: '1px dashed #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#2558BF';
                    e.target.style.color = '#2558BF';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.color = '#6b7280';
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Add Task
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
