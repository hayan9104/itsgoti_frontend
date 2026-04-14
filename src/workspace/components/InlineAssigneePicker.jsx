import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceUsersAPI, workspaceTasksAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';

const InlineAssigneePicker = ({ task, onUpdate }) => {
  const { isSuperAdmin } = useWorkspaceAuth();
  const navigate = useNavigate();
  const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';

  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && users.length === 0) {
      workspaceUsersAPI.getAll().then(res => {
        if (res.data.success) setUsers(res.data.data);
      }).catch(() => {});
    }
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open && !showProfile) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowProfile(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, showProfile]);

  const handleAssign = async (userId) => {
    try {
      const res = await workspaceTasksAPI.update(task._id, { assignee: userId });
      if (res.data.success) onUpdate(res.data.data);
    } catch (err) { console.error(err); }
    setOpen(false);
    setSearch('');
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    try {
      const res = await workspaceTasksAPI.update(task._id, { assignee: null });
      if (res.data.success) onUpdate(res.data.data);
    } catch (err) { console.error(err); }
    setShowProfile(false);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Assigned state ───
  if (task.assignee) {
    return (
      <div ref={ref} style={{ position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!showProfile) setHovered(false); }}
      >
        <div
          onClick={(e) => { e.stopPropagation(); setShowProfile(!showProfile); }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '2px 0' }}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '10px', fontWeight: '600', flexShrink: 0,
          }}>
            {task.assignee.name?.substring(0, 2).toUpperCase()}
          </div>
          <span style={{ fontSize: '13px', color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
            {task.assignee.name?.split(' ')[0]}
          </span>
          {hovered && (
            <div onClick={handleRemove}
              style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3a3b3d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3b3d'}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
            </div>
          )}
        </div>

        {/* Profile popup */}
        {showProfile && (
          <div onClick={(e) => e.stopPropagation()} style={{
            position: 'absolute', top: '100%', left: '0', marginTop: '4px',
            backgroundColor: '#2a2b2d', borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)', padding: '16px',
            minWidth: '220px', zIndex: 9999, border: '1px solid #3a3b3d',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '14px', fontWeight: '600',
              }}>
                {task.assignee.name?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#f1f1f1' }}>{task.assignee.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6f6e6f' }}>{task.assignee.email}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowProfile(false); navigate(`${basePath}/admins`); }}
                style={{ flex: 1, padding: '7px 0', fontSize: '12px', fontWeight: '500', color: '#e5e7eb', backgroundColor: '#353638', border: '1px solid #4a4b4d', borderRadius: '6px', cursor: 'pointer' }}
              >Edit profile</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Unassigned state ───
  return (
    <div ref={ref} style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!open) setHovered(false); }}
    >
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Unassigned icon */}
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            border: '2px dashed #4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#6f6e6f">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          {/* Plus on hover */}
          {hovered && (
            <div onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              style={{
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: '#3a3b3d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4b4d'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3b3d'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#e5e7eb"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
            </div>
          )}
        </div>
      ) : (
        /* Search dropdown — opens below, fixed position */
        <div onClick={(e) => e.stopPropagation()} style={{
          position: 'fixed', top: ref.current?.getBoundingClientRect().bottom + 4 || 0, left: ref.current?.getBoundingClientRect().left || 0,
          backgroundColor: '#2a2b2d', borderRadius: '8px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          minWidth: '230px', zIndex: 99999, border: '1px solid #3a3b3d',
          overflow: 'hidden',
        }}>
          {/* Search input */}
          <div style={{ padding: '8px', borderBottom: '1px solid #333436' }}>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or email"
              style={{
                width: '100%', padding: '8px 10px', fontSize: '13px',
                border: '1px solid #4a4b4d', borderRadius: '6px',
                backgroundColor: '#1e1f21', color: '#e5e7eb', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {/* User list */}
          <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px' }}
            className="hide-scrollbar"
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '12px', color: '#6f6e6f', textAlign: 'center' }}>No members found</div>
            ) : (
              filtered.map(u => (
                <div key={u._id} onClick={() => handleAssign(u._id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#353638'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: '#4a4b4d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '10px', fontWeight: '600', flexShrink: 0,
                  }}>
                    {u.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: '500' }}>{u.name}</div>
                    <div style={{ fontSize: '11px', color: '#6f6e6f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineAssigneePicker;
