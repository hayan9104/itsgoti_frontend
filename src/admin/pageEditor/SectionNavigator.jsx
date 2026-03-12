import { usePageEditor } from '../../context/PageEditorContext';
import { getSectionsForPage } from './sectionConfigs';

const SectionNavigator = () => {
  const { pageName, selectSection, formData, updateField } = usePageEditor();
  const sections = getSectionsForPage(pageName);

  // Get visibility state for a section (default to true if not set)
  const isSectionVisible = (sectionId) => {
    const visibilityKey = `${sectionId}Visible`;
    return formData[visibilityKey] !== false;
  };

  // Toggle section visibility
  const toggleSectionVisibility = (e, sectionId) => {
    e.stopPropagation(); // Prevent triggering section selection
    const visibilityKey = `${sectionId}Visible`;
    const currentValue = formData[visibilityKey] !== false;
    updateField(visibilityKey, !currentValue);
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
    }}>
      {/* Instructions */}
      <div style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
      }}>
        <p style={{
          fontSize: '13px',
          color: '#0369a1',
          margin: 0,
          lineHeight: '1.5',
        }}>
          <strong>Tip:</strong> Click on any section in the preview on the right, or select from the list below to edit. Use the toggle to show/hide sections on the live site.
        </p>
      </div>

      {/* Section List */}
      <h3 style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '12px',
      }}>
        Sections
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sections.map((section) => {
          const isVisible = isSectionVisible(section.id);
          return (
            <div
              key={section.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isVisible ? 1 : 0.6,
              }}
            >
              {/* Visibility Toggle */}
              <button
                onClick={(e) => toggleSectionVisibility(e, section.id)}
                title={isVisible ? 'Hide this section' : 'Show this section'}
                style={{
                  width: '40px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: isVisible ? '#22c55e' : '#e5e7eb',
                  border: 'none',
                  cursor: 'pointer',
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
                  left: isVisible ? '19px' : '3px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>

              {/* Section Button */}
              <button
                onClick={() => selectSection(section.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: isVisible ? '#fff' : '#f9fafb',
                  border: `1px solid ${isVisible ? '#e5e7eb' : '#d1d5db'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isVisible ? '#e5e7eb' : '#d1d5db';
                  e.currentTarget.style.backgroundColor = isVisible ? '#fff' : '#f9fafb';
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: isVisible ? '#f3f4f6' : '#e5e7eb',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {isVisible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: isVisible ? '#111827' : '#6b7280',
                    margin: '0 0 4px 0',
                    textDecoration: isVisible ? 'none' : 'line-through',
                  }}>
                    {section.label}
                    {!isVisible && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#ef4444',
                        textDecoration: 'none',
                      }}>
                        HIDDEN
                      </span>
                    )}
                  </h4>
                  {section.description && (
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      margin: 0,
                    }}>
                      {section.description}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {sections.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#6b7280',
        }}>
          <p>No sections configured for this page yet.</p>
        </div>
      )}
    </div>
  );
};

export default SectionNavigator;
