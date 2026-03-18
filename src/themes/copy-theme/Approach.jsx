import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useWindowSize from '@/hooks/useWindowSize';
import { pagesAPI } from '@/services/api';
import EditableSection from '@/components/EditableSection';
import vectorIcon from '@/assets/Vector.png';

// Helper to get full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

const Approach = () => {
  const { isMobile, isTablet } = useWindowSize();
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const [selectedSection, setSelectedSection] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  // Page content from CMS
  const [pageContent, setPageContent] = useState({
    // Hero Section
    heroTitle: 'Helping brands',
    heroTitleItalic: 'define',
    heroTitleContinue: 'themselves and reach the right audience.',
    heroDescription: 'We helped established businesses leverage design to truly reflect their original selves in the market. our collaborative vision helped them improve trust and credibility amongst their audience.',
    heroLogoImage: '',
    heroLogoTitle: 'drips',
    heroLogoSubtitle1: 'Project Focus',
    heroLogoSubtitle2: 'Mobile App + Community',
    // Process Section
    processTitle: 'Our process',
    processTitleNormal1: 'that helps',
    processTitleNormal2: 'businesses design products for',
    processTitleItalic: 'tomorrow.',
    // Steps
    step1Number: '01',
    step1Title: 'Discovery workshop & research',
    step1Desc1: 'Lorem ipsum dolor sit amet consectetur. Vulputate auctor faucibus sit aliquam eget fames pulvinar consequat. Facilisis lacus etiam duis magna ut egestas felis. Lorem eu at cursus faucibus mattis pulvinar purus. Eget condimentum amet senectus amet tortor.',
    step1Desc2: 'Lorem ipsum dolor sit amet consectetur. Vulputate auctor faucibus sit aliquam eget fames pulvinar consequat.',
    step1Image: '',
    step2Number: '02',
    step2Title: 'Transform',
    step2Desc: 'Lorem ipsum dolor sit amet consectetur. Vulputate auctor faucibus sit aliquam eget fames pulvinar consequat. Facilisis lacus etiam duis magna ut egestas felis. Lorem eu at cursus faucibus mattis pulvinar purus. Eget condimentum amet senectus amet tortor.',
    step2Image: '',
    step3Number: '03',
    step3Title: 'Design for impact',
    step3Desc: 'Lorem ipsum dolor sit amet consectetur. Vulputate auctor faucibus sit aliquam eget fames pulvinar consequat. Facilisis lacus etiam duis magna ut egestas felis. Lorem eu at cursus faucibus mattis pulvinar purus. Eget condimentum amet senectus amet tortor.',
    step3Image: '',
    step4Number: '04',
    step4Title: 'Scale for growth',
    step4Desc: 'Lorem ipsum dolor sit amet consectetur. Vulputate auctor faucibus sit aliquam eget fames pulvinar consequat. Facilisis lacus etiam duis magna ut egestas felis. Lorem eu at cursus faucibus mattis pulvinar purus. Eget condimentum amet senectus amet tortor.',
    step4Image: '',
    // KPI Section
    kpiTitle: 'Building',
    kpiTitleItalic: 'KPI-driven experiences',
    kpiTitleEnd: 'for vast legacy organizations.',
    kpiLogos: [
      { id: 1, image: '' },
      { id: 2, image: '' },
      { id: 3, image: '' },
      { id: 4, image: '' },
    ],
    // Before/After Section
    beforeAfterImage: '',
    // CTA Section
    ctaTitle: 'Ready to start a project?',
    ctaDescription: 'We combine strategy, design, and performance to create experiences that convert.',
    ctaButtonText: 'Schedule Call',
  });

  // Helper to check if section is visible
  const isSectionVisible = (sectionId) => {
    const visibilityKey = `${sectionId}Visible`;
    return pageContent[visibilityKey] !== false;
  };

  // Helper to check if section should be rendered
  const shouldRenderSection = (sectionId) => {
    if (isEditorMode) return true;
    return isSectionVisible(sectionId);
  };

  // Helper to check if section is hidden
  const isSectionHidden = (sectionId) => {
    return !isSectionVisible(sectionId);
  };

  // Listen for updates from parent editor
  useEffect(() => {
    if (!isEditorMode) return;

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'EDITOR_UPDATE' || event.data.type === 'EDITOR_INIT') {
        if (event.data.payload?.data) {
          setPageContent(prev => ({
            ...prev,
            ...event.data.payload.data
          }));
        }
        if (event.data.payload?.section !== undefined) {
          setSelectedSection(event.data.payload.section);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  // Fetch content from API
  useEffect(() => {
    if (!isEditorMode) {
      fetchPageContent();
    }
  }, [isEditorMode]);

  const fetchPageContent = async () => {
    try {
      const response = await pagesAPI.getOne('approach');
      if (response.data.data && response.data.data.content) {
        setPageContent((prev) => ({
          ...prev,
          ...response.data.data.content,
        }));
      }
    } catch (error) {
      console.log('Using default content for approach page');
    }
  };

  // Slider drag handlers
  const handleSliderMouseDown = (e) => {
    isDragging.current = true;
    e.preventDefault();
  };

  const handleSliderMouseMove = (e) => {
    if (!isDragging.current || !sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleSliderMouseUp = () => {
    isDragging.current = false;
  };

  const handleSliderTouchStart = (e) => {
    isDragging.current = true;
  };

  const handleSliderTouchMove = (e) => {
    if (!isDragging.current || !sliderRef.current) return;

    const touch = e.touches[0];
    const rect = sliderRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleSliderTouchEnd = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleSliderMouseMove);
    document.addEventListener('mouseup', handleSliderMouseUp);
    document.addEventListener('touchmove', handleSliderTouchMove);
    document.addEventListener('touchend', handleSliderTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleSliderMouseMove);
      document.removeEventListener('mouseup', handleSliderMouseUp);
      document.removeEventListener('touchmove', handleSliderTouchMove);
      document.removeEventListener('touchend', handleSliderTouchEnd);
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Hero Section - Coral Background */}
      {shouldRenderSection('hero') && (
        <EditableSection
          sectionId="hero"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'hero'}
          label="Hero Section"
          isHidden={isSectionHidden('hero')}
          style={{
            backgroundColor: '#E2775A',
            position: 'relative',
            overflow: 'hidden',
            minHeight: isMobile ? '700px' : isTablet ? '800px' : '966px',
          }}
        >
          {/* Background texture overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: pageContent.heroBackgroundImage ? `url(${getImageUrl(pageContent.heroBackgroundImage)})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'top left',
          }} />

          <div style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: isMobile ? '0 20px' : isTablet ? '0 60px' : '0 100px',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Hero Content */}
            <div style={{
              paddingTop: isMobile ? '40px' : isTablet ? '60px' : '78px',
            }}>
              {/* Main Heading */}
              <h1 style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '32px' : isTablet ? '44px' : '56px',
                fontWeight: 500,
                lineHeight: isMobile ? '1.2' : 'normal',
                color: '#fff',
                maxWidth: isMobile ? '100%' : '959px',
                marginBottom: isMobile ? '20px' : '32px',
              }}>
                {pageContent.heroTitle}{' '}
                <em style={{
                  fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                  fontStyle: 'italic',
                  fontWeight: 600,
                }}>
                  {pageContent.heroTitleItalic}
                </em>{' '}
                {pageContent.heroTitleContinue}
              </h1>

              {/* Description */}
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 500,
                lineHeight: '30px',
                color: '#fff',
                maxWidth: isMobile ? '100%' : '750px',
                marginBottom: isMobile ? '40px' : '0',
              }}>
                {pageContent.heroDescription}
              </p>
            </div>

            {/* Decorative Pill Shapes with Logo Card */}
            <div style={{
              position: 'absolute',
              right: isMobile ? '-200px' : isTablet ? '-150px' : '-200px',
              top: isMobile ? '400px' : isTablet ? '380px' : '460px',
              width: isMobile ? '500px' : isTablet ? '750px' : '1000px',
              height: isMobile ? '350px' : isTablet ? '450px' : '550px',
              display: 'flex',
              alignItems: 'center',
            }}>
              {/* 5 Pill rings - width:470 height:522 */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${i * (isMobile ? 50 : isTablet ? 75 : 102.55)}px`,
                  width: isMobile ? '235px' : isTablet ? '350px' : '470px',
                  height: isMobile ? '260px' : isTablet ? '390px' : '522px',
                  border: '2px solid #fff',
                  borderRadius: isMobile ? '180px' : isTablet ? '250px' : '322px',
                  backgroundColor: 'transparent',
                  transform: 'rotate(-90deg)',
                }} />
              ))}

              {/* White Logo Card - width:470 height:522 */}
              <div style={{
                position: 'absolute',
                left: 0,
                width: isMobile ? '235px' : isTablet ? '350px' : '470px',
                height: isMobile ? '260px' : isTablet ? '390px' : '522px',
                backgroundColor: '#fff',
                borderRadius: isMobile ? '180px' : isTablet ? '250px' : '322px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(-90deg)',
                padding: isMobile ? '60px 50px' : isTablet ? '100px 80px' : '131px 146px 163px 123px',
                boxSizing: 'border-box',
              }}>
                {/* Content rotated back */}
                <div style={{
                  transform: 'rotate(90deg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: isMobile ? '12px' : '42px',
                }}>
                  {/* Logo */}
                  {pageContent.heroLogoImage ? (
                    <img
                      src={getImageUrl(pageContent.heroLogoImage)}
                      alt={pageContent.heroLogoTitle}
                      style={{
                        width: isMobile ? '120px' : isTablet ? '160px' : '228px',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <h2 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '36px' : isTablet ? '48px' : '64px',
                      fontWeight: 700,
                      color: '#1a365d',
                      margin: 0,
                    }}>
                      {pageContent.heroLogoTitle || 'drips'}
                    </h2>
                  )}
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '14px' : '18px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      color: '#000',
                      margin: 0,
                      lineHeight: '24px',
                    }}>
                      {pageContent.heroLogoSubtitle1}
                    </p>
                    <p style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '14px' : '18px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      color: '#000',
                      margin: 0,
                      lineHeight: '24px',
                    }}>
                      {pageContent.heroLogoSubtitle2}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </EditableSection>
      )}

      {/* Process Section - Title */}
      {shouldRenderSection('process') && (
        <EditableSection
          sectionId="process"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'process'}
          label="Process Section"
          isHidden={isSectionHidden('process')}
          style={{
            padding: isMobile ? '60px 20px' : isTablet ? '80px 60px' : '133px 100px',
            textAlign: 'center',
          }}
        >
          <h2 style={{
            fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '28px' : isTablet ? '40px' : '50px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 'normal',
            letterSpacing: '-1px',
            color: '#000',
            width: isMobile ? '100%' : '799px',
            maxWidth: '100%',
            margin: '0 auto',
          }}>
            <em style={{
              fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
              fontStyle: 'italic',
              fontWeight: 600,
            }}>
              {pageContent.processTitle}
            </em>{' '}
            <span style={{ fontWeight: 400 }}>
              {pageContent.processTitleNormal1 || 'that helps'}
            </span>
            <br />
            <span style={{ fontWeight: 400 }}>
              {pageContent.processTitleNormal2 || 'businesses design products for'}
            </span>
            <br />
            <em style={{
              fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
              fontStyle: 'italic',
              fontWeight: 600,
            }}>
              {pageContent.processTitleItalic}
            </em>
          </h2>
        </EditableSection>
      )}

      {/* Steps Section */}
      {shouldRenderSection('steps') && (
        <EditableSection
          sectionId="steps"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'steps'}
          label="Process Steps"
          isHidden={isSectionHidden('steps')}
          style={{
            padding: isMobile ? '0' : isTablet ? '0' : '0',
            maxWidth: '100%',
            margin: '0',
          }}
        >
          {/* Step 1 - Text Left, Image Right */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '32px' : isTablet ? '40px' : '60px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '150px',
            paddingLeft: isMobile ? '20px' : isTablet ? '60px' : '100px',
            overflow: 'hidden',
          }}>
            {/* Text Content */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 400px',
              width: isMobile ? '100%' : '400px',
              paddingRight: isMobile ? '20px' : '0',
            }}>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '36px' : '50px',
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: '48px',
                color: '#1e1e1e',
                marginBottom: '22px',
              }}>
                {pageContent.step1Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '28px' : '40px',
                fontWeight: 500,
                lineHeight: 'normal',
                color: '#000',
                marginBottom: '32px',
              }}>
                {pageContent.step1Title}
              </h3>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 500,
                lineHeight: '30px',
                color: 'rgba(0, 0, 0, 0.8)',
                marginBottom: '24px',
              }}>
                {pageContent.step1Desc1}
              </p>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 500,
                lineHeight: '30px',
                color: 'rgba(0, 0, 0, 0.8)',
              }}>
                {pageContent.step1Desc2}
              </p>
            </div>

            {/* Image - extends to right edge */}
            <div style={{
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '580px' : '780px',
              height: isMobile ? '380px' : isTablet ? '600px' : '820px',
              borderRadius: '24px 0 0 24px',
              overflow: 'hidden',
              position: 'relative',
              marginRight: isMobile ? '-20px' : isTablet ? '-60px' : '-100px',
            }}>
              {pageContent.step1Image ? (
                <img
                  src={getImageUrl(pageContent.step1Image)}
                  alt="Discovery Workshop"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '24px 0 0 24px',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '18px',
                }}>
                  Step 1 Image
                </div>
              )}
            </div>
          </div>

          {/* Step 2 - Image Left, Text Right */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '32px' : isTablet ? '40px' : '60px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '150px',
            paddingRight: isMobile ? '20px' : isTablet ? '60px' : '100px',
            overflow: 'hidden',
          }}>
            {/* Image - extends to left edge */}
            <div style={{
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '580px' : '780px',
              height: isMobile ? '380px' : isTablet ? '600px' : '820px',
              borderRadius: '0 24px 24px 0',
              overflow: 'hidden',
              position: 'relative',
              marginLeft: isMobile ? '-20px' : isTablet ? '-60px' : '-100px',
            }}>
              {pageContent.step2Image ? (
                <img
                  src={getImageUrl(pageContent.step2Image)}
                  alt="Transform"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '0 24px 24px 0',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '18px',
                }}>
                  Step 2 Image
                </div>
              )}
            </div>

            {/* Text Content */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 400px',
              width: isMobile ? '100%' : '400px',
              paddingLeft: isMobile ? '20px' : '0',
            }}>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '36px' : '50px',
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: '48px',
                color: '#1e1e1e',
                marginBottom: '22px',
              }}>
                {pageContent.step2Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '28px' : '40px',
                fontWeight: 500,
                lineHeight: 'normal',
                color: '#000',
                marginBottom: '32px',
              }}>
                {pageContent.step2Title}
              </h3>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 500,
                lineHeight: '30px',
                color: 'rgba(0, 0, 0, 0.8)',
              }}>
                {pageContent.step2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 - Text Left, Image Right */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '32px' : isTablet ? '40px' : '60px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '150px',
            paddingLeft: isMobile ? '20px' : isTablet ? '60px' : '100px',
            overflow: 'hidden',
          }}>
            {/* Text Content */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 400px',
              width: isMobile ? '100%' : '400px',
              paddingRight: isMobile ? '20px' : '0',
            }}>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '36px' : '50px',
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: '48px',
                color: '#1e1e1e',
                marginBottom: '22px',
              }}>
                {pageContent.step3Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '28px' : '40px',
                fontWeight: 500,
                lineHeight: 'normal',
                color: '#000',
                marginBottom: '32px',
              }}>
                {pageContent.step3Title}
              </h3>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 500,
                lineHeight: '30px',
                color: 'rgba(0, 0, 0, 0.8)',
              }}>
                {pageContent.step3Desc}
              </p>
            </div>

            {/* Image - extends to right edge */}
            <div style={{
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '580px' : '780px',
              height: isMobile ? '380px' : isTablet ? '600px' : '820px',
              borderRadius: '24px 0 0 24px',
              overflow: 'hidden',
              position: 'relative',
              marginRight: isMobile ? '-20px' : isTablet ? '-60px' : '-100px',
            }}>
              {pageContent.step3Image ? (
                <img
                  src={getImageUrl(pageContent.step3Image)}
                  alt="Design for Impact"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '24px 0 0 24px',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '18px',
                }}>
                  Step 3 Image
                </div>
              )}
            </div>
          </div>

          {/* Step 4 - Image Left, Text Right */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '32px' : isTablet ? '40px' : '60px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '150px',
            paddingRight: isMobile ? '20px' : isTablet ? '60px' : '100px',
            overflow: 'hidden',
          }}>
            {/* Image - extends to left edge */}
            <div style={{
              flex: 1,
              minWidth: isMobile ? '100%' : isTablet ? '580px' : '780px',
              height: isMobile ? '380px' : isTablet ? '600px' : '820px',
              borderRadius: '0 24px 24px 0',
              overflow: 'hidden',
              position: 'relative',
              marginLeft: isMobile ? '-20px' : isTablet ? '-60px' : '-100px',
            }}>
              {pageContent.step4Image ? (
                <img
                  src={getImageUrl(pageContent.step4Image)}
                  alt="Scale for Growth"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: '0 24px 24px 0',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '18px',
                }}>
                  Step 4 Image
                </div>
              )}
            </div>

            {/* Text Content */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 400px',
              width: isMobile ? '100%' : '400px',
              paddingLeft: isMobile ? '20px' : '0',
            }}>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '36px' : '50px',
                fontStyle: 'italic',
                fontWeight: 600,
                lineHeight: '48px',
                color: '#1e1e1e',
                marginBottom: '22px',
              }}>
                {pageContent.step4Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '28px' : '40px',
                fontWeight: 500,
                lineHeight: 'normal',
                color: '#000',
                marginBottom: '32px',
              }}>
                {pageContent.step4Title}
              </h3>
              <p style={{
                fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 500,
                lineHeight: '30px',
                color: 'rgba(0, 0, 0, 0.8)',
              }}>
                {pageContent.step4Desc}
              </p>
            </div>
          </div>
        </EditableSection>
      )}

      {/* KPI Section */}
      {shouldRenderSection('kpi') && (
        <EditableSection
          sectionId="kpi"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'kpi'}
          label="KPI Section"
          isHidden={isSectionHidden('kpi')}
          style={{
            padding: isMobile ? '60px 20px' : isTablet ? '80px 60px' : '100px 100px',
            textAlign: 'center',
          }}
        >
          <h2 style={{
            fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '28px' : isTablet ? '40px' : '50px',
            fontWeight: 500,
            lineHeight: 'normal',
            letterSpacing: '-1px',
            color: '#000',
            maxWidth: '716px',
            margin: '0 auto 40px',
          }}>
            <span style={{ fontWeight: 500 }}>{pageContent.kpiTitle}</span>{' '}
            <em style={{
              fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
              fontStyle: 'italic',
              fontWeight: 600,
            }}>
              {pageContent.kpiTitleItalic}
            </em>{' '}
            <span style={{ fontWeight: 500 }}>{pageContent.kpiTitleEnd}</span>
          </h2>

          {/* Logo Circles */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '13px',
          }}>
            {(pageContent.kpiLogos || []).map((logo, index) => (
              <div key={logo.id || index} style={{
                position: 'relative',
                width: index === 0 ? '110px' : '100px',
                height: index === 0 ? '110px' : '100px',
              }}>
                {/* Active ring for first item */}
                {index === 0 && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '1px solid #2558bf',
                    borderRadius: '50%',
                  }} />
                )}
                <div style={{
                  position: 'absolute',
                  top: index === 0 ? '5px' : '0',
                  left: index === 0 ? '5px' : '0',
                  width: '100px',
                  height: '100px',
                  backgroundColor: '#d3d3d3',
                  borderRadius: '50%',
                  overflow: 'hidden',
                }}>
                  {logo.image && (
                    <img
                      src={getImageUrl(logo.image)}
                      alt={`Logo ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </EditableSection>
      )}

      {/* Before/After Slider Section */}
      {shouldRenderSection('beforeAfter') && (
        <EditableSection
          sectionId="beforeAfter"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'beforeAfter'}
          label="Before/After Section"
          isHidden={isSectionHidden('beforeAfter')}
          style={{
            backgroundColor: '#c4c4c4',
            position: 'relative',
            height: isMobile ? '300px' : isTablet ? '400px' : '578px',
            overflow: 'hidden',
          }}
        >
          <div
            ref={sliderRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              cursor: 'ew-resize',
            }}
          >
            {/* Before Image (left side) */}
            {pageContent.beforeImage && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${sliderPosition}%`,
                height: '100%',
                overflow: 'hidden',
              }}>
                <img
                  src={getImageUrl(pageContent.beforeImage)}
                  alt="Before"
                  style={{
                    width: '1440px',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* After Image (right side) */}
            {pageContent.afterImage && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: `${100 - sliderPosition}%`,
                height: '100%',
                overflow: 'hidden',
              }}>
                <img
                  src={getImageUrl(pageContent.afterImage)}
                  alt="After"
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '1440px',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}

            {/* Slider Handle */}
            <div
              style={{
                position: 'absolute',
                left: `${sliderPosition}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'ew-resize',
              }}
              onMouseDown={handleSliderMouseDown}
              onTouchStart={handleSliderTouchStart}
            >
              {/* Vertical Line */}
              <div style={{
                width: '6px',
                height: isMobile ? '200px' : isTablet ? '300px' : '548px',
                backgroundColor: '#000',
                borderRadius: '24px',
              }} />
              {/* Circle Handle */}
              <div style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                backgroundColor: '#fff',
                border: '2px solid #000',
                borderRadius: '50%',
              }} />
            </div>
          </div>
        </EditableSection>
      )}

      {/* CTA Section */}
      {shouldRenderSection('cta') && (
        <EditableSection
          sectionId="cta"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'cta'}
          label="CTA Section"
          isHidden={isSectionHidden('cta')}
          style={{
            padding: isMobile ? '60px 20px' : isTablet ? '80px 60px' : '120px 100px',
            paddingBottom: isMobile ? '0' : isTablet ? '150px' : '180px',
          }}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            {isMobile ? (
              /* Mobile Layout - Vertical stacking */
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Green Section - Top */}
                <div
                  style={{
                    backgroundColor: '#E1FFA0',
                    padding: '60px 24px 80px',
                    borderTopLeftRadius: '160px',
                    borderTopRightRadius: '160px',
                    textAlign: 'center',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '32px',
                      fontWeight: 500,
                      lineHeight: 'normal',
                      letterSpacing: '-1px',
                      color: '#000',
                      marginBottom: '16px',
                    }}
                  >
                    {pageContent.ctaTitle}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      lineHeight: '24px',
                      color: '#000',
                      maxWidth: '300px',
                      margin: '0 auto',
                    }}
                  >
                    {pageContent.ctaDescription}
                  </p>
                </div>

                {/* Black Section - Bottom */}
                <div
                  style={{
                    backgroundColor: '#000',
                    width: '100%',
                    maxWidth: '474px',
                    padding: '48px 32px 40px',
                    marginTop: '-40px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginBottom: '64px',
                    borderRadius: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <Link
                    to="/contact"
                    style={{
                      display: 'flex',
                      width: '100%',
                      maxWidth: '323px',
                      height: '62px',
                      padding: '12px 24px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderRadius: '100px',
                      textDecoration: 'none',
                    }}
                  >
                    <span
                      style={{
                        color: '#000',
                        fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                        fontSize: '20px',
                        fontWeight: 600,
                      }}
                    >
                      {pageContent.ctaButtonText}
                    </span>
                  </Link>
                  <p
                    style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: 0,
                    }}
                  >
                    <img src={vectorIcon} alt="" style={{ width: '18px', height: '20px' }} />
                    Get instant response
                  </p>
                </div>
              </div>
            ) : (
              /* Desktop/Tablet Layout - Horizontal */
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: '253px',
                }}
              >
                {/* Left - Green Section */}
                <div
                  style={{
                    backgroundColor: '#E1FFA0',
                    padding: '68px 83px',
                    paddingRight: isTablet ? '250px' : '350px',
                    borderRadius: '300px',
                    height: '100%',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isTablet ? '32px' : '42px',
                      fontWeight: 500,
                      lineHeight: 'normal',
                      letterSpacing: '-1px',
                      color: '#000',
                      marginBottom: '10px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pageContent.ctaTitle}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isTablet ? '18px' : '20px',
                      fontWeight: 500,
                      lineHeight: '28px',
                      color: '#000',
                      maxWidth: '539px',
                    }}
                  >
                    {pageContent.ctaDescription}
                  </p>
                </div>

                {/* Right - Black Section */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    backgroundColor: '#000',
                    padding: '48px 64px',
                    width: isTablet ? '400px' : '556px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '9px',
                    borderRadius: '300px',
                  }}
                >
                  <Link
                    to="/contact"
                    style={{
                      display: 'flex',
                      width: isTablet ? '280px' : '346px',
                      height: '64px',
                      padding: '12px 24px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#fff',
                      borderRadius: '200px',
                      textDecoration: 'none',
                    }}
                  >
                    <span
                      style={{
                        color: '#000',
                        fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                        fontSize: isTablet ? '20px' : '24px',
                        fontWeight: 600,
                        lineHeight: '24px',
                      }}
                    >
                      {pageContent.ctaButtonText}
                    </span>
                  </Link>
                  <p
                    style={{
                      fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '11px',
                      margin: 0,
                    }}
                  >
                    <img src={vectorIcon} alt="" style={{ width: '18px', height: '20px' }} />
                    Get instant response
                  </p>
                </div>
              </div>
            )}
          </div>
        </EditableSection>
      )}
    </div>
  );
};

export default Approach;
