import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { caseStudiesAPI, pagesAPI } from '../services/api';
import useWindowSize from '../hooks/useWindowSize';
import EditableSection from '../components/EditableSection';
import vectorIcon from '../assets/Vector.png';
import sliderIcon from '../assets/Frame 1618874557.png';

// SVG noise texture (replaces 1MB Image.png for better performance)
const noiseTexture = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E";
import sliderIconMobile from '../assets/Frame 1618874557w.png';
import quoteIcon from '../assets/Screenshot 2026-02-17 185830.png';
import arrowLeft from '../assets/arrow-left.png';
import arrowRight from '../assets/arrow-right.png';

// Image Comparison Slider Component
const ImageComparisonSlider = ({ leftImage, rightImage, isMobile, isTablet, sliderIcon, sliderIconMobile }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
      const handleResize = () => {
        if (containerRef.current) {
          setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
          });
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleMove = useCallback((clientX, clientY) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isMobile) {
      // Mobile: Vertical movement (Y axis)
      const y = clientY - rect.top;
      const percentage = Math.max(5, Math.min(95, (y / rect.height) * 100));
      setSliderPosition(percentage);
    } else {
      // Desktop: Horizontal movement (X axis)
      const x = clientX - rect.left;
      const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  }, [isMobile]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX, e.clientY);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e) => {
    setIsDragging(true);
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [isDragging, handleMove]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const sectionHeight = isMobile ? '700px' : isTablet ? '500px' : '700px';

  // Mobile: Top/Bottom images with vertical slider
  if (isMobile) {
    return (
      <section
        ref={containerRef}
        style={{
          width: '430px',
          maxWidth: '100%',
          height: sectionHeight,
          position: 'relative',
          overflow: 'hidden',
          margin: '0 auto',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* Bottom Image (Background - Full height) */}
        <img
          src={rightImage}
          alt="App Screenshot Bottom"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
          draggable={false}
        />

        {/* Top Image (Clipped based on slider position - vertical) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${sliderPosition}%`,
            overflow: 'hidden',
          }}
        >
          <img
            src={leftImage}
            alt="App Screenshot Top"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: containerSize.height ? `${containerSize.height}px` : '700px',
              objectFit: 'cover',
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>

        {/* Horizontal Slider Handle - Draggable Area (for vertical movement) */}
        <div
          style={{
            position: 'absolute',
            top: `${sliderPosition}%`,
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            height: '60px',
            cursor: isDragging ? 'grabbing' : 'ns-resize',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Horizontal Line */}
          <div
            style={{
              position: 'absolute',
              left: '10px',
              right: '10px',
              height: '6px',
              backgroundColor: '#000',
              borderRadius: '24px',
            }}
          />

          {/* Slider Icon/Handle */}
          <img
            src={sliderIconMobile}
            alt="Slider Handle"
            style={{
              width: '50px',
              height: '50px',
              position: 'relative',
              zIndex: 11,
              pointerEvents: 'none',
            }}
            draggable={false}
          />
        </div>
      </section>
    );
  }

  // Desktop/Tablet: Left/Right images with horizontal slider
  return (
    <section
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: '100%',
        height: sectionHeight,
        position: 'relative',
        overflow: 'hidden',
        margin: '0',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Right Image (Background - Full width) */}
      <img
        src={rightImage}
        alt="App Screenshot Right"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
        draggable={false}
      />

      {/* Left Image (Clipped based on slider position) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${sliderPosition}%`,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <img
          src={leftImage}
          alt="App Screenshot Left"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: containerSize.width ? `${containerSize.width}px` : '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      </div>

      {/* Vertical Slider Handle - Draggable Area */}
      <div
        style={{
          position: 'absolute',
          left: `${sliderPosition}%`,
          top: 0,
          bottom: 0,
          transform: 'translateX(-50%)',
          width: '60px',
          cursor: isDragging ? 'grabbing' : 'ew-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Vertical Line */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            bottom: '10px',
            width: '13px',
            backgroundColor: '#000',
            borderRadius: '24px',
          }}
        />

        {/* Slider Icon/Handle */}
        <img
          src={sliderIcon}
          alt="Slider Handle"
          style={{
            width: '50px',
            height: '50px',
            position: 'relative',
            zIndex: 11,
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      </div>
    </section>
  );
};

const CaseStudyDetail = () => {
  const { slug } = useParams();
  const { isMobile, isTablet } = useWindowSize();

  // Editor mode - check URL params and slug
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true' || slug === 'preview';
  const [selectedSection, setSelectedSection] = useState(null);
  const isNewCaseStudy = slug === 'preview';

  // Default case study data for editor preview (demo case study)
  const getDefaultCaseStudy = () => ({
    title: 'Flavor & Co. Brand Identity',
    slug: slug || 'preview',
    client: 'Flavor & Co.',
    clientLogo: 'https://placehold.co/200x80/2558BF/FFFFFF?text=Flavor+%26+Co.',
    clientLogoMobile: 'https://placehold.co/150x60/2558BF/FFFFFF?text=Flavor+%26+Co.',
    industry: 'Food & Beverage',
    platform: 'Web & Mobile',
    duration: '4 months',
    projectFocus: ['Brand Strategy', 'UX Design', 'Development'],
    services: ['Branding', 'Web Design', 'Mobile App', 'E-commerce'],
    heroImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop',
    heroImageMobile: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=1200&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1440&h=600&fit=crop',
    bannerImageMobile: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
    collaborationTitle: 'The Collaboration',
    collaborationText: 'Flavor & Co. approached us with a vision to revolutionize how people discover and order artisanal food products online. Their existing brand felt outdated and failed to capture the premium quality of their offerings. We partnered closely with their team to reimagine every touchpoint—from brand identity to digital experience—creating a cohesive ecosystem that celebrates culinary craftsmanship while delivering seamless e-commerce functionality.',
    challenge: 'Flavor & Co. faced multiple challenges: an outdated visual identity that didn\'t reflect their premium positioning, a fragmented digital presence across web and mobile, poor conversion rates on their existing e-commerce platform, and difficulty standing out in a crowded market. They needed a complete brand transformation that would resonate with food enthusiasts while driving measurable business results.',
    solution: 'We developed a comprehensive brand strategy centered on "culinary discovery." This included a fresh visual identity with warm, appetizing colors and custom typography, a responsive website with immersive product storytelling, a mobile app for seamless ordering and loyalty rewards, and an optimized checkout flow that reduced cart abandonment by 45%. Every element was designed to evoke the sensory experience of premium food.',
    results: 'The rebrand exceeded all expectations. Within 6 months of launch, Flavor & Co. saw a 78% increase in online revenue, 156% growth in mobile app downloads, and a Net Promoter Score that jumped from 32 to 67. The new brand identity won a Gold Award at the Brand Impact Awards 2024.',
    processSteps: [
      { number: '01', title: 'Discovery & Research' },
      { number: '02', title: 'Brand Strategy' },
      { number: '03', title: 'Visual Identity Design' },
      { number: '04', title: 'UX/UI Design' },
      { number: '05', title: 'Development & QA' },
      { number: '06', title: 'Launch & Optimization' },
    ],
    opportunities: [
      { number: '01', title: 'Brand Differentiation', description: 'Create a distinctive visual language that sets Flavor & Co. apart from competitors and communicates premium quality at every touchpoint.' },
      { number: '02', title: 'Digital Experience', description: 'Build an immersive, user-friendly platform that makes discovering and purchasing artisanal products a delightful journey.' },
      { number: '03', title: 'Mobile-First Commerce', description: 'Develop a native mobile app that drives repeat purchases through personalized recommendations and loyalty rewards.' },
      { number: '04', title: 'Conversion Optimization', description: 'Streamline the checkout process and implement data-driven improvements to maximize revenue per visitor.' },
    ],
    experienceTitle: 'The Experience We Created',
    experienceImages: [
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&h=800&fit=crop',
    ],
    experienceImagesMobile: [
      'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=800&fit=crop',
    ],
    experienceQuote: 'The team didn\'t just redesign our brand—they transformed how we connect with our customers. Every detail reflects our passion for quality, and the results speak for themselves.',
    colorPalette: [
      { color: '#D4543C', name: 'Tomato Red' },
      { color: '#F4A259', name: 'Warm Orange' },
      { color: '#2D5A27', name: 'Fresh Green' },
      { color: '#FDF6E3', name: 'Cream' },
      { color: '#1A1A1A', name: 'Rich Black' },
    ],
    typography: {
      fontFamily: 'Playfair Display + Inter',
      fontImage: 'https://placehold.co/800x400/1A1A1A/FFFFFF?text=Aa+Bb+Cc+123',
      fontImageMobile: 'https://placehold.co/400x300/1A1A1A/FFFFFF?text=Aa+Bb+Cc',
      characterSet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',
    },
    metrics: [
      { value: '+78%', label: 'Online Revenue' },
      { value: '+156%', label: 'App Downloads' },
      { value: '-45%', label: 'Cart Abandonment' },
      { value: '+109%', label: 'NPS Score' },
    ],
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=800&fit=crop',
    ],
    imagesMobile: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=800&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=800&fit=crop',
    ],
    testimonial: {
      quote: 'Working with the team was an absolute pleasure. They understood our vision from day one and brought it to life in ways we never imagined. The new brand has completely transformed our business.',
      author: 'Sarah Mitchell',
      position: 'CEO, Flavor & Co.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      imageMobile: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    },
    technologies: ['React', 'Next.js', 'Node.js', 'Shopify', 'React Native', 'Figma'],
    relatedWorks: [],
    published: false,
    order: 0,
  });

  const defaultCaseStudy = getDefaultCaseStudy();

  // Initialize with default data only for 'preview' slug (new case study)
  const [caseStudy, setCaseStudy] = useState(() => isNewCaseStudy ? getDefaultCaseStudy() : null);
  const [loading, setLoading] = useState(!isNewCaseStudy);
  const [activeTab, setActiveTab] = useState('challenges');
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // CTA and Testimonial Heading from About page
  const [aboutContent, setAboutContent] = useState({
    ctaTitle: 'Ready to start a project?',
    ctaDescription: 'We combine strategy, design, and performance to create experiences that convert.',
    ctaButtonText: 'Schedule Call',
    // Testimonial Heading fields
    clientLabelItalic: 'Look',
    clientLabelNormal: 'what our client said..',
  });

  // Testimonial content from Landing page (array of testimonials)
  const [testimonials, setTestimonials] = useState([
    {
      id: 1,
      quote1: 'Lorem ipsum dolor sit amet consectetur. Ullamcorper amet arcu quis elementum. Convallis purus mauris at in.',
      quote2: 'Pretium pharetra aliquam consequat duis ac risus vitae sollicitudin pharetra.',
      authorName: 'Reema Roy',
      authorRole: 'Head of Marketing, Company-name',
      authorImage: '',
      stat1Value: '+45%',
      stat1Label: 'AOV (Average Order Value)',
      stat2Value: '+24%',
      stat2Label: 'CTR (Click-through rate)',
      stat3Value: '+16%',
      stat3Label: 'Return-rate per customer',
    },
  ]);

  useEffect(() => {
    // For 'preview' slug in editor mode, don't fetch - we use default data
    // For real slugs (existing case studies), fetch from API first
    if (slug !== 'preview') {
      fetchCaseStudy();
    }
    fetchAboutContent();
    fetchTestimonialContent();
  }, [slug]);

  // Editor mode: Listen for updates from parent
  useEffect(() => {
    if (!isEditorMode) return;

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'EDITOR_UPDATE' || event.data.type === 'EDITOR_INIT') {
        const { section, data } = event.data.payload;
        setSelectedSection(section);
        // Always update case study data from editor in editor mode
        if (data) {
          setCaseStudy(prevData => {
            // Start with defaults and previous data
            const merged = { ...defaultCaseStudy, ...prevData };

            // Only apply non-empty values from incoming data
            // This keeps demo content until user actually fills in their own content
            Object.keys(data).forEach(key => {
              const value = data[key];
              // Check if value is meaningful (not empty)
              if (value === null || value === undefined) return;
              if (typeof value === 'string' && value.trim() === '') return;
              if (Array.isArray(value) && value.length === 0) return;
              if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return;

              // For nested objects like typography, merge non-empty fields
              if (key === 'typography' && typeof value === 'object') {
                merged.typography = { ...merged.typography };
                Object.keys(value).forEach(tKey => {
                  if (value[tKey] && value[tKey].trim && value[tKey].trim() !== '') {
                    merged.typography[tKey] = value[tKey];
                  } else if (value[tKey] && !value[tKey].trim) {
                    merged.typography[tKey] = value[tKey];
                  }
                });
                return;
              }

              // For testimonial object
              if (key === 'testimonial' && typeof value === 'object') {
                merged.testimonial = { ...merged.testimonial };
                Object.keys(value).forEach(tKey => {
                  if (value[tKey] && value[tKey].trim && value[tKey].trim() !== '') {
                    merged.testimonial[tKey] = value[tKey];
                  } else if (value[tKey] && !value[tKey].trim) {
                    merged.testimonial[tKey] = value[tKey];
                  }
                });
                return;
              }

              // Apply the value
              merged[key] = value;
            });

            return merged;
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent that preview is ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  const fetchCaseStudy = async () => {
    try {
      const response = await caseStudiesAPI.getOne(slug);
      setCaseStudy(response.data.data);

      // Fetch related projects
      const allResponse = await caseStudiesAPI.getAll({ published: true });
      const related = allResponse.data.data.filter(
        p => p._id !== response.data.data._id
      ).slice(0, 2);
      setRelatedProjects(related);
    } catch (error) {
      console.error('Error fetching case study:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAboutContent = async () => {
    try {
      const response = await pagesAPI.getOne('about');
      if (response.data.data && response.data.data.content) {
        const content = response.data.data.content;
        setAboutContent((prev) => ({
          ...prev,
          ctaTitle: content.ctaTitle || prev.ctaTitle,
          ctaDescription: content.ctaDescription || prev.ctaDescription,
          ctaButtonText: content.ctaButtonText || prev.ctaButtonText,
          // Testimonial Heading fields
          clientLabelItalic: content.clientLabelItalic || prev.clientLabelItalic,
          clientLabelNormal: content.clientLabelNormal || prev.clientLabelNormal,
        }));
      }
    } catch (error) {
      console.log('Using default content for CTA');
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

  // Get current testimonial from array
  const currentTestimonial = testimonials[currentTestimonialIndex] || testimonials[0] || {};
  const hasMultipleTestimonials = testimonials.length > 1;

  // Build stats array from current testimonial
  const testimonialStats = [
    { value: currentTestimonial.stat1Value, label: currentTestimonial.stat1Label },
    { value: currentTestimonial.stat2Value, label: currentTestimonial.stat2Label },
    { value: currentTestimonial.stat3Value, label: currentTestimonial.stat3Label },
  ];

  // Don't show loading spinner for new case study preview (we have default data)
  if (loading && !isNewCaseStudy) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #2558BF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Show not found only if not a new case study preview (which has default data)
  if (!caseStudy && !isNewCaseStudy) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#111', marginBottom: '16px' }}>
          Case Study Not Found
        </h1>
        <Link to="/case-studies" style={{ color: '#2558BF', textDecoration: 'underline' }}>
          Back to Case Studies
        </Link>
      </div>
    );
  }

  // Default values
  const defaultColorPalette = [
    { color: '#FFF56F' },
    { color: '#F7D2B4' },
    { color: '#00BFAF' },
    { color: '#1e1e27' },
    { color: '#fafafa' },
    { color: '#B8ECEC' },
    { color: '#fafafa' },
  ];

  const colorPalette = caseStudy.colorPalette?.length > 0 ? caseStudy.colorPalette : defaultColorPalette;

  return (
    <div style={{ backgroundColor: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>

      {/* ==================== HERO SECTION (Blue Part) ==================== */}
      <EditableSection
        sectionId="hero"
        label="Hero Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'images'}
        style={{
          backgroundColor: '#2558BF',
          position: 'relative',
          overflow: 'hidden',
          height: isMobile ? '184px' : isTablet ? '200px' : '220px',
          width: '100%',
        }}
      >
        {/* Noise texture overlay with blue tint */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${noiseTexture})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }} />

        {/* Content Container - positioned at bottom */}
        <div style={{
          position: 'absolute',
          bottom: isMobile ? '24px' : 0,
          left: isMobile ? '20px' : 0,
          right: isMobile ? 'auto' : 0,
          zIndex: 1,
          padding: isMobile ? '0' : isTablet ? '32px 40px' : '40px 80px',
        }}>
          {/* Client Logo */}
          {(caseStudy.clientLogo || caseStudy.clientLogoMobile) && (
            <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
              <img
                src={isMobile
                  ? (caseStudy.clientLogoMobile || caseStudy.clientLogo)
                  : (caseStudy.clientLogo || caseStudy.clientLogoMobile)
                }
                alt={caseStudy.client}
                style={{
                  height: isMobile ? '50px' : isTablet ? '50px' : '60px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          {/* Project Focus Tags */}
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <span style={{
              color: '#f2f2f2',
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 400,
              lineHeight: '24px',
            }}>
              Project Focus
            </span>
            {caseStudy.projectFocus?.map((focus, index) => (
              <span key={index} style={{
                color: '#f2f2f2',
                fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 400,
                lineHeight: '24px',
              }}>
                {focus}
              </span>
            ))}
          </div>
        </div>
      </EditableSection>

      {/* ==================== BANNER IMAGE SECTION ==================== */}
      <EditableSection
        sectionId="banner"
        label="Banner Image"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'images'}
        style={{
          width: '100%',
          height: isMobile ? '356px' : isTablet ? '400px' : '533px',
          overflow: 'hidden',
        }}
      >
        <img
          src={
            isMobile
              ? (caseStudy.bannerImageMobile || caseStudy.bannerImage || caseStudy.heroImageMobile || caseStudy.heroImage || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1440&h=600&fit=crop')
              : (caseStudy.bannerImage || caseStudy.bannerImageMobile || caseStudy.heroImage || caseStudy.heroImageMobile || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1440&h=600&fit=crop')
          }
          alt={caseStudy.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </EditableSection>

      {/* ==================== THE COLLABORATION SECTION ==================== */}
      <EditableSection
        sectionId="collaboration"
        label="Collaboration"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'collaboration'}
        style={{
          padding: isMobile ? '56px 20px 0' : isTablet ? '60px 40px' : '60px 50px',
          maxWidth: '1440px',
          margin: '0 auto',
        }}
      >
        {isMobile ? (
          /* Mobile Layout - Vertical stacking */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}>
            {/* Title and Description */}
            <div>
              <h2 style={{
                fontSize: '26px',
                fontWeight: 400,
                color: '#1E1E1E',
                marginBottom: '24px',
                lineHeight: 'normal',
                letterSpacing: '-0.26px',
              }}>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                }}>The</span>{' '}
                <span style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                  fontStyle: 'normal',
                  fontWeight: 400,
                }}>Collaboration</span>
              </h2>
              <p style={{
                fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                fontSize: '18px',
                fontStyle: 'normal',
                fontWeight: 400,
                color: '#000',
                lineHeight: '28px',
                whiteSpace: 'pre-wrap',
                width: '390px',
                maxWidth: '100%',
              }}>
                {caseStudy.collaborationText || caseStudy.challenge}
              </p>
            </div>

            {/* Industry & Services - Side by side on mobile */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              {/* Industry & Platform */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                width: '200px',
              }}>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans-Bold', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '18px',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  color: '#000',
                  lineHeight: '27px',
                }}>
                  Industry
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    color: '#000',
                    lineHeight: '24px',
                  }}>
                    {caseStudy.industry || 'Technology'}
                  </p>
                  {caseStudy.platform && (
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      color: '#000',
                      lineHeight: '24px',
                    }}>
                      {caseStudy.platform}
                    </p>
                  )}
                </div>
              </div>

              {/* Services */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '18px',
                width: '200px',
                marginLeft: 'auto',
                paddingLeft: '16px',
              }}>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans-Bold', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '18px',
                  fontStyle: 'normal',
                  fontWeight: 700,
                  color: '#000',
                  lineHeight: '27px',
                }}>
                  Services
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(caseStudy.services || ['User Research', 'UX Strategy', 'UI Design']).map((service, idx) => (
                    <p key={idx} style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '16px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      color: '#000',
                      lineHeight: '24px',
                    }}>
                      {service}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop/Tablet Layout - Original horizontal layout */
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: isTablet ? '60px' : '80px',
            justifyContent: 'space-between',
          }}>
            {/* Left Content */}
            <div style={{ flex: '0 1 796px' }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 500,
                color: '#1e1e1e',
                marginBottom: '24px',
                lineHeight: '44px',
              }}>
                <span style={{ fontStyle: 'italic' }}>The</span>{' '}
                <span>Collaboration</span>
              </h2>
              <p style={{
                fontSize: '20px',
                fontWeight: 500,
                color: '#000',
                lineHeight: '30px',
                whiteSpace: 'pre-wrap',
              }}>
                {caseStudy.collaborationText || caseStudy.challenge}
              </p>
            </div>

            {/* Right Sidebar */}
            <div style={{
              flex: '0 0 298px',
              display: 'flex',
              flexDirection: 'column',
              gap: '37px',
            }}>
              {/* Industry & Platform */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#000',
                  lineHeight: '27px',
                }}>
                  Industry
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <p style={{
                    fontSize: '20px',
                    fontWeight: 500,
                    color: '#000',
                    lineHeight: '30px',
                  }}>
                    {caseStudy.industry || 'Technology'}
                  </p>
                  {caseStudy.platform && (
                    <p style={{
                      fontSize: '20px',
                      fontWeight: 500,
                      color: '#000',
                      lineHeight: '27px',
                    }}>
                      {caseStudy.platform}
                    </p>
                  )}
                </div>
              </div>

              {/* Services */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#000',
                  lineHeight: '27px',
                }}>
                  Services
                </h3>
                <p style={{
                  fontSize: '20px',
                  fontWeight: 500,
                  color: '#000',
                  lineHeight: '30px',
                }}>
                  {caseStudy.services?.join(' | ') || 'User Research | UX Strategy | UI Design'}
                </p>
              </div>
            </div>
          </div>
        )}
      </EditableSection>

      {/* ==================== PROBLEM DEFINITION SECTION ==================== */}
      <EditableSection
        sectionId="problem"
        label="Challenge & Solution"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'challenge'}
        style={{ position: 'relative', overflow: 'hidden' }}
      >
      <div style={{
        padding: isMobile ? '50px 20px 60px' : isTablet ? '40px 40px 80px' : '50px 50px 100px',
        maxWidth: '1440px',
        margin: '0 auto',
        position: 'relative',
      }}>
        {/* Title */}
        <h2 style={{
          color: isMobile ? '#1E1E1E' : '#000',
          marginBottom: isMobile ? '48px' : '50px',
          textAlign: 'center',
          lineHeight: 'normal',
        }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '26px' : isTablet ? '46px' : '56px',
            fontStyle: isMobile ? 'normal' : 'italic',
            fontWeight: 400,
            letterSpacing: isMobile ? '-0.26px' : '-1.189px',
          }}>Problem</span>{' '}
          <span style={{
            fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '26px' : isTablet ? '42px' : '50px',
            fontStyle: 'normal',
            fontWeight: 400,
            letterSpacing: isMobile ? '-0.26px' : '-1px',
          }}>Definition</span>
        </h2>

        {/* Tabs - All in one row on mobile */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0' : '12px',
          marginBottom: isMobile ? '48px' : '32px',
          flexWrap: 'nowrap',
          justifyContent: isMobile ? 'flex-start' : 'flex-start',
          width: '100%',
        }}>
          {['challenges', 'solutions', 'results'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: isMobile ? '8px 12px' : '12px 48px',
                flex: isMobile ? '1' : 'none',
                color: '#000',
                fontFamily: activeTab === tab ? "'Plus Jakarta Sans-Bold', 'Plus Jakarta Sans', sans-serif" : "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '16px' : '18px',
                fontStyle: 'normal',
                fontWeight: activeTab === tab ? 700 : 400,
                lineHeight: '27px',
                textTransform: 'capitalize',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '1px solid #000' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content with Blue Line */}
        <div style={{ position: 'relative', maxWidth: isMobile ? '390px' : '700px', marginBottom: isMobile ? '0' : '40px' }}>
          <p style={{
            color: '#000',
            fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '16px' : '20px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: isMobile ? '26px' : '30px',
            whiteSpace: 'pre-wrap',
          }}>
            {activeTab === 'challenges' && caseStudy.challenge}
            {activeTab === 'solutions' && caseStudy.solution}
            {activeTab === 'results' && (caseStudy.results || 'Results coming soon...')}
          </p>
        </div>
      </section>

      {/* Blue Divider Line - Touches right edge */}
      {!isMobile && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: isMobile ? '200px' : isTablet ? '240px' : '280px',
          width: isTablet ? '300px' : '596px',
          height: '7px',
          backgroundColor: '#2558BF',
          opacity: 0.6,
          borderTopLeftRadius: '20px',
          borderBottomLeftRadius: '20px',
        }} />
      )}
      </div>
      </EditableSection>

      {/* ==================== APP SCREENSHOTS SECTION - Image Comparison Slider ==================== */}
      {(caseStudy.images?.length > 0 || caseStudy.imagesMobile?.length > 0) && (
        <>
          {/* If 2+ images, show comparison slider */}
          {(caseStudy.images?.length > 1 || caseStudy.imagesMobile?.length > 1) ? (
            <ImageComparisonSlider
              leftImage={isMobile
                ? (caseStudy.imagesMobile?.[0] || caseStudy.images?.[0])
                : (caseStudy.images?.[0] || caseStudy.imagesMobile?.[0])
              }
              rightImage={isMobile
                ? (caseStudy.imagesMobile?.[1] || caseStudy.images?.[1])
                : (caseStudy.images?.[1] || caseStudy.imagesMobile?.[1])
              }
              isMobile={isMobile}
              isTablet={isTablet}
              sliderIcon={sliderIcon}
              sliderIconMobile={sliderIconMobile}
            />
          ) : (
            /* If only 1 image, show it without slider */
            <section style={{
              width: isMobile ? '430px' : '100%',
              maxWidth: '100%',
              height: isMobile ? '700px' : isTablet ? '500px' : '700px',
              position: 'relative',
              overflow: 'hidden',
              margin: isMobile ? '0 auto' : '0',
            }}>
              <img
                src={isMobile
                  ? (caseStudy.imagesMobile?.[0] || caseStudy.images?.[0])
                  : (caseStudy.images?.[0] || caseStudy.imagesMobile?.[0])
                }
                alt="App Screenshot"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </section>
          )}
        </>
      )}

      {/* ==================== THE PROCESS SECTION ==================== */}
      {caseStudy.processSteps && caseStudy.processSteps.length > 0 && (
        <section style={{
          padding: isMobile ? '48px 20px 0' : isTablet ? '80px 40px 0' : '80px 50px 0',
          maxWidth: '1440px',
          margin: '0 auto',
        }}>
          {/* Mobile: Title centered above steps */}
          {isMobile && (
            <h2 style={{
              fontSize: '26px',
              color: '#1e1e1e',
              lineHeight: 'normal',
              letterSpacing: '-0.26px',
              fontWeight: 400,
              textAlign: 'center',
              marginBottom: '48px',
            }}>
              <span style={{
                fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
                fontStyle: 'italic',
                fontWeight: 400,
              }}>The Process </span>
              <span style={{
                fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                fontStyle: 'normal',
                fontWeight: 400,
              }}>We Followed</span>
            </h2>
          )}

          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '0' : isTablet ? '60px' : '80px',
            maxWidth: '1073px',
            margin: '0 auto',
          }}>
            {/* Desktop Title */}
            {!isMobile && (
              <div style={{ flex: '0 0 400px' }}>
                <h2 style={{
                  fontSize: isTablet ? '42px' : '50px',
                  color: '#000',
                  lineHeight: 'normal',
                  letterSpacing: '-1px',
                  fontWeight: 400,
                }}>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
                    fontStyle: 'italic',
                    fontWeight: 400,
                  }}>The Process</span>{' '}
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 400,
                  }}>We</span>
                  <br />
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                    fontStyle: 'normal',
                    fontWeight: 400,
                  }}>Followed</span>
                </h2>
              </div>
            )}

            {/* Steps */}
            <div style={{
              flex: isMobile ? 'none' : '0 0 593px',
              width: isMobile ? '390px' : 'auto',
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '20.196px' : '24px',
            }}>
              {caseStudy.processSteps.map((step, index) => (
                <div key={index} style={{
                  height: isMobile ? '54.772px' : '65px',
                  position: 'relative',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? '26.927px' : '32px',
                    alignItems: 'center',
                  }}>
                    <span style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      color: '#1E1E1E',
                      fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '24px' : '30.4px',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      lineHeight: isMobile ? '40.391px' : '48px',
                    }}>
                      {step.number || String(index + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      color: '#000',
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '20px' : '24px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: isMobile ? '25.245px' : '30px',
                    }}>
                      {step.title}
                    </span>
                  </div>
                  {/* Horizontal Divider */}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: isMobile ? '0.917px' : '1px',
                    backgroundColor: '#000',
                    opacity: 0.2,
                  }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== OPPORTUNITIES DISCOVERED SECTION ==================== */}
      {caseStudy.opportunities && caseStudy.opportunities.length > 0 && (
        <section style={{
          padding: isMobile ? '48px 22px 75px' : isTablet ? '82px 40px 80px' : '82px 50px 80px',
          maxWidth: '1440px',
          margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: isMobile ? '26px' : isTablet ? '42px' : '50px',
            color: '#000',
            marginBottom: isMobile ? '48px' : '60px',
            textAlign: 'center',
            lineHeight: 'normal',
            letterSpacing: isMobile ? '-0.26px' : '-1px',
          }}>
            <span style={{
              fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
              fontStyle: 'italic',
              fontWeight: 400,
            }}>Opportunities </span>
            <span style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
              fontStyle: 'normal',
              fontWeight: 400,
            }}>Discovered</span>
          </h2>

          {/* Circular Cards */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: isMobile ? 'center' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '0' : '0',
            paddingLeft: isMobile ? '1px' : '0',
            paddingRight: isMobile ? '1px' : '42px',
            paddingBottom: isMobile ? '75px' : '0',
          }}>
            {caseStudy.opportunities.map((opp, index) => (
              <div
                key={index}
                style={{
                  width: isMobile ? '100%' : isTablet ? '350px' : '489px',
                  height: isMobile ? 'auto' : isTablet ? '350px' : '489px',
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  backgroundColor: '#2558BF',
                  border: isMobile ? (index === 0 ? 'none' : '7px solid white') : '5px solid white',
                  overflow: 'hidden',
                  marginRight: isMobile ? '0' : '-42px',
                  marginBottom: isMobile ? '-75px' : '0',
                  position: 'relative',
                  boxShadow: isMobile ? 'none' : '0 10px 40px rgba(0,0,0,0.15)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{
                  textAlign: 'center',
                  width: isMobile ? '280px' : isTablet ? '300px' : '407px',
                  maxWidth: '75%',
                  padding: isMobile ? '0' : '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: isMobile ? '-20px' : '0',
                }}>
                  <span style={{
                    color: '#FFF',
                    textAlign: 'center',
                    fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
                    fontSize: isMobile ? '28px' : '42px',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: isMobile ? '32px' : '48px',
                    display: 'block',
                    marginBottom: isMobile ? '16px' : '24px',
                  }}>
                    {opp.number || String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 style={{
                    color: '#FFF',
                    textAlign: 'center',
                    fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', sans-serif",
                    fontSize: isMobile ? '18px' : '28px',
                    fontStyle: 'normal',
                    fontWeight: 500,
                    lineHeight: isMobile ? '22px' : 'normal',
                    marginBottom: isMobile ? '10px' : '18px',
                  }}>
                    {opp.title}
                  </h3>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.80)',
                    textAlign: 'center',
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                    fontSize: isMobile ? '14px' : '20px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: isMobile ? '20px' : '30px',
                  }}>
                    {opp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== DIVIDER LINE ==================== */}
      <div style={{
        width: isMobile ? '390px' : '1328.014px',
        maxWidth: isMobile ? 'calc(100% - 40px)' : '1328.014px',
        margin: '0 auto',
        height: '1px',
        backgroundColor: '#000',
        opacity: 0.2,
      }} />

      {/* ==================== THE EXPERIENCE SECTION ==================== */}
      <EditableSection
        sectionId="experience"
        label="Experience"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'experience'}
        style={{
          padding: isMobile ? '60px 0' : isTablet ? '80px 0' : '80px 0',
        }}
      >
        <h2 style={{
          fontSize: isMobile ? '26px' : isTablet ? '42px' : '50px',
          color: '#000',
          marginBottom: isMobile ? '0' : '60px',
          textAlign: 'center',
          lineHeight: 'normal',
          padding: '0 20px',
          letterSpacing: isMobile ? '-0.26px' : '-1px',
          display: isMobile ? 'none' : 'block',
        }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
            fontStyle: 'italic',
            fontWeight: 400,
          }}>The Experience</span>{' '}
          <span style={{
            fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
            fontStyle: 'normal',
            fontWeight: 400,
          }}>We Created</span>
        </h2>

        {/* Experience Images Grid */}
        {(caseStudy.experienceImages?.length > 0 || caseStudy.experienceImagesMobile?.length > 0) && (() => {
          const desktopImages = caseStudy.experienceImages || [];
          const mobileImages = caseStudy.experienceImagesMobile || [];
          const getImage = (index) => isMobile
            ? (mobileImages[index] || desktopImages[index])
            : (desktopImages[index] || mobileImages[index]);
          const hasImages = isMobile
            ? (mobileImages.length > 0 || desktopImages.length > 0)
            : (desktopImages.length > 0 || mobileImages.length > 0);

          return hasImages && (
            <>
              {isMobile ? (
                /* Mobile: All images stacked vertically */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {getImage(0) && (
                    <div style={{
                      height: '424px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={getImage(0)}
                        alt="Experience 1"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                  {getImage(1) && (
                    <div style={{
                      height: '418px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={getImage(1)}
                        alt="Experience 2"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                  {getImage(2) && (
                    <div style={{
                      height: '413px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={getImage(2)}
                        alt="Experience 3"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop/Tablet: Grid layout */
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0',
                  }}>
                    {[0, 1].map((index) => getImage(index) && (
                      <div key={index} style={{
                        height: isTablet ? '500px' : '690px',
                        overflow: 'hidden',
                      }}>
                        <img
                          src={getImage(index)}
                          alt={`Experience ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Full width image */}
                  {getImage(2) && (
                    <div style={{
                      width: '100%',
                      height: isTablet ? '500px' : '690px',
                      overflow: 'hidden',
                    }}>
                      <img
                        src={getImage(2)}
                        alt="Experience Full"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </>
          );
        })()}

        {/* Experience Quote */}
        {caseStudy.experienceQuote && (
          <div style={{
            width: isMobile ? '361px' : '937px',
            maxWidth: isMobile ? 'calc(100% - 40px)' : 'auto',
            marginTop: isMobile ? '60px' : '60px',
            marginLeft: isMobile ? '20px' : isTablet ? '60px' : '118px',
            paddingRight: isMobile ? '20px' : '0',
          }}>
            <p style={{
              color: '#000',
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '18px' : '28px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: isMobile ? '30px' : '42px',
            }}>
              {caseStudy.experienceQuote}
            </p>
          </div>
        )}
      </EditableSection>

      {/* ==================== COLOR PALETTE SECTION ==================== */}
      <EditableSection
        sectionId="colorPalette"
        label="Color Palette"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'design'}
        style={{ position: 'relative' }}
      >
        {colorPalette.map((color, index) => (
          <div
            key={index}
            style={{
              width: '100%',
              height: isMobile
                ? (index === colorPalette.length - 1 ? '84px' : '68px')
                : '84px',
              backgroundColor: color.color,
            }}
          />
        ))}

        {/* Title Overlay */}
        <div style={{
          position: 'absolute',
          left: isMobile ? '28px' : '50px',
          top: isMobile ? '33px' : '31px',
        }}>
          <p style={{
            color: '#000',
            fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '40px' : isTablet ? '46px' : '56px',
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 'normal',
            letterSpacing: isMobile ? '-1.1885px' : '-1.189px',
            marginBottom: '0',
          }}>
            Color
          </p>
          <p style={{
            color: '#000',
            fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '40px' : isTablet ? '46px' : '56px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 'normal',
            letterSpacing: isMobile ? '-1.1885px' : '-1.189px',
          }}>
            Palatte
          </p>
        </div>
      </EditableSection>

      {/* ==================== TYPOGRAPHY SECTION ==================== */}
      {(caseStudy.typography?.fontImage || caseStudy.typography?.fontImageMobile) && (
        <EditableSection
          sectionId="typography"
          label="Typography"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'design'}
          style={{
            width: '100%',
            height: isMobile ? '664px' : isTablet ? '450px' : '603px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <img
            src={isMobile
              ? (caseStudy.typography?.fontImageMobile || caseStudy.typography?.fontImage)
              : (caseStudy.typography?.fontImage || caseStudy.typography?.fontImageMobile)
            }
            alt="Typography"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </EditableSection>
      )}

      {/* ==================== CTA SECTION ==================== */}
      <EditableSection
        sectionId="cta"
        label="CTA Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'settings'}
        style={{
        paddingTop: isMobile ? '80px' : '100px',
        marginTop: '0',
        paddingBottom: isMobile ? '0px' : isTablet ? '0px' : '0px',
        paddingLeft: isMobile ? '0' : isTablet ? '40px' : '100px',
        paddingRight: isMobile ? '0' : isTablet ? '40px' : '100px',
        overflow: isMobile ? 'visible' : 'visible',
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
          {isMobile ? (
            /* Mobile Layout - Vertical stacking */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
            }}>
              {/* Green Section - Top */}
              <div style={{
                backgroundColor: '#E1FFA0',
                width: '474px',
                maxWidth: '110%',
                height: '403px',
                padding: '81px 42px 0',
                borderRadius: '160px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '32px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: 'normal',
                  letterSpacing: '-1px',
                  color: '#000',
                  textAlign: 'center',
                  marginBottom: '10px',
                }}>
                  {aboutContent.ctaTitle}
                </h3>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '24px',
                  color: '#000',
                  width: '346px',
                  maxWidth: '100%',
                  margin: '0 auto',
                }}>
                  {aboutContent.ctaDescription}
                </p>
              </div>

              {/* Black Section - Overlapping below */}
              <div style={{
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
              }}>
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
                  <span style={{
                    color: '#000',
                    textAlign: 'center',
                    fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '22px',
                    fontWeight: 400,
                    lineHeight: '24px',
                  }}>
                    {aboutContent.ctaButtonText}
                  </span>
                </Link>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px',
                  fontWeight: 400,
                  lineHeight: 'normal',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '11px',
                }}>
                  <img src={vectorIcon} alt="" style={{ width: '18px', height: '20px' }} />
                  Get instant response
                </p>
              </div>
            </div>
          ) : (
            /* Desktop/Tablet Layout - Horizontal */
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              {/* Left - Green Section */}
              <div style={{
                backgroundColor: '#E1FFA0',
                padding: '48px 64px',
                paddingRight: '200px',
                borderRadius: '300px',
                height: '253px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '42px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: 'normal',
                  letterSpacing: '-1px',
                  color: '#000',
                  marginBottom: '8px',
                }}>
                  {aboutContent.ctaTitle}
                </h3>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '20px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: '28px',
                  color: '#000',
                  width: '539px',
                  maxWidth: '100%',
                }}>
                  {aboutContent.ctaDescription}
                </p>
              </div>

              {/* Right - Black Section */}
              <div style={{
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
              }}>
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
                  <span style={{
                    color: '#000',
                    textAlign: 'center',
                    fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '24px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: '24px',
                  }}>
                    {aboutContent.ctaButtonText}
                  </span>
                </Link>
                <p style={{
                  fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                  fontSize: '16px',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  lineHeight: 'normal',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <img src={vectorIcon} alt="" style={{ width: '18px', height: '20px' }} />
                  Get instant response
                </p>
              </div>
            </div>
          )}
        </div>
      </EditableSection>

      {/* ==================== TESTIMONIAL SECTION ==================== */}
      {currentTestimonial.quote1 && (
        <section style={{
          paddingTop: isMobile ? '60px' : isTablet ? '90px' : '90px',
          paddingBottom: '0px',
          paddingLeft: isMobile ? '20px' : isTablet ? '40px' : '100px',
          paddingRight: isMobile ? '20px' : isTablet ? '40px' : '100px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '1320px', margin: '0 auto' }}>
            {/* Look what our client said - First word Italic */}
            <h3 style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '28px' : isTablet ? '40px' : '50px',
              fontWeight: 400,
              lineHeight: 'normal',
              letterSpacing: isMobile ? '-0.5px' : '-1px',
              color: '#000',
              marginBottom: isMobile ? '80px' : '60px',
            }}>
              <em style={{ fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif", fontStyle: 'italic', marginRight: '0.25em' }}>{aboutContent.clientLabelItalic}</em>{aboutContent.clientLabelNormal}
            </h3>

            {isMobile ? (
              /* Mobile Layout */
              <div style={{ textAlign: 'left', padding: '0 20px' }}>
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
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    color: '#000',
                    width: '378px',
                    maxWidth: '100%',
                    marginBottom: '16px',
                  }}>
                    {currentTestimonial.quote1}
                  </p>
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '20px',
                    color: '#000',
                    width: '378px',
                    maxWidth: '100%',
                  }}>
                    {currentTestimonial.quote2}
                  </p>
                </div>

                {/* Stats in a row */}
                {testimonialStats[0].value && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '32px',
                  }}>
                    {testimonialStats.map((stat, index) => (
                      <div key={index} style={{ textAlign: 'center' }}>
                        <p style={{
                          fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', sans-serif",
                          fontSize: '24px',
                          fontWeight: 500,
                          lineHeight: '32px',
                          color: '#000',
                          marginBottom: '4px',
                        }}>
                          {stat.value}
                        </p>
                        <p style={{
                          fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                          fontSize: '11px',
                          fontWeight: 400,
                          lineHeight: '16px',
                          color: '#000',
                        }}>
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image and Author - with Navigation */}
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
                    {currentTestimonial.authorImage && (
                      <img
                        src={currentTestimonial.authorImage}
                        alt={currentTestimonial.authorName}
                        style={{
                          width: '150px',
                          height: '150px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginBottom: '12px',
                        }}
                      />
                    )}
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '18px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      color: '#000',
                      marginBottom: '4px',
                      textAlign: 'right',
                    }}>
                      {currentTestimonial.authorName}
                    </p>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '14px',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      lineHeight: '17px',
                      color: '#000',
                      textAlign: 'right',
                    }}>
                      {currentTestimonial.authorRole}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop/Tablet Layout - Horizontal: Quote on left, Author on right */
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '60px',
                maxWidth: '900px',
                margin: '0 auto',
                textAlign: 'left',
              }}>
                {/* Left - Quote and Stats */}
                <div style={{ flex: 1 }}>
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
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '20px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      letterSpacing: '-0.184px',
                      color: '#000',
                      marginBottom: '16px',
                    }}>
                      {currentTestimonial.quote1}
                    </p>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '20px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      letterSpacing: '-0.184px',
                      color: '#000',
                    }}>
                      {currentTestimonial.quote2}
                    </p>
                  </div>

                  {/* Stats with vertical separators */}
                  {testimonialStats[0].value && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                    }}>
                      {testimonialStats.map((stat, index) => (
                        <div
                          key={index}
                          style={{
                            paddingLeft: index > 0 ? '24px' : 0,
                            paddingRight: '24px',
                            borderLeft: index > 0 ? '1px solid #000' : 'none',
                          }}
                        >
                          <p style={{
                            fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', sans-serif",
                            fontSize: '24px',
                            fontWeight: 400,
                            lineHeight: '43.951px',
                            color: '#000',
                            marginBottom: '4px',
                          }}>
                            {stat.value}
                          </p>
                          <p style={{
                            fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: '24.417px',
                            color: '#000',
                          }}>
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right - Author Image and Info */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '150px',
                }}>
                  {currentTestimonial.authorImage && (
                    <img
                      src={currentTestimonial.authorImage}
                      alt={currentTestimonial.authorName}
                      style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginBottom: '16px',
                      }}
                    />
                  )}
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '20px',
                    fontWeight: 400,
                    lineHeight: 'normal',
                    letterSpacing: '-0.184px',
                    color: '#000',
                    textAlign: 'center',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                  }}>
                    {currentTestimonial.authorName}
                  </p>
                  <p style={{
                    fontFamily: "'Plus Jakarta Sans-MediumItalic', 'Plus Jakarta Sans', sans-serif",
                    fontSize: '14px',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    lineHeight: '17px',
                    color: '#000',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                  }}>
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
        </section>
      )}

      {/* ==================== DIVIDER LINE ==================== */}
      <div style={{
        width: isMobile ? '390px' : '1328.014px',
        maxWidth: isMobile ? 'calc(100% - 40px)' : '1328.014px',
        margin: isMobile ? '40px auto 0' : '85px auto 0',
        height: '1px',
        backgroundColor: '#000',
        opacity: 0.2,
      }} />

      {/* ==================== RELATED PROJECTS SECTION ==================== */}
      {caseStudy.relatedWorks && caseStudy.relatedWorks.length > 0 && (
        <EditableSection
          sectionId="related"
          label="Related Projects"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'related'}
          style={{
            padding: isMobile ? '48px 0 100px' : isTablet ? '40px 0 200px' : '40px 0 200px',
          }}
        >
          {/* Title */}
          <h2 style={{
            fontSize: isMobile ? '26px' : isTablet ? '42px' : '50px',
            color: '#000',
            marginBottom: isMobile ? '48px' : '40px',
            letterSpacing: isMobile ? '-0.26px' : '-1px',
            paddingLeft: isMobile ? '20px' : isTablet ? '40px' : '50px',
            paddingRight: isMobile ? '20px' : isTablet ? '40px' : '50px',
          }}>
            <span style={{
              fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif",
              fontStyle: 'italic',
              fontWeight: 400,
            }}>Related </span>
            <span style={{
              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
              fontStyle: 'normal',
              fontWeight: 400,
            }}>Projects</span>
          </h2>

          {/* Mobile: Vertical stacking, Desktop: Horizontal scroll */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '48px' : '20px',
            overflowX: isMobile ? 'visible' : 'auto',
            paddingLeft: isMobile ? '20px' : isTablet ? '40px' : '50px',
            paddingRight: isMobile ? '20px' : isTablet ? '40px' : '50px',
            paddingBottom: '20px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            {caseStudy.relatedWorks.map((work) => (
              <Link
                key={work._id}
                to={`/work/${work._id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  flexShrink: 0,
                  width: isMobile ? '390px' : isTablet ? '450px' : '610px',
                  maxWidth: isMobile ? '100%' : 'none',
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '24px' : '30px',
                }}>
                  {/* Image */}
                  <div style={{
                    height: isMobile ? '359px' : isTablet ? '280px' : '359px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <img
                      src={work.image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=610&h=359&fit=crop'}
                      alt={work.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    {/* Tags */}
                    {work.tags && work.tags.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: isMobile ? '15px' : '16px',
                        right: isMobile ? '15px' : '16px',
                        display: 'flex',
                        gap: '7px',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}>
                        {work.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: isMobile ? '7px 14px' : '8px 14px',
                              border: '1px solid #000',
                              borderRadius: '200px',
                              fontSize: isMobile ? '12px' : '16px',
                              fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                              fontWeight: 400,
                              lineHeight: 'normal',
                              backgroundColor: '#FFF',
                              color: '#000',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                  }}>
                    <h3 style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '24px' : '32px',
                      fontWeight: 400,
                      color: '#0f0f0f',
                      lineHeight: 'normal',
                    }}>
                      {work.title}
                    </h3>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: 400,
                      color: '#0f0f0f',
                      lineHeight: '22px',
                      maxWidth: '519px',
                    }}>
                      {work.description?.substring(0, 150)}{work.description?.length > 150 ? '...' : ''}
                    </p>
                  </div>

                  {/* Read More */}
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans-SemiBold', 'Plus Jakarta Sans', sans-serif",
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 400,
                    color: '#0f0f0f',
                    textDecoration: 'underline',
                    letterSpacing: isMobile ? '1px' : '2px',
                    lineHeight: '22px',
                  }}>
                    READ MORE
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </EditableSection>
      )}
    </div>
  );
};

export default CaseStudyDetail;
