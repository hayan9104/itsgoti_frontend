import { Routes, Route, Link, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { themesAPI } from '../services/api';
import WorksManager from './WorksManager';
import CaseStudiesManager from './CaseStudiesManager';
import ContactsManager from './ContactsManager';
import PagesManager from './PagesManager';
import AccountManager from './AccountManager';
import ThemesManager from './ThemesManager';
import CaseStudyPageEditor from './CaseStudyPageEditor';
import VisualPageEditor from './pageEditor/VisualPageEditor';

// Icon components
const ThemesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const WorksIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const CaseStudyIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ContactsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PagesIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const AccountIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BackIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// ─────────────────────────────────────────────────
// Main Dashboard - decides which layout to show
// ─────────────────────────────────────────────────
const Dashboard = () => {
  const location = useLocation();

  // Check if we're inside a theme (URL contains /themes/:id/)
  const themeMatch = location.pathname.match(/\/admin\/themes\/([a-f0-9]{24})/);
  const isInsideTheme = !!themeMatch;

  if (isInsideTheme) {
    return <ThemeAdminPanel />;
  }

  return <TopLevelAdmin />;
};

// ─────────────────────────────────────────────────
// Top Level: Themes list only (no sidebar)
// ─────────────────────────────────────────────────
const TopLevelAdmin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f1f1' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/admin" style={{ fontSize: 20, fontWeight: 700, color: '#111827', textDecoration: 'none' }}>
            Admin Panel
          </Link>
          <Link to="/" style={{ fontSize: 14, color: '#2563eb', textDecoration: 'none' }} target="_blank">
            View Site
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#4b5563' }}>Welcome, {user?.name}</span>
          <button onClick={handleLogout} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Logout
          </button>
        </div>
      </header>

      {/* Content - No sidebar, just themes */}
      <main style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<ThemesManager />} />
          <Route path="/themes" element={<ThemesManager />} />
          <Route path="/account" element={<AccountManager />} />
        </Routes>
      </main>
    </div>
  );
};

// ─────────────────────────────────────────────────
// Inside a Theme: Full admin panel with sidebar
// ─────────────────────────────────────────────────
const ThemeAdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract themeId from URL
  const themeMatch = location.pathname.match(/\/admin\/themes\/([a-f0-9]{24})/);
  const themeId = themeMatch ? themeMatch[1] : null;

  const [themeName, setThemeName] = useState('');
  const [themeIsLive, setThemeIsLive] = useState(false);

  // Fetch theme info for sidebar header
  useEffect(() => {
    if (!themeId) return;
    themesAPI.getOne(themeId).then((res) => {
      setThemeName(res.data.data.name);
      setThemeIsLive(res.data.data.isLive);
    }).catch(() => {});
  }, [themeId]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: `/admin/themes/${themeId}`, label: 'Dashboard', exact: true, icon: DashboardIcon },
    { to: `/admin/themes/${themeId}/pages`, label: 'Pages', icon: PagesIcon },
    { to: `/admin/themes/${themeId}/works`, label: 'Works', icon: WorksIcon },
    { to: `/admin/themes/${themeId}/case-studies`, label: 'Case Studies', icon: CaseStudyIcon },
    { to: `/admin/themes/${themeId}/contacts`, label: 'Contacts', icon: ContactsIcon },
  ];

  const bottomNavItems = [
    { to: `/admin/themes/${themeId}/account`, label: 'Account', icon: AccountIcon },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/admin" style={{ fontSize: 20, fontWeight: 700, color: '#111827', textDecoration: 'none' }}>
            Admin Panel
          </Link>
          <Link to="/" style={{ fontSize: 14, color: '#2563eb', textDecoration: 'none' }} target="_blank">
            View Site
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#4b5563' }}>Welcome, {user?.name}</span>
          <button onClick={handleLogout} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, backgroundColor: '#fff',
          boxShadow: '1px 0 3px rgba(0,0,0,0.05)',
          minHeight: 'calc(100vh - 65px)', padding: 16,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Back to Themes */}
          <Link
            to="/admin"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 8, marginBottom: 8,
              textDecoration: 'none', color: '#6b7280', fontSize: 13,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <BackIcon />
            Back to Themes
          </Link>

          {/* Theme Name Badge */}
          <div style={{
            padding: '12px 16px', marginBottom: 12,
            backgroundColor: '#f0fdf4', borderRadius: 8,
            border: themeIsLive ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <ThemesIcon />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {themeName || 'Loading...'}
              </span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: themeIsLive ? '#059669' : '#6b7280',
            }}>
              {themeIsLive ? 'Live Theme' : 'Draft Theme'}
            </span>
          </div>

          {/* Main Navigation */}
          <nav style={{ flex: 1 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderRadius: 8, marginBottom: 4,
                    textDecoration: 'none',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#374151',
                    fontWeight: isActive ? 500 : 400,
                    transition: 'background-color 0.15s ease',
                  })}
                >
                  <Icon />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom Navigation */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 16 }}>
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderRadius: 8, marginBottom: 4,
                    textDecoration: 'none',
                    backgroundColor: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#2563eb' : '#374151',
                    fontWeight: isActive ? 500 : 400,
                    transition: 'background-color 0.15s ease',
                  })}
                >
                  <Icon />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '32px 40px' }}>
          <Routes>
            <Route path="/themes/:themeId" element={<ThemeDashboardHome />} />
            <Route path="/themes/:themeId/pages/:pageName/edit" element={<VisualPageEditor />} />
            <Route path="/themes/:themeId/pages" element={<ThemePagesWrapper />} />
            <Route path="/themes/:themeId/works/*" element={<ThemedWorksManager />} />
            <Route path="/themes/:themeId/case-studies/*" element={<ThemedCaseStudiesManager />} />
            <Route path="/themes/:themeId/contacts/*" element={<ContactsManager />} />
            <Route path="/themes/:themeId/account" element={<AccountManager />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// Link Icon for URL Settings
const LinkIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

// ─────────────────────────────────────────────────
// Theme Dashboard Home (stats for this theme)
// ─────────────────────────────────────────────────
const ThemeDashboardHome = () => {
  const { themeId } = useParams();
  const [theme, setTheme] = useState(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [slugs, setSlugs] = useState({
    'landing': { slug: 'landing_page1', label: 'Landing Page 1' },
    'landing-page-2': { slug: 'landing_page2', label: 'Landing Page 2' },
    'landing-page-3': { slug: 'landing_page3', label: 'Landing Page 3' },
  });
  const [savingSlugs, setSavingSlugs] = useState(false);
  const [slugError, setSlugError] = useState('');

  const fetchTheme = () => {
    themesAPI.getOne(themeId).then((res) => {
      const data = res.data.data;
      setTheme(data);
      if (data.landingPageSlugs) {
        setSlugs(data.landingPageSlugs);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    fetchTheme();
  }, [themeId]);

  const pageCount = theme?.pages ? Object.keys(theme.pages).length : 0;

  const validateSlug = (slug) => {
    // Only allow lowercase letters, numbers, hyphens, underscores
    return /^[a-z0-9_-]+$/.test(slug) && slug.length > 0 && slug.length <= 50;
  };

  const handleSlugChange = (pageKey, field, value) => {
    setSlugs(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        [field]: value,
      },
    }));
    setSlugError('');
  };

  const saveSlugs = async () => {
    // Validate all slugs
    const slugValues = Object.values(slugs).map(s => s.slug);

    // Check for empty slugs
    for (const [key, data] of Object.entries(slugs)) {
      if (!data.slug || !data.slug.trim()) {
        setSlugError(`URL path for "${data.label || key}" cannot be empty`);
        return;
      }
      if (!validateSlug(data.slug)) {
        setSlugError(`Invalid URL path "${data.slug}". Use only lowercase letters, numbers, hyphens, and underscores.`);
        return;
      }
      if (!data.label || !data.label.trim()) {
        setSlugError(`Display name for URL "/${data.slug}" cannot be empty`);
        return;
      }
    }

    // Check for duplicate slugs
    const uniqueSlugs = new Set(slugValues);
    if (uniqueSlugs.size !== slugValues.length) {
      setSlugError('Each landing page must have a unique URL path');
      return;
    }

    setSavingSlugs(true);
    try {
      await themesAPI.update(themeId, { landingPageSlugs: slugs });
      setShowUrlModal(false);
      fetchTheme();
    } catch (error) {
      setSlugError('Failed to save URL settings. Please try again.');
    } finally {
      setSavingSlugs(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 24 }}>
        Theme Dashboard
      </h1>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 24 }}>
          <h3 style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>Pages</h3>
          <p style={{ fontSize: 30, fontWeight: 700, color: '#111827' }}>{pageCount}</p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 24 }}>
          <h3 style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>Status</h3>
          <p style={{ fontSize: 18, fontWeight: 600, color: theme?.isLive ? '#059669' : '#6b7280' }}>
            {theme?.isLive ? 'Live' : 'Draft'}
          </p>
        </div>
        <div style={{ backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 24 }}>
          <h3 style={{ color: '#6b7280', fontSize: 14, marginBottom: 8 }}>Last Updated</h3>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
            {theme?.updatedAt ? new Date(theme.updatedAt).toLocaleString() : '-'}
          </p>
        </div>
      </div>

      {/* URL Settings Card */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: 24,
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: '#eff6ff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#2563eb',
              }}>
                <LinkIcon />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                URL Settings
              </h2>
            </div>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 16, marginLeft: 50 }}>
              Customize the URL paths for your landing pages
            </p>

            {/* Current URLs Preview */}
            <div style={{ marginLeft: 50, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(slugs).map(([key, data]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#6b7280', width: 140 }}>{data.label}:</span>
                  <code style={{
                    fontSize: 13, backgroundColor: '#f3f4f6', padding: '2px 8px',
                    borderRadius: 4, color: '#111827', fontFamily: 'monospace',
                  }}>
                    /{data.slug}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowUrlModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', backgroundColor: '#2563eb', color: '#fff',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 500, transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit URLs
          </button>
        </div>
      </div>

      {/* URL Settings Modal */}
      {showUrlModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
          padding: 20,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxWidth: 560, width: '100%', padding: 0,
            maxHeight: 'calc(100vh - 40px)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  backgroundColor: '#eff6ff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#2563eb',
                }}>
                  <LinkIcon />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 }}>
                    Landing Page URLs
                  </h3>
                  <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                    Customize URL paths and display names
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowUrlModal(false); setSlugError(''); }}
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  backgroundColor: '#f3f4f6', border: 'none',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
              {/* Error Message */}
              {slugError && (
                <div style={{
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 8, padding: '12px 16px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <svg width="18" height="18" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ fontSize: 14, color: '#dc2626' }}>{slugError}</span>
                </div>
              )}

              {/* URL Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {Object.entries(slugs).map(([pageKey, data], index) => (
                  <div key={pageKey} style={{
                    padding: 16, backgroundColor: '#f9fafb',
                    borderRadius: 10, border: '1px solid #e5e7eb',
                  }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: '#6b7280',
                      marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      Landing Page {index + 1}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Display Name */}
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={data.label}
                          onChange={(e) => handleSlugChange(pageKey, 'label', e.target.value)}
                          placeholder="e.g., Shopify Landing"
                          style={{
                            width: '100%', padding: '10px 12px',
                            fontSize: 14, border: '1px solid #d1d5db',
                            borderRadius: 6, backgroundColor: '#fff',
                            boxSizing: 'border-box',
                          }}
                        />
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, margin: '4px 0 0 0' }}>
                          Shown in dropdown menus and admin panel
                        </p>
                      </div>

                      {/* URL Path */}
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                          URL Path
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            padding: '10px 12px', backgroundColor: '#e5e7eb',
                            border: '1px solid #d1d5db', borderRight: 'none',
                            borderRadius: '6px 0 0 6px', fontSize: 14, color: '#6b7280',
                          }}>
                            /
                          </span>
                          <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => handleSlugChange(pageKey, 'slug', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            placeholder="e.g., shopify-pro"
                            style={{
                              flex: 1, padding: '10px 12px',
                              fontSize: 14, border: '1px solid #d1d5db',
                              borderRadius: '0 6px 6px 0', backgroundColor: '#fff',
                              fontFamily: 'monospace',
                            }}
                          />
                        </div>
                        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, margin: '4px 0 0 0' }}>
                          Only lowercase letters, numbers, hyphens, and underscores
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'flex-end', gap: 12,
              backgroundColor: '#f9fafb',
              flexShrink: 0,
            }}>
              <button
                onClick={() => { setShowUrlModal(false); setSlugError(''); }}
                style={{
                  padding: '10px 20px', backgroundColor: '#fff',
                  color: '#374151', borderRadius: 8,
                  border: '1px solid #d1d5db', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveSlugs}
                disabled={savingSlugs}
                style={{
                  padding: '10px 24px',
                  backgroundColor: savingSlugs ? '#9ca3af' : '#2563eb',
                  color: '#fff', borderRadius: 8, border: 'none',
                  cursor: savingSlugs ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {savingSlugs && (
                  <div style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                )}
                {savingSlugs ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─────────────────────────────────────────────────
// Themed Works/CaseStudies wrappers (pass basePath)
// ─────────────────────────────────────────────────
const ThemedWorksManager = () => {
  const { themeId } = useParams();
  return <WorksManager basePath={`/admin/themes/${themeId}/works`} />;
};

const ThemedCaseStudiesManager = () => {
  const { themeId } = useParams();
  return <CaseStudiesManager basePath={`/admin/themes/${themeId}/case-studies`} />;
};

// ─────────────────────────────────────────────────
// Theme Pages Wrapper (with toggle + redirect modal)
// ─────────────────────────────────────────────────
const ThemePagesWrapper = () => {
  const { themeId } = useParams();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingPage, setTogglingPage] = useState(null);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [pageToHide, setPageToHide] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [defaultLandingPage, setDefaultLandingPage] = useState('landing');
  const [savingDefault, setSavingDefault] = useState(false);
  const [landingPageSlugs, setLandingPageSlugs] = useState({
    'landing': { slug: 'landing_page1', label: 'Landing Page 1' },
    'landing-page-2': { slug: 'landing_page2', label: 'Landing Page 2' },
    'landing-page-3': { slug: 'landing_page3', label: 'Landing Page 3' },
  });

  // Generate default pages list with dynamic labels for landing pages
  const getDefaultPages = () => [
    { name: 'landing', label: landingPageSlugs['landing']?.label || 'Landing Page 1' },
    { name: 'landing-page-2', label: landingPageSlugs['landing-page-2']?.label || 'Landing Page 2' },
    { name: 'landing-page-3', label: landingPageSlugs['landing-page-3']?.label || 'Landing Page 3' },
    { name: 'home', label: 'Home Page' },
    { name: 'about', label: 'About Us' },
    { name: 'approach', label: 'Our Approach' },
    { name: 'work', label: 'Our Work' },
    { name: 'case-study', label: 'Case Study' },
    { name: 'contact', label: 'Contact' },
    { name: 'footer', label: 'Footer' },
  ];

  const defaultPages = getDefaultPages();

  // Pages that use the visual editor
  const visualEditorPages = ['about', 'work', 'contact', 'approach', 'footer', 'landing', 'home', 'landing-page-2', 'landing-page-3'];
  // Pages that use modal editors
  const modalEditorPages = ['case-study'];
  // All editable pages
  const editablePages = [...visualEditorPages, ...modalEditorPages];

  const fetchTheme = async () => {
    try {
      const res = await themesAPI.getOne(themeId);
      const themeData = res.data.data;
      setTheme(themeData);
      setDefaultLandingPage(themeData.defaultLandingPage || 'landing');
      if (themeData.landingPageSlugs) {
        setLandingPageSlugs(themeData.landingPageSlugs);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTheme(); }, [themeId]);

  const handleDefaultLandingChange = async (newDefault) => {
    if (savingDefault) return;
    setSavingDefault(true);
    try {
      await themesAPI.update(themeId, { defaultLandingPage: newDefault });
      setDefaultLandingPage(newDefault);
    } catch (error) {
      console.error('Error updating default landing page:', error);
    } finally {
      setSavingDefault(false);
    }
  };

  const getPageData = (pageName) => theme?.pages?.[pageName];

  const togglePageVisibility = async (pageName, currentPublished) => {
    const isHiding = currentPublished !== false;
    if (isHiding) {
      setPageToHide(pageName);
      setShowRedirectModal(true);
      return;
    }
    // Un-hiding
    setTogglingPage(pageName);
    try {
      await themesAPI.updatePage(themeId, pageName, { published: true, redirectTo: null });
      await fetchTheme();
    } catch (error) {
      console.error('Error toggling page visibility:', error);
    } finally {
      setTogglingPage(null);
    }
  };

  const handleHidePageWithRedirect = async (redirectTo) => {
    if (!pageToHide) return;
    setTogglingPage(pageToHide);
    setShowRedirectModal(false);
    try {
      await themesAPI.updatePage(themeId, pageToHide, { published: false, redirectTo });
      await fetchTheme();
    } catch (error) {
      console.error('Error hiding page:', error);
    } finally {
      setTogglingPage(null);
      setPageToHide(null);
    }
  };

  const cancelHidePage = () => {
    setShowRedirectModal(false);
    setPageToHide(null);
  };

  const getAvailableRedirectPages = () => {
    return defaultPages.filter(p => {
      if (p.name === pageToHide) return false;
      if (p.name === 'footer') return false;
      const pd = getPageData(p.name);
      if (pd?.published === false) return false;
      return true;
    });
  };

  // Landing page options for the dropdown (using custom labels)
  const landingPageOptions = [
    { value: 'landing', label: landingPageSlugs['landing']?.label || 'Landing Page 1' },
    { value: 'landing-page-2', label: landingPageSlugs['landing-page-2']?.label || 'Landing Page 2' },
    { value: 'landing-page-3', label: landingPageSlugs['landing-page-3']?.label || 'Landing Page 3' },
  ];

  if (loading) return <div style={{ color: '#6b7280' }}>Loading...</div>;
  if (!theme) return <div style={{ color: '#dc2626' }}>Theme not found</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Pages</h1>

        {/* Default Landing Page Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
            Default First Page:
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={defaultLandingPage}
              onChange={(e) => handleDefaultLandingChange(e.target.value)}
              disabled={savingDefault}
              style={{
                padding: '8px 36px 8px 12px',
                fontSize: 14,
                fontWeight: 500,
                color: '#111827',
                backgroundColor: savingDefault ? '#f3f4f6' : '#fff',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                cursor: savingDefault ? 'not-allowed' : 'pointer',
                appearance: 'none',
                minWidth: 220,
              }}
            >
              {landingPageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {/* Dropdown arrow */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
            {/* Saving indicator */}
            {savingDefault && (
              <div style={{
                position: 'absolute',
                right: 36,
                top: '50%',
                transform: 'translateY(-50%)',
              }}>
                <div style={{
                  width: 14,
                  height: 14,
                  border: '2px solid #d1d5db',
                  borderTopColor: '#2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {defaultPages.map((page) => {
          const pageData = getPageData(page.name);
          const isEditable = editablePages.includes(page.name);
          const isPublished = pageData?.published !== false;
          const isToggling = togglingPage === page.name;

          return (
            <div
              key={page.name}
              style={{
                backgroundColor: isPublished ? '#fff' : '#f9fafb',
                borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 24,
                border: !isPublished ? '2px solid #ef4444' : isEditable ? '2px solid #2563eb' : '1px solid transparent',
                opacity: isPublished ? 1 : 0.7,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Header with Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{
                    fontSize: 18, fontWeight: 600,
                    color: isPublished ? '#111827' : '#6b7280',
                    textDecoration: isPublished ? 'none' : 'line-through',
                  }}>
                    {page.label}
                  </h3>
                  {isEditable && isPublished && (
                    <span style={{ fontSize: 10, backgroundColor: '#2563eb', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                      Editable
                    </span>
                  )}
                  {!isPublished && (
                    <span style={{ fontSize: 10, backgroundColor: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 500 }}>
                      Hidden
                    </span>
                  )}
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => togglePageVisibility(page.name, pageData?.published)}
                  disabled={isToggling}
                  title={isPublished ? 'Click to hide this page' : 'Click to show this page'}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    backgroundColor: isToggling ? '#d1d5db' : isPublished ? '#22c55e' : '#e5e7eb',
                    border: 'none', cursor: isToggling ? 'wait' : 'pointer',
                    position: 'relative', transition: 'background-color 0.2s ease', flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', backgroundColor: '#fff',
                    position: 'absolute', top: 3, left: isPublished ? 23 : 3,
                    transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isToggling && (
                      <div style={{
                        width: 10, height: 10, border: '2px solid #d1d5db',
                        borderTopColor: '#2563eb', borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                    )}
                  </div>
                </button>
              </div>

              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                {pageData ? `Last updated: ${new Date(theme.updatedAt).toLocaleDateString()}` : 'Not configured yet'}
              </p>

              {/* Redirect info for hidden pages */}
              {!isPublished && pageData?.redirectTo && (
                <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Redirects to: {pageData.redirectTo}
                </p>
              )}

              <button
                onClick={() => {
                  if (visualEditorPages.includes(page.name)) {
                    navigate(`/admin/themes/${themeId}/pages/${page.name}/edit`);
                  } else if (modalEditorPages.includes(page.name)) {
                    setSelectedPage(page);
                  }
                }}
                style={{
                  color: isEditable ? '#2563eb' : '#9ca3af',
                  background: 'none', border: 'none',
                  cursor: isEditable ? 'pointer' : 'default',
                  fontSize: 14, padding: 0, fontWeight: isEditable ? 500 : 400,
                }}
                disabled={!isEditable}
              >
                {isEditable ? 'Edit Content' : 'Coming Soon'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Spinner animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Redirect Selection Modal */}
      {showRedirectModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 12,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxWidth: 480, width: '100%', padding: 24, margin: 16,
          }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                Hide "{defaultPages.find(p => p.name === pageToHide)?.label}" Page
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
                Select which page visitors should be redirected to when they try to access this hidden page:
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, maxHeight: 300, overflowY: 'auto' }}>
              {getAvailableRedirectPages().map((page) => {
                // Use custom slugs for landing pages
                const routePath = page.name === 'landing' ? `/${landingPageSlugs['landing']?.slug || 'landing_page1'}`
                  : page.name === 'landing-page-2' ? `/${landingPageSlugs['landing-page-2']?.slug || 'landing_page2'}`
                  : page.name === 'landing-page-3' ? `/${landingPageSlugs['landing-page-3']?.slug || 'landing_page3'}`
                  : page.name === 'case-study' ? '/case-studies'
                  : `/${page.name}`;
                return (
                  <button
                    key={page.name}
                    onClick={() => handleHidePageWithRedirect(routePath)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px', backgroundColor: '#f9fafb',
                      border: '1px solid #e5e7eb', borderRadius: 8,
                      cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f9ff'; e.currentTarget.style.borderColor = '#2563eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
                  >
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{page.label}</p>
                      <p style={{ fontSize: 12, color: '#6b7280' }}>Redirect to: {routePath}</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelHidePage}
                style={{
                  padding: '8px 16px', backgroundColor: '#e5e7eb', color: '#374151',
                  borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Study Page Editor Modal */}
      {selectedPage && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 8,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            maxWidth: 1000, width: '100%', maxHeight: '90vh', overflowY: 'auto', margin: 16,
          }}>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>
                  Edit {selectedPage.label}
                </h2>
                <button
                  onClick={() => setSelectedPage(null)}
                  style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedPage.name === 'case-study' && (
                <CaseStudyPageEditor
                  onClose={() => { setSelectedPage(null); fetchTheme(); }}
                  onSave={fetchTheme}
                  caseStudiesPath={`/admin/themes/${themeId}/case-studies`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
