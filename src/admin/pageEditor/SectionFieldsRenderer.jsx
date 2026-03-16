import { usePageEditor } from '../../context/PageEditorContext';
import { getSectionById } from './sectionConfigs';
import TextFieldEditor from './fields/TextFieldEditor';
import TextareaFieldEditor from './fields/TextareaFieldEditor';
import ImageFieldEditor from './fields/ImageFieldEditor';
import ImageArrayEditor from './fields/ImageArrayEditor';
import StatsArrayEditor from './fields/StatsArrayEditor';
import MediaFieldEditor from './fields/MediaFieldEditor';
import TestimonialsArrayEditor from './fields/TestimonialsArrayEditor';
import CaseStudiesArrayEditor from './fields/CaseStudiesArrayEditor';
import ProjectsArrayEditor from './fields/ProjectsArrayEditor';
import PainPointsArrayEditor from './fields/PainPointsArrayEditor';
import ServicesArrayEditor from './fields/ServicesArrayEditor';
import FeaturesGroupArrayEditor from './fields/FeaturesGroupArrayEditor';
import SectionColorPanel from './SectionColorPanel';

const fieldComponents = {
  text: TextFieldEditor,
  textarea: TextareaFieldEditor,
  image: ImageFieldEditor,
  imageArray: ImageArrayEditor,
  statsArray: StatsArrayEditor,
  media: MediaFieldEditor,
  testimonialsArray: TestimonialsArrayEditor,
  caseStudiesArray: CaseStudiesArrayEditor,
  projectsArray: ProjectsArrayEditor,
  painPointsArray: PainPointsArrayEditor,
  servicesArray: ServicesArrayEditor,
  featuresGroupArray: FeaturesGroupArrayEditor,
};

const SectionFieldsRenderer = () => {
  const { pageName, selectedSection, formData, updateField, updateArrayField } = usePageEditor();

  const section = getSectionById(pageName, selectedSection);

  if (!section) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280',
      }}>
        <p>Section not found</p>
      </div>
    );
  }

  // Check if page supports color styling
  const colorSupportedPages = ['landing-page-2', 'landing-page-3'];
  const showColorPanel = colorSupportedPages.includes(pageName);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
    }}>
      {/* Section Header */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#111827',
          margin: '0 0 4px 0',
        }}>
          {section.label}
        </h3>
        {section.description && (
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: 0,
          }}>
            {section.description}
          </p>
        )}
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {section.fields.map((field) => {
          const FieldComponent = fieldComponents[field.type];

          if (!FieldComponent) {
            return (
              <div key={field.key} style={{ color: '#dc2626', fontSize: '13px' }}>
                Unknown field type: {field.type}
              </div>
            );
          }

          const isArrayField = ['imageArray', 'statsArray', 'logoArray', 'testimonialsArray', 'caseStudiesArray', 'projectsArray', 'painPointsArray', 'servicesArray', 'featuresGroupArray'].includes(field.type);

          // Special handling for featuresGroupArray with rotation speed
          if (field.type === 'featuresGroupArray') {
            return (
              <FieldComponent
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChange={(value) => updateArrayField(field.key, value)}
                rotationSpeed={formData.featureRotationSpeed || 3}
                onRotationSpeedChange={(value) => updateField('featureRotationSpeed', value)}
              />
            );
          }

          return (
            <FieldComponent
              key={field.key}
              field={field}
              value={formData[field.key]}
              onChange={(value) => {
                if (isArrayField) {
                  updateArrayField(field.key, value);
                } else {
                  updateField(field.key, value);
                }
              }}
            />
          );
        })}
      </div>

      {/* Color Styling Panel - Only show for supported pages */}
      {showColorPanel && (
        <SectionColorPanel
          sectionId={selectedSection}
          sectionName={section.label}
          pageName={pageName}
        />
      )}
    </div>
  );
};

export default SectionFieldsRenderer;
