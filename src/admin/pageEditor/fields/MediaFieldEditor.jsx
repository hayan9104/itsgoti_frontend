import { useState, useRef } from 'react';
import { uploadAPI } from '../../../services/api';

const MediaFieldEditor = ({ field, value, onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // Determine if current value is a video
  const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };

  const currentIsVideo = isVideo(value);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setShowMenu(false);
    try {
      const formData = new FormData();
      // Use 'file' as key for both images and videos
      formData.append('image', file);
      const response = await uploadAPI.single(formData);
      // Handle both response formats: response.data.path or response.data.data.path
      const mediaPath = response.data.path || response.data.data?.path;
      if (mediaPath) {
        onChange(mediaPath);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Error uploading media. Please try again.');
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
        /* Media exists - show preview with 3-dot menu */
        <div style={{
          position: 'relative',
          display: 'inline-block',
        }}>
          <div style={{
            width: '180px',
            height: '120px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #e5e7eb',
            position: 'relative',
            backgroundColor: '#000',
          }}>
            {currentIsVideo ? (
              /* Video preview */
              <video
                src={value}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                muted
                playsInline
                onMouseEnter={(e) => e.target.play()}
                onMouseLeave={(e) => {
                  e.target.pause();
                  e.target.currentTime = 0;
                }}
              />
            ) : (
              /* Image preview */
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
            )}

            {/* Media type badge */}
            <span style={{
              position: 'absolute',
              bottom: '6px',
              left: '6px',
              backgroundColor: currentIsVideo ? '#7c3aed' : '#2563eb',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}>
              {currentIsVideo ? 'Video' : 'Image'}
            </span>

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
                minWidth: '180px',
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
                Change media
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
        /* No media - show upload button */
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            backgroundColor: '#fff',
            border: '1px dashed #d1d5db',
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Select image or video
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/webm,video/ogg"
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

      <p style={{
        fontSize: '11px',
        color: '#6b7280',
        marginTop: '4px',
        marginBottom: 0,
      }}>
        Supported: JPG, PNG, GIF, MP4, WebM
      </p>
    </div>
  );
};

export default MediaFieldEditor;
