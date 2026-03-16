import { useState } from 'react';

const FeaturesGroupArrayEditor = ({ field, value = [], onChange, rotationSpeed, onRotationSpeedChange }) => {
  const groups = Array.isArray(value) ? value : [];
  const maxGroups = field.maxGroups || 10;
  const [expandedGroup, setExpandedGroup] = useState(null);

  const handleAddGroup = () => {
    if (groups.length >= maxGroups) return;
    const newGroups = [...groups, {
      title: `GROUP ${groups.length + 1}:`,
      points: ['Point 1', 'Point 2', 'Point 3', 'Point 4'],
      highlightPoint: 'Highlight point (bold)',
    }];
    onChange(newGroups);
  };

  const handleRemoveGroup = (index) => {
    const newGroups = groups.filter((_, i) => i !== index);
    onChange(newGroups);
    if (expandedGroup === index) setExpandedGroup(null);
  };

  const handleGroupChange = (index, key, newValue) => {
    const newGroups = groups.map((group, i) => {
      if (i === index) {
        return { ...group, [key]: newValue };
      }
      return group;
    });
    onChange(newGroups);
  };

  const handlePointChange = (groupIndex, pointIndex, newValue) => {
    const newGroups = groups.map((group, i) => {
      if (i === groupIndex) {
        const newPoints = [...(group.points || [])];
        newPoints[pointIndex] = newValue;
        return { ...group, points: newPoints };
      }
      return group;
    });
    onChange(newGroups);
  };

  const handleAddPoint = (groupIndex) => {
    const newGroups = groups.map((group, i) => {
      if (i === groupIndex) {
        const points = group.points || [];
        if (points.length >= 6) return group;
        return { ...group, points: [...points, 'New point'] };
      }
      return group;
    });
    onChange(newGroups);
  };

  const handleRemovePoint = (groupIndex, pointIndex) => {
    const newGroups = groups.map((group, i) => {
      if (i === groupIndex) {
        const newPoints = (group.points || []).filter((_, pi) => pi !== pointIndex);
        return { ...group, points: newPoints };
      }
      return group;
    });
    onChange(newGroups);
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
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
          {groups.length}/{maxGroups} groups
        </span>
      </div>

      {/* Rotation Speed Slider */}
      <div style={{
        padding: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #bfdbfe',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <label style={{
            fontSize: '12px',
            fontWeight: 500,
            color: '#1e40af',
          }}>
            Auto-rotation Speed
          </label>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#1e40af',
          }}>
            {rotationSpeed || 3}s
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={rotationSpeed || 3}
          onChange={(e) => onRotationSpeedChange(parseInt(e.target.value))}
          style={{
            width: '100%',
            cursor: 'pointer',
            accentColor: '#2563eb',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#6b7280',
          marginTop: '4px',
        }}>
          <span>1s (Fast)</span>
          <span>10s (Slow)</span>
        </div>
      </div>

      {/* Groups List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>
        {groups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            {/* Group Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: expandedGroup === groupIndex ? '12px' : '0',
            }}>
              <button
                onClick={() => setExpandedGroup(expandedGroup === groupIndex ? null : groupIndex)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                }}
              >
                <span style={{
                  transform: expandedGroup === groupIndex ? 'rotate(90deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }}>
                  ▶
                </span>
                {group.title || `Group ${groupIndex + 1}`}
              </button>
              <button
                onClick={() => handleRemoveGroup(groupIndex)}
                style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Expanded Content */}
            {expandedGroup === groupIndex && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Title */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Group Title
                  </label>
                  <input
                    type="text"
                    value={group.title || ''}
                    onChange={(e) => handleGroupChange(groupIndex, 'title', e.target.value)}
                    placeholder="e.g., DESIGN:"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Points */}
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}>
                    <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280' }}>
                      Points (Regular)
                    </label>
                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                      {(group.points || []).length}/6
                    </span>
                  </div>
                  {(group.points || []).map((point, pointIndex) => (
                    <div key={pointIndex} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => handlePointChange(groupIndex, pointIndex, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          fontSize: '13px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => handleRemovePoint(groupIndex, pointIndex)}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(group.points || []).length < 6 && (
                    <button
                      onClick={() => handleAddPoint(groupIndex)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        border: '1px dashed #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: '#6b7280',
                      }}
                    >
                      + Add Point
                    </button>
                  )}
                </div>

                {/* Highlight Point */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Highlight Point (Bold, Last)
                  </label>
                  <input
                    type="text"
                    value={group.highlightPoint || ''}
                    onChange={(e) => handleGroupChange(groupIndex, 'highlightPoint', e.target.value)}
                    placeholder="e.g., Money Saved: 20K INR + Time Saved: 20Hrs"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '14px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Group Button */}
      {groups.length < maxGroups && (
        <button
          onClick={handleAddGroup}
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
          Add Feature Group
        </button>
      )}

      {field.hint && (
        <p style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '8px',
          marginBottom: 0,
        }}>
          {field.hint}
        </p>
      )}
    </div>
  );
};

export default FeaturesGroupArrayEditor;
