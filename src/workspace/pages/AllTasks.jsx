import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceTasksAPI, workspaceUsersAPI } from '../../services/api';

const PRIORITY_COLORS = {
  low: { bg: '#f0fdf4', color: '#166534' },
  medium: { bg: '#fefce8', color: '#854d0e' },
  high: { bg: '#3a1a1a', color: '#dc2626' },
  urgent: { bg: '#3a1a1a', color: '#991b1b' },
};

const STATUS_COLORS = {
  open: { bg: '#2a2b2d', color: '#a2a0a2' },
  todo: { bg: '#1a2a3a', color: '#1e40af' },
  doing: { bg: '#2e2a1a', color: '#92400e' },
  done: { bg: '#1a2e1a', color: '#166534' },
};

const AllTasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    assignee: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        workspaceTasksAPI.getAll(),
        workspaceUsersAPI.getAll(),
      ]);

      if (tasksRes.data.success) setTasks(tasksRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isRealTask = (t) => t.type !== 'note' && !t.title.toLowerCase().includes('connect with me');

  const filteredTasks = tasks.filter((task) => {
    if (!isRealTask(task)) return false;
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assignee?._id !== filters.assignee) return false;
    return true;
  });

  const stats = {
    total: tasks.filter(isRealTask).length,
    open: tasks.filter((t) => t.status === 'open' && isRealTask(t)).length,
    todo: tasks.filter((t) => t.status === 'todo' && isRealTask(t)).length,
    doing: tasks.filter((t) => t.status === 'doing' && isRealTask(t)).length,
    done: tasks.filter((t) => t.status === 'done' && isRealTask(t)).length,
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (date, status) => {
    return date && new Date(date) < new Date() && status !== 'done';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f1f1', margin: 0 }}>
          All Tasks
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          View and manage all tasks across boards
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Total', value: stats.total, color: '#6b7280' },
          { label: 'Open', value: stats.open, color: '#6b7280' },
          { label: 'To-Do', value: stats.todo, color: '#3b82f6' },
          { label: 'Doing', value: stats.doing, color: '#f59e0b' },
          { label: 'Done', value: stats.done, color: '#22c55e' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: '#2a2b2d',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 4px 0' }}>{stat.label}</p>
            <p
              style={{
                color: stat.color,
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: '#2a2b2d',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="#9ca3af"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px 8px 40px',
              fontSize: '14px',
              border: '1px solid #333436',
              borderRadius: '8px',
              outline: 'none',
              backgroundColor: '#2a2b2d',
              color: '#e5e7eb',
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #333436',
            borderRadius: '8px',
            backgroundColor: '#2a2b2d',
            color: '#e5e7eb',
            minWidth: '120px',
          }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="todo">To-Do</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #333436',
            borderRadius: '8px',
            backgroundColor: '#2a2b2d',
            color: '#e5e7eb',
            minWidth: '120px',
          }}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assignee}
          onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            border: '1px solid #333436',
            borderRadius: '8px',
            backgroundColor: '#2a2b2d',
            color: '#e5e7eb',
            minWidth: '150px',
          }}
        >
          <option value="">All Members</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>

        {/* Clear Filters */}
        {(filters.search || filters.status || filters.priority || filters.assignee) && (
          <button
            onClick={() => setFilters({ search: '', status: '', priority: '', assignee: '' })}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              color: '#6b7280',
              backgroundColor: '#2a2b2d',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading...</div>
      ) : filteredTasks.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#2a2b2d',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="#424244" style={{ marginBottom: '16px' }}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
          </svg>
          <h3 style={{ color: '#e5e7eb', fontSize: '18px', marginBottom: '8px' }}>No tasks found</h3>
          <p style={{ color: '#6b7280' }}>
            {filters.search || filters.status || filters.priority || filters.assignee
              ? 'Try adjusting your filters'
              : 'Create a board and add tasks to get started'}
          </p>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#2a2b2d',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#252628' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Task
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Board
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Priority
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Assignee
                </th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => {
                const statusStyle = STATUS_COLORS[task.status] || STATUS_COLORS.open;
                const priorityStyle = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;

                return (
                  <tr
                    key={task._id}
                    style={{ borderTop: '1px solid #333436', cursor: 'pointer' }}
                    onClick={() => navigate(`/workspace/super-admin/boards/${task.board?._id || task.board}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a2b2d')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ margin: 0, fontWeight: '500', color: '#f1f1f1', fontSize: '14px' }}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p
                          style={{
                            margin: '4px 0 0 0',
                            color: '#6b7280',
                            fontSize: '12px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px',
                          }}
                        >
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: '#e5e7eb',
                        }}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '2px',
                            backgroundColor: task.board?.color || '#6f6e6f',
                          }}
                        />
                        {task.board?.name || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: priorityStyle.bg,
                          color: priorityStyle.color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {task.assignee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              backgroundColor: '#6f6e6f',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: '600',
                            }}
                          >
                            {task.assignee.initials || task.assignee.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{task.assignee.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          color: isOverdue(task.dueDate, task.status) ? '#dc2626' : '#6b7280',
                          fontWeight: isOverdue(task.dueDate, task.status) ? '500' : '400',
                        }}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllTasks;
