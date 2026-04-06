import { useState, useEffect } from 'react';
import { workspaceTasksAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import CreateTaskModal from './CreateTaskModal';
import TaskCard from './TaskCard';
import TaskDetailPanel from './TaskDetailPanel';

const TasksListView = ({ boardId, boardName, boardColor }) => {
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
  }, [boardId]);

  const loadTasks = async () => {
    try {
      const response = await workspaceTasksAPI.getByBoard(boardId);
      if (response.data.success) {
        // Filter out items of type 'note' or items with a parentTask - these stay in the Calendar only
        const filteredTasks = response.data.data.filter(task => task.type !== 'note' && !task.parentTask && !task.title.toLowerCase().includes('connect with me'));
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
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
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
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s',
                width: 'fit-content'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                Change Status
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                Current task: <span style={{ color: '#2558BF', fontWeight: '600' }}>{selectedTask.title}</span>
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
                    backgroundColor: isOver ? '#eff6ff' : '#f9fafb',
                    borderRadius: '16px',
                    padding: '20px',
                    border: `2px dashed ${isActive ? getStatusColor(status) : (isOver ? '#3b82f6' : '#e5e7eb')}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    cursor: 'default',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    transform: isOver ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isOver ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none',
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
                      color: isActive ? '#111827' : '#374151' 
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
                      color: isOver ? '#3b82f6' : '#9ca3af', 
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
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                All Tasks
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
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
                  backgroundColor: '#2558BF',
                  color: '#fff',
                  border: 'none',
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
                  backgroundColor: filter === tab.id ? '#2558BF' : '#f3f4f6',
                  color: filter === tab.id ? '#fff' : '#4b5563',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {tab.label}
                <span
                  style={{
                    backgroundColor: filter === tab.id ? 'rgba(255,255,255,0.2)' : '#e5e7eb',
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
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #e5e7eb',
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="#d1d5db"
                style={{ margin: '0 auto 16px' }}
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
              </svg>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                No tasks {filter !== 'all' ? `in ${getStatusLabel(filter)}` : 'added yet'}
              </h3>
              <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>
                Create your first task to get started
              </p>
              {isSuperAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2558BF',
                    color: '#fff',
                    border: 'none',
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
                backgroundColor: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                  padding: '12px 16px',
                  backgroundColor: '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase',
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
                    borderBottom: '1px solid #f3f4f6',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => setSelectedTask(selectedTask?._id === task._id ? null : task)}
                >
                  {/* Task Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: boardColor || '#2558BF',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#6b7280',
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
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {formatDate(task.scheduledDate)}
                  </div>

                  {/* Due Date */}
                  <div style={{ fontSize: '13px', color: task.dueDate ? '#374151' : '#9ca3af' }}>
                    {formatDate(task.dueDate)}
                  </div>

                  {/* Assignee */}
                  <div>
                    {task.assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#2558BF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '10px',
                            fontWeight: '600',
                          }}
                        >
                          {task.assignee.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151' }}>
                          {task.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>Unassigned</span>
                    )}
                  </div>

                  {/* Status */}
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: getStatusColor(task.status) + '15',
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
