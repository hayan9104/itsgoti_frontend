import { useParams, useNavigate } from 'react-router-dom';
import { PageEditorProvider } from '../../context/PageEditorContext';
import EditorPanel from './EditorPanel';
import PreviewPanel from './PreviewPanel';

const VisualPageEditor = () => {
  const { pageName } = useParams();
  const navigate = useNavigate();

  const pageLabels = {
    'about': 'About Us',
    'work': 'Our Work',
    'contact': 'Contact',
    'case-study': 'Case Study',
    'home': 'Home Page',
    'approach': 'Our Approach',
  };

  const handleBack = () => {
    navigate('/admin/pages');
  };

  return (
    <PageEditorProvider pageName={pageName}>
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        backgroundColor: '#f3f4f6',
        zIndex: 9999,
      }}>
        {/* Left Panel - Editor */}
        <EditorPanel
          pageLabel={pageLabels[pageName] || pageName}
          onBack={handleBack}
        />

        {/* Right Panel - Preview */}
        <PreviewPanel pageName={pageName} />
      </div>
    </PageEditorProvider>
  );
};

export default VisualPageEditor;
