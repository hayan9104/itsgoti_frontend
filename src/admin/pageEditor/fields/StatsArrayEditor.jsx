const StatsArrayEditor = ({ field, value = [], onChange }) => {
  const stats = Array.isArray(value) ? value : [];
  const maxItems = field.maxItems || 5;

  const handleAdd = () => {
    if (stats.length >= maxItems) return;
    const newStats = [...stats, { value: '', label: '' }];
    onChange(newStats);
  };

  const handleRemove = (index) => {
    const newStats = stats.filter((_, i) => i !== index);
    onChange(newStats);
  };

  const handleChange = (index, key, newValue) => {
    const newStats = stats.map((stat, i) => {
      if (i === index) {
        return { ...stat, [key]: newValue };
      }
      return stat;
    });
    onChange(newStats);
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
          {stats.length}/{maxItems}
        </span>
      </div>

      {/* Stats List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '4px',
              }}>
                Value
              </label>
              <input
                type="text"
                value={stat.value || ''}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                placeholder="e.g., 100+"
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
            <div style={{ flex: 2 }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '4px',
              }}>
                Label
              </label>
              <input
                type="text"
                value={stat.label || ''}
                onChange={(e) => handleChange(index, 'label', e.target.value)}
                placeholder="e.g., Projects Delivered"
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
        ))}
      </div>

      {/* Add Button */}
      {stats.length < maxItems && (
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
          Add Statistic
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

export default StatsArrayEditor;
