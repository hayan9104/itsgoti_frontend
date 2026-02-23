import { useRef, useEffect, useCallback } from 'react';
import { usePageEditor } from '../../context/PageEditorContext';

const PreviewPanel = ({ pageName }) => {
  const iframeRef = useRef(null);
  const { formData, selectedSection, selectSection } = usePageEditor();

  // Map page names to routes
  const pageRoutes = {
    'about': '/about',
    'work': '/work',
    'contact': '/contact',
    'case-study': '/case-studies',
    'home': '/home',
    'approach': '/approach',
    'footer': '/footer-preview',
    'landing': '/',
  };

  const previewUrl = `${pageRoutes[pageName] || '/'}?editor=true`;

  // Send data updates to iframe
  useEffect(() => {
    const sendUpdate = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'EDITOR_UPDATE',
          payload: {
            section: selectedSection,
            data: formData,
          }
        }, window.location.origin);
      }
    };

    // Debounce updates
    const timeoutId = setTimeout(sendUpdate, 100);
    return () => clearTimeout(timeoutId);
  }, [formData, selectedSection]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Security check
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'SECTION_CLICKED') {
        selectSection(event.data.sectionId);
      } else if (event.data.type === 'PREVIEW_READY') {
        // Send initial data when iframe is ready
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'EDITOR_INIT',
            payload: {
              section: selectedSection,
              data: formData,
            }
          }, window.location.origin);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectSection, selectedSection, formData]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    // Send initial data after iframe loads
    setTimeout(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'EDITOR_INIT',
          payload: {
            section: selectedSection,
            data: formData,
          }
        }, window.location.origin);
      }
    }, 500);
  }, [selectedSection, formData]);

  return (
    <div style={{
      flex: 1,
      backgroundColor: '#e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Preview Header */}
      <div style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <span style={{
          fontSize: '13px',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Desktop Preview
        </span>
      </div>

      {/* Iframe Container - scrollable */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowX: 'auto',
        overflowY: 'auto',
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          width: '1440px',
          minWidth: '1440px',
          height: 'calc(100vh - 120px)',
        }}>
          <iframe
            ref={iframeRef}
            src={previewUrl}
            onLoad={handleIframeLoad}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
            }}
            title="Page Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
