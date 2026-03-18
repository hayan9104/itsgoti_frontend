import { useEffect, useState } from 'react';

/**
 * Hook to fetch and apply SEO settings (title, description, favicon, social preview)
 */
const useSEO = () => {
  const [siteSettings, setSiteSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/themes/site-settings');
        const data = await response.json();

        if (data.success && data.data) {
          setSiteSettings(data.data);
          applySEO(data.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    // Defer - SEO meta tags can load after page renders
    const timer = setTimeout(fetchSiteSettings, 200);
    return () => clearTimeout(timer);
  }, []);

  const applySEO = (settings) => {
    // Set document title
    if (settings.siteTitle) {
      document.title = settings.siteTitle;
    }

    // Set meta description
    if (settings.siteDescription) {
      updateMetaTag('description', settings.siteDescription);
      updateMetaTag('og:description', settings.siteDescription, 'property');
      updateMetaTag('twitter:description', settings.siteDescription);
    }

    // Set Open Graph title
    if (settings.siteTitle) {
      updateMetaTag('og:title', settings.siteTitle, 'property');
      updateMetaTag('twitter:title', settings.siteTitle);
    }

    // Set favicon
    if (settings.favicon) {
      updateFavicon(settings.favicon);
    }

    // Set social preview image (og:image)
    if (settings.socialPreview) {
      updateMetaTag('og:image', settings.socialPreview, 'property');
      updateMetaTag('twitter:image', settings.socialPreview);
      updateMetaTag('twitter:card', 'summary_large_image');
    }

    // Set og:type
    updateMetaTag('og:type', 'website', 'property');

    // Set og:url
    updateMetaTag('og:url', window.location.origin, 'property');
  };

  const updateMetaTag = (name, content, attributeType = 'name') => {
    let meta = document.querySelector(`meta[${attributeType}="${name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attributeType, name);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  };

  const updateFavicon = (faviconUrl) => {
    // Update existing favicon links or create new ones
    let link = document.querySelector("link[rel*='icon']");

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = faviconUrl;
    link.type = 'image/x-icon';

    // Also set apple-touch-icon for iOS
    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    appleLink.href = faviconUrl;
  };

  return { siteSettings, loading };
};

export default useSEO;
