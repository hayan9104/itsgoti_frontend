import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import PageVisibilityWrapper from './components/PageVisibilityWrapper';
import { useThemeCode } from './context/ThemeCodeContext';
import { getThemeComponent } from './themes/themeRegistry';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Component to render the default landing page based on theme settings
function DefaultLandingRouter({ themeCode }) {
  const [defaultPage, setDefaultPage] = useState(null);
  const [loadingDefault, setLoadingDefault] = useState(true);

  const Landing = getThemeComponent(themeCode, 'Landing');
  const LandingPage2 = getThemeComponent(themeCode, 'LandingPage2');
  const LandingPage3 = getThemeComponent(themeCode, 'LandingPage3');

  useEffect(() => {
    const fetchDefaultLanding = async () => {
      try {
        const response = await fetch('/api/themes/default-landing');
        const data = await response.json();
        setDefaultPage(data.data?.defaultLandingPage || 'landing');
      } catch (error) {
        console.error('Error fetching default landing page:', error);
        setDefaultPage('landing');
      } finally {
        setLoadingDefault(false);
      }
    };

    fetchDefaultLanding();
  }, []);

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

  const selected = pageMap[defaultPage] || pageMap['landing'];

  return (
    <PageVisibilityWrapper pageName={selected.pageName} fallbackPath="/home">
      {selected.Component && <selected.Component />}
    </PageVisibilityWrapper>
  );
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
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<DefaultLandingRouter themeCode={themeCode} />} />

        <Route path="/landing_page1" element={
          <PageVisibilityWrapper pageName="landing" fallbackPath="/home">
            {Landing && <Landing />}
          </PageVisibilityWrapper>
        } />

        <Route path="/landing_page2" element={
          <PageVisibilityWrapper pageName="landing-page-2" fallbackPath="/home">
            {LandingPage2 && <LandingPage2 />}
          </PageVisibilityWrapper>
        } />

        <Route path="/landing_page3" element={
          <PageVisibilityWrapper pageName="landing-page-3" fallbackPath="/home">
            {LandingPage3 && <LandingPage3 />}
          </PageVisibilityWrapper>
        } />

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
    </Router>
  );
}

export default App;
