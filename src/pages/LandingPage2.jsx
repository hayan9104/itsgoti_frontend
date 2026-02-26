import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import useWindowSize from '../hooks/useWindowSize';
import { pagesAPI, contactsAPI } from '../services/api';
import EditableSection from '../components/EditableSection';

const LandingPage2 = () => {
  const { isMobile, isTablet } = useWindowSize();
  const [pageContent, setPageContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const [scrollProgress, setScrollProgress] = useState(0);
  const [guaranteesProgress, setGuaranteesProgress] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [heroAnimated, setHeroAnimated] = useState(false);
  const [pricingAnimated, setPricingAnimated] = useState(false);
  const [ctaAnimated, setCtaAnimated] = useState(false);
  const lastScrollYRef = useRef(0);
  const scrollDirectionRef = useRef('up');
  const portfolioRef = useRef(null);
  const guaranteesRef = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef = useRef(null);

  const headerHeight = isMobile ? 90 : 133; // Increased by 10px

  // Hero animation on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchPageContent();
  }, []);

  // Scroll-based parallax animation for portfolio images and guarantees
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Header hide/show animation - Premium smooth behavior
      const lastScrollY = lastScrollYRef.current;

      if (currentScrollY <= 5) {
        // At very top - always show header
        setHeaderVisible(true);
        scrollDirectionRef.current = 'up';
      } else if (currentScrollY > lastScrollY) {
        // Scrolling DOWN - hide header
        if (scrollDirectionRef.current !== 'down') {
          setHeaderVisible(false);
          scrollDirectionRef.current = 'down';
        }
      } else if (currentScrollY < lastScrollY) {
        // Scrolling UP - show header
        if (scrollDirectionRef.current !== 'up') {
          setHeaderVisible(true);
          scrollDirectionRef.current = 'up';
        }
      }

      lastScrollYRef.current = currentScrollY;

      // Portfolio images animation
      if (portfolioRef.current) {
        const rect = portfolioRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const startPoint = windowHeight;
        const endPoint = windowHeight * 0.4;

        let progress = 0;
        if (rect.top <= startPoint && rect.top >= endPoint) {
          progress = (startPoint - rect.top) / (startPoint - endPoint);
        } else if (rect.top < endPoint) {
          progress = 1;
        }
        setScrollProgress(Math.min(Math.max(progress, 0), 1));
      }

      // Guarantees section animation - single progress for staggered items
      if (guaranteesRef.current) {
        const rect = guaranteesRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        // Animation starts when section enters viewport, ends when it reaches middle
        const startPoint = windowHeight;
        const endPoint = windowHeight * 0.3;

        let progress = 0;
        if (rect.top <= startPoint && rect.top >= endPoint) {
          progress = (startPoint - rect.top) / (startPoint - endPoint);
        } else if (rect.top < endPoint) {
          progress = 1;
        }
        setGuaranteesProgress(Math.min(Math.max(progress, 0), 1));
      }

      // Pricing cards animation - trigger when section enters viewport
      if (pricingRef.current && !pricingAnimated) {
        const rect = pricingRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top <= windowHeight * 0.85) {
          setPricingAnimated(true);
        }
      }

      // CTA container animation - trigger when section enters viewport
      if (ctaRef.current && !ctaAnimated) {
        const rect = ctaRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        if (rect.top <= windowHeight * 0.85) {
          setCtaAnimated(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pricingAnimated, ctaAnimated]);

  // Editor mode: Listen for updates from parent
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
      }

      if (event.data.type === 'SECTION_SELECTED') {
        setSelectedSection(event.data.sectionId);
      }
    };

    window.addEventListener('message', handleMessage);

    // Notify parent that preview is ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  const fetchPageContent = async () => {
    try {
      const response = await pagesAPI.getOne('landing-page-2');
      if (response.data?.data?.content) {
        setPageContent(response.data.data.content);
      }
    } catch (error) {
      console.log('Using default content');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setFormLoading(true);
    try {
      await contactsAPI.create({
        ...data,
        subject: `Shopify Store Inquiry from ${data.name}`,
        sourcePage: 'Landing Page 2',
        message: `Contact from Landing Page 2 - Shopify Design\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}`,
      });
      setFormSubmitted(true);
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Default content
  const defaultContent = {
    heroTitle: 'Your Shopify Website Design Agency',
    heroDescription: "We specialize in Shopify design and development.\nLet's design, optimize, and launch your Shopify store with guaranteed results -\nor you don't pay.",
    heroButtonText: 'See Price',
    guarantee1Title: '10-Day Satisfaction Guarantee',
    guarantee1Text: "— Get a full refund if you're not happy, no questions asked.",
    guarantee2Title: 'Launch your E-commerce business in weeks,',
    guarantee2Highlight: 'not months.',
    guarantee3Title: 'Unlimited revisions',
    guarantee3Text: 'until your website looks exactly how you want it.',
    clientsTitle: 'Our Shopify Clients',
    pricingTitle: 'Shopify Design Plans.',
    pricingSubtitle: "Choose a plan that's right for you...",
    plan1Label: 'Popular Plan',
    plan1Price: '₹00,000/-',
    plan1Subtitle: 'One request at a time. Pause or cancel anytime.',
    plan1Features: [
      'Complete Shopify Theme Setup & Customization',
      'Product Upload (Up to 300 Products)',
      'Payment Gateway & Shipping Setup',
      'Fully Mobile-Optimized Design',
      'Fast-Loading, SEO-Friendly Pages',
      'Google Analytics Integration',
      'Google & Meta (Facebook/Instagram) Ads Setup',
      '3 Shopify Training Sessions',
    ],
    plan2Price: '₹00,000/-',
    plan2Subtitle: 'Two request at a time. Pause or cancel anytime.',
    plan2Features: [
      'Custom Store Design in Figma Before Development',
      'Unlimited Product Listings',
      'Custom Upsell & Cross-Sell Flows',
      'Two Extra Landing Pages for Your Hero Products',
      'Email Marketing Integration & Flow Setup',
      'On-Page SEO Optimization for Main Pages',
      'Conversion Audit After Launch (30 Days Later)',
      'Everything Included in the MVP Plan',
    ],
    ctaTitle: "Not sure what's right for you? Let's figure it out together.",
    ctaDescription: "Want to learn more about how we work or what's best for your store? We'll walk you through everything step by step.",
    ctaButtonText: 'Call Now',
    formTitle: "Let's Build Your Shopify Store — The Right Way.",
    formDescription: "Get expert advice tailored to your brand. Whether you're starting fresh or redesigning, we'll guide you with a clear plan — no tech stress, no fluff.",
    formButtonText: 'Book A Call',
    formResponseText: '*Get Instant Response*',
    footerText: 'Thanks for visiting',
    copyrightText: '© Goti 2025. All rights reserved.',
  };

  const content = { ...defaultContent, ...pageContent };

  // Helper to convert string (from textarea) to array
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split('\n').filter(item => item.trim());
    return [];
  };

  // Convert features to arrays
  const plan1Features = toArray(content.plan1Features);
  const plan2Features = toArray(content.plan2Features);

  // Portfolio images - default placeholders
  const portfolioImages = content.portfolioImages || [
    '/api/placeholder/200/300',
    '/api/placeholder/200/300',
    '/api/placeholder/200/300',
    '/api/placeholder/200/300',
    '/api/placeholder/200/300',
  ];

  // Client logos - parse from content or use defaults
  const parseClientLogos = () => {
    if (content.clientLogos && Array.isArray(content.clientLogos) && content.clientLogos.length > 0) {
      return content.clientLogos.map((logo, index) => {
        if (typeof logo === 'string') {
          return { image: logo, name: `Client ${index + 1}` };
        }
        return { image: logo.url || logo, name: logo.name || `Client ${index + 1}` };
      });
    }
    // Default placeholder logos
    return [
      { name: 'GORME' },
      { name: 'CAFE NILOUFER' },
      { name: 'Hewey' },
      { name: 'ClickOnCare' },
      { name: 'Brand 5' },
      { name: 'Brand 6' },
    ];
  };
  const clientLogos = parseClientLogos();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fff',
      fontFamily: "'Inter', 'Gilroy', sans-serif",
      overflowX: 'hidden',
      scrollBehavior: 'smooth',
    }}>
      {/* Header */}
      <EditableSection
        sectionId="header"
        label="Header"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'header'}
        style={{
          backgroundColor: '#000',
          height: `${headerHeight}px`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'fixed',
          top: headerVisible ? '0px' : `${-(headerHeight * 0.8)}px`,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: 'top 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {content.logoImage ? (
          <img
            src={content.logoImage.startsWith('http') ? content.logoImage : `${import.meta.env.VITE_API_URL || ''}${content.logoImage}`}
            alt="Logo"
            style={{
              width: '85px',
              height: '85px',
              objectFit: 'contain',
            }}
          />
        ) : (
          <div style={{
            color: '#2558BF',
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '-1px',
          }}>
            {content.logoText || 'goti'}
          </div>
        )}
      </EditableSection>

      {/* Header spacer to prevent content jump */}
      <div style={{ height: `${headerHeight}px` }} />

      {/* Hero Section */}
      <EditableSection
        sectionId="hero"
        label="Hero Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'hero'}
        style={{
          padding: isMobile ? '50px 20px 40px' : isTablet ? '110px 40px 40px' : '110px 100px 40px',
          textAlign: 'center',
          backgroundColor: '#fff',
        }}
      >
        {/* Hero Content Wrapper - Single animation for all elements */}
        <div style={{
          transform: heroAnimated ? 'translateY(0)' : 'translateY(-60px)',
          opacity: heroAnimated ? 1 : 0,
          transition: 'transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1.2s ease-out',
        }}>
          {/* Title - Centered */}
          <h1 style={{
            fontSize: isMobile ? '28px' : isTablet ? '52px' : '80px',
            fontWeight: 700,
            color: '#1D1D1F',
            lineHeight: '1.1em',
            letterSpacing: '-0.06em',
            fontFamily: "'Inter', sans-serif",
            margin: '0 0 20px 0',
            textAlign: 'center',
          }}>
            Your Shopify Website
            <br />
            Design Agency
          </h1>

          {/* Description */}
          <div style={{
            maxWidth: isMobile ? '100%' : '900px',
            margin: '0 auto 20px',
          }}>
            {/* Line 1 - Normal size */}
            <p style={{
              fontSize: isMobile ? '14px' : '18px',
              fontWeight: 600,
              color: '#000000',
              lineHeight: '1.4em',
              letterSpacing: '-0.02em',
              fontFamily: "'Inter', sans-serif",
              margin: '0 0 4px 0',
            }}>
              We specialize in Shopify design and development.
            </p>
            {/* Line 2 - Larger size (combined with "or you don't pay") */}
            <p style={{
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: 700,
              color: '#000000',
              lineHeight: '1.3em',
              letterSpacing: '-0.03em',
              fontFamily: "'Inter', sans-serif",
              margin: 0,
            }}>
              Let's <strong>design, optimize, and launch</strong> your Shopify store with <strong>guaranteed results</strong> - or you don't pay.
            </p>
          </div>

          {/* See Price Button */}
          <button
            onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              backgroundColor: '#0071E3',
              color: '#fff',
              width: '130px',
              height: '48px',
              borderRadius: '100px',
              border: 'none',
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: '1.2em',
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              marginBottom: '40px',
            }}
          >
            {content.heroButtonText}
          </button>
        </div>

        {/* Portfolio Grid - Images with parallax scroll animation */}
        <div
          ref={portfolioRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: isMobile ? '18px' : '18px',
            overflow: 'visible',
            width: '100%',
          }}
        >
          {isMobile ? (
            // Mobile Layout: 3 images (index 1, 2, 3 from array) - sides tall, center small
            <>
              {[1, 2, 3].map((imgIndex) => {
                const img = portfolioImages[imgIndex] || portfolioImages[0];
                const imgUrl = typeof img === 'string' ? img : img.url;
                const hasValidImage = imgUrl && !imgUrl.includes('/api/placeholder');
                const isCenter = imgIndex === 2;

                // Animation: Center comes UP, sides come DOWN (more dramatic effect)
                const initialOffset = isCenter ? 100 : -100;
                const currentOffset = initialOffset * (1 - scrollProgress);

                return (
                  <div
                    key={imgIndex}
                    style={{
                      width: isCenter ? '200px' : '140px',
                      height: isCenter ? '267px' : '400px',
                      flexShrink: 0,
                      overflow: 'hidden',
                      backgroundColor: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '12px solid #000',
                      borderRadius: '20px',
                      transform: `translateY(${currentOffset}px)`,
                      zIndex: isCenter ? 2 : 1,
                    }}
                  >
                    {hasValidImage ? (
                      <img
                        src={imgUrl}
                        alt={`Portfolio ${imgIndex + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '12px',
                        textAlign: 'center',
                        padding: '10px',
                      }}>
                        Portfolio {imgIndex + 1}
                        <br />
                        <span style={{ fontSize: '10px' }}>Add from Admin</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            // Desktop/Tablet Layout: 5 images
            portfolioImages.slice(0, 5).map((img, index) => {
              const imgUrl = typeof img === 'string' ? img : img.url;
              const hasValidImage = imgUrl && !imgUrl.includes('/api/placeholder');

              // Parallax effect: odd images (0,2,4) start down, even images (1,3) start up
              const isOdd = index % 2 === 0;
              const initialOffset = 80;
              const currentOffset = initialOffset * (1 - scrollProgress);
              const translateY = isOdd ? currentOffset : -currentOffset;

              return (
                <div
                  key={index}
                  style={{
                    width: '350px',
                    height: '450px',
                    flexShrink: 0,
                    overflow: 'hidden',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '17px solid #000',
                    borderRadius: '25px',
                    transform: `translateY(${translateY}px)`,
                  }}
                >
                  {hasValidImage ? (
                    <img
                      src={imgUrl}
                      alt={`Portfolio ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div style={{
                      color: '#9ca3af',
                      fontSize: '14px',
                      textAlign: 'center',
                      padding: '20px',
                    }}>
                      Portfolio {index + 1}
                      <br />
                      <span style={{ fontSize: '12px' }}>Add from Admin</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </EditableSection>

      {/* Guarantees Section */}
      <EditableSection
        sectionId="guarantees"
        label="Guarantees Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'guarantees'}
        style={{
          padding: isMobile ? '0px 20px 60px' : '0px 40px 80px',
          backgroundColor: '#fff',
          textAlign: 'center',
        }}
      >
        <div
          ref={guaranteesRef}
          style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
          }}
        >
          {/* Guarantee 1 - Animated on scroll (first to animate) */}
          <div
            style={{
              transform: `translateY(${(isMobile ? 60 : 100) * (1 - Math.min(guaranteesProgress * 2.5, 1))}px)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {content.guarantee1Icon ? (
                <img
                  src={content.guarantee1Icon.startsWith('http') ? content.guarantee1Icon : `${import.meta.env.VITE_API_URL || ''}${content.guarantee1Icon}`}
                  alt=""
                  style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                />
              ) : (
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <circle cx="22" cy="22" r="21" stroke="#0071E3" strokeWidth="2" />
                  <path d="M14 22l6 6 10-12" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {/* Text */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '24px' : '40px',
              fontWeight: 700,
              lineHeight: '1.2em',
              letterSpacing: '-0.04em',
              color: '#1D1D1F',
              margin: 0,
            }}>
              <span style={{ color: '#0071E3' }}>{content.guarantee1Title}</span>
              {' '}{content.guarantee1Text}
            </p>
          </div>

          {/* Guarantee 2 - Animated on scroll (second to animate) */}
          <div
            style={{
              transform: `translateY(${(isMobile ? 100 : 160) * (1 - Math.min(Math.max((guaranteesProgress - 0.2) * 2.5, 0), 1))}px)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {content.guarantee2Icon ? (
                <img
                  src={content.guarantee2Icon.startsWith('http') ? content.guarantee2Icon : `${import.meta.env.VITE_API_URL || ''}${content.guarantee2Icon}`}
                  alt=""
                  style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                />
              ) : (
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <circle cx="22" cy="22" r="21" stroke="#0071E3" strokeWidth="2" />
                  <path d="M22 12v10l6 3" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {/* Text */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '24px' : '40px',
              fontWeight: 700,
              lineHeight: '1.2em',
              letterSpacing: '-0.04em',
              color: '#1D1D1F',
              margin: 0,
            }}>
              {content.guarantee2Title}{' '}
              <span style={{ color: '#0071E3' }}>{content.guarantee2Highlight}</span>
            </p>
          </div>

          {/* Guarantee 3 - Animated on scroll (third to animate) */}
          <div
            style={{
              transform: `translateY(${(isMobile ? 140 : 220) * (1 - Math.min(Math.max((guaranteesProgress - 0.3) * 2, 0), 1))}px)`,
              transition: 'transform 0.15s ease-out',
            }}
          >
            {/* Icon */}
            <div style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {content.guarantee3Icon ? (
                <img
                  src={content.guarantee3Icon.startsWith('http') ? content.guarantee3Icon : `${import.meta.env.VITE_API_URL || ''}${content.guarantee3Icon}`}
                  alt=""
                  style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                />
              ) : (
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                  <path d="M10 18v-4a2 2 0 012-2h4m18 6v-4a2 2 0 00-2-2h-4m-18 14v4a2 2 0 002 2h4m18-6v4a2 2 0 01-2 2h-4" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 22l4 4 8-8" stroke="#0071E3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {/* Text */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '24px' : '40px',
              fontWeight: 700,
              lineHeight: '1.2em',
              letterSpacing: '-0.04em',
              color: '#1D1D1F',
              margin: 0,
            }}>
              <span style={{ color: '#0071E3' }}>{content.guarantee3Title}</span>
              {' '}{content.guarantee3Text}
            </p>
          </div>
        </div>
      </EditableSection>

      {/* Clients Section with Marquee Animation */}
      <EditableSection
        sectionId="clients"
        label="Clients Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'clients'}
        style={{
          backgroundColor: '#000',
          height: '387px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          borderRadius: '15px',
        }}
      >
        <h2 style={{
          color: '#FFFFFF',
          fontSize: isMobile ? '32px' : isTablet ? '44px' : '56px',
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '-0.06em',
          lineHeight: '1.1em',
          marginBottom: isMobile ? '30px' : '40px',
        }}>
          {content.clientsTitle}
        </h2>

        {/* Marquee Container */}
        <div style={{
          width: '100%',
          height: '200px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* Gradient overlays for smooth fade effect */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: isMobile ? '40px' : '80px',
            background: 'linear-gradient(to right, #000, transparent)',
            zIndex: 2,
          }} />
          <div style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: isMobile ? '40px' : '80px',
            background: 'linear-gradient(to left, #000, transparent)',
            zIndex: 2,
          }} />

          {/* Marquee Track */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            animation: 'marquee 20s linear infinite',
            width: 'fit-content',
          }}>
            {/* First set of logos */}
            {[...clientLogos, ...clientLogos].map((client, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: isMobile ? '50px' : '80px',
                  flexShrink: 0,
                  height: '200px',
                }}
              >
                {client.image ? (
                  <img
                    src={client.image.startsWith('http') ? client.image : `${import.meta.env.VITE_API_URL || ''}${client.image}`}
                    alt={client.name || `Client ${index + 1}`}
                    style={{
                      height: isMobile ? '80px' : isTablet ? '120px' : '150px',
                      width: 'auto',
                      maxWidth: isMobile ? '150px' : '250px',
                      objectFit: 'contain',
                      filter: 'brightness(0) invert(1)',
                      opacity: 0.95,
                    }}
                  />
                ) : (
                  <div style={{
                    color: '#fff',
                    fontSize: isMobile ? '24px' : isTablet ? '32px' : '40px',
                    fontWeight: 600,
                    fontFamily: "'Inter', sans-serif",
                    opacity: 0.95,
                    whiteSpace: 'nowrap',
                  }}>
                    {client.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </EditableSection>

      {/* Pricing Section */}
      <div id="pricing-section">
      <EditableSection
        sectionId="pricing"
        label="Pricing Plans Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'pricing'}
        style={{
          padding: isMobile ? '40px 20px 10px' : isTablet ? '60px 100px 10px' : '80px 200px 10px',
          backgroundColor: '#fff',
        }}
      >
        {/* Pricing Cards Container with Headers */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '10px',
          width: '100%',
        }}>
          {/* Plan 1 Column - with Header */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header above Card 1 */}
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '36px' : isTablet ? '48px' : '64px',
              fontWeight: 700,
              color: '#1D1D1F',
              letterSpacing: '-0.04em',
              lineHeight: '1.2em',
              margin: 0,
              marginBottom: isMobile ? '16px' : '60px',
            }}>
              {content.pricingTitle}
            </h2>

            {/* Subtitle - Only show on mobile below heading */}
            {isMobile && (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                color: '#000000',
                letterSpacing: '-0.03em',
                lineHeight: '1.3em',
                margin: 0,
                marginBottom: '30px',
              }}>
                {content.pricingSubtitle}
              </p>
            )}

            {/* Plan 1 - Popular (Blue) */}
            <div
              ref={pricingRef}
              style={{
                backgroundColor: '#2558BF',
                borderRadius: '15px',
                padding: isMobile ? '28px' : '32px',
                color: '#fff',
                height: isMobile ? 'auto' : '534px',
                minHeight: isMobile ? '534px' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                transform: pricingAnimated ? 'translateY(0)' : 'translateY(80px)',
                opacity: pricingAnimated ? 1 : 0,
                transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1s ease-out',
              }}
            >
            {/* Plan Label */}
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '16px' : '19px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: '1.3em',
              marginBottom: '16px',
            }}>
              {content.plan1Label}
            </div>
            {/* Price */}
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '32px' : '40px',
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: '1.2em',
              marginBottom: '8px',
            }}>
              {content.plan1Price}
            </div>
            {/* Description */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: '1.3em',
              marginBottom: '24px',
              opacity: 0.95,
            }}>
              {content.plan1Subtitle}
            </p>
            {/* Features */}
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 24px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: 1,
            }}>
              {plan1Features.map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.3em',
                }}>
                  <span style={{ color: '#fff', flexShrink: 0 }}>◎</span>
                  {feature}
                </li>
              ))}
            </ul>
            {/* Button */}
            <button
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                width: '100%',
                backgroundColor: '#fff',
                color: '#2558BF',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 'auto',
              }}
            >
              Get Started
            </button>
            </div>
          </div>

          {/* Plan 2 Column - with Subtitle */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Subtitle above Card 2 - Only show on desktop/tablet */}
            {!isMobile && (
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '21px',
                fontWeight: 600,
                color: '#000000',
                letterSpacing: '-0.03em',
                lineHeight: '1.3em',
                margin: 0,
                marginBottom: '60px',
                display: 'flex',
                alignItems: 'center',
                minHeight: isTablet ? '115px' : '154px',
              }}>
                {content.pricingSubtitle}
              </p>
            )}

            {/* Plan 2 (White) */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '15px',
              padding: isMobile ? '28px' : '32px',
              border: '1px solid #e5e7eb',
              height: isMobile ? 'auto' : '534px',
              minHeight: isMobile ? '534px' : 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              transform: pricingAnimated ? 'translateY(0)' : 'translateY(80px)',
              opacity: pricingAnimated ? 1 : 0,
              transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s, opacity 1s ease-out 0.2s',
            }}>
            {/* Price */}
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '32px' : '40px',
              fontWeight: 700,
              color: '#2558BF',
              letterSpacing: '-0.04em',
              lineHeight: '1.2em',
              marginBottom: '8px',
            }}>
              {content.plan2Price}
            </div>
            {/* Description */}
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              fontWeight: 500,
              color: '#666',
              letterSpacing: '-0.02em',
              lineHeight: '1.3em',
              marginBottom: '24px',
            }}>
              {content.plan2Subtitle}
            </p>
            {/* Features */}
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 24px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: 1,
            }}>
              {plan2Features.map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#333',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.3em',
                }}>
                  <span style={{ color: '#2558BF', flexShrink: 0 }}>◎</span>
                  {feature}
                </li>
              ))}
            </ul>
            {/* Button */}
            <button
              onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                width: '100%',
                backgroundColor: '#2558BF',
                color: '#fff',
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Get Started
            </button>
            </div>
          </div>
        </div>
      </EditableSection>
      </div>

      {/* Call Now Section - below pricing cards */}
      <div style={{
        padding: isMobile ? '0 20px 50px' : isTablet ? '0 100px 150px' : '0 200px 150px',
        backgroundColor: '#fff',
      }}>
        <div
          ref={ctaRef}
          style={{
            maxWidth: '100%',
            margin: '0 auto',
            backgroundColor: '#FAFAFA',
            borderRadius: '15px',
            padding: isMobile ? '24px 20px' : '32px 40px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: '20px',
            transform: ctaAnimated ? 'translateY(0)' : 'translateY(60px)',
            opacity: ctaAnimated ? 1 : 0,
            transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 1s ease-out',
          }}
        >
          <div>
            <h3 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 600,
              color: '#000',
              marginBottom: '8px',
            }}>
              {content.ctaTitle}
            </h3>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#666',
              maxWidth: '500px',
              margin: 0,
            }}>
              {content.ctaDescription}
            </p>
          </div>
          <button
            onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              backgroundColor: '#fff',
              color: '#000',
              padding: '12px 32px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {content.ctaButtonText}
          </button>
        </div>
      </div>

      {/* Contact Form Section */}
      <div id="contact-form">
      <EditableSection
        sectionId="contactForm"
        label="Contact Form Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'contactForm'}
        style={{
          padding: isMobile ? '40px 20px' : isTablet ? '60px 100px' : '80px 200px',
          backgroundColor: '#fff',
        }}
      >
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
          gap: isMobile ? '32px' : '120px',
          alignItems: 'center',
        }}>
          {/* Left - Text */}
          <div>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '32px' : isTablet ? '40px' : '49px',
              fontWeight: 700,
              color: '#1D1D1F',
              letterSpacing: '-0.04em',
              lineHeight: '1.2em',
              marginBottom: '20px',
            }}>
              {content.formTitle}
            </h2>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: isMobile ? '16px' : '21px',
              fontWeight: 600,
              color: '#000000',
              letterSpacing: '-0.03em',
              lineHeight: '1.3em',
            }}>
              {content.formDescription}
            </p>
          </div>

          {/* Right - Form */}
          <div style={{
            backgroundColor: '#fff',
            borderRadius: '15px',
            padding: isMobile ? '34px 24px 44px' : '42px 32px 52px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            {/* Form Logo/Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}>
              {content.formLogo ? (
                <img
                  src={content.formLogo.startsWith('http') ? content.formLogo : `${import.meta.env.VITE_API_URL || ''}${content.formLogo}`}
                  alt="Form Logo"
                  style={{
                    width: '70%',
                    height: 'auto',
                    maxHeight: '80px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <img
                  src="https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-partners-logo-0a1a921f0b1e98c8e82c4e6f5b8e0d0f.svg"
                  alt="Shopify Partners"
                  style={{
                    width: '70%',
                    height: 'auto',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>

            {formSubmitted ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#000', marginBottom: '8px' }}>
                  Thank you!
                </h3>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  style={{
                    marginTop: '16px',
                    backgroundColor: 'transparent',
                    color: '#2558BF',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <>
                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
                  .form-input::placeholder {
                    color: #8F8F8F;
                  }
                `}</style>
                <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    placeholder="Your name"
                    className="form-input"
                    style={{
                      width: '100%',
                      height: '47px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: errors.name ? '1px solid #ef4444' : '1px solid #888888',
                      fontSize: '14px',
                      color: '#333',
                      backgroundColor: '#EEEEEE',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.name && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {errors.name.message}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    placeholder="Your email"
                    className="form-input"
                    style={{
                      width: '100%',
                      height: '47px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: errors.email ? '1px solid #ef4444' : '1px solid #888888',
                      fontSize: '14px',
                      color: '#333',
                      backgroundColor: '#EEEEEE',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.email && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {errors.email.message}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <input
                    {...register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Phone must be 10 digits',
                      },
                    })}
                    placeholder="Your contact number"
                    className="form-input"
                    maxLength={10}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    style={{
                      width: '100%',
                      height: '47px',
                      padding: '0 16px',
                      borderRadius: '10px',
                      border: errors.phone ? '1px solid #ef4444' : '1px solid #888888',
                      fontSize: '14px',
                      color: '#333',
                      backgroundColor: '#EEEEEE',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {errors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {errors.phone.message}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{
                      width: '240px',
                      height: '40px',
                      backgroundColor: '#007BFF',
                      color: '#FFFFFF',
                      padding: '0',
                      borderRadius: '8px',
                      border: 'none',
                      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                      fontSize: '16px',
                      fontWeight: 400,
                      lineHeight: '1.2em',
                      cursor: formLoading ? 'not-allowed' : 'pointer',
                      opacity: formLoading ? 0.7 : 1,
                    }}
                  >
                    {formLoading ? 'Submitting...' : content.formButtonText}
                  </button>
                </div>
                <p style={{
                  textAlign: 'center',
                  marginTop: '12px',
                  fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#000',
                  letterSpacing: '-0.02em',
                  lineHeight: '1.2em',
                }}>
                  {content.formResponseText}
                </p>
              </form>
              </>
            )}
          </div>
        </div>
      </EditableSection>
      </div>

      {/* Footer */}
      <EditableSection
        sectionId="footer"
        label="Footer Section"
        isEditorMode={isEditorMode}
        isSelected={selectedSection === 'footer'}
        style={{
          backgroundColor: '#f3f4f6',
          padding: isMobile ? '60px 20px 40px' : '80px 40px 60px',
          textAlign: 'center',
        }}
      >
        {/* Heart Icon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <svg
            width="43.243"
            height="43.243"
            viewBox="0 0 24 24"
            fill="#86868B"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        {/* Thanks for visiting */}
        <h3 style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: isMobile ? '28px' : '40px',
          fontWeight: 700,
          color: '#1D1D1F',
          letterSpacing: '-0.04em',
          lineHeight: '1.2em',
          marginBottom: '40px',
        }}>
          {content.footerText}
        </h3>

        {/* Separator Line */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          height: '1px',
          backgroundColor: '#d1d5db',
          margin: '0 auto 24px',
        }} />

        {/* Copyright */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '14px',
          fontWeight: 500,
          color: '#86868B',
          letterSpacing: '-0.02em',
          lineHeight: '1.2em',
          margin: 0,
        }}>
          {content.copyrightText}
        </p>
      </EditableSection>
    </div>
  );
};

export default LandingPage2;
