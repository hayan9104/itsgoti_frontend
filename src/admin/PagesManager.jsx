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
          return (
            <div
              key={page.name}
              style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '24px',
                border: hasEditor ? '2px solid #2563eb' : '1px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>
                  {page.label}
                </h3>
                {hasEditor && (
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
              </div>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                {pageData
                  ? `Last updated: ${new Date(
                      pageData.updatedAt
                    ).toLocaleDateString()}`
                  : 'Not configured yet'}
              </p>
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
