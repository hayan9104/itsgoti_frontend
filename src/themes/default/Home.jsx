import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pagesAPI, worksAPI, clientLogosAPI, reviewsAPI } from '@/services/api';
import useWindowSize from '@/hooks/useWindowSize';
import useSmoothScroll from '@/hooks/useSmoothScroll';
import useScrollAnimations from '@/hooks/useScrollAnimations';
import vectorIcon from '@/assets/Vector.png';
import EditableSection from '@/components/EditableSection';
import heroDecor1 from '@/assets/Group 37369.png';
import heroDecor2 from '@/assets/Group 37368.png';
import rightArrowIcon from '@/assets/arrow-right white.png';
import quoteIcon from '@/assets/Screenshot 2026-02-17 185830.png';
import arrowLeft from '@/assets/arrow-left.png';
import arrowRight from '@/assets/arrow-right.png';
import servicePatternGreen from '@/assets/service-pattern-green.svg';

// Blue pattern as data URL (arrows positioned in bottom-right corner)
const servicePatternBlue = `data:image/svg+xml,${encodeURIComponent(`<svg width="543" height="416" viewBox="0 0 543 416" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="543" height="416" rx="24" fill="black"/>
<path d="M296.439 442.563L307.092 428.128L420.35 511.713L567.714 312.035L454.456 228.45L465.109 214.014L705.687 391.563L695.034 405.998L582.149 322.688L434.785 522.366L547.67 605.676L537.016 620.111L296.439 442.563Z" fill="#336BB7"/>
<path d="M410.295 491.979L312.975 420.156L323.629 405.721L406.514 466.891L517.865 316.011L434.98 254.841L445.633 240.405L542.953 312.228L410.295 491.979Z" fill="#F5BD33"/>
<path d="M335.627 389.463L403.053 439.224L493.347 316.875L425.921 267.115L415.268 281.55L468.259 320.658L399.271 414.136L346.28 375.028L335.627 389.463Z" fill="#336BB7"/>
<path d="M392.513 390.434L355.221 362.913L365.875 348.477L388.732 365.346L418.531 324.968L395.674 308.1L406.327 293.664L443.619 321.186L392.513 390.434Z" fill="#F5BD33"/>
<path d="M589.264 346.406L686.211 417.953L675.557 432.389L593.045 371.494L481.695 522.374L564.206 583.269L553.553 597.704L456.607 526.157L589.264 346.406Z" fill="#F5BD33"/>
<path d="M666.499 444.663L599.447 395.178L509.153 517.527L576.205 567.011L586.858 552.576L534.241 513.744L603.228 420.266L655.846 459.098L666.499 444.663Z" fill="#336BB7"/>
</svg>`)}`;

import { gsap, ScrollTrigger } from '@/lib/gsap';

// Helper to get full image URL
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
};

const Home = () => {
  const { isMobile, isTablet } = useWindowSize();
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';

  // Smooth scrolling and scroll animations (desktop only)
  useSmoothScroll(!isMobile);
  useScrollAnimations(!isMobile);
  const [selectedSection, setSelectedSection] = useState(null);
  const [expandedAccordion, setExpandedAccordion] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [projectSliding, setProjectSliding] = useState(false);
  const [works, setWorks] = useState([]);
  const sliderRef = useRef(null); // Ref for GSAP project slider animation
  const servicesSliderRef = useRef(null); // Ref for GSAP services slider animation
  const [lp2Content, setLp2Content] = useState({}); // Landing Page 2 content for client logos
  const [centralizedClientLogos, setCentralizedClientLogos] = useState([]); // Centralized client logos from API

  // Refs for GSAP animation
  const heroSectionRef = useRef(null);
  const heroImageRef = useRef(null);
  const animatedImageRef = useRef(null);
  const targetSectionRef = useRef(null);
  const animationRef = useRef(null);

  // Page content from CMS
  const [pageContent, setPageContent] = useState({
    // Hero Section
    heroImage: '',
    heroImageMobile: '',
    heroDescription: 'We are UX/UI agency helping ambitious companies and visionary entrepreneurs bring the next design revolution.',
    heroButton1Text: 'Schedule Call',
    heroButton2Text: 'Our Work',
    heroInstantText: 'Get instant response',
    // Partner Brands Section
    partnerTitle: 'Our partner brands have built their tribe and strong presence in the market',
    partnerLogos: [],
    // Experience Section
    experienceTitle1: "You've",
    experienceTitle2: 'already experienced it.',
    experienceTitle3: 'You',
    experienceTitle4: "just didn't notice.",
    experienceDescription: 'We are UX/UI agency helping ambitious companies and visionary entrepreneurs bring the next design revolution.',
    // Projects Section
    projectsSectionTitle: 'Featured Projects',
    // Want To See More
    wantMoreTitle: 'Want To See More?',
    wantMoreButtonText: 'View All Case Studies',
    // Real Numbers Section
    realNumbersTitle: 'Real Numbers.',
    realNumbersTitleNormal: 'Real Impacts',
    stat1Value: '$280,366',
    stat1Label: 'Total Revenue Generated by our clients',
    stat2Value: '261+',
    stat2Label: 'Stores Launched and counting',
    stat3Value: '5.8%',
    stat3Label: 'Average Conversion Rate vs 2.5% industry avg',
    stat4Value: '4.8/5',
    stat4Label: 'Client Satisfaction from 200+ reviews',
    stat5Value: '1,247+',
    stat5Label: 'Design revisions survived',
    stat5Image: '',
    // Services Section
    servicesTitle: 'Turning',
    servicesTitleNormal: 'Brand, Product, and Tech Into One Experience',
    service1Title: 'Research & Strategy',
    service1Description: 'Data and Insights are backbone of building successful products. We ensure laying a perspective that balances business objectives and customer expectations.',
    service1Image: '',
    service2Title: 'Development',
    service2Description: 'Data and Insights are backbone of building successful products. We ensure laying a perspective that balances business objectives and customer expectations.',
    service2Image: '',
    service3Title: 'Designing',
    service3Description: 'Data and Insights are backbone of building successful products. We ensure laying a perspective that balances business objectives and customer expectations.',
    service3Image: '',
    // CTA Button (mid page)
    ctaMidButtonText: 'Schedule Call',
    ctaMidInstantText: 'Get instant response',
    // Brands Section
    brandsTitle: "Brands don't",
    brandsTitleItalic: 'grow',
    brandsTitleEnd: 'by accident.',
    brandsDescription: 'Most get lost in the noise. We combine strategy, design, and clarity to turn ideas into brands people choose — and remember.',
    accordion1Title: 'See What Others Miss',
    accordion1Items: 'UX audit,Data Analysis,Marketing and Research,Information Architecture',
    accordion2Title: 'Shape What Matters',
    accordion2Items: '',
    accordion3Title: 'Craft What Converts',
    accordion3Items: '',
    accordion4Title: 'Scale What Works',
    accordion4Items: '',
    // CTA Section (bottom)
    ctaHeading: 'Your search for agency ends here...',
    ctaDescription1: 'We combine strategy, design, and performance to create',
    ctaDescription2: 'experiences that convert.',
    ctaDescription3: "Let's build something that moves the needle.",
    ctaButtonText: 'Schedule Call',
    ctaInstantText: 'Get instant response',
    // FAQ Section
    faqTitle: 'Frequently',
    faqTitleNormal: 'asked question',
    faq1Question: 'Lorem ipsum dolor sit amet consectetur?',
    faq1Answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    faq2Question: 'Lorem ipsum dolor sit amet consectetur?',
    faq2Answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    faq3Question: 'Lorem ipsum dolor sit amet consectetur?',
    faq3Answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    faq4Question: 'Lorem ipsum dolor sit amet consectetur?',
    faq4Answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    faq5Question: 'Lorem ipsum dolor sit amet consectetur?',
    faq5Answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    faqContactText: "Any more questions, we'll be happy to answer.",
    faqContactLink: 'CONTACT US',
    // Section Visibility (default all visible)
    heroVisible: true,
    partnersVisible: true,
    experienceVisible: true,
    projectsVisible: true,
    wantMoreVisible: true,
    realNumbersVisible: true,
    servicesVisible: true,
    brandsVisible: true,
    ctaVisible: true,
    faqVisible: true,
  });

  // Helper to check if section is visible
  const isSectionVisible = (sectionId) => {
    const visibilityKey = `${sectionId}Visible`;
    return pageContent[visibilityKey] !== false;
  };

  // Helper to check if section should be rendered (always render in editor mode)
  const shouldRenderSection = (sectionId) => {
    if (isEditorMode) return true; // Always render in editor mode (will show blurred if hidden)
    return isSectionVisible(sectionId);
  };

  // Helper to check if section is hidden (for blur effect)
  const isSectionHidden = (sectionId) => {
    return !isSectionVisible(sectionId);
  };

  // Testimonial heading from About page, content from Landing page
  const [testimonialHeading, setTestimonialHeading] = useState({
    clientLabelItalic: 'Look',
    clientLabelNormal: 'what our client said..',
  });

  // Review settings from centralized API
  const [reviewSettings, setReviewSettings] = useState({
    sectionTitle: '*Look* what our client said..',
    showHeadingOnPages: ['home', 'about', 'landing', 'landing-page-2', 'landing-page-3'],
  });

  // Helper to render title with *italic* syntax
  const renderTitleWithItalics = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} style={{ fontFamily: "'Plus Jakarta Sans-SemiBoldItalic', 'Plus Jakarta Sans', sans-serif", fontStyle: 'italic', marginRight: '0.25em' }}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

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

  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  useEffect(() => {
    fetchPageContent();
    fetchTestimonialData();
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
    return () => window.removeEventListener('message', handleMessage);
  }, [isEditorMode]);


  const fetchPageContent = async () => {
    try {
      // Fetch Home content, LP2 content (fallback), and centralized client logos
      const [homeResponse, lp2Response, clientLogosResponse] = await Promise.all([
        pagesAPI.getOne('home'),
        pagesAPI.getOne('landing-page-2'),
        clientLogosAPI.getByPage('home').catch(() => ({ data: { data: [] } })),
      ]);

      if (homeResponse.data.data?.content) {
        const content = homeResponse.data.data.content;
        setPageContent(prev => ({ ...prev, ...content }));
        // Fetch works with selected project IDs
        fetchWorks(content.selectedProjectIds || []);
      } else {
        fetchWorks([]);
      }

      // Store LP2 content for client logos (fallback)
      if (lp2Response.data?.data?.content) {
        setLp2Content(lp2Response.data.data.content);
      }

      // Store centralized client logos (priority)
      if (clientLogosResponse.data?.data) {
        setCentralizedClientLogos(clientLogosResponse.data.data);
      }
    } catch (error) {
      console.log('Using default content for home page');
      fetchWorks([]);
    }
  };

  const fetchTestimonialData = async () => {
    try {
      // Fetch heading from About page, centralized reviews, and settings in parallel
      const [aboutResponse, reviewsResponse, landingResponse, settingsResponse] = await Promise.all([
        pagesAPI.getOne('about'),
        reviewsAPI.getByPage('home').catch(() => ({ data: { data: [] } })),
        pagesAPI.getOne('landing'),
        reviewsAPI.getSettings().catch(() => ({ data: { data: null } })),
      ]);

      // Set heading settings from centralized settings (priority) or fallback to About page
      if (settingsResponse.data?.data) {
        setReviewSettings({
          sectionTitle: settingsResponse.data.data.sectionTitle || '*Look* what our client said..',
          showHeadingOnPages: settingsResponse.data.data.showHeadingOnPages || [],
        });
      } else if (aboutResponse.data.data?.content) {
        // Fallback: Set heading from About page
        const aboutContent = aboutResponse.data.data.content;
        setTestimonialHeading(prev => ({
          ...prev,
          clientLabelItalic: aboutContent.clientLabelItalic || prev.clientLabelItalic,
          clientLabelNormal: aboutContent.clientLabelNormal || prev.clientLabelNormal,
        }));
      }

      // Priority 1: Centralized reviews from API
      if (reviewsResponse.data?.data && reviewsResponse.data.data.length > 0) {
        setTestimonials(reviewsResponse.data.data);
        return;
      }

      // Fallback: Fetch testimonials from Landing page
      if (landingResponse.data.data?.content) {
        const landingContent = landingResponse.data.data.content;
        if (landingContent.testimonials && Array.isArray(landingContent.testimonials) && landingContent.testimonials.length > 0) {
          setTestimonials(landingContent.testimonials);
        }
      }
    } catch (error) {
      console.log('Using default testimonial content');
    }
  };

  const fetchWorks = async (selectedProjects = []) => {
    try {
      const response = await worksAPI.getAll({ published: true });
      const allWorks = response.data.data || [];

      // If selectedProjects exist, filter to only show selected ones
      if (selectedProjects && selectedProjects.length > 0) {
        // Support both old format (array of IDs) and new format (array of objects)
        const projectIds = selectedProjects.map(p => typeof p === 'string' ? p : p.id);
        const filteredWorks = allWorks.filter(work => projectIds.includes(work._id));

        // Sort by the order they appear in selectedProjects
        filteredWorks.sort((a, b) => projectIds.indexOf(a._id) - projectIds.indexOf(b._id));

        // Add custom description if available
        const worksWithCustomDesc = filteredWorks.map(work => {
          const projectData = selectedProjects.find(p =>
            typeof p === 'string' ? p === work._id : p.id === work._id
          );
          const customDescription = typeof projectData === 'object' ? projectData.customDescription : '';
          return {
            ...work,
            homeDescription: customDescription || work.description || ''
          };
        });

        setWorks(worksWithCustomDesc);
      } else {
        // Fallback: show first 3 if no selection
        setWorks(allWorks.slice(0, 3).map(w => ({ ...w, homeDescription: w.description || '' })));
      }
    } catch (error) {
      console.error('Error fetching works:', error);
    }
  };

  // Partner logos - fetched from admin
  const partnerLogosDesktop = pageContent.partnerLogos || [];
  const partnerLogosMobile = pageContent.partnerLogosMobile || [];
  const partnerLogos = isMobile ? partnerLogosMobile : partnerLogosDesktop;

  // Fallback text logos if no images uploaded
  const fallbackLogos = [
    'AUTOMATTIC', 'Wealthsimple', 'SPACEX', 'gusto', 'attentive', 'SONY',
    'Square', 'dribbble', 'drips', 'Dropbox'
  ];

  // Services data
  const services = [
    { title: pageContent.service1Title, description: pageContent.service1Description, image: pageContent.service1Image },
    { title: pageContent.service2Title, description: pageContent.service2Description, image: pageContent.service2Image },
    { title: pageContent.service3Title, description: pageContent.service3Description, image: pageContent.service3Image },
  ];

  // Accordion items for Brands section
  const accordionItems = [
    { title: pageContent.accordion1Title, items: pageContent.accordion1Items?.split(',').map(i => i.trim()).filter(i => i) || [] },
    { title: pageContent.accordion2Title, items: pageContent.accordion2Items?.split(',').map(i => i.trim()).filter(i => i) || [] },
    { title: pageContent.accordion3Title, items: pageContent.accordion3Items?.split(',').map(i => i.trim()).filter(i => i) || [] },
    { title: pageContent.accordion4Title, items: pageContent.accordion4Items?.split(',').map(i => i.trim()).filter(i => i) || [] },
  ];

  // FAQ items
  const faqItems = [
    { question: pageContent.faq1Question, answer: pageContent.faq1Answer },
    { question: pageContent.faq2Question, answer: pageContent.faq2Answer },
    { question: pageContent.faq3Question, answer: pageContent.faq3Answer },
    { question: pageContent.faq4Question, answer: pageContent.faq4Answer },
    { question: pageContent.faq5Question, answer: pageContent.faq5Answer },
  ];

  // Project colors
  const projectColors = ['#E1FFA0', '#2558BF', '#E2775A'];

  // GSAP ScrollTrigger Animation for hero image (works on both mobile and desktop)
  useLayoutEffect(() => {
    if (!animatedImageRef.current || !heroSectionRef.current || !targetSectionRef.current) return;

    const inlineImage = heroImageRef.current;
    if (!inlineImage) return;

    const initAnimation = () => {
      const heroSection = heroSectionRef.current;
      const animatedImage = animatedImageRef.current;
      const targetSection = targetSectionRef.current;
      const targetImg = targetSection.querySelector('img');
      const viewportWidth = window.innerWidth;
      const isMobileView = viewportWidth <= 768;

      // Get measurements
      const inlineRect = inlineImage.getBoundingClientRect();

      // Starting values (inline pill position) - different for mobile/desktop
      const startLeft = inlineRect.left;
      const startTop = inlineRect.top;
      const startWidth = isMobileView ? 57 : 125;
      const startHeight = isMobileView ? 43 : 67;
      const startRadius = 300;

      // Ending values (full width, positioned at top of viewport when hero scrolls out)
      const endLeft = 0;
      const endTop = 0;
      const endWidth = viewportWidth;
      const endHeight = isMobileView ? 792 : 832;
      const endRadius = 0;

      // Hide target image initially
      if (targetImg) targetImg.style.opacity = '0';

      // Set initial state
      gsap.set(animatedImage, {
        position: 'fixed',
        left: startLeft,
        top: startTop,
        width: startWidth,
        height: startHeight,
        borderRadius: startRadius,
        opacity: 0,
        zIndex: 999,
      });

      // Create scroll-linked animation
      ScrollTrigger.create({
        trigger: heroSection,
        start: 'top top',
        end: 'bottom top',
        scrub: 0,
        onUpdate: (self) => {
          const progress = self.progress;

          // Hide inline image after small scroll
          inlineImage.style.opacity = progress > 0.02 ? '0' : '1';

          // Show/hide animated image
          if (progress > 0.01 && progress < 0.99) {
            animatedImage.style.opacity = '1';
          } else if (progress <= 0.01) {
            animatedImage.style.opacity = '0';
          }

          // Smooth interpolation using eased progress for natural feel
          const easedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          // Interpolate all values
          const currentWidth = startWidth + (endWidth - startWidth) * easedProgress;
          const currentHeight = startHeight + (endHeight - startHeight) * easedProgress;
          const currentRadius = startRadius + (endRadius - startRadius) * easedProgress;

          // Position: start from inline, end at top-left (0,0)
          const currentLeft = startLeft + (endLeft - startLeft) * easedProgress;
          const currentTop = startTop + (endTop - startTop) * easedProgress;

          // Apply interpolated values
          animatedImage.style.width = `${currentWidth}px`;
          animatedImage.style.height = `${currentHeight}px`;
          animatedImage.style.left = `${currentLeft}px`;
          animatedImage.style.top = `${currentTop}px`;
          animatedImage.style.borderRadius = `${currentRadius}px`;

          // At end, swap to static image
          if (progress >= 0.99) {
            animatedImage.style.opacity = '0';
            if (targetImg) targetImg.style.opacity = '1';
          } else {
            if (targetImg) targetImg.style.opacity = '0';
          }
        },
      });
    };

    const timer = setTimeout(initAnimation, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isMobile, pageContent.heroImage]);

  // Refresh ScrollTrigger on resize
  useEffect(() => {
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fff', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* Animated Hero Image - GSAP controlled (works on both mobile and desktop) */}
      {(pageContent.heroImage || pageContent.heroImageMobile) && (
        <div
          ref={animatedImageRef}
          style={{
            position: 'fixed',
            width: isMobile ? '57px' : '125px',
            height: isMobile ? '43px' : '67px',
            borderRadius: '300px',
            overflow: 'hidden',
            zIndex: 999,
            opacity: 0,
            pointerEvents: 'none',
            willChange: 'transform, width, height, left, top, border-radius',
          }}
        >
          <img
            src={getImageUrl(isMobile ? (pageContent.heroImageMobile || pageContent.heroImage) : pageContent.heroImage)}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Hero Section - Blue with Green Circles */}
      {shouldRenderSection('hero') && (
      <EditableSection sectionId="hero" label="Hero Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'hero'} isHidden={isSectionHidden('hero')}>
        <section
          ref={heroSectionRef}
          style={{
            width: '100%',
            minHeight: isMobile ? '609px' : isTablet ? '600px' : '700px',
            backgroundColor: '#2558BF',
            position: 'relative',
            overflow: 'hidden',
            padding: isMobile ? '0 0 80px' : isTablet ? '80px 40px 100px' : '100px 100px 120px',
          }}>
          {/* Decorative Green Circles - Desktop only */}
          {!isMobile && (
            <>
              {/* Left Column - Half visible (50% inside) */}
              <div style={{ position: 'absolute', top: '50px', left: '-92px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', top: '260px', left: '-92px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', top: '470px', left: '-92px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              {/* Bottom-Left Corner - partial visible */}
              <div style={{ position: 'absolute', bottom: '-92px', left: '-92px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              {/* Right Side - Full circles in middle + 1/4 visible on edge */}
              <div style={{ position: 'absolute', top: '0px', right: '-139px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              {/* Full circles on right side */}
              <div style={{ position: 'absolute', top: '530px', right: '430px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', top: '330px', right: '100px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', top: '210px', right: '-139px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', top: '420px', right: '-139px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              {/* Bottom Row - 1/4 visible (25% inside) */}
              <div style={{ position: 'absolute', bottom: '-139px', left: '150px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', bottom: '-139px', left: '400px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', bottom: '-139px', left: '650px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', bottom: '-139px', right: '300px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              <div style={{ position: 'absolute', bottom: '-139px', right: '50px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
              {/* Bottom-Right Corner - only 50px visible */}
              <div style={{ position: 'absolute', bottom: '-85px', right: '-135px', width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#AAD28E' }} />
            </>
          )}

          {/* Hero Content */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: isMobile ? '100%' : '900px',
            paddingTop: isMobile ? '60px' : '80px',
            marginLeft: isMobile ? '0' : '98px',
            textAlign: isMobile ? 'center' : 'left',
          }}>
            {/* Main Title */}
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '36px' : isTablet ? '56px' : '80px',
              fontWeight: 500,
              color: '#fff',
              lineHeight: isMobile ? '56px' : 1.1,
              letterSpacing: isMobile ? '-1px' : '-3px',
              marginBottom: isMobile ? '35px' : '24px',
              padding: isMobile ? '0 20px' : 0,
            }}>
              <span style={{ whiteSpace: isMobile ? 'nowrap' : 'normal' }}>Beyond the <span style={{ fontStyle: 'italic' }}>original</span></span>
              <br />
              branding and{' '}
              <span
                ref={heroImageRef}
                style={{
                  display: 'inline-block',
                  width: isMobile ? '57px' : '125px',
                  height: isMobile ? '43px' : '67px',
                  backgroundColor: '#fff',
                  borderRadius: '300px',
                  verticalAlign: 'middle',
                  marginLeft: isMobile ? '4px' : '0',
                  marginRight: isMobile ? '0' : '16px',
                  overflow: 'hidden',
                  transition: 'opacity 0.2s ease',
                  transform: isMobile ? 'rotate(-90deg)' : 'none',
                }}>
                {(isMobile ? (pageContent.heroImageMobile || pageContent.heroImage) : pageContent.heroImage) && (
                  <img
                    src={getImageUrl(isMobile ? (pageContent.heroImageMobile || pageContent.heroImage) : pageContent.heroImage)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </span>
              <br />
              UI UX design agency
            </h1>

            {/* Description */}
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px',
              fontWeight: 500,
              color: '#fff',
              lineHeight: '28px',
              maxWidth: isMobile ? '350px' : '531px',
              marginBottom: isMobile ? '58px' : '40px',
              margin: isMobile ? '0 auto 58px' : '0 0 40px 0',
              textAlign: isMobile ? 'center' : 'left',
            }}>
              {pageContent.heroDescription || 'We are UX/UI agency helping ambitious companies and visionary entrepreneurs bring the next design revolution.'}
            </p>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'center' : 'flex-start',
              gap: '16px',
              marginBottom: '20px',
            }}>
              <Link to="/contact" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 24px',
                height: isMobile ? '54px' : '64px',
                width: isMobile ? '347px' : 'auto',
                minWidth: isMobile ? 'auto' : '216px',
                backgroundColor: '#fff',
                color: '#000',
                borderRadius: '200px',
                textDecoration: 'none',
                fontFamily: "'Gilroy-SemiBold', sans-serif",
                fontSize: '20px',
                fontWeight: 400,
                lineHeight: '24px',
              }}>
                {pageContent.heroButton1Text || 'Schedule Call'}
              </Link>
              {!isMobile && (
                <Link to="/work" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 24px',
                  height: '64px',
                  minWidth: '200px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid #fff',
                  borderRadius: '200px',
                  textDecoration: 'none',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '20px',
                  fontWeight: 600,
                }}>
                  {pageContent.heroButton2Text || 'Our Work'}
                </Link>
              )}
            </div>

            {/* Get instant response */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: '12px',
            }}>
              <img src={vectorIcon} alt="" style={{ width: '18px', height: '20px', filter: 'brightness(0) invert(1)' }} />
              <span style={{
                fontFamily: "'Gilroy-Medium', sans-serif",
                fontSize: '16px',
                fontWeight: 400,
                color: '#fff',
              }}>
                {pageContent.heroInstantText || 'Get instant response'}
              </span>
            </div>
          </div>

          {/* Decorative 3D Elements - Right Side (Desktop only) */}
          {!isMobile && (
            <>
              {/* Position 1 - Top right 3D element */}
              <img
                src={heroDecor1}
                alt=""
                style={{
                  position: 'absolute',
                  right: '110px',
                  top: '530px',
                  width: '220px',
                  height: 'auto',
                  zIndex: 2,
                }}
              />
              {/* Position 2 - Bottom center-right 3D element */}
              <img
                src={heroDecor2}
                alt=""
                style={{
                  position: 'absolute',
                  right: '510px',
                  bottom: '-100px',
                  width: '160px',
                  height: 'auto',
                  zIndex: 2,
                }}
              />
            </>
          )}
        </section>
      </EditableSection>
      )}

      {/* Target Section for Animated Image - Full width image display (works on both mobile and desktop) */}
      <section
        ref={targetSectionRef}
        style={{
          width: '100%',
          height: isMobile ? '792px' : '832px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Static image that appears when animation completes */}
        {(pageContent.heroImage || pageContent.heroImageMobile) && (
          <img
            src={getImageUrl(isMobile ? (pageContent.heroImageMobile || pageContent.heroImage) : pageContent.heroImage)}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0,
            }}
          />
        )}
      </section>

      {/* Partner Brands Section - Marquee Animation */}
      {shouldRenderSection('partners') && (
      <EditableSection sectionId="partners" label="Partner Brands" isEditorMode={isEditorMode} isSelected={selectedSection === 'partners'} isHidden={isSectionHidden('partners')}>
        <section style={{
          padding: isMobile ? '64px 0 60px 0' : isTablet ? '60px 0' : '80px 0',
          textAlign: 'center',
          overflow: 'hidden',
        }}>
          {/* Marquee Animation Styles */}
          <style>{`
            @keyframes marqueeHome {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes marqueeHomeReverse {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
          `}</style>

          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '20px' : '28px',
            fontWeight: isMobile ? 600 : 400,
            fontStyle: 'normal',
            color: '#000',
            lineHeight: isMobile ? '30px' : 'normal',
            width: isMobile ? '390px' : '645px',
            maxWidth: '90%',
            margin: `0 auto ${isMobile ? '36px' : '60px'}`,
            textAlign: 'center',
          }}>
            {pageContent.partnerTitle}
          </p>

          {/* Marquee Rows - Fetches logos from centralized Client Logos API */}
          {(() => {
            // Parse client logos - Priority: Centralized API > LP2 Content > Default
            const parseClientLogos = () => {
              // Priority 1: Centralized client logos from API
              if (centralizedClientLogos && centralizedClientLogos.length > 0) {
                return centralizedClientLogos.map((logo) => ({
                  image: logo.logo,
                  name: logo.name,
                }));
              }
              // Fallback: LP2 content logos
              const logos = lp2Content.clientLogos;
              if (logos && Array.isArray(logos) && logos.length > 0) {
                return logos.map((logo, index) => {
                  if (typeof logo === 'string') {
                    return { image: logo, name: `Client ${index + 1}` };
                  }
                  return { image: logo.url || logo.image || '', name: logo.name || `Client ${index + 1}` };
                });
              }
              // Default placeholder logos (text only)
              return [
                { name: 'Automattic' },
                { name: 'Wealthsimple' },
                { name: 'SpaceX' },
                { name: 'Gusto' },
                { name: 'Attentive' },
                { name: 'Square' },
                { name: 'Dribbble' },
                { name: 'Drips' },
                { name: 'Dropbox' },
                { name: 'Sonic' },
              ];
            };

            const clientLogos = parseClientLogos();
            const hasImages = clientLogos.some(logo => logo.image);

            // Mobile: 3 rows, Desktop: 2 rows
            const rowCount = isMobile ? 3 : 2;

            return Array.from({ length: rowCount }).map((_, rowIndex) => {
              const repeatedItems = [...clientLogos, ...clientLogos, ...clientLogos, ...clientLogos];

              return (
                <div
                  key={rowIndex}
                  style={{
                    overflow: 'hidden',
                    marginBottom: isMobile ? '20px' : '40px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? '40px' : '80px',
                    // Mobile: 1st & 3rd row left, 2nd row right | Desktop: 1st left, 2nd right
                    animation: `marqueeHome${rowIndex === 1 ? 'Reverse' : ''} ${22 + rowIndex * 3}s linear infinite`,
                    width: 'fit-content',
                  }}>
                    {repeatedItems.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          padding: isMobile ? '4px' : '12px',
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image.startsWith('http') ? item.image : `${import.meta.env.VITE_API_URL || ''}${item.image}`}
                            alt={item.name}
                            style={{
                              height: isMobile ? '28px' : '48px',
                              width: 'auto',
                              objectFit: 'contain',
                              filter: 'grayscale(100%)',
                              opacity: 0.7,
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'block');
                            }}
                          />
                        ) : null}
                        <span style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: isMobile ? '14px' : '20px',
                          fontWeight: 500,
                          color: '#888',
                          whiteSpace: 'nowrap',
                          display: item.image ? 'none' : 'block',
                        }}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}

          {/* Editor mode note */}
          {isEditorMode && (
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              marginTop: '20px',
              border: '1px dashed #3b82f6',
              maxWidth: '90%',
              margin: '20px auto 0',
            }}>
              <span style={{ fontSize: '13px', color: '#1d4ed8' }}>
                ℹ️ Client logos are fetched from Landing Page 2. Edit them there.
              </span>
            </div>
          )}
        </section>
      </EditableSection>
      )}

      {/* Experience Section */}
      {shouldRenderSection('experience') && (
      <EditableSection sectionId="experience" label="Experience Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'experience'} isHidden={isSectionHidden('experience')}>
        <section style={{
          backgroundColor: isMobile ? '#E1FFA0' : 'transparent',
          borderRadius: isMobile ? '0 0 300px 300px' : '0',
          padding: isMobile ? '48px 0 80px' : isTablet ? '40px 40px 60px' : '40px 100px 80px',
          textAlign: 'center',
          minHeight: isMobile ? 'auto' : 'auto',
          marginTop: isMobile ? '0' : '0',
          position: 'relative',
          zIndex: isMobile ? 12 : 1, // Higher z-index on mobile to overlap next card
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '11px' : '0',
            marginBottom: isMobile ? '30px' : isTablet ? '32px' : '40px',
            padding: isMobile ? '0 25px' : '0',
          }}>
            <h2 style={{
              fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '24px' : isTablet ? '36px' : '48px',
              fontWeight: isMobile ? 400 : 500,
              color: '#000',
              lineHeight: isMobile ? 1.3 : 1.2,
              letterSpacing: isMobile ? '-0.5px' : '0',
              margin: 0,
              whiteSpace: isMobile ? 'nowrap' : 'normal',
            }}>
              <span style={{ fontFamily: isMobile ? "'Gilroy-SemiBoldItalic', sans-serif" : 'inherit', fontStyle: 'italic', fontWeight: 600 }}>{pageContent.experienceTitle1}</span>{' '}
              <span style={{ fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : 'inherit' }}>{pageContent.experienceTitle2}</span>
            </h2>
            <h2 style={{
              fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '24px' : isTablet ? '36px' : '48px',
              fontWeight: isMobile ? 400 : 500,
              color: '#000',
              lineHeight: isMobile ? 1.3 : 1.2,
              letterSpacing: isMobile ? '-0.5px' : '0',
              margin: 0,
              whiteSpace: isMobile ? 'nowrap' : 'normal',
              display: isMobile ? 'block' : 'none',
            }}>
              <span style={{ fontFamily: isMobile ? "'Gilroy-SemiBoldItalic', sans-serif" : 'inherit', fontStyle: 'italic', fontWeight: 600 }}>{pageContent.experienceTitle3}</span>{' '}
              <span style={{ fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : 'inherit' }}>{pageContent.experienceTitle4}</span>
            </h2>
            {!isMobile && (
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: isTablet ? '36px' : '48px',
                fontWeight: 500,
                color: '#000',
                lineHeight: 1.2,
                margin: 0,
              }}>
                <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{pageContent.experienceTitle3}</span>{' '}
                {pageContent.experienceTitle4}
              </h2>
            )}
          </div>

          {/* Mobile: First project card inside experience section */}
          {isMobile && works.length > 0 && (
            <div style={{ padding: '0 25px' }}>
              <div style={{
                width: '100%',
                maxWidth: '100%',
                height: '365px',
                margin: '0 auto 20px',
                borderRadius: '0',
                overflow: 'hidden',
              }}>
                {works[0]?.featuredImage || works[0]?.image ? (
                  <img
                    src={getImageUrl(works[0].featuredImage || works[0].image)}
                    alt={works[0].title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                  }}>
                    Project Image
                  </div>
                )}
              </div>
              <p style={{
                fontFamily: "'Gilroy-Medium', sans-serif",
                fontSize: '26px',
                color: '#000',
                textAlign: 'center',
                width: '315px',
                maxWidth: '100%',
                margin: '0 auto',
              }}>
                <span style={{ fontFamily: "'Gilroy-SemiBoldItalic', sans-serif", fontStyle: 'italic' }}>
                  {works[0]?.title || 'Project Name'}
                </span>
                <span> , {works[0]?.homeDescription?.substring(0, 40) || works[0]?.description?.substring(0, 40) || 'and the description goes here'}</span>
              </p>
            </div>
          )}

          {/* Mobile: Placeholder if no works */}
          {isMobile && works.length === 0 && (
            <div style={{ padding: '0 25px' }}>
              <div style={{
                width: '100%',
                maxWidth: '100%',
                height: '365px',
                margin: '0 auto 30px',
                borderRadius: '0',
                backgroundColor: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
              }}>
                Project Image
              </div>
              <p style={{
                fontFamily: "'Gilroy-Medium', sans-serif",
                fontSize: '26px',
                color: '#000',
                textAlign: 'center',
                width: '315px',
                maxWidth: '100%',
                margin: '0 auto',
              }}>
                <span style={{ fontFamily: "'Gilroy-SemiBoldItalic', sans-serif", fontStyle: 'italic' }}>
                  Project Name
                </span>
                <span> , and the description goes here</span>
              </p>
            </div>
          )}

          {!isMobile && (
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '20px',
              fontWeight: 400,
              color: '#000',
              lineHeight: '24px',
              width: '645px',
              maxWidth: '100%',
              margin: '0 auto',
              textAlign: 'center',
            }}>
              {pageContent.experienceDescription}
            </p>
          )}
        </section>
      </EditableSection>
      )}

      {/* Projects Showcase Section - Horizontal Slider (Desktop) */}
      {shouldRenderSection('projects') && (
      <EditableSection sectionId="projects" label="Projects Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'projects'} isHidden={isSectionHidden('projects')}>
        <section style={{
          padding: isMobile ? '0 0 40px 0' : '0',
          overflow: 'hidden',
          marginTop: isMobile ? '-180px' : '0',
        }}>
          {(() => {
            const projectList = works.length > 0 ? works.slice(0, 3) : [
              { _id: '1', title: 'Project Name', featuredImage: null },
              { _id: '2', title: 'Project Name', featuredImage: null },
              { _id: '3', title: 'Project Name', featuredImage: null },
            ];
            const totalProjects = Math.min(projectList.length, 3);

            // Card background colors for each project
            const projectColors = ['#E1FFA0', '#2558BF', '#E2775A']; // Green, Blue, Coral
            const currentBgColor = projectColors[currentProjectIndex % 3];
            const nextIndex = (currentProjectIndex + 1) % totalProjects;
            const prevIndex = (currentProjectIndex - 1 + totalProjects) % totalProjects;
            const nextBgColor = projectColors[nextIndex % 3];
            const currentWork = projectList[currentProjectIndex] || projectList[0];
            const nextWork = projectList[nextIndex] || projectList[0];

            // Text colors based on background
            const getTextColor = (bgColor) => bgColor === '#E1FFA0' ? '#000' : '#FFF';
            const currentTextColor = getTextColor(currentBgColor);
            const nextTextColor = getTextColor(nextBgColor);

            // Animate slider with GSAP for buttery smooth movement
            const animateSlider = (targetIndex, onComplete) => {
              if (!sliderRef.current) return;
              const extendedLen = Math.min(projectList.length, 3) + 1; // 4 cards
              const targetPercent = (targetIndex * 100) / extendedLen;

              gsap.to(sliderRef.current, {
                x: `-${targetPercent}%`,
                duration: 1.5,
                ease: 'power2.out', // Faster, smoother animation
                onComplete: onComplete,
              });
            };

            // Navigate to specific slide with animation
            const goToSlide = (targetIndex) => {
              if (projectSliding || targetIndex === currentProjectIndex) return;
              setProjectSliding(true);

              animateSlider(targetIndex, () => {
                setCurrentProjectIndex(targetIndex);
                setProjectSliding(false);
              });
            };

            // Handle next with infinite loop
            const handleNextProject = () => {
              if (projectSliding) return;
              setProjectSliding(true);

              const nextIdx = currentProjectIndex + 1;

              animateSlider(nextIdx, () => {
                // If we're at the clone (index 3), instantly reset to real first card (index 0)
                if (nextIdx >= totalProjects) {
                  gsap.set(sliderRef.current, { x: '0%' });
                  setCurrentProjectIndex(0);
                } else {
                  setCurrentProjectIndex(nextIdx);
                }
                setProjectSliding(false);
              });
            };

            const handlePrevProject = () => {
              goToSlide((currentProjectIndex - 1 + totalProjects) % totalProjects);
            };

            // Mobile: Skip first project (shown in Experience section), show remaining with different colors
            const mobileProjectList = isMobile && projectList.length > 1 ? projectList.slice(1) : projectList;
            const mobileProjectColors = ['#2558BF', '#E2775A'];

            // For infinite loop: create extended list with first card cloned at end
            const extendedProjectList = [...projectList.slice(0, 3), projectList[0]];
            const extendedTotal = extendedProjectList.length; // 4 cards (3 + 1 clone)

            return isMobile ? (
              // Mobile Layout - Stacked cards with different colors and border-radius, overlapping
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {mobileProjectList.slice(0, 2).map((project, idx) => {
                  const cardBgColor = mobileProjectColors[idx] || '#F5F5F5';
                  const textColor = '#FFF';
                  return (
                    <div key={project._id || idx} style={{
                      backgroundColor: cardBgColor,
                      borderRadius: '0 0 300px 300px',
                      overflow: 'hidden',
                      paddingTop: '0',
                      paddingBottom: '80px',
                      position: 'relative',
                      marginTop: idx === 0 ? '0' : '-180px',
                      zIndex: 10 - idx,
                    }}>
                      <div style={{ padding: '220px 25px 0' }}>
                        <div style={{
                          width: '100%',
                          maxWidth: '100%',
                          height: '365px',
                          margin: '0 auto 20px',
                          borderRadius: '0',
                          overflow: 'hidden',
                        }}>
                          {(project.featuredImage || project.image) ? (
                            <img src={getImageUrl(project.featuredImage || project.image)} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor }}>Project Image</div>
                          )}
                        </div>
                        <p style={{
                          fontFamily: "'Gilroy-Medium', sans-serif",
                          fontSize: '26px',
                          color: textColor,
                          textAlign: 'center',
                          width: '315px',
                          maxWidth: '100%',
                          margin: '0 auto',
                        }}>
                          <span style={{ fontFamily: "'Gilroy-SemiBoldItalic', sans-serif", fontStyle: 'italic' }}>{project.title || 'Project Name'}</span>
                          <span> , {project.homeDescription?.substring(0, 40) || project.description?.substring(0, 40) || 'and the description goes here'}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Desktop Layout - Full Card Horizontal Slider with Infinite Loop
              <div style={{
                position: 'relative',
                minHeight: '646px',
                width: '100%',
                overflow: 'hidden',
              }}>
                {/* Cards Container - Slides horizontally (4 cards for infinite loop) */}
                <div
                  ref={sliderRef}
                  style={{
                    display: 'flex',
                    width: `${extendedTotal * 100}%`,
                    willChange: 'transform',
                  }}
                >
                  {extendedProjectList.map((project, idx) => {
                    // Use modulo for colors since we have a clone
                    const cardBgColor = projectColors[idx % 3];
                    const textColor = getTextColor(cardBgColor);
                    const nextIdx = (idx + 1) % totalProjects;
                    const nextCardBgColor = projectColors[nextIdx % 3];
                    const nextCardTextColor = getTextColor(nextCardBgColor);
                    const nextProject = projectList[nextIdx];

                    return (
                      <div
                        key={`${project._id || 'project'}-${idx}`}
                        style={{
                          width: `${100 / extendedTotal}%`,
                          minHeight: '646px',
                          position: 'relative',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Main Card Content - Left Side */}
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '80%',
                          backgroundColor: cardBgColor,
                          padding: '60px 80px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-start',
                        }}>
                          {/* Title */}
                          <h3 style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '32px',
                            fontWeight: 500,
                            color: textColor,
                            marginBottom: '40px',
                            maxWidth: '600px',
                            lineHeight: 1.3,
                          }}>
                            <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{project.title || 'Project Name'}</span>
                            <span style={{ fontWeight: 400 }}> , {project.homeDescription || project.description?.substring(0, 80) || 'An e-commerce project is an online platform where user can Buy Products'}</span>
                          </h3>
                          {/* Image */}
                          <div style={{ maxWidth: '500px' }}>
                            {(project.featuredImage || project.image) ? (
                              <img
                                src={getImageUrl(project.featuredImage || project.image)}
                                alt={project.title}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  maxHeight: '400px',
                                  objectFit: 'contain',
                                  borderRadius: '8px'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '350px',
                                backgroundColor: textColor === '#000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: textColor
                              }}>
                                Project Image
                              </div>
                            )}
                          </div>
                          {/* Slide indicators - hidden */}
                        </div>

                        {/* Right Section - Next Card Preview with Curved Edge */}
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '40%',
                          backgroundColor: nextCardBgColor,
                          borderRadius: '300px 0 0 300px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {/* Right Arrow and Next Project Title - Always visible, loops infinitely */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            position: 'absolute',
                            left: '45px',
                            right: '40px',
                          }}>
                            <button
                              onClick={handleNextProject}
                              style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                backgroundColor: nextCardTextColor === '#000' ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.44)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: projectSliding ? 'default' : 'pointer',
                                transition: 'background-color 0.3s, transform 0.2s',
                                flexShrink: 0,
                                opacity: projectSliding ? 0.5 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!projectSliding) {
                                  e.currentTarget.style.backgroundColor = nextCardTextColor === '#000' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.6)';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = nextCardTextColor === '#000' ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.44)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <img
                                src={rightArrowIcon}
                                alt="Next"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  filter: nextCardTextColor === '#000' ? 'invert(1)' : 'none'
                                }}
                              />
                            </button>
                            {/* Next Project Title */}
                            <h4 style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: '24px',
                              fontWeight: 500,
                              color: nextCardTextColor,
                              flex: 1,
                              margin: 0,
                              lineHeight: 1.4,
                            }}>
                              <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{nextProject?.title || 'Project Name'}</span>
                              <span style={{ fontWeight: 400 }}> , {nextProject?.homeDescription || nextProject?.description?.substring(0, 60) || 'An e-commerce project is an online platform where user can Buy Products'}</span>
                            </h4>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>
      </EditableSection>
      )}

      {/* Want To See More Section - Hidden on mobile */}
      {shouldRenderSection('wantMore') && !isMobile && (
      <EditableSection sectionId="wantMore" label="Want To See More" isEditorMode={isEditorMode} isSelected={selectedSection === 'wantMore'} isHidden={isSectionHidden('wantMore')}>
        <section style={{
          padding: '60px 100px',
          paddingBottom: '50px',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '32px',
            fontWeight: 400,
            fontStyle: 'italic',
            color: '#000',
            marginBottom: '20px',
          }}>
            {pageContent.wantMoreTitle}
          </h3>
          <Link to="/case-studies" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '64px',
            padding: '12px 24px',
            gap: '12px',
            backgroundColor: '#2558BF',
            color: '#fff',
            borderRadius: '200px',
            textDecoration: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '20px',
            fontWeight: 400,
            lineHeight: '24px',
          }}>
            {pageContent.wantMoreButtonText}
          </Link>
        </section>
      </EditableSection>
      )}

      {/* Real Numbers Section */}
      {shouldRenderSection('realNumbers') && (
      <EditableSection sectionId="realNumbers" label="Real Numbers Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'realNumbers'} isHidden={isSectionHidden('realNumbers')}>
        <section style={{
          padding: isMobile ? '20px 23px 0' : isTablet ? '60px 40px' : '50px 100px 80px',
          textAlign: isMobile ? 'center' : 'center',
        }}>
          <h2 style={{
            fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
            fontSize: isMobile ? '28px' : isTablet ? '36px' : '42px',
            fontWeight: 400,
            color: '#000',
            marginBottom: isMobile ? '40px' : '48px',
            letterSpacing: isMobile ? '-0.5px' : '0',
            whiteSpace: isMobile ? 'nowrap' : 'normal',
            textAlign: 'center',
          }}>
            <span style={{ fontFamily: isMobile ? "'Gilroy-MediumItalic', sans-serif" : 'inherit', fontStyle: 'italic', fontWeight: 400 }}>Real</span>
            <span style={{ fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : 'inherit', fontStyle: 'normal', fontWeight: isMobile ? 400 : 500 }}> Numbers.</span>{' '}
            <span style={{ fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : 'inherit', fontStyle: 'normal', fontWeight: isMobile ? 400 : 500 }}>Real Impacts</span>
          </h2>

          {/* Stats Grid */}
          <div style={{
            display: isMobile ? 'grid' : 'flex',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'none',
            justifyContent: 'center',
            gap: '12px',
            maxWidth: isMobile ? '386px' : '1240px',
            margin: '0 auto',
            marginBottom: isMobile ? '12px' : '32px',
          }}>
            {/* Stat 1 */}
            <div style={{
              width: isMobile ? '100%' : '293px',
              height: isMobile ? 'auto' : '198px',
              padding: isMobile ? '24px 17px' : '24px',
              border: isMobile ? '1.5px solid rgba(0,0,0,0.05)' : '1px solid #E5E5E5',
              borderRadius: isMobile ? '16px' : '8px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: '10px',
            }}>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '32px' : '56px',
                fontWeight: 400,
                color: '#000',
                letterSpacing: '0.369px',
              }}>
                {pageContent.stat1Value}
              </div>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '12px' : '18px',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: isMobile ? 'normal' : '24px',
                letterSpacing: '-0.15px',
              }}>
                {pageContent.stat1Label}
              </div>
            </div>
            {/* Stat 2 */}
            <div style={{
              width: isMobile ? '100%' : '293px',
              height: isMobile ? 'auto' : '198px',
              padding: isMobile ? '24px 17px' : '24px',
              border: isMobile ? '1.5px solid rgba(0,0,0,0.05)' : '1px solid #E5E5E5',
              borderRadius: isMobile ? '16px' : '8px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: '10px',
            }}>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '32px' : '56px',
                fontWeight: 400,
                color: '#000',
                letterSpacing: '0.369px',
              }}>
                {pageContent.stat2Value}
              </div>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '12px' : '18px',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: isMobile ? 'normal' : '24px',
                letterSpacing: '-0.15px',
              }}>
                {pageContent.stat2Label}
              </div>
            </div>
            {/* Stat 3 */}
            <div style={{
              width: isMobile ? '100%' : '293px',
              height: isMobile ? 'auto' : '198px',
              padding: isMobile ? '24px 17px' : '24px',
              border: isMobile ? '1.5px solid rgba(0,0,0,0.05)' : '1px solid #E5E5E5',
              borderRadius: isMobile ? '16px' : '8px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: '10px',
            }}>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '32px' : '56px',
                fontWeight: 400,
                color: '#000',
                letterSpacing: '0.369px',
              }}>
                {pageContent.stat3Value}
              </div>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '12px' : '18px',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: isMobile ? 'normal' : '24px',
                letterSpacing: '-0.15px',
              }}>
                {pageContent.stat3Label}
              </div>
            </div>
            {/* Stat 4 */}
            <div style={{
              width: isMobile ? '100%' : '293px',
              height: isMobile ? 'auto' : '198px',
              padding: isMobile ? '24px 17px' : '24px',
              border: isMobile ? '1.5px solid rgba(0,0,0,0.05)' : '1px solid #E5E5E5',
              borderRadius: isMobile ? '16px' : '8px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              gap: '10px',
            }}>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '32px' : '56px',
                fontWeight: 400,
                color: '#000',
                letterSpacing: '0.369px',
              }}>
                {pageContent.stat4Value}
              </div>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '12px' : '18px',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: isMobile ? 'normal' : '24px',
                letterSpacing: '-0.15px',
              }}>
                {pageContent.stat4Label}
              </div>
            </div>
          </div>

          {/* Stat 5 with Image */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
          }}>
            {pageContent.stat5Image ? (
              <img src={getImageUrl(pageContent.stat5Image)} alt="" style={{ width: isMobile ? '130px' : '222px', height: isMobile ? '89px' : '153px', borderRadius: '8px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: isMobile ? '130px' : '222px', height: isMobile ? '89px' : '153px', backgroundColor: '#E5E5E5', borderRadius: '8px' }} />
            )}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '32px' : '56px',
                fontWeight: 400,
                color: '#000',
                letterSpacing: '0.369px',
              }}>
                {pageContent.stat5Value}
              </div>
              <div style={{
                fontFamily: isMobile ? "'Gilroy-Medium', sans-serif" : "'Plus Jakarta Sans', sans-serif",
                fontSize: isMobile ? '12px' : '18px',
                fontWeight: 400,
                color: '#1F1F1F',
                lineHeight: isMobile ? 'normal' : '24px',
                letterSpacing: '-0.15px',
              }}>
                {pageContent.stat5Label}
              </div>
            </div>
          </div>
        </section>
      </EditableSection>
      )}

      {/* Services Section */}
      {shouldRenderSection('services') && (
      <EditableSection sectionId="services" label="Services Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'services'} isHidden={isSectionHidden('services')}>
        <section style={{
          padding: isMobile ? '40px 0 40px 20px' : isTablet ? '60px 0 60px 40px' : '80px 0 80px 100px',
          overflow: 'hidden',
        }}>
          {/* Title and CTA Row */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'flex-start',
            marginBottom: isMobile ? '32px' : '48px',
            gap: isMobile ? '0' : '40px',
            paddingRight: isMobile ? '20px' : '100px',
          }}>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: isMobile ? '28px' : isTablet ? '36px' : '50px',
              fontWeight: 400,
              color: '#000',
              maxWidth: isMobile ? '260px' : '600px',
              lineHeight: 1.2,
              letterSpacing: '-1px',
              margin: 0,
            }}>
              <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{pageContent.servicesTitle}</span>{' '}
              {pageContent.servicesTitleNormal}
            </h2>
            {!isMobile && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '8px',
              }}>
                <Link to="/contact" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '64px',
                  padding: '12px 24px',
                  backgroundColor: '#2558BF',
                  color: '#fff',
                  borderRadius: '200px',
                  textDecoration: 'none',
                  fontFamily: "'Gilroy-SemiBold', sans-serif",
                  fontSize: '20px',
                  fontWeight: 400,
                  lineHeight: '24px',
                }}>
                  {pageContent.ctaMidButtonText}
                </Link>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                }}>
                  <img src={vectorIcon} alt="" style={{ width: '18px', height: '20px', filter: 'brightness(0)' }} />
                  <span style={{
                    fontFamily: "'Gilroy-Medium', sans-serif",
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#000',
                  }}>
                    {pageContent.ctaMidInstantText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Services Cards Carousel - Shows 2 full + partial 3rd with nav arrow on 3rd card */}
          <div style={{
            position: 'relative',
          }}>
            <div
              ref={servicesSliderRef}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                servicesSliderRef.current.touchStartX = touch.clientX;
                servicesSliderRef.current.touchStartY = touch.clientY;
              }}
              onTouchMove={(e) => {
                if (!servicesSliderRef.current.touchStartX) return;
                const touch = e.touches[0];
                const diffX = servicesSliderRef.current.touchStartX - touch.clientX;
                const diffY = Math.abs(servicesSliderRef.current.touchStartY - touch.clientY);
                // Only prevent default if horizontal swipe is dominant
                if (Math.abs(diffX) > diffY) {
                  e.preventDefault();
                }
              }}
              onTouchEnd={(e) => {
                if (!servicesSliderRef.current.touchStartX) return;
                const touch = e.changedTouches[0];
                const diffX = servicesSliderRef.current.touchStartX - touch.clientX;
                const threshold = 50;

                if (Math.abs(diffX) > threshold) {
                  if (diffX > 0 && currentServiceIndex < services.length - 1) {
                    // Swipe left - next
                    const newIndex = currentServiceIndex + 1;
                    const cardWidth = isMobile ? (window.innerWidth - 40) : 567;
                    setCurrentServiceIndex(newIndex);
                    gsap.to(servicesSliderRef.current, {
                      x: -newIndex * (cardWidth + 24),
                      duration: 0.8,
                      ease: 'power2.out',
                    });
                  } else if (diffX < 0 && currentServiceIndex > 0) {
                    // Swipe right - previous
                    const newIndex = currentServiceIndex - 1;
                    const cardWidth = isMobile ? (window.innerWidth - 40) : 567;
                    setCurrentServiceIndex(newIndex);
                    gsap.to(servicesSliderRef.current, {
                      x: -newIndex * (cardWidth + 24),
                      duration: 0.8,
                      ease: 'power2.out',
                    });
                  }
                }
                servicesSliderRef.current.touchStartX = null;
                servicesSliderRef.current.touchStartY = null;
              }}
              style={{
                display: 'flex',
                gap: '24px',
                touchAction: isMobile ? 'pan-y' : 'auto',
              }}
            >
              {services.map((service, index) => {
                // Use green pattern for odd cards (1st, 3rd, 5th) and blue for even cards (2nd, 4th)
                const patternImage = index % 2 === 0 ? servicePatternGreen : servicePatternBlue;

                return (
                  <div key={index} style={{
                    flex: '0 0 auto',
                    width: isMobile ? 'calc(100vw - 40px)' : '543px',
                    height: isMobile ? '297.252px' : '416px',
                    borderRadius: '24px',
                    padding: isMobile ? '24px' : '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: service.image ? 'none' : `url(${patternImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#000',
                  }}>
                    {/* If service has custom image, show it as background */}
                    {service.image && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '24px',
                        overflow: 'hidden',
                      }}>
                        <img
                          src={getImageUrl(service.image)}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </div>
                    )}

                    <h4 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '20px' : '24px',
                      fontWeight: 600,
                      color: '#fff',
                      margin: '0 0 16px 0',
                      position: 'relative',
                      zIndex: 2,
                    }}>
                      {service.title}
                    </h4>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: 400,
                      color: 'rgba(255, 255, 255, 0.7)',
                      lineHeight: isMobile ? '22px' : '26px',
                      margin: '0',
                      maxWidth: '400px',
                      position: 'relative',
                      zIndex: 2,
                    }}>
                      {service.description}
                    </p>

                    {/* Left Navigation Arrow - show on first visible card when scrolled (desktop only) */}
                    {!isMobile && index === currentServiceIndex && currentServiceIndex > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newIndex = Math.max(0, currentServiceIndex - 1);
                          const cardWidth = 567;
                          setCurrentServiceIndex(newIndex);
                          gsap.to(servicesSliderRef.current, {
                            x: -newIndex * cardWidth,
                            duration: 1.5,
                            ease: 'power1.out',
                          });
                        }}
                        style={{
                          position: 'absolute',
                          left: '32px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '68px',
                          height: '68px',
                          borderRadius: '204px',
                          border: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.44)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                      >
                        <img src={rightArrowIcon} alt="Previous" style={{ width: '24px', height: '24px', transform: 'rotate(180deg)' }} />
                      </button>
                    )}

                    {/* Right Navigation Arrow - show on partially visible card (desktop only) */}
                    {!isMobile && index === currentServiceIndex + 2 && currentServiceIndex < services.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newIndex = Math.min(services.length - 1, currentServiceIndex + 1);
                          const cardWidth = 567;
                          setCurrentServiceIndex(newIndex);
                          gsap.to(servicesSliderRef.current, {
                            x: -newIndex * cardWidth,
                            duration: 1.5,
                            ease: 'power1.out',
                          });
                        }}
                        style={{
                          position: 'absolute',
                          left: '32px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '68px',
                          height: '68px',
                          borderRadius: '204px',
                          border: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.44)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                      >
                        <img src={rightArrowIcon} alt="Next" style={{ width: '24px', height: '24px' }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Navigation Arrows - Below Card */}
            {isMobile && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                marginTop: '24px',
              }}>
                <button
                  onClick={() => {
                    if (currentServiceIndex > 0) {
                      const newIndex = currentServiceIndex - 1;
                      const cardWidth = window.innerWidth - 40;
                      setCurrentServiceIndex(newIndex);
                      gsap.to(servicesSliderRef.current, {
                        x: -newIndex * (cardWidth + 24),
                        duration: 0.8,
                        ease: 'power2.out',
                      });
                    }
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '1px solid #000',
                    backgroundColor: 'transparent',
                    cursor: currentServiceIndex > 0 ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: currentServiceIndex > 0 ? 1 : 0.4,
                  }}
                  disabled={currentServiceIndex === 0}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (currentServiceIndex < services.length - 1) {
                      const newIndex = currentServiceIndex + 1;
                      const cardWidth = window.innerWidth - 40;
                      setCurrentServiceIndex(newIndex);
                      gsap.to(servicesSliderRef.current, {
                        x: -newIndex * (cardWidth + 24),
                        duration: 0.8,
                        ease: 'power2.out',
                      });
                    }
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '1px solid #000',
                    backgroundColor: 'transparent',
                    cursor: currentServiceIndex < services.length - 1 ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: currentServiceIndex < services.length - 1 ? 1 : 0.4,
                  }}
                  disabled={currentServiceIndex === services.length - 1}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>
      </EditableSection>
      )}

      {/* Testimonial Section - Content from Landing Page, Styling from CaseStudyDetail */}
      {testimonials[currentTestimonialIndex]?.quote1 && (
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
              marginBottom: isMobile ? '40px' : '60px',
            }}>
              {renderTitleWithItalics(reviewSettings.sectionTitle)}
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
                    {testimonials[currentTestimonialIndex]?.quote1}
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
                    {testimonials[currentTestimonialIndex]?.quote2}
                  </p>
                </div>

                {/* Stats in a row */}
                {testimonials[currentTestimonialIndex]?.stat1Value && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '32px',
                  }}>
                    {[
                      { value: testimonials[currentTestimonialIndex]?.stat1Value, label: testimonials[currentTestimonialIndex]?.stat1Label },
                      { value: testimonials[currentTestimonialIndex]?.stat2Value, label: testimonials[currentTestimonialIndex]?.stat2Label },
                      { value: testimonials[currentTestimonialIndex]?.stat3Value, label: testimonials[currentTestimonialIndex]?.stat3Label },
                    ].map((stat, index) => (
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
                  {testimonials.length > 1 && (
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
                        <img src={arrowLeft} alt="Previous" style={{ width: '14px', height: '14px', filter: 'brightness(0)' }} />
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
                        <img src={arrowRight} alt="Next" style={{ width: '14px', height: '14px', filter: 'brightness(0)' }} />
                      </button>
                    </div>
                  )}

                  {/* Author Image and Info - Right */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}>
                    {testimonials[currentTestimonialIndex]?.authorImage && (
                      <img
                        src={getImageUrl(testimonials[currentTestimonialIndex]?.authorImage)}
                        alt={testimonials[currentTestimonialIndex]?.authorName}
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
                      {testimonials[currentTestimonialIndex]?.authorName}
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
                      {testimonials[currentTestimonialIndex]?.authorRole}
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
                      {testimonials[currentTestimonialIndex]?.quote1}
                    </p>
                    <p style={{
                      fontFamily: "'Plus Jakarta Sans-Medium', 'Plus Jakarta Sans', sans-serif",
                      fontSize: '20px',
                      fontWeight: 400,
                      lineHeight: 'normal',
                      letterSpacing: '-0.184px',
                      color: '#000',
                    }}>
                      {testimonials[currentTestimonialIndex]?.quote2}
                    </p>
                  </div>

                  {/* Stats with vertical separators */}
                  {testimonials[currentTestimonialIndex]?.stat1Value && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: '24px',
                    }}>
                      {[
                        { value: testimonials[currentTestimonialIndex]?.stat1Value, label: testimonials[currentTestimonialIndex]?.stat1Label },
                        { value: testimonials[currentTestimonialIndex]?.stat2Value, label: testimonials[currentTestimonialIndex]?.stat2Label },
                        { value: testimonials[currentTestimonialIndex]?.stat3Value, label: testimonials[currentTestimonialIndex]?.stat3Label },
                      ].map((stat, index) => (
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
                  {testimonials[currentTestimonialIndex]?.authorImage && (
                    <img
                      src={getImageUrl(testimonials[currentTestimonialIndex]?.authorImage)}
                      alt={testimonials[currentTestimonialIndex]?.authorName}
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
                    {testimonials[currentTestimonialIndex]?.authorName}
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
                    {testimonials[currentTestimonialIndex]?.authorRole}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Arrows - Desktop only (show only if multiple testimonials) */}
            {!isMobile && testimonials.length > 1 && (
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
                  <img src={arrowLeft} alt="Previous" style={{ width: '16px', height: '16px', filter: 'brightness(0)' }} />
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
                  <img src={arrowRight} alt="Next" style={{ width: '16px', height: '16px', filter: 'brightness(0)' }} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Brands Section */}
      {shouldRenderSection('brands') && (
      <EditableSection sectionId="brands" label="Brands Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'brands'} isHidden={isSectionHidden('brands')}>
        <section style={{
          padding: isMobile ? '40px 20px' : isTablet ? '60px 40px' : '80px 161px 80px 100px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'flex-start' : 'flex-start',
        }}>
          <h2 style={{
            fontFamily: "'Gilroy-Medium', sans-serif",
            fontSize: isMobile ? '32px' : isTablet ? '40px' : '50px',
            fontWeight: 400,
            color: '#000',
            marginBottom: '16px',
            letterSpacing: '-1px',
            lineHeight: 'normal',
          }}>
            {pageContent.brandsTitle}{' '}
            <span style={{ fontFamily: "'Gilroy-MediumItalic', sans-serif", fontStyle: 'italic' }}>{pageContent.brandsTitleItalic}</span>
            <br />
            <span style={{ fontFamily: "'Gilroy-MediumItalic', sans-serif", fontStyle: 'italic' }}>{pageContent.brandsTitleEnd}</span>
          </h2>
          <p style={{
            fontFamily: "'Gilroy-Medium', sans-serif",
            fontSize: isMobile ? '16px' : '20px',
            fontWeight: 400,
            color: '#000',
            maxWidth: '600px',
            marginBottom: '48px',
            lineHeight: '28px',
          }}>
            {pageContent.brandsDescription}
          </p>

          {/* Accordion - 4 Boxes */}
          <div style={{
            width: '100%',
          }}>
            {accordionItems.map((item, index) => (
              <div key={index} style={{
                borderTop: '1px solid #E5E5E5',
                borderBottom: '1px solid #E5E5E5',
                marginBottom: index < accordionItems.length - 1 ? '-1px' : '0',
              }}>
                <button
                  onClick={() => setExpandedAccordion(expandedAccordion === index ? -1 : index)}
                  style={{
                    width: '100%',
                    minHeight: isMobile ? '80px' : '146px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '20px 16px' : '0 24px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    gap: '24px',
                  }}
                >
                  {/* Left side - Title */}
                  <span style={{
                    fontFamily: "'Gilroy-Medium', sans-serif",
                    fontSize: isMobile ? '18px' : '24px',
                    fontWeight: 500,
                    color: '#000',
                    flexShrink: 0,
                    minWidth: isMobile ? 'auto' : '280px',
                    textAlign: 'left',
                  }}>
                    {item.title}
                  </span>

                  {/* Middle - Items Grid (only when expanded, desktop only) */}
                  {!isMobile && expandedAccordion === index && item.items.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px 60px',
                      flex: 1,
                      marginTop: '40px',
                    }}>
                      {item.items.map((subItem, subIndex) => (
                        <div key={subIndex} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#E2775A',
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontFamily: "'Gilroy-Medium', sans-serif",
                            fontSize: '16px',
                            fontWeight: 400,
                            color: '#000',
                            whiteSpace: 'nowrap',
                          }}>
                            {subItem}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Right side - Arrow */}
                  <img
                    src={expandedAccordion === index ? arrowLeft : arrowRight}
                    alt={expandedAccordion === index ? "collapse" : "expand"}
                    style={{
                      width: isMobile ? '20px' : '24px',
                      height: isMobile ? '20px' : '24px',
                      filter: 'brightness(0) saturate(100%) invert(58%) sepia(49%) saturate(1018%) hue-rotate(331deg) brightness(91%) contrast(90%)',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Mobile - Items below when expanded */}
                {isMobile && expandedAccordion === index && item.items.length > 0 && (
                  <div style={{
                    padding: '0 16px 20px 16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '12px',
                  }}>
                    {item.items.map((subItem, subIndex) => (
                      <div key={subIndex} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#E2775A',
                          flexShrink: 0,
                        }} />
                        <span style={{
                          fontFamily: "'Gilroy-Medium', sans-serif",
                          fontSize: '14px',
                          fontWeight: 400,
                          color: '#000',
                        }}>
                          {subItem}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button - Centered */}
          <div style={{
            marginTop: '40px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}>
            <Link to="/contact" style={{
              display: 'flex',
              width: isMobile ? '280px' : '346px',
              height: '64px',
              padding: '12px 24px',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              borderRadius: '200px',
              backgroundColor: '#2558BF',
              color: '#fff',
              textDecoration: 'none',
              fontFamily: "'Gilroy-SemiBold', sans-serif",
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: 400,
              lineHeight: '24px',
              textAlign: 'center',
            }}>
              {pageContent.ctaMidButtonText}
            </Link>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
            }}>
              <img src={vectorIcon} alt="" style={{ width: '16px', height: '16px', filter: 'brightness(0)' }} />
              <span style={{
                fontFamily: "'Gilroy-Medium', sans-serif",
                fontSize: '16px',
                fontWeight: 400,
                color: '#000',
                lineHeight: 'normal',
              }}>
                {pageContent.ctaMidInstantText}
              </span>
            </div>
          </div>
        </section>
      </EditableSection>
      )}

      {/* CTA Section - Same as Work page */}
      {shouldRenderSection('cta') && (
      <EditableSection sectionId="cta" label="CTA Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'cta'} isHidden={isSectionHidden('cta')}>
        <section style={{ backgroundColor: '#fff', padding: isMobile ? '0' : '60px 100px', marginBottom: isMobile ? '-150px' : '0' }}>
          <div style={{
            maxWidth: isMobile ? '100%' : '1240px',
            minHeight: isMobile ? '438px' : '500px',
            margin: '0 auto',
            borderTopLeftRadius: isMobile ? '160px' : '300px',
            borderTopRightRadius: isMobile ? '160px' : '300px',
            borderBottomLeftRadius: isMobile ? '160px' : '300px',
            borderBottomRightRadius: isMobile ? '160px' : '300px',
            backgroundColor: '#E2775A',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            padding: isMobile ? '60px 24px 80px 24px' : isTablet ? '48px 60px' : '60px 118px',
            paddingBottom: isMobile ? '87px' : undefined,
          }}>
            {/* Left Content */}
            <div style={{ maxWidth: isMobile ? '100%' : '600px', zIndex: 1, textAlign: isMobile ? 'center' : 'left', marginTop: isMobile ? '0' : '-50px' }}>
              <h2 style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '28px' : isTablet ? '36px' : '42px',
                fontWeight: 400,
                lineHeight: 'normal',
                letterSpacing: '-1px',
                marginBottom: isMobile ? '16px' : '10px',
              }}>
                {pageContent.ctaHeading}
              </h2>
              <p style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 400,
                lineHeight: '28px',
                marginBottom: '8px',
              }}>
                {pageContent.ctaDescription1}
              </p>
              <p style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 400,
                lineHeight: '28px',
                marginBottom: isMobile ? '16px' : '24px',
              }}>
                {pageContent.ctaDescription2}
              </p>
              <p style={{
                color: '#FFF',
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 400,
                lineHeight: '28px',
                marginBottom: isMobile ? '24px' : '32px',
              }}>
                {pageContent.ctaDescription3}
              </p>

              <Link to="/contact" style={{
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
              }}>
                <span style={{
                  color: '#000',
                  fontFamily: "'Gilroy-SemiBold', sans-serif",
                  fontSize: '20px',
                  fontWeight: 400,
                  lineHeight: '24px',
                }}>
                  {pageContent.ctaButtonText}
                </span>
              </Link>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isMobile ? 'center' : 'flex-start',
                gap: '8px',
              }}>
                <img src={vectorIcon} alt="" style={{ width: '16px', height: '16px' }} />
                <span style={{
                  color: '#FFF',
                  fontFamily: "'Gilroy-Medium', sans-serif",
                  fontSize: '16px',
                  fontWeight: 400,
                }}>
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
      )}

      {/* FAQ Section */}
      {shouldRenderSection('faq') && (
      <EditableSection sectionId="faq" label="FAQ Section" isEditorMode={isEditorMode} isSelected={selectedSection === 'faq'} isHidden={isSectionHidden('faq')}>
        <section style={{
          padding: isMobile ? '40px 20px' : isTablet ? '60px 40px' : '80px 100px',
          paddingBottom: isMobile ? '60px' : '200px',
          marginTop: isMobile ? '150px' : '0',
        }}>
          {/* FAQ Title */}
          <h2 style={{
            fontFamily: "'Gilroy-Medium', sans-serif",
            fontSize: isMobile ? '28px' : isTablet ? '36px' : '42px',
            fontWeight: 400,
            color: '#000',
            textAlign: 'center',
            marginBottom: isMobile ? '32px' : '48px',
            lineHeight: 'normal',
          }}>
            <span style={{ fontFamily: "'Gilroy-MediumItalic', sans-serif", fontStyle: 'italic' }}>{pageContent.faqTitle}</span>{' '}
            {pageContent.faqTitleNormal}
          </h2>

          {/* FAQ Items */}
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '16px' : '23px',
          }}>
            {faqItems.map((item, index) => (
              <div key={index} style={{
                borderBottom: '1px solid rgba(0,0,0,0.35)',
              }}>
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  style={{
                    width: '100%',
                    minHeight: isMobile ? '80px' : '100px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '16px' : '20px 32px 20px 24px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{
                    fontFamily: "'Gilroy-Medium', sans-serif",
                    fontSize: isMobile ? '16px' : '22px',
                    fontWeight: 400,
                    color: '#000',
                    textAlign: 'left',
                    lineHeight: '26px',
                    letterSpacing: '0.22px',
                  }}>
                    {item.question}
                  </span>
                  {/* Plus Icon */}
                  <div style={{
                    width: isMobile ? '24px' : '32px',
                    height: isMobile ? '24px' : '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginLeft: '16px',
                  }}>
                    <svg
                      width={isMobile ? '20' : '24'}
                      height={isMobile ? '20' : '24'}
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{
                        transform: expandedFaq === index ? 'rotate(45deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <path
                        d="M12 5V19M5 12H19"
                        stroke="#000"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
                {expandedFaq === index && (
                  <div style={{
                    padding: isMobile ? '0 16px 20px 16px' : '0 32px 20px 24px',
                  }}>
                    <p style={{
                      fontFamily: "'Gilroy-Medium', sans-serif",
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: 400,
                      color: '#666',
                      lineHeight: 1.6,
                    }}>
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Link */}
          <p style={{
            width: isMobile ? '342px' : 'auto',
            maxWidth: '100%',
            margin: '0 auto',
            marginTop: isMobile ? '32px' : '48px',
            fontFamily: "'Gilroy-MediumItalic', sans-serif",
            fontSize: '20px',
            fontStyle: 'normal',
            fontWeight: 400,
            color: '#000',
            textAlign: 'center',
            lineHeight: '28px',
          }}>
            {pageContent.faqContactText}{' '}
            <Link to="/contact" style={{
              color: '#000',
              fontFamily: "'Gilroy-SemiBoldItalic', sans-serif",
              fontSize: '20px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '28px',
              textDecoration: 'underline',
              textDecorationStyle: 'solid',
            }}>
              {pageContent.faqContactLink}
            </Link>
          </p>
        </section>
      </EditableSection>
      )}

    </div>
  );
};

export default Home;
