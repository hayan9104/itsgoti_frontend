import { useState, useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import { workspaceBoardsAPI, workspaceSidebarAPI, workspaceTasksAPI } from '../../services/api';
import CreateBoardModal from './CreateBoardModal';
import CreateTaskModal from './CreateTaskModal';
import SharingModal from './SharingModal';

// ─── Recursive SidebarTreeItem ───
const SidebarTreeItem = ({ item, depth, boardId, basePath, navigate, onRefresh, onCreateTask, isSuperAdmin, accessLevel = 'board' }) => {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [dotsMenuOpen, setDotsMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(item.name);
  const [showSharing, setShowSharing] = useState(false);
  const location = useLocation();

  const isFolder = item.type === 'folder';
  const isList = item.type === 'list';
  const isTask = item.type === 'task';
  const children = item.children || [];

  // Permission: can this user see +/dots on this item?
  // board access = can do everything
  // folder access = can add lists inside folders, can add tasks in lists, but NOT create new folders
  // list access = can only add tasks in lists, NO folder/list creation
  // task access = nothing
  const canShowActions = isSuperAdmin || (
    (accessLevel === 'board') ||
    (accessLevel === 'folder' && (isFolder || isList)) ||
    (accessLevel === 'list' && isList)
  );
  const paddingLeft = 16 + depth * 16;

  const handleDotsClick = (e) => {
    e.stopPropagation();
    if (dotsMenuOpen) { setDotsMenuOpen(false); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.right + 8 });
    setDotsMenuOpen(true);
    setPlusMenuOpen(false);
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    if (plusMenuOpen) { setPlusMenuOpen(false); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.top, left: rect.right + 8 });
    setPlusMenuOpen(true);
    setDotsMenuOpen(false);
  };

  const handleRename = async () => {
    if (!renameValue.trim() || renameValue === item.name) { setIsRenaming(false); return; }
    try {
      await workspaceSidebarAPI.update(item._id, { name: renameValue.trim() });
      setIsRenaming(false);
      onRefresh();
    } catch (err) { console.error('Failed to rename:', err); }
  };

  const handleCreate = async (type) => {
    setPlusMenuOpen(false);
    if (type === 'task') {
      onCreateTask(boardId, item._id);
      return;
    }
    const name = type === 'folder' ? 'New Folder' : 'New List';
    try {
      await workspaceSidebarAPI.create(boardId, { name, type, parent: item._id });
      setExpanded(true); // auto-expand to show new child
      await onRefresh();
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await workspaceSidebarAPI.delete(item._id);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  // Click-outside to close menus
  useEffect(() => {
    if (!plusMenuOpen && !dotsMenuOpen) return;
    const handler = () => { setPlusMenuOpen(false); setDotsMenuOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [plusMenuOpen, dotsMenuOpen]);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          if (isTask) {
            navigate(`${basePath}/boards/${boardId}?view=list&listId=${item.sidebarList || ''}`);
            return;
          }
          if (isList) {
            navigate(`${basePath}/boards/${boardId}?view=list&listId=${item._id}`);
          }
          if (isFolder) {
            navigate(`${basePath}/boards/${boardId}?view=list&folderId=${item._id}`);
          }
          setExpanded(!expanded);
        }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `6px 8px 6px ${paddingLeft}px`,
          borderRadius: '4px', cursor: 'pointer',
          color: '#a2a0a2', fontSize: '13px',
          transition: 'background-color 0.1s',
          backgroundColor: hovered ? '#2e2f31' : 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          {/* Expand arrow (not for tasks) */}
          {!isTask ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6f6e6f"
              style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
              <path d="M7 10l5 5 5-5z" />
            </svg>
          ) : (
            <span style={{ width: '14px', flexShrink: 0 }} />
          )}
          {/* Type icon */}
          {isFolder ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#a2a0a2" style={{ flexShrink: 0 }}>
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
          ) : isTask ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.status === 'done' ? '#22c55e' : '#6f6e6f'} strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9" />
              {item.status === 'done' && <path d="M9 12l2 2 4-4" />}
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6f6e6f" style={{ flexShrink: 0 }}>
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          )}
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: '13px', padding: '2px 4px', borderRadius: '3px', border: '1px solid #4a4b4d', backgroundColor: '#1e1f21', color: '#e5e7eb', outline: 'none', width: '100%' }}
            />
          ) : (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.name}
            </span>
          )}
        </div>

        {/* Actions: dots (hover) + plus (always when hovered) — only if permitted */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, position: 'relative' }}>
          {hovered && !isTask && canShowActions && (
            <>
              <div
                onClick={handleDotsClick}
                style={{ width: '20px', height: '20px', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f6e6f', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </div>
              <div
                onClick={handlePlusClick}
                style={{ width: '20px', height: '20px', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f6e6f', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </div>
            </>
          )}
        </div>

        {/* Dots dropdown (Rename / Remove) */}
        {dotsMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', top: menuPos.top, left: menuPos.left,
              backgroundColor: '#2a2b2d', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '4px',
              minWidth: '160px', zIndex: 9999, border: '1px solid #3a3b3d',
            }}
          >
            <div
              onClick={() => { setDotsMenuOpen(false); setIsRenaming(true); setRenameValue(item.name); }}
              style={{ padding: '8px 12px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
              Rename
            </div>
            <div
              onClick={(e) => { setDotsMenuOpen(false); handleDelete(e); }}
              style={{ padding: '8px 12px', fontSize: '13px', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a1a1a'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
              Remove
            </div>
            <div style={{ height: '1px', backgroundColor: '#333436', margin: '4px 0' }} />
            <div
              onClick={() => { setDotsMenuOpen(false); setShowSharing(true); }}
              style={{ padding: '8px 12px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>
              Sharing & Permissions
            </div>
          </div>
        )}

        {/* Sharing Modal */}
        {showSharing && (
          <SharingModal
            itemName={item.name}
            itemType={isFolder ? 'Folder' : 'List'}
            boardId={boardId}
            sidebarItemId={item._id}
            visibility={item.visibility || 'private'}
            onVisibilityChange={() => {}}
            onClose={() => setShowSharing(false)}
          />
        )}

        {/* Plus dropdown */}
        {plusMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed', top: menuPos.top, left: menuPos.left,
              backgroundColor: '#2a2b2d', borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '4px',
              minWidth: '200px', zIndex: 9999, border: '1px solid #3a3b3d',
            }}
          >
            <div style={{ padding: '6px 10px 4px', fontSize: '11px', color: '#6f6e6f', fontWeight: '500' }}>Create</div>
            {isFolder ? (
              <>
                <MenuItem icon={<FolderIcon />} label="Folder" desc="Nested folder" onClick={() => handleCreate('folder')} />
                <MenuItem icon={<ListIcon />} label="List" desc="Track tasks & more" onClick={() => handleCreate('list')} />
              </>
            ) : (
              <>
                <MenuItem icon={<TaskIcon />} label="Task" desc="Create a new task" onClick={() => handleCreate('task')} />
                <MenuItem icon={<ListIcon />} label="List" desc="Add another list" onClick={() => handleCreate('list')} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Children (when expanded — for both folders and lists) */}
      {expanded && children.length > 0 && (
        children.map(child => (
          <SidebarTreeItem
            key={child._id}
            item={child}
            depth={depth + 1}
            boardId={boardId}
            basePath={basePath}
            navigate={navigate}
            onRefresh={onRefresh}
            onCreateTask={onCreateTask}
            isSuperAdmin={isSuperAdmin}
            accessLevel={accessLevel}
          />
        ))
      )}
    </>
  );
};

// Small reusable menu item
const MenuItem = ({ icon, label, desc, onClick }) => (
  <div
    onClick={onClick}
    style={{ padding: '8px 10px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
  >
    {icon}
    <div>
      <div style={{ fontWeight: '500', fontSize: '13px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#6f6e6f', marginTop: '1px' }}>{desc}</div>
    </div>
  </div>
);

const FolderIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#a2a0a2"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>;
const ListIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#a2a0a2"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" /></svg>;
const TaskIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="#a2a0a2"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" /></svg>;

// ─── Main HomeSidebar ───
const HomeSidebar = () => {
  const { user, isSuperAdmin } = useWorkspaceAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';

  const currentBoardId = location.pathname.match(/\/boards\/([^/?]+)/)?.[1];

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workExpanded, setWorkExpanded] = useState(true);
  const [workHovered, setWorkHovered] = useState(false);
  const [hoveredBoardId, setHoveredBoardId] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [sortOrder, setSortOrder] = useState('top');
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [boardPlusMenu, setBoardPlusMenu] = useState(null);
  const [boardDotsMenu, setBoardDotsMenu] = useState(null);
  const [boardPlusPos, setBoardPlusPos] = useState({ top: 0, left: 0 });
  const [boardDotsPos, setBoardDotsPos] = useState({ top: 0, left: 0 });
  const [renamingBoardId, setRenamingBoardId] = useState(null);
  const [boardRenameValue, setBoardRenameValue] = useState('');
  const [sharingBoardId, setSharingBoardId] = useState(null);
  const [sidebarItems, setSidebarItems] = useState({}); // { boardId: [items] }
  const [accessStructure, setAccessStructure] = useState(null); // { type: 'all' } or { type: 'filtered', structure: [...] }
  const [expandedBoards, setExpandedBoards] = useState(new Set());
  const [createTaskBoardId, setCreateTaskBoardId] = useState(null);
  const [createTaskListId, setCreateTaskListId] = useState(null);
  const [showVisibilityPopup, setShowVisibilityPopup] = useState(null); // boardId of board with open visibility popup
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { loadBoards(); loadAccessInfo(); }, [location.pathname]);

  const loadAccessInfo = async () => {
    if (isSuperAdmin) {
      setAccessStructure({ type: 'all' });
      return;
    }
    try {
      const res = await workspaceSidebarAPI.getMyAccess();
      if (res.data.success) setAccessStructure(res.data.data);
    } catch (err) {
      console.error('Failed to load access info:', err);
    }
  };

  useEffect(() => {
    const handler = () => loadBoards();
    window.addEventListener('boards-updated', handler);
    return () => window.removeEventListener('boards-updated', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = () => {
      setBoardPlusMenu(null);
      setBoardDotsMenu(null);
      setShowSortMenu(false);
      setShowPlusMenu(false);
      setShowVisibilityPopup(null);
    };
    // Use click (not mousedown) so menu item clicks fire before close
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const updateBoardVisibility = async (boardId, visibility) => {
    try {
      const res = await workspaceBoardsAPI.update(boardId, { visibility });
      if (res.data.success) {
        setBoards(prev => prev.map(b => b._id === boardId ? { ...b, visibility } : b));
        setShowVisibilityPopup(null);
      }
    } catch (err) {
      console.error('Failed to update board visibility:', err);
    }
  };

  const loadBoards = async () => {
    try {
      const response = await workspaceBoardsAPI.getAll();
      if (response.data.success) setBoards(response.data.data);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSidebarItems = useCallback(async (boardId) => {
    try {
      const [sidebarRes, tasksRes] = await Promise.all([
        workspaceSidebarAPI.getByBoard(boardId),
        workspaceTasksAPI.getByBoard(boardId),
      ]);

      if (sidebarRes.data.success) {
        const flat = sidebarRes.data.data;
        const map = {};
        flat.forEach(item => { map[item._id] = { ...item, children: [] }; });
        const roots = [];
        flat.forEach(item => {
          if (item.parent && map[item.parent]) {
            map[item.parent].children.push(map[item._id]);
          } else {
            roots.push(map[item._id]);
          }
        });

        // Attach tasks as children to their respective lists
        if (tasksRes.data.success) {
          const tasks = tasksRes.data.data.filter(t => t.sidebarList && t.type !== 'note');
          tasks.forEach(task => {
            if (map[task.sidebarList]) {
              map[task.sidebarList].children.push({
                _id: task._id,
                name: task.title,
                type: 'task',
                status: task.status,
                board: boardId,
                sidebarList: task.sidebarList,
                children: [],
              });
            }
          });
        }

        setSidebarItems(prev => ({ ...prev, [boardId]: roots }));
        setRefreshKey(k => k + 1);
      }
    } catch (err) {
      console.error('Failed to load sidebar items:', err);
    }
  }, []);

  const toggleBoard = (boardId) => {
    const next = new Set(expandedBoards);
    if (next.has(boardId)) {
      next.delete(boardId);
    } else {
      next.add(boardId);
      loadSidebarItems(boardId); // Always reload when expanding
    }
    setExpandedBoards(next);
  };

  // Auto-expand current board
  useEffect(() => {
    if (currentBoardId && !expandedBoards.has(currentBoardId)) {
      toggleBoard(currentBoardId);
    }
  }, [currentBoardId]);

  const handleBoardRename = async (boardId) => {
    if (!boardRenameValue.trim()) { setRenamingBoardId(null); return; }
    try {
      await workspaceBoardsAPI.update(boardId, { name: boardRenameValue.trim() });
      setRenamingBoardId(null);
      loadBoards();
      window.dispatchEvent(new Event('boards-updated'));
    } catch (err) { console.error('Failed to rename board:', err); }
  };

  const handleBoardDelete = async (boardId) => {
    if (!window.confirm('Delete this board and all its tasks?')) return;
    try {
      await workspaceBoardsAPI.delete(boardId);
      loadBoards();
      window.dispatchEvent(new Event('boards-updated'));
      navigate(basePath + '/boards');
    } catch (err) { console.error('Failed to delete board:', err); }
  };

  const handleBoardPlusCreate = async (boardId, type) => {
    setBoardPlusMenu(null);
    const name = type === 'folder' ? 'New Folder' : 'New List';
    try {
      const createRes = await workspaceSidebarAPI.create(boardId, { name, type, parent: null });
      console.log('Created sidebar item:', createRes.data);
      // Ensure board is expanded
      setExpandedBoards(prev => new Set([...prev, boardId]));
      // Reload items
      const res = await workspaceSidebarAPI.getByBoard(boardId);
      if (res.data.success) {
        const flat = res.data.data;
        const map = {};
        flat.forEach(item => { map[item._id] = { ...item, children: [] }; });
        const roots = [];
        flat.forEach(item => {
          if (item.parent && map[item.parent]) {
            map[item.parent].children.push(map[item._id]);
          } else {
            roots.push(map[item._id]);
          }
        });
        setSidebarItems(prev => ({ ...prev, [boardId]: roots }));
        setRefreshKey(k => k + 1);
      }
    } catch (err) {
      console.error('Failed to create sidebar item:', err);
    }
  };

  const isActive = (path) => location.pathname === basePath + path || location.pathname === basePath + path + '/';

  const navItemStyle = (active) => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 16px', borderRadius: '8px', marginBottom: '2px',
    color: active ? '#ffffff' : '#a2a0a2',
    backgroundColor: active ? '#3a3b3d' : 'transparent',
    textDecoration: 'none', fontSize: '14px',
    fontWeight: active ? '500' : '400',
    transition: 'all 0.15s', cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, padding: '8px 12px', overflow: 'auto' }}>

        {/* WORK heading */}
        <div style={{ padding: '4px 16px 0 16px', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#6f6e6f', textTransform: 'uppercase', letterSpacing: '1px' }}>Work</span>
        </div>

        {/* My Tasks */}
        <NavLink to={basePath + (isSuperAdmin ? '/all-tasks' : '/my-tasks')} style={navItemStyle(isActive('/all-tasks') || isActive('/my-tasks'))}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>
          My tasks
        </NavLink>

        <div style={{ height: '1px', backgroundColor: '#333436', margin: '10px 4px' }} />

        {/* Work dropdown header */}
        <div
          onMouseEnter={(e) => { setWorkHovered(true); e.currentTarget.style.backgroundColor = '#2e2f31'; }}
          onMouseLeave={(e) => { setWorkHovered(false); e.currentTarget.style.backgroundColor = 'transparent'; }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}
          onClick={() => setWorkExpanded(!workExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#a2a0a2" style={{ transform: workExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
              <path d="M7 10l5 5 5-5z" />
            </svg>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#a2a0a2' }}>Work</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', position: 'relative' }}>
            {workHovered && (
              <div onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); setShowPlusMenu(false); }}
                style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f6e6f', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
              </div>
            )}
            <div onClick={(e) => { e.stopPropagation(); setShowPlusMenu(!showPlusMenu); setShowSortMenu(false); }}
              style={{ width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f6e6f', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
            </div>
            {showSortMenu && (
              <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '32px', right: '0', backgroundColor: '#353638', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '6px', minWidth: '200px', zIndex: 100, border: '1px solid #4a4b4d' }}>
                <div style={{ padding: '6px 10px', fontSize: '12px', color: '#6f6e6f', fontWeight: '500' }}>Sort projects</div>
                {['Alphabetical', 'Recent', 'Top'].map((opt) => (
                  <div key={opt} onClick={() => { setSortOrder(opt.toLowerCase()); setShowSortMenu(false); }}
                    style={{ padding: '8px 10px', fontSize: '13px', color: '#e5e7eb', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4b4d'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {sortOrder === opt.toLowerCase() ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#e5e7eb"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg> : <span style={{ width: '14px' }} />}
                    {opt}
                  </div>
                ))}
              </div>
            )}
            {showPlusMenu && (
              <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: '32px', right: '0', backgroundColor: '#353638', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', padding: '6px', minWidth: '180px', zIndex: 100, border: '1px solid #4a4b4d' }}>
                <MenuItem icon={<FolderIcon />} label="New project" desc="" onClick={() => { setShowPlusMenu(false); setShowCreateBoardModal(true); }} />
              </div>
            )}
          </div>
        </div>

        {/* Board list */}
        {workExpanded && (
          <div style={{ marginTop: '2px' }}>
            {loading ? <div style={{ padding: '8px 16px', color: '#6f6e6f', fontSize: '13px' }}>Loading...</div>
            : boards.length === 0 ? <div style={{ padding: '8px 16px', color: '#6f6e6f', fontSize: '13px' }}>No boards yet</div>
            : boards.filter(board => {
              // Super admin sees all boards
              if (isSuperAdmin || !accessStructure || accessStructure.type === 'all') return true;
              // Admin only sees boards they have access to or internal boards
              return board.visibility === 'internal' || accessStructure.structure?.some(s => s.boardId === board._id);
            }).slice(0, 10).map((board) => {
              const isCurrentBoard = location.pathname.includes(board._id);
              const isExpanded = expandedBoards.has(board._id);
              const items = sidebarItems[board._id] || [];
              // Get access level for this board (for admin permission control)
              const boardAccess = accessStructure?.structure?.find(s => s.boardId === board._id);
              const accessLevel = isSuperAdmin ? 'board' : (boardAccess?.level || 'board');
              // Can create folders/lists at board level?
              const canCreateAtBoard = isSuperAdmin || accessLevel === 'board';

              return (
                <div key={board._id}>
                  {/* Board row */}
                  <div
                    style={{ backgroundColor: isCurrentBoard ? '#3a3b3d' : 'transparent', borderRadius: '6px', marginBottom: '1px', transition: 'all 0.1s' }}
                    onMouseEnter={(e) => { setHoveredBoardId(board._id); if (!isCurrentBoard) e.currentTarget.style.backgroundColor = '#2e2f31'; }}
                    onMouseLeave={(e) => { setHoveredBoardId(null); if (!isCurrentBoard) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', color: isCurrentBoard ? '#ffffff' : '#a2a0a2', cursor: 'pointer', fontSize: '14px', fontWeight: isCurrentBoard ? '500' : '400', justifyContent: 'space-between' }}
                    >
                      {/* Left: expand arrow + color + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}
                        onClick={() => toggleBoard(board._id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isExpanded ? '#a2a0a2' : '#6f6e6f'}
                          style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                          <path d="M7 10l5 5 5-5z" />
                        </svg>
                        <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: board.color || '#7ec8e3', flexShrink: 0 }} />
                        {renamingBoardId === board._id ? (
                          <input
                            autoFocus
                            value={boardRenameValue}
                            onChange={(e) => setBoardRenameValue(e.target.value)}
                            onBlur={() => handleBoardRename(board._id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleBoardRename(board._id); if (e.key === 'Escape') setRenamingBoardId(null); }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: '14px', padding: '2px 4px', borderRadius: '3px', border: '1px solid #4a4b4d', backgroundColor: '#1e1f21', color: '#e5e7eb', outline: 'none', width: '100%' }}
                          />
                        ) : (
                          <span onClick={(e) => { e.stopPropagation(); navigate(`${basePath}/boards/${board._id}`); }}
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', cursor: 'pointer' }}
                          >
                            {board.name}
                          </span>
                        )}
                      </div>

                      {/* Right: dots + plus (only if board-level access) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, position: 'relative' }}>
                        {hoveredBoardId === board._id && canCreateAtBoard && (
                          <div onClick={(e) => {
                              e.stopPropagation();
                              if (boardDotsMenu === board._id) { setBoardDotsMenu(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setBoardDotsPos({ top: rect.top, left: rect.right + 8 });
                              setBoardDotsMenu(board._id);
                              setBoardPlusMenu(null);
                            }}
                            style={{ width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f6e6f', cursor: 'pointer' }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
                          </div>
                        )}
                        {/* Board dots dropdown */}
                        {boardDotsMenu === board._id && (
                          <div onClick={(e) => e.stopPropagation()}
                            style={{ position: 'fixed', top: boardDotsPos.top, left: boardDotsPos.left, backgroundColor: '#2a2b2d', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '4px', minWidth: '160px', zIndex: 9999, border: '1px solid #3a3b3d' }}
                          >
                            <div onClick={() => { setBoardDotsMenu(null); setRenamingBoardId(board._id); setBoardRenameValue(board.name); }}
                              style={{ padding: '8px 12px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
                              Rename
                            </div>
                            <div onClick={() => { setBoardDotsMenu(null); navigate(`${basePath}/boards/${board._id}?view=settings`); }}
                              style={{ padding: '8px 12px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58z" /></svg>
                              Settings
                            </div>
                            
                            <div style={{ position: 'relative' }}>
                              <div 
                                onClick={(e) => { e.stopPropagation(); setShowVisibilityPopup(board._id); }}
                                style={{ padding: '8px 12px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    {board.visibility === 'private' ? (
                                      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8.9 6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2H8.9V6zM18 20H6V10h12v10z"/>
                                    ) : board.visibility === 'shared' ? (
                                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                    ) : (
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    )}
                                  </svg>
                                  <span style={{ textTransform: 'capitalize' }}>{board.visibility}</span>
                                </div>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
                              </div>

                              {showVisibilityPopup === board._id && (
                                <div style={{ position: 'absolute', top: 0, left: '100%', marginLeft: '8px', backgroundColor: '#2a2b2d', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '4px', minWidth: '140px', zIndex: 10000, border: '1px solid #3a3b3d' }}>
                                  {['private', 'shared', 'internal'].filter(v => v !== board.visibility).map(v => (
                                    <div key={v} onClick={(e) => { e.stopPropagation(); updateBoardVisibility(board._id, v); }}
                                      style={{ padding: '8px 12px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', textTransform: 'capitalize' }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      {v}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {board.visibility !== 'private' && (
                              <div onClick={() => { setBoardDotsMenu(null); setSharingBoardId(board._id); }}
                                style={{ padding: '8px 12px', fontSize: '13px', color: '#e5e7eb', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>
                                Sharing & Permissions
                              </div>
                            )}
                            <div style={{ height: '1px', backgroundColor: '#333436', margin: '4px 0' }} />
                            <div onClick={() => { setBoardDotsMenu(null); handleBoardDelete(board._id); }}
                              style={{ padding: '8px 12px', fontSize: '13px', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3a1a1a'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                              Remove
                            </div>
                          </div>
                        )}
                        {canCreateAtBoard && (
                          <>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (boardPlusMenu === board._id) { setBoardPlusMenu(null); return; }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setBoardPlusPos({ top: rect.top, left: rect.right + 8 });
                                setBoardPlusMenu(board._id);
                              }}
                              style={{ width: '22px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f6e6f', cursor: 'pointer' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3a3b3d'; e.currentTarget.style.color = '#f1f1f1'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6f6e6f'; }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                            </div>
                            {boardPlusMenu === board._id && (
                              <div onClick={(e) => e.stopPropagation()}
                                style={{ position: 'fixed', top: boardPlusPos.top, left: boardPlusPos.left, backgroundColor: '#2a2b2d', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', padding: '4px', minWidth: '200px', zIndex: 9999, border: '1px solid #3a3b3d' }}
                              >
                                <div style={{ padding: '6px 10px 4px', fontSize: '11px', color: '#6f6e6f', fontWeight: '500' }}>Create</div>
                                <MenuItem icon={<FolderIcon />} label="Folder" desc="Group Lists, Docs & more" onClick={() => handleBoardPlusCreate(board._id, 'folder')} />
                                <MenuItem icon={<ListIcon />} label="List" desc="Track tasks, projects & more" onClick={() => handleBoardPlusCreate(board._id, 'list')} />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar tree items (folders/lists) under this board */}
                  {isExpanded && (
                    <>
                      {items.length > 0 ? items.map(item => (
                        <SidebarTreeItem
                          key={item._id}
                          item={item}
                          depth={2}
                          boardId={board._id}
                          basePath={basePath}
                          navigate={navigate}
                          onRefresh={() => loadSidebarItems(board._id)}
                          onCreateTask={(bId, listId) => { setCreateTaskBoardId(bId); setCreateTaskListId(listId); }}
                          isSuperAdmin={isSuperAdmin}
                          accessLevel={accessLevel}
                        />
                      )) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Info */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #333436', backgroundColor: '#252628' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '600' }}>
            {user?.initials || user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#f1f1f1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#6f6e6f' }}>{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateBoardModal && (
        <CreateBoardModal
          onClose={() => setShowCreateBoardModal(false)}
          onCreated={(newBoard) => {
            setShowCreateBoardModal(false);
            loadBoards();
            window.dispatchEvent(new Event('boards-updated'));
            navigate(`${basePath}/boards/${newBoard._id}`);
          }}
        />
      )}
      {createTaskBoardId && (
        <CreateTaskModal
          boardId={createTaskBoardId}
          sidebarList={createTaskListId}
          initialStatus="open"
          onClose={() => { setCreateTaskBoardId(null); setCreateTaskListId(null); }}
          onCreated={() => {
            const bId = createTaskBoardId;
            setCreateTaskBoardId(null);
            setCreateTaskListId(null);
            // Refresh sidebar to show the new task under its list
            if (bId) loadSidebarItems(bId);
          }}
        />
      )}
      {/* Board Sharing Modal */}
      {sharingBoardId && (
        <SharingModal
          itemName={boards.find(b => b._id === sharingBoardId)?.name || ''}
          itemType="Board"
          boardId={sharingBoardId}
          visibility={boards.find(b => b._id === sharingBoardId)?.visibility || 'private'}
          onVisibilityChange={(v) => {
            setBoards(boards.map(b => b._id === sharingBoardId ? { ...b, visibility: v } : b));
          }}
          onClose={() => setSharingBoardId(null)}
        />
      )}
    </div>
  );
};

export default HomeSidebar;
