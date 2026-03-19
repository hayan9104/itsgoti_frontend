import { useState } from 'react';
import { useCaseStudyEditor } from './CaseStudyEditorContext';
import { uploadAPI } from '../../services/api';

const CaseStudySectionFields = () => {
  const { selectedSection, sections, formData, updateField, allWorks } = useCaseStudyEditor();

  const section = sections.find(s => s.id === selectedSection);

  if (!section) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Section not found
      </div>
    );
  }

  // Get nested value from formData
  const getValue = (key) => {
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = formData;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }
    return formData[key];
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
      {section.fields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          value={getValue(field.key)}
          onChange={(value) => updateField(field.key, value)}
          formData={formData}
          updateField={updateField}
          allWorks={allWorks}
        />
      ))}
    </div>
  );
};

// Field Renderer Component
const FieldRenderer = ({ field, value, onChange, formData, updateField, allWorks }) => {
  switch (field.type) {
    case 'text':
      return <TextField field={field} value={value} onChange={onChange} />;
    case 'textarea':
      return <TextareaField field={field} value={value} onChange={onChange} />;
    case 'number':
      return <NumberField field={field} value={value} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxField field={field} value={value} onChange={onChange} />;
    case 'image':
      return <ImageField field={field} value={value} onChange={onChange} />;
    case 'dualImage':
      return <DualImageField field={field} formData={formData} updateField={updateField} />;
    case 'stringArray':
      return <StringArrayField field={field} value={value} onChange={onChange} />;
    case 'dualImageArray':
      return <DualImageArrayField field={field} formData={formData} updateField={updateField} />;
    case 'processSteps':
      return <ProcessStepsField field={field} value={value} onChange={onChange} />;
    case 'opportunities':
      return <OpportunitiesField field={field} value={value} onChange={onChange} />;
    case 'colorPalette':
      return <ColorPaletteField field={field} value={value} onChange={onChange} />;
    case 'metrics':
      return <MetricsField field={field} value={value} onChange={onChange} />;
    case 'relatedWorks':
      return <RelatedWorksField field={field} value={value} onChange={onChange} allWorks={allWorks} />;
    default:
      return <TextField field={field} value={value} onChange={onChange} />;
  }
};

// Text Field
const TextField = ({ field, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={labelStyle}>
      {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      style={inputStyle}
    />
  </div>
);

// Textarea Field
const TextareaField = ({ field, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={labelStyle}>
      {field.label} {field.required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={field.rows || 4}
      style={{ ...inputStyle, resize: 'vertical' }}
    />
  </div>
);

// Number Field
const NumberField = ({ field, value, onChange }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={labelStyle}>{field.label}</label>
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      placeholder={field.placeholder}
      style={inputStyle}
    />
  </div>
);

// Checkbox Field
const CheckboxField = ({ field, value, onChange }) => (
  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
    <input
      type="checkbox"
      checked={value || false}
      onChange={(e) => onChange(e.target.checked)}
      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
    />
    <label style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>{field.label}</label>
  </div>
);

// Image Field
const ImageField = ({ field, value, onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await uploadAPI.uploadImage(formData);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) onChange(imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{field.label}</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="text" value={value || ''} readOnly style={{ ...inputStyle, flex: 1, backgroundColor: '#f9fafb' }} />
        <label style={uploadButtonStyle}>
          {uploading ? '...' : 'Upload'}
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>
      {value && <img src={value} alt="" style={{ marginTop: '8px', maxHeight: '80px', borderRadius: '4px' }} />}
    </div>
  );
};

// Dual Image Field (Desktop + Mobile)
const DualImageField = ({ field, formData, updateField }) => {
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  const getValue = (key) => {
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = formData;
      for (const k of keys) {
        value = value?.[k];
      }
      return value;
    }
    return formData[key];
  };

  const desktopValue = getValue(field.desktopKey);
  const mobileValue = getValue(field.mobileKey);

  const handleUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const setUploading = type === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    const fieldKey = type === 'desktop' ? field.desktopKey : field.mobileKey;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const response = await uploadAPI.uploadImage(fd);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) updateField(fieldKey, imageUrl);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
      <label style={{ ...labelStyle, fontWeight: 600 }}>{field.label}</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
        {/* Desktop */}
        <div>
          <label style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '6px', display: 'block' }}>Desktop</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={uploadButtonStyle}>
              {uploadingDesktop ? '...' : desktopValue ? 'Change' : 'Upload'}
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'desktop')} style={{ display: 'none' }} />
            </label>
          </div>
          {desktopValue && <img src={desktopValue} alt="" style={{ marginTop: '8px', maxHeight: '60px', borderRadius: '4px' }} />}
        </div>
        {/* Mobile */}
        <div>
          <label style={{ fontSize: '12px', color: '#10b981', marginBottom: '6px', display: 'block' }}>Mobile</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <label style={uploadButtonStyle}>
              {uploadingMobile ? '...' : mobileValue ? 'Change' : 'Upload'}
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e, 'mobile')} style={{ display: 'none' }} />
            </label>
          </div>
          {mobileValue && <img src={mobileValue} alt="" style={{ marginTop: '8px', maxHeight: '60px', borderRadius: '4px' }} />}
        </div>
      </div>
    </div>
  );
};

// String Array Field
const StringArrayField = ({ field, value = [], onChange }) => {
  const handleAdd = () => onChange([...value, '']);
  const handleRemove = (index) => {
    const newValues = [...value];
    newValues.splice(index, 1);
    onChange(newValues);
  };
  const handleChange = (index, val) => {
    const newValues = [...value];
    newValues[index] = val;
    onChange(newValues);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{field.label}</label>
      {value.map((item, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="text"
            value={item}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={field.placeholder}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="button" onClick={() => handleRemove(index)} style={removeButtonStyle}>×</button>
        </div>
      ))}
      <button type="button" onClick={handleAdd} style={addButtonStyle}>+ Add Item</button>
    </div>
  );
};

// Dual Image Array Field
const DualImageArrayField = ({ field, formData, updateField }) => {
  const desktopValues = formData[field.desktopKey] || [];
  const mobileValues = formData[field.mobileKey] || [];

  const [uploadingIndex, setUploadingIndex] = useState({ desktop: null, mobile: null });

  const handleAdd = (type) => {
    const key = type === 'desktop' ? field.desktopKey : field.mobileKey;
    const values = type === 'desktop' ? desktopValues : mobileValues;
    updateField(key, [...values, '']);
  };

  const handleRemove = (type, index) => {
    const key = type === 'desktop' ? field.desktopKey : field.mobileKey;
    const values = type === 'desktop' ? [...desktopValues] : [...mobileValues];
    values.splice(index, 1);
    updateField(key, values);
  };

  const handleUpload = async (type, index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingIndex(prev => ({ ...prev, [type]: index }));
    try {
      const fd = new FormData();
      fd.append('image', file);
      const response = await uploadAPI.uploadImage(fd);
      const imageUrl = response.data.url || response.data.data?.path || response.data.path;
      if (imageUrl) {
        const key = type === 'desktop' ? field.desktopKey : field.mobileKey;
        const values = type === 'desktop' ? [...desktopValues] : [...mobileValues];
        values[index] = imageUrl;
        updateField(key, values);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingIndex(prev => ({ ...prev, [type]: null }));
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
      <label style={{ ...labelStyle, fontWeight: 600 }}>{field.label}</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
        {/* Desktop */}
        <div>
          <label style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '8px', display: 'block' }}>Desktop Images</label>
          {desktopValues.map((url, index) => (
            <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              {url && <img src={url} alt="" style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />}
              <label style={{ ...uploadButtonStyle, padding: '6px 10px', fontSize: '11px' }}>
                {uploadingIndex.desktop === index ? '...' : url ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" onChange={(e) => handleUpload('desktop', index, e)} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={() => handleRemove('desktop', index)} style={{ ...removeButtonStyle, padding: '6px 8px', fontSize: '11px' }}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('desktop')} style={{ ...addButtonStyle, fontSize: '11px', padding: '6px 12px' }}>+ Add</button>
        </div>
        {/* Mobile */}
        <div>
          <label style={{ fontSize: '12px', color: '#10b981', marginBottom: '8px', display: 'block' }}>Mobile Images</label>
          {mobileValues.map((url, index) => (
            <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
              {url && <img src={url} alt="" style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '4px' }} />}
              <label style={{ ...uploadButtonStyle, padding: '6px 10px', fontSize: '11px' }}>
                {uploadingIndex.mobile === index ? '...' : url ? 'Change' : 'Upload'}
                <input type="file" accept="image/*" onChange={(e) => handleUpload('mobile', index, e)} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={() => handleRemove('mobile', index)} style={{ ...removeButtonStyle, padding: '6px 8px', fontSize: '11px' }}>×</button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('mobile')} style={{ ...addButtonStyle, fontSize: '11px', padding: '6px 12px' }}>+ Add</button>
        </div>
      </div>
    </div>
  );
};

// Process Steps Field
const ProcessStepsField = ({ field, value = [], onChange }) => {
  const handleAdd = () => onChange([...value, { number: String(value.length + 1).padStart(2, '0'), title: '' }]);
  const handleRemove = (index) => {
    const newSteps = [...value];
    newSteps.splice(index, 1);
    onChange(newSteps);
  };
  const handleChange = (index, key, val) => {
    const newSteps = [...value];
    newSteps[index] = { ...newSteps[index], [key]: val };
    onChange(newSteps);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{field.label}</label>
      {value.map((step, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input type="text" value={step.number || ''} onChange={(e) => handleChange(index, 'number', e.target.value)} placeholder="01" style={{ ...inputStyle, width: '60px' }} />
          <input type="text" value={step.title || ''} onChange={(e) => handleChange(index, 'title', e.target.value)} placeholder="Step Title" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => handleRemove(index)} style={removeButtonStyle}>×</button>
        </div>
      ))}
      <button type="button" onClick={handleAdd} style={addButtonStyle}>+ Add Step</button>
    </div>
  );
};

// Opportunities Field
const OpportunitiesField = ({ field, value = [], onChange }) => {
  const handleAdd = () => onChange([...value, { number: String(value.length + 1).padStart(2, '0'), title: '', description: '' }]);
  const handleRemove = (index) => {
    const newOpps = [...value];
    newOpps.splice(index, 1);
    onChange(newOpps);
  };
  const handleChange = (index, key, val) => {
    const newOpps = [...value];
    newOpps[index] = { ...newOpps[index], [key]: val };
    onChange(newOpps);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{field.label}</label>
      {value.map((opp, index) => (
        <div key={index} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input type="text" value={opp.number || ''} onChange={(e) => handleChange(index, 'number', e.target.value)} placeholder="01" style={{ ...inputStyle, width: '60px' }} />
            <input type="text" value={opp.title || ''} onChange={(e) => handleChange(index, 'title', e.target.value)} placeholder="Title" style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={() => handleRemove(index)} style={removeButtonStyle}>×</button>
          </div>
          <textarea value={opp.description || ''} onChange={(e) => handleChange(index, 'description', e.target.value)} placeholder="Description" rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      ))}
      <button type="button" onClick={handleAdd} style={addButtonStyle}>+ Add Opportunity</button>
    </div>
  );
};

// Color Palette Field
const ColorPaletteField = ({ field, value = [], onChange }) => {
  const handleAdd = () => onChange([...value, { color: '#000000', name: '' }]);
  const handleRemove = (index) => {
    const newColors = [...value];
    newColors.splice(index, 1);
    onChange(newColors);
  };
  const handleChange = (index, key, val) => {
    const newColors = [...value];
    newColors[index] = { ...newColors[index], [key]: val };
    onChange(newColors);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{field.label}</label>
      {value.map((color, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <input type="color" value={color.color || '#000000'} onChange={(e) => handleChange(index, 'color', e.target.value)} style={{ width: '40px', height: '36px', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }} />
          <input type="text" value={color.color || ''} onChange={(e) => handleChange(index, 'color', e.target.value)} placeholder="#FFFFFF" style={{ ...inputStyle, width: '100px' }} />
          <input type="text" value={color.name || ''} onChange={(e) => handleChange(index, 'name', e.target.value)} placeholder="Color Name" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => handleRemove(index)} style={removeButtonStyle}>×</button>
        </div>
      ))}
      <button type="button" onClick={handleAdd} style={addButtonStyle}>+ Add Color</button>
    </div>
  );
};

// Metrics Field
const MetricsField = ({ field, value = [], onChange }) => {
  const handleAdd = () => onChange([...value, { value: '', label: '' }]);
  const handleRemove = (index) => {
    const newMetrics = [...value];
    newMetrics.splice(index, 1);
    onChange(newMetrics);
  };
  const handleChange = (index, key, val) => {
    const newMetrics = [...value];
    newMetrics[index] = { ...newMetrics[index], [key]: val };
    onChange(newMetrics);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{field.label}</label>
      {value.map((metric, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input type="text" value={metric.value || ''} onChange={(e) => handleChange(index, 'value', e.target.value)} placeholder="+45%" style={{ ...inputStyle, width: '100px' }} />
          <input type="text" value={metric.label || ''} onChange={(e) => handleChange(index, 'label', e.target.value)} placeholder="AOV Increase" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={() => handleRemove(index)} style={removeButtonStyle}>×</button>
        </div>
      ))}
      <button type="button" onClick={handleAdd} style={addButtonStyle}>+ Add Metric</button>
    </div>
  );
};

// Related Works Field
const RelatedWorksField = ({ field, value = [], onChange, allWorks }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (workId) => {
    const newSelected = value.includes(workId)
      ? value.filter(id => id !== workId)
      : [...value, workId];
    onChange(newSelected);
  };

  const selectedWorkItems = allWorks.filter(work => value.includes(work._id));

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{field.label}</label>

      {/* Selected Works */}
      {selectedWorkItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {selectedWorkItems.map(work => (
            <div key={work._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', backgroundColor: '#eff6ff', borderRadius: '20px', fontSize: '13px' }}>
              {work.image && <img src={work.image} alt={work.title} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />}
              <span style={{ color: '#1d4ed8' }}>{work.title}</span>
              <button type="button" onClick={() => handleToggle(work._id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '16px' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <button type="button" onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
        <span>{value.length === 0 ? 'Select projects...' : `${value.length} selected`}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>

      {isOpen && (
        <div style={{ marginTop: '4px', border: '1px solid #d1d5db', borderRadius: '6px', maxHeight: '250px', overflowY: 'auto', backgroundColor: '#fff' }}>
          {allWorks.map(work => (
            <div key={work._id} onClick={() => handleToggle(work._id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', backgroundColor: value.includes(work._id) ? '#eff6ff' : '#fff' }}>
              <input type="checkbox" checked={value.includes(work._id)} onChange={() => {}} style={{ width: '16px', height: '16px' }} />
              {work.image && <img src={work.image} alt={work.title} style={{ width: '40px', height: '30px', borderRadius: '4px', objectFit: 'cover' }} />}
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{work.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Shared Styles
const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
};

const uploadButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
};

const addButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
};

const removeButtonStyle = {
  padding: '8px 12px',
  backgroundColor: '#fee2e2',
  color: '#dc2626',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

export default CaseStudySectionFields;
