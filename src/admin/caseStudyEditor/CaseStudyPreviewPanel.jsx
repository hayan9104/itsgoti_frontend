import { useEffect } from 'react';
import { useCaseStudyEditor } from './CaseStudyEditorContext';

const CaseStudyPreviewPanel = () => {
  const { formData, isNew, iframeSlug, iframeRef, handleIframeLoad, selectSection } = useCaseStudyEditor();

  // Listen for section click messages from iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Security check
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'SECTION_CLICKED') {
        selectSection(event.data.sectionId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectSection]);

  // For new case studies or when we don't have a slug yet, show placeholder preview
  const showIframe = !isNew && iframeSlug;

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      overflow: 'hidden',
    }}>
      {/* Preview Header */}
      <div style={{
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a2e',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#9ca3af', fontSize: '12px' }}>Desktop Preview (scroll to see full page)</span>
        </div>
        {formData.slug && (
          <a
            href={`/case-studies/${formData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#333',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '12px',
              textDecoration: 'none',
            }}
          >
            Open in New Tab ↗
          </a>
        )}
      </div>

      {/* Preview Content - Scrollable both horizontally and vertically */}
      <div style={{
        flex: 1,
        overflowX: 'scroll',
        overflowY: 'scroll',
        backgroundColor: '#e5e7eb',
        padding: '20px',
      }}>
        <div style={{
          width: '1480px',
          minWidth: '1480px',
        }}>
          {showIframe ? (
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              width: '1440px',
              height: '3000px',
            }}>
              <iframe
                ref={iframeRef}
                src={`/case-studies/${iframeSlug}?editor=true`}
                onLoad={handleIframeLoad}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px',
                }}
                title="Case Study Preview"
              />
            </div>
          ) : (
            <PlaceholderPreview formData={formData} onSectionClick={selectSection} />
          )}
        </div>
      </div>
    </div>
  );
};

// Placeholder Preview for new case studies - Full preview with demo content
const PlaceholderPreview = ({ formData, onSectionClick }) => {
  // Helper to check if user has content or use placeholder
  const getText = (userValue, placeholder) => userValue || placeholder;
  const hasUserContent = (value) => value && value.length > 0;
  const placeholderColor = '#9ca3af';
  const userContentColor = '#111827';

  // Click handler for sections - directly call the onSectionClick prop
  const handleSectionClick = (sectionId) => {
    if (onSectionClick) {
      onSectionClick(sectionId);
    }
  };

  // Placeholder image component
  const PlaceholderImage = ({ height = '400px', label = 'Image' }) => (
    <div style={{
      height,
      backgroundColor: '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
      </svg>
      <p style={{ color: '#9ca3af', fontSize: '14px' }}>{label}</p>
    </div>
  );

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      width: '1440px',
      overflow: 'hidden',
    }}>
      {/* ===== HERO SECTION ===== */}
      <div
        onClick={() => handleSectionClick('hero')}
        style={{
          backgroundColor: '#2558BF',
          padding: '40px 50px',
          color: '#fff',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
        }}>
          Hero Section (Click to edit)
        </div>

        {/* Client Logo */}
        {formData.clientLogo ? (
          <img src={formData.clientLogo} alt="Logo" style={{ height: '50px', marginBottom: '16px' }} />
        ) : (
          <div style={{
            width: '120px',
            height: '50px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '12px',
            opacity: 0.7,
          }}>
            Client Logo
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '16px', opacity: 0.9 }}>Project Focus</span>
          {(formData.projectFocus?.length > 0 ? formData.projectFocus : ['UX Design', 'Mobile App']).map((focus, i) => (
            <span key={i} style={{
              fontSize: '16px',
              opacity: formData.projectFocus?.length > 0 ? 1 : 0.6,
            }}>
              {focus}
            </span>
          ))}
        </div>
      </div>

      {/* ===== BANNER IMAGE ===== */}
      <div
        onClick={() => handleSectionClick('hero')}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 10,
        }}>
          Banner Image
        </div>
        {formData.bannerImage ? (
          <img src={formData.bannerImage} alt="Banner" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
        ) : (
          <PlaceholderImage height="500px" label="Banner Image (1440 x 500)" />
        )}
      </div>

      {/* ===== COLLABORATION SECTION ===== */}
      <div
        onClick={() => handleSectionClick('collaboration')}
        style={{
          padding: '60px 50px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#2558BF',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
        }}>
          Collaboration (Click to edit)
        </div>

        <div style={{ display: 'flex', gap: '80px' }}>
          <div style={{ flex: '0 1 796px' }}>
            <h2 style={{ fontSize: '32px', marginBottom: '24px' }}>
              <span style={{ fontStyle: 'italic' }}>The</span> Collaboration
            </h2>
            <p style={{
              fontSize: '20px',
              lineHeight: '30px',
              color: formData.collaborationText ? userContentColor : placeholderColor,
            }}>
              {getText(formData.collaborationText, 'Describe your collaboration story here. Explain how you worked with the client, the initial discussions, and how the partnership developed. This helps visitors understand the working relationship and project context.')}
            </p>
          </div>
          <div style={{ flex: '0 0 298px' }}>
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Industry</h3>
              <p style={{ fontSize: '20px', color: formData.industry ? userContentColor : placeholderColor }}>
                {getText(formData.industry, 'Technology')}
              </p>
              <p style={{ fontSize: '20px', color: formData.platform ? userContentColor : placeholderColor, marginTop: '16px' }}>
                {getText(formData.platform, 'Mobile App')}
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>Services</h3>
              <p style={{ fontSize: '20px', color: formData.services?.length > 0 ? userContentColor : placeholderColor }}>
                {formData.services?.length > 0 ? formData.services.join(' | ') : 'UX Research | UI Design | Development'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== CHALLENGE & SOLUTION SECTION ===== */}
      <div
        onClick={() => handleSectionClick('challenge')}
        style={{
          padding: '60px 50px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#2558BF',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
        }}>
          Challenge & Solution (Click to edit)
        </div>

        <h2 style={{ fontSize: '50px', textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontStyle: 'italic' }}>Problem</span> Definition
        </h2>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button style={{ padding: '12px 48px', fontWeight: 700, borderBottom: '1px solid #000', background: 'none', border: 'none', cursor: 'pointer' }}>Challenges</button>
          <button style={{ padding: '12px 48px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>Solutions</button>
          <button style={{ padding: '12px 48px', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>Results</button>
        </div>

        <p style={{
          fontSize: '20px',
          lineHeight: '30px',
          maxWidth: '700px',
          color: formData.challenge ? userContentColor : placeholderColor,
        }}>
          {getText(formData.challenge, 'Describe the main challenges faced in this project. What problems did the client have? What obstacles needed to be overcome? This section helps readers understand the complexity and scope of the work.')}
        </p>
      </div>

      {/* ===== GALLERY SECTION ===== */}
      <div
        onClick={() => handleSectionClick('gallery')}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 10,
        }}>
          Gallery Images (Click to edit)
        </div>
        {formData.images?.length > 0 ? (
          <img src={formData.images[0]} alt="Gallery" style={{ width: '100%', height: '600px', objectFit: 'cover' }} />
        ) : (
          <PlaceholderImage height="600px" label="Gallery / App Screenshots" />
        )}
      </div>

      {/* ===== PROCESS SECTION ===== */}
      <div
        onClick={() => handleSectionClick('process')}
        style={{
          padding: '80px 50px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#2558BF',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
        }}>
          Process Steps (Click to edit)
        </div>

        <div style={{ display: 'flex', gap: '80px', maxWidth: '1073px', margin: '0 auto' }}>
          <div style={{ flex: '0 0 400px' }}>
            <h2 style={{ fontSize: '50px' }}>
              <span style={{ fontStyle: 'italic' }}>The Process</span> We<br />Followed
            </h2>
          </div>
          <div style={{ flex: 1 }}>
            {(formData.processSteps?.length > 0 ? formData.processSteps : [
              { number: '01', title: 'Research & Discovery' },
              { number: '02', title: 'Strategy & Planning' },
              { number: '03', title: 'Design & Prototyping' },
              { number: '04', title: 'Development & Testing' },
              { number: '05', title: 'Launch & Optimization' },
            ]).map((step, i) => (
              <div key={i} style={{
                padding: '20px 0',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '32px',
                alignItems: 'center',
                opacity: formData.processSteps?.length > 0 ? 1 : 0.5,
              }}>
                <span style={{ fontSize: '30px', fontStyle: 'italic', fontWeight: 600 }}>{step.number}</span>
                <span style={{ fontSize: '24px' }}>{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== OPPORTUNITIES SECTION ===== */}
      <div
        onClick={() => handleSectionClick('opportunities')}
        style={{
          padding: '80px 50px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#2558BF',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
        }}>
          Opportunities (Click to edit)
        </div>

        <h2 style={{ fontSize: '50px', textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ fontStyle: 'italic' }}>Opportunities</span> Discovered
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {(formData.opportunities?.length > 0 ? formData.opportunities : [
            { number: '01', title: 'User Experience', description: 'Improve the overall user journey' },
            { number: '02', title: 'Brand Identity', description: 'Strengthen brand recognition' },
            { number: '03', title: 'Performance', description: 'Optimize speed and efficiency' },
          ]).map((opp, i) => (
            <div key={i} style={{
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              backgroundColor: '#2558BF',
              border: i > 0 ? '5px solid white' : 'none',
              marginRight: i < 2 ? '-40px' : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#fff',
              textAlign: 'center',
              padding: '40px',
              opacity: formData.opportunities?.length > 0 ? 1 : 0.7,
            }}>
              <span style={{ fontSize: '42px', fontStyle: 'italic', marginBottom: '16px' }}>{opp.number}</span>
              <h3 style={{ fontSize: '28px', marginBottom: '12px' }}>{opp.title}</h3>
              <p style={{ fontSize: '18px', opacity: 0.8 }}>{opp.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== EXPERIENCE SECTION ===== */}
      <div
        onClick={() => handleSectionClick('experience')}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 10,
        }}>
          Experience Images (Click to edit)
        </div>

        <h2 style={{ fontSize: '50px', textAlign: 'center', padding: '60px 0' }}>
          <span style={{ fontStyle: 'italic' }}>The Experience</span> We Created
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {formData.experienceImages?.length > 0 ? (
            <>
              <img src={formData.experienceImages[0]} alt="Experience 1" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
              <img src={formData.experienceImages[1]} alt="Experience 2" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
            </>
          ) : (
            <>
              <PlaceholderImage height="500px" label="Experience Image 1" />
              <PlaceholderImage height="500px" label="Experience Image 2" />
            </>
          )}
        </div>
        {formData.experienceImages?.length > 2 ? (
          <img src={formData.experienceImages[2]} alt="Experience 3" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
        ) : (
          <PlaceholderImage height="500px" label="Experience Image 3 (Full Width)" />
        )}

        {/* Quote */}
        <div style={{ padding: '60px 120px' }}>
          <p style={{
            fontSize: '28px',
            lineHeight: '42px',
            color: formData.experienceQuote ? userContentColor : placeholderColor,
          }}>
            {getText(formData.experienceQuote, '"Add an inspiring quote about the experience you created for the client. This could be a testimonial or a summary of the impact your work had."')}
          </p>
        </div>
      </div>

      {/* ===== COLOR PALETTE SECTION ===== */}
      <div
        onClick={() => handleSectionClick('colors')}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 10,
        }}>
          Color Palette (Click to edit)
        </div>

        {(formData.colorPalette?.length > 0 ? formData.colorPalette : [
          { color: '#FFF56F' },
          { color: '#F7D2B4' },
          { color: '#00BFAF' },
          { color: '#1e1e27' },
          { color: '#fafafa' },
          { color: '#B8ECEC' },
          { color: '#e5e7eb' },
        ]).map((color, i) => (
          <div key={i} style={{
            height: '84px',
            backgroundColor: color.color,
            opacity: formData.colorPalette?.length > 0 ? 1 : 0.6,
          }} />
        ))}

        <div style={{ position: 'absolute', left: '50px', top: '50px' }}>
          <p style={{ fontSize: '56px', fontStyle: 'italic', marginBottom: 0 }}>Color</p>
          <p style={{ fontSize: '56px' }}>Palette</p>
        </div>
      </div>

      {/* ===== TYPOGRAPHY SECTION ===== */}
      <div
        onClick={() => handleSectionClick('typography')}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
          zIndex: 10,
        }}>
          Typography (Click to edit)
        </div>
        {formData.typography?.fontImage ? (
          <img src={formData.typography.fontImage} alt="Typography" style={{ width: '100%', height: '500px', objectFit: 'cover' }} />
        ) : (
          <div style={{
            height: '500px',
            backgroundColor: '#1a1a2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#fff',
          }}>
            <p style={{ fontSize: '72px', fontWeight: 700, marginBottom: '20px' }}>Aa</p>
            <p style={{ fontSize: '24px', opacity: 0.7 }}>Typography Preview Image</p>
            <p style={{ fontSize: '16px', opacity: 0.5, marginTop: '8px' }}>Upload a font specimen image</p>
          </div>
        )}
      </div>

      {/* ===== RELATED PROJECTS ===== */}
      <div
        onClick={() => handleSectionClick('related')}
        style={{
          padding: '80px 50px',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: '#2558BF',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
        }}>
          Related Projects (Click to edit)
        </div>

        <h2 style={{ fontSize: '50px', marginBottom: '40px' }}>
          <span style={{ fontStyle: 'italic' }}>Related</span> Projects
        </h2>

        <div style={{ display: 'flex', gap: '20px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ flex: '0 0 610px' }}>
              <div style={{
                height: '359px',
                backgroundColor: '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
              }}>
                <p style={{ color: '#9ca3af' }}>Related Project {i}</p>
              </div>
              <h3 style={{ fontSize: '32px', marginBottom: '8px', color: placeholderColor }}>Project Title</h3>
              <p style={{ fontSize: '16px', color: placeholderColor }}>Brief description of the related project...</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaseStudyPreviewPanel;
