import { useState } from 'react';
import { workspaceBoardsAPI } from '../../services/api';

const COLORS = [
  '#6f6e6f', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#ca8a04', '#16a34a', '#0d9488',
  '#0284c7', '#6366f1', '#8b5cf6', '#64748b',
];

const CreateBoardModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [visibility, setVisibility] = useState('private');
  const [showVisibilityPopup, setShowVisibilityPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Board name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await workspaceBoardsAPI.create({
        name: name.trim(),
        description: description.trim(),
        color,
        visibility,
      });

      if (response.data.success) {
        onCreated(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#2a2b2d',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #333436',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#f1f1f1' }}>
            Create New Board
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: '#6b7280',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#dc2626',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e7eb',
                marginBottom: '8px',
              }}
            >
              Board Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Redesign"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #424244',
                borderRadius: '8px',
                outline: 'none',
                boxSizing: 'border-box',
                backgroundColor: '#1e1f21',
                color: '#e5e7eb',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6f6e6f')}
              onBlur={(e) => (e.target.style.borderColor = '#424244')}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e7eb',
                marginBottom: '8px',
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this board about?"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid #424244',
                borderRadius: '8px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                backgroundColor: '#1e1f21',
                color: '#e5e7eb',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6f6e6f')}
              onBlur={(e) => (e.target.style.borderColor = '#424244')}
            />
          </div>

          {/* Color */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e7eb',
                marginBottom: '8px',
              }}
            >
              Board Color
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: c,
                    border: color === c ? '3px solid #111827' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#e5e7eb',
                marginBottom: '8px',
              }}
            >
              Visibility
            </label>
            
            <button
              type="button"
              onClick={() => setShowVisibilityPopup(!showVisibilityPopup)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#1e1f21',
                border: '1px solid #424244',
                borderRadius: '8px',
                color: '#f1f1f1',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2b2d';
                e.currentTarget.style.borderColor = '#6f6e6f';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e1f21';
                e.currentTarget.style.borderColor = '#424244';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{visibility}</span>
                <span style={{ color: '#6f6e6f' }}>Sharing & Permissions</span>
              </span>
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                style={{ 
                  color: '#6f6e6f',
                  transform: showVisibilityPopup ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </button>

            {/* Visibility Popup */}
            {showVisibilityPopup && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  right: '0',
                  marginTop: '4px',
                  backgroundColor: '#2a2b2d',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  padding: '4px',
                  zIndex: 100,
                  border: '1px solid #3a3b3d',
                }}
              >
                {['private', 'shared', 'internal']
                  .filter((v) => v !== visibility)
                  .map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setVisibility(v);
                        setShowVisibilityPopup(false);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        fontSize: '13px',
                        color: '#e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textTransform: 'capitalize',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#353638')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ fontWeight: '500' }}>{v}</span>
                      <span style={{ fontSize: '11px', color: '#6f6e6f' }}>
                        {v === 'private' && 'Only you can see this board'}
                        {v === 'shared' && 'Board visible to assigned members'}
                        {v === 'internal' && 'Visible to all workspace users'}
                      </span>
                    </button>
                  ))}
              </div>
            )}
            
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px' }}>
              {visibility === 'private' && 'Only you can see this board'}
              {visibility === 'shared' && 'Board visible to assigned members'}
              {visibility === 'internal' && 'Visible to all workspace users'}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #424244',
                backgroundColor: '#2a2b2d',
                color: '#e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading ? '#93c5fd' : '#6f6e6f',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {loading ? 'Creating...' : 'Create Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBoardModal;
