import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import { workspaceBoardsAPI, workspaceTasksAPI } from '../../services/api';
import companyLogo from '../../assets/1771994065777-572871030.png';

const HomeSidebar = () => {
  const { user, isSuperAdmin } = useWorkspaceAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';

  // Get current view from URL to highlight active menu item
  const currentView = searchParams.get('view') || 'kanban';
  const currentBoardId = location.pathname.match(/\/boards\/([^/?]+)/)?.[1];

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBoard, setExpandedBoard] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // 'tasks', 'calendar', etc.
  const [boardTasks, setBoardTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const response = await workspaceBoardsAPI.getAll();
      if (response.data.success) {
        setBoards(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBoardTasks = async (boardId) => {
    setLoadingTasks(true);
    try {
      const response = await workspaceTasksAPI.getByBoard(boardId);
      if (response.data.success) {
        setBoardTasks(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setBoardTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSectionClick = (boardId, section) => {
    if (activeSection === section && expandedBoard === boardId) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
      if (section === 'tasks') {
        loadBoardTasks(boardId);
      }
    }
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      await workspaceTasksAPI.updateStatus(taskId, { status: newStatus });
      setBoardTasks(boardTasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task status:', error);
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
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isActive = (path) => {
    return location.pathname === basePath + path || location.pathname === basePath + path + '/';
  };

  const navItemStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '2px',
    color: active ? '#111827' : '#4b5563',
    backgroundColor: active ? '#f3f4f6' : 'transparent',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: active ? '500' : '400',
    transition: 'all 0.15s',
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={companyLogo}
          alt="It's Goti"
          style={{
            height: '50px',
            width: '145px',
            objectFit: 'contain',
            filter: 'invert(1) brightness(0.2)',
          }}
        />
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
        {/* Main Navigation */}
        <nav>
          <NavLink to={basePath} end style={navItemStyle(isActive(''))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            Home
          </NavLink>

          <NavLink to={basePath + '/my-tasks'} style={navItemStyle(isActive('/my-tasks'))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
            </svg>
            My Tasks
          </NavLink>

          <NavLink to={basePath + '/boards'} style={navItemStyle(isActive('/boards') || location.pathname.includes('/boards/'))}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Boards
          </NavLink>
        </nav>

        {/* Folders (Boards) Section */}
        <div style={{ marginTop: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase' }}>
              Boards
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>Loading...</div>
          ) : boards.length === 0 ? (
            <div style={{ padding: '12px 16px', color: '#9ca3af', fontSize: '13px' }}>No boards yet</div>
          ) : (
            <nav>
              {boards.slice(0, 8).map((board) => {
                const isExpanded = expandedBoard === board._id;
                const isCurrentBoard = location.pathname.includes(board._id);

                return (
                  <div
                    key={board._id}
                    style={{
                      position: 'relative',
                      backgroundColor: isCurrentBoard || isExpanded ? '#f3f4f6' : 'transparent',
                      borderRadius: '8px',
                      marginBottom: '2px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentBoard && !isExpanded) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentBoard && !isExpanded) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {/* Board Item */}
                    <div
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedBoard(null);
                          setActiveSection(null);
                          setBoardTasks([]);
                          setSelectedTask(null);
                        } else {
                          setExpandedBoard(board._id);
                          setActiveSection(null);
                          setBoardTasks([]);
                          setSelectedTask(null);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px 10px 16px',
                        color: isCurrentBoard || isExpanded ? '#111827' : '#4b5563',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: isCurrentBoard || isExpanded ? '500' : '400',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '5px',
                            backgroundColor: board.color || '#2558BF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff">
                            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                          </svg>
                        </div>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {board.name}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isExpanded ? '#e5e7eb' : 'transparent',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill={isExpanded ? '#374151' : '#9ca3af'}
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <path d="M7 10l5 5 5-5z" />
                        </svg>
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {isExpanded && (
                      <div
                        style={{
                          paddingBottom: '8px',
                        }}
                      >
                        {/* Tasks */}
                        <div
                          onClick={() => {
                            handleSectionClick(board._id, 'tasks');
                            navigate(`${basePath}/boards/${board._id}?view=list`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 14px 8px 46px',
                            cursor: 'pointer',
                            color: (currentBoardId === board._id && currentView === 'list') ? '#2558BF' : '#6b7280',
                            fontSize: '13px',
                            borderRadius: '6px',
                            margin: '0 8px',
                            backgroundColor: (currentBoardId === board._id && currentView === 'list') ? '#e0e7ff' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!(currentBoardId === board._id && currentView === 'list')) e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                          onMouseLeave={(e) => { if (!(currentBoardId === board._id && currentView === 'list')) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
                          </svg>
                          Tasks
                        </div>

                        {/* Calendar */}
                        <div
                          onClick={() => {
                            handleSectionClick(board._id, 'calendar');
                            navigate(`${basePath}/boards/${board._id}?view=calendar`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 14px 8px 46px',
                            cursor: 'pointer',
                            color: (currentBoardId === board._id && currentView === 'calendar') ? '#2558BF' : '#6b7280',
                            fontSize: '13px',
                            borderRadius: '6px',
                            margin: '0 8px',
                            backgroundColor: (currentBoardId === board._id && currentView === 'calendar') ? '#e0e7ff' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!(currentBoardId === board._id && currentView === 'calendar')) e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                          onMouseLeave={(e) => { if (!(currentBoardId === board._id && currentView === 'calendar')) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                          </svg>
                          Calendar
                        </div>

                        {/* Documents */}
                        <div
                          onClick={() => {
                            handleSectionClick(board._id, 'documents');
                            navigate(`${basePath}/boards/${board._id}?view=documents`);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 14px 8px 46px',
                            cursor: 'pointer',
                            color: (currentBoardId === board._id && currentView === 'documents') ? '#2558BF' : '#6b7280',
                            fontSize: '13px',
                            borderRadius: '6px',
                            margin: '0 8px',
                            backgroundColor: (currentBoardId === board._id && currentView === 'documents') ? '#e0e7ff' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!(currentBoardId === board._id && currentView === 'documents')) e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                          onMouseLeave={(e) => { if (!(currentBoardId === board._id && currentView === 'documents')) e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                          </svg>
                          Documents
                        </div>

                        {/* Members */}
                        {isSuperAdmin && (
                          <div
                            onClick={() => {
                              handleSectionClick(board._id, 'members');
                              navigate(`${basePath}/boards/${board._id}?view=members`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 14px 8px 46px',
                              cursor: 'pointer',
                              color: (currentBoardId === board._id && currentView === 'members') ? '#2558BF' : '#6b7280',
                              fontSize: '13px',
                              borderRadius: '6px',
                              margin: '0 8px',
                              backgroundColor: (currentBoardId === board._id && currentView === 'members') ? '#e0e7ff' : 'transparent',
                            }}
                            onMouseEnter={(e) => { if (!(currentBoardId === board._id && currentView === 'members')) e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                            onMouseLeave={(e) => { if (!(currentBoardId === board._id && currentView === 'members')) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            Members
                          </div>
                        )}

                        {/* Settings */}
                        {isSuperAdmin && (
                          <div
                            onClick={() => {
                              handleSectionClick(board._id, 'settings');
                              navigate(`${basePath}/boards/${board._id}?view=settings`);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 14px 8px 46px',
                              cursor: 'pointer',
                              color: (currentBoardId === board._id && currentView === 'settings') ? '#2558BF' : '#6b7280',
                              fontSize: '13px',
                              borderRadius: '6px',
                              margin: '0 8px',
                              backgroundColor: (currentBoardId === board._id && currentView === 'settings') ? '#e0e7ff' : 'transparent',
                            }}
                            onMouseEnter={(e) => { if (!(currentBoardId === board._id && currentView === 'settings')) e.currentTarget.style.backgroundColor = '#e5e7eb'; }}
                            onMouseLeave={(e) => { if (!(currentBoardId === board._id && currentView === 'settings')) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                            </svg>
                            Settings
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {boards.length > 8 && (
                <NavLink
                  to={basePath + '/boards'}
                  style={{
                    ...navItemStyle(false),
                    paddingLeft: '20px',
                    color: '#2558BF',
                    fontSize: '13px',
                  }}
                >
                  View all ({boards.length})
                </NavLink>
              )}
            </nav>
          )}
        </div>
      </div>

      {/* User Info */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid #f3f4f6',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#2558BF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '600',
            }}
          >
            {user?.initials || user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                fontWeight: '500',
                color: '#111827',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.name}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                color: '#6b7280',
              }}
            >
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSidebar;
