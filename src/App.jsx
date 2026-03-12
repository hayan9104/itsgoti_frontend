import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import PageVisibilityWrapper from './components/PageVisibilityWrapper';
import { useThemeCode } from './context/ThemeCodeContext';
import { getThemeComponent } from './themes/themeRegistry';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

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
        <Route path="/" element={
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
