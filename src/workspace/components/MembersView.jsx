import { useState, useEffect } from 'react';
import { workspaceUsersAPI, workspaceTasksAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const MembersView = ({ boardId, boardName }) => {
  const { isSuperAdmin } = useWorkspaceAuth();
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [assigningTask, setAssigningTask] = useState(null);

  useEffect(() => {
    loadData();
  }, [boardId]);

  const loadData = async () => {
    try {
      const [usersRes, tasksRes] = await Promise.all([
        workspaceUsersAPI.getAll(),
        workspaceTasksAPI.getByBoard(boardId),
      ]);
      if (usersRes.data.success) {
        setMembers(usersRes.data.data);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTask = async (taskId, memberId) => {
    try {
      await workspaceTasksAPI.update(taskId, { assignee: memberId });
      setTasks(tasks.map(t =>
        t._id === taskId
          ? { ...t, assignee: members.find(m => m._id === memberId) }
          : t
      ));
      setAssigningTask(null);
    } catch (error) {
      console.error('Failed to assign task:', error);
    }
  };

  const handleUnassignTask = async (taskId) => {
    try {
      await workspaceTasksAPI.update(taskId, { assignee: null });
      setTasks(tasks.map(t =>
        t._id === taskId ? { ...t, assignee: null } : t
      ));
    } catch (error) {
      console.error('Failed to unassign task:', error);
    }
  };

  const isRealTask = (t) => t.type !== 'note' && !t.parentTask && !t.title.toLowerCase().includes('connect with me');

  const getMemberTasks = (memberId) => {
    return tasks.filter(t => t.assignee?._id === memberId && isRealTask(t));
  };

  const getUnassignedTasks = () => {
    return tasks.filter(t => !t.assignee && isRealTask(t));
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

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
        Loading members...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#f1f1f1' }}>
          Team Members
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
          {members.length} member{members.length !== 1 ? 's' : ''} • {tasks.filter(isRealTask).length} task{tasks.filter(isRealTask).length !== 1 ? 's' : ''} in {boardName}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Members List */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb', marginBottom: '16px' }}>
            Members
          </h3>

          {members.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#252628', borderRadius: '12px' }}>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>No members added yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {members.map((member) => {
                const memberTasks = getMemberTasks(member._id);
                const isSelected = selectedMember?._id === member._id;

                return (
                  <div
                    key={member._id}
                    onClick={() => setSelectedMember(isSelected ? null : member)}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: isSelected ? '#eff6ff' : '#fff',
                      border: isSelected ? '2px solid #6f6e6f' : '1px solid #333436',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: member.role === 'super_admin' ? '#22c55e' : '#6f6e6f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '14px',
                          fontWeight: '600',
                        }}
                      >
                        {member.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#f1f1f1' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {member.email}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '11px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: member.role === 'super_admin' ? '#dcfce7' : '#dbeafe',
                            color: member.role === 'super_admin' ? '#166534' : '#1e40af',
                            fontWeight: '500',
                          }}
                        >
                          {member.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          {memberTasks.length} task{memberTasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Member's Tasks */}
                    {isSelected && memberTasks.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333436' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                          Assigned Tasks:
                        </div>
                        {memberTasks.map((task) => (
                          <div
                            key={task._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              backgroundColor: '#2a2b2d',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              border: '1px solid #333436',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: getStatusColor(task.status),
                                }}
                              />
                              <span style={{ fontSize: '12px', color: '#e5e7eb' }}>{task.title}</span>
                            </div>
                            {isSuperAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnassignTask(task._id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#9ca3af',
                                  fontSize: '11px',
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tasks Assignment */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e5e7eb', marginBottom: '16px' }}>
            Task Assignments
          </h3>

          {/* Unassigned Tasks */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#6b7280',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                }}
              />
              Unassigned Tasks ({getUnassignedTasks().length})
            </div>

            {getUnassignedTasks().length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#252628',
                  borderRadius: '8px',
                  border: '1px dashed #333436',
                }}
              >
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>All tasks are assigned</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {getUnassignedTasks().map((task) => (
                  <div
                    key={task._id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#2a2b2d',
                      border: '1px solid #333436',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#f1f1f1' }}>
                          {task.title}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: getStatusColor(task.status) + '20',
                            color: getStatusColor(task.status),
                            fontWeight: '500',
                          }}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                      {isSuperAdmin && (
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setAssigningTask(assigningTask === task._id ? null : task._id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#6f6e6f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Assign
                          </button>

                          {/* Assign Dropdown */}
                          {assigningTask === task._id && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                backgroundColor: '#2a2b2d',
                                borderRadius: '8px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                                padding: '8px',
                                zIndex: 100,
                                minWidth: '180px',
                              }}
                            >
                              <div style={{ fontSize: '11px', color: '#6b7280', padding: '4px 8px', marginBottom: '4px' }}>
                                Assign to:
                              </div>
                              {members.map((member) => (
                                <div
                                  key={member._id}
                                  onClick={() => handleAssignTask(task._id, member._id)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <div
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '6px',
                                      backgroundColor: member.role === 'super_admin' ? '#22c55e' : '#6f6e6f',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#fff',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                    }}
                                  >
                                    {member.name?.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span style={{ fontSize: '12px', color: '#e5e7eb' }}>
                                    {member.name} <span style={{ color: '#9ca3af', fontSize: '11px' }}>({member.role === 'super_admin' ? 'Super Admin' : 'Admin'})</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default MembersView;
