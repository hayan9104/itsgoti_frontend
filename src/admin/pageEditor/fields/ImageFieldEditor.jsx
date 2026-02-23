import { useState, useRef } from 'react';
import { uploadAPI } from '../../../services/api';

const ImageFieldEditor = ({ field, value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setShowMenu(false);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.single(formData);
      // Handle both response formats: response.data.path or response.data.data.path
      const imagePath = response.data.path || response.data.data?.path;
      if (imagePath) {
        onChange(imagePath);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setShowMenu(false);
  };

  const handleSelectFromLibrary = () => {
    fileInputRef.current?.click();
    setShowMenu(false);
  };

  // Close menu when clicking outside
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenu(false);
    }
  };

  useState(() => {
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '13px',
        fontWeight: 500,
        color: '#374151',
        marginBottom: '6px',
      }}>
        {field.label}
      </label>

      {value ? (
        /* Image exists - show with 3-dot menu */
        <div style={{
          position: 'relative',
          display: 'inline-block',
        }}>
          <div style={{
            width: '140px',
            height: '90px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            position: 'relative',
          }}>
            <img
              src={value}
              alt={field.label}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.style.backgroundColor = '#f3f4f6';
              }}
            />
            {/* Hover overlay with "Change" */}
            <div
              onClick={handleSelectFromLibrary}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
              <span style={{
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                Change
              </span>
            </div>
            {/* 3-dot menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '24px',
                height: '24px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#374151">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>
          </div>

          {/* Dropdown menu */}
          {showMenu && (
            <div
              ref={menuRef}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                zIndex: 100,
                minWidth: '160px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={handleSelectFromLibrary}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#374151',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Select from library
              </button>
              <button
                onClick={handleRemove}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#dc2626',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        /* No image - show upload button */
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#374151',
          }}
        >
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Select image
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      {field.hint && (
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '6px',
          marginBottom: 0,
        }}>
          {field.hint}
        </p>
      )}
    </div>
  );
};

export default ImageFieldEditor;
