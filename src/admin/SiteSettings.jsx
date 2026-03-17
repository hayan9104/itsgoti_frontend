import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { themesAPI, uploadAPI } from '../services/api';

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

  useEffect(() => {
    fetchSettings();
  }, [themeId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await themesAPI.getOne(themeId);
      const theme = response.data.data;

      setSiteTitle(theme.siteSettings?.siteTitle || theme.name || '');
      setSiteDescription(theme.siteSettings?.siteDescription || '');
      setSiteLanguage(theme.siteSettings?.siteLanguage || 'en');
      setFavicon(theme.siteSettings?.favicon || '');
      setSocialPreview(theme.siteSettings?.socialPreview || '');
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
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
              The title for Home and 4 other pages won't be updated, as they are already set. <a href="#" style={{ color: '#3b82f6' }}>Learn more</a>
            </p>
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
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
            The description for Home and 3 other pages won't be updated, as they are already set. <a href="#" style={{ color: '#3b82f6' }}>Learn more</a>
          </p>
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
          borderRadius: favicon ? '8px' : '0',
          padding: favicon ? '16px' : '0',
          paddingBottom: '32px',
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
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'favicon')} style={{ display: 'none' }} />
              </label>
            </div>

            {favicon && (
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '120px',
                  height: '80px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '8px',
                }}>
                  <img src={favicon} alt="Favicon" style={{ width: '24px', height: '24px' }} />
                </div>
                <button
                  onClick={() => removeImage('favicon')}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
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
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'socialPreview')} style={{ display: 'none' }} />
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
    </div>
  );
};

export default SiteSettings;
