import { useParams, useNavigate } from 'react-router-dom';
import { PageEditorProvider } from '../../context/PageEditorContext';
import EditorPanel from './EditorPanel';
import PreviewPanel from './PreviewPanel';

const VisualPageEditor = () => {
  const { pageName, themeId } = useParams();
  const navigate = useNavigate();

  const pageLabels = {
    'about': 'About Us',
    'work': 'Our Work',
    'contact': 'Contact',
    'case-study': 'Case Study',
    'home': 'Home Page',
    'approach': 'Our Approach',
    'landing': 'Landing Page',
    'landing-page-2': 'Landing Page 2 (Shopify)',
    'landing-page-3': 'Landing Page 3 (Shopify Pro)',
    'footer': 'Footer',
  };

  const handleBack = () => {
    if (themeId) {
      navigate(`/admin/themes/${themeId}/pages`);
    } else {
      navigate('/admin/pages');
    }
  };

  return (
    <PageEditorProvider pageName={pageName} themeId={themeId}>
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
          themeId={themeId}
        />

        {/* Right Panel - Preview */}
        <PreviewPanel pageName={pageName} themeId={themeId} />
      </div>
    </PageEditorProvider>
  );
};

export default VisualPageEditor;
