import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { themesAPI, uploadAPI } from '../services/api';

// Link Icon for URL Settings
const LinkIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

// Default page slugs configuration
const defaultPageSlugs = {
  'landing': { slug: 'landing_page1', label: 'Landing Page 1', category: 'landing' },
  'landing-page-2': { slug: 'landing_page2', label: 'Landing Page 2', category: 'landing' },
  'landing-page-3': { slug: 'landing_page3', label: 'Landing Page 3', category: 'landing' },
  'home': { slug: 'home', label: 'Home', category: 'main' },
  'about': { slug: 'about', label: 'About Us', category: 'main' },
  'approach': { slug: 'approach', label: 'Our Approach', category: 'main' },
  'work': { slug: 'work', label: 'Our Work', category: 'main' },
  'case-studies': { slug: 'case-studies', label: 'Case Studies', category: 'main' },
  'contact': { slug: 'contact', label: 'Contact', category: 'main' },
};

const SiteSettings = () => {
  const { themeId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  // Site Settings
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [siteLanguage, setSiteLanguage] = useState('en');

  // Site Images
  const [favicon, setFavicon] = useState('');
  const [socialPreview, setSocialPreview] = useState('');

  const [uploadingField, setUploadingField] = useState(null);

  // URL Settings
  const [pageSlugs, setPageSlugs] = useState(defaultPageSlugs);
  const [savingSlugs, setSavingSlugs] = useState(false);
  const [slugError, setSlugError] = useState('');

  // Track original values to detect changes
  const [originalSettings, setOriginalSettings] = useState(null);
  const [originalSlugs, setOriginalSlugs] = useState(null);

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!originalSettings) return false;
    return (
      siteTitle !== originalSettings.siteTitle ||
      siteDescription !== originalSettings.siteDescription ||
      siteLanguage !== originalSettings.siteLanguage ||
      favicon !== originalSettings.favicon ||
      socialPreview !== originalSettings.socialPreview
    );
  }, [siteTitle, siteDescription, siteLanguage, favicon, socialPreview, originalSettings]);

  // Check if URL slugs have changed
  const hasSlugChanges = useMemo(() => {
    if (!originalSlugs) return false;
    return JSON.stringify(pageSlugs) !== JSON.stringify(originalSlugs);
  }, [pageSlugs, originalSlugs]);

  useEffect(() => {
    fetchSettings();
  }, [themeId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await themesAPI.getOne(themeId);
      const theme = response.data.data;

      const settings = {
        siteTitle: theme.siteSettings?.siteTitle || theme.name || '',
        siteDescription: theme.siteSettings?.siteDescription || '',
        siteLanguage: theme.siteSettings?.siteLanguage || 'en',
        favicon: theme.siteSettings?.favicon || '',
        socialPreview: theme.siteSettings?.socialPreview || '',
      };

      setSiteTitle(settings.siteTitle);
      setSiteDescription(settings.siteDescription);
      setSiteLanguage(settings.siteLanguage);
      setFavicon(settings.favicon);
      setSocialPreview(settings.socialPreview);

      // Load page slugs (merge with defaults)
      const loadedSlugs = { ...defaultPageSlugs };
      if (theme.landingPageSlugs) {
        Object.keys(theme.landingPageSlugs).forEach(key => {
          if (loadedSlugs[key]) {
            loadedSlugs[key] = { ...loadedSlugs[key], ...theme.landingPageSlugs[key] };
          }
        });
      }
      if (theme.pageSlugs) {
        Object.keys(theme.pageSlugs).forEach(key => {
          if (loadedSlugs[key]) {
            loadedSlugs[key] = { ...loadedSlugs[key], ...theme.pageSlugs[key] };
          }
        });
      }
      setPageSlugs(loadedSlugs);
      setOriginalSlugs(loadedSlugs);

      // Store original values
      setOriginalSettings(settings);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await themesAPI.update(themeId, {
        siteSettings: {
          siteTitle,
          siteDescription,
          siteLanguage,
          favicon,
          socialPreview,
        }
      });

      // Update original settings after successful save
      setOriginalSettings({
        siteTitle,
        siteDescription,
        siteLanguage,
        favicon,
        socialPreview,
      });

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingField(field);
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadAPI.single(formData);
      const imageUrl = response.data.url;

      if (field === 'favicon') {
        setFavicon(imageUrl);
      } else if (field === 'socialPreview') {
        setSocialPreview(imageUrl);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    } finally {
      setUploadingField(null);
    }
  };

  const removeImage = (field) => {
    if (field === 'favicon') {
      setFavicon('');
    } else if (field === 'socialPreview') {
      setSocialPreview('');
    }
  };

  // URL Slug handlers
  const validateSlug = (slug) => {
    return /^[a-z0-9_-]+$/.test(slug) && slug.length > 0 && slug.length <= 50;
  };

  const handleSlugChange = (pageKey, value) => {
    setPageSlugs(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        slug: value,
      },
    }));
    setSlugError('');
  };

  const saveSlugs = async () => {
    // Validate all slugs
    const slugValues = Object.values(pageSlugs).map(s => s.slug);

    for (const [key, data] of Object.entries(pageSlugs)) {
      if (!data.slug || !data.slug.trim()) {
        setSlugError(`URL path for "${data.label}" cannot be empty`);
        return;
      }
      if (!validateSlug(data.slug)) {
        setSlugError(`Invalid URL "${data.slug}". Use only lowercase letters, numbers, hyphens, and underscores.`);
        return;
      }
    }

    // Check for duplicate slugs
    const uniqueSlugs = new Set(slugValues);
    if (uniqueSlugs.size !== slugValues.length) {
      setSlugError('Each page must have a unique URL path');
      return;
    }

    setSavingSlugs(true);
    try {
      // Separate landing page slugs from other page slugs
      const landingSlugs = {};
      const otherSlugs = {};
      Object.entries(pageSlugs).forEach(([key, data]) => {
        if (data.category === 'landing') {
          landingSlugs[key] = { slug: data.slug, label: data.label };
        } else {
          otherSlugs[key] = { slug: data.slug, label: data.label };
        }
      });

      await themesAPI.update(themeId, {
        landingPageSlugs: landingSlugs,
        pageSlugs: otherSlugs,
      });
      setOriginalSlugs({ ...pageSlugs });
      setSuccessMessage('URL settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setSlugError('Failed to save URL settings. Please try again.');
    } finally {
      setSavingSlugs(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#6b7280' }}>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Site Settings</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Configure your site title, description, and images</p>
        </div>
{hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#16a34a', marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}

      {/* Site Settings Section */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '24px' }}>Site Settings</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Site Title */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              Site Title
            </label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Enter site title"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                color: '#111827',
                fontSize: '14px',
                outline: 'none',
              }}
            />
                      </div>

          {/* Site Language */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
              Site Language
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
            }}>
              <span style={{ fontSize: '14px', backgroundColor: '#e5e7eb', padding: '2px 8px', borderRadius: '4px', color: '#374151' }}>EN</span>
              <span style={{ color: '#111827', fontSize: '14px', flex: 1 }}>English</span>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>en</span>
            </div>
          </div>
        </div>

        {/* Site Description */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
            Site Description
          </label>
          <textarea
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            placeholder="Enter site description"
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              color: '#111827',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
            }}
          />
                  </div>

        {/* Preview */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
            Preview
          </label>
          <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '16px', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{window.location.hostname} :</p>
            <p style={{ fontSize: '16px', color: '#3b82f6', marginBottom: '8px', fontWeight: 500 }}>{siteTitle || 'Site Title'}</p>
            <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.5 }}>{siteDescription || 'Site description will appear here...'}</p>
          </div>
        </div>
      </div>

      {/* Site Images Section */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>Site Images</h2>

        {/* Favicon Row */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '32px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: favicon ? '#f3f4f6' : 'transparent',
          borderRadius: '8px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
            <div style={{ flex: '0 0 200px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                Favicon
              </label>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>64 x 64 pixels</p>
              <label style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#111827',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                {uploadingField === 'favicon' ? 'Uploading...' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'favicon')}
                  style={{ display: 'none' }}
                  key={favicon || 'favicon-input'}
                />
              </label>
            </div>

            {favicon && (
              <div style={{ position: 'relative', flex: 1 }}>
                <img
                  src={favicon}
                  alt="Favicon"
                  style={{
                    maxWidth: '200px',
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <button
                  onClick={() => removeImage('favicon')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Social Preview Row */}
        <div style={{
          backgroundColor: socialPreview ? '#f3f4f6' : 'transparent',
          borderRadius: socialPreview ? '8px' : '0',
          padding: socialPreview ? '16px' : '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
            <div style={{ flex: '0 0 200px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>
                Social Preview
              </label>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>1200 x 630 pixels</p>
              <label style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#111827',
                color: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                {uploadingField === 'socialPreview' ? 'Uploading...' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'socialPreview')}
                  style={{ display: 'none' }}
                  key={socialPreview || 'social-input'}
                />
              </label>
            </div>

            {socialPreview && (
              <div style={{ position: 'relative', flex: 1 }}>
                <img
                  src={socialPreview}
                  alt="Social Preview"
                  style={{
                    maxWidth: '400px',
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                />
                <button
                  onClick={() => removeImage('socialPreview')}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* URL Settings Section */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', marginTop: '24px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              backgroundColor: '#eff6ff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: '#2563eb',
            }}>
              <LinkIcon />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>URL Settings</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Customize URL paths for all pages</p>
            </div>
          </div>
          {hasSlugChanges && (
            <button
              onClick={saveSlugs}
              disabled={savingSlugs}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: savingSlugs ? '#9ca3af' : '#2563eb',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: savingSlugs ? 'not-allowed' : 'pointer',
              }}
            >
              {savingSlugs ? 'Saving...' : 'Save URLs'}
            </button>
          )}
        </div>

        {/* Error Message */}
        {slugError && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '12px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="18" height="18" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ fontSize: 14, color: '#dc2626' }}>{slugError}</span>
          </div>
        )}

        {/* Landing Pages Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Landing Pages
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {Object.entries(pageSlugs).filter(([, data]) => data.category === 'landing').map(([pageKey, data]) => (
              <div key={pageKey} style={{
                padding: '16px', backgroundColor: '#f9fafb',
                borderRadius: '8px', border: '1px solid #e5e7eb',
              }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '8px' }}>
                  {data.label}
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '10px 12px', backgroundColor: '#e5e7eb',
                    border: '1px solid #d1d5db', borderRight: 'none',
                    borderRadius: '6px 0 0 6px', fontSize: '14px', color: '#6b7280',
                  }}>/</span>
                  <input
                    type="text"
                    value={data.slug}
                    onChange={(e) => handleSlugChange(pageKey, e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    style={{
                      flex: 1, padding: '10px 12px',
                      fontSize: '14px', border: '1px solid #d1d5db',
                      borderRadius: '0 6px 6px 0', backgroundColor: '#fff',
                      fontFamily: 'monospace', minWidth: 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Pages Section */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Main Pages
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {Object.entries(pageSlugs).filter(([, data]) => data.category === 'main').map(([pageKey, data]) => (
              <div key={pageKey} style={{
                padding: '16px', backgroundColor: '#f9fafb',
                borderRadius: '8px', border: '1px solid #e5e7eb',
              }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '8px' }}>
                  {data.label}
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '10px 12px', backgroundColor: '#e5e7eb',
                    border: '1px solid #d1d5db', borderRight: 'none',
                    borderRadius: '6px 0 0 6px', fontSize: '14px', color: '#6b7280',
                  }}>/</span>
                  <input
                    type="text"
                    value={data.slug}
                    onChange={(e) => handleSlugChange(pageKey, e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    style={{
                      flex: 1, padding: '10px 12px',
                      fontSize: '14px', border: '1px solid #d1d5db',
                      borderRadius: '0 6px 6px 0', backgroundColor: '#fff',
                      fontFamily: 'monospace', minWidth: 0,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
