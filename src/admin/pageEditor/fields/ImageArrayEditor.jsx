import { useState, useRef } from 'react';
import { uploadAPI } from '../../../services/api';

// Get the base URL for images
const getImageUrl = (item) => {
  if (!item) return '';

  // Extract path from different structures
  let path = '';
  if (typeof item === 'string') {
    path = item;
  } else if (typeof item === 'object') {
    path = item.image || item.url || item.path || '';
  }

  if (!path) return '';
  if (path.startsWith('http')) return path;

  // Add server base URL for relative paths
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

// Check if array contains objects (vs simple strings)
const isObjectArray = (arr) => {
  return arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null;
};

const ImageArrayEditor = ({ field, value = [], onChange }) => {
  const [uploading, setUploading] = useState(false);
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [replaceIndex, setReplaceIndex] = useState(null);

  const images = Array.isArray(value) ? value : [];
  const maxItems = field.maxItems || 10;
  // Use object format if explicitly set in field config OR if existing data is objects
  const useObjects = field.useObjectFormat || isObjectArray(images);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.single(formData);
      const imagePath = response.data.path || response.data.data?.path;

      if (imagePath) {
        let newImages;
        if (useObjects) {
          // For object arrays, add new object with image property
          const newId = images.length > 0 ? Math.max(...images.map(i => i.id || 0)) + 1 : 1;
          newImages = [...images, { id: newId, image: imagePath }];
        } else {
          // For string arrays, just add the path
          newImages = [...images, imagePath];
        }
        onChange(newImages);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReplace = async (e) => {
    const file = e.target.files[0];
    if (!file || replaceIndex === null) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.single(formData);
      const imagePath = response.data.path || response.data.data?.path;

      if (imagePath) {
        const newImages = [...images];
        if (useObjects) {
          // For object arrays, update the image property
          newImages[replaceIndex] = { ...newImages[replaceIndex], image: imagePath };
        } else {
          // For string arrays, replace the path
          newImages[replaceIndex] = imagePath;
        }
        onChange(newImages);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(false);
      setReplaceIndex(null);
      setActiveMenuIndex(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    setActiveMenuIndex(null);
  };

  const handleSelectFromLibrary = (index) => {
    setReplaceIndex(index);
    setActiveMenuIndex(null);
    replaceInputRef.current?.click();
  };

  const handleReorder = (index, direction) => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onChange(newImages);
  };

  // Get display name for an item (for objects with name property)
  const getItemName = (item, index) => {
    if (typeof item === 'object' && item.name) {
      return item.name;
    }
    return `${field.label} ${index + 1}`;
  };

  // Check if item has an image
  const hasImage = (item) => {
    if (typeof item === 'string') return !!item;
    if (typeof item === 'object') return !!(item.image || item.url || item.path);
    return false;
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <label style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#374151',
        }}>
          {field.label}
        </label>
        <span style={{
          fontSize: '12px',
          color: '#9ca3af',
        }}>
          {images.length}/{maxItems}
        </span>
      </div>

      {/* Image Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {images.map((img, index) => (
          <div
            key={typeof img === 'object' ? (img.id || index) : index}
            style={{
              position: 'relative',
              paddingBottom: '100%',
              borderRadius: '6px',
              overflow: 'visible',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Image */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '6px',
              overflow: 'hidden',
              backgroundColor: '#f3f4f6',
            }}>
              {hasImage(img) ? (
                <img
                  src={getImageUrl(img)}
                  alt={getItemName(img, index)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                  }}
                />
              ) : null}
              <div style={{
                width: '100%',
                height: '100%',
                display: hasImage(img) ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '11px',
                textAlign: 'center',
                padding: '4px',
              }}>
                {typeof img === 'object' && img.name ? img.name : 'No image'}
              </div>

              {/* Hover overlay with "Change" */}
              <div
                onClick={() => handleSelectFromLibrary(index)}
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
                  fontSize: '11px',
                  fontWeight: 500,
                }}>
                  Change
                </span>
              </div>
            </div>

            {/* 3-dot menu button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuIndex(activeMenuIndex === index ? null : index);
              }}
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '22px',
                height: '22px',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                zIndex: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#374151">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </button>

            {/* Dropdown menu */}
            {activeMenuIndex === index && (
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  // Open on right for first column items, left for others
                  ...(index % 3 === 0 ? { left: '28px' } : { right: '28px' }),
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  zIndex: 100,
                  minWidth: '150px',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => handleSelectFromLibrary(index)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#374151',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  Select from library
                </button>
                <button
                  onClick={() => handleRemove(index)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: '#dc2626',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Remove
                </button>
              </div>
            )}

            {/* Reorder controls at bottom */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '2px',
              opacity: 0,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
            >
              {index > 0 && (
                <button
                  onClick={() => handleReorder(index, 'up')}
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                  title="Move left"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  onClick={() => handleReorder(index, 'down')}
                  style={{
                    width: '22px',
                    height: '22px',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                  title="Move right"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      {images.length < maxItems && (
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
              Add image
            </>
          )}
        </button>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplace}
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

export default ImageArrayEditor;
