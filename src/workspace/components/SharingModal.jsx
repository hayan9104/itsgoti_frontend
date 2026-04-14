import { useState, useEffect } from 'react';
import { workspaceUsersAPI, workspaceBoardsAPI, workspaceSidebarAPI } from '../../services/api';

const SharingModal = ({ itemName, itemType, boardId, sidebarItemId, visibility: initVisibility, onVisibilityChange, onClose }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [sharedMembers, setSharedMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersRes = await workspaceUsersAPI.getAll();
      if (usersRes.data.success) setAllUsers(usersRes.data.data);

      if (sidebarItemId) {
        // Load sharing info for folder/list
        const sharingRes = await workspaceSidebarAPI.getSharingInfo(sidebarItemId);
        if (sharingRes.data.success) {
          setSharedMembers(sharingRes.data.data.sharedWith || []);
        }
      } else if (boardId) {
        // Load board members
        const boardRes = await workspaceBoardsAPI.getOne(boardId);
        if (boardRes.data.success) {
          const board = boardRes.data.data;
          const memberUsers = (board.members || []).map(m => m.user || m);
          setSharedMembers(memberUsers);
        }
      }
    } catch (err) {
      console.error('Failed to load sharing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      if (sidebarItemId) {
        const res = await workspaceSidebarAPI.addMember(sidebarItemId, userId);
        if (res.data.success) {
          setSharedMembers(res.data.data.sharedWith || []);
        }
      } else if (boardId) {
        await workspaceBoardsAPI.addMember(boardId, { userId, role: 'editor' });
        loadData();
      }
    } catch (err) { console.error('Failed to add member:', err); }
    setSearch('');
  };

  const handleRemoveMember = async (userId) => {
    try {
      if (sidebarItemId) {
        const res = await workspaceSidebarAPI.removeMember(sidebarItemId, userId);
        if (res.data.success) {
          setSharedMembers(res.data.data.sharedWith || []);
        }
      } else if (boardId) {
        await workspaceBoardsAPI.removeMember(boardId, userId);
        loadData();
      }
    } catch (err) { console.error('Failed to remove member:', err); }
  };

  const sharedIds = sharedMembers.map(m => m._id || m);
  const isMemberShared = (userId) => sharedIds.includes(userId);

  const filtered = allUsers.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="workspace-dark"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '440px', backgroundColor: '#2a2b2d', borderRadius: '12px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333436' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#f1f1f1' }}>Share this {itemType}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6f6e6f' }}>
              {itemName} · Shared with {sharedMembers.length} member{sharedMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6f6e6f', cursor: 'pointer', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>

        {/* Search to add members */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #333436' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Invite by name or email"
            style={{ width: '100%', padding: '10px 14px', fontSize: '13px', border: '1px solid #424244', borderRadius: '8px', backgroundColor: '#1e1f21', color: '#e5e7eb', outline: 'none', boxSizing: 'border-box' }}
          />
          {/* All members list (always visible, filtered by search) */}
          <div style={{ marginTop: '8px', maxHeight: '160px', overflowY: 'auto', borderRadius: '6px', border: '1px solid #333436', backgroundColor: '#1e1f21' }} className="hide-scrollbar">
            {filtered.filter(u => !isMemberShared(u._id)).length === 0 ? (
              <div style={{ padding: '10px', fontSize: '12px', color: '#6f6e6f', textAlign: 'center' }}>No members to add</div>
            ) : (
              filtered.filter(u => !isMemberShared(u._id)).map(u => (
                <div key={u._id} onClick={() => handleAddMember(u._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', cursor: 'pointer', fontSize: '13px', color: '#e5e7eb' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2b2d'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '600', flexShrink: 0 }}>
                    {u.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: '#6f6e6f' }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#4ade80', padding: '2px 8px', backgroundColor: '#1a2e1a', borderRadius: '4px' }}>+ Add</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shared members list */}
        <div style={{ padding: '12px 24px' }}>
          <p style={{ fontSize: '12px', color: '#6f6e6f', marginBottom: '8px' }}>
            Shared with ({sharedMembers.length})
          </p>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="hide-scrollbar">
            {loading ? (
              <p style={{ color: '#6f6e6f', fontSize: '13px' }}>Loading...</p>
            ) : sharedMembers.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: '#6f6e6f', fontSize: '13px' }}>
                No members shared yet. Search above to add.
              </div>
            ) : (
              sharedMembers.map(member => {
                const u = typeof member === 'object' ? member : allUsers.find(u => u._id === member);
                if (!u) return null;
                return (
                  <div key={u._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 0', borderBottom: '1px solid #2a2b2d',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>
                        {u.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: '500' }}>{u.name}</div>
                        <div style={{ fontSize: '11px', color: '#6f6e6f' }}>{u.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(u._id)}
                      style={{ background: 'none', border: 'none', color: '#6f6e6f', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#3a1a1a'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#6f6e6f'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharingModal;
