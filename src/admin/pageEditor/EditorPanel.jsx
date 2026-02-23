import { usePageEditor } from '../../context/PageEditorContext';
import EditorToolbar from './EditorToolbar';
import SectionNavigator from './SectionNavigator';
import SectionFieldsRenderer from './SectionFieldsRenderer';

const EditorPanel = ({ pageLabel, onBack }) => {
  const { selectedSection, isLoading, error } = usePageEditor();

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
        <EditorToolbar pageLabel={pageLabel} onBack={onBack} />
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
        <EditorToolbar pageLabel={pageLabel} onBack={onBack} />
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
      <EditorToolbar pageLabel={pageLabel} onBack={onBack} />

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {selectedSection ? (
          <SectionFieldsRenderer />
        ) : (
          <SectionNavigator />
        )}
      </div>
    </div>
  );
};

export default EditorPanel;
