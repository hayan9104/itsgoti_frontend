import { usePageEditor } from '../../context/PageEditorContext';
import { getSectionsForPage } from './sectionConfigs';

const SectionNavigator = () => {
  const { pageName, selectSection } = usePageEditor();
  const sections = getSectionsForPage(pageName);

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
          <strong>Tip:</strong> Click on any section in the preview on the right, or select from the list below to edit.
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
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => selectSection(section.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
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
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            {/* Icon */}
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
              </svg>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                margin: '0 0 4px 0',
              }}>
                {section.label}
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
        ))}
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
