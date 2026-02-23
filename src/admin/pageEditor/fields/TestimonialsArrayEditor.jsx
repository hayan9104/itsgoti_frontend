import { useState, useRef } from 'react';
import { uploadAPI } from '../../../services/api';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

const TestimonialsArrayEditor = ({ field, value = [], onChange }) => {
  const [uploading, setUploading] = useState(null); // Track which testimonial is uploading
  const [expandedIndex, setExpandedIndex] = useState(0); // First one expanded by default
  const fileInputRefs = useRef({});

  const testimonials = Array.isArray(value) ? value : [];
  const maxItems = field.maxItems || 10;

  const createEmptyTestimonial = () => ({
    id: Date.now(),
    quote1: '',
    quote2: '',
    authorName: '',
    authorRole: '',
    authorImage: '',
    stat1Value: '',
    stat1Label: '',
    stat2Value: '',
    stat2Label: '',
    stat3Value: '',
    stat3Label: '',
  });

  const handleAdd = () => {
    if (testimonials.length >= maxItems) return;
    const newTestimonial = createEmptyTestimonial();
    const newTestimonials = [...testimonials, newTestimonial];
    onChange(newTestimonials);
    setExpandedIndex(newTestimonials.length - 1);
  };

  const handleRemove = (index) => {
    const newTestimonials = testimonials.filter((_, i) => i !== index);
    onChange(newTestimonials);
    if (expandedIndex >= newTestimonials.length) {
      setExpandedIndex(Math.max(0, newTestimonials.length - 1));
    }
  };

  const handleFieldChange = (index, fieldName, fieldValue) => {
    const newTestimonials = [...testimonials];
    newTestimonials[index] = { ...newTestimonials[index], [fieldName]: fieldValue };
    onChange(newTestimonials);
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
        handleFieldChange(index, 'authorImage', imagePath);
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
    if (newIndex < 0 || newIndex >= testimonials.length) return;

    const newTestimonials = [...testimonials];
    [newTestimonials[index], newTestimonials[newIndex]] = [newTestimonials[newIndex], newTestimonials[index]];
    onChange(newTestimonials);
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
          {field.label || 'Testimonials'}
        </label>
        <span style={{
          fontSize: '12px',
          color: '#9ca3af',
        }}>
          {testimonials.length}/{maxItems}
        </span>
      </div>

      {/* Testimonials List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.id || index}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}
          >
            {/* Header - Always visible */}
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
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#e5e7eb',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}>
                  {testimonial.authorImage && (
                    <img
                      src={getImageUrl(testimonial.authorImage)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#111', margin: 0 }}>
                    {testimonial.authorName || `Testimonial ${index + 1}`}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                    {testimonial.authorRole || 'No role set'}
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
                {index < testimonials.length - 1 && (
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
                {/* Quote 1 */}
                <div>
                  <label style={labelStyle}>Quote Paragraph 1</label>
                  <textarea
                    value={testimonial.quote1 || ''}
                    onChange={(e) => handleFieldChange(index, 'quote1', e.target.value)}
                    placeholder="Enter first paragraph of quote"
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                {/* Quote 2 */}
                <div>
                  <label style={labelStyle}>Quote Paragraph 2</label>
                  <textarea
                    value={testimonial.quote2 || ''}
                    onChange={(e) => handleFieldChange(index, 'quote2', e.target.value)}
                    placeholder="Enter second paragraph of quote"
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  />
                </div>

                {/* Author Info Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Author Name</label>
                    <input
                      type="text"
                      value={testimonial.authorName || ''}
                      onChange={(e) => handleFieldChange(index, 'authorName', e.target.value)}
                      placeholder="e.g. John Doe"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Author Role</label>
                    <input
                      type="text"
                      value={testimonial.authorRole || ''}
                      onChange={(e) => handleFieldChange(index, 'authorRole', e.target.value)}
                      placeholder="e.g. CEO, Company"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Author Image */}
                <div>
                  <label style={labelStyle}>Author Image</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {testimonial.authorImage ? (
                        <img
                          src={getImageUrl(testimonial.authorImage)}
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
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
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
                      {uploading === index ? 'Uploading...' : testimonial.authorImage ? 'Change' : 'Upload'}
                    </button>
                    {testimonial.authorImage && (
                      <button
                        onClick={() => handleFieldChange(index, 'authorImage', '')}
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

                {/* Stats */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: '8px' }}>Statistics</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {/* Stat 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={testimonial.stat1Value || ''}
                        onChange={(e) => handleFieldChange(index, 'stat1Value', e.target.value)}
                        placeholder="+45%"
                        style={{ ...inputStyle, textAlign: 'center', fontWeight: 600 }}
                      />
                      <input
                        type="text"
                        value={testimonial.stat1Label || ''}
                        onChange={(e) => handleFieldChange(index, 'stat1Label', e.target.value)}
                        placeholder="Stat 1 Label"
                        style={{ ...inputStyle, fontSize: '12px' }}
                      />
                    </div>
                    {/* Stat 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={testimonial.stat2Value || ''}
                        onChange={(e) => handleFieldChange(index, 'stat2Value', e.target.value)}
                        placeholder="+24%"
                        style={{ ...inputStyle, textAlign: 'center', fontWeight: 600 }}
                      />
                      <input
                        type="text"
                        value={testimonial.stat2Label || ''}
                        onChange={(e) => handleFieldChange(index, 'stat2Label', e.target.value)}
                        placeholder="Stat 2 Label"
                        style={{ ...inputStyle, fontSize: '12px' }}
                      />
                    </div>
                    {/* Stat 3 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={testimonial.stat3Value || ''}
                        onChange={(e) => handleFieldChange(index, 'stat3Value', e.target.value)}
                        placeholder="+16%"
                        style={{ ...inputStyle, textAlign: 'center', fontWeight: 600 }}
                      />
                      <input
                        type="text"
                        value={testimonial.stat3Label || ''}
                        onChange={(e) => handleFieldChange(index, 'stat3Label', e.target.value)}
                        placeholder="Stat 3 Label"
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
                    Remove Testimonial
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Button */}
      {testimonials.length < maxItems && (
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
          Add Testimonial
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

export default TestimonialsArrayEditor;
