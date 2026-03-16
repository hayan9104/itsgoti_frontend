const PainPointsArrayEditor = ({ field, value = [], onChange }) => {
  const painPoints = Array.isArray(value) ? value : [];
  const maxItems = field.maxItems || 8;

  const handleAdd = () => {
    if (painPoints.length >= maxItems) return;
    const newPainPoints = [...painPoints, { highlight: '', text: '' }];
    onChange(newPainPoints);
  };

  const handleRemove = (index) => {
    const newPainPoints = painPoints.filter((_, i) => i !== index);
    onChange(newPainPoints);
  };

  const handleChange = (index, key, newValue) => {
    const newPainPoints = painPoints.map((item, i) => {
      if (i === index) {
        return { ...item, [key]: newValue };
      }
      return item;
    });
    onChange(newPainPoints);
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
          {painPoints.length}/{maxItems}
        </span>
      </div>

      {/* Pain Points List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
        {painPoints.map((item, index) => (
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
                Highlighted Text
              </label>
              <input
                type="text"
                value={item.highlight || ''}
                onChange={(e) => handleChange(index, 'highlight', e.target.value)}
                placeholder="e.g., 20K INR"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#FEF3C7',
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
                Description
              </label>
              <input
                type="text"
                value={item.text || ''}
                onChange={(e) => handleChange(index, 'text', e.target.value)}
                placeholder="e.g., trying to customize a Shopify theme"
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
      {painPoints.length < maxItems && (
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
          Add Pain Point
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

export default PainPointsArrayEditor;
