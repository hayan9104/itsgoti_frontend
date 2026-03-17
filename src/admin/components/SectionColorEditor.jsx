import { useState } from 'react';
import ColorPicker from './ColorPicker';

// Color property definitions with labels and descriptions
const colorProperties = [
  { key: 'backgroundColor', label: 'Background Color', description: 'Main background color of the section' },
  { key: 'mobileBackgroundColor', label: 'Mobile Background Color', description: 'Background color on mobile devices (overrides main background)' },
  { key: 'containerBackground', label: 'Container Background', description: 'Background color of content containers' },
  { key: 'headingColor', label: 'Heading Color', description: 'Color for main headings (H1, H2)' },
  { key: 'subheadingColor', label: 'Subheading Color', description: 'Color for subheadings (H3, H4)' },
  { key: 'textColor', label: 'Text Color', description: 'Color for body text and paragraphs' },
  { key: 'buttonBackground', label: 'Button Background', description: 'Background color for buttons' },
  { key: 'buttonText', label: 'Button Text', description: 'Text color for buttons' },
  { key: 'buttonHoverBackground', label: 'Button Hover', description: 'Button background on hover' },
  { key: 'borderColor', label: 'Border Color', description: 'Color for borders and dividers' },
  { key: 'iconColor', label: 'Icon Color', description: 'Color for icons and SVGs' },
  { key: 'linkColor', label: 'Link Color', description: 'Color for hyperlinks' },
  { key: 'accentColor', label: 'Accent Color', description: 'Accent/highlight color for emphasis' },
  { key: 'highlightColor', label: 'Highlight Color', description: 'Secondary highlight color' },
  { key: 'cardBackground', label: 'Card Background', description: 'Background color for cards' },
  { key: 'cardBorderColor', label: 'Card Border', description: 'Border color for cards' },
  { key: 'shadowColor', label: 'Shadow Color', description: 'Color for box shadows' },
];

// Section-specific color properties (which colors are relevant for each section type)
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
  contact: ['backgroundColor', 'mobileBackgroundColor', 'headingColor', 'textColor', 'buttonBackground', 'buttonText', 'borderColor', 'accentColor'],
  contactForm: ['backgroundColor', 'headingColor', 'textColor', 'buttonBackground', 'buttonText', 'borderColor'],
  stickyCta: ['backgroundColor', 'headingColor', 'textColor', 'buttonBackground', 'buttonText'],
  footer: ['backgroundColor', 'headingColor', 'textColor', 'linkColor', 'iconColor'],
  guarantees: ['backgroundColor', 'headingColor', 'textColor', 'iconColor', 'accentColor'],
  default: colorProperties.map(p => p.key), // All colors for unknown sections
};

const SectionColorEditor = ({
  section,
  colors = {},
  onChange,
  isExpanded = false,
  onToggle,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const handleColorChange = (colorKey, value) => {
    onChange({
      ...colors,
      [colorKey]: value,
    });
  };

  // Get relevant color properties for this section
  const relevantColors = sectionColorMapping[section.sectionId] || sectionColorMapping.default;
  const relevantProperties = colorProperties.filter(p => relevantColors.includes(p.key));

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      marginBottom: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: expanded ? '#f9fafb' : '#fff',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => !expanded && (e.currentTarget.style.backgroundColor = '#f9fafb')}
        onMouseLeave={(e) => !expanded && (e.currentTarget.style.backgroundColor = '#fff')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Color preview dots */}
          <div style={{
            display: 'flex',
            gap: '4px',
          }}>
            {Object.entries(colors).slice(0, 4).map(([key, value]) => (
              value && (
                <div
                  key={key}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: value,
                    border: '1px solid #e5e7eb',
                  }}
                  title={`${key}: ${value}`}
                />
              )
            ))}
          </div>

          <div>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#111827',
              margin: 0,
            }}>
              {section.sectionName}
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              margin: '2px 0 0',
            }}>
              {relevantProperties.length} color options
            </p>
          </div>
        </div>

        {/* Expand/Collapse icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Content */}
      {expanded && (
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {relevantProperties.map((prop) => (
            <ColorPicker
              key={prop.key}
              label={prop.label}
              description={prop.description}
              value={colors[prop.key] || ''}
              onChange={(value) => handleColorChange(prop.key, value)}
            />
          ))}

          {/* Show all colors option */}
          {relevantProperties.length < colorProperties.length && (
            <details style={{ gridColumn: '1 / -1' }}>
              <summary style={{
                cursor: 'pointer',
                fontSize: '13px',
                color: '#6b7280',
                marginBottom: '16px',
                padding: '8px 0',
              }}>
                Show all color options ({colorProperties.length - relevantProperties.length} more)
              </summary>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
                paddingTop: '8px',
                borderTop: '1px dashed #e5e7eb',
              }}>
                {colorProperties
                  .filter(p => !relevantColors.includes(p.key))
                  .map((prop) => (
                    <ColorPicker
                      key={prop.key}
                      label={prop.label}
                      description={prop.description}
                      value={colors[prop.key] || ''}
                      onChange={(value) => handleColorChange(prop.key, value)}
                    />
                  ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionColorEditor;
