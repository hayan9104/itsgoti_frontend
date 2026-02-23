import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
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
        <Route path="/" element={<Landing />} />

        {/* Home Page */}
        <Route
          path="/home"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/work"
          element={
            <Layout>
              <Work />
            </Layout>
          }
        />
        <Route
          path="/case-studies"
          element={
            <Layout>
              <CaseStudies />
            </Layout>
          }
        />
        <Route
          path="/case-studies/:slug"
          element={
            <Layout blueNav={true}>
              <CaseStudyDetail />
            </Layout>
          }
        />
        <Route
          path="/approach"
          element={
            <Layout>
              <Approach />
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout darkNav={true}>
              <About />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
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
