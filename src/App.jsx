import { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
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

// Simple loading fallback
const PageLoader = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',backgroundColor:'#fffdf8'}}>
    <div style={{fontSize:'16px',color:'#666'}}>Loading...</div>
  </div>
);

// Context for landing page slugs - with defaults to avoid loading
const defaultSlugs = {
  'landing': { slug: 'landing_page1', label: 'Landing Page 1' },
  'landing-page-2': { slug: 'landing_page2', label: 'Landing Page 2' },
  'landing-page-3': { slug: 'landing_page3', label: 'Landing Page 3' },
};

const LandingSlugsContext = createContext({
  slugs: defaultSlugs,
  defaultLandingPage: 'landing-page-3',
  loaded: false,
});

export const useLandingSlugs = () => useContext(LandingSlugsContext);

// Provider component for landing page slugs
function LandingSlugsProvider({ children }) {
  const [slugs, setSlugs] = useState(defaultSlugs);
  const [defaultLandingPage, setDefaultLandingPage] = useState('landing-page-3');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchSlugs = async () => {
      try {
        const response = await fetch('/api/themes/landing-slugs');
        const data = await response.json();
        if (data.success && data.data) {
          setSlugs(data.data.slugs);
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
    <LandingSlugsContext.Provider value={{ slugs, defaultLandingPage, loaded }}>
      {children}
    </LandingSlugsContext.Provider>
  );
}

// Component to render the default landing page based on theme settings
function DefaultLandingRouter() {
  const { defaultLandingPage } = useLandingSlugs();

  // LandingPage3 is loaded eagerly, others are lazy
  if (defaultLandingPage === 'landing-page-3') {
    return (
      <PageVisibilityWrapper pageName="landing-page-3" fallbackPath="/home">
        <LandingPage3 />
      </PageVisibilityWrapper>
    );
  }

  // Other landing pages are lazy loaded
  return (
    <Suspense fallback={<PageLoader />}>
      <PageVisibilityWrapper pageName={defaultLandingPage} fallbackPath="/home">
        {defaultLandingPage === 'landing' && <Landing />}
        {defaultLandingPage === 'landing-page-2' && <LandingPage2 />}
      </PageVisibilityWrapper>
    </Suspense>
  );
}

// Dynamic landing page router - matches any slug to the correct landing page
function DynamicLandingRouter() {
  const { slug } = useParams();
  const { slugs, loaded } = useLandingSlugs();

  // Wait for slugs to load before matching
  if (!loaded) {
    return <PageLoader />;
  }

  // Find which landing page this slug belongs to
  for (const [pageKey, slugData] of Object.entries(slugs)) {
    if (slugData.slug === slug) {
      if (pageKey === 'landing-page-3') {
        return (
          <PageVisibilityWrapper pageName="landing-page-3" fallbackPath="/home">
            <LandingPage3 />
          </PageVisibilityWrapper>
        );
      }
      // Other landing pages are lazy loaded
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

  // Slug not found - redirect to home
  return <Navigate to="/home" replace />;
}

function App() {
  // Apply SEO settings (title, description, favicon, social preview)
  useSEO();

  return (
    <Router>
      <LandingSlugsProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes - LandingPage3 loads instantly */}
          <Route path="/" element={<DefaultLandingRouter />} />

          {/* Dynamic Landing Page Route - matches any custom slug */}
          <Route path="/:slug" element={<DynamicLandingRouter />} />

          <Route
            path="/home"
            element={
              <Suspense fallback={<PageLoader />}>
                <PageVisibilityWrapper pageName="home" fallbackPath="/">
                  <Layout><Home /></Layout>
                </PageVisibilityWrapper>
              </Suspense>
            }
          />
          <Route
            path="/work"
            element={
              <Suspense fallback={<PageLoader />}>
                <PageVisibilityWrapper pageName="work" fallbackPath="/home">
                  <Layout><Work /></Layout>
                </PageVisibilityWrapper>
              </Suspense>
            }
          />
          <Route
            path="/case-studies"
            element={
              <Suspense fallback={<PageLoader />}>
                <PageVisibilityWrapper pageName="case-study" fallbackPath="/home">
                  <Layout><CaseStudies /></Layout>
                </PageVisibilityWrapper>
              </Suspense>
            }
          />
          <Route
            path="/case-studies/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <PageVisibilityWrapper pageName="case-study" fallbackPath="/home">
                  <Layout blueNav={true}><CaseStudyDetail /></Layout>
                </PageVisibilityWrapper>
              </Suspense>
            }
          />
          <Route
            path="/approach"
            element={
              <Suspense fallback={<PageLoader />}>
                <PageVisibilityWrapper pageName="approach" fallbackPath="/home">
                  <Layout><Approach /></Layout>
                </PageVisibilityWrapper>
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<PageLoader />}>
                <PageVisibilityWrapper pageName="about" fallbackPath="/home">
                  <Layout darkNav={true}><About /></Layout>
                </PageVisibilityWrapper>
              </Suspense>
            }
          />
          <Route
            path="/contact"
            element={
              <Suspense fallback={<PageLoader />}>
                <PageVisibilityWrapper pageName="contact" fallbackPath="/home">
                  <Layout><Contact /></Layout>
                </PageVisibilityWrapper>
              </Suspense>
            }
          />

          {/* Footer Preview Route (for visual editor) */}
          <Route path="/footer-preview" element={<Suspense fallback={<PageLoader />}><FooterPreview /></Suspense>} />

          {/* Admin Routes - Lazy loaded */}
          <Route path="/admin/login" element={<Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>}><AdminLogin /></Suspense>} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>}>
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              </Suspense>
            }
          />
        </Routes>
      </LandingSlugsProvider>
    </Router>
  );
}

export default App;
