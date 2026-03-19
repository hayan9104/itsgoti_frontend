import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useWindowSize from '@/hooks/useWindowSize';
import useSmoothScroll from '@/hooks/useSmoothScroll';
import useScrollAnimations from '@/hooks/useScrollAnimations';
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

  // Initialize smooth scrolling
  useSmoothScroll(!isMobile);
  useScrollAnimations(!isMobile);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

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
  const handleSliderMove = useCallback((clientX, clientY) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const isMobileView = window.innerWidth <= 768;

    if (isMobileView) {
      const y = clientY - rect.top;
      const percentage = Math.max(5, Math.min(95, (y / rect.height) * 100));
      setSliderPosition(percentage);
    } else {
      const x = clientX - rect.left;
      const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  }, []);

  const handleSliderMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleSliderMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX, e.clientY);
  }, [isDragging, handleSliderMove]);

  const handleSliderMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSliderTouchStart = () => {
    setIsDragging(true);
  };

  const handleSliderTouchMove = useCallback((e) => {
    if (!isDragging) return;
    handleSliderMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [isDragging, handleSliderMove]);

  const handleSliderTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleSliderMouseMove);
      window.addEventListener('mouseup', handleSliderMouseUp);
      window.addEventListener('touchmove', handleSliderTouchMove);
      window.addEventListener('touchend', handleSliderTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleSliderMouseMove);
      window.removeEventListener('mouseup', handleSliderMouseUp);
      window.removeEventListener('touchmove', handleSliderTouchMove);
      window.removeEventListener('touchend', handleSliderTouchEnd);
    };
  }, [isDragging, handleSliderMouseMove, handleSliderMouseUp, handleSliderTouchMove, handleSliderTouchEnd]);

  return (
    <div style={{ backgroundColor: '#fff' }}>
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
            maxWidth: '100%',
            margin: '0',
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
              right: isMobile ? '-150px' : isTablet ? '-150px' : '-130px',
              top: isMobile ? '410px' : isTablet ? '380px' : '460px',
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
            fontSize: isMobile ? '26px' : isTablet ? '40px' : '50px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 'normal',
            letterSpacing: isMobile ? '-0.26px' : '-1px',
            color: '#000',
            width: isMobile ? '100%' : '799px',
            maxWidth: '100%',
            margin: '0 auto',
          }}>
            {isMobile ? (
              <>
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
                  businesses design products
                </span>
                <br />
                <span style={{ fontWeight: 400 }}>for </span>
                <em style={{
                  fontFamily: "'Gilroy', 'Plus Jakarta Sans', sans-serif",
                  fontStyle: 'italic',
                  fontWeight: 600,
                }}>
                  {pageContent.processTitleItalic}
                </em>
              </>
            ) : (
              <>
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
              </>
            )}
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
            flexDirection: isMobile ? 'column-reverse' : 'row',
            alignItems: isMobile ? 'flex-end' : 'center',
            gap: isMobile ? '0' : isTablet ? '40px' : '120px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '-50px',
            paddingLeft: isMobile ? '0' : isTablet ? '60px' : '100px',
            paddingRight: isMobile ? '0' : '0',
            overflow: 'hidden',
          }}>
            {/* Text Content */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 492px',
              width: isMobile ? '100%' : '492px',
              paddingLeft: isMobile ? '20px' : '0',
              paddingRight: isMobile ? '20px' : '0',
              textAlign: isMobile ? 'left' : 'left',
              marginTop: isMobile ? '-15px' : '0',
            }}>
              <p style={{
                fontFamily: "'Gilroy-SemiBoldItalic', 'Gilroy', sans-serif",
                fontSize: isMobile ? '32px' : '50px',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: '48px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '3px' : '22px',
              }}>
                {pageContent.step1Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '26px' : '40px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                letterSpacing: '-0.26px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '12px' : '32px',
                alignSelf: 'stretch',
              }}>
                {isMobile ? pageContent.step1Title : (
                  <>Discovery workshop &<br />research</>
                )}
              </h3>
              <p style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '18px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: isMobile ? '28px' : '30px',
                color: isMobile ? '#000' : 'rgba(0, 0, 0, 0.80)',
                marginBottom: '24px',
                maxWidth: isMobile ? '390px' : '492px',
              }}>
                {pageContent.step1Desc1}
              </p>
              <p style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '18px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: isMobile ? '28px' : '30px',
                color: isMobile ? '#000' : 'rgba(0, 0, 0, 0.80)',
                maxWidth: isMobile ? '390px' : '492px',
              }}>
                {pageContent.step1Desc2}
              </p>
            </div>

            {/* Image - extends to right edge */}
            <div style={{
              flex: isMobile ? 'none' : 1,
              width: isMobile ? '323px' : 'auto',
              minWidth: isMobile ? '323px' : isTablet ? '700px' : '850px',
              height: isMobile ? '368px' : isTablet ? '700px' : '850px',
              borderRadius: isMobile ? '24px' : '24px 0 0 24px',
              overflow: 'hidden',
              position: 'relative',
              marginRight: isMobile ? '-40px' : isTablet ? '-180px' : '-210px',
              marginLeft: isMobile ? '0' : '-100px',
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
                    borderRadius: isMobile ? '24px' : '24px 0 0 24px',
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
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '0' : isTablet ? '20px' : '20px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '-50px',
            paddingRight: isMobile ? '0' : isTablet ? '60px' : '100px',
            paddingLeft: isMobile ? '0' : '0',
            overflow: 'hidden',
          }}>
            {/* Image - extends to left edge */}
            <div style={{
              flex: isMobile ? 'none' : 1,
              width: isMobile ? '323px' : 'auto',
              minWidth: isMobile ? '323px' : isTablet ? '700px' : '850px',
              height: isMobile ? '368px' : isTablet ? '700px' : '850px',
              borderRadius: isMobile ? '24px' : '0 24px 24px 0',
              overflow: 'hidden',
              position: 'relative',
              marginLeft: isMobile ? '-40px' : isTablet ? '-140px' : '-95px',
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
                    borderRadius: isMobile ? '24px' : '0 24px 24px 0',
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
              flex: isMobile ? 'none' : '0 0 580px',
              width: isMobile ? '100%' : '580px',
              paddingLeft: isMobile ? '20px' : isTablet ? '60px' : '50px',
              paddingRight: isMobile ? '30px' : '0',
              textAlign: isMobile ? 'right' : 'left',
              marginTop: isMobile ? '-15px' : '0',
            }}>
              <p style={{
                fontFamily: "'Gilroy-SemiBoldItalic', 'Gilroy', sans-serif",
                fontSize: isMobile ? '32px' : '50px',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: '48px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '3px' : '22px',
              }}>
                {pageContent.step2Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '26px' : '40px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                letterSpacing: '-0.26px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '12px' : '32px',
              }}>
                {pageContent.step2Title}
              </h3>
              <p style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '18px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: isMobile ? '28px' : '30px',
                color: isMobile ? '#000' : 'rgba(0, 0, 0, 0.80)',
                maxWidth: isMobile ? '390px' : '492px',
              }}>
                {pageContent.step2Desc}
              </p>
            </div>
          </div>

          {/* Step 3 - Text Left, Image Right */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            alignItems: isMobile ? 'flex-end' : 'center',
            gap: isMobile ? '0' : isTablet ? '40px' : '60px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '-50px',
            paddingLeft: isMobile ? '0' : isTablet ? '60px' : '100px',
            paddingRight: isMobile ? '0' : '0',
            overflow: 'hidden',
          }}>
            {/* Text Content */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 492px',
              width: isMobile ? '100%' : '492px',
              paddingLeft: isMobile ? '20px' : '0',
              paddingRight: isMobile ? '20px' : '0',
              textAlign: isMobile ? 'left' : 'left',
              marginTop: isMobile ? '-15px' : '0',
            }}>
              <p style={{
                fontFamily: "'Gilroy-SemiBoldItalic', 'Gilroy', sans-serif",
                fontSize: isMobile ? '32px' : '50px',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: '48px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '3px' : '22px',
              }}>
                {pageContent.step3Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '26px' : '40px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                letterSpacing: '-0.26px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '12px' : '32px',
              }}>
                {pageContent.step3Title}
              </h3>
              <p style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '18px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: isMobile ? '28px' : '30px',
                color: isMobile ? '#000' : 'rgba(0, 0, 0, 0.80)',
                maxWidth: isMobile ? '390px' : '492px',
              }}>
                {pageContent.step3Desc}
              </p>
            </div>

            {/* Image - extends to right edge */}
            <div style={{
              flex: isMobile ? 'none' : 1,
              width: isMobile ? '323px' : 'auto',
              minWidth: isMobile ? '323px' : isTablet ? '700px' : '850px',
              height: isMobile ? '368px' : isTablet ? '700px' : '850px',
              borderRadius: isMobile ? '24px' : '24px 0 0 24px',
              overflow: 'hidden',
              position: 'relative',
              marginRight: isMobile ? '-40px' : isTablet ? '-180px' : '-210px',
              marginLeft: isMobile ? '0' : '-100px',
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
                    borderRadius: isMobile ? '24px' : '24px 0 0 24px',
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
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '0' : isTablet ? '20px' : '20px',
            marginBottom: isMobile ? '60px' : isTablet ? '100px' : '-50px',
            paddingRight: isMobile ? '0' : isTablet ? '60px' : '100px',
            paddingLeft: isMobile ? '0' : '0',
            overflow: 'hidden',
          }}>
            {/* Image - extends to left edge */}
            <div style={{
              flex: isMobile ? 'none' : 1,
              width: isMobile ? '323px' : 'auto',
              minWidth: isMobile ? '323px' : isTablet ? '700px' : '850px',
              height: isMobile ? '368px' : isTablet ? '700px' : '850px',
              borderRadius: isMobile ? '24px' : '0 24px 24px 0',
              overflow: 'hidden',
              position: 'relative',
              marginLeft: isMobile ? '-40px' : isTablet ? '-140px' : '-45px',
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
                    borderRadius: isMobile ? '24px' : '0 24px 24px 0',
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
              flex: isMobile ? 'none' : '0 0 580px',
              width: isMobile ? '100%' : '580px',
              paddingLeft: isMobile ? '20px' : isTablet ? '60px' : '70px',
              paddingRight: isMobile ? '30px' : '0',
              textAlign: isMobile ? 'right' : 'left',
            }}>
              <p style={{
                fontFamily: "'Gilroy-SemiBoldItalic', 'Gilroy', sans-serif",
                fontSize: isMobile ? '32px' : '50px',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: '48px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '3px' : '22px',
              }}>
                {pageContent.step4Number}
              </p>
              <h3 style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '26px' : '40px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                letterSpacing: '-0.26px',
                color: '#1E1E1E',
                marginBottom: isMobile ? '12px' : '32px',
              }}>
                {pageContent.step4Title}
              </h3>
              <p style={{
                fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                fontSize: isMobile ? '18px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: isMobile ? '28px' : '30px',
                color: isMobile ? '#000' : 'rgba(0, 0, 0, 0.80)',
                maxWidth: isMobile ? '390px' : '492px',
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
            gap: isMobile ? '8px' : '13px',
          }}>
            {(pageContent.kpiLogos || []).map((logo, index) => (
              <div key={logo.id || index} style={{
                position: 'relative',
                width: isMobile ? (index === 0 ? '72px' : '64px') : (index === 0 ? '110px' : '100px'),
                height: isMobile ? (index === 0 ? '72px' : '64px') : (index === 0 ? '110px' : '100px'),
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
                  width: isMobile ? '62px' : '100px',
                  height: isMobile ? '62px' : '100px',
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
            height: isMobile ? '654px' : isTablet ? '400px' : '578px',
            overflow: 'hidden',
          }}
        >
          <div
            ref={sliderRef}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              cursor: isMobile ? 'ns-resize' : 'ew-resize',
              userSelect: 'none',
              touchAction: 'none',
            }}
          >
            {/* Before Image - Top on mobile, Left on desktop */}
            {pageContent.beforeImage && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: isMobile ? '100%' : `${sliderPosition}%`,
                height: isMobile ? `${sliderPosition}%` : '100%',
                overflow: 'hidden',
                willChange: 'width, height',
              }}>
                <img
                  src={getImageUrl(pageContent.beforeImage)}
                  alt="Before"
                  style={{
                    width: '100%',
                    height: isMobile ? '654px' : '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              </div>
            )}

            {/* After Image - Bottom on mobile, Right on desktop */}
            {pageContent.afterImage && (
              <div style={{
                position: 'absolute',
                top: isMobile ? `${sliderPosition}%` : 0,
                bottom: isMobile ? 0 : 'auto',
                right: isMobile ? 'auto' : 0,
                left: isMobile ? 0 : 'auto',
                width: isMobile ? '100%' : `${100 - sliderPosition}%`,
                height: isMobile ? `${100 - sliderPosition}%` : '100%',
                overflow: 'hidden',
                willChange: 'width, height, top',
              }}>
                <img
                  src={getImageUrl(pageContent.afterImage)}
                  alt="After"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: isMobile ? 'auto' : 0,
                    width: '100%',
                    height: isMobile ? '654px' : '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              </div>
            )}

            {/* Slider Handle */}
            <div
              style={{
                position: 'absolute',
                left: isMobile ? 0 : `${sliderPosition}%`,
                right: isMobile ? 0 : 'auto',
                top: isMobile ? `${sliderPosition}%` : '50%',
                transform: isMobile ? 'translateY(-50%)' : 'translate(-50%, -50%)',
                height: isMobile ? '60px' : 'auto',
                zIndex: 10,
                display: 'flex',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDragging ? 'grabbing' : (isMobile ? 'ns-resize' : 'ew-resize'),
              }}
              onMouseDown={handleSliderMouseDown}
              onTouchStart={handleSliderTouchStart}
            >
              {/* Line - Horizontal on mobile, Vertical on desktop */}
              <div style={{
                position: isMobile ? 'absolute' : 'relative',
                left: isMobile ? '10px' : 'auto',
                right: isMobile ? '10px' : 'auto',
                width: isMobile ? 'auto' : '6px',
                height: isMobile ? '6px' : isTablet ? '300px' : '548px',
                backgroundColor: '#000',
                borderRadius: '24px',
              }} />
              {/* Circle Handle */}
              <div style={{
                position: isMobile ? 'relative' : 'absolute',
                top: isMobile ? 'auto' : '50%',
                transform: isMobile ? 'none' : 'translateY(-50%)',
                width: isMobile ? '20px' : '24px',
                height: isMobile ? '20px' : '24px',
                backgroundColor: '#fff',
                border: '2px solid #000',
                borderRadius: '50%',
                zIndex: 11,
                pointerEvents: 'none',
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
            paddingTop: isMobile ? '80px' : isTablet ? '80px' : '120px',
            paddingBottom: isMobile ? '70px' : isTablet ? '150px' : '180px',
            paddingLeft: isMobile ? '0' : isTablet ? '60px' : '100px',
            paddingRight: isMobile ? '0' : isTablet ? '60px' : '100px',
          }}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            {isMobile ? (
              /* Mobile Layout - Vertical stacking */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
              }}>
                {/* Green Section - Top */}
                <div
                  style={{
                    backgroundColor: '#E1FFA0',
                    width: '474px',
                    maxWidth: '110%',
                    height: '403px',
                    padding: '81px 42px 0',
                    borderRadius: '160px',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                      fontSize: '32px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      letterSpacing: '-1px',
                      color: '#000',
                      textAlign: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    {pageContent.ctaTitle}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '24px',
                      color: '#000',
                      width: '346px',
                      maxWidth: '100%',
                      margin: '0 auto',
                    }}
                  >
                    {pageContent.ctaDescription}
                  </p>
                </div>

                {/* Black Section - Overlapping below */}
                <div
                  style={{
                    backgroundColor: '#000',
                    width: '474px',
                    maxWidth: '110%',
                    height: '175px',
                    padding: '42px 61px',
                    marginTop: '-175px',
                    position: 'relative',
                    zIndex: 2,
                    borderRadius: '160px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '9px',
                  }}
                >
                  <Link
                    to="/contact"
                    style={{
                      display: 'flex',
                      width: '323px',
                      height: '62px',
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
                        textAlign: 'center',
                        fontFamily: "'Gilroy-SemiBold', 'Gilroy', sans-serif",
                        fontSize: '22px',
                        fontWeight: 400,
                        lineHeight: '24px',
                      }}
                    >
                      {pageContent.ctaButtonText}
                    </span>
                  </Link>
                  <p
                    style={{
                      fontFamily: "'Gilroy-Medium', 'Gilroy', sans-serif",
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '11px',
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
