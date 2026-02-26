import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import PageVisibilityWrapper from './components/PageVisibilityWrapper';
import {
  Home,
  Work,
  CaseStudies,
  CaseStudyDetail,
  Approach,
  About,
  Contact,
} from './pages';
import FooterPreview from './pages/FooterPreview';
import Landing from './pages/Landing';
import LandingPage2 from './pages/LandingPage2';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        {/* Landing Page - First/Default Page */}
        <Route path="/" element={
          <PageVisibilityWrapper pageName="landing" fallbackPath="/home">
            <Landing />
          </PageVisibilityWrapper>
        } />

        {/* Landing Page 2 - Shopify Design Focus */}
        <Route path="/landing_page2" element={
          <PageVisibilityWrapper pageName="landing-page-2" fallbackPath="/home">
            <LandingPage2 />
          </PageVisibilityWrapper>
        } />

        {/* Home Page */}
        <Route
          path="/home"
          element={
            <PageVisibilityWrapper pageName="home" fallbackPath="/">
              <Layout>
                <Home />
              </Layout>
            </PageVisibilityWrapper>
          }
        />
        <Route
          path="/work"
          element={
            <PageVisibilityWrapper pageName="work" fallbackPath="/home">
              <Layout>
                <Work />
              </Layout>
            </PageVisibilityWrapper>
          }
        />
        <Route
          path="/case-studies"
          element={
            <PageVisibilityWrapper pageName="case-study" fallbackPath="/home">
              <Layout>
                <CaseStudies />
              </Layout>
            </PageVisibilityWrapper>
          }
        />
        <Route
          path="/case-studies/:slug"
          element={
            <PageVisibilityWrapper pageName="case-study" fallbackPath="/home">
              <Layout blueNav={true}>
                <CaseStudyDetail />
              </Layout>
            </PageVisibilityWrapper>
          }
        />
        <Route
          path="/approach"
          element={
            <PageVisibilityWrapper pageName="approach" fallbackPath="/home">
              <Layout>
                <Approach />
              </Layout>
            </PageVisibilityWrapper>
          }
        />
        <Route
          path="/about"
          element={
            <PageVisibilityWrapper pageName="about" fallbackPath="/home">
              <Layout darkNav={true}>
                <About />
              </Layout>
            </PageVisibilityWrapper>
          }
        />
        <Route
          path="/contact"
          element={
            <PageVisibilityWrapper pageName="contact" fallbackPath="/home">
              <Layout>
                <Contact />
              </Layout>
            </PageVisibilityWrapper>
          }
        />

        {/* Footer Preview Route (for visual editor) */}
        <Route path="/footer-preview" element={<FooterPreview />} />

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
