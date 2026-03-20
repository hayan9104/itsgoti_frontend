import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate, useSearchParams } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import PageVisibilityWrapper from './components/PageVisibilityWrapper';
import { useThemeCode } from './context/ThemeCodeContext';
import useSEO from './hooks/useSEO';

// ONLY import LandingPage3 eagerly (main page)
import LandingPage3 from './themes/default/LandingPage3';

// Lazy load EVERYTHING else
const Layout = lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const AdminLogin = lazy(() => import('./admin/Login'));
const AdminDashboard = lazy(() => import('./admin/Dashboard'));

// Lazy load all other pages
const Home = lazy(() => import('./themes/default/Home'));
const Work = lazy(() => import('./themes/default/Work'));
const CaseStudies = lazy(() => import('./themes/default/CaseStudies'));
const CaseStudyDetail = lazy(() => import('./themes/default/CaseStudyDetail'));
const Approach = lazy(() => import('./themes/default/Approach'));
const About = lazy(() => import('./themes/default/About'));
const Contact = lazy(() => import('./themes/default/Contact'));
const Landing = lazy(() => import('./themes/default/Landing'));
const LandingPage2 = lazy(() => import('./themes/default/LandingPage2'));
const FooterPreview = lazy(() => import('./themes/default/FooterPreview'));
const BookingPage = lazy(() => import('./pages/BookingPage'));

// Simple loading fallback - blank screen, no text
const PageLoader = () => (
  <div style={{height:'100vh',backgroundColor:'#fffdf8'}} />
);

// Wrapper for case study to hide navbar in preview/editor mode
const CaseStudyWrapper = () => {
  const [searchParams] = useSearchParams();
  const { slug } = useParams();
  const isPreview = searchParams.get('preview') === 'true';
  const isEditor = searchParams.get('editor') === 'true';

  // Handle editor mode (including 'preview' slug for new case studies)
  if (isPreview || isEditor || slug === 'preview') {
    // No navbar/footer in preview or editor mode
    return (
      <Suspense fallback={<PageLoader />}>
        <CaseStudyDetail />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <PageVisibilityWrapper pageName="case-study" fallbackPath="/">
        <Layout blueNav={true}><CaseStudyDetail /></Layout>
      </PageVisibilityWrapper>
    </Suspense>
  );
};

// Context for all page slugs - with defaults to avoid loading
const defaultLandingSlugs = {
  'landing': { slug: 'landing_page1', label: 'Landing Page 1' },
  'landing-page-2': { slug: 'landing_page2', label: 'Landing Page 2' },
  'landing-page-3': { slug: 'landing_page3', label: 'Landing Page 3' },
};

const defaultPageSlugs = {
  'home': { slug: 'home', label: 'Home' },
  'about': { slug: 'about', label: 'About Us' },
  'approach': { slug: 'approach', label: 'Our Approach' },
  'work': { slug: 'work', label: 'Our Work' },
  'case-studies': { slug: 'case-studies', label: 'Case Studies' },
  'contact': { slug: 'contact', label: 'Contact' },
};

const PageSlugsContext = createContext({
  landingSlugs: defaultLandingSlugs,
  pageSlugs: defaultPageSlugs,
  defaultLandingPage: 'landing-page-3',
  loaded: false,
});

export const useLandingSlugs = () => {
  const ctx = useContext(PageSlugsContext);
  return { slugs: ctx.landingSlugs, defaultLandingPage: ctx.defaultLandingPage, loaded: ctx.loaded };
};

export const usePageSlugs = () => useContext(PageSlugsContext);

// Provider component for all page slugs
function PageSlugsProvider({ children }) {
  const [landingSlugs, setLandingSlugs] = useState(defaultLandingSlugs);
  const [pageSlugs, setPageSlugs] = useState(defaultPageSlugs);
  const [defaultLandingPage, setDefaultLandingPage] = useState('landing-page-3');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSlugs = async () => {
      try {
        const response = await fetch('/api/themes/all-slugs');
        const data = await response.json();
        if (data.success && data.data) {
          setLandingSlugs(data.data.landingSlugs || defaultLandingSlugs);
          setPageSlugs(data.data.pageSlugs || defaultPageSlugs);
          setDefaultLandingPage(data.data.defaultLandingPage || 'landing-page-3');
        }
      } catch {
        // Silent fail - use defaults
      } finally {
        setLoaded(true);
      }
    };
    fetchSlugs();
  }, []);

  return (
    <PageSlugsContext.Provider value={{ landingSlugs, pageSlugs, defaultLandingPage, loaded }}>
      {children}
    </PageSlugsContext.Provider>
  );
}

// A/B Testing: Get or assign a random landing page version for the user
function getABTestVersion() {
  const AB_TEST_KEY = 'itsgoti_ab_landing_version';
  const landingPages = ['landing', 'landing-page-2', 'landing-page-3'];

  // Friendly names for GA tracking
  const landingPageNames = {
    'landing': 'Landing Page 1',
    'landing-page-2': 'Landing Page 2',
    'landing-page-3': 'Landing Page 3',
  };

  // Check if user already has a version assigned
  let version = localStorage.getItem(AB_TEST_KEY);

  if (!version || !landingPages.includes(version)) {
    // Assign a random version
    const randomIndex = Math.floor(Math.random() * landingPages.length);
    version = landingPages[randomIndex];
    localStorage.setItem(AB_TEST_KEY, version);

    // Track the assignment in GA
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'landing_page_assigned', {
        event_category: 'A/B Test',
        landing_page_version: landingPageNames[version],
      });
    }
  }

  return version;
}

// Component to render the default landing page based on theme settings
function DefaultLandingRouter() {
  const { defaultLandingPage, loaded } = useLandingSlugs();
  const [abVersion, setAbVersion] = useState(null);

  useEffect(() => {
    // Check if A/B testing is enabled (defaultLandingPage === 'ab-test')
    if (loaded && defaultLandingPage === 'ab-test') {
      const version = getABTestVersion();
      setAbVersion(version);

      // Send page view with version to GA
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_view', {
          page_title: `Landing Page - ${version}`,
          landing_page_version: version,
        });
      }
    }
  }, [defaultLandingPage, loaded]);

  // Show blank loader while waiting for settings to load
  if (!loaded) {
    return <PageLoader />;
  }

  // If A/B testing is enabled, use the random version
  const activePage = defaultLandingPage === 'ab-test' ? abVersion : defaultLandingPage;

  // Wait for AB version to be determined (only for A/B testing)
  if (defaultLandingPage === 'ab-test' && !abVersion) {
    return <PageLoader />;
  }

  // Home page
  if (activePage === 'home') {
    return (
      <Suspense fallback={<PageLoader />}>
        <PageVisibilityWrapper pageName="home" fallbackPath="/">
          <Layout blueNav={true}><Home /></Layout>
        </PageVisibilityWrapper>
      </Suspense>
    );
  }

  // LandingPage3 is loaded eagerly, others are lazy
  if (activePage === 'landing-page-3') {
    return (
      <PageVisibilityWrapper pageName="landing-page-3" fallbackPath="/home">
        <LandingPage3 />
      </PageVisibilityWrapper>
    );
  }

  // Other landing pages are lazy loaded
  return (
    <Suspense fallback={<PageLoader />}>
      <PageVisibilityWrapper pageName={activePage} fallbackPath="/home">
        {activePage === 'landing' && <Landing />}
        {activePage === 'landing-page-2' && <LandingPage2 />}
      </PageVisibilityWrapper>
    </Suspense>
  );
}

// Dynamic page router - matches any slug to the correct page
function DynamicPageRouter() {
  const { slug } = useParams();
  const { landingSlugs, pageSlugs } = usePageSlugs();

  // Check landing pages first
  for (const [pageKey, slugData] of Object.entries(landingSlugs)) {
    if (slugData.slug === slug) {
      if (pageKey === 'landing-page-3') {
        return (
          <PageVisibilityWrapper pageName="landing-page-3" fallbackPath="/home">
            <LandingPage3 />
          </PageVisibilityWrapper>
        );
      }
      return (
        <Suspense fallback={<PageLoader />}>
          <PageVisibilityWrapper pageName={pageKey} fallbackPath="/home">
            {pageKey === 'landing' && <Landing />}
            {pageKey === 'landing-page-2' && <LandingPage2 />}
          </PageVisibilityWrapper>
        </Suspense>
      );
    }
  }

  // Check main pages
  for (const [pageKey, slugData] of Object.entries(pageSlugs)) {
    if (slugData.slug === slug) {
      return (
        <Suspense fallback={<PageLoader />}>
          <PageVisibilityWrapper pageName={pageKey} fallbackPath="/">
            {pageKey === 'home' && <Layout blueNav={true}><Home /></Layout>}
            {pageKey === 'about' && <Layout darkNav={true}><About /></Layout>}
            {pageKey === 'approach' && <Layout orangeNav={true}><Approach /></Layout>}
            {pageKey === 'work' && <Layout><Work /></Layout>}
            {pageKey === 'case-studies' && <Layout><CaseStudies /></Layout>}
            {pageKey === 'contact' && <Layout><Contact /></Layout>}
          </PageVisibilityWrapper>
        </Suspense>
      );
    }
  }

  // Slug not found - redirect to home
  return <Navigate to="/" replace />;
}

function App() {
  // Apply SEO settings (title, description, favicon, social preview)
  useSEO();

  return (
    <Router>
      <PageSlugsProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes - LandingPage3 loads instantly */}
          <Route path="/" element={<DefaultLandingRouter />} />

          {/* Case study detail - must be before /:slug */}
          <Route
            path="/case-studies/:slug"
            element={<CaseStudyWrapper />}
          />

          {/* Footer Preview Route (for visual editor) */}
          <Route path="/footer-preview" element={<Suspense fallback={<PageLoader />}><FooterPreview /></Suspense>} />

          {/* Booking Page Route */}
          <Route path="/book" element={<Suspense fallback={<PageLoader />}><BookingPage /></Suspense>} />

          {/* Admin Routes - /goti/admin */}
          <Route path="/goti/admin/login" element={<Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>} />
          <Route
            path="/goti/admin/*"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              </Suspense>
            }
          />

          {/* Dynamic Page Route - matches any custom slug (landing pages + main pages) */}
          <Route path="/:slug" element={<DynamicPageRouter />} />
        </Routes>
      </PageSlugsProvider>
    </Router>
  );
}

export default App;
