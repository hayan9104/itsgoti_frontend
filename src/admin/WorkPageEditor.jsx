import { useState, useEffect } from 'react';
import { pagesAPI, uploadAPI } from '../services/api';

const WorkPageEditor = ({ onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [formData, setFormData] = useState({
    // Hero Section
    heroTitle: 'Create with Perfection',
    heroTitleItalic: 'with',
    heroDescription: 'Designing for every customer touchpoint, from awareness to advocacy',
    // Filter Categories
    categories: ['Lifestyle', 'Branding', 'Fashion and Apparels', 'Fitness and Nutritions'],
    // CTA Section
    ctaHeading: 'Your search for agency ends here...',
    ctaDescription1: 'We combine strategy, design, and performance to create',
    ctaDescription2: 'experiences that convert.',
    ctaDescription3: "Let's build something that moves the needle.",
    ctaButtonText: 'Schedule Call',
    ctaInstantText: 'Get instant response',
  });

  useEffect(() => {
    fetchPageData();
  }, []);

  const fetchPageData = async () => {
    try {
      const response = await pagesAPI.getOne('work');
      if (response.data.data && response.data.data.content) {
        setFormData((prev) => ({
          ...prev,
          ...response.data.data.content,
        }));
      }
    } catch (error) {
      // Page not configured yet, use defaults
      console.log('Using default content for work page');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat !== categoryToRemove),
    }));
  };

  const handleCategoryKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pagesAPI.update('work', {
        name: 'work',
        title: formData.heroTitle,
        content: formData,
      });
      alert('Work page updated successfully!');
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving work page:', error);
      alert('Error saving page. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '4px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '4px',
  };

  const sectionStyle = {
    marginBottom: '32px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  };

  const categoryTagStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#e5e7eb',
    borderRadius: '20px',
    fontSize: '14px',
    color: '#374151',
  };

  const removeButtonStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    color: '#6b7280',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
      {/* Hero Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Hero Section</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Main Title</label>
          <input
            type="text"
            name="heroTitle"
            value={formData.heroTitle}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Create with Perfection"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Italic Word</label>
          <input
            type="text"
            name="heroTitleItalic"
            value={formData.heroTitleItalic}
            onChange={handleChange}
            style={inputStyle}
            placeholder="with"
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            This word will appear in italic style within the title
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Description</label>
          <textarea
            name="heroDescription"
            value={formData.heroDescription}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            placeholder="Designing for every customer touchpoint..."
          />
        </div>
      </div>

      {/* Filter Categories Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Filter Categories</h3>
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          Add categories to filter projects. "All" is added automatically. Projects will be filtered by matching category or tags.
        </p>

        {/* Current Categories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {/* All tag (non-removable) */}
          <span style={{ ...categoryTagStyle, backgroundColor: '#2563eb', color: '#fff' }}>
            All
          </span>
          {formData.categories.map((category, index) => (
            <span key={index} style={categoryTagStyle}>
              {category}
              <button
                type="button"
                onClick={() => handleRemoveCategory(category)}
                style={removeButtonStyle}
                title="Remove category"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>

        {/* Add New Category */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={handleCategoryKeyPress}
            style={{ ...inputStyle, flex: 1, marginTop: 0 }}
            placeholder="Enter new category name"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            style={{
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            Add Category
          </button>
        </div>
      </div>

      {/* CTA Section */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>CTA Section (Orange Box)</h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Heading</label>
          <input
            type="text"
            name="ctaHeading"
            value={formData.ctaHeading}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Your search for agency ends here..."
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Description Line 1</label>
          <input
            type="text"
            name="ctaDescription1"
            value={formData.ctaDescription1}
            onChange={handleChange}
            style={inputStyle}
            placeholder="We combine strategy, design, and performance to create"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Description Line 2</label>
          <input
            type="text"
            name="ctaDescription2"
            value={formData.ctaDescription2}
            onChange={handleChange}
            style={inputStyle}
            placeholder="experiences that convert."
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Description Line 3</label>
          <input
            type="text"
            name="ctaDescription3"
            value={formData.ctaDescription3}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Let's build something that moves the needle."
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Button Text</label>
          <input
            type="text"
            name="ctaButtonText"
            value={formData.ctaButtonText}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Schedule Call"
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Instant Response Text</label>
          <input
            type="text"
            name="ctaInstantText"
            value={formData.ctaInstantText}
            onChange={handleChange}
            style={inputStyle}
            placeholder="Get instant response"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', position: 'sticky', bottom: 0, backgroundColor: '#fff', padding: '16px 0' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 20px',
            backgroundColor: '#e5e7eb',
            color: '#374151',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: '#fff',
            borderRadius: '6px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default WorkPageEditor;
