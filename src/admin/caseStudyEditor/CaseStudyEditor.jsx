import { CaseStudyEditorProvider } from './CaseStudyEditorContext';
import CaseStudyEditorPanel from './CaseStudyEditorPanel';
import CaseStudyPreviewPanel from './CaseStudyPreviewPanel';

const CaseStudyEditor = ({ isNew = false, basePath = '/goti/admin/case-studies' }) => {
  return (
    <CaseStudyEditorProvider isNew={isNew} basePath={basePath}>
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        backgroundColor: '#f3f4f6',
        zIndex: 9999,
      }}>
        {/* Left Panel - Editor */}
        <CaseStudyEditorPanel />

        {/* Right Panel - Preview */}
        <CaseStudyPreviewPanel />
      </div>
    </CaseStudyEditorProvider>
  );
};

export default CaseStudyEditor;
