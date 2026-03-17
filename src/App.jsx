import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import PageVisibilityWrapper from './components/PageVisibilityWrapper';
import { useThemeCode } from './context/ThemeCodeContext';
import { getThemeComponent } from './themes/themeRegistry';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Context for landing page slugs
const LandingSlugsContext = createContext({
  slugs: {},
  defaultLandingPage: 'landing',
  loading: true,
});

export const useLandingSlugs = () => useContext(LandingSlugsContext);

// Provider component for landing page slugs
function LandingSlugsProvider({ children }) {
  const [slugs, setSlugs] = useState({
    'landing': { slug: 'landing_page1', label: 'Landing Page 1' },
    'landing-page-2': { slug: 'landing_page2', label: 'Landing Page 2' },
    'landing-page-3': { slug: 'landing_page3', label: 'Landing Page 3' },
  });
  const [defaultLandingPage, setDefaultLandingPage] = useState('landing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlugs = async () => {
      try {
        const response = await fetch('/api/themes/landing-slugs');
        const data = await response.json();
        if (data.success && data.data) {
          setSlugs(data.data.slugs);
          setDefaultLandingPage(data.data.defaultLandingPage || 'landing');
        }
      } catch (error) {
        console.error('Error fetching landing slugs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSlugs();
  }, []);

  return (
    <LandingSlugsContext.Provider value={{ slugs, defaultLandingPage, loading }}>
      {children}
    </LandingSlugsContext.Provider>
  );
}

// Component to render the default landing page based on theme settings
function DefaultLandingRouter({ themeCode }) {
  const { defaultLandingPage, loading: loadingDefault } = useLandingSlugs();

  const Landing = getThemeComponent(themeCode, 'Landing');
  const LandingPage2 = getThemeComponent(themeCode, 'LandingPage2');
  const LandingPage3 = getThemeComponent(themeCode, 'LandingPage3');

  if (loadingDefault) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Map page name to component and visibility page name
  const pageMap = {
    'landing': { Component: Landing, pageName: 'landing' },
    'landing-page-2': { Component: LandingPage2, pageName: 'landing-page-2' },
    'landing-page-3': { Component: LandingPage3, pageName: 'landing-page-3' },
  };

  const selected = pageMap[defaultLandingPage] || pageMap['landing'];

  return (
    <PageVisibilityWrapper pageName={selected.pageName} fallbackPath="/home">
      {selected.Component && <selected.Component />}
    </PageVisibilityWrapper>
  );
}

// Dynamic landing page router - matches any slug to the correct landing page
function DynamicLandingRouter({ themeCode }) {
  const { slug } = useParams();
  const { slugs, loading } = useLandingSlugs();

  const Landing = getThemeComponent(themeCode, 'Landing');
  const LandingPage2 = getThemeComponent(themeCode, 'LandingPage2');
  const LandingPage3 = getThemeComponent(themeCode, 'LandingPage3');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Find which landing page this slug belongs to
  const pageComponentMap = {
    'landing': { Component: Landing, pageName: 'landing' },
    'landing-page-2': { Component: LandingPage2, pageName: 'landing-page-2' },
    'landing-page-3': { Component: LandingPage3, pageName: 'landing-page-3' },
  };

  // Check each landing page's slug
  for (const [pageKey, slugData] of Object.entries(slugs)) {
    if (slugData.slug === slug) {
      const pageInfo = pageComponentMap[pageKey];
      if (pageInfo && pageInfo.Component) {
        return (
          <PageVisibilityWrapper pageName={pageInfo.pageName} fallbackPath="/home">
            <pageInfo.Component />
          </PageVisibilityWrapper>
        );
      }
    }
  }

  // Slug not found - redirect to home
  return <Navigate to="/home" replace />;
}

function App() {
  const { themeCode, loading } = useThemeCode();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Resolve components from the active theme
  const Home = getThemeComponent(themeCode, 'Home');
  const Work = getThemeComponent(themeCode, 'Work');
  const CaseStudies = getThemeComponent(themeCode, 'CaseStudies');
  const CaseStudyDetail = getThemeComponent(themeCode, 'CaseStudyDetail');
  const Approach = getThemeComponent(themeCode, 'Approach');
  const About = getThemeComponent(themeCode, 'About');
  const Contact = getThemeComponent(themeCode, 'Contact');
  const Landing = getThemeComponent(themeCode, 'Landing');
  const LandingPage2 = getThemeComponent(themeCode, 'LandingPage2');
  const LandingPage3 = getThemeComponent(themeCode, 'LandingPage3');
  const FooterPreview = getThemeComponent(themeCode, 'FooterPreview');

  return (
    <Router>
      <LandingSlugsProvider>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<DefaultLandingRouter themeCode={themeCode} />} />

          {/* Dynamic Landing Page Route - matches any custom slug */}
          <Route path="/:slug" element={<DynamicLandingRouter themeCode={themeCode} />} />

          <Route
            path="/home"
            element={
              <PageVisibilityWrapper pageName="home" fallbackPath="/">
                <Layout>
                  {Home && <Home />}
                </Layout>
              </PageVisibilityWrapper>
            }
          />
          <Route
            path="/work"
            element={
              <PageVisibilityWrapper pageName="work" fallbackPath="/home">
                <Layout>
                  {Work && <Work />}
                </Layout>
              </PageVisibilityWrapper>
            }
          />
          <Route
            path="/case-studies"
            element={
              <PageVisibilityWrapper pageName="case-study" fallbackPath="/home">
                <Layout>
                  {CaseStudies && <CaseStudies />}
                </Layout>
              </PageVisibilityWrapper>
            }
          />
          <Route
            path="/case-studies/:slug"
            element={
              <PageVisibilityWrapper pageName="case-study" fallbackPath="/home">
                <Layout blueNav={true}>
                  {CaseStudyDetail && <CaseStudyDetail />}
                </Layout>
              </PageVisibilityWrapper>
            }
          />
          <Route
            path="/approach"
            element={
              <PageVisibilityWrapper pageName="approach" fallbackPath="/home">
                <Layout>
                  {Approach && <Approach />}
                </Layout>
              </PageVisibilityWrapper>
            }
          />
          <Route
            path="/about"
            element={
              <PageVisibilityWrapper pageName="about" fallbackPath="/home">
                <Layout darkNav={true}>
                  {About && <About />}
                </Layout>
              </PageVisibilityWrapper>
            }
          />
          <Route
            path="/contact"
            element={
              <PageVisibilityWrapper pageName="contact" fallbackPath="/home">
                <Layout>
                  {Contact && <Contact />}
                </Layout>
              </PageVisibilityWrapper>
            }
          />

          {/* Footer Preview Route (for visual editor) */}
          <Route path="/footer-preview" element={FooterPreview ? <FooterPreview /> : null} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </LandingSlugsProvider>
    </Router>
  );
}

export default App;
