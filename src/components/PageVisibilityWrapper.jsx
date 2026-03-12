import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { pagesAPI } from '../services/api';

/**
 * Wrapper component that checks if a page is published before rendering.
 * If the page is not published, redirects to the configured redirect page or fallback.
 * Editor mode (?editor=true) always shows the page.
 */
const PageVisibilityWrapper = ({ pageName, children, fallbackPath = '/home' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [redirectPath, setRedirectPath] = useState(fallbackPath);
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';

  useEffect(() => {
    const checkPageVisibility = async () => {
      // Always show in editor mode
      if (isEditorMode) {
        setIsPublished(true);
        setIsLoading(false);
        return;
      }

      try {
        const response = await pagesAPI.getOne(pageName);
        const pageData = response.data.data;
        // Default to published if not explicitly set to false
        const published = pageData?.published !== false;
        setIsPublished(published);

        // If page has a custom redirect, use it
        if (!published && pageData?.redirectTo) {
          setRedirectPath(pageData.redirectTo);
        } else {
          setRedirectPath(fallbackPath);
        }
      } catch (error) {
        // If page doesn't exist, default to showing it
        if (error.response?.status === 404) {
          setIsPublished(true);
        } else {
          console.error('Error checking page visibility:', error);
          setIsPublished(true); // Default to showing on error
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkPageVisibility();
  }, [pageName, isEditorMode, fallbackPath]);

  // Show loading state briefly
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#fff',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTopColor: '#2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect if page is not published
  if (!isPublished) {
    return <Navigate to={redirectPath} replace />;
  }

  // Page is published, render children
  return children;
};

export default PageVisibilityWrapper;
