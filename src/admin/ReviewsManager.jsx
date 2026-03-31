import { useState, useEffect, useRef } from 'react';
import { reviewsAPI, uploadAPI } from '../services/api';

const AVAILABLE_PAGES = [
  { id: 'home', label: 'Home Page', color: '#2563eb' },
  { id: 'about', label: 'About Page', color: '#7c3aed' },
  { id: 'landing', label: 'Landing Page 1', color: '#059669' },
  { id: 'landing-page-2', label: 'Landing Page 2', color: '#d97706' },
  { id: 'landing-page-3', label: 'Landing Page 3', color: '#dc2626' },
];

// Render text with *italic* syntax
const renderTitleWithItalics = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

// Quote icon SVG
const QuoteIcon = () => (
  <svg width="60" height="48" viewBox="0 0 60 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 48V28.8C0 23.4667 0.933333 18.6667 2.8 14.4C4.66667 10.1333 7.46667 6.4 11.2 3.2C14.9333 0 19.6 -2.13333 25.2 -3.2V8C21.7333 8.53333 18.8 9.86667 16.4 12C14 14.1333 12.8 17.0667 12.8 20.8V48H0ZM34.8 48V28.8C34.8 23.4667 35.7333 18.6667 37.6 14.4C39.4667 10.1333 42.2667 6.4 46 3.2C49.7333 0 54.4 -2.13333 60 -3.2V8C56.5333 8.53333 53.6 9.86667 51.2 12C48.8 14.1333 47.6 17.0667 47.6 20.8V48H34.8Z" fill="#000"/>
  </svg>
);

const ReviewsManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null); // Track original data for change detection

  // Settings state
  const [settings, setSettings] = useState({
    sectionTitle: 'Looks what our client said..',
    showHeadingOnPages: ['home', 'about', 'landing', 'landing-page-2', 'landing-page-3'],
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [formData, setFormData] = useState({
    authorName: '',
    authorRole: '',
    authorImage: '',
    quote1: '',
    quote2: '',
    stat1Value: '',
    stat1Label: '',
    stat2Value: '',
    stat2Label: '',
    stat3Value: '',
    stat3Label: '',
    showOnPages: [],
    active: true,
  });

  const fileInputRef = useRef(null);

  // Check if form has changes compared to original
  const hasChanges = () => {
    if (isEditing) return true; // Always enable for new reviews
    if (!originalFormData) return false;

    return JSON.stringify(formData) !== JSON.stringify(originalFormData);
  };

  // Check if settings have changed
  const hasSettingsChanges = () => {
    if (!originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  useEffect(() => {
    fetchReviews();
    fetchSettings();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewsAPI.getAll();
      const reviewsData = res.data.data || [];
      setReviews(reviewsData);
      // Select first review by default
      if (reviewsData.length > 0 && !selectedReview) {
        selectReview(reviewsData[0]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await reviewsAPI.getSettings();
      const settingsData = res.data.data || {};
      const newSettings = {
        sectionTitle: settingsData.sectionTitle || 'Looks what our client said..',
        showHeadingOnPages: settingsData.showHeadingOnPages || [],
      };
      setSettings(newSettings);
      setOriginalSettings(newSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await reviewsAPI.updateSettings(settings);
      setOriginalSettings({ ...settings });
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const selectReview = (review) => {
    setSelectedReview(review);
    const formDataObj = {
      authorName: review.authorName || '',
      authorRole: review.authorRole || '',
      authorImage: review.authorImage || '',
      quote1: review.quote1 || '',
      quote2: review.quote2 || '',
      stat1Value: review.stat1Value || '',
      stat1Label: review.stat1Label || '',
      stat2Value: review.stat2Value || '',
      stat2Label: review.stat2Label || '',
      stat3Value: review.stat3Value || '',
      stat3Label: review.stat3Label || '',
      showOnPages: review.showOnPages || [],
      active: review.active !== false,
    };
    setFormData(formDataObj);
    setOriginalFormData(formDataObj); // Track original for change detection
    setIsEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await uploadAPI.single(uploadData);
      setFormData(prev => ({ ...prev, authorImage: res.data.url }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.authorName || !formData.quote1) {
      alert('Please fill in author name and review text');
      return;
    }

    setSaving(true);
    try {
      if (selectedReview && !isEditing) {
        // Update existing
        await reviewsAPI.update(selectedReview._id, formData);
        setOriginalFormData({ ...formData }); // Reset original after save
      } else {
        // Create new
        await reviewsAPI.create(formData);
      }
      await fetchReviews();
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving review:', error);
      alert('Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewsAPI.delete(id);
      setSelectedReview(null);
      await fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const handleAddNew = () => {
    setSelectedReview(null);
    setIsEditing(true);
    setFormData({
      authorName: '',
      authorRole: '',
      authorImage: '',
      quote1: '',
      quote2: '',
      stat1Value: '+45%',
      stat1Label: 'AOV (Average Order Value)',
      stat2Value: '+24%',
      stat2Label: 'CTR (Click-through rate)',
      stat3Value: '+16%',
      stat3Label: 'Return-rate per customer',
      showOnPages: [],
      active: true,
    });
  };

  const handlePageToggle = (pageId) => {
    setFormData(prev => {
      const newPages = prev.showOnPages.includes(pageId)
        ? prev.showOnPages.filter(p => p !== pageId)
        : [...prev.showOnPages, pageId];
      return { ...prev, showOnPages: newPages };
    });
  };

  const handleHeadingPageToggle = (pageId) => {
    setSettings(prev => {
      const newPages = prev.showHeadingOnPages.includes(pageId)
        ? prev.showHeadingOnPages.filter(p => p !== pageId)
        : [...prev.showHeadingOnPages, pageId];
      return { ...prev, showHeadingOnPages: newPages };
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <div style={{ color: '#6b7280' }}>Loading reviews...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 150px)', minHeight: 600 }}>
      {/* Left Side - Review List & Form (entire left side scrolls) */}
      <div style={{ width: '45%', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', paddingRight: 8 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Reviews</h1>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Manage client testimonials displayed across pages
            </p>
          </div>
          <button
            onClick={handleAddNew}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Review
          </button>
        </div>

        {/* Section Settings */}
        <div style={{
          backgroundColor: '#fefce8',
          borderRadius: 12,
          border: '1px solid #fef08a',
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <svg width="16" height="16" fill="none" stroke="#ca8a04" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#854d0e' }}>Section Settings</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#713f12', marginBottom: 4 }}>
              Section Heading
            </label>
            <input
              type="text"
              value={settings.sectionTitle}
              onChange={(e) => setSettings(prev => ({ ...prev, sectionTitle: e.target.value }))}
              placeholder="Looks what our client said.."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #fde047',
                fontSize: 14,
                backgroundColor: '#fff',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ fontSize: 11, color: '#a16207', marginTop: 4, fontStyle: 'italic' }}>
              Use *text* for italic styling (e.g., "*Looks* what our client said..")
            </p>
          </div>

          <button
            onClick={saveSettings}
            disabled={savingSettings || !hasSettingsChanges()}
            style={{
              padding: '6px 14px',
              backgroundColor: savingSettings || !hasSettingsChanges() ? '#fef08a' : '#eab308',
              color: savingSettings || !hasSettingsChanges() ? '#a16207' : '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: savingSettings || !hasSettingsChanges() ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Review List */}
        <div style={{
          backgroundColor: '#f9fafb',
          borderRadius: 12,
          padding: 12,
        }}>
          {reviews.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#6b7280', padding: 20 }}>
              No reviews yet. Add your first review!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviews.map((review) => (
                <div
                  key={review._id}
                  onClick={() => selectReview(review)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    backgroundColor: selectedReview?._id === review._id ? '#eff6ff' : '#fff',
                    border: selectedReview?._id === review._id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {review.authorImage ? (
                    <img
                      src={review.authorImage}
                      alt={review.authorName}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#6b7280', fontWeight: 600, fontSize: 14,
                    }}>
                      {review.authorName?.charAt(0) || '?'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: 14 }}>
                      {review.authorName}
                    </p>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {review.authorRole || 'No role specified'}
                    </p>
                  </div>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: review.active ? '#22c55e' : '#e5e7eb',
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: 20,
        }}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              {isEditing ? 'Add New Review' : (selectedReview ? 'Edit Review' : 'Select a review')}
            </h3>

            {(selectedReview || isEditing) && (
              <>
                {/* Author Image */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                    Author Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {formData.authorImage ? (
                      <img src={formData.authorImage} alt="Author" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </div>
                </div>

                {/* Author Name & Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                      Author Name *
                    </label>
                    <input
                      type="text"
                      value={formData.authorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                      placeholder="Joyce Mia"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                      Role/Position
                    </label>
                    <input
                      type="text"
                      value={formData.authorRole}
                      onChange={(e) => setFormData(prev => ({ ...prev, authorRole: e.target.value }))}
                      placeholder="Founder, Company"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Quote */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                    Review Text (Paragraph 1) *
                  </label>
                  <textarea
                    value={formData.quote1}
                    onChange={(e) => setFormData(prev => ({ ...prev, quote1: e.target.value }))}
                    placeholder="Lorem ipsum dolor sit amet consectetur..."
                    rows={2}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                    Review Text (Paragraph 2)
                  </label>
                  <textarea
                    value={formData.quote2}
                    onChange={(e) => setFormData(prev => ({ ...prev, quote2: e.target.value }))}
                    placeholder="Additional quote text..."
                    rows={2}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Statistics */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    Statistics
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[1, 2, 3].map((num) => (
                      <div key={num} style={{ backgroundColor: '#f9fafb', padding: 10, borderRadius: 8 }}>
                        <input
                          type="text"
                          value={formData[`stat${num}Value`]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`stat${num}Value`]: e.target.value }))}
                          placeholder="+45%"
                          style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 14, fontWeight: 600, textAlign: 'center', marginBottom: 6, boxSizing: 'border-box' }}
                        />
                        <input
                          type="text"
                          value={formData[`stat${num}Label`]}
                          onChange={(e) => setFormData(prev => ({ ...prev, [`stat${num}Label`]: e.target.value }))}
                          placeholder="AOV"
                          style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #d1d5db', fontSize: 11, textAlign: 'center', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Show on Pages */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                    Show on Pages
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {AVAILABLE_PAGES.map(page => (
                      <label
                        key={page.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: formData.showOnPages.includes(page.id) ? `2px solid ${page.color}` : '1px solid #e5e7eb',
                          backgroundColor: formData.showOnPages.includes(page.id) ? `${page.color}10` : '#fff',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.showOnPages.includes(page.id)}
                          onChange={() => handlePageToggle(page.id)}
                          style={{ accentColor: page.color }}
                        />
                        {page.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Active Toggle */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    />
                    <span style={{ fontSize: 13, color: '#374151' }}>Active (visible on website)</span>
                  </label>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="submit"
                    disabled={saving || (!isEditing && !hasChanges())}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      backgroundColor: saving || (!isEditing && !hasChanges()) ? '#93c5fd' : '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: saving || (!isEditing && !hasChanges()) ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      fontSize: 14,
                    }}
                  >
                    {saving ? 'Saving...' : (isEditing ? 'Add Review' : 'Save Changes')}
                  </button>
                  {selectedReview && !isEditing && (
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedReview._id)}
                      style={{
                        padding: '10px 16px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: 14,
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      {/* Right Side - Live Preview */}
      <div style={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Live Preview</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#eab308' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#22c55e' }} />
          </div>
        </div>

        <div style={{
          flex: 1,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowY: 'auto',
        }}>
          {/* Section Title */}
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 36,
            fontWeight: 400,
            textAlign: 'center',
            marginBottom: 40,
          }}>
            {renderTitleWithItalics(settings.sectionTitle)}
          </h2>

          {/* Review Content */}
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
            {/* Left - Quote */}
            <div style={{ flex: 1 }}>
              <QuoteIcon />
              <p style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: '#000',
                marginTop: 20,
                marginBottom: 12,
              }}>
                {formData.quote1 || 'Lorem ipsum dolor sit amet consectetur. Ullamcorper amet arcu quis elementum. Convallis purus mauris at in.'}
              </p>
              {formData.quote2 && (
                <p style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: '#000',
                  marginBottom: 24,
                }}>
                  {formData.quote2}
                </p>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
                {[1, 2, 3].map((num) => (
                  formData[`stat${num}Value`] && (
                    <div key={num} style={{ borderLeft: num > 1 ? '1px solid #e5e7eb' : 'none', paddingLeft: num > 1 ? 24 : 0 }}>
                      <p style={{ fontSize: 28, fontWeight: 600, color: '#000', margin: 0 }}>
                        {formData[`stat${num}Value`]}
                      </p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>
                        {formData[`stat${num}Label`]}
                      </p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Right - Author */}
            <div style={{ textAlign: 'center', minWidth: 160 }}>
              {formData.authorImage ? (
                <img
                  src={formData.authorImage}
                  alt={formData.authorName}
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginBottom: 16,
                  }}
                />
              ) : (
                <div style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="48" height="48" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <p style={{ fontWeight: 600, fontSize: 18, color: '#000', margin: 0 }}>
                {formData.authorName || 'Author Name'}
              </p>
              <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic', margin: '4px 0 0' }}>
                {formData.authorRole || 'Role/Position'}
              </p>
            </div>
          </div>

          {/* Navigation Arrows (visual only) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 40 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af',
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              border: '1px solid #111827',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#111827',
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsManager;
