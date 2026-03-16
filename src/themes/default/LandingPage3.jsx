import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import useWindowSize from '@/hooks/useWindowSize';
import { pagesAPI, contactsAPI } from '@/services/api';
import EditableSection from '@/components/EditableSection';
import HighlightImg from '@/assets/Highligh.png';

// SVG Icons as components
const CheckmarkIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 4.5L6.5 12.5L2.5 8.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowIcon = ({ color = '#000', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 13L13 1M13 1H1M13 1V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LeftArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(225deg)' }}>
    <path d="M1 13L13 1M13 1H1M13 1V13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const RightArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(45deg)' }}>
    <path d="M1 13L13 1M13 1H1M13 1V13" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#fff" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="2"/>
    <circle cx="18" cy="6" r="1" fill="#fff"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="2" y="9" width="4" height="12" stroke="#fff" strokeWidth="2"/>
    <circle cx="4" cy="4" r="2" stroke="#fff" strokeWidth="2"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const LandingPage3 = () => {
  const { isMobile, isTablet } = useWindowSize();
  const [pageContent, setPageContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCaseStudy, setCurrentCaseStudy] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && currentSlide < portfolioImages.length - 1) setCurrentSlide(s => s + 1);
      if (diff < 0 && currentSlide > 0) setCurrentSlide(s => s - 1);
    }
    setTouchStartX(null);
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
      e.preventDefault();
      if (e.deltaX > 0 && currentSlide < portfolioImages.length - 1) setCurrentSlide(s => s + 1);
      if (e.deltaX < 0 && currentSlide > 0) setCurrentSlide(s => s - 1);
    }
  };

  // Scroll to section helper
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchPageContent();
  }, []);

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
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);

  const fetchPageContent = async () => {
    try {
      const response = await pagesAPI.getOne('landing-page-3');
      if (response.data?.data?.content) {
        setPageContent(response.data.data.content);
      }
    } catch {
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
        subject: `Shopify Store Inquiry from ${data.companyName}`,
        sourcePage: 'Landing Page 3',
        message: `Contact from Landing Page 3\nCompany: ${data.companyName}\nPhone: ${data.phone}\nService: ${data.service}`,
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
    // Header
    logoText: 'GOTI',

    // Hero
    heroTitle: 'Your Shopify Website Design Agency',
    heroSubtitle: 'We specialise in Shopify deign and developement',
    heroDescription: "Let's design, optimise, and launch your shopify store with guaranteed result or you don't pay",
    heroButtonText: 'GET A WEB DEIGN QUOTE',

    // Checkmarks
    checkmark1: '10-Days  Satisfaction Guarantee',
    checkmark2: 'Launch your E-commerce in week',
    checkmark3: '2-3 weeks average delivery',

    // Problem Section
    problemTitle: 'Most Shopify stores are built to look good—not to convert—resulting in high bounce rates and lost revenue.',
    understandWhyTitle: 'Understand Why',
    understandWhyItems: [
      '3 hrs trying to customize a Shopify theme',
      '5 hrs fixing mobile layout issues',
      '4 hrs optimizing product pages for conversions',
      '3 hrs improving page speed',
      '2 hrs installing and configuring apps',
      '4 hrs fixing broken user journeys',
      '+ ∞ hrs wondering why visitors aren\'t converting',
    ],
    understandWhyConclusion: '= Weeks of lost sales',
    betterWayText: "There's a better way 👇",

    // Solution Section
    solutionTitle: 'Design a Shopify store that actually sells.',
    solutionDescription: 'We design high-performance Shopify experiences that turn visitors into customers.\n\nFrom product pages to checkout optimization, we build stores designed to increase conversions, average order value, and customer trust.',

    // Case Studies
    caseStudies: [
      {
        label: 'Case Study 1',
        brand: 'GOTI',
        title: '[From 79k INR/month to 1.5L INR/month]',
        description: 'short description for a particular, describing how we have helped them achieve their goals/ impact their business',
        metrics: [
          { label: 'Metrics 1', value: '$1.34m' },
          { label: 'Metrics 2', value: '$1.34m' },
          { label: 'Metrics 3', value: '1.5L INR' },
        ],
      },
    ],

    // Clients
    clientsTitle: 'Our Shopify Clients',
    clientBrands: ['OSLET', 'AQUA', 'GOTI'],

    // Pricing Section
    pricingTitle: 'Stuck at 7 figures/year?',
    pricingSubtitle: 'Not for long',
    pricingDescription: "You need a design system that's built for performance—one that improves user experience, increases conversions, and helps your brand grow consistently.",

    // Plan 1 (Green card)
    plan1Price: '$XX / MONTH',
    plan1Subtitle: 'Everything you need to scale faster.',
    plan1BusinessTitle: 'If your business',
    plan1Criteria: [
      'Generates $50K+ in monthly revenue',
      'Teams actively investing in marketing or paid ads',
      'Companies looking to improve conversion and scale faster',
    ],
    plan1MeansTitle: 'What this means for you',
    plan1MeansDescription: "You likely have consistent traffic and sales — now it's about unlocking more revenue from the same visitors.",
    plan1Conclusion: "If you're doing $50K+ per month, this plan will help you grow faster.",
    plan1ButtonText: 'GET STARTED',

    // Plan 2 (White card)
    plan2Price: '$XX / MONTH',
    plan2Subtitle: 'Perfect for businesses getting started with growth.',
    plan2BusinessTitle: 'If your business',
    plan2Criteria: [
      'Businesses with under < $20K monthly revenue',
      'Founders running their own marketing',
      'Stores looking to improve conversion fundamentals',
    ],
    plan2MeansTitle: 'What this means for you',
    plan2MeansDescription: "You'll get clear guidance and CRO improvements to help turn more visitors into customers while you grow.",
    plan2Conclusion: "If you're still building traction, this plan is a great place to start.",

    // Contact Form
    contactTitle: 'Have More Question?',
    contactHighlight: 'Book A Call',
    contactDescription: 'eque leo augue id diam. Turpis id maecenas dui aliquam in nunc nunc mauris.',
    formPlaceholder1: 'COMPANY NAME',
    formPlaceholder2: 'CONTACT NUMBER',
    formPlaceholder3: 'WHAT SERVICE YOU ARE LOOKING FOR?',
    submitButtonText: 'SUBMIT',
    whatsappText: "Need instant response? Let's connect on WhatsApp",

    // Sticky CTA
    queueCount: '05',
    queueText: 'Projects sessions in the queue',

    // Footer
    instagramLink: '#',
    facebookLink: '#',
    linkedinLink: '#',
    copyrightText: 'Copyright© 2025 GOTI.DESIGN. All rights reserved.',
    siteUseText: 'Site Use',
    siteUseLink: '#',
  };

  const content = { ...defaultContent, ...pageContent };

  // Helper to check if section is visible
  const isSectionVisible = (sectionId) => {
    const visibilityKey = `${sectionId}Visible`;
    return pageContent[visibilityKey] !== false;
  };

  const shouldRenderSection = (sectionId) => {
    if (isEditorMode) return true;
    return isSectionVisible(sectionId);
  };

  const isSectionHidden = (sectionId) => {
    return !isSectionVisible(sectionId);
  };

  // Helper to ensure array format
  const ensureArray = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Try to parse JSON string
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        // If it's a plain string, split by newlines or return as single-item array
        return value.includes('\n') ? value.split('\n').filter(Boolean) : [value];
      }
    }
    return fallback;
  };

  // Portfolio/Phone images for carousel
  const portfolioImages = ensureArray(content.portfolioImages, [
    '/api/placeholder/254/533',
    '/api/placeholder/300/629',
    '/api/placeholder/254/533',
  ]);

  // Parse case studies - ensure it's an array and normalize the structure
  const rawCaseStudies = ensureArray(content.caseStudies, defaultContent.caseStudies);
  const caseStudies = rawCaseStudies.map((study) => {
    // If the study already has a metrics array, use it
    if (Array.isArray(study.metrics)) {
      return study;
    }
    // Otherwise, convert flat metric fields to metrics array
    const metrics = [];
    if (study.metric1Label || study.metric1Value) {
      metrics.push({ label: study.metric1Label || '', value: study.metric1Value || '' });
    }
    if (study.metric2Label || study.metric2Value) {
      metrics.push({ label: study.metric2Label || '', value: study.metric2Value || '' });
    }
    if (study.metric3Label || study.metric3Value) {
      metrics.push({ label: study.metric3Label || '', value: study.metric3Value || '' });
    }
    return {
      ...study,
      metrics: metrics.length > 0 ? metrics : defaultContent.caseStudies[0].metrics,
    };
  });

  // Parse client brands - ensure it's an array
  const clientBrands = ensureArray(content.clientBrands, defaultContent.clientBrands);

  // Parse client logos - check if images are uploaded
  const clientLogos = ensureArray(content.clientLogos, []);
  const hasClientLogos = clientLogos.length > 0 && clientLogos.some(logo => logo && typeof logo === 'string' && logo.trim() !== '');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fffdf8',
      }}>
        <div style={{ fontSize: '18px', color: '#666' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fffdf8',
      fontFamily: "'Barlow', 'Inter', sans-serif",
      overflowX: 'hidden',
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Gabarito:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .form-input::placeholder {
          color: #000;
          opacity: 1;
        }

        #phone-carousel::-webkit-scrollbar {
          display: none;
        }

        #phone-carousel {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes slideFromRight {
          0% { transform: translateX(100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideFromLeft {
          0% { transform: translateX(-100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        .phone-slide-enter {
          animation: slideFromRight 0.5s ease forwards;
        }

        .phone-slide-exit-left {
          animation: slideFromLeft 0.5s ease forwards;
        }

        .btn-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-hover:hover {
          transform: scale(1.03);
        }

        .btn-hover:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* Header - Lime Green Bar */}
      {shouldRenderSection('header') && (
        <EditableSection
          sectionId="header"
          label="Header"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'header'}
          isHidden={isSectionHidden('header')}
          style={{
            backgroundColor: '#2558BF',
            height: isMobile ? '73px' : '99px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
          }}
        >
          {content.logoImage ? (
            <img
              src={content.logoImage}
              alt={content.logoText || 'Logo'}
              style={{
                height: isMobile ? '50px' : '70px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          ) : (
            <p style={{
              fontFamily: "'Archivo Black', sans-serif",
              fontSize: isMobile ? '34px' : '52.5px',
              fontWeight: 400,
              color: '#fff',
              lineHeight: '42px',
              letterSpacing: '-0.7px',
              margin: 0,
            }}>
              {content.logoText}
            </p>
          )}
        </EditableSection>
      )}

      {/* Hero Section */}
      {shouldRenderSection('hero') && (
        <EditableSection
          sectionId="hero"
          label="Hero Section"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'hero'}
          isHidden={isSectionHidden('hero')}
          style={{
            padding: isMobile ? '66px 20px 40px' : '71px 243px 40px',
            textAlign: 'center',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '16px' : '40px',
            maxWidth: isMobile ? '390px' : '954px',
            margin: '0 auto',
          }}>
            {/* Title with Blue Highlight */}
            <div style={{
              position: 'relative',
              width: isMobile ? '354px' : '900px',
            }}>
              <h1 style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: isMobile ? '28px' : isTablet ? '38px' : '48px',
                fontWeight: 600,
                lineHeight: 1.3,
                color: '#000',
                textAlign: 'center',
                margin: 0,
                position: 'relative',
                zIndex: 1,
              }}>
                Your{' '}
                <span style={{
                  color: '#fff',
                  backgroundColor: '#2558bf',
                  padding: isMobile ? '0 10px' : '0 15px',
                  borderRadius: isMobile ? '7.732px' : '0',
                  display: 'inline-block',
                  lineHeight: isMobile ? '36px' : '1.2',
                  verticalAlign: 'middle',
                  fontSize: isMobile ? '28px' : 'inherit',
                }}>
                  Shopify Website
                </span>
                <br />
                Design Agency
              </h1>
            </div>

            {/* Subtitle and Description */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '16px' : '24px',
              alignItems: 'center',
              width: '100%',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '0' : '5px',
                alignItems: 'center',
                maxWidth: isMobile ? '378px' : '942px',
              }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '16px' : '24px',
                  fontWeight: 400,
                  lineHeight: isMobile ? 'normal' : 1.5,
                  color: '#000',
                  textAlign: 'center',
                  margin: 0,
                }}>
                  {content.heroSubtitle}
                </p>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '16px' : '24px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: '#000',
                  textAlign: 'center',
                  margin: 0,
                }}>
                  {content.heroDescription}
                </p>
              </div>

              {/* Checkmarks */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '320px' : 'auto',
                ...(isMobile ? {} : { flexDirection: 'row', gap: '40px', flexWrap: 'wrap' }),
              }}>
                {[content.checkmark1, content.checkmark2, content.checkmark3].map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    padding: '4px',
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      backgroundColor: '#fff',
                      border: '0.683px solid #000',
                      borderRadius: '3.433px',
                      boxShadow: '1px 1px 0px 0px #150634',
                      padding: '2.73px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isMobile ? '22px' : 'auto',
                      height: isMobile ? '22px' : 'auto',
                    }}>
                      <CheckmarkIcon />
                    </div>
                    <span style={{
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#000',
                      lineHeight: 1.5,
                    }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div style={{
              position: 'relative',
              width: isMobile ? '280px' : '383px',
              marginTop: isMobile ? '8px' : '0',
            }}>
              <button
                className="btn-hover"
                onClick={() => scrollToSection('pricing-section')}
                style={{
                backgroundColor: '#000',
                borderRadius: isMobile ? '630.925px' : '905.76px',
                width: '100%',
                height: isMobile ? '47px' : '68px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'space-between',
                gap: isMobile ? '12px' : '0',
                padding: isMobile ? '0 15px' : '0 14px 0 28px',
                cursor: 'pointer',
              }}>
                <span style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '16px' : '24px',
                  fontWeight: 600,
                  color: '#fff',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}>
                  {content.heroButtonText}
                </span>
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  width: isMobile ? '28px' : '40px',
                  height: isMobile ? '28px' : '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ArrowIcon color="#000" size={isMobile ? 10 : 14} />
                </div>
              </button>
            </div>
          </div>
        </EditableSection>
      )}

      {/* Phone Carousel Section */}
      {shouldRenderSection('phoneCarousel') && (
        <EditableSection
          sectionId="phoneCarousel"
          label="Phone Carousel"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'phoneCarousel'}
          isHidden={isSectionHidden('phoneCarousel')}
          style={{
            padding: isMobile ? '20px 0' : '0 120px 40px',
            overflow: isMobile ? 'hidden' : 'visible',
          }}
        >
          {/* Phone Mockups - Coverflow Carousel */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: isMobile ? 'center' : 'center',
              padding: isMobile ? '20px 0' : '40px 0',
              margin: isMobile ? '0 13px' : '0',
              position: 'relative',
              width: isMobile ? 'calc(100% - 26px)' : '100%',
              minHeight: isMobile ? '310px' : '700px',
            }}
          >
            {isMobile ? (
              /* Mobile: Same coverflow carousel as desktop, touch/swipe enabled */
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'pan-y',
                  userSelect: 'none',
                }}
              >
                {portfolioImages.map((img, index) => {
                  const totalImages = portfolioImages.length;
                  let offset = index - currentSlide;
                  if (offset > totalImages / 2) offset -= totalImages;
                  if (offset < -totalImages / 2) offset += totalImages;

                  const isCenter = offset === 0;
                  const isLeft = offset === -1;
                  const isRight = offset === 1;
                  const isVisible = Math.abs(offset) <= 1;

                  // Sized so side phones fit inside 364px container (390-26px margin)
                  // Added gap between cards
                  const centerWidth = 138;
                  const sideWidth = 100;
                  const centerHeight = 290;
                  const sideHeight = 210;
                  const borderWidth = 4;

                  const translateX = isCenter ? 0 : (isLeft ? -135 : (isRight ? 135 : (offset < 0 ? -200 : 200)));
                  const scale = isCenter ? 1 : (isVisible ? 0.85 : 0.7);
                  const zIndex = isCenter ? 10 : (isVisible ? 5 : 1);
                  const opacity = isCenter ? 1 : (isVisible ? 0.85 : 0);

                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        width: isCenter ? `${centerWidth}px` : `${sideWidth}px`,
                        height: isCenter ? `${centerHeight}px` : `${sideHeight}px`,
                        backgroundColor: '#c4c4c4',
                        borderRadius: '20px',
                        border: `${borderWidth}px solid #000`,
                        boxShadow: `0 0 0 ${borderWidth}px #CCCCCC`,
                        overflow: 'hidden',
                        transform: `translateX(${translateX}px) scale(${scale})`,
                        opacity,
                        zIndex,
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: isVisible ? 'auto' : 'none',
                      }}
                    >
                      {typeof img === 'string' && !img.includes('placeholder') ? (
                        <img
                          src={img}
                          alt={`Portfolio ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop: Coverflow carousel */
              <div
                style={{
                  position: 'relative',
                  width: '700px',
                  height: '650px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {portfolioImages.map((img, index) => {
                  const totalImages = portfolioImages.length;
                  let offset = index - currentSlide;

                  if (offset > totalImages / 2) offset -= totalImages;
                  if (offset < -totalImages / 2) offset += totalImages;

                  const isCenter = offset === 0;
                  const isLeft = offset === -1;
                  const isRight = offset === 1;
                  const isVisible = Math.abs(offset) <= 1;

                  const centerWidth = 300;
                  const sideWidth = 254;
                  const centerHeight = 629;
                  const sideHeight = 533;
                  const borderWidth = 7;

                  const translateX = isCenter ? 0 : (isLeft ? -320 : (isRight ? 320 : (offset < 0 ? -450 : 450)));
                  const scale = isCenter ? 1 : (isVisible ? 0.85 : 0.7);
                  const zIndex = isCenter ? 10 : (isVisible ? 5 : 1);
                  const opacity = isCenter ? 1 : (isVisible ? 0.85 : 0);

                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        width: isCenter ? `${centerWidth}px` : `${sideWidth}px`,
                        height: isCenter ? `${centerHeight}px` : `${sideHeight}px`,
                        backgroundColor: '#c4c4c4',
                        borderRadius: '37.328px',
                        border: `${borderWidth}px solid #000`,
                        boxShadow: `0 0 0 ${borderWidth}px #CCCCCC`,
                        overflow: 'hidden',
                        transform: `translateX(${translateX}px) scale(${scale})`,
                        opacity,
                        zIndex,
                        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: isVisible ? 'auto' : 'none',
                      }}
                    >
                      {typeof img === 'string' && !img.includes('placeholder') ? (
                        <img
                          src={img}
                          alt={`Portfolio ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carousel Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '12px' : '20px',
            marginTop: isMobile ? '20px' : '40px',
            maxWidth: isMobile ? '358px' : '689px',
            margin: isMobile ? '20px auto 0' : '40px auto 0',
            padding: isMobile ? '0 20px' : '0',
          }}>
            {/* Left Arrow */}
            <button
              className="btn-hover"
              onClick={() => {
                if (currentSlide > 0) {
                  setCurrentSlide(currentSlide - 1);
                }
              }}
              disabled={currentSlide === 0}
              style={{
                backgroundColor: currentSlide === 0 ? '#94a3b8' : '#2558bf',
                borderRadius: isMobile ? '9.143px' : '12px',
                width: isMobile ? '32px' : '42px',
                height: isMobile ? '32px' : '42px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                opacity: currentSlide === 0 ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              <LeftArrowIcon />
            </button>

            {/* Progress Bar */}
            <div style={{
              flex: 1,
              height: isMobile ? '6px' : '8px',
              backgroundColor: '#ddd',
              borderRadius: '12px',
              overflow: 'hidden',
              maxWidth: isMobile ? '282px' : '477px',
            }}>
              <div style={{
                width: `${((currentSlide + 1) / portfolioImages.length) * 100}%`,
                height: '100%',
                backgroundColor: '#000',
                borderRadius: '12px',
                transition: 'width 0.5s ease',
              }} />
            </div>

            {/* Right Arrow */}
            <button
              className="btn-hover"
              onClick={() => {
                if (currentSlide < portfolioImages.length - 1) {
                  setCurrentSlide(currentSlide + 1);
                }
              }}
              disabled={currentSlide >= portfolioImages.length - 1}
              style={{
                backgroundColor: currentSlide >= portfolioImages.length - 1 ? '#94a3b8' : '#2558bf',
                borderRadius: isMobile ? '9.143px' : '12px',
                width: isMobile ? '32px' : '42px',
                height: isMobile ? '32px' : '42px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: currentSlide >= portfolioImages.length - 1 ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease, transform 0.2s ease',
                opacity: currentSlide >= portfolioImages.length - 1 ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              <RightArrowIcon />
            </button>
          </div>
        </EditableSection>
      )}

      {/* Problem Section */}
      {shouldRenderSection('problem') && (
        <EditableSection
          sectionId="problem"
          label="Problem Section"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'problem'}
          isHidden={isSectionHidden('problem')}
          style={{
            padding: isMobile ? '40px 20px' : '80px 120px',
            textAlign: 'center',
          }}
        >
          {/* Problem Statement */}
          <p style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: isMobile ? '18px' : '24px',
            fontWeight: 500,
            lineHeight: 1.5,
            color: '#000',
            textAlign: 'center',
            maxWidth: isMobile ? '390px' : '702px',
            margin: '0 auto 40px',
          }}>
            {content.problemTitle}
          </p>

          {/* Understand Why Card */}
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #000',
            borderRadius: '16px',
            boxShadow: '4px 4px 0px 0px #150634',
            padding: isMobile ? '24px 16px' : '24px',
            maxWidth: isMobile ? '390px' : '468px',
            minHeight: isMobile ? '317px' : 'auto',
            margin: '0 auto 40px',
            textAlign: 'center',
          }}>
            <h3 style={{
              fontFamily: "'Gabarito', sans-serif",
              fontSize: isMobile ? '22px' : '24px',
              fontWeight: 600,
              lineHeight: 1.2,
              color: '#000',
              marginBottom: '20px',
            }}>
              {content.understandWhyTitle}
            </h3>
            <div style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 500,
              lineHeight: 1.5,
              color: '#000',
            }}>
              {ensureArray(content.understandWhyItems, defaultContent.understandWhyItems).map((item, index) => (
                <p key={index} style={{ margin: '0 0 4px' }}>{item}</p>
              ))}
              <p style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: '20px',
                fontWeight: 600,
                marginTop: '16px',
              }}>
                {content.understandWhyConclusion}
              </p>
            </div>
          </div>

          {/* Better Way */}
          <p style={{
            fontFamily: "'Gabarito', sans-serif",
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 500,
            lineHeight: 1.2,
            color: '#000',
            margin: 0,
            marginTop: isMobile ? '40px' : '70px',
            marginBottom: isMobile ? '-30px' : '-50px',
          }}>
            There's a <span style={{ position: 'relative', display: 'inline-block' }}>
              {/* Orange oval highlight image */}
              <img
                src={HighlightImg}
                alt=""
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '121px' : '185px',
                  height: isMobile ? '39px' : '39px',
                  objectFit: 'fill',
                  pointerEvents: 'none',
                }}
              />
              <span style={{ position: 'relative' }}>better way</span>
            </span> 👇
          </p>
        </EditableSection>
      )}

      {/* Solution Section */}
      {shouldRenderSection('solution') && (
        <EditableSection
          sectionId="solution"
          label="Solution Section"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'solution'}
          isHidden={isSectionHidden('solution')}
          style={{
            padding: isMobile ? '60px 20px 40px' : '60px 120px',
            textAlign: 'center',
          }}
        >
          <h2 style={{
            fontFamily: isMobile ? "'Gabarito', sans-serif" : "'Poppins', sans-serif",
            fontSize: isMobile ? '22px' : '32px',
            fontWeight: 600,
            lineHeight: isMobile ? 'normal' : 1.2,
            color: '#000',
            marginBottom: isMobile ? '16px' : '24px',
            maxWidth: isMobile ? '358px' : 'none',
            margin: isMobile ? '0 auto 16px' : '0 0 24px 0',
          }}>
            {content.solutionTitle}
          </h2>
          <p style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: isMobile ? '18px' : '24px',
            fontWeight: 500,
            lineHeight: 1.5,
            color: '#000',
            maxWidth: isMobile ? '377px' : '702px',
            margin: '0 auto',
            whiteSpace: 'pre-line',
          }}>
            {content.solutionDescription}
          </p>
        </EditableSection>
      )}

      {/* Case Studies Section */}
      {shouldRenderSection('caseStudies') && (
        <EditableSection
          sectionId="caseStudies"
          label="Case Studies"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'caseStudies'}
          isHidden={isSectionHidden('caseStudies')}
          style={{
            padding: isMobile ? '40px 20px' : '0px 120px 60px',
            marginTop: isMobile ? '40px' : '60px',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '40px' : '32px',
            maxWidth: isMobile ? '388px' : '953px',
            margin: '0 auto',
          }}>
            {caseStudies.map((study, studyIndex) => {
              // On mobile, only show the current case study
              if (isMobile && studyIndex !== currentCaseStudy) return null;

              return (
                <div
                  key={study.id || studyIndex}
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: isMobile ? '388px' : '959px',
                    marginTop: studyIndex === 0 || isMobile ? '0px' : '50px',
                  }}
                >
                  {isMobile ? (
                    /* Mobile Case Study Card Layout - CSS-based with tab */
                    <div style={{
                      position: 'relative',
                      marginTop: '20px',
                    }}>
                      {/* Tab Label - positioned above the card */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '20px',
                        backgroundColor: '#fff',
                        padding: '4px 16px',
                        borderRadius: '8px 8px 0 0',
                        border: '1px solid #000',
                        borderBottom: 'none',
                        zIndex: 2,
                      }}>
                        <span style={{
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#000',
                          whiteSpace: 'nowrap',
                        }}>
                          {study.label || `Case Study ${studyIndex + 1}`}
                        </span>
                      </div>

                      {/* Main Card with border and shadow */}
                      <div style={{
                        backgroundColor: '#fff',
                        border: '1px solid #000',
                        borderRadius: '12px',
                        boxShadow: '4px 4px 0px 0px #150634',
                        padding: '24px 18px',
                        minHeight: '400px',
                      }}>
                        {/* Content */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}>
                          {/* Brand */}
                          <p style={{
                            fontFamily: "'Archivo Black', sans-serif",
                            fontSize: '26px',
                            fontWeight: 400,
                            lineHeight: 'normal',
                            letterSpacing: '-0.68px',
                            color: '#000',
                            margin: 0,
                          }}>
                            {study.brand || 'GOTI'}
                          </p>
                          {/* Title */}
                          <h3 style={{
                            fontFamily: "'Gabarito', sans-serif",
                            fontSize: '24px',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            color: '#000',
                            margin: 0,
                          }}>
                            {study.title}
                          </h3>
                          {/* Description */}
                          <p style={{
                            fontFamily: "'Barlow', sans-serif",
                            fontSize: '14px',
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: '#000',
                            margin: 0,
                          }}>
                            {study.description}
                          </p>
                        </div>

                        {/* Metrics */}
                        <div style={{
                          display: 'flex',
                          gap: '14px',
                          marginTop: '16px',
                          flexWrap: 'nowrap',
                        }}>
                          {ensureArray(study.metrics, defaultContent.caseStudies[0].metrics).map((metric, mIndex) => (
                            <div
                              key={mIndex}
                              style={{
                                backgroundColor: 'rgba(255,138,53,0.1)',
                                border: '1px dashed #ff8a35',
                                borderRadius: '12px',
                                padding: '10px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '68px',
                                flex: 1,
                              }}
                            >
                              <span style={{
                                fontFamily: "'Barlow', sans-serif",
                                fontSize: '13px',
                                fontWeight: 400,
                                color: '#000',
                                lineHeight: 1,
                              }}>
                                {metric.label}
                              </span>
                              <span style={{
                                fontFamily: "'Gabarito', sans-serif",
                                fontSize: '18px',
                                fontWeight: 600,
                                lineHeight: 1.2,
                                color: '#000',
                                marginTop: '4px',
                              }}>
                                {metric.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Image */}
                        <div style={{
                          width: '100%',
                          height: '220px',
                          backgroundColor: '#c4c4c4',
                          border: '0.5px solid #000',
                          borderRadius: '10px',
                          marginTop: '24px',
                          overflow: 'hidden',
                        }}>
                          {study.image && (
                            <img
                              src={study.image}
                              alt={study.brand}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Desktop Case Study Card Layout */
                    <>
                      {/* SVG Container with integrated tab */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 959 463"
                        fill="none"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          overflow: 'visible',
                        }}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          <filter id={`shadow_${studyIndex}`} x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
                            <feDropShadow dx="4" dy="4" stdDeviation="0" floodColor="#150634" floodOpacity="1"/>
                          </filter>
                        </defs>
                        <path
                          d="M1 431.327V66.7221C1 58.0821 1 53.7622 2.6105 50.4496C4.21833 47.1425 6.9162 44.4902 10.2502 42.9389C13.5897 41.3851 17.909 41.4586 26.5477 41.6058H26.5478L61.6564 42.2037C66.0009 42.2777 68.1732 42.3147 69.9676 41.9296C76.0277 40.6291 80.7916 35.9457 82.195 29.9087C82.6106 28.121 82.6106 25.9485 82.6106 21.6033C82.6106 17.3241 82.6106 15.1845 83.0173 13.4152C84.3903 7.44308 89.0537 2.7797 95.0258 1.40675C96.7951 1 98.9347 1 103.214 1H187.066C192.693 1 195.506 1 197.985 1.8324C200.469 2.66649 202.71 4.09778 204.511 6.00052C206.308 7.89941 207.491 10.4518 209.857 15.5567L215.864 28.5157C218.23 33.6206 219.413 36.173 221.21 38.0719C223.012 39.9746 225.253 41.4059 227.736 42.24C230.215 43.0724 233.028 43.0724 238.655 43.0724H928.491C936.999 43.0724 941.253 43.0724 944.537 44.6491C947.815 46.2235 950.46 48.8678 952.034 52.1464C953.611 55.4299 953.611 59.6841 953.611 68.1924V432.643C953.611 441.163 953.611 445.423 952.031 448.709C950.454 451.99 947.805 454.635 944.521 456.207C941.233 457.782 936.973 457.776 928.454 457.763L26.0833 456.447C17.5863 456.434 13.3377 456.428 10.059 454.85C6.78516 453.273 4.14534 450.63 2.57384 447.353C1 444.072 1 439.824 1 431.327Z"
                          fill="white"
                          filter={`url(#shadow_${studyIndex})`}
                          vectorEffect="non-scaling-stroke"
                        />
                        <path
                          d="M187.066 0.5C192.657 0.5 195.57 0.493756 198.145 1.3584C200.706 2.21857 203.017 3.69513 204.874 5.65723C206.741 7.62963 207.961 10.2743 210.312 15.3467L216.317 28.3057C218.698 33.4426 219.845 35.9032 221.573 37.7285C223.318 39.5717 225.489 40.9576 227.896 41.7656C230.278 42.5658 232.993 42.5723 238.655 42.5723H928.49C932.737 42.5723 935.95 42.5716 938.512 42.7705C941.078 42.9699 943.032 43.372 944.753 44.1982C948.134 45.8217 950.861 48.5488 952.484 51.9297C953.311 53.6504 953.713 55.6044 953.912 58.1709C954.111 60.7323 954.11 63.9461 954.11 68.1924V432.644C954.11 436.895 954.111 440.113 953.912 442.678C953.712 445.247 953.309 447.203 952.481 448.925C950.855 452.308 948.123 455.037 944.737 456.658C943.014 457.483 941.057 457.883 938.487 458.079C935.923 458.275 932.705 458.27 928.453 458.264L26.083 456.946C21.8425 456.94 18.6331 456.937 16.0752 456.734C13.5118 456.532 11.5601 456.127 9.8418 455.3C6.4658 453.674 3.74361 450.948 2.12305 447.569C1.29835 445.85 0.897235 443.898 0.698242 441.335C0.499668 438.777 0.5 435.568 0.5 431.327V66.7217C0.5 62.4098 0.49994 59.1468 0.703125 56.5488C0.90673 53.9457 1.31714 51.9675 2.16113 50.2314C3.8192 46.821 6.60094 44.0851 10.0391 42.4854C11.7893 41.671 13.7746 41.295 16.3809 41.1357C18.982 40.9768 22.2452 41.032 26.5566 41.1055L61.665 41.7041C66.0373 41.7786 68.1382 41.8104 69.8623 41.4404C75.7329 40.1807 80.3483 35.6441 81.708 29.7959C82.1073 28.0783 82.1104 25.9767 82.1104 21.6035C82.1104 17.352 82.1076 15.1413 82.5303 13.3027C83.9463 7.14419 88.7554 2.33574 94.9141 0.919922C96.7526 0.497292 98.9625 0.5 103.214 0.5H187.066Z"
                          stroke="black"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      {/* Tab Label - positioned in the tab area */}
                      <span style={{
                        position: 'absolute',
                        top: '2.5%',
                        left: '11%',
                        fontFamily: "'Barlow', sans-serif",
                        fontSize: '18px',
                        fontWeight: 600,
                        color: '#000',
                        whiteSpace: 'nowrap',
                        zIndex: 2,
                      }}>
                        {study.label || `Case Study ${studyIndex + 1}`}
                      </span>

                      {/* Card Content */}
                      <div style={{
                        position: 'relative',
                        padding: '80px 50px 50px',
                        paddingTop: '12%',
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '60px',
                        alignItems: 'center',
                        aspectRatio: '959 / 463',
                      }}>
                        {/* Left Column */}
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '300px',
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Brand */}
                            <p style={{
                              fontFamily: "'Archivo Black', sans-serif",
                              fontSize: '32px',
                              fontWeight: 400,
                              lineHeight: '41px',
                              letterSpacing: '-0.68px',
                              color: '#000',
                              margin: 0,
                            }}>
                              {study.brand || 'GOTI'}
                            </p>
                            {/* Title */}
                            <h3 style={{
                              fontFamily: "'Gabarito', sans-serif",
                              fontSize: '32px',
                              fontWeight: 600,
                              lineHeight: 1.2,
                              color: '#000',
                              margin: 0,
                            }}>
                              {study.title}
                            </h3>
                            {/* Description */}
                            <p style={{
                              fontFamily: "'Barlow', sans-serif",
                              fontSize: '16px',
                              fontWeight: 400,
                              lineHeight: 1.5,
                              color: '#000',
                              margin: 0,
                            }}>
                              {study.description}
                            </p>
                          </div>

                          {/* Metrics */}
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            marginTop: '20px',
                            flexWrap: 'wrap',
                          }}>
                            {ensureArray(study.metrics, defaultContent.caseStudies[0].metrics).map((metric, mIndex) => (
                              <div
                                key={mIndex}
                                style={{
                                  backgroundColor: '#FFF5EB',
                                  borderRadius: '12px',
                                  padding: '12px 20px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  gap: '4px',
                                  minWidth: '100px',
                                }}
                              >
                                <span style={{
                                  fontFamily: "'Barlow', sans-serif",
                                  fontSize: '14px',
                                  fontWeight: 400,
                                  color: '#666',
                                }}>
                                  {metric.label}
                                </span>
                                <span style={{
                                  fontFamily: "'Gabarito', sans-serif",
                                  fontSize: '24px',
                                  fontWeight: 700,
                                  lineHeight: 1.2,
                                  color: '#000',
                                }}>
                                  {metric.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Column - Image */}
                        <div style={{
                          width: '350px',
                          height: '280px',
                          backgroundColor: '#D9D9D9',
                          border: '1px solid #BFBFBF',
                          borderRadius: '24px',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}>
                          {study.image && (
                            <img
                              src={study.image}
                              alt={study.brand}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Carousel Navigation for Case Studies */}
          {isMobile && caseStudies.length > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '24px',
            }}>
              {/* Left Arrow */}
              <button
                className="btn-hover"
                onClick={() => currentCaseStudy > 0 && setCurrentCaseStudy(currentCaseStudy - 1)}
                style={{
                  backgroundColor: currentCaseStudy === 0 ? '#94a3b8' : '#2558bf',
                  borderRadius: '9px',
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentCaseStudy === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentCaseStudy === 0 ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <LeftArrowIcon />
              </button>

              {/* Progress Bar */}
              <div style={{
                flex: 1,
                maxWidth: '282px',
                height: '6px',
                backgroundColor: '#ddd',
                borderRadius: '12px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${((currentCaseStudy + 1) / caseStudies.length) * 100}%`,
                  height: '100%',
                  backgroundColor: '#000',
                  borderRadius: '12px',
                  transition: 'width 0.3s ease',
                }} />
              </div>

              {/* Right Arrow */}
              <button
                className="btn-hover"
                onClick={() => currentCaseStudy < caseStudies.length - 1 && setCurrentCaseStudy(currentCaseStudy + 1)}
                style={{
                  backgroundColor: currentCaseStudy >= caseStudies.length - 1 ? '#94a3b8' : '#2558bf',
                  borderRadius: '9px',
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentCaseStudy >= caseStudies.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentCaseStudy >= caseStudies.length - 1 ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                <RightArrowIcon />
              </button>
            </div>
          )}
        </EditableSection>
      )}

      {/* Clients Marquee Section */}
      {shouldRenderSection('clients') && (
        <EditableSection
          sectionId="clients"
          label="Clients Section"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'clients'}
          isHidden={isSectionHidden('clients')}
          style={{
            padding: isMobile ? '40px 0' : '80px 0',
          }}
        >
          <h2 style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: isMobile ? '20px' : '32px',
            fontWeight: 500,
            lineHeight: 1.5,
            color: '#000',
            textAlign: 'center',
            marginBottom: isMobile ? '24px' : '40px',
          }}>
            {content.clientsTitle}
          </h2>

          {/* Marquee Rows */}
          {[0, 1].map((rowIndex) => {
            const items = hasClientLogos ? clientLogos : clientBrands;
            const repeatedItems = [...items, ...items, ...items, ...items];

            return (
              <div
                key={rowIndex}
                style={{
                  overflow: 'hidden',
                  marginBottom: isMobile ? '12px' : '20px',
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '12px' : '20px',
                  animation: `marquee ${20 + rowIndex * 5}s linear infinite`,
                  width: 'fit-content',
                  paddingLeft: rowIndex === 0 ? (isMobile ? '44px' : '98px') : '0',
                }}>
                  {repeatedItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: isMobile ? '7.133px' : '16px',
                        width: isMobile ? '87.383px' : '196px',
                        height: isMobile ? '42.8px' : '96px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        padding: isMobile ? '4.458px' : '10px',
                      }}
                    >
                      {hasClientLogos ? (
                        <img
                          src={item.startsWith('http') ? item : `${import.meta.env.VITE_API_URL || ''}${item}`}
                          alt={`Client logo ${index + 1}`}
                          style={{
                            maxWidth: '80%',
                            maxHeight: '80%',
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <span style={{
                          fontFamily: "'Archivo Black', sans-serif",
                          fontSize: isMobile ? '14px' : '32px',
                          fontWeight: 400,
                          lineHeight: isMobile ? '18.332px' : '41px',
                          letterSpacing: isMobile ? '-0.3034px' : '-0.68px',
                          color: '#000',
                        }}>
                          {item}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </EditableSection>
      )}

      {/* Pricing Section */}
      {shouldRenderSection('pricing') && (
        <EditableSection
          sectionId="pricing"
          label="Pricing Section"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'pricing'}
          isHidden={isSectionHidden('pricing')}
          id="pricing-section"
          style={{
            padding: isMobile ? '40px 20px' : '100px 120px',
            position: 'relative',
          }}
        >
          {/* Purple gradient blob (decorative) */}
          <div style={{
            position: 'absolute',
            right: isMobile ? '-50px' : '200px',
            top: '150px',
            width: '393px',
            height: '870px',
            background: 'radial-gradient(ellipse at center, rgba(180, 130, 255, 0.45) 0%, rgba(200, 150, 255, 0.3) 40%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          {/* Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            marginBottom: isMobile ? '24px' : '100px',
            maxWidth: isMobile ? '358px' : '1200px',
            margin: isMobile ? '0 auto 24px' : '0 auto 60px',
            gap: isMobile ? '13px' : '0',
          }}>
            <div style={{ maxWidth: isMobile ? '358px' : '488px' }}>
              {/* Blue highlight behind title */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  backgroundColor: '#2558bf',
                  height: isMobile ? '29px' : '51px',
                  top: isMobile ? '2.2px' : 0,
                  left: 0,
                  width: isMobile ? '100%' : '100%',
                  borderRadius: isMobile ? '7.732px' : 0,
                  zIndex: 0,
                }} />
                <h2 style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '28px' : '46px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: '#000',
                  margin: 0,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <span style={{ color: '#fff' }}>{content.pricingTitle}</span>
                  <br />
                  {content.pricingSubtitle}
                </h2>
              </div>
            </div>
            <p style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: isMobile ? '14px' : '18px',
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#000',
              maxWidth: isMobile ? '358px' : '541px',
              margin: 0,
            }}>
              {content.pricingDescription}
            </p>
          </div>

          {/* Pricing Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '32px' : '60px',
            maxWidth: isMobile ? '372px' : '1200px',
            margin: '0 auto',
            alignItems: isMobile ? 'center' : 'flex-start',
            ...(isMobile ? {} : { flexDirection: 'row' }),
          }}>
            {/* Plan 1 - Green Card */}
            <div style={{
              backgroundColor: 'rgba(225, 255, 160, 0.75)',
              border: isMobile ? '2px solid #000' : '2.67px solid #000',
              borderRadius: isMobile ? '16px' : '21px',
              boxShadow: isMobile ? '4px 4px 0px 0px #150634' : '5.34px 5.34px 0px 0px #150634',
              padding: isMobile ? '20px 18px' : '32px',
              width: isMobile ? '100%' : '622px',
              maxWidth: isMobile ? '358px' : 'none',
              minHeight: isMobile ? 'auto' : '838px',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Price Header */}
              <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <p style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '16px' : '21px',
                  fontWeight: 700,
                  color: '#000',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  Starts from <span style={{ fontSize: isMobile ? '24px' : '32px' }}>{content.plan1Price}</span>
                </p>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '13px' : '16px',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: '#000',
                  margin: '8px 0 0',
                }}>
                  {content.plan1Subtitle}
                </p>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                backgroundColor: '#000',
                margin: isMobile ? '0 0 16px' : '0 0 24px',
              }} />

              {/* If your business */}
              <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '18px' : '27px',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: '#000',
                  margin: isMobile ? '0 0 12px' : '0 0 16px',
                }}>
                  {content.plan1BusinessTitle}
                </p>
                <div style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '14px' : '23px',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#000',
                  paddingLeft: isMobile ? '8px' : '12px',
                }}>
                  {ensureArray(content.plan1Criteria, defaultContent.plan1Criteria).map((item, index) => (
                    <p key={index} style={{ margin: '0 0 4px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#000', flexShrink: 0, fontWeight: 700, fontSize: isMobile ? '14px' : '20px' }}>✓</span>
                      <span>
                        {typeof item === 'string' && (item.includes('$50K+') || item.includes('marketing') || item.includes('improve'))
                          ? <><span>{item.split(/(\$50K\+|marketing or paid ads|improve conversion and scale faster)/)[0]}</span>
                             <strong>{item.match(/(\$50K\+|marketing or paid ads|improve conversion and scale faster)/)?.[0]}</strong>
                             <span>{item.split(/(\$50K\+|marketing or paid ads|improve conversion and scale faster)/)[2] || ''}</span></>
                          : item}
                      </span>
                    </p>
                  ))}
                </div>
              </div>

              {/* What this means */}
              <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '16px' : '24px',
                  fontWeight: 600,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  color: '#000',
                  margin: isMobile ? '0 0 12px' : '0 0 20px',
                }}>
                  {content.plan1MeansTitle}
                </p>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '14px' : '23px',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#000',
                  margin: 0,
                }}>
                  {content.plan1MeansDescription}
                </p>
              </div>

              {/* Conclusion */}
              <p style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: isMobile ? '14px' : '21px',
                fontWeight: 700,
                lineHeight: 1.6,
                color: '#000',
                textAlign: 'center',
                margin: isMobile ? '0 0 20px' : '0 0 32px',
              }}>
                {content.plan1Conclusion}
              </p>

              {/* CTA Button */}
              <button
                className="btn-hover"
                onClick={() => scrollToSection('contact-section')}
                style={{
                backgroundColor: '#000',
                borderRadius: '1457.664px',
                padding: isMobile ? '14px 28px' : '23.32px 40.81px',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'center',
                marginTop: isMobile ? '10px' : '20px',
              }}>
                <span style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '18px' : '29.153px',
                  fontWeight: 600,
                  lineHeight: '100%',
                  color: '#fff',
                  textTransform: 'uppercase',
                }}>
                  {content.plan1ButtonText}
                </span>
              </button>
            </div>

            {/* Plan 2 - White Card */}
            <div style={{
              backgroundColor: '#fff',
              border: isMobile ? '2px solid #000' : '2px solid #000',
              borderRadius: isMobile ? '16px' : '16px',
              boxShadow: isMobile ? '4px 4px 0px 0px #150634' : '4px 4px 0px 0px #150634',
              padding: isMobile ? '18px 16px' : '24px',
              width: isMobile ? '100%' : '466px',
              maxWidth: isMobile ? '310px' : 'none',
              minHeight: isMobile ? 'auto' : '500px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 1,
              marginTop: isMobile ? '0' : '180px',
              marginLeft: isMobile ? 'auto' : '-40px',
              marginRight: isMobile ? 'auto' : '0',
            }}>
              {/* Price Header */}
              <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                <p style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 700,
                  color: '#000',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  Starts from <span style={{ fontSize: isMobile ? '20px' : '24px' }}>{content.plan2Price}</span>
                </p>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '12px' : '12px',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: '#000',
                  margin: '6px 0 0',
                }}>
                  {content.plan2Subtitle}
                </p>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                backgroundColor: '#000',
                margin: isMobile ? '0 0 16px' : '0 0 24px',
              }} />

              {/* If your business */}
              <div style={{ marginBottom: isMobile ? '20px' : '31px' }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '16px' : '20px',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: '#000',
                  margin: isMobile ? '0 0 10px' : '0 0 12px',
                }}>
                  {content.plan2BusinessTitle}
                </p>
                <div style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '13px' : '17.5px',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#000',
                  paddingLeft: isMobile ? '6px' : '9px',
                }}>
                  {ensureArray(content.plan2Criteria, defaultContent.plan2Criteria).map((item, index) => (
                    <p key={index} style={{ margin: '0 0 4px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#000', flexShrink: 0, fontWeight: 700, fontSize: isMobile ? '13px' : '18px' }}>✓</span>
                      <span>
                        {typeof item === 'string' && (item.includes('$20K') || item.includes('own marketing') || item.includes('improve'))
                          ? <><span>{item.split(/(< \$20K monthly revenue|own marketing|improve conversion fundamentals)/)[0]}</span>
                             <strong>{item.match(/(< \$20K monthly revenue|own marketing|improve conversion fundamentals)/)?.[0]}</strong>
                             <span>{item.split(/(< \$20K monthly revenue|own marketing|improve conversion fundamentals)/)[2] || ''}</span></>
                          : item}
                      </span>
                    </p>
                  ))}
                </div>
              </div>

              {/* What this means */}
              <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: 600,
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                  color: '#000',
                  margin: isMobile ? '0 0 10px' : '0 0 15px',
                }}>
                  {content.plan2MeansTitle}
                </p>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '13px' : '17.5px',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color: '#000',
                  margin: 0,
                }}>
                  {content.plan2MeansDescription}
                </p>
              </div>

              {/* Conclusion */}
              <p style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: isMobile ? '13px' : '16px',
                fontWeight: 700,
                lineHeight: 1.6,
                color: '#000',
                textAlign: 'center',
                margin: 0,
              }}>
                {content.plan2Conclusion}
              </p>
            </div>
          </div>
        </EditableSection>
      )}

      {/* Contact Form Section */}
      {shouldRenderSection('contact') && (
        <EditableSection
          sectionId="contact"
          label="Contact Form"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'contact'}
          isHidden={isSectionHidden('contact')}
          id="contact-section"
          style={{
            padding: isMobile ? '40px 20px' : '100px 120px',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '24px' : '60px',
            maxWidth: isMobile ? '390px' : '1200px',
            margin: '0 auto',
            alignItems: 'flex-start',
            ...(isMobile ? {} : { flexDirection: 'row' }),
          }}>
            {/* Left - Title & Description */}
            <div style={{ flex: 1, maxWidth: isMobile ? '354px' : '610px' }}>
              {/* Title with circle highlight */}
              <div style={{ marginBottom: isMobile ? '8px' : '17px' }}>
                <h2 style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '28px' : '46px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: '#000',
                  margin: 0,
                }}>
                  {content.contactTitle}
                </h2>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {/* Orange highlight SVG around "Book A Call" */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%) rotate(-3.61deg) skewX(2.67deg)',
                      width: isMobile ? '178.569px' : '256px',
                      height: isMobile ? '43.715px' : '59px',
                      pointerEvents: 'none',
                    }}
                    viewBox="0 0 262 60"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <ellipse cx="131" cy="30" rx="126" ry="26" stroke="#FF8A35" strokeWidth={isMobile ? '3' : '4.198'} fill="none" />
                  </svg>
                  <span style={{
                    fontFamily: "'Gabarito', sans-serif",
                    fontSize: isMobile ? '28px' : '46px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: '#000',
                    position: 'relative',
                  }}>
                    {content.contactHighlight}
                  </span>
                </div>
              </div>
              <p style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: isMobile ? '14px' : '18px',
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#000',
                maxWidth: isMobile ? '308px' : '379px',
                margin: 0,
              }}>
                {content.contactDescription}
              </p>
            </div>

            {/* Right - Form */}
            <div style={{ width: isMobile ? '100%' : '585px', maxWidth: isMobile ? '354px' : 'none' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}>
                {formSubmitted ? (
                  <div style={{
                    backgroundColor: '#fff',
                    border: '1px solid #000',
                    borderRadius: '16px',
                    boxShadow: '4px 4px 0px 0px #150634',
                    padding: '48px 24px',
                    textAlign: 'center',
                  }}>
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
                    <h3 style={{
                      fontFamily: "'Gabarito', sans-serif",
                      fontSize: '24px',
                      fontWeight: 600,
                      color: '#000',
                      marginBottom: '8px',
                    }}>
                      Thank you!
                    </h3>
                    <p style={{
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: '16px',
                      color: '#666',
                    }}>
                      We'll get back to you within 24 hours.
                    </p>
                    <button
                      className="btn-hover"
                      onClick={() => setFormSubmitted(false)}
                      style={{
                        marginTop: '16px',
                        backgroundColor: 'transparent',
                        color: '#2558bf',
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
                  <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Company Name */}
                    <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                      <div style={{
                        backgroundColor: '#fff',
                        border: errors.companyName ? '2px solid #ef4444' : '1px solid #000',
                        borderRadius: isMobile ? '12px' : '16px',
                        boxShadow: isMobile ? '3px 3px 0px 0px #150634' : '4px 4px 0px 0px #150634',
                        padding: isMobile ? '10px 12px' : '24px',
                        height: isMobile ? '50px' : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <input
                          {...register('companyName', { required: 'Company name is required' })}
                          placeholder={content.formPlaceholder1}
                          className="form-input"
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontFamily: "'Barlow', sans-serif",
                            fontSize: isMobile ? '13px' : '20px',
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: '#000',
                            backgroundColor: 'transparent',
                          }}
                        />
                      </div>
                      {errors.companyName && (
                        <p style={{
                          color: '#ef4444',
                          fontSize: '14px',
                          fontFamily: "'Barlow', sans-serif",
                          marginTop: '8px',
                          marginLeft: '12px',
                        }}>
                          {errors.companyName.message}
                        </p>
                      )}
                    </div>

                    {/* Contact Number */}
                    <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
                      <div style={{
                        backgroundColor: '#fff',
                        border: errors.phone ? '2px solid #ef4444' : '1px solid #000',
                        borderRadius: isMobile ? '12px' : '16px',
                        boxShadow: isMobile ? '3px 3px 0px 0px #150634' : '4px 4px 0px 0px #150634',
                        padding: isMobile ? '10px 12px' : '24px',
                        height: isMobile ? '50px' : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <input
                          {...register('phone', {
                            required: 'Contact number is required',
                            pattern: {
                              value: /^[0-9]{10}$/,
                              message: 'Please enter a valid 10-digit mobile number',
                            },
                          })}
                          placeholder={content.formPlaceholder2}
                          className="form-input"
                          maxLength={10}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) e.preventDefault();
                          }}
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontFamily: "'Barlow', sans-serif",
                            fontSize: isMobile ? '13px' : '20px',
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: '#000',
                            backgroundColor: 'transparent',
                          }}
                        />
                      </div>
                      {errors.phone && (
                        <p style={{
                          color: '#ef4444',
                          fontSize: '14px',
                          fontFamily: "'Barlow', sans-serif",
                          marginTop: '8px',
                          marginLeft: '12px',
                        }}>
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    {/* Service */}
                    <div style={{ marginBottom: isMobile ? '24px' : '37px' }}>
                      <div style={{
                        backgroundColor: '#fff',
                        border: errors.service ? '2px solid #ef4444' : '1px solid #000',
                        borderRadius: isMobile ? '12px' : '16px',
                        boxShadow: isMobile ? '3px 3px 0px 0px #150634' : '4px 4px 0px 0px #150634',
                        padding: isMobile ? '10px 12px' : '24px',
                        height: isMobile ? '50px' : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        <input
                          {...register('service', { required: 'Please tell us what service you need' })}
                          placeholder={content.formPlaceholder3}
                          className="form-input"
                          style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            fontFamily: "'Barlow', sans-serif",
                            fontSize: isMobile ? '13px' : '20px',
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: '#000',
                            backgroundColor: 'transparent',
                          }}
                        />
                      </div>
                      {errors.service && (
                        <p style={{
                          color: '#ef4444',
                          fontSize: '14px',
                          fontFamily: "'Barlow', sans-serif",
                          marginTop: '8px',
                          marginLeft: '12px',
                        }}>
                          {errors.service.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        className="btn-hover"
                        type="submit"
                        disabled={formLoading}
                        style={{
                          display: 'flex',
                          width: isMobile ? '134px' : '200px',
                          height: isMobile ? '42px' : '56px',
                          padding: isMobile ? '16px 24px' : '22px 31px',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '10px',
                          flexShrink: 0,
                          border: '1px solid #000',
                          borderRadius: '905.76px',
                          backgroundColor: 'transparent',
                          cursor: formLoading ? 'not-allowed' : 'pointer',
                          opacity: formLoading ? 0.7 : 1,
                        }}
                      >
                        <span style={{
                          fontFamily: "'Gabarito', sans-serif",
                          fontSize: isMobile ? '16px' : '22px',
                          fontWeight: 600,
                          lineHeight: '100%',
                          color: '#000',
                          textTransform: 'uppercase',
                        }}>
                          {formLoading ? 'Submitting...' : content.submitButtonText}
                        </span>
                      </button>
                    </div>
                  </form>
                )}

                {/* WhatsApp Link */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '6px' : '12px',
                  marginTop: '12px',
                }}>
                  <div style={{ width: isMobile ? '16px' : '28px', height: isMobile ? '16px' : '28px', flexShrink: 0 }}>
                    <ZapIcon />
                  </div>
                  <p style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '13px' : '20px',
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: '#000',
                    margin: 0,
                  }}>
                    {content.whatsappText.split('WhatsApp')[0]}
                    <span style={{ textDecoration: 'underline', fontWeight: 600 }}>WhatsApp</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </EditableSection>
      )}

      {/* Sticky CTA Bar */}
      {shouldRenderSection('stickyCta') && (
        <EditableSection
          sectionId="stickyCta"
          label="Sticky CTA"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'stickyCta'}
          isHidden={isSectionHidden('stickyCta')}
          style={{
            backgroundColor: '#fff',
            borderTop: '1px solid #000',
            padding: isMobile ? '20px' : '20px 80px',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '20px' : '20px',
            maxWidth: isMobile ? '386px' : 'none',
            margin: '0 auto',
          }}>
            {/* Queue Counter */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', gap: isMobile ? '2.3px' : '3.33px' }}>
                {content.queueCount.split('').map((digit, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#000',
                      borderRadius: isMobile ? '2.3px' : '3.33px',
                      width: isMobile ? '15.183px' : '22px',
                      height: isMobile ? '20.704px' : '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{
                      fontFamily: "'Gabarito', sans-serif",
                      fontSize: isMobile ? '16px' : '28px',
                      fontWeight: 600,
                      color: '#fff',
                      lineHeight: 1.2,
                    }}>
                      {digit}
                    </span>
                  </div>
                ))}
              </div>
              <span style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: isMobile ? '16px' : '18px',
                fontWeight: 600,
                color: '#000',
                lineHeight: 1.5,
              }}>
                {content.queueText}
              </span>
            </div>

            {/* WhatsApp CTA Button */}
            <button
              className="btn-hover"
              onClick={() => scrollToSection('pricing-section')}
              style={{
              backgroundColor: '#000',
              borderRadius: isMobile ? '834.813px' : '906px',
              height: isMobile ? '62.674px' : '68px',
              width: isMobile ? '353px' : 'auto',
              padding: isMobile ? '0 14px' : '0 14px 0 31px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '11px' : '20px',
              cursor: 'pointer',
            }}>
              <span style={{
                fontFamily: "'Gabarito', sans-serif",
                fontSize: isMobile ? '18.433px' : '22px',
                fontWeight: 600,
                color: '#fff',
                textTransform: 'uppercase',
              }}>
                {content.heroButtonText}
              </span>
              <div style={{
                backgroundColor: '#63dd77',
                borderRadius: '50%',
                width: isMobile ? '30.415px' : '46px',
                height: isMobile ? '30.415px' : '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WhatsAppIcon />
              </div>
            </button>
          </div>
        </EditableSection>
      )}

      {/* Footer */}
      {shouldRenderSection('footer') && (
        <EditableSection
          sectionId="footer"
          label="Footer"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'footer'}
          isHidden={isSectionHidden('footer')}
          style={{
            backgroundColor: '#101827',
            padding: isMobile ? '12px 20px' : '12px 551px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: isMobile ? '87px' : '155px',
          }}
        >
          {/* Social Icons */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '16.428px' : '23px',
            marginBottom: isMobile ? '16px' : '20px',
          }}>
            <a href={content.instagramLink || '#'} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ width: isMobile ? '17.048px' : '24px', height: isMobile ? '17.048px' : '24px' }}><InstagramIcon /></a>
            <a href={content.facebookLink || '#'} target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ width: isMobile ? '17.048px' : '24px', height: isMobile ? '17.048px' : '24px' }}><FacebookIcon /></a>
            <a href={content.linkedinLink || '#'} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" style={{ width: isMobile ? '17.048px' : '24px', height: isMobile ? '17.048px' : '24px' }}><LinkedInIcon /></a>
          </div>

          {/* Copyright */}
          <p style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: isMobile ? '12px' : '16px',
            fontWeight: 400,
            color: '#fff',
            margin: 0,
            textAlign: 'center',
          }}>
            {content.copyrightText}{' '}
            <a href={content.siteUseLink || '#'} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
              {content.siteUseText}
            </a>
          </p>
        </EditableSection>
      )}
    </div>
  );
};

export default LandingPage3;
