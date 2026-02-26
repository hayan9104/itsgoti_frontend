import { useState, useEffect } from 'react';
import { pagesAPI } from '../services/api';

/**
 * Hook to check which pages are published/visible
 * Returns an object with page names as keys and boolean visibility as values
 */
const usePageVisibility = () => {
  const [visibility, setVisibility] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPageVisibility = async () => {
      try {
        const response = await pagesAPI.getAll();
        const pages = response.data.data || [];

        // Create visibility map
        const visibilityMap = {};
        pages.forEach(page => {
          // Default to true (published) if not explicitly set to false
          visibilityMap[page.name] = page.published !== false;
        });

        setVisibility(visibilityMap);
      } catch (error) {
        console.error('Error fetching page visibility:', error);
        // Default all pages to visible on error
        setVisibility({});
      } finally {
        setLoading(false);
      }
    };

    fetchPageVisibility();
  }, []);

  // Helper function to check if a specific page is visible
  const isPageVisible = (pageName) => {
    // Default to true if page hasn't been configured
    return visibility[pageName] !== false;
  };

  return { visibility, loading, isPageVisible };
};

export default usePageVisibility;
