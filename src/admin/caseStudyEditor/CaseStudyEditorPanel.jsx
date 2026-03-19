import { useCaseStudyEditor } from './CaseStudyEditorContext';
import CaseStudySectionNavigator from './CaseStudySectionNavigator';
import CaseStudySectionFields from './CaseStudySectionFields';
import { useNavigate } from 'react-router-dom';

const CaseStudyEditorPanel = () => {
  const {
    selectedSection,
    clearSection,
    isLoading,
    isSaving,
    error,
    hasChanges,
    isNew,
    save,
    basePath,
    sections,
  } = useCaseStudyEditor();

  const navigate = useNavigate();

  const handleBack = () => {
    if (selectedSection) {
      clearSection();
    } else {
      if (hasChanges) {
        if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
          navigate(basePath);
        }
      } else {
        navigate(basePath);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{
        width: '400px',
        minWidth: '380px',
        maxWidth: '480px',
        borderRight: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Toolbar
          title="Loading..."
          onBack={() => navigate(basePath)}
          onSave={() => {}}
          isSaving={false}
        />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
        }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        width: '400px',
        minWidth: '380px',
        maxWidth: '480px',
        borderRight: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Toolbar
          title="Error"
          onBack={() => navigate(basePath)}
          onSave={() => {}}
          isSaving={false}
        />
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#dc2626',
          padding: '20px',
          textAlign: 'center',
        }}>
          {error}
        </div>
      </div>
    );
  }

  const sectionLabel = selectedSection
    ? sections.find(s => s.id === selectedSection)?.label || selectedSection
    : (isNew ? 'New Case Study' : 'Edit Case Study');

  return (
    <div style={{
      width: '400px',
      minWidth: '380px',
      maxWidth: '480px',
      borderRight: '1px solid #e5e7eb',
      backgroundColor: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
    }}>
      {/* Toolbar */}
      <Toolbar
        title={sectionLabel}
        onBack={handleBack}
        onSave={save}
        isSaving={isSaving}
        hasChanges={hasChanges}
      />

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedSection ? (
          <CaseStudySectionFields />
        ) : (
          <CaseStudySectionNavigator />
        )}
      </div>
    </div>
  );
};

// Toolbar Component
const Toolbar = ({ title, onBack, onSave, isSaving, hasChanges }) => {
  return (
    <div style={{
      padding: '12px 16px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#6b7280',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#111827',
          margin: 0,
        }}>
          {title}
        </h1>
        {hasChanges && (
          <span style={{
            fontSize: '11px',
            color: '#f59e0b',
            backgroundColor: '#fef3c7',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            Unsaved
          </span>
        )}
      </div>
      <button
        onClick={onSave}
        disabled={isSaving}
        style={{
          padding: '8px 16px',
          backgroundColor: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: isSaving ? 'not-allowed' : 'pointer',
          opacity: isSaving ? 0.7 : 1,
        }}
      >
        {isSaving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
};

export default CaseStudyEditorPanel;
