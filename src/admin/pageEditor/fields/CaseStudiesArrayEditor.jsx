import { useState, useRef } from 'react';
import { uploadAPI } from '../../../services/api';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

const CaseStudiesArrayEditor = ({ field, value = [], onChange }) => {
  const [uploading, setUploading] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const fileInputRefs = useRef({});

  const caseStudies = Array.isArray(value) ? value : [];
  const maxItems = field.maxItems || 5;

  const createEmptyCaseStudy = () => ({
    id: Date.now(),
    label: '',
    brand: '',
    title: '',
    description: '',
    image: '',
    metric1Label: '',
    metric1Value: '',
    metric2Label: '',
    metric2Value: '',
    metric3Label: '',
    metric3Value: '',
  });

  const handleAdd = () => {
    if (caseStudies.length >= maxItems) return;
    const newCaseStudy = createEmptyCaseStudy();
    const newCaseStudies = [...caseStudies, newCaseStudy];
    onChange(newCaseStudies);
    setExpandedIndex(newCaseStudies.length - 1);
  };

  const handleRemove = (index) => {
    const newCaseStudies = caseStudies.filter((_, i) => i !== index);
    onChange(newCaseStudies);
    if (expandedIndex >= newCaseStudies.length) {
      setExpandedIndex(Math.max(0, newCaseStudies.length - 1));
    }
  };

  const handleFieldChange = (index, fieldName, fieldValue) => {
    const newCaseStudies = [...caseStudies];
    newCaseStudies[index] = { ...newCaseStudies[index], [fieldName]: fieldValue };
    onChange(newCaseStudies);
  };

  const handleImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.single(formData);
      const imagePath = response.data.path || response.data.data?.path;

      if (imagePath) {
        handleFieldChange(index, 'image', imagePath);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploading(null);
      if (fileInputRefs.current[index]) {
        fileInputRefs.current[index].value = '';
      }
    }
  };

  const handleReorder = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= caseStudies.length) return;

    const newCaseStudies = [...caseStudies];
    [newCaseStudies[index], newCaseStudies[newIndex]] = [newCaseStudies[newIndex], newCaseStudies[index]];
    onChange(newCaseStudies);
    setExpandedIndex(newIndex);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
    display: 'block',
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
          fontWeight: 600,
          color: '#374151',
        }}>
          {field.label || 'Case Studies'}
        </label>
        <span style={{
          fontSize: '12px',
          color: '#9ca3af',
        }}>
          {caseStudies.length}/{maxItems}
        </span>
      </div>

      {/* Case Studies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {caseStudies.map((caseStudy, index) => (
          <div
            key={caseStudy.id || index}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}
          >
            {/* Header - Collapsible */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: expandedIndex === index ? '#f9fafb' : '#fff',
                cursor: 'pointer',
                borderBottom: expandedIndex === index ? '1px solid #e5e7eb' : 'none',
              }}
              onClick={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Thumbnail */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#e5e7eb',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {caseStudy.image && (
                    <img
                      src={getImageUrl(caseStudy.image)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#111', margin: 0 }}>
                    {caseStudy.brand || `Case Study ${index + 1}`}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                    {caseStudy.label || 'No label set'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Reorder buttons */}
                {index > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReorder(index, 'up'); }}
                    style={{
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                    }}
                    title="Move up"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                )}
                {index < caseStudies.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReorder(index, 'down'); }}
                    style={{
                      padding: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                    }}
                    title="Move down"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
                {/* Expand/Collapse icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6b7280"
                  strokeWidth="2"
                  style={{
                    transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedIndex === index && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Label & Brand Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Label</label>
                    <input
                      type="text"
                      value={caseStudy.label || ''}
                      onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                      placeholder="e.g. Case Study 1"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Brand</label>
                    <input
                      type="text"
                      value={caseStudy.brand || ''}
                      onChange={(e) => handleFieldChange(index, 'brand', e.target.value)}
                      placeholder="e.g. GOTI"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label style={labelStyle}>Title</label>
                  <input
                    type="text"
                    value={caseStudy.title || ''}
                    onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                    placeholder="e.g. [From 79k INR/month to 1.5L INR/month]"
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea
                    value={caseStudy.description || ''}
                    onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                    placeholder="Short description for this case study"
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                {/* Image */}
                <div>
                  <label style={labelStyle}>Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {caseStudy.image ? (
                        <img
                          src={getImageUrl(caseStudy.image)}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ca3af',
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={uploading === index}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#374151',
                      }}
                    >
                      {uploading === index ? 'Uploading...' : caseStudy.image ? 'Change' : 'Upload'}
                    </button>
                    {caseStudy.image && (
                      <button
                        onClick={() => handleFieldChange(index, 'image', '')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#fff',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#dc2626',
                        }}
                      >
                        Remove
                      </button>
                    )}
                    <input
                      ref={(el) => fileInputRefs.current[index] = el}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(index, e)}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: '8px' }}>Metrics</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {/* Metric 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={caseStudy.metric1Value || ''}
                        onChange={(e) => handleFieldChange(index, 'metric1Value', e.target.value)}
                        placeholder="$1.34m"
                        style={{ ...inputStyle, textAlign: 'center', fontWeight: 600 }}
                      />
                      <input
                        type="text"
                        value={caseStudy.metric1Label || ''}
                        onChange={(e) => handleFieldChange(index, 'metric1Label', e.target.value)}
                        placeholder="Metrics 1"
                        style={{ ...inputStyle, fontSize: '12px' }}
                      />
                    </div>
                    {/* Metric 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={caseStudy.metric2Value || ''}
                        onChange={(e) => handleFieldChange(index, 'metric2Value', e.target.value)}
                        placeholder="$1.34m"
                        style={{ ...inputStyle, textAlign: 'center', fontWeight: 600 }}
                      />
                      <input
                        type="text"
                        value={caseStudy.metric2Label || ''}
                        onChange={(e) => handleFieldChange(index, 'metric2Label', e.target.value)}
                        placeholder="Metrics 2"
                        style={{ ...inputStyle, fontSize: '12px' }}
                      />
                    </div>
                    {/* Metric 3 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={caseStudy.metric3Value || ''}
                        onChange={(e) => handleFieldChange(index, 'metric3Value', e.target.value)}
                        placeholder="1.5L INR"
                        style={{ ...inputStyle, textAlign: 'center', fontWeight: 600 }}
                      />
                      <input
                        type="text"
                        value={caseStudy.metric3Label || ''}
                        onChange={(e) => handleFieldChange(index, 'metric3Label', e.target.value)}
                        placeholder="Metrics 3"
                        style={{ ...inputStyle, fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleRemove(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      backgroundColor: '#fff',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#dc2626',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Remove Case Study
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Button */}
      {caseStudies.length < maxItems && (
        <button
          onClick={handleAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '12px 16px',
            marginTop: '12px',
            backgroundColor: '#f0fdf4',
            border: '1px dashed #22c55e',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            color: '#16a34a',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Case Study
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

export default CaseStudiesArrayEditor;
