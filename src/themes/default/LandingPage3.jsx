import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import useWindowSize from '@/hooks/useWindowSize';
import useThemeColors from '@/hooks/useThemeColors';
import useSmoothScroll from '@/hooks/useSmoothScroll';
import useScrollAnimations from '@/hooks/useScrollAnimations';
import { pagesAPI, contactsAPI } from '@/services/api';
import EditableSection from '@/components/EditableSection';
import HighlightImg from '@/assets/Highligh.png';
import TickMark from '@/assets/Tick mark.png';
import VectorIcon from '@/assets/Vector.png';
import './LandingPage3.css';

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

// Service Icons
const DesignIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 5L35 10L12.5 32.5L5 35L7.5 27.5L30 5Z" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25 10L30 15" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DevelopmentIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 13L5 20L13 27" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M27 13L35 20L27 27" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 8L17 32" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SupportIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="17" r="10" stroke="#000" strokeWidth="2.5"/>
    <path d="M15 17C15 17 17 20 20 20C23 20 25 17 25 17" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="16" cy="14" r="1.5" fill="#000"/>
    <circle cx="24" cy="14" r="1.5" fill="#000"/>
    <path d="M12 30L14 27H26L28 30" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 35H24" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const AppsIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="8" width="30" height="24" rx="2" stroke="#000" strokeWidth="2.5"/>
    <path d="M5 14H35" stroke="#000" strokeWidth="2.5"/>
    <rect x="9" y="18" width="8" height="6" stroke="#000" strokeWidth="2"/>
    <path d="M9 27H17" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    <path d="M23 18H31" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    <path d="M23 22H28" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
    <path d="M23 26H31" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CopywritingIcon = () => (
  <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="5" width="24" height="30" rx="2" stroke="#000" strokeWidth="2.5"/>
    <path d="M13 12H27" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M13 18H27" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M13 24H22" stroke="#000" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const serviceIcons = {
  design: DesignIcon,
  development: DevelopmentIcon,
  support: SupportIcon,
  apps: AppsIcon,
  copywriting: CopywritingIcon,
};

const LandingPage3 = () => {
  const { isMobile, isTablet } = useWindowSize();
  const { getSectionColors, getColor, themeColors } = useThemeColors('landing-page-3');

  // Initialize smooth scrolling and scroll animations (disabled on mobile for performance)
  useSmoothScroll(!isMobile);
  useScrollAnimations(!isMobile);
  // Load cached content instantly from localStorage (10-50ms), then refresh from DB
  const [pageContent, setPageContent] = useState(() => {
    try {
      const cached = localStorage.getItem('lp3_content');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [lp2Content, setLp2Content] = useState(() => {
    try {
      const cached = localStorage.getItem('lp2_content');
      return cached ? JSON.parse(cached) : {};
    } catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchParams] = useSearchParams();
  const isEditorMode = searchParams.get('editor') === 'true';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCaseStudy, setCurrentCaseStudy] = useState(0);
  const [currentFeatureGroup, setCurrentFeatureGroup] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  // Use a single floating-point value for smooth scroll position
  // e.g., 0.0 = card 1 visible, 1.0 = card 2 visible, 1.5 = card 2 visible with card 3 halfway up
  const [scrollPosition, setScrollPosition] = useState(0);
  const [displayPosition, setDisplayPosition] = useState(0); // Smoothly animated position
  const caseStudyStickyRef = useRef(null);
  const caseStudySectionRef = useRef(null);
  const featuresSectionRef = useRef(null);
  const animationRef = useRef(null);
  const footerRef = useRef(null);
  const stickyCtaRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFormSubmitted, setModalFormSubmitted] = useState(false);
  const [modalFormLoading, setModalFormLoading] = useState(false);
  const [modalSource, setModalSource] = useState(''); // Track which button opened the modal
  const [editorColors, setEditorColors] = useState({}); // Colors from editor for live preview

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

  // Case Study swipe handlers - smooth drag tracking
  const [caseStudyTouchX, setCaseStudyTouchX] = useState(null);
  const [caseStudyDragOffset, setCaseStudyDragOffset] = useState(0);
  const [caseStudyIsDragging, setCaseStudyIsDragging] = useState(false);

  const handleCaseStudyTouchStart = (e) => {
    setCaseStudyTouchX(e.touches[0].clientX);
    setCaseStudyIsDragging(true);
    setCaseStudyDragOffset(0);
  };

  const handleCaseStudyTouchMove = (e) => {
    if (caseStudyTouchX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - caseStudyTouchX;
    // Limit drag at edges
    const maxDrag = window.innerWidth * 0.4;
    const limitedDiff = Math.max(-maxDrag, Math.min(maxDrag, diff));
    setCaseStudyDragOffset(limitedDiff);
  };

  const handleCaseStudyTouchEnd = (e) => {
    if (caseStudyTouchX === null) return;
    const diff = caseStudyTouchX - e.changedTouches[0].clientX;
    // Threshold for swipe detection
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentCaseStudy < caseStudies.length - 1) setCurrentCaseStudy(s => s + 1);
      if (diff < 0 && currentCaseStudy > 0) setCurrentCaseStudy(s => s - 1);
    }
    setCaseStudyTouchX(null);
    setCaseStudyDragOffset(0);
    setCaseStudyIsDragging(false);
  };

  const handleCaseStudyWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
      e.preventDefault();
      if (e.deltaX > 0 && currentCaseStudy < caseStudies.length - 1) setCurrentCaseStudy(s => s + 1);
      if (e.deltaX < 0 && currentCaseStudy > 0) setCurrentCaseStudy(s => s - 1);
    }
  };

  // Scroll to section helper
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // WhatsApp URL helper - converts stored format to wa.me link
  const getWhatsAppUrl = (whatsappNumber, defaultMessage = '') => {
    if (!whatsappNumber) return 'https://wa.me/919876543210'; // Fallback

    // Country code mapping for dial codes
    const countryDialCodes = {
      IN: '91', US: '1', GB: '44', AE: '971', SA: '966', AU: '61', CA: '1',
      DE: '49', FR: '33', SG: '65', MY: '60', PH: '63', ID: '62', TH: '66',
      JP: '81', CN: '86', KR: '82', BR: '55', MX: '52', ZA: '27', NG: '234',
      EG: '20', PK: '92', BD: '880', NP: '977', LK: '94', IT: '39', ES: '34',
      NL: '31', RU: '7',
    };

    let fullNumber = '';

    // Check if it's in "CountryCode:PhoneNumber" format (e.g., "IN:9876543210")
    if (whatsappNumber.includes(':')) {
      const [countryCode, phone] = whatsappNumber.split(':');
      const dialCode = countryDialCodes[countryCode] || '91';
      fullNumber = dialCode + phone.replace(/\D/g, '');
    } else {
      // Legacy format - just the number (assume already has country code)
      fullNumber = whatsappNumber.replace(/\D/g, '');
    }

    let url = `https://wa.me/${fullNumber}`;
    if (defaultMessage) {
      url += `?text=${encodeURIComponent(defaultMessage)}`;
    }
    return url;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Modal form state
  const [modalFormData, setModalFormData] = useState({
    companyName: '',
    contactNumber: '',
    service: '',
  });

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalFormLoading(true);
    try {
      await contactsAPI.create({
        name: modalFormData.companyName,
        companyName: modalFormData.companyName,
        phone: modalFormData.contactNumber,
        service: modalFormData.service,
        subject: `Inquiry from ${modalFormData.companyName}`,
        sourcePage: modalSource,
        message: `Contact from ${modalSource}\nCompany: ${modalFormData.companyName}\nPhone: ${modalFormData.contactNumber}\nService: ${modalFormData.service}`,
      });
      setModalFormSubmitted(true);
      setModalFormData({ companyName: '', contactNumber: '', service: '' });

      // Send GA event for popup form - uses modalSource to identify which button
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'form_submission', {
          event_category: 'Contact',
          event_label: modalSource,
          value: 1
        });
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setModalFormSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setModalFormLoading(false);
    }
  };

  const openModal = (source) => {
    setModalSource(source);
    setIsModalOpen(true);
    setModalFormSubmitted(false);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalFormSubmitted(false);
    setModalSource('');
    setModalFormData({ companyName: '', contactNumber: '', service: '' });
  };

  useEffect(() => {
    // Fetch immediately - cached content already showing from localStorage
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
        // Update colors for live preview
        if (event.data.payload?.colors) {
          setEditorColors(event.data.payload.colors);
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

  // Smooth animation loop - interpolates displayPosition towards scrollPosition
  useEffect(() => {
    if (isMobile) return;

    const animate = () => {
      setDisplayPosition(current => {
        const diff = scrollPosition - current;
        // If very close, snap to target
        if (Math.abs(diff) < 0.001) {
          return scrollPosition;
        }
        // Smooth easing - move 15% of the remaining distance each frame
        return current + diff * 0.15;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [scrollPosition, isMobile]);

  // GSAP ScrollTrigger pinning for Case Studies section
  useEffect(() => {
    if (isMobile || !caseStudySectionRef.current) return;

    const caseStudiesData = pageContent.caseStudies || defaultContent.caseStudies || [];
    const numCards = caseStudiesData.length || 1;
    const maxPosition = numCards - 1;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Create ScrollTrigger for pinning the section
      const trigger = ScrollTrigger.create({
        trigger: caseStudySectionRef.current,
        start: 'top top',
        end: () => `+=${numCards * 400}`, // Scroll distance based on number of cards
        pin: true,
        pinSpacing: true,
        scrub: 0.8, // Smooth scrubbing
        anticipatePin: 1,
        onUpdate: (self) => {
          // Map scroll progress (0-1) to card position (0 to maxPosition)
          const newPosition = self.progress * maxPosition;
          setScrollPosition(newPosition);
          setDisplayPosition(newPosition);
        },
      });

      // Refresh ScrollTrigger after setup
      ScrollTrigger.refresh();

      // Store trigger for cleanup
      caseStudySectionRef.current._scrollTrigger = trigger;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (caseStudySectionRef.current?._scrollTrigger) {
        caseStudySectionRef.current._scrollTrigger.kill();
      }
    };
  }, [isMobile, pageContent.caseStudies]);

  const fetchPageContent = async () => {
    try {
      // Fetch both LP3 and LP2 content
      const [lp3Response, lp2Response] = await Promise.all([
        pagesAPI.getOne('landing-page-3'),
        pagesAPI.getOne('landing-page-2'),
      ]);

      if (lp3Response.data?.data?.content) {
        const lp3Data = lp3Response.data.data.content;
        setPageContent(lp3Data);
        // Cache for instant load on next visit
        try { localStorage.setItem('lp3_content', JSON.stringify(lp3Data)); } catch {}
      }
      if (lp2Response.data?.data?.content) {
        const lp2Data = lp2Response.data.data.content;
        setLp2Content(lp2Data);
        try { localStorage.setItem('lp2_content', JSON.stringify(lp2Data)); } catch {}
      }
    } catch {
      // Silent fail - using cached/default content
    }
  };

  const onSubmit = async (data) => {
    setFormLoading(true);
    try {
      await contactsAPI.create({
        ...data,
        subject: `Shopify Store Inquiry from ${data.companyName}`,
        sourcePage: 'LP3 - Contact Form',
        message: `Contact from LP3 - Contact Form\nCompany: ${data.companyName}\nPhone: ${data.phone}\nService: ${data.service}`,
      });
      setFormSubmitted(true);
      reset();

      // Send GA event for bottom form
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'form_submission', {
          event_category: 'Contact',
          event_label: 'LP3 Bottom',
          service: data.service,
          value: 1
        });
      }
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
    heroButtonText: 'GET STARTED',

    // Checkmarks
    checkmark1: '10-Days  Satisfaction Guarantee',
    checkmark2: 'Launch your E-commerce in week',
    checkmark3: '2-3 weeks average delivery',

    // Phone Carousel Settings
    carouselAutoPlay: true,
    carouselSpeed: 1, // seconds between slides

    // Problem Section
    problemTitle: 'Most Shopify stores are built to look good—not to convert—resulting in high bounce rates and lost revenue.',
    understandWhyTitle: 'Understand Why',
    painPoints: [
      { highlight: '20K INR', text: 'trying to customize a Shopify theme' },
      { highlight: '5K INR', text: 'fixing mobile layout issues' },
      { highlight: '10K INR', text: 'improving page speed' },
      { highlight: '3K INR', text: 'installing and configuring apps' },
      { highlight: '4K INR', text: 'fixing broken user journeys' },
      { highlight: '+ ∞ hrs', text: "wondering why visitors aren't converting" },
    ],
    understandWhyConclusion: '= Weeks of lost sales',
    betterWayText: "There's a better way 👇",

    // Solution Section
    solutionTitle: 'Design a Shopify store that actually sells.',
    services: [
      { icon: 'design', text: 'Design' },
      { icon: 'development', text: 'Developement' },
      { icon: 'support', text: 'Support' },
      { icon: 'apps', text: 'Third-Party Apps' },
      { icon: 'copywriting', text: 'Copywriting' },
    ],

    // Features Groups (auto-rotating) - matches services icons order
    featureGroups: [
      {
        title: 'DESIGN:',
        points: [
          'Improve layouts and product pages',
          'customer flow to reduce friction',
          '30+ pre-built UI components & animated sections',
          '20+ flexible themes powered by daisyUI',
        ],
        highlightPoint: 'Money Saved: 20K INR + Time Saved: 20Hrs',
      },
      {
        title: 'DEVELOPMENT:',
        points: [
          'Custom Shopify theme development',
          'Speed optimization & performance',
          'Third-party app integrations',
          'Mobile-first responsive design',
        ],
        highlightPoint: 'Money Saved: 30K INR + Time Saved: 40Hrs',
      },
      {
        title: 'SUPPORT:',
        points: [
          '24/7 technical assistance',
          'Bug fixes and troubleshooting',
          'Regular maintenance updates',
          'Priority response for critical issues',
        ],
        highlightPoint: 'Response Time: Under 2 Hours',
      },
      {
        title: 'THIRD-PARTY APPS:',
        points: [
          'Expert app recommendations',
          'Seamless integration setup',
          'Custom app configurations',
          'Performance monitoring',
        ],
        highlightPoint: 'Apps Integrated: 50+ Popular Shopify Apps',
      },
      {
        title: 'COPYWRITING:',
        points: [
          'Conversion-focused product descriptions',
          'SEO-optimized content',
          'Brand voice development',
          'Email marketing templates',
        ],
        highlightPoint: 'Conversion Boost: +35% Average',
      },
    ],
    featureRotationSpeed: 3, // seconds

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
    plan2ButtonText: 'GET STARTED',

    // Contact Form
    contactTitle: 'Have More Question?',
    contactHighlight: 'Book A Call',
    contactDescription: 'eque leo augue id diam. Turpis id maecenas dui aliquam in nunc nunc mauris.',
    formPlaceholder1: 'COMPANY NAME',
    formPlaceholder2: 'CONTACT NUMBER',
    formPlaceholder3: 'WHAT SERVICE YOU ARE LOOKING FOR?',
    submitButtonText: 'SUBMIT',
    whatsappText: "Need instant response? Let's connect on WhatsApp",

    // Sticky CTA & WhatsApp
    stickyCtaButtonText: 'GET A WEB DESIGN QUOTE',
    queueCount: '05',
    queueText: 'Projects sessions in the queue',
    whatsappNumber: 'IN:9876543210', // Format: "CountryCode:PhoneNumber"
    whatsappDefaultMessage: "Hi, I'm interested in web design services",

    // Footer
    instagramLink: '#',
    facebookLink: '#',
    linkedinLink: '#',
    copyrightText: 'Copyright© 2025 GOTI.DESIGN. All rights reserved.',
    siteUseText: 'Site Use',
    siteUseLink: '#',
  };

  const content = { ...defaultContent, ...pageContent };

  // Auto-rotate features groups - starts when section first enters view, runs continuously after
  const rotationTimerRef = useRef(null);
  const rotationStartedRef = useRef(false);
  const featureGroupsLengthRef = useRef(5); // Default to 5, will be updated

  // Update the length ref when content changes
  useEffect(() => {
    const featureGroups = content.featureGroups || defaultContent.featureGroups || [];
    featureGroupsLengthRef.current = featureGroups.length;
  }, [content.featureGroups]);

  useEffect(() => {
    const startRotation = () => {
      if (rotationStartedRef.current) return;
      rotationStartedRef.current = true;

      const interval = 3000; // 3 seconds

      rotationTimerRef.current = setInterval(() => {
        setCurrentFeatureGroup(prev => (prev + 1) % featureGroupsLengthRef.current);
      }, interval);
    };

    // Use IntersectionObserver to detect when section FIRST enters view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !rotationStartedRef.current) {
            startRotation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    const checkAndObserve = () => {
      if (featuresSectionRef.current) {
        observer.observe(featuresSectionRef.current);
      } else {
        setTimeout(checkAndObserve, 100);
      }
    };
    checkAndObserve();

    return () => {
      observer.disconnect();
    };
  }, []);

  // Premium scroll reveal animations using Intersection Observer
  useEffect(() => {
    const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale, .scroll-reveal-left, .scroll-reveal-right, .image-reveal, .text-reveal');

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          // Optional: unobserve after reveal for performance
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, [loading]); // Re-run when loading changes to catch dynamically loaded content

  // Sticky CTA scroll detection - smooth stop before footer using direct DOM manipulation
  useEffect(() => {
    let ticking = false;

    const updateCtaPosition = () => {
      if (!footerRef.current || !stickyCtaRef.current) return;

      const footerRect = footerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how much the footer is visible
      const footerVisibleAmount = windowHeight - footerRect.top;

      if (footerVisibleAmount > 0) {
        // Footer is visible, push CTA up smoothly
        stickyCtaRef.current.style.transform = `translateY(-${footerVisibleAmount}px)`;
      } else {
        // Footer not visible, CTA at bottom
        stickyCtaRef.current.style.transform = 'translateY(0)';
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateCtaPosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateCtaPosition(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Premium parallax effect for depth perception
  useEffect(() => {
    let ticking = false;

    const updateParallax = () => {
      const scrollY = window.scrollY;
      const parallaxElements = document.querySelectorAll('.parallax-slow, .parallax-medium, .parallax-fast');

      parallaxElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const scrollProgress = (scrollY - elementTop + window.innerHeight) / (window.innerHeight + rect.height);

        if (scrollProgress > 0 && scrollProgress < 1.5) {
          let speed = 0.05;
          if (el.classList.contains('parallax-medium')) speed = 0.1;
          if (el.classList.contains('parallax-fast')) speed = 0.15;

          const yOffset = (scrollProgress - 0.5) * 100 * speed;
          el.style.transform = `translateY(${yOffset}px)`;
        }
      });

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Get carousel settings from content
  const carouselAutoPlay = content.carouselAutoPlay !== false && content.carouselAutoPlay !== 'false';
  const carouselSpeed = parseFloat(content.carouselSpeed) || 1; // Default 1 second

  // Auto-rotate phone carousel (continuous loop) - only if autoPlay is enabled
  useEffect(() => {
    if (!carouselAutoPlay || portfolioImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % portfolioImages.length);
    }, carouselSpeed * 1000); // Convert seconds to milliseconds

    return () => clearInterval(interval);
  }, [portfolioImages.length, carouselAutoPlay, carouselSpeed]);

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
    return <div style={{ minHeight: '100vh', backgroundColor: '#fffdf8' }} />;
  }

  // Get dynamic colors - prioritize editor colors for live preview
  const getColors = (sectionId) => {
    const apiColors = getSectionColors(sectionId);
    const editColors = editorColors[sectionId] || {};
    // In editor mode, merge editor colors on top of API colors
    if (isEditorMode && Object.keys(editColors).length > 0) {
      return { ...apiColors, ...editColors };
    }
    return apiColors;
  };

  const heroColors = getColors('hero');
  const headerColors = getColors('header');
  const problemColors = getColors('problem');
  const solutionColors = getColors('solution');
  const caseStudiesColors = getColors('caseStudies');
  const clientsColors = getColors('clients');
  const pricingColors = getColors('pricing');
  const contactColors = getColors('contact');
  const stickyCtaColors = getColors('stickyCta');
  const footerColors = getColors('footer');

  // Get mobile background color from global colors
  const mobileBackgroundColor = themeColors?.globalColors?.mobileBackgroundColor;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isMobile && mobileBackgroundColor ? mobileBackgroundColor : (heroColors.backgroundColor || '#fffdf8'),
      fontFamily: "'Barlow', 'Inter', sans-serif",
      overflowX: 'hidden',
      scrollBehavior: 'smooth',
    }}>
      {/* Get Started Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: isMobile ? '20px' : '40px',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '24px',
              boxShadow: '8px 8px 0px 0px #150634',
              padding: isMobile ? '32px 24px' : '40px 70px',
              width: '100%',
              maxWidth: isMobile ? '340px' : '580px',
              position: 'relative',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: isMobile ? '10px' : '14px',
                right: isMobile ? '10px' : '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {modalFormSubmitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
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
                  Thank You!
                </h3>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: '16px',
                  color: '#666',
                }}>
                  We'll get back to you soon.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '24px' : '32px',
                alignItems: 'center',
              }}>
                {/* Header */}
                <div style={{
                  textAlign: 'center',
                  maxWidth: '480px',
                }}>
                  <h2 style={{
                    fontFamily: "'Gabarito', sans-serif",
                    fontSize: isMobile ? '26px' : '36px',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    color: '#000',
                    margin: 0,
                  }}>
                    Let's Get Started 🚀
                  </h2>
                  <p style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '13px' : '15px',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    color: '#000',
                    margin: isMobile ? '8px 0 0' : '10px 0 0',
                  }}>
                    Just a few details and we'll help you find the right service for your needs
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleModalSubmit} style={{
                  width: '100%',
                  maxWidth: '440px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '14px' : '16px',
                }}>
                  <input
                    type="text"
                    name="companyName"
                    value={modalFormData.companyName}
                    onChange={handleModalInputChange}
                    placeholder="COMPANY NAME"
                    required
                    className="modal-input"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #000',
                      borderRadius: '14px',
                      boxShadow: '3px 3px 0px 0px #150634',
                      padding: isMobile ? '16px 18px' : '18px 20px',
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: 500,
                      color: '#000',
                      width: '100%',
                    }}
                  />
                  <input
                    type="tel"
                    name="contactNumber"
                    value={modalFormData.contactNumber}
                    onChange={handleModalInputChange}
                    placeholder="CONTACT NUMBER"
                    required
                    className="modal-input"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #000',
                      borderRadius: '14px',
                      boxShadow: '3px 3px 0px 0px #150634',
                      padding: isMobile ? '16px 18px' : '18px 20px',
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: 500,
                      color: '#000',
                      width: '100%',
                    }}
                  />
                  <input
                    type="text"
                    name="service"
                    value={modalFormData.service}
                    onChange={handleModalInputChange}
                    placeholder="WHAT SERVICE YOU ARE LOOKING FOR?"
                    required
                    className="modal-input"
                    style={{
                      backgroundColor: '#fff',
                      border: '1px solid #000',
                      borderRadius: '14px',
                      boxShadow: '3px 3px 0px 0px #150634',
                      padding: isMobile ? '16px 18px' : '18px 20px',
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: 500,
                      color: '#000',
                      width: '100%',
                    }}
                  />

                  {/* Submit Button */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: isMobile ? '6px' : '10px',
                  }}>
                    <button
                      type="submit"
                      disabled={modalFormLoading}
                      className="btn-hover"
                      style={{
                        background: 'linear-gradient(166deg, #170935 23.75%, #000 93.95%)',
                        borderRadius: '770px',
                        padding: isMobile ? '12px 20px' : '12px 18px',
                        border: 'none',
                        cursor: modalFormLoading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        opacity: modalFormLoading ? 0.7 : 1,
                      }}
                    >
                      <span style={{
                        fontFamily: "'Gabarito', sans-serif",
                        fontSize: isMobile ? '15px' : '17px',
                        fontWeight: 600,
                        lineHeight: 1,
                        color: '#fff',
                        textTransform: 'uppercase',
                      }}>
                        {modalFormLoading ? 'SUBMITTING...' : 'GET STARTED'}
                      </span>
                      <div style={{
                        backgroundColor: '#ffa562',
                        borderRadius: '50%',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M1 11L11 1M11 1H3M11 1V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>
                  </div>
                </form>

                {/* WhatsApp Link */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '13px' : '15px',
                    fontWeight: 500,
                    fontStyle: 'italic',
                    color: '#000',
                    margin: 0,
                  }}>
                    Need instant response? Let's connect on{' '}
                    <a
                      href={getWhatsAppUrl(content.whatsappNumber, content.whatsappDefaultMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#000',
                        fontWeight: 600,
                        textDecoration: 'underline',
                      }}
                    >
                      WhatsApp
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header - Lime Green Bar */}
      {shouldRenderSection('header') && (
        <EditableSection
          sectionId="header"
          label="Header"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'header'}
          isHidden={isSectionHidden('header')}
          style={{
            backgroundColor: headerColors.backgroundColor || '#2558BF',
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
              color: headerColors.headingColor || '#fff',
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
          <div
            className="animate-fade-up"
            style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '16px' : '40px',
            maxWidth: isMobile ? '390px' : '954px',
            margin: '0 auto',
          }}>
            {/* Title with Lime Highlight */}
            <div style={{
              position: 'relative',
              width: isMobile ? '354px' : '900px',
            }}>
              <h1 style={{
                fontFamily: "'Gabarito', sans-serif",
                fontSize: isMobile ? '32px' : isTablet ? '48px' : '60px',
                fontWeight: 600,
                lineHeight: '120%',
                color: heroColors.headingColor || '#000',
                textAlign: 'center',
                margin: 0,
                position: 'relative',
                zIndex: 1,
              }}>
                <span style={{ verticalAlign: 'baseline' }}>Your</span>{' '}
                <span style={{
                  color: heroColors.headingColor || '#000',
                  backgroundColor: heroColors.accentColor || '#E1FFA0',
                  padding: isMobile ? '0 10px' : '0 15px',
                  borderRadius: '0',
                  display: 'inline',
                  verticalAlign: 'baseline',
                  fontSize: isMobile ? '32px' : 'inherit',
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
                maxWidth: isMobile ? '378px' : '1100px',
              }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '16px' : '24px',
                  fontWeight: 500,
                  lineHeight: '150%',
                  color: '#000',
                  textAlign: 'center',
                  margin: 0,
                }}>
                  {content.heroSubtitle}
                </p>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '16px' : '24px',
                  fontWeight: 500,
                  lineHeight: '150%',
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
                      lineHeight: '150%',
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
              width: 'auto',
              marginTop: isMobile ? '8px' : '0',
            }}>
              <button
                className="btn-hover"
                onClick={() => openModal('LP3 - Hero Button')}
                style={{
                background: 'linear-gradient(166deg, #170935 23.75%, #000 93.95%)',
                borderRadius: isMobile ? '630.925px' : '905.76px',
                width: 'auto',
                height: isMobile ? '47px' : '68px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '12px' : '20px',
                padding: isMobile ? '0 15px' : '0 14px 0 28px',
                cursor: 'pointer',
              }}>
                <span style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '16px' : '24px',
                  fontWeight: 600,
                  color: heroColors.buttonText || '#fff',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}>
                  {content.heroButtonText}
                </span>
                <div style={{
                  backgroundColor: '#ffa562',
                  borderRadius: '50%',
                  width: isMobile ? '32px' : '44px',
                  height: isMobile ? '32px' : '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 12 12" fill="none">
                    <path d="M1 11L11 1M11 1H3M11 1V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </EditableSection>
      )}

      {/* Phone Carousel Section */}
      {shouldRenderSection('phoneCarousel') && (
        <div className="scroll-reveal-scale">
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
                          width={180}
                          height={390}
                          loading={index === 0 ? 'eager' : 'lazy'}
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
                          width={300}
                          height={629}
                          loading={Math.abs(index - currentSlide) <= 1 ? 'eager' : 'lazy'}
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
        </div>
      )}

      {/* Problem Section */}
      {shouldRenderSection('problem') && (
        <div className="animate-fade-up">
        <EditableSection
          sectionId="problem"
          label="Problem Section"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'problem'}
          isHidden={isSectionHidden('problem')}
          style={{
            padding: isMobile ? '40px 20px' : '80px 120px',
            textAlign: 'center',
            backgroundColor: problemColors.backgroundColor || 'transparent',
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
            backgroundColor: isMobile
              ? (problemColors.cardBackgroundMobile || problemColors.cardBackground || '#FFFFFF')
              : (problemColors.cardBackground || '#FFFFFF'),
            borderRadius: '16px',
            padding: isMobile ? '24px 16px' : '32px 40px',
            maxWidth: isMobile ? '390px' : '500px',
            margin: '0 auto 40px',
            textAlign: 'center',
            border: isMobile ? 'none' : `1px solid ${problemColors.cardBorderColor || '#000000'}`,
            boxShadow: isMobile ? 'none' : '4px 4px 0px 0px #150634',
          }}>
            <h3 style={{
              fontFamily: "'Gabarito', sans-serif",
              fontSize: isMobile ? '22px' : '24px',
              fontWeight: 600,
              lineHeight: 1.2,
              color: isMobile
                ? (problemColors.cardHeadingColorMobile || problemColors.headingColor || '#1f1f1f')
                : (problemColors.headingColor || '#1f1f1f'),
              marginBottom: '24px',
            }}>
              {content.understandWhyTitle}
            </h3>
            <div style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: isMobile ? '16px' : '20px',
              fontWeight: 500,
              lineHeight: '150%',
              color: isMobile
                ? (problemColors.cardTextColorMobile || problemColors.textColor || '#1f1f1f')
                : (problemColors.textColor || '#1f1f1f'),
              textAlign: 'center',
            }}>
              {ensureArray(content.painPoints, defaultContent.painPoints).map((item, index) => (
                <p key={index} style={{ margin: '0 0 6px' }}>
                  <span style={{
                    backgroundColor: problemColors.accentColor || '#FFA562',
                    color: problemColors.highlightColor || '#7F3600',
                    fontWeight: 700,
                  }}>
                    {item.highlight}
                  </span>
                  {' '}{item.text}
                </p>
              ))}
              <p style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: 600,
                marginTop: '20px',
                color: isMobile
                  ? (problemColors.cardTextColorMobile || problemColors.textColor || '#1f1f1f')
                  : (problemColors.textColor || '#1f1f1f'),
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
        </div>
      )}

      {/* Solution Section - Combined with Features (auto-rotating) */}
      {shouldRenderSection('solution') && (() => {
        const featureGroups = content.featureGroups || defaultContent.featureGroups || [];
        const currentGroup = featureGroups[currentFeatureGroup] || featureGroups[0];
        const services = ensureArray(content.services, defaultContent.services);

        return (
          <div ref={featuresSectionRef} className="scroll-reveal-scale">
          <EditableSection
            sectionId="solution"
            label="Solution Section"
            isEditorMode={isEditorMode}
            isSelected={selectedSection === 'solution'}
            isHidden={isSectionHidden('solution')}
            style={{
              backgroundColor: solutionColors.backgroundColor || 'transparent',
            }}
          >
            {/* Title and Icons - White background */}
            <div style={{
              padding: isMobile ? '60px 20px 40px' : '60px 120px',
              textAlign: 'center',
            }}>
              <h2 style={{
                fontFamily: "'Gabarito', sans-serif",
                fontSize: isMobile ? '22px' : '32px',
                fontStyle: 'normal',
                fontWeight: 600,
                lineHeight: '120%',
                color: '#000',
                textAlign: 'center',
                marginBottom: isMobile ? '32px' : '48px',
                maxWidth: isMobile ? '358px' : 'none',
                margin: isMobile ? '0 auto 32px' : '0 auto 48px',
              }}>
                {content.solutionTitle}
              </h2>
              {/* Services Grid - Icons with active state */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: isMobile ? '24px 32px' : '40px 64px',
                maxWidth: '900px',
                margin: '0 auto',
              }}>
                {services.map((service, index) => {
                  const IconComponent = service.icon ? (serviceIcons[service.icon] || null) : null;
                  const isActive = index === currentFeatureGroup;
                  return (
                    <div
                      key={index}
                      onClick={() => setCurrentFeatureGroup(index)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: isMobile ? '80px' : '100px',
                        cursor: 'pointer',
                        opacity: isActive ? 1 : 0.4,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      {service.iconImage ? (
                        <img
                          src={service.iconImage}
                          alt={service.text}
                          style={{
                            width: isMobile ? '28px' : '34.971px',
                            height: isMobile ? '28px' : '34.971px',
                            objectFit: 'contain',
                            filter: isActive ? 'none' : 'grayscale(100%)',
                          }}
                        />
                      ) : IconComponent ? (
                        <div style={{
                          width: isMobile ? '28px' : '34.971px',
                          height: isMobile ? '28px' : '34.971px',
                          opacity: isActive ? 1 : 0.5,
                        }}>
                          <IconComponent />
                        </div>
                      ) : (
                        <div style={{
                          width: isMobile ? '28px' : '34.971px',
                          height: isMobile ? '28px' : '34.971px',
                          backgroundColor: isActive ? '#000' : '#e5e7eb',
                          borderRadius: '8px',
                        }} />
                      )}
                      <span style={{
                        fontFamily: "'Barlow', sans-serif",
                        fontSize: isMobile ? '14px' : '18px',
                        fontStyle: 'normal',
                        fontWeight: isActive ? 600 : 500,
                        lineHeight: 'normal',
                        color: '#000',
                        textAlign: 'center',
                      }}>
                        {service.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features Content - Gray background */}
            {currentGroup && (
              <div style={{
                backgroundColor: content.pointsBackgroundImage ? 'transparent' : (solutionColors.pointsBackground || 'rgba(242, 240, 235, 0.80)'),
                backgroundImage: content.pointsBackgroundImage ? `url(${content.pointsBackgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: isMobile ? '30px 20px' : '50px 120px',
                minHeight: isMobile ? 'auto' : '257px',
                border: solutionColors.pointsBorderColor ? `1px solid ${solutionColors.pointsBorderColor}` : 'none',
              }}>
                <div
                  key={currentFeatureGroup}
                  style={{
                    maxWidth: isMobile ? '100%' : '959px',
                    width: '100%',
                    margin: '0 auto',
                    animation: 'fadeInContent 0.4s ease-out',
                  }}
                >
                  <style>
                    {`
                      @keyframes fadeInContent {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}
                  </style>
                  {/* Group Title */}
                  <h3 style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '18px' : '22px',
                    fontWeight: 700,
                    lineHeight: '150%',
                    color: solutionColors.pointsTextColor || solutionColors.textColor || '#000',
                    marginBottom: isMobile ? '16px' : '20px',
                  }}>
                    {currentGroup.title}
                  </h3>

                  {/* Points List */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '8px' : '12px',
                  }}>
                    {(currentGroup.points || []).map((point, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                        }}
                      >
                        <span style={{
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: isMobile ? '16px' : '20px',
                          fontWeight: 500,
                          lineHeight: '150%',
                          color: solutionColors.pointsTextColor || solutionColors.textColor || '#000',
                        }}>
                          {point}
                        </span>
                      </div>
                    ))}

                    {/* Highlight Point (last point, bold) */}
                    {currentGroup.highlightPoint && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                      }}>
                        <span style={{
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: isMobile ? '16px' : '20px',
                          fontWeight: 700,
                          lineHeight: '150%',
                          color: '#311900',
                          backgroundColor: solutionColors.lastPointHighlight || '#FFA562',
                          padding: '2px 8px',
                          borderRadius: '0',
                        }}>
                          {currentGroup.highlightPoint}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </EditableSection>
          </div>
        );
      })()}

      {/* Case Studies Section - Sticky Scroll Animation */}
      {shouldRenderSection('caseStudies') && (
        <div
          ref={caseStudySectionRef}
          style={{
            backgroundColor: '#EFEBE2',
            minHeight: isMobile ? 'auto' : '100vh',
            position: 'relative',
            zIndex: 10,
          }}
        >
        <EditableSection
          sectionId="caseStudies"
          label="Case Studies"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'caseStudies'}
          isHidden={isSectionHidden('caseStudies')}
          style={{
            padding: isMobile ? '20px 20px' : '5px 120px 40px',
          }}
        >
          {/* Cards container wrapper for vertical centering */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: isMobile ? 'auto' : 'calc(100vh - 80px)',
            }}
          >
          {/* Cards container - natural height, no scroll runway */}
          <div
            ref={caseStudyStickyRef}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: isMobile ? '100%' : '989px',
              margin: '0 auto',
              // Natural height based on card aspect ratio
              height: isMobile ? 'auto' : '530px',
              overflow: isMobile ? 'hidden' : 'visible',
            }}
          >
            {/* Mobile: Sliding cards container */}
            {isMobile && caseStudies.length > 0 && (
              <div
                onTouchStart={handleCaseStudyTouchStart}
                onTouchMove={handleCaseStudyTouchMove}
                onTouchEnd={handleCaseStudyTouchEnd}
                onWheel={handleCaseStudyWheel}
                style={{
                  display: 'flex',
                  transition: caseStudyIsDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  transform: `translateX(calc(-${currentCaseStudy * 100}% + ${caseStudyDragOffset}px))`,
                  paddingTop: '24px',
                  cursor: caseStudyIsDragging ? 'grabbing' : 'grab',
                  touchAction: 'pan-y',
                }}
              >
                {caseStudies.map((study, studyIndex) => (
                  <div
                    key={study.id || studyIndex}
                    style={{
                      minWidth: '100%',
                      flexShrink: 0,
                      padding: '0 20px 12px 20px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Mobile Case Study Card - SVG folder tab design (same as desktop) */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '290px',
                      transform: 'translateX(-2px)',
                    }}>
                      {/* SVG Container with integrated tab - Mobile version */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 388 580"
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
                          <filter id={`mobile_shadow_${studyIndex}`} x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
                            <feDropShadow dx="4" dy="4" stdDeviation="0" floodColor="#150634" floodOpacity="1"/>
                          </filter>
                        </defs>
                        {/* Main card body with folder tab cutout - wider tab */}
                        <path
                          d="M1 548V42C1 37 1 34.5 2 32.5C3 30.5 4.5 28.5 6.5 27.5C8.5 26.5 11 26.5 16 26.5H25L45 27C47.5 27 49 27 50 26.7C53.5 25.8 56 23 56.8 19.5C57 18.5 57 17 57 14C57 11 57 9.5 57.3 8.5C58 5 60.5 2 64 1.3C65 1 66.5 1 69 1H150C153 1 154.5 1 156 1.5C157.5 2 159 2.8 160 4C161 5.2 161.8 7 163 10L167 18C168.5 21.5 169.5 23.5 171 25C172.5 26.5 174 27.5 176 28C178 28.5 180 28.5 184 28.5H372C377 28.5 380 28.5 382.5 29.5C385 30.5 386.5 32 388 34.5C389 37 387 39.5 387 44.5V549C387 554 387 557 386 559.5C385 562 383.5 564 381 565.5C378.5 567 376 567 371 567H17C12 567 9 567 6.5 566C4 565 2.5 563.5 1.5 561C0.5 558.5 1 556 1 551V548Z"
                          fill="white"
                          filter={`url(#mobile_shadow_${studyIndex})`}
                          vectorEffect="non-scaling-stroke"
                        />
                        {/* Border stroke - wider tab */}
                        <path
                          d="M150 0.5C153 0.5 154.8 0.5 156.3 1C158 1.6 159.5 2.5 160.7 3.8C162 5.2 162.8 7.2 164 10.5L168 18.5C169.3 21.5 170.3 23.5 171.6 24.8C173 26.2 174.6 27.2 176.4 27.7C178.3 28.3 180.5 28.3 184 28H372C376.5 28 379.5 28 381.8 29C384 30 386 31.5 387.3 33.8C388.5 36 388 38.5 388 43.5V549C388 554 388 557.2 387 559.8C386 562.2 384.2 564.3 381.8 565.8C379.3 567.2 376.5 567.2 372 567H17C12.5 567.2 9.5 567.2 7 566C4.5 564.8 2.8 563 1.8 560.5C0.8 558 1 555 1 550V42C1 37.5 1 34.8 2 32.3C3 29.8 4.8 27.8 7 26.5C9.3 25.2 12 25.2 17 25.5L46 26C48.5 26 50 26 51 25.6C54 24.8 56.3 22.5 57 19.5C57.3 18.3 57.3 17 57.3 13.5C57.3 10 57.3 8.5 57.7 7.3C58.5 4 61 1.7 64.3 1C65.5 0.7 67 0.5 70 0.5H150Z"
                          stroke="black"
                          strokeWidth="1"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      {/* Tab Label - positioned in the folder tab area */}
                      <span style={{
                        position: 'absolute',
                        top: '1.5%',
                        left: '50px',
                        fontFamily: "'Barlow', sans-serif",
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#000',
                        whiteSpace: 'nowrap',
                        zIndex: 2,
                      }}>
                        {study.label || `Case Study ${studyIndex + 1}`}
                      </span>

                      {/* Main Card Content */}
                      <div style={{
                        position: 'relative',
                        padding: '38px 16px 16px',
                        aspectRatio: '388 / 580',
                      }}>
                        {/* Brand */}
                        <p style={{
                          fontFamily: "'Archivo Black', sans-serif",
                          fontSize: '22px',
                          fontWeight: 400,
                          lineHeight: 'normal',
                          letterSpacing: '-0.5px',
                          color: '#000',
                          margin: 0,
                        }}>
                          {study.brand || 'GOTI'}
                        </p>

                        {/* Title */}
                        <h3 style={{
                          fontFamily: "'Gabarito', sans-serif",
                          fontSize: '18px',
                          fontWeight: 600,
                          lineHeight: 1.3,
                          color: '#000',
                          margin: '10px 0',
                        }}>
                          {study.title}
                        </h3>

                        {/* Description */}
                        <p style={{
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: '13px',
                          fontWeight: 400,
                          lineHeight: 1.5,
                          color: '#444',
                          margin: 0,
                        }}>
                          {study.description}
                        </p>

                        {/* Metrics */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '14px',
                        }}>
                          {ensureArray(study.metrics, defaultContent.caseStudies[0].metrics).map((metric, mIndex) => (
                            <div
                              key={mIndex}
                              style={{
                                backgroundColor: 'rgba(255,138,53,0.08)',
                                borderRadius: '8px',
                                padding: '8px 4px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <span style={{
                                fontFamily: "'Barlow', sans-serif",
                                fontSize: '10px',
                                fontWeight: 400,
                                color: '#666',
                                lineHeight: 1,
                                textAlign: 'center',
                              }}>
                                {metric.label}
                              </span>
                              <span style={{
                                fontFamily: "'Gabarito', sans-serif",
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: 1.2,
                                color: '#000',
                                marginTop: '2px',
                              }}>
                                {metric.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Image */}
                        <div style={{
                          width: '100%',
                          height: '140px',
                          backgroundColor: '#d9d9d9',
                          borderRadius: '8px',
                          marginTop: '14px',
                          overflow: 'hidden',
                        }}>
                          {study.image && (
                            <img
                              src={study.image}
                              alt={study.brand}
                              width={320}
                              height={140}
                              loading="lazy"
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
                  </div>
                ))}
              </div>
            )}

            {/* Desktop: Stacked cards with scroll animation */}
            {!isMobile && caseStudies.length > 0 && caseStudies.map((study, studyIndex) => {
              // Calculate smooth progress-based transforms using displayPosition (animated)
              // displayPosition: 0 = first card, 1 = second card, 1.5 = second card with third halfway visible, etc.
              const cardRevealPosition = displayPosition - (studyIndex - 1);
              let translateY = 0;

              if (studyIndex === 0) {
                // First card is always visible
                translateY = 0;
              } else if (cardRevealPosition >= 1) {
                // Card is fully revealed
                translateY = 0;
              } else if (cardRevealPosition > 0) {
                // Card is partially revealed (0 to 1 progress)
                translateY = 100 - (cardRevealPosition * 100);
              } else {
                // Card is not yet revealed (hidden below)
                translateY = 100;
              }

              return (
                <div
                  key={study.id || studyIndex}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    // Smooth progressive slide - using will-change for GPU acceleration
                    transform: `translateY(${translateY}%)`,
                    willChange: 'transform',
                    // Later cards stack on top (higher index = higher z-index)
                    zIndex: studyIndex + 1,
                    // Always fully opaque - no transparency
                    opacity: 1,
                  }}
                >
                  {/* Desktop Case Study Card Layout */}
                  <>
                      {/* SVG Container with integrated tab */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 989 493"
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
                        top: '5%',
                        left: '10%',
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
                          width: '380px',
                          height: '330px',
                          backgroundColor: '#D9D9D9',
                          border: '1px solid #BFBFBF',
                          borderRadius: '24px',
                          flexShrink: 0,
                          overflow: 'hidden',
                          marginTop: '-10px',
                          marginRight: '20px',
                        }}>
                          {study.image && (
                            <img
                              src={study.image}
                              alt={study.brand}
                              width={380}
                              height={330}
                              loading="lazy"
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
          </div>
        </EditableSection>
        </div>
      )}

      {/* Clients Marquee Section - Fetches logos from Landing Page 2 */}
      {shouldRenderSection('clients') && (() => {
        // Get client logos from LP2, fallback to LP3 or default
        const lp2ClientLogos = lp2Content.clientLogos || [];
        const lp2HasLogos = lp2ClientLogos.length > 0;

        // Default client names for fallback
        const defaultClientNames = ['Tomattic', 'Wealthsimple', 'SpaceX', 'Gusto', 'Attentive', 'Square', 'Dribbble', 'Drips', 'Dropbox', 'Sonic'];

        return (
          <div className="scroll-reveal">
          <EditableSection
            sectionId="clients"
            label="Clients Section (Data from Landing Page 2)"
            isEditorMode={isEditorMode}
            isSelected={selectedSection === 'clients'}
            isHidden={isSectionHidden('clients')}
            style={{
              padding: isMobile ? '40px 20px' : '60px 0',
              backgroundColor: clientsColors.backgroundColor || 'transparent',
            }}
          >
            {/* Heading */}
            <h2 style={{
              fontFamily: "'Gabarito', sans-serif",
              fontSize: isMobile ? '28px' : '46px',
              fontWeight: 600,
              lineHeight: '120%',
              color: '#000',
              textAlign: 'center',
              marginBottom: isMobile ? '30px' : '50px',
            }}>
              Our Shopify Clients
            </h2>

            {/* Two Row Marquee */}
            {[0, 1].map((rowIndex) => {
              // For row 1, use first half; for row 2, use second half or shift
              const items = lp2HasLogos ? lp2ClientLogos : defaultClientNames;
              const repeatedItems = [...items, ...items, ...items, ...items];

              return (
                <div
                  key={rowIndex}
                  style={{
                    overflow: 'hidden',
                    marginBottom: isMobile ? '24px' : '65px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? '30px' : '60px',
                    animation: `marquee${rowIndex === 0 ? '' : 'Reverse'} ${25 + rowIndex * 5}s linear infinite`,
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
                          padding: isMobile ? '8px' : '12px',
                        }}
                      >
                        {lp2HasLogos && typeof item === 'string' && item.includes('/uploads/') ? (
                          <img
                            src={item.startsWith('http') ? item : `${import.meta.env.VITE_API_URL || ''}${item}`}
                            alt={`Client ${index + 1}`}
                            width={100}
                            height={55}
                            loading="lazy"
                            style={{
                              height: isMobile ? '35px' : '55px',
                              width: 'auto',
                              objectFit: 'contain',
                              filter: 'grayscale(100%)',
                              opacity: 0.7,
                            }}
                          />
                        ) : lp2HasLogos && typeof item === 'object' && item.url ? (
                          <img
                            src={item.url.startsWith('http') ? item.url : `${import.meta.env.VITE_API_URL || ''}${item.url}`}
                            alt={item.name || `Client ${index + 1}`}
                            width={100}
                            height={55}
                            loading="lazy"
                            style={{
                              height: isMobile ? '35px' : '55px',
                              width: 'auto',
                              objectFit: 'contain',
                              filter: 'grayscale(100%)',
                              opacity: 0.7,
                            }}
                          />
                        ) : (
                          <span style={{
                            fontFamily: "'Inter', sans-serif",
                            fontSize: isMobile ? '16px' : '24px',
                            fontWeight: 500,
                            color: '#888',
                            whiteSpace: 'nowrap',
                          }}>
                            {typeof item === 'object' ? item.name : item}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Editor mode note */}
            {isEditorMode && (
              <div style={{
                textAlign: 'center',
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                marginTop: '20px',
                border: '1px dashed #3b82f6',
              }}>
                <span style={{ fontSize: '13px', color: '#1d4ed8' }}>
                  ℹ️ Client logos are fetched from Landing Page 2. Edit them there.
                </span>
              </div>
            )}
          </EditableSection>
          </div>
        );
      })()}

      {/* Pricing Section */}
      {shouldRenderSection('pricing') && (
        <div className="scroll-reveal-scale">
        <EditableSection
          sectionId="pricing"
          label="Pricing Section"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'pricing'}
          isHidden={isSectionHidden('pricing')}
          id="pricing-section"
          style={{
            padding: isMobile ? '40px 20px' : '80px 120px',
            position: 'relative',
            backgroundColor: pricingColors.backgroundColor || 'transparent',
          }}
        >
          {/* Header - Side by side layout */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: isMobile ? '24px' : '60px',
            maxWidth: '1200px',
            margin: isMobile ? '0 auto 24px' : '0 auto 60px',
            gap: isMobile ? '13px' : '40px',
          }}>
            {/* Left - Title */}
            <div style={{ maxWidth: isMobile ? '100%' : '488px', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div style={{
                  position: 'absolute',
                  backgroundColor: pricingColors.accentColor || '#2558bf',
                  height: isMobile ? '29px' : '55px',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 0,
                }} />
                <h2 style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '28px' : '46px',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  color: pricingColors.headingColor || '#000',
                  margin: 0,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <span style={{ color: '#fff' }}>{content.pricingTitle || 'Stuck at 7 figures/year?'}</span>
                </h2>
              </div>
              <h2 style={{
                fontFamily: "'Gabarito', sans-serif",
                fontSize: isMobile ? '28px' : '46px',
                fontWeight: 600,
                lineHeight: 1.2,
                color: pricingColors.headingColor || '#000',
                margin: 0,
              }}>
                {content.pricingSubtitle || 'Not for long'}
              </h2>
            </div>
            {/* Right - Description */}
            <p style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: isMobile ? '14px' : '18px',
              fontWeight: 400,
              lineHeight: 1.5,
              color: '#000',
              maxWidth: isMobile ? '100%' : '541px',
              margin: 0,
            }}>
              {content.pricingDescription || "You need a design system that's built for performance—one that improves user experience, increases conversions, and helps your brand grow consistently."}
            </p>
          </div>

          {/* Pricing Cards Container */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '40px' : '0',
            maxWidth: '1200px',
            margin: '0 auto',
            alignItems: isMobile ? 'center' : 'flex-start',
            position: 'relative',
          }}>
            {/* Plan 1 - Green Card (Main/Popular) */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              marginTop: '80px',
            }}>
              {/* "Most Popular" Label with Arrow - Desktop - Points to white card */}
              {!isMobile && (
                <div style={{
                  position: 'absolute',
                  top: '-75px',
                  right: '-290px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  zIndex: 10,
                }}>
                  {/* Arrow pointing to white card */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="128" height="36" viewBox="0 0 128 36" fill="none" style={{ marginBottom: '5px', marginLeft: '-20px' }}>
                    <path d="M1.80713 35.38C0.978872 35.397 0.293694 34.7393 0.276735 33.9111L0.00033106 20.4139C-0.0166279 19.5856 0.641056 18.9005 1.46931 18.8835C2.29757 18.8665 2.98274 19.5242 2.9997 20.3525L3.24539 32.35L15.2429 32.1043C16.0711 32.0873 16.7563 32.745 16.7733 33.5733C16.7902 34.4015 16.1326 35.0867 15.3043 35.1036L1.80713 35.38ZM124.277 24.8796L122.944 24.191C125.124 19.9732 125.366 16.6276 124.39 13.9901C123.404 11.3277 121.055 9.05631 117.364 7.26279C109.937 3.65439 97.7715 2.32921 83.655 3.31639C69.5975 4.29944 53.8299 7.55945 39.3392 12.9135C24.8321 18.2736 11.7162 25.6911 2.85857 34.9191L1.77642 33.8804L0.694267 32.8416C9.98032 23.1673 23.5542 15.5475 38.2995 10.0994C53.0612 4.64527 69.1087 1.3263 83.4457 0.323699C97.7236 -0.674772 110.532 0.607713 118.675 4.56445C122.769 6.55351 125.854 9.30402 127.203 12.9485C128.562 16.6178 128.04 20.8639 125.609 25.5683L124.277 24.8796Z" fill="black"/>
                  </svg>
                  {/* Text - Two rows: MOST POPULAR / FOR GROWING STORES */}
                  <div style={{
                    transform: 'rotate(-0.464deg)',
                    color: '#000',
                    fontFamily: '"Caveat Brush", cursive',
                    fontSize: '32px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: '1.1',
                    marginLeft: '65px',
                  }}>
                    <div>MOST POPULAR</div>
                    <div>FOR GROWING STORES</div>
                  </div>
                </div>
              )}

              {/* "Most Popular" Label with Arrow - Mobile */}
              {isMobile && (
                <div style={{
                  position: 'absolute',
                  top: '-80px',
                  right: '0px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  zIndex: 10,
                }}>
                  {/* Arrow pointing to card - Mobile version */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="70" height="45" viewBox="0 0 97 60" fill="none" style={{ marginRight: '5px', position: 'relative', top: '-10px', left: '25px' }}>
                    <path d="M9.02364 59.1962C8.30694 59.6117 7.38911 59.3676 6.97361 58.6509L0.202585 46.9717C-0.212913 46.255 0.0312489 45.3372 0.747942 44.9217C1.46463 44.5062 2.38246 44.7503 2.79796 45.467L8.81664 55.8485L19.1981 49.8298C19.9148 49.4143 20.8327 49.6585 21.2482 50.3752C21.6637 51.0919 21.4195 52.0097 20.7028 52.4252L9.02364 59.1962ZM95.1663 11.9872L93.6717 12.1135C93.389 8.76808 92.1187 6.56303 90.2237 5.15956C88.2794 3.71963 85.4842 2.98079 81.9196 3.00038C74.7705 3.03969 65.1561 6.12856 55.1496 11.3706C45.1793 16.5937 34.9813 23.8698 26.6846 32.0989C18.369 40.3468 12.0729 49.4426 9.72088 58.2842L8.2713 57.8985L6.82171 57.5129C9.36595 47.9489 16.0674 38.4041 24.572 29.9689C33.0955 21.5149 43.5405 14.0655 53.7574 8.71321C63.9381 3.37992 74.0551 0.0435748 81.9031 0.000429219C85.8371 -0.0211982 89.3568 0.784423 92.0092 2.74873C94.7107 4.74949 96.3186 7.80845 96.661 11.8609L95.1663 11.9872Z" fill="black"/>
                  </svg>
                  {/* Text - Two rows: MOST POPULAR / FOR GROWING STORES - Mobile */}
                  <div style={{
                    transform: 'rotate(-0.464deg)',
                    color: '#000',
                    fontFamily: '"Caveat Brush", cursive',
                    fontSize: '18px',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    lineHeight: '1.1',
                    marginTop: '25px',
                  }}>
                    <div>MOST POPULAR</div>
                    <div>FOR GROWING STORES</div>
                  </div>
                </div>
              )}

              <div style={{
                backgroundColor: pricingColors.card1Background || '#e1ffa0',
                border: isMobile ? `2px solid ${pricingColors.card1BorderColor || '#000'}` : `2.67px solid ${pricingColors.card1BorderColor || '#000'}`,
                borderRadius: isMobile ? '16px' : '21px',
                boxShadow: isMobile ? '4px 4px 0px 0px #150634, 0px 25px 50px 0px rgba(0,0,0,0.25)' : '5.34px 5.34px 0px 0px #150634, 0px 25px 50px 0px rgba(0,0,0,0.25)',
                padding: isMobile ? '20px 18px' : '32px 38px',
                width: isMobile ? '100%' : '622px',
                maxWidth: isMobile ? '358px' : 'none',
                height: isMobile ? 'auto' : 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Price Header */}
                <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                  <p style={{
                    fontFamily: "'Gabarito', sans-serif",
                    fontSize: isMobile ? '16px' : '21px',
                    fontWeight: 700,
                    color: '#000',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}>
                    <span style={{ fontWeight: 400 }}>Starts from</span> <span style={{ fontSize: isMobile ? '24px' : '32px' }}>{content.plan1Price || '$XX / MONTH'}</span>
                  </p>
                  <p style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '13px' : '16px',
                    fontWeight: 400,
                    lineHeight: 1.4,
                    color: '#000',
                    margin: '8px 0 0',
                  }}>
                    {content.plan1Subtitle || 'Everything you need to scale faster.'}
                  </p>
                </div>

                {/* Divider */}
                <div style={{
                  height: '1.5px',
                  backgroundColor: '#000',
                  margin: isMobile ? '0 0 16px' : '0 0 20px',
                  opacity: 0.3,
                  borderStyle: 'dashed',
                }} />

                {/* What do you receive */}
                <div style={{ marginBottom: isMobile ? '20px' : '24px' }}>
                  <p style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '18px' : '24px',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: '#000',
                    margin: isMobile ? '0 0 12px' : '0 0 16px',
                  }}>
                    What do you receive
                  </p>
                  <div style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '14px' : '20px',
                    fontWeight: 500,
                    lineHeight: 1.6,
                    color: '#000',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '4px' : '6px',
                  }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><img src={TickMark} alt="✓" style={{ width: '18px', height: '18px' }} /> Custom Shopify Theme Development</p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><img src={TickMark} alt="✓" style={{ width: '18px', height: '18px' }} /> Responsive Mobile Optimization</p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><img src={TickMark} alt="✓" style={{ width: '18px', height: '18px' }} /> SEO Setup & Optimization</p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><img src={TickMark} alt="✓" style={{ width: '18px', height: '18px' }} /> Product Page Templates</p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><img src={TickMark} alt="✓" style={{ width: '18px', height: '18px' }} /> Shopping Cart & Checkout Customization</p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><img src={TickMark} alt="✓" style={{ width: '18px', height: '18px' }} /> 30 Days Post-Launch Support</p>
                  </div>
                </div>

                {/* White Inner Box - HOW IS THIS RIGHT FOR YOU? */}
                <div style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: isMobile ? '16px' : '16px 28px 24px',
                }}>
                  <p style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '16px' : '20px',
                    fontWeight: 600,
                    lineHeight: 1.4,
                    color: '#000',
                    margin: isMobile ? '0 0 14px' : '0 0 16px',
                  }}>
                    HOW IS THIS RIGHT FOR YOU?
                  </p>
                  <div style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: isMobile ? '14px' : '18px',
                    fontWeight: 400,
                    lineHeight: 1.6,
                    color: '#000',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '12px' : '16px',
                  }}>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <img src={TickMark} alt="✓" style={{ width: '18px', height: '18px', marginTop: '4px' }} /> <span>Generates <strong>$50K+ in monthly revenue</strong></span>
                    </p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <img src={TickMark} alt="✓" style={{ width: '18px', height: '18px', marginTop: '4px' }} /> <span>Actively investing in <strong>marketing or paid ads</strong></span>
                    </p>
                    <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <img src={TickMark} alt="✓" style={{ width: '18px', height: '18px', marginTop: '4px' }} /> <span>Companies looking to <strong>improve conversion and scale faster</strong></span>
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 'auto',
                  paddingTop: isMobile ? '16px' : '20px',
                }}>
                  <button
                    className="btn-hover"
                    onClick={() => openModal('LP3 - Plan 1 Button')}
                    style={{
                      background: 'linear-gradient(166deg, #170935 23.75%, #000 93.95%)',
                      borderRadius: '770px',
                      padding: isMobile ? '14px 24px' : '12px 18px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                    }}>
                    <span style={{
                      fontFamily: "'Gabarito', sans-serif",
                      fontSize: isMobile ? '16px' : '20px',
                      fontWeight: 600,
                      lineHeight: 1,
                      color: '#fff',
                      textTransform: 'uppercase',
                    }}>
                      {content.plan1ButtonText || 'GET STARTED'}
                    </span>
                    <div style={{
                      backgroundColor: '#ffa562',
                      borderRadius: '50%',
                      padding: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M1 11L11 1M11 1H3M11 1V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Plan 2 - White Card (Starter) */}
            <div style={{
              backgroundColor: pricingColors.card2Background || '#fff',
              border: `2px solid ${pricingColors.card2BorderColor || '#000'}`,
              borderRadius: '16px',
              boxShadow: '4px 4px 0px 0px #150634',
              padding: isMobile ? '18px 16px' : '35px 50px 35px 50px',
              width: isMobile ? '100%' : '578px',
              maxWidth: isMobile ? '310px' : 'none',
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 1,
              marginTop: isMobile ? '0' : '156px',
              marginLeft: isMobile ? 'auto' : '-30px',
              marginRight: isMobile ? 'auto' : '0',
            }}>
              {/* Price Header */}
              <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
                <p style={{
                  fontFamily: "'Gabarito', sans-serif",
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: 700,
                  color: '#000',
                  textTransform: 'uppercase',
                  margin: 0,
                }}>
                  <span style={{ fontWeight: 400 }}>Starts from</span> <span style={{ fontSize: isMobile ? '20px' : '26px' }}>{content.plan2Price || '$XX / MONTH'}</span>
                </p>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 400,
                  lineHeight: 1.4,
                  color: '#000',
                  margin: '6px 0 0',
                }}>
                  {content.plan2Subtitle || 'Perfect for businesses getting started with growth.'}
                </p>
              </div>

              {/* Divider */}
              <div style={{
                height: '1px',
                backgroundColor: '#000',
                margin: isMobile ? '0 0 14px' : '0 0 18px',
                opacity: 0.3,
              }} />

              {/* What do you receive */}
              <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '16px' : '20px',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: '#000',
                  margin: isMobile ? '0 0 10px' : '0 0 12px',
                }}>
                  What do you receive
                </p>
                <div style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '13px' : '16px',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: '#000',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '3px' : '4px',
                }}>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '3px' }} /> <span>Pre-built Shopify Theme <strong>(No Custom Development)</strong></span></p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '3px' }} /> <span>Standard Mobile Responsiveness <strong>(Theme Default)</strong></span></p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '3px' }} /> <span>Basic Shopify SEO Settings Only</span></p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '3px' }} /> <span>Standard Cart & Checkout</span></p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '3px' }} /> <span>No Post-Launch Support Included</span></p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}><img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '3px' }} /> <span>Theme-Based Design Only <strong>(No Custom Features)</strong></span></p>
                </div>
              </div>

              {/* White Inner Box - HOW IS THIS RIGHT FOR YOU? */}
              <div style={{
                backgroundColor: '#fff',
                border: '1px solid #000',
                borderRadius: '10px',
                padding: isMobile ? '14px' : '13px 20px 20px',
              }}>
                <p style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  color: '#000',
                  margin: isMobile ? '0 0 10px' : '0 0 12px',
                }}>
                  HOW IS THIS RIGHT FOR YOU?
                </p>
                <div style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: '#000',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '8px' : '10px',
                }}>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '2px' }} /> <span>Generates <strong>$50K+ in monthly revenue</strong></span>
                  </p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '2px' }} /> <span>Actively investing in <strong>marketing or paid ads</strong></span>
                  </p>
                  <p style={{ margin: 0, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <img src={TickMark} alt="✓" style={{ width: '14px', height: '14px', marginTop: '2px' }} /> <span>Companies looking to <strong>improve conversion and scale faster</strong></span>
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 'auto',
                paddingTop: isMobile ? '12px' : '16px',
              }}>
                <button
                  className="btn-hover"
                  onClick={() => openModal('LP3 - Plan 2 Button')}
                  style={{
                    background: 'linear-gradient(166deg, #170935 23.75%, #000 93.95%)',
                    borderRadius: '770px',
                    padding: isMobile ? '12px 20px' : '12px 18px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                  }}>
                  <span style={{
                    fontFamily: "'Gabarito', sans-serif",
                    fontSize: isMobile ? '14px' : '20px',
                    fontWeight: 600,
                    lineHeight: 1,
                    color: '#fff',
                    textTransform: 'uppercase',
                  }}>
                    {content.plan2ButtonText || 'GET STARTED'}
                  </span>
                  <div style={{
                    backgroundColor: '#ffa562',
                    borderRadius: '50%',
                    padding: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 11L11 1M11 1H3M11 1V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </EditableSection>
        </div>
      )}

      {/* Contact Form Section */}
      {shouldRenderSection('contact') && (
        <div className="scroll-reveal">
        <EditableSection
          sectionId="contact"
          label="Contact Form"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'contact'}
          isHidden={isSectionHidden('contact')}
          id="contact-section"
          style={{
            padding: isMobile ? '40px 20px 100px' : '100px 120px',
            backgroundColor: isMobile
              ? (contactColors.mobileBackgroundColor || '#EFEBE2')
              : (contactColors.backgroundColor || 'transparent'),
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
                <a
                  href={getWhatsAppUrl(content.whatsappNumber, content.whatsappDefaultMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isMobile ? '6px' : '12px',
                    marginTop: '12px',
                    textDecoration: 'none',
                    transform: isMobile ? 'translateX(-2px)' : 'none',
                  }}
                >
                  <img
                    src={VectorIcon}
                    alt="icon"
                    style={{
                      width: isMobile ? '16px' : '28px',
                      height: isMobile ? '16px' : '28px',
                      flexShrink: 0,
                      filter: 'brightness(0)',
                    }}
                  />
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
                </a>
              </div>
            </div>
          </div>
        </EditableSection>
        </div>
      )}

      {/* Sticky CTA Bar */}
      {shouldRenderSection('stickyCta') && (
        <div
          ref={stickyCtaRef}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            willChange: 'transform',
          }}
        >
        <EditableSection
          sectionId="stickyCta"
          label="Sticky CTA"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'stickyCta'}
          isHidden={isSectionHidden('stickyCta')}
          style={{
            backgroundColor: stickyCtaColors.backgroundColor || '#fff',
            borderTop: '1px solid #000',
            padding: isMobile ? '10px 16px' : '15px 80px',
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '10px' : '30px',
            maxWidth: isMobile ? '100%' : 'none',
            margin: '0 auto',
          }}>
            {/* Queue Counter */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '10px',
            }}>
              <div style={{ display: 'flex', gap: isMobile ? '2px' : '3.33px' }}>
                {content.queueCount.split('').map((digit, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#000',
                      borderRadius: isMobile ? '2px' : '3.33px',
                      width: isMobile ? '14px' : '22px',
                      height: isMobile ? '18px' : '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{
                      fontFamily: "'Gabarito', sans-serif",
                      fontSize: isMobile ? '13px' : '28px',
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
                fontSize: isMobile ? '13px' : '18px',
                fontWeight: 600,
                color: '#000',
                lineHeight: 1.5,
              }}>
                {content.queueText}
              </span>
            </div>

            {/* WhatsApp CTA Button */}
            <a
              href={getWhatsAppUrl(content.whatsappNumber, content.whatsappDefaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-hover"
              style={{
              backgroundColor: '#000',
              borderRadius: '100px',
              height: isMobile ? '42px' : '68px',
              width: 'auto',
              padding: isMobile ? '0 14px' : '0 14px 0 31px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '8px' : '20px',
              cursor: 'pointer',
              textDecoration: 'none',
            }}>
              <span style={{
                fontFamily: "'Gabarito', sans-serif",
                fontSize: isMobile ? '13px' : '22px',
                fontWeight: 600,
                color: '#fff',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {content.stickyCtaButtonText || 'GET A WEB DESIGN QUOTE'}
              </span>
              <div style={{
                backgroundColor: '#63dd77',
                borderRadius: '50%',
                width: isMobile ? '28px' : '46px',
                height: isMobile ? '28px' : '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <WhatsAppIcon />
              </div>
            </a>
          </div>
        </EditableSection>
        </div>
      )}

      {/* Spacer for sticky CTA */}
      {shouldRenderSection('stickyCta') && (
        <div style={{ height: isMobile ? '85px' : '100px' }} />
      )}

      {/* Footer */}
      {shouldRenderSection('footer') && (
        <div ref={footerRef}>
        <EditableSection
          sectionId="footer"
          label="Footer"
          isEditorMode={isEditorMode}
          isSelected={selectedSection === 'footer'}
          isHidden={isSectionHidden('footer')}
          style={{
            backgroundColor: footerColors.backgroundColor || '#101827',
            padding: isMobile ? '20px' : '30px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: isMobile ? '60px' : '80px',
          }}
        >
          {/* Copyright - Centered */}
          <p style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: isMobile ? '12px' : '16px',
            fontWeight: 400,
            color: footerColors.textColor || '#fff',
            margin: 0,
            textAlign: 'center',
          }}>
            {content.copyrightText}{' '}
            <a href={content.siteUseLink || '#'} target="_blank" rel="noopener noreferrer" style={{ color: footerColors.linkColor || '#fff', textDecoration: 'underline' }}>
              {content.siteUseText}
            </a>
          </p>
        </EditableSection>
        </div>
      )}
    </div>
  );
};

export default LandingPage3;