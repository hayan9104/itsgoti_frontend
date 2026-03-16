import { useState } from 'react';

const iconOptions = [
  { value: 'design', label: 'Design (Pen)' },
  { value: 'development', label: 'Development (Code)' },
  { value: 'support', label: 'Support (Chat)' },
  { value: 'apps', label: 'Third-Party Apps' },
  { value: 'copywriting', label: 'Copywriting (Document)' },
];

const ServicesArrayEditor = ({ field, value = [], onChange }) => {
  const services = Array.isArray(value) ? value : [];
  const maxItems = field.maxItems || 6;
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const handleAdd = () => {
    if (services.length >= maxItems) return;
    const newServices = [...services, { icon: 'design', text: '', iconImage: '' }];
    onChange(newServices);
  };

  const handleRemove = (index) => {
    const newServices = services.filter((_, i) => i !== index);
    onChange(newServices);
  };

  const handleChange = (index, key, newValue) => {
    const newServices = services.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: newValue };
      }
      return item;
    });
    onChange(newServices);
  };

  const handleImageUpload = async (index, file) => {
    if (!file) return;

    setUploadingIndex(index);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        handleChange(index, 'iconImage', data.url || data.imageUrl);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = (index) => {
    handleChange(index, 'iconImage', '');
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
          {services.length}/{maxItems}
        </span>
      </div>

      {/* Services List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
        {services.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {/* Icon Selection or Upload */}
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '4px',
                }}>
                  Icon Type
                </label>
                {item.iconImage ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <img
                      src={item.iconImage}
                      alt="Icon"
                      style={{
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <select
                    value={item.icon || 'design'}
                    onChange={(e) => handleChange(index, 'icon', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#fff',
                    }}
                  >
                    {iconOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Custom Icon Upload */}
              {!item.iconImage && (
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#6b7280',
                    marginBottom: '4px',
                  }}>
                    Or Upload Custom Icon
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    border: '1px dashed #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: '#fff',
                    fontSize: '12px',
                    color: '#6b7280',
                  }}>
                    {uploadingIndex === index ? 'Uploading...' : 'Choose File'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(index)}
                style={{
                  alignSelf: 'flex-end',
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                title="Remove"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Text Label */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '4px',
              }}>
                Label Text
              </label>
              <input
                type="text"
                value={item.text || ''}
                onChange={(e) => handleChange(index, 'text', e.target.value)}
                placeholder="e.g., Design"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      {services.length < maxItems && (
        <button
          onClick={handleAdd}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px dashed #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#f9fafb',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Service
        </button>
      )}

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

export default ServicesArrayEditor;
