import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { workspaceTasksAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import CreateTaskModal from './CreateTaskModal';
import TaskCard from './TaskCard';
import TaskDetailPanel from './TaskDetailPanel';
import InlineAssigneePicker from './InlineAssigneePicker';

const TasksListView = ({ boardId, boardName, boardColor }) => {
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const { isSuperAdmin } = useWorkspaceAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [filter, setFilter] = useState('all');
  const [dragOverStatus, setDragOverStatus] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [boardId, listId]);

  const loadTasks = async () => {
    try {
      const response = await workspaceTasksAPI.getByBoard(boardId);
      if (response.data.success) {
        let filteredTasks = response.data.data.filter(task => task.type !== 'note' && !task.parentTask && !task.title.toLowerCase().includes('connect with me'));
        // If a specific list is selected, only show tasks for that list
        if (listId) {
          filteredTasks = filteredTasks.filter(task => task.sidebarList === listId);
        }
        setTasks(filteredTasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks([...tasks, newTask]);
    setShowCreateModal(false);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    if (!taskId) return;

    // Optimistic update
    const previousTasks = [...tasks];
    const previousSelectedTask = selectedTask ? { ...selectedTask } : null;
    const oldStatus = selectedTask?.status;

    if (oldStatus === newStatus) {
      setDragOverStatus(null);
      return;
    }

    try {
      // Update state immediately
      const updatedTasks = tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t);
      setTasks(updatedTasks);

      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }

      setDragOverStatus(null);

      // Make API call
      await workspaceTasksAPI.updateStatus(taskId, { status: newStatus });
    } catch (error) {
      // Revert on error
      setTasks(previousTasks);
      setSelectedTask(previousSelectedTask);
      console.error('Failed to update task status:', error);
    }
  };

  const handleDragEnter = (e, status) => {
    e.preventDefault();
    setDragOverStatus(status);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only clear if we're leaving to a non-child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStatus(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#6b7280';
      case 'todo': return '#3b82f6';
      case 'doing': return '#f59e0b';
      case 'done': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'open': return 'Open';
      case 'todo': return 'To-Do';
      case 'doing': return 'Doing';
      case 'done': return 'Done';
      default: return status;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isRealTask = (t) => t.type !== 'note' && !t.title.toLowerCase().includes('connect with me');

  const filteredTasks = filter === 'all'
    ? tasks.filter(isRealTask)
    : tasks.filter(t => t.status === filter && isRealTask(t));

  const statusCounts = {
    all: tasks.filter(isRealTask).length,
    open: tasks.filter(t => t.status === 'open' && isRealTask(t)).length,
    todo: tasks.filter(t => t.status === 'todo' && isRealTask(t)).length,
    doing: tasks.filter(t => t.status === 'doing' && isRealTask(t)).length,
    done: tasks.filter(t => t.status === 'done' && isRealTask(t)).length,
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#a2a0a2' }}>
        Loading tasks...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {selectedTask ? (
        /* Task Status Board (Full Section View) */
        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {/* Header with Back Button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            <button
              onClick={() => setSelectedTask(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#2a2b2d',
                border: '1px solid #424244',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#f1f1f1',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                width: 'fit-content'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#f1f1f1' }}>
                Change Status
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#a2a0a2' }}>
                Current task: <span style={{ color: '#f1f1f1', fontWeight: '600' }}>{selectedTask.title}</span>
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              minHeight: '400px'
            }}
          >
            {['open', 'todo', 'doing', 'done'].map((status) => {
              const isOver = dragOverStatus === status;
              const isActive = selectedTask.status === status;

              return (
                <div
                  key={status}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => handleDragEnter(e, status)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleStatusChange(selectedTask._id, status)}
                  style={{
                    backgroundColor: isOver ? '#2a2b2d' : '#252628',
                    borderRadius: '16px',
                    padding: '20px',
                    border: `2px dashed ${isActive ? getStatusColor(status) : (isOver ? '#a2a0a2' : '#424244')}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    cursor: 'default',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    transform: isOver ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isOver ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none',
                    zIndex: isOver ? 10 : 1
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: getStatusColor(status),
                      boxShadow: isActive ? `0 0 0 4px ${getStatusColor(status)}20` : 'none'
                    }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: isActive ? '700' : '600',
                      color: isActive ? '#f1f1f1' : '#a2a0a2'
                    }}>
                      {getStatusLabel(status)}
                    </span>
                  </div>

                  {/* Selected Task Card in current column */}
                  {isActive && (
                    <TaskCard
                      task={selectedTask}
                      boardColor={boardColor}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('taskId', selectedTask._id);
                        e.target.style.opacity = '0.5';
                        e.target.style.cursor = 'grabbing';
                      }}
                      onDragEnd={(e) => {
                        e.target.style.opacity = '1';
                        e.target.style.cursor = 'grab';
                        setDragOverStatus(null);
                      }}
                      onClick={() => setDetailTask(selectedTask)}
                      onUpdate={(updatedTask) => {
                        setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
                        setSelectedTask(updatedTask);
                        if (detailTask?._id === updatedTask._id) setDetailTask(updatedTask);
                      }}
                      onDelete={(taskId) => {
                        setTasks(tasks.filter(t => t._id !== taskId));
                        setSelectedTask(null);
                        setDetailTask(null);
                      }}
                    />
                  )}

                  {!isActive && (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOver ? '#f1f1f1' : '#6f6e6f',
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '0 20px',
                      fontWeight: isOver ? '600' : '400',
                      transition: 'all 0.2s'
                    }}>
                      {isOver ? `Release to move to ${getStatusLabel(status)}` : `Drop card here to move to ${getStatusLabel(status)}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Original List View */
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#f1f1f1' }}>
                All Tasks
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#a2a0a2' }}>
                {tasks.filter(t => t.type !== 'note').length} task{tasks.filter(t => t.type !== 'note').length !== 1 ? 's' : ''} in {boardName}
              </p>
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#3a3b3d',
                  color: '#f1f1f1',
                  border: '1px solid #4a4b4d',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                Add Task
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'open', label: 'Open' },
              { id: 'todo', label: 'To-Do' },
              { id: 'doing', label: 'Doing' },
              { id: 'done', label: 'Done' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filter === tab.id ? '#3a3b3d' : 'transparent',
                  color: filter === tab.id ? '#f1f1f1' : '#a2a0a2',
                  border: filter === tab.id ? '1px solid #4a4b4d' : '1px solid transparent',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
                <span
                  style={{
                    backgroundColor: filter === tab.id ? '#4a4b4d' : '#2a2b2d',
                    color: filter === tab.id ? '#f1f1f1' : '#6f6e6f',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                >
                  {statusCounts[tab.id]}
                </span>
              </button>
            ))}
          </div>

          {/* Tasks Table */}
          {filteredTasks.length === 0 ? (
            <div
              style={{
                padding: '60px 40px',
                textAlign: 'center',
                backgroundColor: '#252628',
                borderRadius: '12px',
                border: '1px dashed #424244',
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="#4a4b4d"
                style={{ margin: '0 auto 16px' }}
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
              </svg>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#f1f1f1' }}>
                No tasks {filter !== 'all' ? `in ${getStatusLabel(filter)}` : 'added yet'}
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#a2a0a2' }}>
                Create your first task to get started
              </p>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3a3b3d',
                    color: '#f1f1f1',
                    border: '1px solid #4a4b4d',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Task
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#252628',
                borderRadius: '12px',
                border: '1px solid #424244',
                overflow: 'hidden',
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                  padding: '12px 16px',
                  backgroundColor: '#2a2b2d',
                  borderBottom: '1px solid #424244',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6f6e6f',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <div>Task Name</div>
                <div>Start Date</div>
                <div>Due Date</div>
                <div>Assignee</div>
                <div>Status</div>
              </div>

              {/* Table Body */}
              {filteredTasks.map((task) => (
                <div
                  key={task._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                    padding: '14px 16px',
                    borderBottom: '1px solid #2a2b2d',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setDetailTask(task)}
                >
                  {/* Task Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: boardColor || '#6f6e6f',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#e5e7eb' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#6f6e6f',
                            marginTop: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px',
                          }}
                        >
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div style={{ fontSize: '13px', color: '#a2a0a2' }}>
                    {formatDate(task.scheduledDate)}
                  </div>

                  {/* Due Date */}
                  <div style={{ fontSize: '13px', color: task.dueDate ? '#333436' : '#6f6e6f' }}>
                    {formatDate(task.dueDate)}
                  </div>

                  {/* Assignee */}
                  <div>
                    <InlineAssigneePicker
                      task={task}
                      onUpdate={(updatedTask) => {
                        setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
                      }}
                    />
                  </div>

                  {/* Status */}
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: getStatusColor(task.status) + '20',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: getStatusColor(task.status),
                      }}
                    >
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: getStatusColor(task.status),
                        }}
                      />
                      {getStatusLabel(task.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          boardId={boardId}
          boardName={boardName}
          sidebarList={listId || undefined}
          initialStatus="open"
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {detailTask && (
        <TaskDetailPanel
          task={detailTask}
          boardColor={boardColor}
          onClose={() => setDetailTask(null)}
          onUpdate={(updatedTask) => {
            setTasks(tasks.map(t => t._id === updatedTask._id ? updatedTask : t));
            if (selectedTask?._id === updatedTask._id) setSelectedTask(updatedTask);
            setDetailTask(updatedTask);
          }}
          onDelete={(taskId) => {
            setTasks(tasks.filter(t => t._id !== taskId));
            setSelectedTask(null);
            setDetailTask(null);
          }}
        />
      )}
    </div>
  );
};

export default TasksListView;
