import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workspaceBoardsAPI } from '../../services/api';
import { useWorkspaceAuth } from '../../context/WorkspaceAuthContext';
import CreateBoardModal from '../components/CreateBoardModal';

const BoardsList = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isSuperAdmin } = useWorkspaceAuth();
  const navigate = useNavigate();

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

  const handleBoardCreated = (newBoard) => {
    setBoards([newBoard, ...boards]);
    setShowCreateModal(false);
    window.dispatchEvent(new Event('boards-updated'));
  };

  const handleDeleteBoard = async (boardId) => {
    if (!confirm('Are you sure you want to delete this board? All tasks will be deleted.')) {
      return;
    }

    try {
      await workspaceBoardsAPI.delete(boardId);
      setBoards(boards.filter((b) => b._id !== boardId));
      window.dispatchEvent(new Event('boards-updated'));
    } catch (error) {
      console.error('Failed to delete board:', error);
      alert('Failed to delete board');
    }
  };

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const basePath = isSuperAdmin ? '/workspace/super-admin' : '/workspace/admin';

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f1f1', margin: 0 }}>
            {isSuperAdmin ? 'All Boards' : 'My Boards'}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {boards.length} board{boards.length !== 1 ? 's' : ''}
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
              backgroundColor: '#6f6e6f',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#5a5a5a')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#6f6e6f')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Create Board
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="#9ca3af"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 44px',
              fontSize: '14px',
              border: '1px solid #424244',
              borderRadius: '8px',
              backgroundColor: '#2a2b2d',
              color: '#e5e7eb',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Boards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>Loading...</div>
      ) : filteredBoards.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px',
            backgroundColor: '#2a2b2d',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="#424244"
            style={{ marginBottom: '16px' }}
          >
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <h3 style={{ color: '#e5e7eb', fontSize: '18px', marginBottom: '8px' }}>
            No boards yet
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            Create your first board to start managing tasks
          </p>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6f6e6f',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Create Board
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            backgroundColor: '#2a2b2d',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          {filteredBoards.map((board, index) => (
            <div
              key={board._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                cursor: 'pointer',
                borderBottom: index < filteredBoards.length - 1 ? '1px solid #2a2b2d' : 'none',
                transition: 'background-color 0.2s',
              }}
              onClick={() => navigate(`${basePath}/boards/${board._id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#353638';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Color dot indicator */}
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: board.color || '#6f6e6f',
                  marginRight: '16px',
                  flexShrink: 0,
                }}
              />

              {/* Board info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#f1f1f1',
                    margin: 0,
                    marginBottom: '4px',
                  }}
                >
                  {board.name}
                </h3>
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '13px',
                    margin: 0,
                  }}
                >
                  {board.taskCount || 0} task{(board.taskCount || 0) !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Visibility badge */}
              <span
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: '#353638',
                  color: '#a2a0a2',
                  marginRight: '16px',
                  flexShrink: 0,
                }}
              >
                {board.visibility}
              </span>

              {/* Owner */}
              {board.owner && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginRight: '16px',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#4a4b4d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {board.owner.initials || board.owner.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ color: '#a2a0a2', fontSize: '13px' }}>{board.owner.name}</span>
                </div>
              )}

              {/* Delete button */}
              {isSuperAdmin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBoard(board._id);
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.backgroundColor = '#3a1a1a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#9ca3af';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Board Modal */}
      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBoardCreated}
        />
      )}
    </div>
  );
};

export default BoardsList;
