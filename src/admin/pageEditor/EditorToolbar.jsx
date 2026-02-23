import { useState } from 'react';
import { usePageEditor } from '../../context/PageEditorContext';

const EditorToolbar = ({ pageLabel, onBack }) => {
  const { isDirty, isSaving, saveChanges, resetChanges, selectedSection, selectSection } = usePageEditor();
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    const result = await saveChanges();
    if (result.success) {
      showToast('Changes saved successfully!', 'success');
    } else {
      showToast('Error saving changes. Please try again.', 'error');
    }
  };

  const handleBack = () => {
    if (isDirty) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirm) return;
    }
    onBack();
  };

  const handleBackToSections = () => {
    selectSection(null);
  };

  return (
    <div style={{
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#fff',
      position: 'relative',
    }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          borderRadius: '8px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transform: 'translateX(0)',
          transition: 'all 0.3s ease',
        }}>
          {toast.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
      {/* Header Row */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Left - Back Button & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {selectedSection ? (
            <button
              onClick={handleBackToSections}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280',
              }}
              title="Back to sections"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280',
              }}
              title="Back to Pages"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
            margin: 0,
          }}>
            {pageLabel}
          </h1>
          {isDirty && (
            <span style={{
              fontSize: '11px',
              color: '#f59e0b',
              backgroundColor: '#fef3c7',
              padding: '2px 8px',
              borderRadius: '10px',
              fontWeight: 500,
            }}>
              Unsaved
            </span>
          )}
        </div>

        {/* Right - Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDirty && (
            <button
              onClick={resetChanges}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            style={{
              padding: '6px 16px',
              fontSize: '13px',
              color: '#fff',
              backgroundColor: isDirty ? '#2563eb' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              cursor: isDirty && !isSaving ? 'pointer' : 'default',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
