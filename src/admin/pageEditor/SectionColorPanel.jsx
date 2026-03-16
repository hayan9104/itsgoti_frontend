import { useState, useEffect } from 'react';
import { usePageEditor } from '../../context/PageEditorContext';
import ColorPicker from '../components/ColorPicker';

// Color property definitions with labels and descriptions
const colorProperties = [
  { key: 'backgroundColor', label: 'Background Color', description: 'Main background color' },
  { key: 'containerBackground', label: 'Container Background', description: 'Background for content containers' },
  { key: 'headingColor', label: 'Heading Color', description: 'Color for main headings' },
  { key: 'subheadingColor', label: 'Subheading Color', description: 'Color for subheadings' },
  { key: 'textColor', label: 'Text Color', description: 'Color for body text' },
  { key: 'buttonBackground', label: 'Button Background', description: 'Background color for buttons' },
  { key: 'buttonText', label: 'Button Text', description: 'Text color for buttons' },
  { key: 'buttonHoverBackground', label: 'Button Hover', description: 'Button background on hover' },
  { key: 'borderColor', label: 'Border Color', description: 'Color for borders' },
  { key: 'iconColor', label: 'Icon Color', description: 'Color for icons' },
  { key: 'linkColor', label: 'Link Color', description: 'Color for hyperlinks' },
  { key: 'accentColor', label: 'Accent Color', description: 'Accent/highlight color' },
  { key: 'highlightColor', label: 'Highlight Color', description: 'Secondary highlight color' },
  { key: 'cardBackground', label: 'Card Background', description: 'Background for cards' },
  { key: 'cardBorderColor', label: 'Card Border', description: 'Border color for cards' },
];

// Section-specific color properties mapping
const sectionColorMapping = {
  header: ['backgroundColor', 'headingColor', 'textColor', 'iconColor'],
  hero: ['backgroundColor', 'headingColor', 'subheadingColor', 'textColor', 'buttonBackground', 'buttonText', 'accentColor'],
  phoneCarousel: ['backgroundColor', 'borderColor'],
  problem: ['backgroundColor', 'headingColor', 'textColor', 'accentColor', 'highlightColor'],
  solution: ['backgroundColor', 'headingColor', 'textColor', 'iconColor', 'cardBackground'],
  features: ['backgroundColor', 'headingColor', 'textColor', 'accentColor', 'cardBackground'],
  caseStudies: ['backgroundColor', 'headingColor', 'textColor', 'cardBackground', 'cardBorderColor'],
  clients: ['backgroundColor', 'headingColor', 'textColor'],
  pricing: ['backgroundColor', 'headingColor', 'textColor', 'cardBackground', 'cardBorderColor', 'buttonBackground', 'buttonText', 'accentColor'],
  contact: ['backgroundColor', 'headingColor', 'textColor', 'buttonBackground', 'buttonText', 'borderColor', 'accentColor'],
  contactForm: ['backgroundColor', 'headingColor', 'textColor', 'buttonBackground', 'buttonText', 'borderColor'],
  stickyCta: ['backgroundColor', 'headingColor', 'textColor', 'buttonBackground', 'buttonText'],
  footer: ['backgroundColor', 'headingColor', 'textColor', 'linkColor', 'iconColor'],
  guarantees: ['backgroundColor', 'headingColor', 'textColor', 'iconColor', 'accentColor'],
  default: colorProperties.map(p => p.key),
};

const SectionColorPanel = ({ sectionId, sectionName, pageName }) => {
  const { colorData, updateSectionColors, saveSectionColors } = usePageEditor();
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [localColors, setLocalColors] = useState({});

  // Get relevant colors for this section
  const relevantColorKeys = sectionColorMapping[sectionId] || sectionColorMapping.default;
  const relevantProperties = colorProperties.filter(p => relevantColorKeys.includes(p.key));

  // Sync local colors with context
  useEffect(() => {
    if (colorData[sectionId]) {
      setLocalColors(colorData[sectionId]);
    }
  }, [colorData, sectionId]);

  const handleColorChange = (colorKey, value) => {
    const newColors = {
      ...localColors,
      [colorKey]: value,
    };
    setLocalColors(newColors);
    setHasChanges(true);

    // Update context for live preview (this will trigger postMessage to iframe)
    updateSectionColors(sectionId, { [colorKey]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveSectionColors(sectionId, localColors, sectionName);
    setSaving(false);

    if (result.success) {
      setHasChanges(false);
    } else {
      alert('Failed to save colors. Please try again.');
    }
  };

  return (
    <div style={{
      marginTop: '20px',
      borderTop: '1px solid #e5e7eb',
      paddingTop: '20px',
    }}>
      {/* Header - Collapsible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: isExpanded ? '#f0f9ff' : '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
              Color Styling
            </span>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
              Customize colors for this section
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasChanges && (
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              backgroundColor: '#fef3c7',
              color: '#d97706',
              borderRadius: '4px',
              fontWeight: 500,
            }}>
              Unsaved
            </span>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Color pickers */}
      {isExpanded && (
        <div style={{
          marginTop: '12px',
          padding: '16px',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px',
          }}>
            {relevantProperties.map((prop) => (
              <ColorPicker
                key={prop.key}
                label={prop.label}
                description={prop.description}
                value={localColors[prop.key] || ''}
                onChange={(value) => handleColorChange(prop.key, value)}
              />
            ))}
          </div>

          {/* Save button */}
          {hasChanges && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {saving ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
                      <path d="M21 12a9 9 0 11-6.219-8.56" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Colors'
                )}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionColorPanel;
