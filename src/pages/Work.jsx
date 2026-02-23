import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { worksAPI, pagesAPI } from '../services/api';
import useWindowSize from '../hooks/useWindowSize';
import vectorIcon from '../assets/Vector.png';
import EditableSection from '../components/EditableSection';

const Work = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const { isMobile, isTablet } = useWindowSize();
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const [selectedSection, setSelectedSection] = useState(null);

  // Page content from CMS
  const [pageContent, setPageContent] = useState({
    heroTitle: 'Create with Perfection',
    heroTitleItalic: 'with',
    heroDescription: 'Designing for every customer touchpoint, from awareness to advocacy',
    categories: [],
    ctaHeading: 'Your search for agency ends here...',
    ctaDescription1: 'We combine strategy, design, and performance to create',
    ctaDescription2: 'experiences that convert.',
    ctaDescription3: "Let's build something that moves the needle.",
    ctaButtonText: 'Schedule Call',
    ctaInstantText: 'Get instant response',
  });

  // Build categories array with "All" at the start
  // Handle both array and comma-separated string formats
  const parsedCategories = Array.isArray(pageContent.categories)
    ? pageContent.categories
    : (pageContent.categories || '').split(',').map(c => c.trim()).filter(c => c);
  // Only show categories if there are any
  const categories = parsedCategories.length > 0 ? ['All', ...parsedCategories] : ['All'];

  useEffect(() => {
    fetchWorks();
    fetchPageContent();
  }, []);

  // Editor mode: Listen for updates from parent
  useEffect(() => {
    if (!isEditorMode) return;

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'EDITOR_UPDATE') {
        if (event.data.payload?.data) {
          setPageContent(prev => ({
            ...prev,
            ...event.data.payload.data
          }));
        }
      }

      if (event.data.type === 'SECTION_SELECTED') {
        setSelectedSection(event.data.sectionId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  const fetchPageContent = async () => {
    try {
      const response = await pagesAPI.getOne('work');
      if (response.data.data && response.data.data.content) {
        setPageContent((prev) => ({
          ...prev,
          ...response.data.data.content,
        }));
      }
    } catch (error) {
      // Use default content if page not configured
      console.log('Using default content for work page');
    }
  };

  const fetchWorks = async () => {
    try {
      const response = await worksAPI.getAll({ published: true });
      setWorks(response.data.data);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorks =
    activeFilter === 'All'
      ? works
      : works.filter(
          (work) =>
            work.category?.toLowerCase() === activeFilter.toLowerCase() ||
            work.tags?.some(
              (tag) => tag.toLowerCase() === activeFilter.toLowerCase()
            )
        );

  // Responsive padding
  const sectionPadding = isMobile ? '24px 16px' : isTablet ? '32px 40px' : '40px 100px 24px 100px';
  const gridSectionPadding = isMobile ? '24px 16px 60px 16px' : isTablet ? '32px 40px 60px 40px' : '32px 100px 80px 100px';

  // Responsive font sizes
  const titleFontSize = isMobile ? '32px' : isTablet ? '40px' : '50px';
  const descFontSize = isMobile ? '16px' : isTablet ? '18px' : '20px';
  const descLineHeight = isMobile ? '26px' : isTablet ? '28px' : '32px';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff' }}>
      {/* Hero Section */}
      <EditableSection
        sectionId="hero"
        label="Hero Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'hero'}
      >
      <section style={{ width: '100%', padding: sectionPadding }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          {/* Title - Create with Perfection */}
          <h1
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: titleFontSize,
              fontWeight: 400,
              color: '#0A0A0A',
              letterSpacing: '-1px',
              lineHeight: 'normal',
              marginBottom: isMobile ? '12px' : '16px',
            }}
          >
            {pageContent.heroTitle.split(pageContent.heroTitleItalic).map((part, index, arr) => (
              <span key={index}>
                {part}
                {index < arr.length - 1 && (
                  <span style={{ fontStyle: 'italic' }}>{pageContent.heroTitleItalic}</span>
                )}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: descFontSize,
              fontWeight: 400,
              color: '#000',
              lineHeight: descLineHeight,
              maxWidth: isMobile ? '100%' : '484px',
              marginBottom: isMobile ? '24px' : '32px',
            }}
          >
            {pageContent.heroDescription}
          </p>

          {/* Filter Tags */}
          <div
            style={{
              display: 'flex',
              gap: isMobile ? '10px' : '16px',
              overflowX: 'auto',
              paddingBottom: '8px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {categories.map((category) => {
              const isActive = activeFilter === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveFilter(category)}
                  style={{
                    display: 'flex',
                    padding: isMobile ? '10px 14px' : '12px 19px',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    borderRadius: '47px',
                    border: '1px solid #000',
                    backgroundColor: isActive ? '#2558BF' : '#FFF',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span
                    style={{
                      fontFamily: isActive ? '"Times New Roman", serif' : "'Plus Jakarta Sans', 'Inter', sans-serif",
                      fontSize: isMobile ? (isActive ? '16px' : '14px') : (isActive ? '20px' : '18px'),
                      fontStyle: isActive ? 'italic' : 'normal',
                      fontWeight: 400,
                      color: isActive ? '#FFF' : 'rgba(0, 0, 0, 0.80)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      </EditableSection>

      {/* Projects Grid */}
      <section style={{ width: '100%', padding: gridSectionPadding }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '60px 0' : '80px 0' }}>
              <div style={{ width: '48px', height: '48px', border: '2px solid #2558BF', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
          ) : filteredWorks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: isMobile ? '60px 0' : '80px 0' }}>
              <p style={{ color: '#6b7280', fontSize: isMobile ? '16px' : '18px' }}>No projects found.</p>
              <p style={{ color: '#9ca3af', fontSize: isMobile ? '12px' : '14px', marginTop: '8px' }}>
                Add projects from the admin panel.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
                rowGap: isMobile ? '32px' : '32px',
                columnGap: isMobile ? '0' : isTablet ? '16px' : '16px',
              }}
            >
              {filteredWorks.map((work) => {
                const hasMoreThan2Tags = work.tags && work.tags.length > 2;
                // On mobile, all cards are full width, so don't apply special styling
                const shouldBeFullWidth = !isMobile && hasMoreThan2Tags;
                return (
                  <div
                    key={work._id}
                    style={{
                      gridColumn: shouldBeFullWidth ? '1 / -1' : 'auto',
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    <ProjectCard
                      work={work}
                      isFullWidth={shouldBeFullWidth}
                      isMobile={isMobile}
                      isTablet={isTablet}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Coral/Orange rounded container */}
      <EditableSection
        sectionId="cta"
        label="CTA Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'cta'}
      >
      <section style={{ backgroundColor: '#fff', padding: isMobile ? '0' : '60px 100px', marginBottom: isMobile ? '-150px' : '150px' }}>
        <div
          style={{
            maxWidth: isMobile ? '100%' : '1240px',
            minHeight: isMobile ? '438px' : '500px',
            margin: '0 auto',
            borderTopLeftRadius: isMobile ? '160px' : '300px',
            borderTopRightRadius: isMobile ? '160px' : '300px',
            borderBottomLeftRadius: isMobile ? '0' : '300px',
            borderBottomRightRadius: isMobile ? '0' : '300px',
            backgroundColor: '#E2775A',
            position: 'relative',
            overflow: isMobile ? 'visible' : 'hidden',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'center',
            padding: isMobile ? '60px 24px 80px 24px' : isTablet ? '48px 60px' : '60px 118px',
            paddingBottom: isMobile ? '214px' : undefined,
          }}
        >
          {/* Left Content */}
          <div style={{ maxWidth: isMobile ? '100%' : '600px', zIndex: 1, textAlign: isMobile ? 'center' : 'left', marginTop: isMobile ? '0' : '-50px' }}>
            {/* Heading */}
            <h2
              style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '28px' : isTablet ? '36px' : '42px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: 'normal',
                letterSpacing: '-1px',
                marginTop: isMobile ? '0' : '-10px',
                marginBottom: isMobile ? '16px' : '10px',
                whiteSpace: isMobile ? 'normal' : 'nowrap',
                width: isMobile ? '323px' : 'auto',
                marginLeft: isMobile ? 'auto' : undefined,
                marginRight: isMobile ? 'auto' : undefined,
                textAlign: isMobile ? 'center' : 'left',
              }}
            >
              {pageContent.ctaHeading}
            </h2>

            {/* Description */}
            <p
              style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '28px',
                marginBottom: '8px',
              }}
            >
              {pageContent.ctaDescription1}
            </p>
            <p
              style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '28px',
                marginBottom: isMobile ? '16px' : '24px',
              }}
            >
              {pageContent.ctaDescription2}
            </p>
            <p
              style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontStyle: 'normal',
                fontWeight: 400,
                lineHeight: '28px',
                marginBottom: isMobile ? '24px' : '32px',
              }}
            >
              {pageContent.ctaDescription3}
            </p>

            {/* Schedule Call Button */}
            <Link
              to="/contact"
              style={{
                display: 'flex',
                width: isMobile ? '100%' : '346px',
                height: '64px',
                padding: '12px 24px',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '200px',
                backgroundColor: '#FFF',
                textDecoration: 'none',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  color: '#000',
                  textAlign: 'center',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: isMobile ? '16px' : '20px',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  lineHeight: '24px',
                }}
              >
                {pageContent.ctaButtonText}
              </span>
            </Link>

            {/* Get instant response text */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '8px',
              }}
            >
              <img src={vectorIcon} alt="" style={{ width: '16px', height: '16px' }} />
              <span
                style={{
                  color: '#FFF',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: isMobile ? '14px' : '16px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: 'normal',
                }}
              >
                {pageContent.ctaInstantText}
              </span>
            </div>
          </div>

          {/* Decorative Squares - Mobile (4 boxes, 2 center visible, 2 outer cut off) */}
          {isMobile && (
            <div
              style={{
                position: 'relative',
                width: '100vw',
                left: '57%',
                transform: 'translateX(-50%)',
                marginTop: '40px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '11px',
                  justifyContent: 'center',
                }}
              >
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '125px',
                      height: '85px',
                      borderRadius: '3px',
                      backgroundColor: '#F0F0F0',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Decorative Squares - Desktop/Tablet (right side, vertical columns) */}
          {!isMobile && (
            <div
              style={{
                position: 'absolute',
                right: isTablet ? '30px' : '60px',
                top: '-30px',
                transform: 'rotate(12deg)',
                display: 'flex',
                gap: '12px',
              }}
            >
              {/* Column 1 (left) - pushed down so only 3 visible */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '265px' }}>
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
              </div>
              {/* Column 2 (right) - at top */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '5px', marginLeft: '2px' }}>
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
                <div style={{ width: isTablet ? '150px' : '206px', height: '125px', borderRadius: '7px', backgroundColor: '#F0F0F0' }} />
              </div>
            </div>
          )}
        </div>
      </section>
      </EditableSection>
    </div>
  );
};

// Project Card Component
const ProjectCard = ({ work, isFullWidth = false, isMobile = false, isTablet = false }) => {
  // Responsive image heights
  const getImageHeight = () => {
    if (isMobile) return '240px';
    if (isTablet) return isFullWidth ? '380px' : '300px';
    return isFullWidth ? '450px' : '359px';
  };

  // Responsive title font size
  const titleFontSize = isMobile ? '24px' : isTablet ? '28px' : '32px';

  // Desktop tag styling
  const tagFontSize = '16px';
  const tagHeight = '35px';
  const tagPadding = '8px 14px';

  return (
    <div style={{ margin: 0, padding: 0, paddingBottom: isMobile ? '0' : '0' }}>
      {/* Image Container */}
      <div
        style={{
          position: 'relative',
          height: getImageHeight(),
          borderRadius: '0',
          overflow: 'hidden',
          marginBottom: isMobile ? '16px' : '12px',
        }}
      >
        <img
          src={work.image || '/placeholder.jpg'}
          alt={work.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Tags on Image - Top Right for MOBILE (all tags) */}
        {isMobile && work.tags && work.tags.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignContent: 'flex-start',
              maxWidth: '80%',
            }}
          >
            {work.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  display: 'flex',
                  padding: '7px 14px',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFF',
                  borderRadius: '200px',
                  border: '1px solid #000',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: '12px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: 'normal',
                  color: '#000',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Tags on Image - Top Right for DESKTOP (only for normal cards with 2 or fewer tags) */}
        {!isFullWidth && !isMobile && work.tags && work.tags.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
            }}
          >
            {work.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                style={{
                  display: 'flex',
                  height: tagHeight,
                  padding: tagPadding,
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFF',
                  borderRadius: '100px',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: tagFontSize,
                  fontWeight: 400,
                  color: '#000',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Title row with tags for full-width cards (DESKTOP only) */}
      <div
        style={{
          display: (isFullWidth && !isMobile) ? 'flex' : 'block',
          justifyContent: (isFullWidth && !isMobile) ? 'space-between' : 'initial',
          alignItems: (isFullWidth && !isMobile) ? 'flex-start' : 'initial',
          marginBottom: isMobile ? '12px' : '8px',
        }}
      >
        {/* Project Title */}
        <h3
          style={{
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            fontSize: titleFontSize,
            fontWeight: 400,
            color: '#0F0F0F',
            lineHeight: 'normal',
            marginBottom: '0',
          }}
        >
          {work.title}
        </h3>

        {/* Tags on same row as title (only for full-width cards on desktop) */}
        {isFullWidth && !isMobile && work.tags && work.tags.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {work.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  display: 'flex',
                  height: tagHeight,
                  padding: tagPadding,
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FFF',
                  border: '1px solid #000',
                  borderRadius: '100px',
                  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  fontSize: tagFontSize,
                  fontWeight: 400,
                  color: '#000',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Project Description */}
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 400,
          color: '#0F0F0F',
          lineHeight: isMobile ? '20px' : '22px',
          marginBottom: isMobile ? '20px' : '16px',
          maxWidth: isFullWidth && !isMobile ? '600px' : '100%',
        }}
      >
        {work.description}
      </p>

      {/* READ MORE Link */}
      <Link
        to={`/work/${work._id}`}
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          fontSize: isMobile ? '14px' : '16px',
          fontWeight: 400,
          fontStyle: 'normal',
          color: '#0F0F0F',
          lineHeight: '22px',
          letterSpacing: '2px',
          textDecoration: 'underline',
          textDecorationStyle: 'solid',
          textDecorationThickness: 'auto',
          textUnderlineOffset: 'auto',
        }}
      >
        READ MORE
      </Link>
    </div>
  );
};

export default Work;
