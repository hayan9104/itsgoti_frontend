import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { themesAPI } from '../services/api';

const ThemePagesManager = () => {
  const { themeId } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultLandingPage, setDefaultLandingPage] = useState('landing');
  const [savingDefault, setSavingDefault] = useState(false);

  const defaultPages = [
    { name: 'landing', label: 'Landing Page' },
    { name: 'landing-page-2', label: 'Landing Page 2 (Shopify)' },
    { name: 'landing-page-3', label: 'Landing Page 3 (Shopify Pro)' },
    { name: 'home', label: 'Home Page' },
    { name: 'about', label: 'About Us' },
    { name: 'approach', label: 'Our Approach' },
    { name: 'work', label: 'Our Work' },
    { name: 'case-study', label: 'Case Study' },
    { name: 'contact', label: 'Contact' },
    { name: 'footer', label: 'Footer' },
  ];

  const editablePages = ['about', 'work', 'contact', 'approach', 'footer', 'landing', 'home', 'landing-page-2', 'landing-page-3'];

  useEffect(() => {
    fetchTheme();
  }, [themeId]);

  const fetchTheme = async () => {
    try {
      const response = await themesAPI.getOne(themeId);
      const themeData = response.data.data;
      setTheme(themeData);
      setDefaultLandingPage(themeData.defaultLandingPage || 'landing');
    } catch (error) {
      console.error('Error fetching theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDefaultLandingChange = async (newDefault) => {
    if (savingDefault) return;

    setSavingDefault(true);
    try {
      await themesAPI.update(themeId, { defaultLandingPage: newDefault });
      setDefaultLandingPage(newDefault);
    } catch (error) {
      console.error('Error updating default landing page:', error);
    } finally {
      setSavingDefault(false);
    }
  };

  const handleEditPage = (pageName) => {
    navigate(`/goti/admin/themes/${themeId}/pages/${pageName}/edit`);
  };

  if (loading) {
    return <div style={{ padding: '40px 0', color: '#6b7280', textAlign: 'center' }}>Loading...</div>;
  }

  if (!theme) {
    return <div style={{ padding: '40px 0', color: '#dc2626', textAlign: 'center' }}>Theme not found</div>;
  }

  // Landing page options for the dropdown
  const landingPageOptions = [
    { value: 'landing', label: 'Landing Page' },
    { value: 'landing-page-2', label: 'Landing Page 2 (Shopify)' },
    { value: 'landing-page-3', label: 'Landing Page 3 (Shopify Pro)' },
  ];

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button
            onClick={() => navigate('/goti/admin/themes')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, display: 'flex', alignItems: 'center', color: '#6b7280',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>
            {theme.name}
          </h1>
          {theme.isLive && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5',
              padding: '2px 8px', borderRadius: 10, border: '1px solid #a7f3d0',
            }}>
              Live
            </span>
          )}
          {!theme.isLive && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#6b7280', backgroundColor: '#f3f4f6',
              padding: '2px 8px', borderRadius: 10, border: '1px solid #e5e7eb',
            }}>
              Draft
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: '#6b7280', paddingLeft: 36 }}>
          Select a page to edit its content within this theme.
        </p>
      </div>

      {/* Default Landing Page Dropdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        padding: '16px 20px',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <label style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
        }}>
          Default First Page:
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={defaultLandingPage}
            onChange={(e) => handleDefaultLandingChange(e.target.value)}
            disabled={savingDefault}
            style={{
              padding: '8px 36px 8px 12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
              backgroundColor: savingDefault ? '#f3f4f6' : '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              cursor: savingDefault ? 'not-allowed' : 'pointer',
              appearance: 'none',
              minWidth: '220px',
            }}
          >
            {landingPageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Dropdown arrow */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
          {/* Saving indicator */}
          {savingDefault && (
            <div style={{
              position: 'absolute',
              right: '36px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}>
              <div style={{
                width: '14px',
                height: '14px',
                border: '2px solid #d1d5db',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
          )}
        </div>
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
          This page will show when visitors open your site
        </span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Pages Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {defaultPages.map((page) => {
          const isEditable = editablePages.includes(page.name);
          const hasContent = theme.pages && theme.pages[page.name];

          return (
            <div
              key={page.name}
              style={{
                backgroundColor: '#fff', borderRadius: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: 20,
                border: isEditable ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
                cursor: isEditable ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
              onClick={() => isEditable && handleEditPage(page.name)}
              onMouseEnter={(e) => {
                if (isEditable) {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (isEditable) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              {/* Page Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 8,
                backgroundColor: isEditable ? '#eff6ff' : '#f9fafb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isEditable ? '#2563eb' : '#9ca3af'} strokeWidth="1.5">
                  <path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              <h3 style={{
                fontSize: 15, fontWeight: 600,
                color: isEditable ? '#111827' : '#9ca3af',
                marginBottom: 4,
              }}>
                {page.label}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {hasContent ? (
                  <span style={{ fontSize: 12, color: '#059669' }}>Has content</span>
                ) : (
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>No content yet</span>
                )}
              </div>

              {isEditable && (
                <div style={{ marginTop: 12 }}>
                  <span style={{
                    fontSize: 13, color: '#2563eb', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    Edit content
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThemePagesManager;
