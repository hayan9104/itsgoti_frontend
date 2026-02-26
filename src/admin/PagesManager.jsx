import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import WorkPageEditor from './WorkPageEditor';
import AboutPageEditor from './AboutPageEditor';
import ContactPageEditor from './ContactPageEditor';
import CaseStudyPageEditor from './CaseStudyPageEditor';
import HomePageEditor from './HomePageEditor';

const PagesManager = () => {
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState(null);
  const [togglingPage, setTogglingPage] = useState(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pageToHide, setPageToHide] = useState(null);

  // Pages that use the new visual editor
  const visualEditorPages = ['about', 'work', 'contact', 'approach', 'footer', 'landing', 'home', 'landing-page-2'];

  const defaultPages = [
    { name: 'landing', label: 'Landing Page' },
    { name: 'landing-page-2', label: 'Landing Page 2 (Shopify)' },
    { name: 'home', label: 'Home Page' },
    { name: 'about', label: 'About Us' },
    { name: 'approach', label: 'Our Approach' },
    { name: 'work', label: 'Our Work' },
    { name: 'case-study', label: 'Case Study' },
    { name: 'contact', label: 'Contact' },
    { name: 'footer', label: 'Footer' },
  ];

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await pagesAPI.getAll();
      setPages(response.data.data);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPageData = (pageName) => {
    return pages.find((p) => p.name === pageName);
  };

  // Toggle page visibility (published status)
  const togglePageVisibility = async (pageName, currentStatus) => {
    const isHiding = currentStatus !== false; // Will be hiding if currently published

    // If hiding a page, show redirect selection modal
    if (isHiding) {
      setPageToHide(pageName);
      setShowRedirectModal(true);
      return;
    }

    // If showing a page (un-hiding), just toggle it
    setTogglingPage(pageName);
    try {
      await pagesAPI.update(pageName, { published: true, redirectTo: null });
      await fetchPages();
    } catch (error) {
      console.error('Error toggling page visibility:', error);
      if (error.response?.status === 404) {
        try {
          await pagesAPI.update(pageName, { published: true, content: {} });
          await fetchPages();
        } catch (createError) {
          console.error('Error creating page:', createError);
        }
      }
    } finally {
      setTogglingPage(null);
    }
  };

  // Handle redirect selection and hide page
  const handleHidePageWithRedirect = async (redirectTo) => {
    if (!pageToHide) return;

    setTogglingPage(pageToHide);
    setShowRedirectModal(false);

    try {
      await pagesAPI.update(pageToHide, { published: false, redirectTo });
      await fetchPages();
    } catch (error) {
      console.error('Error hiding page:', error);
      if (error.response?.status === 404) {
        try {
          await pagesAPI.update(pageToHide, { published: false, redirectTo, content: {} });
          await fetchPages();
        } catch (createError) {
          console.error('Error creating page:', createError);
        }
      }
    } finally {
      setTogglingPage(null);
      setPageToHide(null);
    }
  };

  // Cancel hiding page
  const cancelHidePage = () => {
    setShowRedirectModal(false);
    setPageToHide(null);
  };

  // Get available pages for redirect (excluding the page being hidden and footer)
  const getAvailableRedirectPages = () => {
    return defaultPages.filter(p => {
      // Exclude the page being hidden
      if (p.name === pageToHide) return false;
      // Exclude footer (not a navigable page)
      if (p.name === 'footer') return false;
      // Exclude hidden pages
      const pageData = getPageData(p.name);
      if (pageData?.published === false) return false;
      return true;
    });
  };

  const handleClose = () => {
    setSelectedPage(null);
    fetchPages(); // Refresh the list after editing
  };

  const renderPageEditor = () => {
    if (!selectedPage) return null;

    switch (selectedPage.name) {
      case 'work':
        return <WorkPageEditor onClose={handleClose} onSave={fetchPages} />;
      case 'about':
        return <AboutPageEditor onClose={handleClose} onSave={fetchPages} />;
      case 'contact':
        return <ContactPageEditor onClose={handleClose} onSave={fetchPages} />;
      case 'case-study':
        return <CaseStudyPageEditor onClose={handleClose} onSave={fetchPages} />;
      case 'home':
        return <HomePageEditor onClose={handleClose} onSave={fetchPages} />;
      default:
        return (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
            <p>
              Page editor will be customized based on Figma design for each
              page.
            </p>
            <p style={{ marginTop: '8px' }}>
              Each page will have specific editable sections.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '24px' }}>
              <button
                onClick={handleClose}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Pages</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {defaultPages.map((page) => {
          const pageData = getPageData(page.name);
          const hasEditor = ['work', 'about', 'contact', 'case-study', 'home', 'approach', 'footer', 'landing', 'landing-page-2'].includes(page.name);
          const isPublished = pageData?.published !== false; // Default to true if not set
          const isToggling = togglingPage === page.name;

          return (
            <div
              key={page.name}
              style={{
                backgroundColor: isPublished ? '#fff' : '#f9fafb',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '24px',
                border: !isPublished ? '2px solid #ef4444' : hasEditor ? '2px solid #2563eb' : '1px solid transparent',
                opacity: isPublished ? 1 : 0.7,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Header with Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: isPublished ? '#111827' : '#6b7280',
                    textDecoration: isPublished ? 'none' : 'line-through',
                  }}>
                    {page.label}
                  </h3>
                  {hasEditor && isPublished && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 500,
                    }}>
                      Editable
                    </span>
                  )}
                  {!isPublished && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 500,
                    }}>
                      Hidden
                    </span>
                  )}
                </div>

                {/* Page Visibility Toggle */}
                <button
                  onClick={() => togglePageVisibility(page.name, pageData?.published)}
                  disabled={isToggling}
                  title={isPublished ? 'Click to hide this page' : 'Click to show this page'}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: isToggling ? '#d1d5db' : isPublished ? '#22c55e' : '#e5e7eb',
                    border: 'none',
                    cursor: isToggling ? 'wait' : 'pointer',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: isPublished ? '23px' : '3px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isToggling && (
                      <div style={{
                        width: '10px',
                        height: '10px',
                        border: '2px solid #d1d5db',
                        borderTopColor: '#2563eb',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                    )}
                  </div>
                </button>
              </div>

              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                {pageData
                  ? `Last updated: ${new Date(
                      pageData.updatedAt
                    ).toLocaleDateString()}`
                  : 'Not configured yet'}
              </p>
              {/* Show redirect info for hidden pages */}
              {!isPublished && pageData?.redirectTo && (
                <p style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  Redirects to: {pageData.redirectTo}
                </p>
              )}
              <button
                onClick={() => {
                  // Use visual editor for pages in visualEditorPages array
                  if (visualEditorPages.includes(page.name)) {
                    navigate(`/admin/pages/${page.name}/edit`);
                  } else {
                    setSelectedPage(page);
                  }
                }}
                style={{
                  color: hasEditor ? '#2563eb' : '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: hasEditor ? 'pointer' : 'default',
                  fontSize: '14px',
                  padding: 0,
                  fontWeight: hasEditor ? 500 : 400,
                }}
                disabled={!hasEditor}
              >
                {hasEditor ? 'Edit Content' : 'Coming Soon'}
              </button>
            </div>
          );
        })}
      </div>

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Redirect Selection Modal */}
      {showRedirectModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            margin: '16px',
          }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '8px',
              }}>
                Hide "{defaultPages.find(p => p.name === pageToHide)?.label}" Page
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5',
              }}>
                Select which page visitors should be redirected to when they try to access this hidden page:
              </p>
            </div>

            {/* Page Options */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '24px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
              {getAvailableRedirectPages().map((page) => {
                // Get the route path for this page
                const routePath = page.name === 'landing' ? '/'
                  : page.name === 'landing-page-2' ? '/landing_page2'
                  : page.name === 'case-study' ? '/case-studies'
                  : `/${page.name}`;

                return (
                  <button
                    key={page.name}
                    onClick={() => handleHidePageWithRedirect(routePath)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f9ff';
                      e.currentTarget.style.borderColor = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#111827',
                        marginBottom: '2px',
                      }}>
                        {page.label}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                      }}>
                        Redirect to: {routePath}
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Cancel Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelHidePage}
                style={{
                  padding: '8px 16px',
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
            </div>
          </div>
        </div>
      )}

      {/* Page Editor Modal */}
      {selectedPage && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxWidth: ['about', 'contact', 'case-study', 'home'].includes(selectedPage.name) ? '1000px' : '672px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            margin: '16px',
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                  Edit {selectedPage.label}
                </h2>
                <button
                  onClick={handleClose}
                  style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <svg
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {renderPageEditor()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagesManager;
