import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { pagesAPI } from '../services/api';

/**
 * Wrapper component that checks if a page is published before rendering.
 * Shows content immediately, checks visibility in background.
 * If the page is not published, redirects to the configured redirect page or fallback.
 * Editor mode (?editor=true) always shows the page.
 */
const PageVisibilityWrapper = ({ pageName, children, fallbackPath = '/home' }) => {
  const [isPublished, setIsPublished] = useState(true); // Default to published - show immediately
  const [redirectPath, setRedirectPath] = useState(fallbackPath);
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';

  useEffect(() => {
    // Always show in editor mode
    if (isEditorMode) return;

    // Check visibility in background - don't block rendering
    const checkPageVisibility = async () => {
      try {
        const response = await pagesAPI.getOne(pageName);
        const pageData = response.data.data;
        const published = pageData?.published !== false;

        if (!published) {
          setIsPublished(false);
          setRedirectPath(pageData?.redirectTo || fallbackPath);
        }
      } catch {
        // Silent fail - keep showing page
      }
    };

    checkPageVisibility();
  }, [pageName, isEditorMode, fallbackPath]);

  // Redirect if page is not published
  if (!isPublished) {
    return <Navigate to={redirectPath} replace />;
  }

  // Page is published, render children immediately
  return children;
};

export default PageVisibilityWrapper;
