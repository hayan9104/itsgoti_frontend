import { useState, useEffect } from 'react';
import { themeColorsAPI } from '../services/api';
import SectionColorEditor from './components/SectionColorEditor';
import ColorPicker from './components/ColorPicker';

const pageOptions = [
  { value: 'landing-page-2', label: 'Landing Page 2' },
  { value: 'landing-page-3', label: 'Landing Page 3' },
];

const ThemeStyleEditor = () => {
  const [selectedPage, setSelectedPage] = useState('landing-page-3');
  const [themeData, setThemeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showGlobalColors, setShowGlobalColors] = useState(false);

  // Fetch theme data
  useEffect(() => {
    fetchThemeData();
  }, [selectedPage]);

  const fetchThemeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await themeColorsAPI.getByPage(selectedPage);
      setThemeData(response.data.data);
      setHasChanges(false);
    } catch (err) {
      console.error('Error fetching theme:', err);
      setError('Failed to load theme colors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle section color change
  const handleSectionColorChange = (sectionId, colors) => {
    setThemeData(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.sectionId === sectionId
          ? { ...section, colors }
          : section
      ),
    }));
    setHasChanges(true);
  };

  // Handle global color change
  const handleGlobalColorChange = (colorKey, value) => {
    setThemeData(prev => ({
      ...prev,
      globalColors: {
        ...prev.globalColors,
        [colorKey]: value,
      },
    }));
    setHasChanges(true);
  };

  // Save all changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await themeColorsAPI.upsert(selectedPage, {
        globalColors: themeData.globalColors,
        sections: themeData.sections,
        pageDisplayName: themeData.pageDisplayName,
      });

      setSuccessMessage('Theme colors saved successfully!');
      setHasChanges(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving theme:', err);
      setError('Failed to save theme colors. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all colors to defaults? This cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await themeColorsAPI.reset(selectedPage);
      await fetchThemeData();

      setSuccessMessage('Theme colors reset to defaults!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error resetting theme:', err);
      setError('Failed to reset theme colors. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Preview in new tab
  const handlePreview = () => {
    const previewUrl = selectedPage === 'landing-page-3'
      ? '/landing_page3'
      : selectedPage === 'landing-page-2'
        ? '/landing_page2'
        : '/';
    window.open(previewUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#6b7280',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg
            style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }}
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <p>Loading theme colors...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
            Color Styling
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Customize colors for each section of your landing pages
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Page selector */}
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {pageOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Preview button */}
          <button
            onClick={handlePreview}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Preview
          </button>

          {/* Reset button */}
          <button
            onClick={handleReset}
            disabled={saving}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            Reset to Defaults
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: hasChanges ? '#2563eb' : '#9ca3af',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {saving ? (
              <>
                <svg
                  style={{ animation: 'spin 1s linear infinite' }}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '8px',
          color: '#16a34a',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <path d="M22 4L12 14.01l-3-3" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '8px',
          color: '#d97706',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" />
          </svg>
          You have unsaved changes. Click "Save Changes" to apply them.
        </div>
      )}

      {/* Global Colors Section */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        marginBottom: '24px',
        overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setShowGlobalColors(!showGlobalColors)}
          style={{
            width: '100%',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: showGlobalColors ? '#f0f9ff' : '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                Global Colors
              </h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>
                Colors that apply to all sections as defaults
              </p>
            </div>
          </div>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            style={{
              transform: showGlobalColors ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showGlobalColors && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e5e7eb',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
          }}>
            <ColorPicker
              label="Primary Background"
              description="Default background color for sections"
              value={themeData?.globalColors?.backgroundColor || '#fffdf8'}
              onChange={(value) => handleGlobalColorChange('backgroundColor', value)}
            />
            <ColorPicker
              label="Mobile Background Color"
              description="Background color for mobile devices"
              value={themeData?.globalColors?.mobileBackgroundColor || ''}
              onChange={(value) => handleGlobalColorChange('mobileBackgroundColor', value)}
            />
            <ColorPicker
              label="Primary Text Color"
              description="Default text color"
              value={themeData?.globalColors?.textColor || '#000000'}
              onChange={(value) => handleGlobalColorChange('textColor', value)}
            />
            <ColorPicker
              label="Primary Heading Color"
              description="Default heading color"
              value={themeData?.globalColors?.headingColor || '#000000'}
              onChange={(value) => handleGlobalColorChange('headingColor', value)}
            />
            <ColorPicker
              label="Primary Accent Color"
              description="Primary accent/brand color"
              value={themeData?.globalColors?.accentColor || '#E1FFA0'}
              onChange={(value) => handleGlobalColorChange('accentColor', value)}
            />
          </div>
        )}
      </div>

      {/* Section Colors */}
      <div>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#111827',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Section Colors
        </h2>

        {themeData?.sections?.length > 0 ? (
          themeData.sections.map((section) => (
            <SectionColorEditor
              key={section.sectionId}
              section={section}
              colors={section.colors || {}}
              onChange={(colors) => handleSectionColorChange(section.sectionId, colors)}
            />
          ))
        ) : (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            color: '#6b7280',
          }}>
            <p>No sections found for this page.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeStyleEditor;
