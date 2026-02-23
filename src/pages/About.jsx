import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useWindowSize from '../hooks/useWindowSize';
import { pagesAPI } from '../services/api';
import arrowLeft from '../assets/arrow-left.png';
import arrowRight from '../assets/arrow-right.png';
import vectorIcon from '../assets/Vector.png';
import quoteIcon from '../assets/Screenshot 2026-02-17 185830.png';
import EditableSection from '../components/EditableSection';

// Helper to get full image URL (for dev environment where frontend and backend are on different ports)
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${path}`;
};

const About = () => {
  const { isMobile, isTablet } = useWindowSize();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const stickyRef = useRef(null);

  // Editor mode detection
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const [selectedSection, setSelectedSection] = useState(null);

  // Page content from CMS
  const [pageContent, setPageContent] = useState({
    // Hero Section
    heroTitle1: 'What matters',
    heroTitle1Italic: 'tomorrow,',
    heroTitle2: 'We design',
    heroTitle2Italic: 'today.',
    // Desktop Hero Images
    heroImage1: '',
    heroImage2: '',
    // Mobile Hero Images
    heroImage1Mobile: '',
    heroImage2Mobile: '',
    // Design Box
    designBoxSubtitle: "Design isn't decoration.",
    designBoxLine1: "It's clarity.",
    designBoxLine2: "It's strategy.",
    designBoxLine3: "It's momentum.",
    designBoxLink: 'Explore Our Work',
    // You don't need section
    sectionTitle: 'You don\'t need "70+" people.',
    sectionSubtitle: 'You need elite energy.',
    sectionDescription: 'We are UX/UI agency helping ambitious companies and visionary entrepreneurs bring the next design revolution.',
    sectionAvatars: [
      { id: 1, image: '' },
      { id: 2, image: '' },
      { id: 3, image: '' },
      { id: 4, image: '' },
    ],
    logos: [
      { name: 'TOMATTIC', id: 1 },
      { name: 'TheStoryple', id: 2 },
      { name: 'SPEECH', id: 3 },
      { name: 'gusto', id: 4 },
      { name: 'attentive', id: 5 },
      { name: 'SONY', id: 6 },
      { name: 'Square', id: 7 },
      { name: 'AdMob', id: 8 },
      { name: 'drips', id: 9 },
      { name: 'Dropbox', id: 10 },
    ],
    logosMobile: [
      { name: 'TOMATTIC', id: 1 },
      { name: 'TheStoryple', id: 2 },
      { name: 'SPEECH', id: 3 },
      { name: 'gusto', id: 4 },
      { name: 'attentive', id: 5 },
      { name: 'SONY', id: 6 },
    ],
    // 10 Minds section
    mindsTitle: '10 Minds. Built Different.',
    mindsImage: '',
    mindsImages: [
      { id: 1, image: '' },
      { id: 2, image: '' },
      { id: 3, image: '' },
    ],
    mindsDescription: 'GOTI is a name that sparks curiosity and stays with you. Beyond its simplicity, it represents strategy, unity, and bold movement in everything we build.',
    mindsClientLabel: 'Look what our client said..',
    // Testimonial Heading (from About page admin)
    testimonialTextItalic: 'GOTI',
    testimonialTextNormal: 'is a name that sparks curiosity and stays with you. Beyond its simplicity, it represents strategy, unity, and bold movement in everything we build.',
    clientLabelItalic: 'Look',
    clientLabelNormal: 'what our client said..',
    // CTA Section
    ctaTitle: 'Ready to start a project?',
    ctaDescription: 'We combine strategy, design, and performance to create experiences that convert.',
    ctaButtonText: 'Schedule Call',
  });

  // Testimonial content from Landing page (array of testimonials)
  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      quote1: 'Lorem ipsum dolor sit amet consectetur. Ullamcorper amet arcu quis elementum. Convallis purus mauris at in.',
      quote2: 'Pretium pharetra aliquam consequat duis ac risus vitae sollicitudin pharetra.',
      authorName: 'Joyce Mia',
      authorRole: 'Founder',
      authorImage: '',
      stat1Value: '+45%',
      stat1Label: 'AOV (Average Order Value)',
      stat2Value: '+24%',
      stat2Label: 'CTR (Click-through rate)',
      stat3Value: '+16%',
      stat3Label: 'Return-rate per customer',
    },
  ]);

  // Listen for updates from parent editor (when in editor mode)
  useEffect(() => {
    if (!isEditorMode) return;

    const handleMessage = (event) => {
      // Security check
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

    // Notify parent that we're ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  // Fetch content from API (skip if in editor mode - data comes via postMessage)
  useEffect(() => {
    if (!isEditorMode) {
      fetchPageContent();
      fetchTestimonialContent();
    }
  }, [isEditorMode]);

  const fetchPageContent = async () => {
    try {
      const response = await pagesAPI.getOne('about');
      if (response.data.data && response.data.data.content) {
        setPageContent((prev) => ({
          ...prev,
          ...response.data.data.content,
        }));
      }
    } catch (error) {
      // Use default content if page not configured
      console.log('Using default content for about page');
    }
  };

  // Fetch testimonial content from Landing page (array of testimonials)
  const fetchTestimonialContent = async () => {
    try {
      const response = await pagesAPI.getOne('landing');
      if (response.data.data && response.data.data.content) {
        const content = response.data.data.content;
        if (content.testimonials && Array.isArray(content.testimonials) && content.testimonials.length > 0) {
          setTestimonials(content.testimonials);
        }
      }
    } catch (error) {
      console.log('Using default testimonial content');
    }
  };

  // Scroll effect for 10 Minds section
  useEffect(() => {
    const handleScroll = () => {
      if (!stickyRef.current) return;

      const section = stickyRef.current;
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;

      // Calculate scroll progress within the sticky section
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (sectionHeight - viewportHeight)));

      // Get images array
      const images = pageContent.mindsImages || [];
      const numImages = images.length || 1;

      // Calculate which image to show
      const imageIndex = Math.min(Math.floor(scrollProgress * numImages), numImages - 1);
      setCurrentImageIndex(imageIndex);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageContent.mindsImages]);

  // Split logos into two rows - use mobile logos on mobile
  const allLogos = isMobile ? (pageContent.logosMobile || pageContent.logos) : pageContent.logos;
  const logos = allLogos.slice(0, 6);
  const logos2 = isMobile ? [] : allLogos.slice(6, 10);

  // Get current testimonial from array
  const currentTestimonial = testimonials[currentTestimonialIndex] || testimonials[0] || {};
  const hasMultipleTestimonials = testimonials.length > 1;

  // Build stats array from current testimonial
  const stats = [
    { value: currentTestimonial.stat1Value, label: currentTestimonial.stat1Label },
    { value: currentTestimonial.stat2Value, label: currentTestimonial.stat2Label },
    { value: currentTestimonial.stat3Value, label: currentTestimonial.stat3Label },
  ];

  return (
    <div style={{ backgroundColor: '#fff' }}>
      {/* Hero Section - Black Background */}
      <EditableSection
        sectionId="hero"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'hero'}
        label="Hero Section"
        style={{
          backgroundColor: '#0F0F0F',
          borderBottomLeftRadius: isMobile ? '0' : isTablet ? '200px' : '293px',
          borderBottomRightRadius: isMobile ? '0' : isTablet ? '200px' : '293px',
          paddingTop: isMobile ? '24px' : isTablet ? '60px' : '100px',
          paddingLeft: isMobile ? '0' : isTablet ? '40px' : '100px',
          paddingRight: isMobile ? '16px' : isTablet ? '40px' : '100px',
          paddingBottom: isMobile ? '0' : isTablet ? '600px' : '800px',
          position: 'relative',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto', paddingLeft: isMobile ? '16px' : '0' }}>
          {/* Hero Heading */}
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: isMobile ? '32px' : isTablet ? '56px' : '80px',
              fontWeight: 400,
              lineHeight: isMobile ? '1.2' : 'normal',
              letterSpacing: '-1px',
              color: '#FFFFFF',
              marginBottom: isMobile ? '24px' : '64px',
            }}
          >
            {pageContent.heroTitle1} <em style={{ fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', 'Inter', sans-serif", fontStyle: 'italic' }}>{pageContent.heroTitle1Italic}</em>
            <br />
            {pageContent.heroTitle2} <em style={{ fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', 'Inter', sans-serif", fontStyle: 'italic' }}>{pageContent.heroTitle2Italic}</em>
          </h1>
        </div>

        {/* Mobile: First Image inside black section - touches left edge, 80px from right */}
        {isMobile && (
          <div
            style={{
              width: 'calc(100% - 80px)',
              maxWidth: '348px',
              height: '273px',
              overflow: 'hidden',
            }}
          >
            {(pageContent.heroImage1Mobile || pageContent.heroImage1) ? (
              <img
                src={getImageUrl(pageContent.heroImage1Mobile || pageContent.heroImage1)}
                alt="Team"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                }}
              >
                Team Image 1
              </div>
            )}
          </div>
        )}
      </EditableSection>

      {/* Mobile: Design Text Section on Black Background */}
      {isMobile && (
        <section
          style={{
            backgroundColor: '#0F0F0F',
            padding: '32px 16px',
          }}
        >
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: 'normal',
              color: '#fff',
              marginBottom: '8px',
            }}
          >
            {pageContent.designBoxSubtitle}
          </p>
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '18px',
              fontWeight: 400,
              lineHeight: 'normal',
              color: '#fff',
              marginBottom: '24px',
            }}
          >
            {pageContent.designBoxLine1}
            <br />
            {pageContent.designBoxLine2}
            <br />
            {pageContent.designBoxLine3}
          </p>
          <Link
            to="/work"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'transparent',
              color: '#fff',
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              padding: '12px 24px',
              borderRadius: '100px',
              textDecoration: 'none',
              border: '1px solid #fff',
            }}
          >
            {pageContent.designBoxLink}
          </Link>
        </section>
      )}

      {/* Mobile: Second Image with split background - black top, white bottom */}
      {isMobile && (
        <section
          style={{
            position: 'relative',
            paddingBottom: '40px',
          }}
        >
          {/* Black background - top 30% */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '30%',
              backgroundColor: '#0F0F0F',
            }}
          />
          {/* White background - bottom 70% */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '70%',
              backgroundColor: '#fff',
            }}
          />
          {/* Image */}
          <div
            style={{
              position: 'relative',
              width: '430px',
              maxWidth: '100%',
              height: '274px',
              overflow: 'hidden',
              borderBottomLeftRadius: '160px',
              borderBottomRightRadius: '160px',
              zIndex: 1,
              margin: '0 auto',
            }}
          >
            {(pageContent.heroImage2Mobile || pageContent.heroImage2) ? (
              <img
                src={getImageUrl(pageContent.heroImage2Mobile || pageContent.heroImage2)}
                alt="Team"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                }}
              >
                Team Image 2
              </div>
            )}
          </div>
        </section>
      )}

      {/* Desktop/Tablet: Images and Design Text Section - Overlapping */}
      {!isMobile && (
        <section
          style={{
            marginTop: isTablet ? '-580px' : '-726px',
            paddingLeft: isTablet ? '40px' : '100px',
            paddingRight: isTablet ? '40px' : '100px',
            paddingBottom: isTablet ? '80px' : '100px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            {/* Hero Content Grid */}
            <div
              style={{
                position: 'relative',
                height: isTablet ? '500px' : '650px',
              }}
            >
              {/* Large Image - Left */}
              <div
                style={{
                  position: 'absolute',
                  left: '-105px',
                  top: '-50px',
                  width: isTablet ? '300px' : '512px',
                  height: isTablet ? '350px' : '503px',
                  overflow: 'hidden',
                }}
              >
                {pageContent.heroImage1 ? (
                  <img
                    src={getImageUrl(pageContent.heroImage1)}
                    alt="Team"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                    }}
                  >
                    Team Image 1
                  </div>
                )}
              </div>

              {/* Design Text - Center */}
              <div
                style={{
                  position: 'absolute',
                  left: isTablet ? '320px' : '460px',
                  top: isTablet ? '145px' : '235px',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 2,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isTablet ? '24px' : '28px',
                    fontWeight: 400,
                    lineHeight: 'normal',
                    color: '#FFFFFF',
                    marginBottom: '16px',
                  }}
                >
                  {pageContent.designBoxSubtitle}
                </p>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isTablet ? '24px' : '28px',
                    fontWeight: 400,
                    lineHeight: 'normal',
                    color: '#FFFFFF',
                    marginBottom: '24px',
                  }}
                >
                  {pageContent.designBoxLine1}
                  <br />
                  {pageContent.designBoxLine2}
                  <br />
                  {pageContent.designBoxLine3}
                </p>
                <Link
                  to="/work"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: '#FFFFFF',
                    color: '#0F0F0F',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '12px 24px',
                    borderRadius: '100px',
                    textDecoration: 'none',
                    width: 'fit-content',
                  }}
                >
                  {pageContent.designBoxLink}
                </Link>
              </div>

              {/* Small Image - Right */}
              <div
                style={{
                  position: 'absolute',
                  right: '-105px',
                  bottom: '-76px',
                  width: isTablet ? '350px' : '572px',
                  height: isTablet ? '400px' : '646px',
                  overflow: 'hidden',
                  borderBottomRightRadius: '293px',
                }}
              >
                {pageContent.heroImage2 ? (
                  <img
                    src={getImageUrl(pageContent.heroImage2)}
                    alt="Team"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#666',
                    }}
                  >
                    Team Image 2
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* You don't need 70+ people Section */}
      <EditableSection
        sectionId="youDontNeed"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'youDontNeed'}
        label="You Don't Need Section"
        style={{
          marginTop: isMobile ? '0px' : '0px',
          padding: isMobile ? '40px 20px' : isTablet ? '80px 40px' : '100px 100px',
          textAlign: 'center',
          backgroundColor: '#fff',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
        {/* Heading */}
        <h2
          style={{
            fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', 'Inter', sans-serif",
            fontSize: isMobile ? '28px' : isTablet ? '40px' : '50px',
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 'normal',
            letterSpacing: '-1px',
            color: '#000',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          {pageContent.sectionTitle}
        </h2>

        {/* Avatar group - centered */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: isMobile ? '0' : '12px',
          }}
        >
          <div style={{ display: 'flex' }}>
            {(pageContent.sectionAvatars || []).map((avatar, i) => (
              avatar.image ? (
                <img
                  key={avatar.id}
                  src={getImageUrl(avatar.image)}
                  alt={`Avatar ${i + 1}`}
                  style={{
                    width: isMobile ? '40px' : '32px',
                    height: isMobile ? '40px' : '32px',
                    borderRadius: '50%',
                    border: '2px solid #fff',
                    marginLeft: i > 0 ? '-10px' : '0',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  key={avatar.id}
                  style={{
                    width: isMobile ? '40px' : '32px',
                    height: isMobile ? '40px' : '32px',
                    borderRadius: '50%',
                    backgroundColor: '#e0e0e0',
                    border: '2px solid #fff',
                    marginLeft: i > 0 ? '-10px' : '0',
                  }}
                />
              )
            ))}
          </div>
        </div>

        {/* Subtitle - below avatars for mobile */}
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
            fontSize: isMobile ? '18px' : isTablet ? '20px' : '24px',
            fontWeight: 400,
            lineHeight: '24px',
            color: '#000',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        >
          {pageContent.sectionSubtitle}
        </p>

        {/* Description */}
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
            fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
            fontWeight: 400,
            lineHeight: isMobile ? '26px' : '24px',
            color: '#000',
            textAlign: 'center',
            maxWidth: isMobile ? '100%' : '645px',
            margin: '0 auto',
            marginBottom: isMobile ? '40px' : '60px',
            padding: isMobile ? '0' : '0',
          }}
        >
          {pageContent.sectionDescription}
        </p>

        {/* Mobile: All logos in flex wrap - no scrolling */}
        {isMobile && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px 32px',
              justifyContent: 'center',
            }}
          >
            {allLogos.map((logo) => (
              <div key={logo.id}>
                {logo.image ? (
                  <img
                    src={getImageUrl(logo.image)}
                    alt={logo.name}
                    style={{
                      width: 'auto',
                      height: '28px',
                      objectFit: 'contain',
                      filter: 'grayscale(100%)',
                      opacity: 0.6,
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '14px',
                      color: '#999',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {logo.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Desktop/Tablet: Logos Row 1 */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isTablet ? '40px' : '81px',
              marginBottom: '56px',
              flexWrap: 'nowrap',
            }}
          >
            {logos.map((logo) => (
              logo.image ? (
                <img
                  key={logo.id}
                  src={getImageUrl(logo.image)}
                  alt={logo.name}
                  style={{
                    width: 'auto',
                    height: isTablet ? '40px' : '48px',
                    objectFit: 'contain',
                    filter: 'grayscale(100%)',
                    opacity: 0.6,
                  }}
                />
              ) : (
                <span
                  key={logo.id}
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isTablet ? '16px' : '18px',
                    color: '#999',
                    fontWeight: 500,
                    height: isTablet ? '40px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {logo.name}
                </span>
              )
            ))}
          </div>
        )}

        {/* Desktop/Tablet: Logos Row 2 */}
        {!isMobile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isTablet ? '40px' : '81px',
              flexWrap: 'nowrap',
            }}
          >
            {logos2.map((logo) => (
              logo.image ? (
                <img
                  key={logo.id}
                  src={getImageUrl(logo.image)}
                  alt={logo.name}
                  style={{
                    width: 'auto',
                    height: isTablet ? '40px' : '48px',
                    objectFit: 'contain',
                    filter: 'grayscale(100%)',
                    opacity: 0.6,
                  }}
                />
              ) : (
                <span
                  key={logo.id}
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: isTablet ? '16px' : '18px',
                    color: '#999',
                    fontWeight: 500,
                    height: isTablet ? '40px' : '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {logo.name}
                </span>
              )
            ))}
          </div>
        )}
        </div>
      </EditableSection>

      {/* 10 Minds Built Different Section - Sticky Scroll */}
      <EditableSection
        sectionId="tenMinds"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'tenMinds'}
        label="10 Minds Section"
        style={{ position: 'relative' }}
      >
      {(() => {
        // Filter only images that have been uploaded
        const uploadedImages = (pageContent.mindsImages || []).filter(img => img.image);
        const imageCount = uploadedImages.length || 1;
        // Calculate scroll height based on number of images
        const scrollHeight = isMobile ? `${100 + (imageCount * 50)}vh` : `${100 + (imageCount * 80)}vh`;

        return (
          <div
            ref={stickyRef}
            style={{
              height: scrollHeight,
              position: 'relative',
            }}
          >
            {/* Layer 1: Orange Background */}
            <section
              style={{
                backgroundColor: '#E2775A',
                width: '100%',
                height: isMobile ? '500px' : isTablet ? '600px' : '775px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                overflow: 'hidden',
              }}
            >
              {/* Image Container */}
              <div
                style={{
                  position: 'relative',
                  width: isMobile ? '280px' : isTablet ? '320px' : '391px',
                  height: isMobile ? '380px' : isTablet ? '450px' : '531px',
                  overflow: 'hidden',
                }}
              >
                {/* Layer 2: First Image (base) */}
                {uploadedImages.length > 0 ? (
                  <img
                    src={getImageUrl(uploadedImages[0].image)}
                    alt="Team 1"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1,
                    }}
                  />
                ) : (
                  // Fallback if no images uploaded
                  pageContent.mindsImage ? (
                    <img
                      src={getImageUrl(pageContent.mindsImage)}
                      alt="Team"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 1,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        zIndex: 1,
                      }}
                    >
                      Upload images from admin
                    </div>
                  )
                )}

                {/* Layer 4+: Subsequent images scroll up from below */}
                {uploadedImages.slice(1).map((img, index) => (
                  <div
                    key={img.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      transform: `translateY(${Math.max(0, (index + 1 - currentImageIndex)) * 100}%)`,
                      transition: 'transform 0.6s ease-out',
                      zIndex: 10 + index,
                    }}
                  >
                    <img
                      src={getImageUrl(img.image)}
                      alt={`Team ${index + 2}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Text - Outside image container, always visible */}
              <h3
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 100,
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: isMobile ? '36px' : isTablet ? '56px' : '80px',
                  fontWeight: 400,
                  lineHeight: 'normal',
                  letterSpacing: '-3px',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  margin: 0,
                }}
              >
                {pageContent.mindsTitle}
              </h3>
            </section>
          </div>
        );
      })()}
      </EditableSection>

      {/* Testimonial Section */}
      <EditableSection
        sectionId="testimonialHeading"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'testimonialHeading'}
        label="Testimonial Heading"
        style={{
          padding: isMobile ? '60px 20px' : isTablet ? '80px 40px' : '100px 100px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          {/* GOTI Description - First word Italic, rest Normal */}
          <p
            style={{
              fontSize: isMobile ? '28px' : isTablet ? '32px' : '42px',
              fontWeight: 400,
              lineHeight: isMobile ? '44px' : isTablet ? '56px' : '72px',
              color: '#000',
              textAlign: 'center',
              maxWidth: isMobile ? '100%' : '1165px',
              margin: isMobile ? '0 auto 40px' : '0 auto 60px',
            }}
          >
            <em
              style={{
                fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', 'Inter', sans-serif",
                fontStyle: 'italic',
                marginRight: '0.25em',
              }}
            >
              {pageContent.testimonialTextItalic}
            </em>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                fontStyle: 'normal',
              }}
            >
              {pageContent.testimonialTextNormal}
            </span>
          </p>

          {/* Look what our client said - First word Italic */}
          <h3
            style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: isMobile ? '24px' : isTablet ? '40px' : '50px',
              fontWeight: 400,
              lineHeight: 'normal',
              letterSpacing: '-1px',
              color: '#000',
              marginBottom: isMobile ? '40px' : '60px',
            }}
          >
            <em style={{ fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', 'Inter', sans-serif", fontStyle: 'italic', marginRight: '0.25em' }}>{pageContent.clientLabelItalic}</em>
            {pageContent.clientLabelNormal}
          </h3>

          {/* Testimonial Content */}
          {isMobile ? (
            /* Mobile Layout */
            <div style={{ textAlign: 'left' }}>
              {/* Quote Mark */}
              <div style={{ marginBottom: '16px' }}>
                <img
                  src={quoteIcon}
                  alt="quote"
                  style={{
                    width: '36px',
                    height: 'auto',
                  }}
                />
              </div>
              {/* Quote Text - Two paragraphs */}
              <div style={{ marginBottom: '32px' }}>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    color: '#000',
                    width: '378px',
                    maxWidth: '100%',
                    marginBottom: '16px',
                  }}
                >
                  {currentTestimonial.quote1}
                </p>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    color: '#000',
                    width: '378px',
                    maxWidth: '100%',
                  }}
                >
                  {currentTestimonial.quote2}
                </p>
              </div>

              {/* Stats in a row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '32px',
                }}
              >
                {stats.map((stat, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontSize: '24px',
                        fontWeight: 600,
                        lineHeight: '32px',
                        color: '#000',
                        marginBottom: '4px',
                      }}
                    >
                      {stat.value}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                        fontSize: '11px',
                        fontWeight: 400,
                        lineHeight: '16px',
                        color: '#000',
                      }}
                    >
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Image and Author - side by side */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                {/* Navigation Arrows - Left (only show if multiple testimonials) */}
                {hasMultipleTestimonials && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setCurrentTestimonialIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentTestimonialIndex === 0}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '1px solid #000',
                        backgroundColor: 'transparent',
                        cursor: currentTestimonialIndex === 0 ? 'not-allowed' : 'pointer',
                        opacity: currentTestimonialIndex === 0 ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img src={arrowLeft} alt="Previous" style={{ width: '14px', height: '14px' }} />
                    </button>
                    <button
                      onClick={() => setCurrentTestimonialIndex((prev) => Math.min(testimonials.length - 1, prev + 1))}
                      disabled={currentTestimonialIndex === testimonials.length - 1}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '1px solid #000',
                        backgroundColor: 'transparent',
                        cursor: currentTestimonialIndex === testimonials.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: currentTestimonialIndex === testimonials.length - 1 ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img src={arrowRight} alt="Next" style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                )}

                {/* Author Image and Info - Right */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}>
                  {currentTestimonial.authorImage ? (
                    <img
                      src={getImageUrl(currentTestimonial.authorImage)}
                      alt={currentTestimonial.authorName}
                      style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginBottom: '12px',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        backgroundColor: '#e0e0e0',
                        marginBottom: '12px',
                      }}
                    />
                  )}
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '18px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      color: '#000',
                      marginBottom: '4px',
                      textAlign: 'right',
                    }}
                  >
                    {currentTestimonial.authorName}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '14px',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      lineHeight: '17px',
                      color: '#000',
                      textAlign: 'right',
                    }}
                  >
                    {currentTestimonial.authorRole}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Desktop/Tablet Layout */
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '60px',
                maxWidth: '900px',
                margin: '0 auto',
              }}
            >
              {/* Left - Quote and Stats */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                {/* Quote Mark */}
                <div style={{ marginBottom: '16px' }}>
                  <img
                    src={quoteIcon}
                    alt="quote"
                    style={{
                      width: '48px',
                      height: 'auto',
                    }}
                  />
                </div>

                {/* Quote Text - Two paragraphs */}
                <div style={{ marginBottom: '32px', maxWidth: '521px' }}>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '20px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      letterSpacing: '-0.184px',
                      color: '#000',
                      marginBottom: '16px',
                    }}
                  >
                    {currentTestimonial.quote1}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '20px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      letterSpacing: '-0.184px',
                      color: '#000',
                    }}
                  >
                    {currentTestimonial.quote2}
                  </p>
                </div>

                {/* Stats with vertical separators */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '24px',
                  }}
                >
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      style={{
                        paddingLeft: index > 0 ? '24px' : 0,
                        paddingRight: '24px',
                        borderLeft: index > 0 ? '1px solid #000' : 'none',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', 'Inter', sans-serif",
                          fontSize: '24px',
                          fontWeight: 400,
                          lineHeight: '43.951px',
                          color: '#000',
                          marginBottom: '4px',
                        }}
                      >
                        {stat.value}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                          fontSize: '14px',
                          fontWeight: 400,
                          lineHeight: '24.417px',
                          color: '#000',
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Author Image and Info */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: '150px',
              }}>
                {currentTestimonial.authorImage ? (
                  <img
                    src={getImageUrl(currentTestimonial.authorImage)}
                    alt={currentTestimonial.authorName}
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginBottom: '16px',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      backgroundColor: '#e0e0e0',
                      marginBottom: '16px',
                    }}
                  />
                )}
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '20px',
                    fontWeight: 400,
                    lineHeight: 'normal',
                    letterSpacing: '-0.184px',
                    color: '#000',
                    textAlign: 'center',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTestimonial.authorName}
                </p>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '14px',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: '17px',
                    color: '#000',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {currentTestimonial.authorRole}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Arrows - Desktop only (show only if multiple testimonials) */}
          {!isMobile && hasMultipleTestimonials && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px',
                marginTop: '40px',
              }}
            >
              <button
                onClick={() => setCurrentTestimonialIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentTestimonialIndex === 0}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '1px solid #000',
                  backgroundColor: 'transparent',
                  cursor: currentTestimonialIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentTestimonialIndex === 0 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <img src={arrowLeft} alt="Previous" style={{ width: '16px', height: '16px' }} />
              </button>
              <button
                onClick={() => setCurrentTestimonialIndex((prev) => Math.min(testimonials.length - 1, prev + 1))}
                disabled={currentTestimonialIndex === testimonials.length - 1}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  border: '1px solid #000',
                  backgroundColor: 'transparent',
                  cursor: currentTestimonialIndex === testimonials.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentTestimonialIndex === testimonials.length - 1 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <img src={arrowRight} alt="Next" style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}
        </div>
      </EditableSection>

      {/* Ready to start a project CTA */}
      <EditableSection
        sectionId="cta"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'cta'}
        label="CTA Section"
        style={{
          paddingTop: '0px',
          paddingBottom: isMobile ? '0px' : isTablet ? '70px' : '80px',
          paddingLeft: isMobile ? '0' : isTablet ? '40px' : '100px',
          paddingRight: isMobile ? '0' : isTablet ? '40px' : '100px',
          marginTop: isMobile ? '0' : isTablet ? '-10px' : '0px',
          marginBottom: isMobile ? '0' : isTablet ? '130px' : '120px',
          overflow: isMobile ? 'hidden' : 'visible',
        }}
      >
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
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
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '32px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: 'normal',
                    letterSpacing: '-1px',
                    color: '#000',
                    textAlign: 'center',
                    marginBottom: '16px',
                  }}
                >
                  {pageContent.ctaTitle}
                </h3>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: '24px',
                    color: '#000',
                    maxWidth: '300px',
                    margin: '0 auto',
                  }}
                >
                  {pageContent.ctaDescription.split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index < pageContent.ctaDescription.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>

              {/* Black Section - Bottom */}
              <div
                style={{
                  backgroundColor: '#000',
                  width: '474px',
                  minWidth: '474px',
                  padding: '48px 32px 40px',
                  marginTop: '-40px',
                  marginBottom: '64px',
                  position: 'relative',
                  left: '50%',
                  transform: 'translateX(-50%)',
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
                    width: '323px',
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
                      textAlign: 'center',
                      fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '20px',
                      fontWeight: 600,
                    }}
                  >
                    {pageContent.ctaButtonText}
                  </span>
                </Link>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <img
                    src={vectorIcon}
                    alt=""
                    style={{
                      width: '18px',
                      height: '20px',
                    }}
                  />
                  {pageContent.ctaSubText || 'Get instant response'}
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
              }}
            >
              {/* Left - Green Section */}
              <div
                style={{
                  backgroundColor: '#E1FFA0',
                  padding: '48px 64px',
                  paddingRight: '200px',
                  borderRadius: '300px',
                  height: '253px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '42px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: 'normal',
                    letterSpacing: '-1px',
                    color: '#000',
                    marginBottom: '8px',
                  }}
                >
                  {pageContent.ctaTitle}
                </h3>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '20px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: '28px',
                    color: '#000',
                    width: '539px',
                    maxWidth: '100%',
                  }}
                >
                  {pageContent.ctaDescription.split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index < pageContent.ctaDescription.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>

              {/* Right - Black Section */}
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  backgroundColor: '#000',
                  padding: '48px 64px',
                  width: '556px',
                  height: '253px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  borderRadius: '300px',
                }}
              >
                <Link
                  to="/contact"
                  style={{
                    display: 'flex',
                    width: '346px',
                    height: '64px',
                    padding: '12px 24px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#fff',
                    borderRadius: '100px',
                    textDecoration: 'none',
                  }}
                >
                  <span
                    style={{
                      color: '#000',
                      textAlign: 'center',
                      fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: '24px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '24px',
                    }}
                  >
                    {pageContent.ctaButtonText}
                  </span>
                </Link>
                <p
                  style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', 'Inter', sans-serif",
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: 'normal',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <img
                    src={vectorIcon}
                    alt=""
                    style={{
                      width: '18px',
                      height: '20px',
                    }}
                  />
                  {pageContent.ctaSubText || 'Get instant response'}
                </p>
              </div>
            </div>
          )}
        </div>
      </EditableSection>
    </div>
  );
};

export default About;
