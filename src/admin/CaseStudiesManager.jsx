import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { caseStudiesAPI, uploadAPI, worksAPI } from '../services/api';

// Reusable Input Component
const FormInput = ({ label, name, value, onChange, type = 'text', placeholder, required = false, multiline = false, rows = 3 }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
      {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    {multiline ? (
      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          resize: 'vertical',
        }}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
    )}
  </div>
);

// Image Upload Component
const ImageUpload = ({ label, name, value, onChange, onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.uploadImage(formData);
      // Get URL from response - server returns { success, url, filename, path }
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) {
        onUpload(name, imageUrl);
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder="Image URL"
          style={{
            flex: 1,
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <label style={{
          padding: '10px 16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}>
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {value && (
        <img
          src={value}
          alt={label}
          style={{ marginTop: '8px', maxHeight: '100px', borderRadius: '4px' }}
        />
      )}
    </div>
  );
};

// Dual Image Upload Component (Desktop + Mobile)
const DualImageUpload = ({ label, desktopName, mobileName, desktopValue, mobileValue, onChange, onUpload }) => {
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const setUploading = type === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    const fieldName = type === 'desktop' ? desktopName : mobileName;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.uploadImage(formData);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) {
        onUpload(fieldName, imageUrl);
      } else {
        throw new Error('No URL returned from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '12px' }}>
        {label}
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Desktop Image */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span>
            Desktop
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              name={desktopName}
              value={desktopValue || ''}
              onChange={onChange}
              placeholder="Desktop image URL"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
            <label style={{
              padding: '8px 12px',
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}>
              {uploadingDesktop ? '...' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'desktop')}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {desktopValue && (
            <img
              src={desktopValue}
              alt={`${label} Desktop`}
              style={{ marginTop: '8px', maxHeight: '80px', borderRadius: '4px', border: '2px solid #3b82f6' }}
            />
          )}
        </div>

        {/* Mobile Image */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
            Mobile
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              name={mobileName}
              value={mobileValue || ''}
              onChange={onChange}
              placeholder="Mobile image URL (optional)"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
            <label style={{
              padding: '8px 12px',
              backgroundColor: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}>
              {uploadingMobile ? '...' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'mobile')}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {mobileValue && (
            <img
              src={mobileValue}
              alt={`${label} Mobile`}
              style={{ marginTop: '8px', maxHeight: '80px', borderRadius: '4px', border: '2px solid #10b981' }}
            />
          )}
        </div>
      </div>

      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px', fontStyle: 'italic' }}>
        If only one image is provided, it will be used for both desktop and mobile.
      </p>
    </div>
  );
};

// Array Input Component (for simple arrays like projectFocus, services, technologies)
const ArrayInput = ({ label, name, values, onChange, placeholder }) => {
  const handleAdd = () => {
    onChange(name, [...(values || []), '']);
  };

  const handleRemove = (index) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(name, newValues);
  };

  const handleChange = (index, value) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(name, newValues);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
        {label}
      </label>
      {(values || []).map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={item}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={placeholder}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add Item
      </button>
    </div>
  );
};

// Image Array Input Component (for arrays of images with upload)
const ImageArrayInput = ({ label, name, values, onChange, placeholder }) => {
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const handleAdd = () => {
    onChange(name, [...(values || []), '']);
  };

  const handleRemove = (index) => {
    const newValues = [...values];
    newValues.splice(index, 1);
    onChange(name, newValues);
  };

  const handleChange = (index, value) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(name, newValues);
  };

  const handleFileUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingIndex(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.uploadImage(formData);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) {
        handleChange(index, imageUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
        {label}
      </label>
      {(values || []).map((item, index) => (
        <div key={index} style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={item}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={placeholder}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <label style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}>
              {uploadingIndex === index ? 'Uploading...' : 'Upload'}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(index, e)}
                style={{ display: 'none' }}
              />
            </label>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
          {item && (
            <img
              src={item}
              alt={`${label} ${index + 1}`}
              style={{ maxHeight: '80px', borderRadius: '4px' }}
            />
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add Image
      </button>
    </div>
  );
};

// Dual Image Array Input Component (Desktop + Mobile arrays)
const DualImageArrayInput = ({ label, desktopName, mobileName, desktopValues, mobileValues, onChange }) => {
  const [uploadingDesktop, setUploadingDesktop] = useState(null);
  const [uploadingMobile, setUploadingMobile] = useState(null);

  const handleAddDesktop = () => {
    onChange(desktopName, [...(desktopValues || []), '']);
  };

  const handleAddMobile = () => {
    onChange(mobileName, [...(mobileValues || []), '']);
  };

  const handleRemoveDesktop = (index) => {
    const newValues = [...desktopValues];
    newValues.splice(index, 1);
    onChange(desktopName, newValues);
  };

  const handleRemoveMobile = (index) => {
    const newValues = [...mobileValues];
    newValues.splice(index, 1);
    onChange(mobileName, newValues);
  };

  const handleChangeDesktop = (index, value) => {
    const newValues = [...desktopValues];
    newValues[index] = value;
    onChange(desktopName, newValues);
  };

  const handleChangeMobile = (index, value) => {
    const newValues = [...mobileValues];
    newValues[index] = value;
    onChange(mobileName, newValues);
  };

  const handleFileUpload = async (index, e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const setUploading = type === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    const handleChange = type === 'desktop' ? handleChangeDesktop : handleChangeMobile;

    setUploading(index);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.uploadImage(formData);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) {
        handleChange(index, imageUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>
        {label}
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Desktop Images */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '10px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span>
            Desktop Images
          </label>
          {(desktopValues || []).map((item, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleChangeDesktop(index, e.target.value)}
                  placeholder={`Desktop image ${index + 1}`}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                />
                <label style={{ padding: '6px 10px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                  {uploadingDesktop === index ? '...' : '↑'}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(index, e, 'desktop')} style={{ display: 'none' }} />
                </label>
                <button type="button" onClick={() => handleRemoveDesktop(index)} style={{ padding: '6px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>×</button>
              </div>
              {item && <img src={item} alt={`Desktop ${index + 1}`} style={{ maxHeight: '50px', borderRadius: '4px', border: '2px solid #3b82f6' }} />}
            </div>
          ))}
          <button type="button" onClick={handleAddDesktop} style={{ padding: '6px 12px', backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#3b82f6' }}>+ Add Desktop</button>
        </div>

        {/* Mobile Images */}
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '10px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
            Mobile Images
          </label>
          {(mobileValues || []).map((item, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleChangeMobile(index, e.target.value)}
                  placeholder={`Mobile image ${index + 1}`}
                  style={{ flex: 1, padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px' }}
                />
                <label style={{ padding: '6px 10px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                  {uploadingMobile === index ? '...' : '↑'}
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(index, e, 'mobile')} style={{ display: 'none' }} />
                </label>
                <button type="button" onClick={() => handleRemoveMobile(index)} style={{ padding: '6px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>×</button>
              </div>
              {item && <img src={item} alt={`Mobile ${index + 1}`} style={{ maxHeight: '50px', borderRadius: '4px', border: '2px solid #10b981' }} />}
            </div>
          ))}
          <button type="button" onClick={handleAddMobile} style={{ padding: '6px 12px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#10b981' }}>+ Add Mobile</button>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '12px', fontStyle: 'italic' }}>
        If mobile images are not provided, desktop images will be used for both. Desktop images are displayed in order from left to right.
      </p>
    </div>
  );
};

// Process Steps Component
const ProcessStepsInput = ({ steps, onChange }) => {
  const handleAdd = () => {
    onChange([...(steps || []), { number: String((steps?.length || 0) + 1).padStart(2, '0'), title: '' }]);
  };

  const handleRemove = (index) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    onChange(newSteps);
  };

  const handleChange = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
        Process Steps
      </label>
      {(steps || []).map((step, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={step.number || ''}
            onChange={(e) => handleChange(index, 'number', e.target.value)}
            placeholder="01"
            style={{
              width: '60px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <input
            type="text"
            value={step.title || ''}
            onChange={(e) => handleChange(index, 'title', e.target.value)}
            placeholder="Step Title"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add Step
      </button>
    </div>
  );
};

// Opportunities Component
const OpportunitiesInput = ({ opportunities, onChange }) => {
  const handleAdd = () => {
    onChange([...(opportunities || []), { number: String((opportunities?.length || 0) + 1).padStart(2, '0'), title: '', description: '' }]);
  };

  const handleRemove = (index) => {
    const newOpps = [...opportunities];
    newOpps.splice(index, 1);
    onChange(newOpps);
  };

  const handleChange = (index, field, value) => {
    const newOpps = [...opportunities];
    newOpps[index] = { ...newOpps[index], [field]: value };
    onChange(newOpps);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
        Opportunities Discovered
      </label>
      {(opportunities || []).map((opp, index) => (
        <div key={index} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={opp.number || ''}
              onChange={(e) => handleChange(index, 'number', e.target.value)}
              placeholder="01"
              style={{
                width: '60px',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <input
              type="text"
              value={opp.title || ''}
              onChange={(e) => handleChange(index, 'title', e.target.value)}
              placeholder="Opportunity Title"
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
          <textarea
            value={opp.description || ''}
            onChange={(e) => handleChange(index, 'description', e.target.value)}
            placeholder="Opportunity Description"
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical',
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add Opportunity
      </button>
    </div>
  );
};

// Color Palette Component
const ColorPaletteInput = ({ colors, onChange }) => {
  const handleAdd = () => {
    onChange([...(colors || []), { color: '#000000', name: '' }]);
  };

  const handleRemove = (index) => {
    const newColors = [...colors];
    newColors.splice(index, 1);
    onChange(newColors);
  };

  const handleChange = (index, field, value) => {
    const newColors = [...colors];
    newColors[index] = { ...newColors[index], [field]: value };
    onChange(newColors);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
        Color Palette
      </label>
      {(colors || []).map((color, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <input
            type="color"
            value={color.color || '#000000'}
            onChange={(e) => handleChange(index, 'color', e.target.value)}
            style={{
              width: '50px',
              height: '38px',
              padding: '2px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={color.color || ''}
            onChange={(e) => handleChange(index, 'color', e.target.value)}
            placeholder="#FFFFFF"
            style={{
              width: '100px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <input
            type="text"
            value={color.name || ''}
            onChange={(e) => handleChange(index, 'name', e.target.value)}
            placeholder="Color Name (optional)"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add Color
      </button>
    </div>
  );
};

// Metrics Component
const MetricsInput = ({ metrics, onChange }) => {
  const handleAdd = () => {
    onChange([...(metrics || []), { value: '', label: '' }]);
  };

  const handleRemove = (index) => {
    const newMetrics = [...metrics];
    newMetrics.splice(index, 1);
    onChange(newMetrics);
  };

  const handleChange = (index, field, value) => {
    const newMetrics = [...metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    onChange(newMetrics);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
        Metrics
      </label>
      {(metrics || []).map((metric, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={metric.value || ''}
            onChange={(e) => handleChange(index, 'value', e.target.value)}
            placeholder="+45%"
            style={{
              width: '100px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <input
            type="text"
            value={metric.label || ''}
            onChange={(e) => handleChange(index, 'label', e.target.value)}
            placeholder="AOV (Average Order Value)"
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            style={{
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        style={{
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        + Add Metric
      </button>
    </div>
  );
};

// Related Works Selector Component
const RelatedWorksSelector = ({ selectedWorks, allWorks, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (workId) => {
    const newSelected = selectedWorks.includes(workId)
      ? selectedWorks.filter(id => id !== workId)
      : [...selectedWorks, workId];
    onChange(newSelected);
  };

  const selectedWorkItems = allWorks.filter(work => selectedWorks.includes(work._id));

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
        Related Projects (from Work Page)
      </label>

      {/* Selected Works Display */}
      {selectedWorkItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {selectedWorkItems.map(work => (
            <div
              key={work._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#eff6ff',
                borderRadius: '20px',
                fontSize: '13px',
              }}
            >
              {work.image && (
                <img
                  src={work.image}
                  alt={work.title}
                  style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                />
              )}
              <span style={{ color: '#1d4ed8' }}>{work.title}</span>
              <button
                type="button"
                onClick={() => handleToggle(work._id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0 4px',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          backgroundColor: '#fff',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: '#374151',
        }}
      >
        <span>
          {selectedWorks.length === 0
            ? 'Select related projects...'
            : `${selectedWorks.length} project${selectedWorks.length > 1 ? 's' : ''} selected`}
        </span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div style={{
          marginTop: '4px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: '#fff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          {allWorks.length === 0 ? (
            <p style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
              No projects found in Work page
            </p>
          ) : (
            allWorks.map(work => (
              <div
                key={work._id}
                onClick={() => handleToggle(work._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: selectedWorks.includes(work._id) ? '#eff6ff' : '#fff',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedWorks.includes(work._id)}
                  onChange={() => {}}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {work.image && (
                  <img
                    src={work.image}
                    alt={work.title}
                    style={{ width: '40px', height: '30px', borderRadius: '4px', objectFit: 'cover' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500, color: '#111827', fontSize: '14px', marginBottom: '2px' }}>
                    {work.title}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    {work.category || 'No category'} {work.tags?.length > 0 && `• ${work.tags.slice(0, 2).join(', ')}`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
        Select projects that will appear in the "Related Projects" section of this case study.
      </p>
    </div>
  );
};

// Section Header Component
const SectionHeader = ({ title }) => (
  <h3 style={{
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginTop: '32px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  }}>
    {title}
  </h3>
);

// Section Card Component (for grouping fields in section editor)
const SectionCard = ({ title, children }) => (
  <div style={{
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
  }}>
    {title && (
      <h3 style={{
        fontSize: '15px',
        fontWeight: 600,
        color: '#111827',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f3f4f6',
      }}>
        {title}
      </h3>
    )}
    {children}
  </div>
);

// Responsive Image Upload (wrapper for DualImageUpload with simpler API)
const ResponsiveImageUpload = ({ label, desktopName, mobileName, desktopValue, mobileValue, onUpload }) => {
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const setUploading = type === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    const fieldName = type === 'desktop' ? desktopName : mobileName;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.uploadImage(formData);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) {
        onUpload(fieldName, imageUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '12px' }}>
        {label}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Desktop */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#3b82f6', marginBottom: '6px' }}>Desktop</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={desktopValue || ''}
              readOnly
              placeholder="Desktop image URL"
              style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', backgroundColor: '#f9fafb' }}
            />
            <label style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              {uploadingDesktop ? '...' : 'Upload'}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'desktop')} style={{ display: 'none' }} />
            </label>
          </div>
          {desktopValue && <img src={desktopValue} alt="Desktop preview" style={{ marginTop: '8px', maxHeight: '60px', borderRadius: '4px' }} />}
        </div>
        {/* Mobile */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#10b981', marginBottom: '6px' }}>Mobile</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={mobileValue || ''}
              readOnly
              placeholder="Mobile image URL"
              style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', backgroundColor: '#f9fafb' }}
            />
            <label style={{ padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              {uploadingMobile ? '...' : 'Upload'}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'mobile')} style={{ display: 'none' }} />
            </label>
          </div>
          {mobileValue && <img src={mobileValue} alt="Mobile preview" style={{ marginTop: '8px', maxHeight: '60px', borderRadius: '4px' }} />}
        </div>
      </div>
    </div>
  );
};

// Multiple Image Upload (for arrays like experienceImages)
const MultipleImageUpload = ({ label, desktopName, mobileName, desktopValues = [], mobileValues = [], onUpload }) => {
  const [uploadingIndex, setUploadingIndex] = useState({ desktop: null, mobile: null });

  const handleAdd = (type) => {
    const name = type === 'desktop' ? desktopName : mobileName;
    const values = type === 'desktop' ? desktopValues : mobileValues;
    onUpload(name, [...values, '']);
  };

  const handleRemove = (type, index) => {
    const name = type === 'desktop' ? desktopName : mobileName;
    const values = type === 'desktop' ? [...desktopValues] : [...mobileValues];
    values.splice(index, 1);
    onUpload(name, values);
  };

  const handleFileUpload = async (type, index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingIndex(prev => ({ ...prev, [type]: index }));
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.uploadImage(formData);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) {
        const name = type === 'desktop' ? desktopName : mobileName;
        const values = type === 'desktop' ? [...desktopValues] : [...mobileValues];
        values[index] = imageUrl;
        onUpload(name, values);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingIndex(prev => ({ ...prev, [type]: null }));
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '12px' }}>
        {label}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Desktop Images */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#3b82f6', marginBottom: '8px' }}>Desktop Images</label>
          {desktopValues.map((url, index) => (
            <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              {url && <img src={url} alt="" style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />}
              <label style={{ padding: '6px 10px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                {uploadingIndex.desktop === index ? '...' : url ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload('desktop', index, e)} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={() => handleRemove('desktop', index)} style={{ padding: '6px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('desktop')} style={{ padding: '6px 12px', backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#3b82f6' }}>+ Add Desktop</button>
        </div>
        {/* Mobile Images */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#10b981', marginBottom: '8px' }}>Mobile Images</label>
          {mobileValues.map((url, index) => (
            <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              {url && <img src={url} alt="" style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />}
              <label style={{ padding: '6px 10px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                {uploadingIndex.mobile === index ? '...' : url ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload('mobile', index, e)} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={() => handleRemove('mobile', index)} style={{ padding: '6px 8px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('mobile')} style={{ padding: '6px 12px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', color: '#10b981' }}>+ Add Mobile</button>
        </div>
      </div>
    </div>
  );
};

// Case Study Form Component - Split Screen Editor
const CaseStudyForm = ({ isEdit = false, basePath = '/goti/admin/case-studies' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allWorks, setAllWorks] = useState([]);
  const [editingSlug, setEditingSlug] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const iframeRef = useRef(null);
  const [iframeSlug, setIframeSlug] = useState(null); // Track slug for iframe URL separately

  // Sections for navigation (no emojis)
  const sections = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'images', label: 'Hero & Banner Images' },
    { id: 'collaboration', label: 'Collaboration' },
    { id: 'challenge', label: 'Challenge & Solution' },
    { id: 'process', label: 'Process & Opportunities' },
    { id: 'experience', label: 'Experience' },
    { id: 'design', label: 'Colors & Typography' },
    { id: 'metrics', label: 'Metrics & Results' },
    { id: 'related', label: 'Related Works' },
    { id: 'settings', label: 'Settings' },
  ];

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    client: '',
    clientLogo: '',
    clientLogoMobile: '',
    industry: '',
    platform: '',
    duration: '',
    projectFocus: [],
    services: [],
    heroImage: '',
    heroImageMobile: '',
    bannerImage: '',
    bannerImageMobile: '',
    collaborationTitle: 'The Collaboration',
    collaborationText: '',
    challenge: '',
    solution: '',
    results: '',
    processSteps: [],
    opportunities: [],
    experienceTitle: 'The Experience We Created',
    experienceImages: [],
    experienceImagesMobile: [],
    experienceQuote: '',
    colorPalette: [],
    typography: { fontFamily: '', fontImage: '', fontImageMobile: '', characterSet: '' },
    metrics: [],
    images: [],
    imagesMobile: [],
    technologies: [],
    relatedWorks: [],
    published: false,
    order: 0,
  });

  useEffect(() => {
    fetchAllWorks();
    if (isEdit && id) {
      fetchCaseStudy();
    }
  }, [isEdit, id]);

  // Send updates to iframe when form data or section changes
  useEffect(() => {
    const sendUpdate = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'EDITOR_UPDATE',
          payload: {
            section: selectedSection,
            data: formData,
          }
        }, window.location.origin);
      }
    };
    // Send immediately for responsiveness
    const timeoutId = setTimeout(sendUpdate, 50);
    return () => clearTimeout(timeoutId);
  }, [formData, selectedSection]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'SECTION_CLICKED') {
        // Map iframe section IDs to our section IDs
        const sectionMap = {
          'hero': 'images',
          'banner': 'images',
          'collaboration': 'collaboration',
          'problem': 'challenge',
          'screenshots': 'images',
          'process': 'process',
          'opportunities': 'process',
          'experience': 'experience',
          'colorPalette': 'design',
          'typography': 'design',
          'cta': 'settings',
          'testimonial': 'settings',
          'related': 'related',
        };
        const mappedSection = sectionMap[event.data.sectionId] || event.data.sectionId;
        setSelectedSection(mappedSection);
      } else if (event.data.type === 'PREVIEW_READY') {
        // Send initial data when iframe is ready
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'EDITOR_INIT',
            payload: {
              section: selectedSection,
              data: formData,
            }
          }, window.location.origin);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedSection, formData]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'EDITOR_INIT',
          payload: {
            section: selectedSection,
            data: formData,
          }
        }, window.location.origin);
      }
    }, 100);
  };

  const fetchAllWorks = async () => {
    try {
      const response = await worksAPI.getAll();
      setAllWorks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching works:', error);
    }
  };

  const fetchCaseStudy = async () => {
    setLoading(true);
    try {
      const response = await caseStudiesAPI.getOne(id);
      const data = response.data.data;
      setFormData(data);
      // Set iframe slug once and don't change it (prevents iframe reload)
      if (data.slug && !iframeSlug) {
        setIframeSlug(data.slug);
      }
    } catch (error) {
      console.error('Error fetching case study:', error);
      alert('Failed to load case study');
    } finally {
      setLoading(false);
    }
  };

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      // Auto-generate slug from title if not editing and slug is empty or was auto-generated
      if (name === 'title' && !editingSlug && !isEdit) {
        updated.slug = generateSlug(newValue);
      }
      return updated;
    });
  };

  const handleSlugChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug: value }));
  };

  const copyUrl = () => {
    const url = `${window.location.origin}/case-studies/${formData.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleArrayChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (name, url) => {
    setFormData(prev => ({
      ...prev,
      [name]: url,
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await caseStudiesAPI.update(id, formData);
        // Refresh iframe to show updated content
        if (iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        }
      } else {
        // For new case study, create and redirect to edit page
        const response = await caseStudiesAPI.create(formData);
        const newId = response.data.data._id;
        navigate(`${basePath}/edit/${newId}`);
      }
    } catch (error) {
      console.error('Error saving case study:', error);
      alert('Failed to save case study');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', zIndex: 9999 }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  // Handle multiple image upload for arrays
  const handleMultipleImageUpload = (name, values) => {
    setFormData(prev => ({ ...prev, [name]: values }));
  };

  // Render section content based on selected section
  const renderSectionContent = () => {
    switch (selectedSection) {
      case 'basic':
        return (
          <>
            <SectionCard title="Basic Information">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormInput label="Title" name="title" value={formData.title} onChange={handleChange} placeholder="Case Study Title" required />
                <FormInput label="Client" name="client" value={formData.client} onChange={handleChange} placeholder="Client Name" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <FormInput label="Industry" name="industry" value={formData.industry} onChange={handleChange} placeholder="e.g. Automotive" />
                <FormInput label="Platform" name="platform" value={formData.platform} onChange={handleChange} placeholder="e.g. Mobile App" />
                <FormInput label="Duration" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 6 months" />
              </div>
            </SectionCard>
            <SectionCard title="Tags & Services">
              <ArrayInput label="Project Focus" name="projectFocus" values={formData.projectFocus} onChange={handleArrayChange} placeholder="e.g. UX Design" />
              <ArrayInput label="Services" name="services" values={formData.services} onChange={handleArrayChange} placeholder="e.g. Branding" />
              <ArrayInput label="Technologies" name="technologies" values={formData.technologies} onChange={handleArrayChange} placeholder="e.g. React" />
            </SectionCard>
          </>
        );
      case 'images':
        return (
          <>
            <SectionCard title="Client Logo">
              <ResponsiveImageUpload label="Client Logo" desktopName="clientLogo" mobileName="clientLogoMobile" desktopValue={formData.clientLogo} mobileValue={formData.clientLogoMobile} onUpload={handleImageUpload} />
            </SectionCard>
            <SectionCard title="Hero Image">
              <ResponsiveImageUpload label="Hero Image" desktopName="heroImage" mobileName="heroImageMobile" desktopValue={formData.heroImage} mobileValue={formData.heroImageMobile} onUpload={handleImageUpload} />
            </SectionCard>
            <SectionCard title="Banner Image">
              <ResponsiveImageUpload label="Banner Image" desktopName="bannerImage" mobileName="bannerImageMobile" desktopValue={formData.bannerImage} mobileValue={formData.bannerImageMobile} onUpload={handleImageUpload} />
            </SectionCard>
            <SectionCard title="Gallery Images">
              <MultipleImageUpload label="Gallery Images" desktopName="images" mobileName="imagesMobile" desktopValues={formData.images} mobileValues={formData.imagesMobile} onUpload={handleMultipleImageUpload} />
            </SectionCard>
          </>
        );
      case 'collaboration':
        return (
          <SectionCard title="Collaboration">
            <FormInput label="Collaboration Text" name="collaborationText" value={formData.collaborationText} onChange={handleChange} multiline rows={4} placeholder="Describe the collaboration..." />
          </SectionCard>
        );
      case 'challenge':
        return (
          <>
            <SectionCard title="Challenge">
              <FormInput label="Challenge" name="challenge" value={formData.challenge} onChange={handleChange} multiline rows={4} placeholder="Describe the challenge..." required />
            </SectionCard>
            <SectionCard title="Solution">
              <FormInput label="Solution" name="solution" value={formData.solution} onChange={handleChange} multiline rows={4} placeholder="Describe the solution..." required />
            </SectionCard>
            <SectionCard title="Results">
              <FormInput label="Results" name="results" value={formData.results} onChange={handleChange} multiline rows={4} placeholder="Describe the results..." />
            </SectionCard>
          </>
        );
      case 'process':
        return (
          <>
            <SectionCard title="Process Steps">
              <ProcessStepsInput steps={formData.processSteps} onChange={(steps) => setFormData(prev => ({ ...prev, processSteps: steps }))} />
            </SectionCard>
            <SectionCard title="Opportunities">
              <OpportunitiesInput opportunities={formData.opportunities} onChange={(opps) => setFormData(prev => ({ ...prev, opportunities: opps }))} />
            </SectionCard>
          </>
        );
      case 'experience':
        return (
          <>
            <SectionCard title="Experience Images">
              <MultipleImageUpload label="Experience Images" desktopName="experienceImages" mobileName="experienceImagesMobile" desktopValues={formData.experienceImages} mobileValues={formData.experienceImagesMobile} onUpload={handleMultipleImageUpload} />
            </SectionCard>
            <SectionCard title="Experience Quote">
              <FormInput label="Quote" name="experienceQuote" value={formData.experienceQuote} onChange={handleChange} multiline rows={3} placeholder="Add an inspiring quote..." />
            </SectionCard>
          </>
        );
      case 'design':
        return (
          <>
            <SectionCard title="Color Palette">
              <ColorPaletteInput colors={formData.colorPalette} onChange={(colors) => setFormData(prev => ({ ...prev, colorPalette: colors }))} />
            </SectionCard>
            <SectionCard title="Typography">
              <FormInput label="Font Family" name="typography.fontFamily" value={formData.typography?.fontFamily || ''} onChange={(e) => setFormData(prev => ({ ...prev, typography: { ...prev.typography, fontFamily: e.target.value }}))} placeholder="e.g. Plus Jakarta Sans" />
              <ResponsiveImageUpload label="Font Preview Image" desktopName="typography.fontImage" mobileName="typography.fontImageMobile" desktopValue={formData.typography?.fontImage || ''} mobileValue={formData.typography?.fontImageMobile || ''} onUpload={(name, url) => {
                const key = name.split('.')[1];
                setFormData(prev => ({ ...prev, typography: { ...prev.typography, [key]: url }}));
              }} />
            </SectionCard>
          </>
        );
      case 'metrics':
        return (
          <SectionCard title="Metrics">
            <MetricsInput metrics={formData.metrics} onChange={(metrics) => setFormData(prev => ({ ...prev, metrics: metrics }))} />
          </SectionCard>
        );
      case 'related':
        return (
          <SectionCard title="Related Works">
            <RelatedWorksSelector allWorks={allWorks} selectedWorks={formData.relatedWorks || []} onChange={(works) => setFormData(prev => ({ ...prev, relatedWorks: works }))} />
          </SectionCard>
        );
      case 'settings':
        return (
          <SectionCard title="Publishing Settings">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <input type="checkbox" id="published" checked={formData.published} onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="published" style={{ fontSize: '14px', cursor: 'pointer' }}>Published</label>
            </div>
            <FormInput label="Display Order" name="order" type="number" value={formData.order} onChange={handleChange} placeholder="0" />
          </SectionCard>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', backgroundColor: '#f3f4f6', zIndex: 9999 }}>
      {/* Left Panel - Editor */}
      <div style={{
        width: '50%',
        borderRight: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflowX: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#fff',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => selectedSection ? setSelectedSection(null) : navigate(basePath)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              {selectedSection ? sections.find(s => s.id === selectedSection)?.label : (isEdit ? 'Edit Case Study' : 'New Case Study')}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {!selectedSection ? (
            /* Section Navigator */
            <div style={{ padding: '20px' }}>
              {/* URL Section */}
              <div style={{
                backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '14px 16px',
                marginBottom: '20px', border: '1px solid #bbf7d0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#166534', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>
                      Case Study URL
                    </label>
                    {editingSlug ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>/case-studies/</span>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={handleSlugChange}
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: '#111827',
                            backgroundColor: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #22c55e',
                            outline: 'none',
                            width: '200px',
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setEditingSlug(false)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#22c55e',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Done
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#6b7280', fontSize: '13px' }}>/case-studies/</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#111827', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>
                          {formData.slug || 'auto-generated'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingSlug(true)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            color: '#166534',
                            border: '1px solid #166534',
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            marginLeft: '4px',
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={copyUrl}
                    disabled={!formData.slug}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: formData.slug ? '#22c55e' : '#e5e7eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: formData.slug ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {copied ? 'Copied' : 'Copy URL'}
                  </button>
                </div>
              </div>

              {/* Section List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSelectedSection(section.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#2563eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6b7280',
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{section.label}</span>
                    <svg style={{ marginLeft: 'auto', color: '#9ca3af' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Section Fields */
            <div style={{ padding: '20px' }}>
              {renderSectionContent()}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#1a1a2e',
      }}>
        {/* Preview Header - minimal */}
        <div style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          backgroundColor: '#1a1a2e',
          flexShrink: 0,
        }}>
          <a
            href={formData.slug ? `/case-studies/${formData.slug}` : '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#333',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '12px',
              textDecoration: 'none',
              opacity: formData.slug ? 1 : 0.5,
              pointerEvents: formData.slug ? 'auto' : 'none',
            }}
          >
            Open in New Tab ↗
          </a>
        </div>

        {/* Preview Iframe - Full size with scrolling */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#e5e7eb', padding: '20px' }}>
          {/* Show iframe when: new case study (!isEdit) OR when editing and slug is loaded (iframeSlug) */}
          {(!isEdit || iframeSlug) ? (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              width: '1440px',
              minWidth: '1440px',
              height: 'calc(100vh - 120px)',
            }}>
              <iframe
                ref={iframeRef}
                src={`/case-studies/${iframeSlug || 'preview'}?editor=true`}
                onLoad={handleIframeLoad}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title="Case Study Preview"
              />
            </div>
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}>
              Loading preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Case Studies List Component
const CaseStudiesList = ({ basePath = '/goti/admin/case-studies' }) => {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseStudies();
  }, []);

  const fetchCaseStudies = async () => {
    try {
      const response = await caseStudiesAPI.getAll();
      setCaseStudies(response.data.data);
    } catch (error) {
      console.error('Error fetching case studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this case study?')) {
      try {
        await caseStudiesAPI.delete(id);
        fetchCaseStudies();
      } catch (error) {
        console.error('Error deleting case study:', error);
      }
    }
  };

  const handleTogglePublish = async (study) => {
    try {
      await caseStudiesAPI.update(study._id, { published: !study.published });
      fetchCaseStudies();
    } catch (error) {
      console.error('Error updating case study:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>Case Studies</h1>
        <Link
          to={`${basePath}/new`}
          style={{ backgroundColor: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}
        >
          Add New Case Study
        </Link>
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb' }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Title
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Client
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Industry
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Status
              </th>
              <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {caseStudies.map((study) => (
              <tr key={study._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {study.heroImage && (
                      <img
                        src={study.heroImage}
                        alt={study.title}
                        style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    )}
                    <span style={{ fontWeight: 500, color: '#111827' }}>{study.title}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: '#374151' }}>{study.client}</td>
                <td style={{ padding: '16px 24px', color: '#374151' }}>{study.industry || '-'}</td>
                <td style={{ padding: '16px 24px' }}>
                  <button
                    onClick={() => handleTogglePublish(study)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      borderRadius: '12px',
                      backgroundColor: study.published ? '#dcfce7' : '#f3f4f6',
                      color: study.published ? '#166534' : '#374151',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {study.published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <Link
                    to={`/case-studies/${study.slug}`}
                    target="_blank"
                    style={{ color: '#6b7280', textDecoration: 'none', marginRight: '12px' }}
                  >
                    View
                  </Link>
                  <Link
                    to={`${basePath}/edit/${study._id}`}
                    style={{ color: '#2563eb', textDecoration: 'none', marginRight: '12px' }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(study._id)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {caseStudies.length === 0 && (
          <p style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            No case studies found. <Link to={`${basePath}/new`} style={{ color: '#2563eb' }}>Create your first one</Link>
          </p>
        )}
      </div>
    </div>
  );
};

// Main Manager Component
const CaseStudiesManager = ({ basePath = '/goti/admin/case-studies' }) => {
  return (
    <Routes>
      <Route path="/" element={<CaseStudiesList basePath={basePath} />} />
      <Route path="/new" element={<CaseStudyForm basePath={basePath} />} />
      <Route path="/edit/:id" element={<CaseStudyForm isEdit basePath={basePath} />} />
    </Routes>
  );
};

export default CaseStudiesManager;
